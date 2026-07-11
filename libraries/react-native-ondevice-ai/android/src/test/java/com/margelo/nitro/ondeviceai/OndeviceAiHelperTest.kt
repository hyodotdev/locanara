package com.margelo.nitro.ondeviceai

import com.locanara.DeviceCapability
import com.locanara.FeatureType
import com.locanara.GeminiNanoInfoAndroid
import com.locanara.ModelInfo
import com.locanara.Platform
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OndeviceAiHelperTest {
    @Test
    fun `chat parameters preserve the conversation ID`() {
        val options =
            Variant_NullType_NitroChatOptions.Second(
                NitroChatOptions(
                    conversationId = Variant_NullType_String.Second("conversation-123"),
                    systemPrompt = null,
                    history = null,
                ),
            )

        val parameters = OndeviceAiHelper.chatParameters(options)

        assertEquals("conversation-123", parameters.conversationId)
    }

    @Test
    fun `image-only capability is not exposed as wrapper support`() {
        val capability =
            capability(
                availableFeatures = listOf(FeatureType.DESCRIBE_IMAGE_ANDROID),
                promptCapabilities = emptyList(),
            )

        assertFalse(OndeviceAiHelper.isWrapperSupported(capability))
        assertFalse(OndeviceAiHelper.isWrapperReady(capability))
    }

    @Test
    fun `pending prompt model remains supported but not ready`() {
        val capability =
            capability(
                availableFeatures = emptyList(),
                promptCapabilities = listOf("chat"),
            )

        assertTrue(OndeviceAiHelper.isWrapperSupported(capability))
        assertFalse(OndeviceAiHelper.isWrapperReady(capability))
    }

    @Test
    fun `ready wrapper feature is supported and ready`() {
        val capability =
            capability(
                availableFeatures = listOf(FeatureType.SUMMARIZE),
                promptCapabilities = emptyList(),
            )

        assertTrue(OndeviceAiHelper.isWrapperSupported(capability))
        assertTrue(OndeviceAiHelper.isWrapperReady(capability))
    }

    private fun capability(
        availableFeatures: List<FeatureType>,
        promptCapabilities: List<String>,
    ): DeviceCapability =
        DeviceCapability(
            platform = Platform.ANDROID,
            supportsOnDeviceAI = true,
            availableFeatures = availableFeatures,
            featureCapabilities = emptyList(),
            availableMemoryMB = 4096,
            isLowPowerMode = false,
            modelInfo =
                ModelInfo(
                    name = "test",
                    isLoaded = availableFeatures.isNotEmpty(),
                    geminiNanoAndroid =
                        GeminiNanoInfoAndroid(
                            version = "unknown",
                            supportedLanguages = emptyList(),
                            capabilities = promptCapabilities,
                            isDownloaded = false,
                            isReady = false,
                        ),
                ),
        )
}
