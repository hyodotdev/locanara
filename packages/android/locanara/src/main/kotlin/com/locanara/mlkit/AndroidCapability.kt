package com.locanara.mlkit

import android.content.Context
import com.locanara.CapabilityLevel
import com.locanara.DeviceCapability
import com.locanara.FeatureCapability
import com.locanara.FeatureStatus
import com.locanara.FeatureType
import com.locanara.GeminiNanoInfoAndroid
import com.locanara.LocanaraException
import com.locanara.ModelInfo
import com.locanara.Platform
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext

internal val mlKitTaskFeatures = listOf(
    FeatureType.SUMMARIZE,
    FeatureType.PROOFREAD,
    FeatureType.REWRITE,
    FeatureType.DESCRIBE_IMAGE_ANDROID
)

internal val promptApiFeatures = listOf(
    FeatureType.CHAT,
    FeatureType.CLASSIFY,
    FeatureType.EXTRACT,
    FeatureType.TRANSLATE
)

internal data class AndroidCapabilityStatusSnapshot(
    val taskStatuses: Map<FeatureType, FeatureStatus>,
    val promptStatus: PromptApiStatus
) {
    fun statusFor(feature: FeatureType): FeatureStatus = when (feature) {
        in promptApiFeatures -> promptStatus.toFeatureStatus()
        else -> taskStatuses[feature] ?: FeatureStatus.UNAVAILABLE
    }

    fun toGeminiNanoInfo(): GeminiNanoInfoAndroid {
        val supported = promptStatus !is PromptApiStatus.NotAvailable
        val ready = promptStatus is PromptApiStatus.Available
        return GeminiNanoInfoAndroid(
            version = "unknown",
            variant = null,
            supportedLanguages = emptyList(),
            capabilities = if (supported) promptApiFeatures.map { it.name.lowercase() } else emptyList(),
            isDownloaded = ready,
            downloadSizeMB = null,
            isReady = ready
        )
    }

    fun toDeviceCapability(
        availableMemoryMB: Int?,
        isLowPowerMode: Boolean
    ): DeviceCapability {
        val reportedFeatures = mlKitTaskFeatures + promptApiFeatures
        val supportedFeatures = reportedFeatures.filter { statusFor(it) != FeatureStatus.UNAVAILABLE }
        val availableFeatures = reportedFeatures.filter { statusFor(it) == FeatureStatus.AVAILABLE }
        val hasTaskSupport = mlKitTaskFeatures.any { statusFor(it) != FeatureStatus.UNAVAILABLE }
        val hasPromptSupport = promptStatus !is PromptApiStatus.NotAvailable
        val modelName = when {
            hasTaskSupport && hasPromptSupport -> "ML Kit GenAI + Prompt API"
            hasTaskSupport -> "ML Kit GenAI"
            hasPromptSupport -> "Prompt API (Gemini Nano)"
            else -> "None"
        }

        return DeviceCapability(
            platform = Platform.ANDROID,
            supportsOnDeviceAI = supportedFeatures.isNotEmpty(),
            availableFeatures = availableFeatures,
            featureCapabilities = availableFeatures.map { feature ->
                FeatureCapability(
                    feature = feature,
                    level = CapabilityLevel.FULL,
                    estimatedProcessingTimeMs = estimatedProcessingTime(feature),
                    maxInputLength = maxInputLength(feature)
                )
            },
            availableMemoryMB = availableMemoryMB,
            isLowPowerMode = isLowPowerMode,
            modelInfo = ModelInfo(
                name = modelName,
                version = null,
                sizeMB = null,
                isLoaded = availableFeatures.isNotEmpty(),
                geminiNanoAndroid = toGeminiNanoInfo()
            )
        )
    }
}

internal fun capabilityStateChanged(
    previous: DeviceCapability,
    current: DeviceCapability
): Boolean {
    return previous.supportsOnDeviceAI != current.supportsOnDeviceAI ||
        previous.availableFeatures != current.availableFeatures ||
        previous.featureCapabilities != current.featureCapabilities ||
        previous.isLowPowerMode != current.isLowPowerMode ||
        previous.modelInfo != current.modelInfo
}

internal fun meetsAndroidMinimumRequirements(
    apiLevel: Int,
    totalRAMMB: Int,
    capability: DeviceCapability
): Boolean {
    return apiLevel >= 26 && totalRAMMB >= 4 * 1024 && capability.supportsOnDeviceAI
}

internal suspend fun <T> mapCapabilityCheckFailure(block: suspend () -> T): T = try {
    block()
} catch (error: CancellationException) {
    throw error
} catch (error: LocanaraException) {
    throw error
} catch (error: Exception) {
    throw LocanaraException.ExecutionFailed("Failed to check device capabilities", error)
}

internal enum class GeminiDownloadAction {
    ALREADY_AVAILABLE,
    DOWNLOAD,
    IN_PROGRESS,
    UNSUPPORTED
}

