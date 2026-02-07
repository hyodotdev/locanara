package expo.modules.ondeviceai

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.locanara.Locanara
import com.locanara.FeatureType
import com.locanara.Platform
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class ExpoOndeviceAiModule : Module() {
    private val locanara: Locanara by lazy {
        Locanara.getInstance(appContext.reactContext?.applicationContext
            ?: throw IllegalStateException("React context is not available"))
    }
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun definition() = ModuleDefinition {
        Name("ExpoOndeviceAi")

        Events("onChatStreamChunk")

        AsyncFunction("initialize") { promise: Promise ->
            scope.launch {
                try {
                    locanara.initializeSDK(Platform.ANDROID)
                    promise.resolve(mapOf("success" to true))
                } catch (e: Exception) {
                    promise.reject("ERR_INITIALIZE", e.message, e)
                }
            }
        }

        AsyncFunction("getDeviceCapability") { promise: Promise ->
            scope.launch {
                try {
                    val capability = locanara.getDeviceCapability()
                    promise.resolve(ExpoOndeviceAiSerialization.deviceCapability(capability))
                } catch (e: Exception) {
                    promise.reject("ERR_DEVICE_CAPABILITY", e.message, e)
                }
            }
        }

        AsyncFunction("summarize") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.SUMMARIZE, text, options, promise)
        }

        AsyncFunction("classify") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.CLASSIFY, text, options, promise)
        }

        AsyncFunction("extract") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.EXTRACT, text, options, promise)
        }

        AsyncFunction("chat") { message: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.CHAT, message, options, promise)
        }

        AsyncFunction("chatStream") { message: String, options: Map<String, Any>?, promise: Promise ->
            scope.launch {
                try {
                    val params = ExpoOndeviceAiHelper.decodeChatParameters(options)
                    var finalMessage = ""
                    var finalConversationId: String? = null

                    locanara.chatStream(
                        message = message,
                        systemPrompt = params?.systemPrompt,
                        history = params?.history,
                        conversationId = params?.conversationId
                    ).collect { chunk ->
                        sendEvent("onChatStreamChunk", mapOf(
                            "delta" to chunk.delta,
                            "accumulated" to chunk.accumulated,
                            "isFinal" to chunk.isFinal,
                            "conversationId" to chunk.conversationId
                        ))
                        if (chunk.isFinal) {
                            finalMessage = chunk.accumulated
                            finalConversationId = chunk.conversationId
                        }
                    }

                    promise.resolve(mapOf(
                        "message" to finalMessage,
                        "conversationId" to finalConversationId,
                        "canContinue" to true,
                        "suggestedPrompts" to listOf("Tell me more", "Can you explain?", "What else?")
                    ))
                } catch (e: Exception) {
                    promise.reject("ERR_CHAT_STREAM", e.message, e)
                }
            }
        }

        AsyncFunction("translate") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.TRANSLATE, text, options, promise)
        }

        AsyncFunction("rewrite") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.REWRITE, text, options, promise)
        }

        AsyncFunction("proofread") { text: String, options: Map<String, Any>?, promise: Promise ->
            executeFeature(FeatureType.PROOFREAD, text, options, promise)
        }
    }

    private fun executeFeature(
        feature: FeatureType,
        text: String,
        options: Map<String, Any>?,
        promise: Promise
    ) {
        scope.launch {
            try {
                val input = ExpoOndeviceAiHelper.buildFeatureInput(feature, text, options)
                val result = locanara.executeFeature(input)
                promise.resolve(ExpoOndeviceAiSerialization.result(result))
            } catch (e: Exception) {
                promise.reject("ERR_${feature.name}", e.message, e)
            }
        }
    }
}
