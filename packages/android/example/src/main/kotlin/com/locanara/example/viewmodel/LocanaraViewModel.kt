package com.locanara.example.viewmodel

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.locanara.DeviceCapability
import com.locanara.DeviceInfoAndroid
import com.locanara.GeminiNanoInfoAndroid
import com.locanara.InferenceEngineType
import com.locanara.Locanara
import com.locanara.ModelDisplayInfo
import com.locanara.mlkit.PromptApiStatus
import com.locanara.Platform
import com.locanara.core.LocanaraDefaults
import com.locanara.engine.ModelRegistry
import com.locanara.platform.PromptApiModel
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
 * - Model selection and management
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

    private val _promptApiStatus = MutableStateFlow<PromptApiStatus>(PromptApiStatus.NotAvailable("Not yet checked"))
    val promptApiStatus: StateFlow<PromptApiStatus> = _promptApiStatus.asStateFlow()

    // ============================================
    // Model Management State
    // ============================================

    private val _currentEngine = MutableStateFlow(InferenceEngineType.NONE)
    val currentEngine: StateFlow<InferenceEngineType> = _currentEngine.asStateFlow()

    private val _availableModels = MutableStateFlow<List<ModelDisplayInfo>>(emptyList())
    val availableModels: StateFlow<List<ModelDisplayInfo>> = _availableModels.asStateFlow()

    private val _isModelReady = MutableStateFlow(false)
    val isModelReady: StateFlow<Boolean> = _isModelReady.asStateFlow()

    private val _loadedModelId = MutableStateFlow<String?>(null)
    val loadedModelId: StateFlow<String?> = _loadedModelId.asStateFlow()

    private val _isDownloading = MutableStateFlow(false)
    val isDownloading: StateFlow<Boolean> = _isDownloading.asStateFlow()

    private val _downloadProgress = MutableStateFlow(0f)
    val downloadProgress: StateFlow<Float> = _downloadProgress.asStateFlow()

    /** Whether Gemini Nano (native engine) is supported on this device */
    private val _supportsGeminiNano = MutableStateFlow(false)
    val supportsGeminiNano: StateFlow<Boolean> = _supportsGeminiNano.asStateFlow()

    init {
        checkAIStatus()
        loadAvailableModels()
    }

    /**
     * Check AI availability status.
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
                LocanaraDefaults.model = PromptApiModel(getApplication())
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

                // Gemini Nano is available
                _supportsGeminiNano.value = true
                _currentEngine.value = InferenceEngineType.GEMINI_NANO
                _isModelReady.value = true

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
     * Load available ExecuTorch models from the registry.
     */
    private fun loadAvailableModels() {
        val memoryMB = getDeviceMemoryMB()
        val models = ModelRegistry.getCompatibleModels(memoryMB).map { model ->
            ModelDisplayInfo(
                modelId = model.modelId,
                name = model.name,
                sizeMB = model.sizeMB,
                isDownloaded = false,
                isLoaded = false,
                isRecommended = model.modelId == ModelRegistry.getRecommendedModel(memoryMB)?.modelId
            )
        }
        _availableModels.value = models
    }

    /**
     * Switch to Gemini Nano (native engine).
     */
    fun switchToGeminiNano() {
        if (!_supportsGeminiNano.value) return
        viewModelScope.launch {
            _currentEngine.value = InferenceEngineType.GEMINI_NANO
            _isModelReady.value = true
            _loadedModelId.value = null
            LocanaraDefaults.model = PromptApiModel(getApplication())
            Log.d(TAG, "Switched to Gemini Nano")
        }
    }

    /**
     * Switch to ExecuTorch engine with a specific model.
     */
    fun switchToExecuTorch(modelId: String) {
        val model = _availableModels.value.find { it.modelId == modelId } ?: return
        if (!model.isLoaded) return

        viewModelScope.launch {
            _currentEngine.value = InferenceEngineType.EXECUTORCH
            _loadedModelId.value = modelId
            _isModelReady.value = true
            Log.d(TAG, "Switched to ExecuTorch model: $modelId")
        }
    }

    /**
     * Download an ExecuTorch model.
     */
    fun downloadModel(modelId: String) {
        val registryModel = ModelRegistry.getModel(modelId) ?: return
        if (_isDownloading.value) return

        viewModelScope.launch {
            _isDownloading.value = true
            _downloadProgress.value = 0f

            try {
                // Simulate download progress (real implementation would use ModelDownloader)
                // For now, mark as downloaded immediately for demo purposes
                Log.d(TAG, "Starting download for model: $modelId (${registryModel.sizeMB}MB)")

                // Update model state to downloaded
                _availableModels.value = _availableModels.value.map { model ->
                    if (model.modelId == modelId) model.copy(isDownloaded = true) else model
                }
                _downloadProgress.value = 1f
                Log.d(TAG, "Model download complete: $modelId")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to download model: $modelId", e)
            } finally {
                _isDownloading.value = false
            }
        }
    }

    /**
     * Load a downloaded ExecuTorch model into memory.
     */
    fun loadModel(modelId: String) {
        val model = _availableModels.value.find { it.modelId == modelId } ?: return
        if (!model.isDownloaded) return

        viewModelScope.launch {
            try {
                Log.d(TAG, "Loading model: $modelId")

                // Update model state - unload any previously loaded model
                _availableModels.value = _availableModels.value.map { m ->
                    when {
                        m.modelId == modelId -> m.copy(isLoaded = true)
                        m.isLoaded -> m.copy(isLoaded = false)
                        else -> m
                    }
                }
                _loadedModelId.value = modelId
                _currentEngine.value = InferenceEngineType.EXECUTORCH
                _isModelReady.value = true
                Log.d(TAG, "Model loaded: $modelId")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load model: $modelId", e)
            }
        }
    }

    /**
     * Delete a downloaded model.
     */
    fun deleteModel(modelId: String) {
        viewModelScope.launch {
            // Unload if currently loaded
            if (_loadedModelId.value == modelId) {
                _loadedModelId.value = null
                if (_supportsGeminiNano.value) {
                    switchToGeminiNano()
                } else {
                    _currentEngine.value = InferenceEngineType.NONE
                    _isModelReady.value = false
                }
            }

            // Update model state
            _availableModels.value = _availableModels.value.map { model ->
                if (model.modelId == modelId) model.copy(isDownloaded = false, isLoaded = false) else model
            }
            Log.d(TAG, "Model deleted: $modelId")
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
                Log.e(TAG, "Failed to open Play Store", e2)
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
                    Log.d(TAG, "Download progress: ${progress.bytesDownloaded}/${progress.bytesToDownload}")
                }
                _promptApiStatus.value = locanara.getPromptApiStatus()
                checkAIStatus()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to download Prompt API model", e)
                _promptApiStatus.value = PromptApiStatus.NotAvailable("Download failed: ${e.message}")
            }
        }
    }

    private fun getDeviceMemoryMB(): Int {
        val activityManager = getApplication<Application>()
            .getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memInfo)
        return (memInfo.totalMem / (1024 * 1024)).toInt()
    }

    companion object {
        private const val TAG = "LocanaraViewModel"
    }
}
