package com.locanara

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import com.locanara.engine.InferenceEngine
import com.locanara.mlkit.AndroidCapabilityStatusSnapshot
import com.locanara.mlkit.GeminiNanoDownloadCoordinator
import com.locanara.mlkit.MLKitCapabilityProbe
import com.locanara.mlkit.MLKitClients
import com.locanara.mlkit.MLKitPromptClient
import com.locanara.mlkit.PromptApiStatus
import com.locanara.mlkit.capabilityStateChanged
import com.locanara.mlkit.mapCapabilityCheckFailure
import com.locanara.mlkit.meetsAndroidMinimumRequirements
import com.locanara.mlkit.validateGeminiNanoVariant
import com.locanara.personalization.PersonalizationManager
import com.locanara.rag.RAGManager
import com.locanara.rag.RAGQueryEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.Locale
import java.util.UUID

internal fun selectConversationId(
    requested: String?,
    generated: String?,
): String? = requested ?: generated

/**
 * Locanara SDK for Android
 *
 * Provides a unified interface for on-device AI capabilities
 * built on top of Gemini Nano, Google ML Kit GenAI,
 * and ExecuTorch for devices without native AI support.
 */
class Locanara private constructor(
    private val context: Context,
) : QueryResolverAndroid,
    MutationResolverAndroid,
    SubscriptionResolver {
    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    @Volatile
    private var deviceCapability: DeviceCapability? = null
    @Volatile
    private var geminiNanoInfo: GeminiNanoInfoAndroid? = null
    private var lastCapabilitySnapshot: AndroidCapabilityStatusSnapshot? = null
    private val contexts = mutableMapOf<String, ExecutionContext>()
    private val executionHistory = mutableMapOf<String, MutableList<ExecutionResult>>()

    // ML Kit GenAI clients for on-device AI features (Summarize, Proofread, Rewrite, DescribeImage)
    private val mlKitClients: MLKitClients by lazy { MLKitClients(context) }

    // ML Kit Prompt API client for flexible text generation (Chat, Classify, Extract, Translate)
    private val promptClient: MLKitPromptClient by lazy { MLKitPromptClient(context) }

    // Capability checks use short-lived clients so they never close inference clients in use.
    private val capabilityProbe: MLKitCapabilityProbe by lazy { MLKitCapabilityProbe(context) }

    // Prompt API availability status (checked during initialization)
    @Volatile
    private var promptApiStatus: PromptApiStatus = PromptApiStatus.NotAvailable("Not yet initialized")

    // Engine, RAG, and Personalization (lazy initialized)
    private val ragManager: RAGManager by lazy { RAGManager(context) }
    private val ragQueryEngine: RAGQueryEngine by lazy { RAGQueryEngine(context, ragManager) }
    private val personalizationManager: PersonalizationManager by lazy { PersonalizationManager(context) }
    private var inferenceEngine: InferenceEngine? = null
    private val engineMutex = Mutex()
    private val capabilityMutex = Mutex()
    private val promptDownloadCoordinator = GeminiNanoDownloadCoordinator()

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
        return refreshDeviceCapabilities()
    }

    override suspend fun isFeatureAvailable(feature: FeatureType): Boolean = getDeviceCapability().availableFeatures.contains(feature)

    override suspend fun getContext(contextId: String): ExecutionContext? = contexts[contextId]

    override suspend fun getExecutionResult(executionId: String): ExecutionResult? =
        executionHistory.values.flatten().find {
            it.id == executionId
        }

    override suspend fun getExecutionHistory(
        contextId: String,
        limit: Int?,
    ): List<ExecutionResult> {
        val history = executionHistory[contextId] ?: emptyList()
        return if (limit != null) history.takeLast(limit) else history
    }

    // ============================================
    // QueryResolverAndroid Implementation
    // ============================================

    override suspend fun getDeviceInfoAndroid(): DeviceInfoAndroid =
        withContext(Dispatchers.Default) {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            activityManager?.getMemoryInfo(memInfo)

            // Device information is a live query: model state may change outside this process.
            refreshDeviceCapabilities()

            // Pending downloads still indicate device support, but not model readiness.
            val supportsGeminiNano =
                when (promptApiStatus) {
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
                totalRAMMB = (memInfo.totalMem / (1024 * 1024)).toInt(),
            )
        }

    override suspend fun getGeminiNanoStatus(): GeminiNanoInfoAndroid {
        refreshDeviceCapabilities()
        return geminiNanoInfo ?: throw LocanaraException.CapabilityCheckFailed
    }

    override suspend fun meetsMinimumRequirements(): Boolean =
        withContext(Dispatchers.Default) {
            val capability = refreshDeviceCapabilities()
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            activityManager?.getMemoryInfo(memInfo)

            // Minimum requirements for ML Kit: Android 8+ (API 26), 4GB RAM
            meetsAndroidMinimumRequirements(
                apiLevel = Build.VERSION.SDK_INT,
                totalRAMMB = (memInfo.totalMem / (1024 * 1024)).toInt(),
                capability = capability,
            )
        }

    // ============================================
    // MutationResolver Implementation
    // ============================================

    override suspend fun initializeSDK(platform: Platform): VoidResult =
        withContext(Dispatchers.Default) {
            if (_isInitialized.value) {
                return@withContext VoidResult(success = true)
            }

            refreshDeviceCapabilities()
            _isInitialized.value = true

            VoidResult(success = true)
        }

    override suspend fun createContext(preferences: ContextPreferencesInput?): ExecutionContext {
        val ctx =
            ExecutionContext(
                id = UUID.randomUUID().toString(),
                recentActions = emptyList(),
                appState = null,
                preferences =
                    preferences?.let {
                        ContextPreferences(
                            processingPreference = it.processingPreference ?: ProcessingPreference.AUTO,
                            privacyLevel = it.privacyLevel ?: PrivacyLevel.BALANCED,
                            maxProcessingTimeMs = it.maxProcessingTimeMs,
                            enableCaching = it.enableCaching ?: true,
                        )
                    },
                lastUpdated = System.currentTimeMillis().toDouble(),
            )
        contexts[ctx.id] = ctx
        executionHistory[ctx.id] = mutableListOf()
        return ctx
    }

    override suspend fun updateContext(input: UpdateContextInput): ExecutionContext {
        val existing =
            contexts[input.contextId]
                ?: throw LocanaraException.ContextNotFound(input.contextId)

        val updated =
            existing.copy(
                recentActions = (existing.recentActions ?: emptyList()) + (input.addActions ?: emptyList()),
                appState = input.appState ?: existing.appState,
                preferences =
                    input.preferences?.let {
                        ContextPreferences(
                            processingPreference =
                                it.processingPreference ?: existing.preferences?.processingPreference ?: ProcessingPreference.AUTO,
                            privacyLevel = it.privacyLevel ?: existing.preferences?.privacyLevel ?: PrivacyLevel.BALANCED,
                            maxProcessingTimeMs = it.maxProcessingTimeMs ?: existing.preferences?.maxProcessingTimeMs,
                            enableCaching = it.enableCaching ?: existing.preferences?.enableCaching ?: true,
                        )
                    } ?: existing.preferences,
                lastUpdated = System.currentTimeMillis().toDouble(),
            )
        contexts[input.contextId] = updated
        return updated
    }

    override suspend fun executeFeature(input: ExecuteFeatureInput): ExecutionResult =
        withContext(Dispatchers.Default) {
            val executionId = UUID.randomUUID().toString()
            val startTime = System.currentTimeMillis()

            if (!isFeatureAvailable(input.feature)) {
                throw LocanaraException.FeatureNotAvailable(input.feature)
            }

            try {
                // Execute feature using ML Kit GenAI
                val featureResult = executeFeatureWithMLKit(input)

                val result =
                    ExecutionResult(
                        id = executionId,
                        feature = input.feature,
                        state = ExecutionState.COMPLETED,
                        result = featureResult,
                        processedOn = ProcessingLocation.ON_DEVICE,
                        processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                        error = null,
                        startedAt = startTime.toDouble(),
                        completedAt = System.currentTimeMillis().toDouble(),
                    )

                input.contextId?.let { ctxId ->
                    executionHistory[ctxId]?.add(result)
                }

                _executionStateFlow.emit(result)
                result
            } catch (e: Exception) {
                val result =
                    ExecutionResult(
                        id = executionId,
                        feature = input.feature,
                        state = ExecutionState.FAILED,
                        result = null,
                        processedOn = ProcessingLocation.ON_DEVICE,
                        processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                        error =
                            ExecutionError(
                                code = ErrorCode.EXECUTION_FAILED.name,
                                message = e.message ?: "Unknown error",
                                details = e.stackTraceToString(),
                                isRecoverable = true,
                            ),
                        startedAt = startTime.toDouble(),
                        completedAt = System.currentTimeMillis().toDouble(),
                    )

                input.contextId?.let { ctxId ->
                    executionHistory[ctxId]?.add(result)
                }

                _executionStateFlow.emit(result)
                throw e
            }
        }

    private suspend fun executeFeatureWithMLKit(input: ExecuteFeatureInput): ExecutionResultData? =
        when (input.feature) {
            // ML Kit GenAI features
            FeatureType.SUMMARIZE -> {
                val params = input.parameters?.summarize
                mlKitClients.summarize(
                    text = input.input,
                    inputType = params?.inputType ?: SummarizeInputType.ARTICLE,
                    outputType = params?.outputType ?: SummarizeOutputType.ONE_BULLET,
                    language = params?.language ?: MLKitLanguage.ENGLISH,
                )
            }

            FeatureType.PROOFREAD -> {
                val params = input.parameters?.proofread
                mlKitClients.proofread(
                    text = input.input,
                    inputType = params?.inputType ?: ProofreadInputType.KEYBOARD,
                    language = params?.language ?: MLKitLanguage.ENGLISH,
                )
            }

            FeatureType.REWRITE -> {
                val params =
                    input.parameters?.rewrite
                        ?: throw LocanaraException.InvalidInput("outputType is required for rewriting")
                mlKitClients.rewrite(
                    text = input.input,
                    outputType = params.outputType,
                    language = params.language ?: MLKitLanguage.ENGLISH,
                )
            }

            // describeImageAndroid - Android (Gemini Nano via ML Kit)
            FeatureType.DESCRIBE_IMAGE_ANDROID -> {
                val params =
                    input.parameters?.imageDescription
                        ?: throw LocanaraException.InvalidInput("Image parameters are required")
                val result: ImageDescriptionResult =
                    when {
                        params.imageBase64 != null -> mlKitClients.describeImageFromBase64(params.imageBase64)
                        params.imagePath != null -> mlKitClients.describeImageFromPath(params.imagePath)
                        else -> throw LocanaraException.InvalidInput("Either imageBase64 or imagePath must be provided")
                    }
                result
            }

            // Features not available on this platform
            FeatureType.DESCRIBE_IMAGE,
            FeatureType.GENERATE_IMAGE,
            FeatureType.GENERATE_IMAGE_IOS,
            -> {
                throw LocanaraException.FeatureNotAvailable(input.feature)
            }

            // Prompt API (Gemini Nano) features
            FeatureType.CHAT -> {
                val params = input.parameters?.chat
                promptClient
                    .chat(
                        message = input.input,
                        systemPrompt = params?.systemPrompt,
                        history = params?.history,
                    ).let { result ->
                        result.copy(
                            conversationId = selectConversationId(params?.conversationId, result.conversationId),
                        )
                    }
            }

            FeatureType.CLASSIFY -> {
                val params =
                    input.parameters?.classify
                        ?: throw LocanaraException.InvalidInput("categories are required for classification")
                val categories =
                    params.categories
                        ?: throw LocanaraException.InvalidInput("categories are required for classification")
                promptClient.classify(
                    text = input.input,
                    categories = categories,
                    maxResults = params.maxResults ?: 3,
                )
            }

            FeatureType.EXTRACT -> {
                val params = input.parameters?.extract
                promptClient.extract(
                    text = input.input,
                    entityTypes = params?.entityTypes ?: listOf("person", "location", "date", "organization"),
                    extractKeyValues = params?.extractKeyValues ?: false,
                )
            }

            FeatureType.TRANSLATE -> {
                val params =
                    input.parameters?.translate
                        ?: throw LocanaraException.InvalidInput("targetLanguage is required for translation")
                promptClient.translate(
                    text = input.input,
                    sourceLanguage = params.sourceLanguage ?: "en",
                    targetLanguage = params.targetLanguage,
                )
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
        validateGeminiNanoVariant(variant)
        downloadPromptApiModel()
        return VoidResult(success = true)
    }

    override suspend fun executeFeatureAndroid(
        input: ExecuteFeatureInput,
        options: ExecuteFeatureOptionsAndroid?,
    ): ExecutionResult =
        withContext(Dispatchers.Default) {
            executeFeature(input)
        }

    override suspend fun initializeGeminiNano(): VoidResult =
        withContext(Dispatchers.Default) {
            when (recheckPromptApiStatus()) {
                is PromptApiStatus.Available -> VoidResult(success = true)
                is PromptApiStatus.Downloadable -> throw LocanaraException.Custom(
                    ErrorCode.MODEL_DOWNLOAD_REQUIRED,
                    "Prompt API model download is required",
                )
                is PromptApiStatus.Downloading -> throw LocanaraException.ModelBusy
                is PromptApiStatus.NotAvailable -> throw LocanaraException.DeviceNotSupported
            }
        }

    override suspend fun describeImageAndroid(parameters: ImageDescriptionParametersAndroid): ImageDescriptionResult =
        withContext(Dispatchers.Default) {
            val result: ImageDescriptionResult =
                when {
                    parameters.imageBase64 != null -> mlKitClients.describeImageFromBase64(parameters.imageBase64)
                    parameters.imagePath != null -> mlKitClients.describeImageFromPath(parameters.imagePath)
                    else -> throw LocanaraException.InvalidInput("Either imageBase64 or imagePath must be provided")
                }
            result
        }

    // ============================================
    // Streaming
    // ============================================

    /**
     * Stream a chat response as a Flow of ChatStreamChunk
     *
     * @param message User message
     * @param systemPrompt Optional system prompt
     * @param history Optional conversation history
     * @param conversationId Optional conversation ID for context
     * @return Flow of ChatStreamChunk
     */
    fun chatStream(
        message: String,
        systemPrompt: String? = null,
        history: List<ChatMessageInput>? = null,
        conversationId: String? = null,
    ): Flow<ChatStreamChunk> {
        if (!_isInitialized.value) {
            throw LocanaraException.SdkNotInitialized
        }

        return kotlinx.coroutines.flow.flow {
            if (!isFeatureAvailable(FeatureType.CHAT)) {
                throw LocanaraException.FeatureNotAvailable(FeatureType.CHAT)
            }
            promptClient
                .chatStream(
                    message = message,
                    systemPrompt = systemPrompt,
                    history = history,
                ).collect { chunk ->
                    emit(
                        chunk.copy(
                            conversationId = selectConversationId(conversationId, chunk.conversationId),
                        ),
                    )
                }
        }
    }

    // ============================================
    // SubscriptionResolver Implementation
    // ============================================

    override fun onExecutionStateChanged(executionId: String): Flow<ExecutionResult> = _executionStateFlow

    override fun onCapabilityChanged(): Flow<DeviceCapability> = _capabilityChangedFlow

    override fun onEvent(): Flow<LocanaraEventPayload> = _eventFlow

    // ============================================
    // Private Helper Methods
    // ============================================

    private suspend fun refreshDeviceCapabilities(): DeviceCapability {
        return capabilityMutex.withLock {
            val snapshot = mapCapabilityCheckFailure { capabilityProbe.snapshot() }
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val availableMemoryMB =
                activityManager?.let { manager ->
                    val memInfo = ActivityManager.MemoryInfo()
                    manager.getMemoryInfo(memInfo)
                    (memInfo.availMem / (1024 * 1024)).toInt()
                }
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            publishCapabilityLocked(
                snapshot = snapshot,
                availableMemoryMB = availableMemoryMB,
                isLowPowerMode = powerManager?.isPowerSaveMode ?: false,
            )
        }
    }

    private suspend fun updatePromptApiStatus(status: PromptApiStatus) {
        capabilityMutex.withLock {
            val snapshot = lastCapabilitySnapshot?.copy(promptStatus = status)
            if (snapshot == null) {
                promptApiStatus = status
                geminiNanoInfo = AndroidCapabilityStatusSnapshot(emptyMap(), status).toGeminiNanoInfo()
                return
            }

            val previous = deviceCapability
            publishCapabilityLocked(
                snapshot = snapshot,
                availableMemoryMB = previous?.availableMemoryMB,
                isLowPowerMode = previous?.isLowPowerMode ?: false,
            )
        }
    }

    private suspend fun publishCapabilityLocked(
        snapshot: AndroidCapabilityStatusSnapshot,
        availableMemoryMB: Int?,
        isLowPowerMode: Boolean,
    ): DeviceCapability {
        promptApiStatus = snapshot.promptStatus
        geminiNanoInfo = snapshot.toGeminiNanoInfo()
        lastCapabilitySnapshot = snapshot

        val capability =
            snapshot.toDeviceCapability(
                availableMemoryMB = availableMemoryMB,
                isLowPowerMode = isLowPowerMode,
            )
        val previous = deviceCapability
        deviceCapability = capability

        // Serialize delivery with snapshot publication so concurrent refreshes cannot
        // emit an older state after a newer one. Ignore volatile free-memory changes.
        if (previous != null && capabilityStateChanged(previous, capability)) {
            _capabilityChangedFlow.emit(capability)
        }
        return capability
    }

    /**
     * Return the last verified Prompt API status.
     * Use [recheckPromptApiStatus] when the caller needs a live OS state refresh.
     */
    fun getPromptApiStatus(): PromptApiStatus = promptApiStatus

    /**
     * Download the Prompt API model (Gemini Nano)
     *
     * Call this when status is [PromptApiStatus.Downloadable].
     *
     * @param onProgress Optional callback for download progress updates
     */
    suspend fun downloadPromptApiModel(onProgress: ((com.locanara.mlkit.DownloadProgress) -> Unit)? = null) {
        try {
            promptDownloadCoordinator.download(
                checkStatus = {
                    promptClient.clearStatusCache()
                    promptClient.checkStatus()
                },
                downloadModel = { promptClient.downloadModel(onProgress) },
                updateStatus = ::updatePromptApiStatus,
            )
        } catch (error: kotlinx.coroutines.CancellationException) {
            throw error
        } catch (error: LocanaraException) {
            throw error
        } catch (error: Exception) {
            throw LocanaraException.ExecutionFailed("Prompt API model download failed", error)
        }
        refreshDeviceCapabilities()
    }

    /**
     * Clear cached Prompt API status and recheck
     */
    suspend fun recheckPromptApiStatus(): PromptApiStatus {
        refreshDeviceCapabilities()
        return promptApiStatus
    }

    companion object {
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
        fun getInstance(context: Context): Locanara =
            instance ?: synchronized(this) {
                instance ?: Locanara(context.applicationContext).also {
                    instance = it
                }
            }
    }
}
