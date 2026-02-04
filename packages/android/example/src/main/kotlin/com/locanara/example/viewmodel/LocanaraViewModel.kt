package com.locanara.example.viewmodel

import android.app.Application
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.locanara.DeviceCapability
import com.locanara.DeviceInfoAndroid
import com.locanara.ExecutionResult
import com.locanara.ExecuteFeatureInput
import com.locanara.ExecuteFeatureOptionsAndroid
import com.locanara.FeatureParametersInput
import com.locanara.FeatureType
import com.locanara.GeminiNanoInfoAndroid
import com.locanara.Locanara
import com.locanara.mlkit.PromptApiStatus
import com.locanara.Platform
import com.locanara.SummarizeParametersInput
import com.locanara.SummarizeInputType
import com.locanara.SummarizeOutputType
import com.locanara.ClassifyParametersInput
import com.locanara.ExtractParametersInput
import com.locanara.ChatParametersInput
import com.locanara.TranslateParametersInput
import com.locanara.RewriteParametersInput
import com.locanara.RewriteOutputType
import com.locanara.ProofreadParametersInput
import com.locanara.ProofreadInputType
import com.locanara.ImageDescriptionParametersInput
import com.locanara.MLKitLanguage
import com.locanara.ExecutionState
import com.locanara.ProcessingLocation
import com.locanara.ExecutionError
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Represents the AI availability status on the device.
 */
sealed class AIStatus {
    data object Checking : AIStatus()
    data object Available : AIStatus()
    data class NotAvailable(val reason: NotAvailableReason) : AIStatus()
    data class Error(val message: String) : AIStatus()
}

/**
 * Reasons why AI might not be available.
 */
enum class NotAvailableReason {
    DEVICE_NOT_SUPPORTED,
    ANDROID_VERSION_TOO_LOW,
    GEMINI_NANO_NOT_ENABLED,
    INSUFFICIENT_MEMORY,
    UNKNOWN
}

/**
 * ViewModel for managing Locanara SDK state and operations.
 *
 * Provides lifecycle-aware management of:
 * - AI availability status
 * - Device capabilities
 * - Feature execution
 */
class LocanaraViewModel(application: Application) : AndroidViewModel(application) {

    private val locanara: Locanara = Locanara.getInstance(application)

    private val _aiStatus = MutableStateFlow<AIStatus>(AIStatus.Checking)
    val aiStatus: StateFlow<AIStatus> = _aiStatus.asStateFlow()

    private val _deviceInfo = MutableStateFlow<DeviceInfoAndroid?>(null)
    val deviceInfo: StateFlow<DeviceInfoAndroid?> = _deviceInfo.asStateFlow()

    private val _geminiNanoInfo = MutableStateFlow<GeminiNanoInfoAndroid?>(null)
    val geminiNanoInfo: StateFlow<GeminiNanoInfoAndroid?> = _geminiNanoInfo.asStateFlow()

    private val _deviceCapability = MutableStateFlow<DeviceCapability?>(null)
    val deviceCapability: StateFlow<DeviceCapability?> = _deviceCapability.asStateFlow()

    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    private val _executionResult = MutableStateFlow<ExecutionResult?>(null)
    val executionResult: StateFlow<ExecutionResult?> = _executionResult.asStateFlow()

    private val _isExecuting = MutableStateFlow(false)
    val isExecuting: StateFlow<Boolean> = _isExecuting.asStateFlow()

    private val _promptApiStatus = MutableStateFlow<PromptApiStatus>(PromptApiStatus.NotAvailable("Not yet checked"))
    val promptApiStatus: StateFlow<PromptApiStatus> = _promptApiStatus.asStateFlow()

    init {
        checkAIStatus()
    }

