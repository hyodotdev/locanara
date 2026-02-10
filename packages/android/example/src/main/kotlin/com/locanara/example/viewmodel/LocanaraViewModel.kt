package com.locanara.example.viewmodel

import android.app.Application
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.locanara.DeviceCapability
import com.locanara.DeviceInfoAndroid
import com.locanara.GeminiNanoInfoAndroid
import com.locanara.Locanara
import com.locanara.mlkit.PromptApiStatus
import com.locanara.Platform
import com.locanara.core.LocanaraDefaults
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

}
