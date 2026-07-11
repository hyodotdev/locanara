package expo.modules.ondeviceai

import com.locanara.ChatResult
import com.locanara.ClassifyParametersInput
import com.locanara.ClassifyResult
import com.locanara.ExecuteFeatureInput
import com.locanara.ExecutionResult
import com.locanara.ExtractParametersInput
import com.locanara.ExtractResult
import com.locanara.FeatureParametersInput
import com.locanara.FeatureType
import com.locanara.Locanara
import com.locanara.LocanaraException
import com.locanara.Platform
import com.locanara.ProofreadParametersInput
import com.locanara.ProofreadResult
import com.locanara.RewriteParametersInput
import com.locanara.RewriteResult
import com.locanara.SummarizeParametersInput
import com.locanara.SummarizeResult
import com.locanara.TranslateParametersInput
import com.locanara.TranslateResult
import com.locanara.mlkit.PromptApiStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class ExpoOndeviceAiModule : Module() {
    private val locanara: Locanara by lazy {
        Locanara.getInstance(
            appContext.reactContext?.applicationContext
                ?: throw IllegalStateException("React context is not available"),
        )
    }
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.Main)

    private inline fun <reified T> requireFeatureResult(
        execution: ExecutionResult,
        feature: FeatureType,
    ): T =
        execution.result as? T
            ?: throw LocanaraException.ExecutionFailed("Unexpected result for ${feature.name}")

    private suspend fun summarizeWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): SummarizeResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.SUMMARIZE,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            summarize =
                                SummarizeParametersInput(
                                    inputType = ExpoOndeviceAiHelper.summarizeInputType(options),
                                    outputType = ExpoOndeviceAiHelper.summarizeOutputType(options),
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.SUMMARIZE)
    }

    private suspend fun classifyWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): ClassifyResult {
        val (categories, maxResults) = ExpoOndeviceAiHelper.classifyOptions(options)
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.CLASSIFY,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            classify =
                                ClassifyParametersInput(
                                    categories = categories,
                                    maxResults = maxResults,
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.CLASSIFY)
    }

    private suspend fun extractWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): ExtractResult {
        val (entityTypes, extractKeyValues) = ExpoOndeviceAiHelper.extractOptions(options)
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.EXTRACT,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            extract =
                                ExtractParametersInput(
                                    entityTypes = entityTypes,
                                    extractKeyValues = extractKeyValues,
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.EXTRACT)
    }

    private suspend fun chatWithLocanara(
        message: String,
        options: Map<String, Any>?,
    ): ChatResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.CHAT,
                    input = message,
                    parameters =
                        FeatureParametersInput(
                            chat = ExpoOndeviceAiHelper.chatParameters(options),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.CHAT)
    }

    private suspend fun translateWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): TranslateResult {
        val (source, target) = ExpoOndeviceAiHelper.translateOptions(options)
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.TRANSLATE,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            translate =
                                TranslateParametersInput(
                                    sourceLanguage = source,
                                    targetLanguage = target,
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.TRANSLATE)
    }

    private suspend fun rewriteWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): RewriteResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.REWRITE,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            rewrite =
                                RewriteParametersInput(
                                    outputType = ExpoOndeviceAiHelper.rewriteStyle(options),
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.REWRITE)
    }

    private suspend fun proofreadWithLocanara(
        text: String,
        options: Map<String, Any>?,
    ): ProofreadResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.PROOFREAD,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            proofread =
                                ProofreadParametersInput(
                                    inputType = ExpoOndeviceAiHelper.proofreadInputType(options),
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.PROOFREAD)
    }

    override fun definition() =
        ModuleDefinition {
            Name("ExpoOndeviceAi")

            Events(
                "onChatStreamChunk",
                "onSummarizeStreamChunk",
                "onTranslateStreamChunk",
                "onRewriteStreamChunk",
                "onModelDownloadProgress",
            )

            OnDestroy {
                job.cancel("Module destroyed")
            }

            // MARK: - Model Management

            AsyncFunction("getAvailableModels") { promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model catalog is not supported on Android; use getPromptApiStatus()",
                    null,
                )
            }

            AsyncFunction("getDownloadedModels") { promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model management is not supported on Android; use getPromptApiStatus()",
                    null,
                )
            }

            AsyncFunction("getLoadedModel") { promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model management is not supported on Android; use getCurrentEngine()",
                    null,
                )
            }

            AsyncFunction("getCurrentEngine") { promise: Promise ->
                scope.launch {
                    try {
                        val engine =
                            when (locanara.recheckPromptApiStatus()) {
                                is PromptApiStatus.Available -> "prompt_api"
                                else -> "none"
                            }
                        promise.resolve(engine)
                    } catch (e: Exception) {
                        promise.reject("ERR_CURRENT_ENGINE", e.message, e)
                    }
                }
            }

            AsyncFunction("getPromptApiStatus") { promise: Promise ->
                scope.launch {
                    try {
                        val statusString =
                            when (locanara.recheckPromptApiStatus()) {
                                is PromptApiStatus.Available -> "available"
                                is PromptApiStatus.Downloadable -> "downloadable"
                                is PromptApiStatus.Downloading -> "downloading"
                                is PromptApiStatus.NotAvailable -> "not_available"
                            }
                        promise.resolve(statusString)
                    } catch (e: Exception) {
                        promise.reject("ERR_PROMPT_API_STATUS", e.message, e)
                    }
                }
            }

            AsyncFunction("downloadPromptApiModel") { promise: Promise ->
                scope.launch {
                    var totalBytes = 0L
                    var bytesDownloaded = 0L
                    var terminalEventSent = false

                    fun emitProgress(
                        state: String,
                        progress: Double,
                    ) {
                        sendEvent(
                            "onModelDownloadProgress",
                            mapOf(
                                "modelId" to "gemini-nano",
                                "bytesDownloaded" to bytesDownloaded,
                                "totalBytes" to totalBytes,
                                "progress" to progress,
                                "state" to state,
                            ),
                        )
                    }

                    try {
                        locanara.downloadPromptApiModel { progress ->
                            if (progress.bytesToDownload > 0) {
                                totalBytes = progress.bytesToDownload
                            }
                            if (progress.bytesDownloaded > 0) {
                                bytesDownloaded = progress.bytesDownloaded
                            }

                            val state =
                                when {
                                    progress.error != null -> "failed"
                                    progress.isCompleted -> "verifying"
                                    else -> "downloading"
                                }
                            if (state == "verifying" && totalBytes > 0) {
                                bytesDownloaded = totalBytes
                            }
                            val pct =
                                when {
                                    state == "verifying" -> 1.0
                                    totalBytes > 0 ->
                                        (bytesDownloaded.toDouble() / totalBytes.toDouble()).coerceIn(0.0, 1.0)
                                    else -> 0.0
                                }
                            terminalEventSent = state == "failed"
                            emitProgress(state, pct)
                        }
                        if (!terminalEventSent) {
                            if (totalBytes > 0) bytesDownloaded = totalBytes
                            emitProgress("completed", 1.0)
                        }
                        promise.resolve(true)
                    } catch (e: CancellationException) {
                        if (!terminalEventSent) emitProgress("cancelled", 0.0)
                        promise.reject("ERR_DOWNLOAD_CANCELLED", e.message, e)
                    } catch (e: Exception) {
                        if (!terminalEventSent) emitProgress("failed", 0.0)
                        promise.reject("ERR_DOWNLOAD_MODEL", e.message, e)
                    }
                }
            }

            AsyncFunction("downloadModel") { modelId: String, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model download is not supported on Android; use downloadPromptApiModel()",
                    null,
                )
            }

            AsyncFunction("loadModel") { modelId: String, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model loading is not supported on Android: $modelId",
                    null,
                )
            }

            AsyncFunction("deleteModel") { modelId: String, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "External model deletion is not supported on Android: $modelId",
                    null,
                )
            }

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
                scope.launch {
                    try {
                        val result = summarizeWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.summarize(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_SUMMARIZE", e.message, e)
                    }
                }
            }

            AsyncFunction("classify") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = classifyWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.classify(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_CLASSIFY", e.message, e)
                    }
                }
            }

            AsyncFunction("extract") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = extractWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.extract(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_EXTRACT", e.message, e)
                    }
                }
            }

            AsyncFunction("chat") { message: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = chatWithLocanara(message, options)
                        promise.resolve(ExpoOndeviceAiSerialization.chat(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_CHAT", e.message, e)
                    }
                }
            }

            AsyncFunction("chatStream") { message: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val parameters = ExpoOndeviceAiHelper.chatParameters(options)
                        var accumulated = ""
                        var conversationId = parameters.conversationId

                        locanara
                            .chatStream(
                                message = message,
                                systemPrompt = parameters.systemPrompt,
                                history = parameters.history,
                                conversationId = parameters.conversationId,
                            ).collect { chunk ->
                                accumulated = chunk.accumulated
                                conversationId = chunk.conversationId ?: conversationId
                                sendEvent(
                                    "onChatStreamChunk",
                                    mapOf(
                                        "delta" to chunk.delta,
                                        "accumulated" to chunk.accumulated,
                                        "isFinal" to chunk.isFinal,
                                        "conversationId" to chunk.conversationId,
                                    ),
                                )
                            }

                        promise.resolve(
                            mapOf(
                                "message" to accumulated,
                                "conversationId" to conversationId,
                                "canContinue" to true,
                            ),
                        )
                    } catch (e: Exception) {
                        promise.reject("ERR_CHAT_STREAM", e.message, e)
                    }
                }
            }

            AsyncFunction("translate") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = translateWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.translate(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_TRANSLATE", e.message, e)
                    }
                }
            }

            AsyncFunction("rewrite") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = rewriteWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.rewrite(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_REWRITE", e.message, e)
                    }
                }
            }

            AsyncFunction("proofread") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = proofreadWithLocanara(text, options)
                        promise.resolve(ExpoOndeviceAiSerialization.proofread(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_PROOFREAD", e.message, e)
                    }
                }
            }

            AsyncFunction("summarizeStreaming") { text: String, options: Map<String, Any>?, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "summarizeStreaming is not supported on Android",
                    null,
                )
            }

            AsyncFunction("translateStreaming") { text: String, options: Map<String, Any>?, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "translateStreaming is not supported on Android",
                    null,
                )
            }

            AsyncFunction("rewriteStreaming") { text: String, options: Map<String, Any>?, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "rewriteStreaming is not supported on Android",
                    null,
                )
            }

            AsyncFunction("describeImage") { _: String, _: Map<String, Any>?, promise: Promise ->
                promise.reject(
                    "ERR_UNSUPPORTED",
                    "describeImage is not supported by the Android wrapper because native image URIs are not bridged",
                    null,
                )
            }
        }
}