    /**
     * Check AI availability status.
     *
     * This should be called on app launch to determine if Gemini Nano
     * is available and ready to use.
     */
    fun checkAIStatus() {
        viewModelScope.launch {
            _aiStatus.value = AIStatus.Checking

            try {
                // Get device info
                val info = locanara.getDeviceInfoAndroid()
                _deviceInfo.value = info

                // Check Android version (API 34+ required for Gemini Nano)
                if (info.apiLevel < 34) {
                    _aiStatus.value = AIStatus.NotAvailable(NotAvailableReason.ANDROID_VERSION_TOO_LOW)
                    return@launch
                }

                // Check if device supports Gemini Nano
                if (!info.supportsGeminiNano) {
                    _aiStatus.value = AIStatus.NotAvailable(NotAvailableReason.DEVICE_NOT_SUPPORTED)
                    return@launch
                }

                // Check memory (minimum 6GB recommended)
                if (info.totalRAMMB < 6 * 1024) {
                    _aiStatus.value = AIStatus.NotAvailable(NotAvailableReason.INSUFFICIENT_MEMORY)
                    return@launch
                }

                // Initialize SDK
                locanara.initializeSDK(Platform.ANDROID)
                _isInitialized.value = true

                // Initialize Gemini Nano
                locanara.initializeGeminiNano()

                // Get Gemini Nano status
                val geminiStatus = locanara.getGeminiNanoStatus()
                _geminiNanoInfo.value = geminiStatus

                // Check if Gemini Nano is ready
                if (!geminiStatus.isReady && !geminiStatus.isDownloaded) {
                    _aiStatus.value = AIStatus.NotAvailable(NotAvailableReason.GEMINI_NANO_NOT_ENABLED)
                    return@launch
                }

                // Get device capabilities
                val capability = locanara.getDeviceCapability()
                _deviceCapability.value = capability

                // Get Prompt API status
                _promptApiStatus.value = locanara.getPromptApiStatus()

                _aiStatus.value = AIStatus.Available

            } catch (e: Exception) {
                _aiStatus.value = AIStatus.Error(e.message ?: "Unknown error occurred")
            }
        }
    }

    /**
     * Open Play Store for AICore setup.
     */
    fun openAICorePlayStore(context: android.content.Context) {
        try {
            val marketIntent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("market://details?id=com.google.android.aicore")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(marketIntent)
        } catch (e: Exception) {
            try {
                val webIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.aicore")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
            } catch (e2: Exception) {
                Log.e("LocanaraViewModel", "Failed to open Play Store", e2)
            }
        }
    }

    /**
     * Download the Prompt API model (Gemini Nano for Chat, Classify, Extract, Translate).
     */
    fun downloadPromptApiModel() {
        viewModelScope.launch {
            try {
                _promptApiStatus.value = PromptApiStatus.Downloading
                locanara.downloadPromptApiModel { progress ->
                    Log.d("LocanaraViewModel", "Download progress: ${progress.bytesDownloaded}/${progress.bytesToDownload}")
                }
                _promptApiStatus.value = locanara.getPromptApiStatus()
                checkAIStatus()
            } catch (e: Exception) {
                Log.e("LocanaraViewModel", "Failed to download Prompt API model", e)
                _promptApiStatus.value = PromptApiStatus.NotAvailable("Download failed: ${e.message}")
            }
        }
    }

    /**
     * Execute summarize feature.
     */
    fun summarize(
        text: String,
        inputType: SummarizeInputType? = null,
        outputType: SummarizeOutputType? = null,
        language: MLKitLanguage? = null
    ) {
        executeFeature(
            FeatureType.SUMMARIZE,
            text,
            FeatureParametersInput(
                summarize = SummarizeParametersInput(
                    inputType = inputType,
                    outputType = outputType,
                    language = language
                )
            )
        )
    }

    /**
     * Execute classify feature.
     */
    fun classify(
        text: String,
        categories: List<String>? = null,
        maxResults: Int? = null
    ) {
        executeFeature(
            FeatureType.CLASSIFY,
            text,
            FeatureParametersInput(
                classify = ClassifyParametersInput(
                    categories = categories,
                    maxResults = maxResults
                )
            )
        )
    }

