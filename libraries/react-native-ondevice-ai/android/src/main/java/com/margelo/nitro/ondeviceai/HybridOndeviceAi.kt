package com.margelo.nitro.ondeviceai

import com.facebook.react.bridge.ReactApplicationContext
import com.locanara.ChatResult
import com.locanara.ClassifyParametersInput
import com.locanara.ClassifyResult
import com.locanara.ErrorCode
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
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.collect

class HybridOndeviceAi : HybridOndeviceAiSpec() {
    private val context: ReactApplicationContext by lazy {
        NitroModules.applicationContext as ReactApplicationContext
    }

    private val locanara: Locanara by lazy {
        Locanara.getInstance(context.applicationContext)
    }

    // Listener storage (thread-safe)
    private val chatStreamListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroChatStreamChunk) -> Unit>()
    private val summarizeStreamListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroTextStreamChunk) -> Unit>()
    private val translateStreamListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroTextStreamChunk) -> Unit>()
    private val rewriteStreamListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroTextStreamChunk) -> Unit>()
    private val modelDownloadProgressListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroModelDownloadProgress) -> Unit>()

    private inline fun <reified T> requireFeatureResult(
        execution: ExecutionResult,
        feature: FeatureType,
    ): T =
        execution.result as? T
            ?: throw LocanaraException.ExecutionFailed("Unexpected result for ${feature.name}")

    private suspend fun summarizeWithLocanara(
        text: String,
        options: Variant_NullType_NitroSummarizeOptions?,
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
                                    inputType = OndeviceAiHelper.summarizeInputType(options),
                                    outputType = OndeviceAiHelper.summarizeOutputType(options),
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.SUMMARIZE)
    }

    private suspend fun classifyWithLocanara(
        text: String,
        options: Variant_NullType_NitroClassifyOptions?,
    ): ClassifyResult {
        val (categories, maxResults) = OndeviceAiHelper.classifyOptions(options)
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
        options: Variant_NullType_NitroExtractOptions?,
    ): ExtractResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.EXTRACT,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            extract =
                                ExtractParametersInput(
                                    entityTypes = OndeviceAiHelper.entityTypes(options),
                                    extractKeyValues = false,
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.EXTRACT)
    }

    private suspend fun chatWithLocanara(
        message: String,
        options: Variant_NullType_NitroChatOptions?,
    ): ChatResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.CHAT,
                    input = message,
                    parameters =
                        FeatureParametersInput(
                            chat = OndeviceAiHelper.chatParameters(options),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.CHAT)
    }

    private suspend fun translateWithLocanara(
        text: String,
        options: NitroTranslateOptions,
    ): TranslateResult {
        val (source, target) = OndeviceAiHelper.translateOptions(options)
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
        options: NitroRewriteOptions,
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
                                    outputType = OndeviceAiHelper.rewriteStyle(options),
                                ),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.REWRITE)
    }

    private suspend fun proofreadWithLocanara(text: String): ProofreadResult {
        val execution =
            locanara.executeFeature(
                ExecuteFeatureInput(
                    feature = FeatureType.PROOFREAD,
                    input = text,
                    parameters =
                        FeatureParametersInput(
                            proofread = ProofreadParametersInput(),
                        ),
                ),
            )
        return requireFeatureResult(execution, FeatureType.PROOFREAD)
    }

    // ──────────────────────────────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────────────────────────────

    override fun initialize(): Promise<Boolean> =
        Promise.async {
            locanara.initializeSDK(Platform.ANDROID)
            true
        }

    override fun getDeviceCapability(): Promise<NitroDeviceCapability> =
        Promise.async {
            val capability = locanara.getDeviceCapability()
            val availableSet = capability.availableFeatures.toSet()

            NitroDeviceCapability(
                isSupported = OndeviceAiHelper.isWrapperSupported(capability),
                isModelReady = OndeviceAiHelper.isWrapperReady(capability),
                supportsAppleIntelligence = false,
                platform = OndeviceAiPlatform.GOOGLE,
                featureSummarize = availableSet.contains(FeatureType.SUMMARIZE),
                featureClassify = availableSet.contains(FeatureType.CLASSIFY),
                featureExtract = availableSet.contains(FeatureType.EXTRACT),
                featureChat = availableSet.contains(FeatureType.CHAT),
                featureTranslate = availableSet.contains(FeatureType.TRANSLATE),
                featureRewrite = availableSet.contains(FeatureType.REWRITE),
                featureProofread = availableSet.contains(FeatureType.PROOFREAD),
                availableMemoryMB = (capability.availableMemoryMB ?: 0).toDouble(),
                isLowPowerMode = capability.isLowPowerMode,
            )
        }

    // ──────────────────────────────────────────────────────────────────
    // AI Features
    // ──────────────────────────────────────────────────────────────────

    override fun summarize(
        text: String,
        options: Variant_NullType_NitroSummarizeOptions?,
    ): Promise<NitroSummarizeResult> =
        Promise.async {
            val result = summarizeWithLocanara(text, options)
            NitroSummarizeResult(
                summary = result.summary,
                originalLength = result.originalLength.toDouble(),
                summaryLength = result.summaryLength.toDouble(),
                confidence = result.confidence ?: 0.0,
            )
        }

    override fun classify(
        text: String,
        options: Variant_NullType_NitroClassifyOptions?,
    ): Promise<NitroClassifyResult> =
        Promise.async {
            val result = classifyWithLocanara(text, options)
            val classifications =
                result.classifications.map { c ->
                    NitroClassification(
                        label = c.label,
                        score = c.score,
                        metadata = c.metadata ?: "",
                    )
                }
            NitroClassifyResult(
                classifications = classifications.toTypedArray(),
                topLabel = result.topClassification.label,
                topScore = result.topClassification.score,
            )
        }

    override fun extract(
        text: String,
        options: Variant_NullType_NitroExtractOptions?,
    ): Promise<NitroExtractResult> =
        Promise.async {
            val result = extractWithLocanara(text, options)
            val entities =
                result.entities.map { e ->
                    NitroExtractEntity(
                        type = e.type,
                        value = e.value,
                        confidence = e.confidence,
                        startPos = (e.startPos ?: 0).toDouble(),
                        endPos = (e.endPos ?: 0).toDouble(),
                    )
                }
            NitroExtractResult(entities = entities.toTypedArray())
        }

    override fun chat(
        message: String,
        options: Variant_NullType_NitroChatOptions?,
    ): Promise<NitroChatResult> =
        Promise.async {
            val result = chatWithLocanara(message, options)
            NitroChatResult(
                message = result.message,
                conversationId = result.conversationId ?: "",
                canContinue = result.canContinue,
            )
        }

    override fun translate(
        text: String,
        options: NitroTranslateOptions,
    ): Promise<NitroTranslateResult> =
        Promise.async {
            val result = translateWithLocanara(text, options)
            NitroTranslateResult(
                translatedText = result.translatedText,
                sourceLanguage = result.sourceLanguage,
                targetLanguage = result.targetLanguage,
                confidence = result.confidence ?: 0.0,
            )
        }

    override fun rewrite(
        text: String,
        options: NitroRewriteOptions,
    ): Promise<NitroRewriteResult> =
        Promise.async {
            val result = rewriteWithLocanara(text, options)
            NitroRewriteResult(
                rewrittenText = result.rewrittenText,
                style = result.style?.name ?: "",
                confidence = result.confidence ?: 0.0,
            )
        }

    override fun proofread(text: String): Promise<NitroProofreadResult> =
        Promise.async {
            val result = proofreadWithLocanara(text)
            val corrections =
                result.corrections.map { c ->
                    NitroProofreadCorrection(
                        original = c.original,
                        corrected = c.corrected,
                        type = c.type ?: "",
                        confidence = c.confidence ?: 0.0,
                        startPos = (c.startPos ?: 0).toDouble(),
                        endPos = (c.endPos ?: 0).toDouble(),
                    )
                }
            NitroProofreadResult(
                correctedText = result.correctedText,
                corrections = corrections.toTypedArray(),
                hasCorrections = result.hasCorrections,
            )
        }

    // ──────────────────────────────────────────────────────────────────
    // Streaming Variants (Summarize / Translate / Rewrite)
    // Android does not expose these as streaming operations yet. Keep the
    // public surface explicit instead of simulating a stream with one chunk.
    // ──────────────────────────────────────────────────────────────────

    override fun summarizeStreaming(
        text: String,
        options: Variant_NullType_NitroSummarizeOptions?,
    ): Promise<NitroSummarizeResult> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "summarizeStreaming is not supported on Android",
            )
        }

    override fun addSummarizeStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        summarizeStreamListeners.add(listener)
    }

    override fun removeSummarizeStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        summarizeStreamListeners.remove(listener)
    }

    override fun translateStreaming(
        text: String,
        options: NitroTranslateOptions,
    ): Promise<NitroTranslateResult> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "translateStreaming is not supported on Android",
            )
        }

    override fun addTranslateStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        translateStreamListeners.add(listener)
    }

    override fun removeTranslateStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        translateStreamListeners.remove(listener)
    }

    override fun rewriteStreaming(
        text: String,
        options: NitroRewriteOptions,
    ): Promise<NitroRewriteResult> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "rewriteStreaming is not supported on Android",
            )
        }

    override fun addRewriteStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        rewriteStreamListeners.add(listener)
    }

    override fun removeRewriteStreamListener(listener: (NitroTextStreamChunk) -> Unit) {
        rewriteStreamListeners.remove(listener)
    }

    override fun describeImage(
        imageUri: String,
        options: Variant_NullType_NitroDescribeImageOptions?,
    ): Promise<NitroDescribeImageResult> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "describeImage is not supported by the Android wrapper because native image URIs are not bridged",
            )
        }

    // ──────────────────────────────────────────────────────────────────
    // Chat Streaming
    // ──────────────────────────────────────────────────────────────────

    override fun chatStream(
        message: String,
        options: Variant_NullType_NitroChatOptions?,
    ): Promise<NitroChatResult> =
        Promise.async {
            val parameters = OndeviceAiHelper.chatParameters(options)
            var accumulated = ""

            locanara
                .chatStream(
                    message = message,
                    systemPrompt = parameters.systemPrompt,
                    history = parameters.history,
                ).collect { chunk ->
                    accumulated = chunk.accumulated
                    val streamChunk =
                        NitroChatStreamChunk(
                            delta = chunk.delta,
                            accumulated = chunk.accumulated,
                            isFinal = chunk.isFinal,
                        )
                    chatStreamListeners.forEach { it(streamChunk) }
                }

            NitroChatResult(
                message = accumulated,
                conversationId = "",
                canContinue = true,
            )
        }

    override fun addChatStreamListener(listener: (NitroChatStreamChunk) -> Unit) {
        chatStreamListeners.add(listener)
    }

    override fun removeChatStreamListener(listener: (NitroChatStreamChunk) -> Unit) {
        chatStreamListeners.remove(listener)
    }

    // ──────────────────────────────────────────────────────────────────
    // Model Management (Android: Prompt API only, no external models)
    // ──────────────────────────────────────────────────────────────────

    override fun getAvailableModels(): Promise<Array<NitroModelInfo>> = Promise.async { emptyArray() }

    override fun getDownloadedModels(): Promise<Array<String>> = Promise.async { emptyArray() }

    override fun getLoadedModel(): Promise<String> = Promise.async { "" }

    override fun getCurrentEngine(): Promise<NitroInferenceEngine> =
        Promise.async {
            when (locanara.recheckPromptApiStatus()) {
                is PromptApiStatus.Available -> NitroInferenceEngine.PROMPT_API
                else -> NitroInferenceEngine.NONE
            }
        }

    override fun downloadModel(modelId: String): Promise<Boolean> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "External model download is not supported on Android; use downloadPromptApiModel()",
            )
        }

    override fun addModelDownloadProgressListener(listener: (NitroModelDownloadProgress) -> Unit) {
        modelDownloadProgressListeners.add(listener)
    }

    override fun removeModelDownloadProgressListener(listener: (NitroModelDownloadProgress) -> Unit) {
        modelDownloadProgressListeners.remove(listener)
    }

    override fun loadModel(modelId: String): Promise<Unit> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "External model loading is not supported on Android: $modelId",
            )
        }

    override fun deleteModel(modelId: String): Promise<Unit> =
        Promise.async {
            throw LocanaraException.Custom(
                ErrorCode.FEATURE_NOT_SUPPORTED,
                "External model deletion is not supported on Android: $modelId",
            )
        }

    // ──────────────────────────────────────────────────────────────────
    // Android-specific: Prompt API
    // ──────────────────────────────────────────────────────────────────

    override fun getPromptApiStatus(): Promise<String> =
        Promise.async {
            when (locanara.recheckPromptApiStatus()) {
                is PromptApiStatus.Available -> "available"
                is PromptApiStatus.Downloadable -> "downloadable"
                is PromptApiStatus.Downloading -> "downloading"
                is PromptApiStatus.NotAvailable -> "not_available"
            }
        }

    override fun downloadPromptApiModel(): Promise<Boolean> =
        Promise.async {
            var totalBytes = 0.0
            var bytesDownloaded = 0.0
            var terminalEventSent = false

            fun emitProgress(
                state: NitroModelDownloadState,
                progress: Double,
            ) {
                val event =
                    NitroModelDownloadProgress(
                        modelId = "gemini-nano",
                        bytesDownloaded = bytesDownloaded,
                        totalBytes = totalBytes,
                        progress = progress,
                        state = state,
                    )
                modelDownloadProgressListeners.forEach { it(event) }
            }

            try {
                locanara.downloadPromptApiModel { progress ->
                    if (progress.bytesToDownload > 0) {
                        totalBytes = progress.bytesToDownload.toDouble()
                    }
                    if (progress.bytesDownloaded > 0) {
                        bytesDownloaded = progress.bytesDownloaded.toDouble()
                    }

                    val state =
                        when {
                            progress.error != null -> NitroModelDownloadState.FAILED
                            progress.isCompleted -> NitroModelDownloadState.VERIFYING
                            else -> NitroModelDownloadState.DOWNLOADING
                        }
                    if (state == NitroModelDownloadState.VERIFYING && totalBytes > 0) {
                        bytesDownloaded = totalBytes
                    }
                    val pct =
                        when {
                            state == NitroModelDownloadState.VERIFYING -> 1.0
                            totalBytes > 0 -> (bytesDownloaded / totalBytes).coerceIn(0.0, 1.0)
                            else -> 0.0
                        }
                    terminalEventSent = state == NitroModelDownloadState.FAILED
                    emitProgress(state, pct)
                }

                if (!terminalEventSent) {
                    if (totalBytes > 0) bytesDownloaded = totalBytes
                    emitProgress(NitroModelDownloadState.COMPLETED, 1.0)
                }
            } catch (error: CancellationException) {
                if (!terminalEventSent) emitProgress(NitroModelDownloadState.CANCELLED, 0.0)
                throw error
            } catch (error: Exception) {
                if (!terminalEventSent) emitProgress(NitroModelDownloadState.FAILED, 0.0)
                throw error
            }

            true
        }
}