internal fun PromptApiStatus.downloadAction(): GeminiDownloadAction = when (this) {
    is PromptApiStatus.Available -> GeminiDownloadAction.ALREADY_AVAILABLE
    is PromptApiStatus.Downloadable -> GeminiDownloadAction.DOWNLOAD
    is PromptApiStatus.Downloading -> GeminiDownloadAction.IN_PROGRESS
    is PromptApiStatus.NotAvailable -> GeminiDownloadAction.UNSUPPORTED
}

internal fun validateGeminiNanoVariant(variant: String?) {
    if (variant != null && variant != "default") {
        throw LocanaraException.InvalidInput(
            "Prompt API does not support selecting a Gemini Nano variant"
        )
    }
}

internal class GeminiNanoDownloadCoordinator {
    private val mutex = Mutex()

    suspend fun download(
        checkStatus: suspend () -> PromptApiStatus,
        downloadModel: suspend () -> Unit,
        updateStatus: suspend (PromptApiStatus) -> Unit
    ) {
        mutex.lock()
        try {
            val initialStatus = checkStatus()
            updateStatus(initialStatus)
            when (initialStatus.downloadAction()) {
                GeminiDownloadAction.ALREADY_AVAILABLE -> return
                GeminiDownloadAction.IN_PROGRESS -> throw LocanaraException.ModelBusy
                GeminiDownloadAction.UNSUPPORTED -> throw LocanaraException.DeviceNotSupported
                GeminiDownloadAction.DOWNLOAD -> Unit
            }

            updateStatus(PromptApiStatus.Downloading)
            try {
                downloadModel()
                val completedStatus = checkStatus()
                updateStatus(completedStatus)
                if (completedStatus !is PromptApiStatus.Available) {
                    throw LocanaraException.ExecutionFailed(
                        "Prompt API download completed without an available model"
                    )
                }
            } catch (error: CancellationException) {
                withContext(NonCancellable) {
                    updateStatus(initialStatus)
                }
                throw error
            } catch (error: Exception) {
                val recoveredStatus = try {
                    checkStatus()
                } catch (cancellation: CancellationException) {
                    withContext(NonCancellable) {
                        updateStatus(initialStatus)
                    }
                    throw cancellation
                } catch (recoveryError: Exception) {
                    if (recoveryError !== error) {
                        error.addSuppressed(recoveryError)
                    }
                    initialStatus
                }
                updateStatus(recoveredStatus)
                throw error
            }
        } finally {
            mutex.unlock()
        }
    }
}

internal class MLKitCapabilityProbe(private val context: Context) {
    suspend fun snapshot(): AndroidCapabilityStatusSnapshot {
        val clients = MLKitClients(context)
        val taskStatuses = try {
            mapOf(
                FeatureType.SUMMARIZE to probeFeatureStatus { clients.checkSummarizerStatus() },
                FeatureType.PROOFREAD to probeFeatureStatus { clients.checkProofreaderStatus() },
                FeatureType.REWRITE to probeFeatureStatus { clients.checkRewriterStatus() },
                FeatureType.DESCRIBE_IMAGE_ANDROID to probeFeatureStatus { clients.checkImageDescriberStatus() }
            )
        } finally {
            clients.close()
        }

        val promptClient = MLKitPromptClient(context)
        val promptStatus = try {
            probePromptStatus { promptClient.checkStatus() }
        } finally {
            promptClient.close()
        }

        return AndroidCapabilityStatusSnapshot(taskStatuses, promptStatus)
    }
}

internal suspend fun probeFeatureStatus(block: suspend () -> FeatureStatus): FeatureStatus = try {
    block()
} catch (error: CancellationException) {
    throw error
} catch (_: Exception) {
    FeatureStatus.UNAVAILABLE
}

internal suspend fun probePromptStatus(block: suspend () -> PromptApiStatus): PromptApiStatus = try {
    block()
} catch (error: CancellationException) {
    throw error
} catch (_: Exception) {
    PromptApiStatus.NotAvailable("Failed to check Prompt API status")
}

private fun PromptApiStatus.toFeatureStatus(): FeatureStatus = when (this) {
    is PromptApiStatus.Available -> FeatureStatus.AVAILABLE
    is PromptApiStatus.Downloadable -> FeatureStatus.DOWNLOADABLE
    is PromptApiStatus.Downloading -> FeatureStatus.DOWNLOADING
    is PromptApiStatus.NotAvailable -> FeatureStatus.UNAVAILABLE
}

private fun estimatedProcessingTime(feature: FeatureType): Int = when (feature) {
    FeatureType.SUMMARIZE -> 2000
    FeatureType.PROOFREAD -> 1000
    FeatureType.REWRITE -> 1500
    FeatureType.DESCRIBE_IMAGE_ANDROID -> 3000
    FeatureType.CHAT -> 1500
    FeatureType.CLASSIFY -> 1000
    FeatureType.EXTRACT -> 1500
    FeatureType.TRANSLATE -> 2000
    else -> 2000
}

private fun maxInputLength(feature: FeatureType): Int = when (feature) {
    FeatureType.SUMMARIZE -> 4000
    FeatureType.PROOFREAD,
    FeatureType.REWRITE -> 256
    else -> 4096
}