    /**
     * Execute extract feature.
     */
    fun extract(
        text: String,
        entityTypes: List<String>? = null,
        extractKeyValues: Boolean? = null
    ) {
        executeFeature(
            FeatureType.EXTRACT,
            text,
            FeatureParametersInput(
                extract = ExtractParametersInput(
                    entityTypes = entityTypes,
                    extractKeyValues = extractKeyValues
                )
            )
        )
    }

    /**
     * Execute chat feature.
     */
    fun chat(
        message: String,
        conversationId: String? = null,
        systemPrompt: String? = null
    ) {
        executeFeature(
            FeatureType.CHAT,
            message,
            FeatureParametersInput(
                chat = ChatParametersInput(
                    conversationId = conversationId,
                    systemPrompt = systemPrompt
                )
            )
        )
    }

    /**
     * Execute translate feature.
     */
    fun translate(
        text: String,
        targetLanguage: String,
        sourceLanguage: String? = null
    ) {
        executeFeature(
            FeatureType.TRANSLATE,
            text,
            FeatureParametersInput(
                translate = TranslateParametersInput(
                    targetLanguage = targetLanguage,
                    sourceLanguage = sourceLanguage
                )
            )
        )
    }

    /**
     * Execute rewrite feature.
     */
    fun rewrite(
        text: String,
        outputType: RewriteOutputType,
        language: MLKitLanguage? = null
    ) {
        executeFeature(
            FeatureType.REWRITE,
            text,
            FeatureParametersInput(
                rewrite = RewriteParametersInput(
                    outputType = outputType,
                    language = language
                )
            )
        )
    }

    /**
     * Execute proofread feature.
     */
    fun proofread(
        text: String,
        inputType: ProofreadInputType? = null,
        language: MLKitLanguage? = null
    ) {
        executeFeature(
            FeatureType.PROOFREAD,
            text,
            FeatureParametersInput(
                proofread = ProofreadParametersInput(
                    inputType = inputType,
                    language = language
                )
            )
        )
    }

    /**
     * Execute describeImage feature.
     */
    fun describeImage(
        imagePath: String? = null,
        imageBase64: String? = null
    ) {
        executeFeature(
            FeatureType.DESCRIBE_IMAGE_ANDROID,
            "",
            FeatureParametersInput(
                imageDescription = ImageDescriptionParametersInput(
                    imagePath = imagePath,
                    imageBase64 = imageBase64
                )
            )
        )
    }

    /**
     * Execute a feature with Android-specific options.
     */
    private fun executeFeature(
        feature: FeatureType,
        input: String,
        parameters: FeatureParametersInput? = null
    ) {
        viewModelScope.launch {
            _isExecuting.value = true
            _executionResult.value = null

            try {
                val result = locanara.executeFeatureAndroid(
                    input = ExecuteFeatureInput(
                        feature = feature,
                        input = input,
                        parameters = parameters
                    ),
                    options = ExecuteFeatureOptionsAndroid(
                        useGeminiNano = true,
                        enableGPU = true
                    )
                )
                _executionResult.value = result
            } catch (e: Exception) {
                Log.e("LocanaraViewModel", "Feature execution failed", e)
                _executionResult.value = ExecutionResult(
                    id = java.util.UUID.randomUUID().toString(),
                    feature = feature,
                    state = ExecutionState.FAILED,
                    result = null,
                    processedOn = ProcessingLocation.ON_DEVICE,
                    processingTimeMs = 0,
                    error = ExecutionError(
                        code = "EXECUTION_FAILED",
                        message = e.message ?: "Unknown error",
                        details = e.stackTraceToString(),
                        isRecoverable = true
                    ),
                    startedAt = System.currentTimeMillis().toDouble(),
                    completedAt = System.currentTimeMillis().toDouble()
                )
            } finally {
                _isExecuting.value = false
            }
        }
    }

    /**
     * Clear the current execution result.
     */
    fun clearResult() {
        _executionResult.value = null
    }
}
