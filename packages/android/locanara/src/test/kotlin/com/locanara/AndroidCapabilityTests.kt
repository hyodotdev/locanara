package com.locanara

import com.locanara.mlkit.AndroidCapabilityStatusSnapshot
import com.locanara.mlkit.GeminiDownloadAction
import com.locanara.mlkit.GeminiNanoDownloadCoordinator
import com.locanara.mlkit.PromptApiStatus
import com.locanara.mlkit.capabilityStateChanged
import com.locanara.mlkit.downloadAction
import com.locanara.mlkit.mlKitTaskFeatures
import com.locanara.mlkit.mapCapabilityCheckFailure
import com.locanara.mlkit.meetsAndroidMinimumRequirements
import com.locanara.mlkit.probeFeatureStatus
import com.locanara.mlkit.promptApiFeatures
import com.locanara.mlkit.validateGeminiNanoVariant
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AndroidCapabilityTests {
    @Test
    fun `only available features are reported ready`() {
        val snapshot = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE) +
                (FeatureType.SUMMARIZE to FeatureStatus.AVAILABLE),
            promptStatus = PromptApiStatus.NotAvailable("unsupported")
        )

        val capability = snapshot.toDeviceCapability(availableMemoryMB = 4096, isLowPowerMode = false)

        assertTrue(capability.supportsOnDeviceAI)
        assertEquals(listOf(FeatureType.SUMMARIZE), capability.availableFeatures)
        assertEquals(CapabilityLevel.FULL, capability.featureCapabilities.single().level)
        assertTrue(capability.modelInfo?.isLoaded == true)
        assertFalse(capability.modelInfo?.geminiNanoAndroid?.isReady == true)
    }

    @Test
    fun `downloadable features are supported but not ready`() {
        val snapshot = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.DOWNLOADABLE),
            promptStatus = PromptApiStatus.Downloadable
        )

        val capability = snapshot.toDeviceCapability(availableMemoryMB = null, isLowPowerMode = true)

        assertTrue(capability.supportsOnDeviceAI)
        assertTrue(capability.availableFeatures.isEmpty())
        assertTrue(capability.featureCapabilities.isEmpty())
        assertFalse(capability.modelInfo?.isLoaded == true)
        assertFalse(capability.modelInfo?.geminiNanoAndroid?.isDownloaded == true)
        assertEquals(
            promptApiFeatures.map { it.name.lowercase() },
            capability.modelInfo?.geminiNanoAndroid?.capabilities
        )
    }

    @Test
    fun `unavailable snapshot does not advertise support`() {
        val snapshot = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE),
            promptStatus = PromptApiStatus.NotAvailable("unsupported")
        )

        val capability = snapshot.toDeviceCapability(availableMemoryMB = 1024, isLowPowerMode = false)

        assertFalse(capability.supportsOnDeviceAI)
        assertTrue(capability.availableFeatures.isEmpty())
        assertTrue(capability.featureCapabilities.isEmpty())
        assertEquals("None", capability.modelInfo?.name)
        assertFalse(capability.modelInfo?.isLoaded == true)
    }

    @Test
    fun `prompt availability fans out only to prompt features`() {
        val snapshot = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE) +
                (FeatureType.REWRITE to FeatureStatus.DOWNLOADING),
            promptStatus = PromptApiStatus.Available
        )

        val capability = snapshot.toDeviceCapability(availableMemoryMB = null, isLowPowerMode = false)

        assertEquals(promptApiFeatures, capability.availableFeatures)
        assertTrue(capability.modelInfo?.isLoaded == true)
        assertTrue(capability.modelInfo?.geminiNanoAndroid?.isDownloaded == true)
        assertTrue(capability.modelInfo?.geminiNanoAndroid?.isReady == true)
        assertTrue(capability.featureCapabilities.none { it.feature == FeatureType.REWRITE })
        assertEquals(
            CapabilityLevel.FULL,
            capability.featureCapabilities.single { it.feature == FeatureType.CHAT }.level
        )
    }

    @Test
    fun `capability events ignore free memory churn but retain readiness changes`() {
        val snapshot = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE),
            promptStatus = PromptApiStatus.Downloadable
        )
        val previous = snapshot.toDeviceCapability(availableMemoryMB = 4096, isLowPowerMode = false)
        val memoryOnly = snapshot.toDeviceCapability(availableMemoryMB = 2048, isLowPowerMode = false)
        val available = snapshot.copy(promptStatus = PromptApiStatus.Available)
            .toDeviceCapability(availableMemoryMB = 2048, isLowPowerMode = false)

        assertFalse(capabilityStateChanged(previous, memoryOnly))
        assertTrue(capabilityStateChanged(memoryOnly, available))
    }

    @Test
    fun `minimum requirements include verified on-device support`() {
        val unsupported = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE),
            promptStatus = PromptApiStatus.NotAvailable("unsupported")
        ).toDeviceCapability(availableMemoryMB = 8192, isLowPowerMode = false)
        val downloadable = AndroidCapabilityStatusSnapshot(
            taskStatuses = taskStatuses(FeatureStatus.UNAVAILABLE),
            promptStatus = PromptApiStatus.Downloadable
        ).toDeviceCapability(availableMemoryMB = 8192, isLowPowerMode = false)

        assertFalse(meetsAndroidMinimumRequirements(35, 8192, unsupported))
        assertTrue(meetsAndroidMinimumRequirements(35, 8192, downloadable))
        assertFalse(meetsAndroidMinimumRequirements(25, 8192, downloadable))
        assertFalse(meetsAndroidMinimumRequirements(35, 2048, downloadable))
    }

    @Test
    fun `download action never treats pending or unsupported as success`() {
        assertEquals(GeminiDownloadAction.ALREADY_AVAILABLE, PromptApiStatus.Available.downloadAction())
        assertEquals(GeminiDownloadAction.DOWNLOAD, PromptApiStatus.Downloadable.downloadAction())
        assertEquals(GeminiDownloadAction.IN_PROGRESS, PromptApiStatus.Downloading.downloadAction())
        assertEquals(
            GeminiDownloadAction.UNSUPPORTED,
            PromptApiStatus.NotAvailable("unsupported").downloadAction()
        )
    }

    @Test
    fun `only the OS managed default Gemini variant is accepted`() {
        validateGeminiNanoVariant(null)
        validateGeminiNanoVariant("default")

        try {
            validateGeminiNanoVariant("custom")
            throw AssertionError("Expected invalid variant to be rejected")
        } catch (error: LocanaraException.InvalidInput) {
            assertTrue(error.message?.contains("does not support selecting") == true)
        }
    }

    @Test
    fun `capability probing never converts cancellation into unavailable`() {
        try {
            runBlocking {
                probeFeatureStatus { throw CancellationException("cancelled") }
            }
            throw AssertionError("Expected cancellation to propagate")
        } catch (error: CancellationException) {
            assertEquals("cancelled", error.message)
        }
    }

    @Test
    fun `capability check maps upstream failures and preserves cancellation`() {
        val upstream = IllegalStateException("probe failed")
        try {
            runBlocking {
                mapCapabilityCheckFailure<Unit> { throw upstream }
            }
            throw AssertionError("Expected capability failure")
        } catch (error: LocanaraException.ExecutionFailed) {
            assertTrue(error.cause === upstream)
        }

        try {
            runBlocking {
                mapCapabilityCheckFailure<Unit> { throw CancellationException("cancelled") }
            }
            throw AssertionError("Expected cancellation")
        } catch (error: CancellationException) {
            assertEquals("cancelled", error.message)
        }
    }

    @Test
    fun `concurrent downloads are single flight and recheck readiness`() = runBlocking {
        val coordinator = GeminiNanoDownloadCoordinator()
        var status: PromptApiStatus = PromptApiStatus.Downloadable
        var downloadCount = 0

        val downloads = List(2) {
            async {
                coordinator.download(
                    checkStatus = { status },
                    downloadModel = {
                        downloadCount++
                        delay(25)
                        status = PromptApiStatus.Available
                    },
                    updateStatus = { status = it }
                )
            }
        }
        downloads.awaitAll()

        assertEquals(1, downloadCount)
        assertTrue(status is PromptApiStatus.Available)
    }

    @Test
    fun `download cancellation restores the verified starting status`() {
        val coordinator = GeminiNanoDownloadCoordinator()
        var publishedStatus: PromptApiStatus = PromptApiStatus.NotAvailable("unset")

        try {
            runBlocking {
                coordinator.download(
                    checkStatus = { PromptApiStatus.Downloadable },
                    downloadModel = { throw CancellationException("cancelled") },
                    updateStatus = { publishedStatus = it }
                )
            }
            throw AssertionError("Expected cancellation to propagate")
        } catch (error: CancellationException) {
            assertEquals("cancelled", error.message)
        }

        assertTrue(publishedStatus is PromptApiStatus.Downloadable)
    }

    @Test
    fun `download cancellation completes a suspending lifecycle restore`() = runBlocking {
        val coordinator = GeminiNanoDownloadCoordinator()
        var publishedStatus: PromptApiStatus = PromptApiStatus.NotAvailable("unset")
        val downloadStarted = kotlinx.coroutines.CompletableDeferred<Unit>()

        val download = launch {
            coordinator.download(
                checkStatus = { PromptApiStatus.Downloadable },
                downloadModel = {
                    downloadStarted.complete(Unit)
                    awaitCancellation()
                },
                updateStatus = {
                    delay(5)
                    publishedStatus = it
                }
            )
        }

        downloadStarted.await()
        assertTrue(publishedStatus is PromptApiStatus.Downloading)
        download.cancelAndJoin()

        assertTrue(publishedStatus is PromptApiStatus.Downloadable)
    }

    @Test
    fun `download failure publishes a live recovered status and preserves the error`() {
        val coordinator = GeminiNanoDownloadCoordinator()
        var statusChecks = 0
        var publishedStatus: PromptApiStatus = PromptApiStatus.NotAvailable("unset")
        val failure = IllegalStateException("download failed")

        try {
            runBlocking {
                coordinator.download(
                    checkStatus = {
                        statusChecks++
                        if (statusChecks == 1) {
                            PromptApiStatus.Downloadable
                        } else {
                            PromptApiStatus.NotAvailable("recovered")
                        }
                    },
                    downloadModel = { throw failure },
                    updateStatus = { publishedStatus = it }
                )
            }
            throw AssertionError("Expected download failure to propagate")
        } catch (error: IllegalStateException) {
            assertTrue(error === failure)
        }

        assertEquals(2, statusChecks)
        assertEquals(PromptApiStatus.NotAvailable("recovered"), publishedStatus)
    }

    @Test
    fun `download recovery check failure keeps verified status and original error`() {
        val coordinator = GeminiNanoDownloadCoordinator()
        var statusChecks = 0
        var publishedStatus: PromptApiStatus = PromptApiStatus.NotAvailable("unset")
        val downloadFailure = IllegalStateException("download failed")
        val recoveryFailure = IllegalArgumentException("status failed")

        try {
            runBlocking {
                coordinator.download(
                    checkStatus = {
                        statusChecks++
                        if (statusChecks == 1) PromptApiStatus.Downloadable else throw recoveryFailure
                    },
                    downloadModel = { throw downloadFailure },
                    updateStatus = { publishedStatus = it }
                )
            }
            throw AssertionError("Expected download failure to propagate")
        } catch (error: IllegalStateException) {
            assertTrue(error === downloadFailure)
            assertTrue(error.suppressed.single() === recoveryFailure)
        }

        assertEquals(PromptApiStatus.Downloadable, publishedStatus)
    }

    private fun taskStatuses(status: FeatureStatus): Map<FeatureType, FeatureStatus> =
        mlKitTaskFeatures.associateWith { status }
}
