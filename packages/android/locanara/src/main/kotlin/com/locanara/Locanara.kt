package com.locanara

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import android.util.Log
import com.locanara.mlkit.MLKitClients
import com.locanara.mlkit.MLKitPromptClient
import com.locanara.mlkit.PromptApiStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.Locale
import java.util.UUID

/**
 * Locanara SDK for Android (Community Edition)
 *
 * Provides a unified interface for on-device AI capabilities
 * built on top of Gemini Nano and Google ML Kit GenAI.
 */
class Locanara private constructor(
    private val context: Context
) : QueryResolverAndroid, MutationResolverAndroid, SubscriptionResolver {

    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    private var deviceCapability: DeviceCapability? = null
    private var geminiNanoInfo: GeminiNanoInfoAndroid? = null
    private val contexts = mutableMapOf<String, ExecutionContext>()
    private val executionHistory = mutableMapOf<String, MutableList<ExecutionResult>>()

    // ML Kit GenAI clients for on-device AI features (Summarize, Proofread, Rewrite, DescribeImage)
    private val mlKitClients: MLKitClients by lazy { MLKitClients(context) }

    // ML Kit Prompt API client for flexible text generation (Chat, Classify, Extract, Translate)
    private val promptClient: MLKitPromptClient by lazy { MLKitPromptClient(context) }

    // Prompt API availability status (checked during initialization)
    private var promptApiStatus: PromptApiStatus = PromptApiStatus.NotAvailable("Not yet initialized")

    // Event flows for subscriptions
    private val _executionStateFlow = MutableSharedFlow<ExecutionResult>()
    private val _capabilityChangedFlow = MutableSharedFlow<DeviceCapability>()
    private val _eventFlow = MutableSharedFlow<LocanaraEventPayload>()

    // ============================================
    // QueryResolver Implementation
    // ============================================

    override suspend fun getDeviceCapability(): DeviceCapability {
        if (!_isInitialized.value) {
            throw LocanaraException.SdkNotInitialized
        }
        return deviceCapability ?: throw LocanaraException.CapabilityCheckFailed
    }

    override suspend fun isFeatureAvailable(feature: FeatureType): Boolean {
        return deviceCapability?.availableFeatures?.contains(feature) ?: false
    }

    override suspend fun getContext(contextId: String): ExecutionContext? {
        return contexts[contextId]
    }

    override suspend fun getExecutionResult(executionId: String): ExecutionResult? {
        return executionHistory.values.flatten().find { it.id == executionId }
    }

    override suspend fun getExecutionHistory(contextId: String, limit: Int?): List<ExecutionResult> {
        val history = executionHistory[contextId] ?: emptyList()
        return if (limit != null) history.takeLast(limit) else history
    }

    // ============================================
    // QueryResolverAndroid Implementation
    // ============================================

    override suspend fun getDeviceInfoAndroid(): DeviceInfoAndroid = withContext(Dispatchers.Default) {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memInfo)

        // Check Prompt API status if not yet checked
        if (promptApiStatus is PromptApiStatus.NotAvailable &&
            (promptApiStatus as PromptApiStatus.NotAvailable).reason == "Not yet initialized") {
            Log.w(TAG, "Prompt API status not yet checked, checking now...")
            promptApiStatus = promptClient.checkStatus()
            Log.w(TAG, "Prompt API status: $promptApiStatus")
        }

        // supportsGeminiNano is true if Prompt API is Available OR Downloadable
        val supportsGeminiNano = when (promptApiStatus) {
            is PromptApiStatus.Available -> true
            is PromptApiStatus.Downloadable -> true
            is PromptApiStatus.Downloading -> true
            is PromptApiStatus.NotAvailable -> false
        }

        DeviceInfoAndroid(
            manufacturer = Build.MANUFACTURER,
            model = Build.MODEL,
            apiLevel = Build.VERSION.SDK_INT,
            androidVersion = Build.VERSION.RELEASE,
            supportsGeminiNano = supportsGeminiNano,
            systemLanguages = listOf(Locale.getDefault().language),
            gpuInfo = null,
            totalRAMMB = (memInfo.totalMem / (1024 * 1024)).toInt()
        )
    }

    override suspend fun getGeminiNanoStatus(): GeminiNanoInfoAndroid {
        return geminiNanoInfo ?: GeminiNanoInfoAndroid(
            version = "unknown",
            variant = null,
            supportedLanguages = emptyList(),
            capabilities = emptyList(),
            isDownloaded = false,
            downloadSizeMB = null,
            isReady = false
        )
    }

    override suspend fun meetsMinimumRequirements(): Boolean = withContext(Dispatchers.Default) {
        val deviceInfo = getDeviceInfoAndroid()
        // Minimum requirements for ML Kit: Android 8+ (API 26), 4GB RAM
        // AICore requires Android 14+ (API 34) and Pixel 8/9/10 with EAP setup
        deviceInfo.apiLevel >= 26 && deviceInfo.totalRAMMB >= 4 * 1024
    }

    // ============================================
    // MutationResolver Implementation
    // ============================================

    override suspend fun initializeSDK(platform: Platform): VoidResult = withContext(Dispatchers.Default) {
        if (_isInitialized.value) {
            return@withContext VoidResult(success = true)
        }

        // Check Prompt API availability (this may take a moment on first call)
        Log.w(TAG, "=== Starting Prompt API availability check ===")
        promptApiStatus = promptClient.checkStatus()
        Log.w(TAG, "=== Prompt API check completed: $promptApiStatus ===")
        when (val status = promptApiStatus) {
            is PromptApiStatus.Available -> Log.w(TAG, "Prompt API is available")
            is PromptApiStatus.Downloadable -> Log.w(TAG, "Prompt API model is downloadable")
            is PromptApiStatus.Downloading -> Log.w(TAG, "Prompt API model is downloading")
            is PromptApiStatus.NotAvailable -> Log.w(TAG, "Prompt API not available: ${status.reason}")
        }

        deviceCapability = checkDeviceCapabilities()
        _isInitialized.value = true

        VoidResult(success = true)
    }

    override suspend fun createContext(preferences: ContextPreferencesInput?): ExecutionContext {
        val ctx = ExecutionContext(
            id = UUID.randomUUID().toString(),
            recentActions = emptyList(),
            appState = null,
            preferences = preferences?.let {
                ContextPreferences(
                    processingPreference = it.processingPreference ?: ProcessingPreference.AUTO,
                    privacyLevel = it.privacyLevel ?: PrivacyLevel.BALANCED,
                    maxProcessingTimeMs = it.maxProcessingTimeMs,
                    enableCaching = it.enableCaching ?: true
                )
            },
            lastUpdated = System.currentTimeMillis().toDouble()
        )
        contexts[ctx.id] = ctx
        executionHistory[ctx.id] = mutableListOf()
        return ctx
    }

    override suspend fun updateContext(input: UpdateContextInput): ExecutionContext {
        val existing = contexts[input.contextId]
            ?: throw LocanaraException.ContextNotFound(input.contextId)

        val updated = existing.copy(
            recentActions = (existing.recentActions ?: emptyList()) + (input.addActions ?: emptyList()),
            appState = input.appState ?: existing.appState,
            preferences = input.preferences?.let {
                ContextPreferences(
                    processingPreference = it.processingPreference ?: existing.preferences?.processingPreference ?: ProcessingPreference.AUTO,
                    privacyLevel = it.privacyLevel ?: existing.preferences?.privacyLevel ?: PrivacyLevel.BALANCED,
                    maxProcessingTimeMs = it.maxProcessingTimeMs ?: existing.preferences?.maxProcessingTimeMs,
                    enableCaching = it.enableCaching ?: existing.preferences?.enableCaching ?: true
                )
            } ?: existing.preferences,
            lastUpdated = System.currentTimeMillis().toDouble()
        )
        contexts[input.contextId] = updated
        return updated
    }

    override suspend fun executeFeature(input: ExecuteFeatureInput): ExecutionResult = withContext(Dispatchers.Default) {
        val executionId = UUID.randomUUID().toString()
        val startTime = System.currentTimeMillis()

        if (!isFeatureAvailable(input.feature)) {
            throw LocanaraException.FeatureNotAvailable(input.feature)
        }

        try {
            // Execute feature using ML Kit GenAI
            val featureResult = executeFeatureWithMLKit(input)

            val result = ExecutionResult(
                id = executionId,
                feature = input.feature,
                state = ExecutionState.COMPLETED,
                result = featureResult,
                processedOn = ProcessingLocation.ON_DEVICE,
                processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                error = null,
                startedAt = startTime.toDouble(),
                completedAt = System.currentTimeMillis().toDouble()
            )

            input.contextId?.let { ctxId ->
                executionHistory[ctxId]?.add(result)
            }

            _executionStateFlow.emit(result)
            result
        } catch (e: Exception) {
            val result = ExecutionResult(
                id = executionId,
                feature = input.feature,
                state = ExecutionState.FAILED,
                result = null,
                processedOn = ProcessingLocation.ON_DEVICE,
                processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                error = ExecutionError(
                    code = ErrorCode.EXECUTION_FAILED.name,
                    message = e.message ?: "Unknown error",
                    details = e.stackTraceToString(),
                    isRecoverable = true
                ),
                startedAt = startTime.toDouble(),
                completedAt = System.currentTimeMillis().toDouble()
            )

            input.contextId?.let { ctxId ->
                executionHistory[ctxId]?.add(result)
            }

            _executionStateFlow.emit(result)
            throw e
        }
    }

    private suspend fun executeFeatureWithMLKit(input: ExecuteFeatureInput): ExecutionResultData? {
        return when (input.feature) {
            // ML Kit GenAI features
            FeatureType.SUMMARIZE -> {
                val params = input.parameters?.summarize
                mlKitClients.summarize(
                    text = input.input,
                    inputType = params?.inputType ?: SummarizeInputType.ARTICLE,
                    outputType = params?.outputType ?: SummarizeOutputType.ONE_BULLET,
                    language = params?.language ?: MLKitLanguage.ENGLISH
                )
            }

            FeatureType.PROOFREAD -> {
                val params = input.parameters?.proofread
                mlKitClients.proofread(
                    text = input.input,
                    inputType = params?.inputType ?: ProofreadInputType.KEYBOARD,
                    language = params?.language ?: MLKitLanguage.ENGLISH
                )
            }

            FeatureType.REWRITE -> {
                val params = input.parameters?.rewrite
                    ?: throw LocanaraException.InvalidInput("outputType is required for rewriting")
                mlKitClients.rewrite(
                    text = input.input,
                    outputType = params.outputType,
                    language = params.language ?: MLKitLanguage.ENGLISH
                )
            }

            // describeImageAndroid - Android Community tier (Gemini Nano via ML Kit)
            FeatureType.DESCRIBE_IMAGE_ANDROID -> {
                val params = input.parameters?.imageDescription
                    ?: throw LocanaraException.InvalidInput("Image parameters are required")
                val result: ImageDescriptionResult = when {
                    params.imageBase64 != null -> mlKitClients.describeImageFromBase64(params.imageBase64)
                    params.imagePath != null -> mlKitClients.describeImageFromPath(params.imagePath)
                    else -> throw LocanaraException.InvalidInput("Either imageBase64 or imagePath must be provided")
                }
                result
            }

            // Features not available in Community tier
            FeatureType.DESCRIBE_IMAGE,
            FeatureType.GENERATE_IMAGE,
            FeatureType.GENERATE_IMAGE_IOS -> {
                throw LocanaraException.FeatureNotAvailable(input.feature)
            }

            // Prompt API (Gemini Nano) features
            FeatureType.CHAT -> {
                val params = input.parameters?.chat
                promptClient.chat(
                    message = input.input,
                    systemPrompt = params?.systemPrompt,
                    history = params?.history
                )
            }

            FeatureType.CLASSIFY -> {
                val params = input.parameters?.classify
                    ?: throw LocanaraException.InvalidInput("categories are required for classification")
                val categories = params.categories
                    ?: throw LocanaraException.InvalidInput("categories are required for classification")
                promptClient.classify(
                    text = input.input,
                    categories = categories,
                    maxResults = params.maxResults ?: 3
                )
            }

            FeatureType.EXTRACT -> {
                val params = input.parameters?.extract
                promptClient.extract(
                    text = input.input,
                    entityTypes = params?.entityTypes ?: listOf("person", "location", "date", "organization"),
                    extractKeyValues = params?.extractKeyValues ?: false
                )
            }

            FeatureType.TRANSLATE -> {
                val params = input.parameters?.translate
                    ?: throw LocanaraException.InvalidInput("targetLanguage is required for translation")
                promptClient.translate(
                    text = input.input,
                    sourceLanguage = params.sourceLanguage ?: "en",
                    targetLanguage = params.targetLanguage
                )
            }
        }
    }

    override suspend fun cancelExecution(executionId: String): VoidResult {
        // ML Kit/AICore operations are fast and complete before cancellation is possible
        return VoidResult(success = true)
    }

    override suspend fun clearHistory(contextId: String): VoidResult {
        executionHistory[contextId]?.clear()
        return VoidResult(success = true)
    }

    override suspend fun deleteContext(contextId: String): VoidResult {
        contexts.remove(contextId)
        executionHistory.remove(contextId)
        return VoidResult(success = true)
    }

    override suspend fun preloadModels(features: List<FeatureType>): VoidResult {
        // ML Kit/AICore manage model caching automatically via OS
        return VoidResult(success = true)
    }

    override suspend fun unloadModels(features: List<FeatureType>): VoidResult {
        // ML Kit/AICore manage model memory automatically via OS
        return VoidResult(success = true)
    }

    // ============================================
    // MutationResolverAndroid Implementation
    // ============================================

    override suspend fun downloadGeminiNano(variant: String?): VoidResult {
        // ML Kit/AICore models are managed by OS/Play Services
        return VoidResult(success = true)
    }

    override suspend fun executeFeatureAndroid(
        input: ExecuteFeatureInput,
        options: ExecuteFeatureOptionsAndroid?
    ): ExecutionResult = withContext(Dispatchers.Default) {
        executeFeature(input)
    }

    override suspend fun initializeGeminiNano(): VoidResult = withContext(Dispatchers.Default) {
        // ML Kit/AICore are automatically initialized
        geminiNanoInfo = GeminiNanoInfoAndroid(
            version = "1.0.1",
            variant = "mlkit-aicore",
            supportedLanguages = listOf("en", "ja", "ko", "fr", "de", "it", "es"),
            capabilities = listOf("summarize", "proofread", "rewrite", "describeImageAndroid", "chat", "classify", "extract", "translate"),
            isDownloaded = true,
            downloadSizeMB = null,
            isReady = true
        )
        VoidResult(success = true)
    }

    override suspend fun describeImageAndroid(
        parameters: ImageDescriptionParametersAndroid
    ): ImageDescriptionResult = withContext(Dispatchers.Default) {
        val result: ImageDescriptionResult = when {
            parameters.imageBase64 != null -> mlKitClients.describeImageFromBase64(parameters.imageBase64)
            parameters.imagePath != null -> mlKitClients.describeImageFromPath(parameters.imagePath)
            else -> throw LocanaraException.InvalidInput("Either imageBase64 or imagePath must be provided")
        }
        result
    }

    // ============================================
    // SubscriptionResolver Implementation
    // ============================================

    override fun onExecutionStateChanged(executionId: String): Flow<ExecutionResult> {
        return _executionStateFlow
    }

    override fun onCapabilityChanged(): Flow<DeviceCapability> {
        return _capabilityChangedFlow
    }

    override fun onEvent(): Flow<LocanaraEventPayload> {
        return _eventFlow
    }

    // ============================================
    // Private Helper Methods
    // ============================================

    private fun checkDeviceCapabilities(): DeviceCapability {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memInfo)

        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val isLowPowerMode = powerManager?.isPowerSaveMode ?: false

        val supportsMLKit = checkMLKitSupport()
        // Prompt API is supported if Available, Downloadable, or Downloading
        val supportsPromptApi = when (promptApiStatus) {
            is PromptApiStatus.Available -> true
            is PromptApiStatus.Downloadable -> true
            is PromptApiStatus.Downloading -> true
            is PromptApiStatus.NotAvailable -> false
        }

        // ML Kit GenAI features (available on most devices with Android 8+)
        val mlKitFeatures = listOf(
            FeatureType.SUMMARIZE,
            FeatureType.PROOFREAD,
            FeatureType.REWRITE,
            FeatureType.DESCRIBE_IMAGE_ANDROID
        )

        // Prompt API features (requires device with Gemini Nano support)
        val promptApiFeatures = listOf(
            FeatureType.CHAT,
            FeatureType.CLASSIFY,
            FeatureType.EXTRACT,
            FeatureType.TRANSLATE
        )

        val availableFeatures = mutableListOf<FeatureType>()
        if (supportsMLKit) availableFeatures.addAll(mlKitFeatures)
        if (supportsPromptApi) availableFeatures.addAll(promptApiFeatures)

        val modelName = when {
            supportsMLKit && supportsPromptApi -> "ML Kit GenAI + Prompt API"
            supportsMLKit -> "ML Kit GenAI"
            supportsPromptApi -> "Prompt API (Gemini Nano)"
            else -> "None"
        }

        return DeviceCapability(
            platform = Platform.ANDROID,
            supportsOnDeviceAI = availableFeatures.isNotEmpty(),
            availableFeatures = availableFeatures,
            featureCapabilities = availableFeatures.map { feature ->
                FeatureCapability(
                    feature = feature,
                    level = CapabilityLevel.FULL,
                    estimatedProcessingTimeMs = when (feature) {
                        FeatureType.SUMMARIZE -> 2000
                        FeatureType.PROOFREAD -> 1000
                        FeatureType.REWRITE -> 1500
                        FeatureType.DESCRIBE_IMAGE_ANDROID -> 3000
                        FeatureType.CHAT -> 1500
                        FeatureType.CLASSIFY -> 1000
                        FeatureType.EXTRACT -> 1500
                        FeatureType.TRANSLATE -> 2000
                        else -> 2000
                    },
                    maxInputLength = when (feature) {
                        FeatureType.SUMMARIZE -> 4000
                        FeatureType.PROOFREAD -> 256
                        FeatureType.REWRITE -> 256
                        else -> 4096
                    }
                )
            },
            availableMemoryMB = (memInfo.availMem / (1024 * 1024)).toInt(),
            isLowPowerMode = isLowPowerMode,
            modelInfo = ModelInfo(
                name = modelName,
                version = "1.0.1",
                sizeMB = null,
                isLoaded = availableFeatures.isNotEmpty(),
                geminiNanoAndroid = geminiNanoInfo
            )
        )
    }

    private fun checkMLKitSupport(): Boolean {
        // ML Kit GenAI works on Android 8+ (API 26+)
        return Build.VERSION.SDK_INT >= 26
    }

    /**
     * Get Prompt API availability status with reason if not available
     */
    fun getPromptApiStatus(): PromptApiStatus = promptApiStatus

    /**
     * Download the Prompt API model (Gemini Nano)
     *
     * Call this when status is [PromptApiStatus.Downloadable].
     * Uses NonCancellable to ensure download completes even if coroutine is cancelled.
     *
     * @param onProgress Optional callback for download progress updates
     */
    suspend fun downloadPromptApiModel(
        onProgress: ((com.locanara.mlkit.DownloadProgress) -> Unit)? = null
    ) {
        Log.w(TAG, "Starting Prompt API model download...")
        promptApiStatus = PromptApiStatus.Downloading
        // Use NonCancellable to ensure download completes even if coroutine is cancelled
        withContext(NonCancellable) {
            try {
                promptClient.downloadModel(onProgress)
                promptApiStatus = PromptApiStatus.Available
                Log.w(TAG, "Prompt API model download completed")
                // Refresh device capabilities
                val capability = checkDeviceCapabilities()
                deviceCapability = capability
                _capabilityChangedFlow.emit(capability)
            } catch (e: Exception) {
                Log.e(TAG, "Prompt API model download failed", e)
                promptApiStatus = PromptApiStatus.NotAvailable("Download failed: ${e.message}")
                throw e
            }
        }
    }

    /**
     * Clear cached Prompt API status and recheck
     */
    suspend fun recheckPromptApiStatus(): PromptApiStatus {
        promptClient.clearStatusCache()
        promptApiStatus = promptClient.checkStatus()
        // Refresh device capabilities if status changed
        if (deviceCapability != null) {
            deviceCapability = checkDeviceCapabilities()
        }
        return promptApiStatus
    }

    companion object {
        private const val TAG = "Locanara"

        /**
         * SDK version (from BuildConfig, sourced from locanara-versions.json)
         */
        val VERSION: String = BuildConfig.SDK_VERSION

        @Volatile
        private var instance: Locanara? = null

        /**
         * Get or create the Locanara instance
         *
         * @param context Application context
         * @return Locanara instance
         */
        fun getInstance(context: Context): Locanara {
            return instance ?: synchronized(this) {
                instance ?: Locanara(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }
}
