package com.margelo.nitro.ondeviceai

import com.facebook.react.bridge.ReactApplicationContext
import com.locanara.DeviceCapability
import com.locanara.FeatureType
import com.locanara.Locanara
import com.locanara.Platform
import com.locanara.builtin.ChatChain
import com.locanara.builtin.ClassifyChain
import com.locanara.builtin.ExtractChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import com.locanara.core.LocanaraDefaults
import com.locanara.mlkit.PromptApiStatus
import com.locanara.platform.PromptApiModel
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class HybridOndeviceAi : HybridOndeviceAiSpec() {

    private val context: ReactApplicationContext by lazy {
        NitroModules.applicationContext as ReactApplicationContext
    }

    private val locanara: Locanara by lazy {
        Locanara.getInstance(context.applicationContext)
    }

    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.Main)

    // Listener storage (thread-safe)
    private val chatStreamListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroChatStreamChunk) -> Unit>()
    private val modelDownloadProgressListeners = java.util.concurrent.CopyOnWriteArrayList<(NitroModelDownloadProgress) -> Unit>()

    // ──────────────────────────────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────────────────────────────

    override fun initialize(): Promise<Boolean> {
        return Promise.async {
            locanara.initializeSDK(Platform.ANDROID)
            LocanaraDefaults.model = PromptApiModel(context.applicationContext)
            true
        }
    }

    override fun getDeviceCapability(): Promise<NitroDeviceCapability> {
        return Promise.async {
            val capability = locanara.getDeviceCapability()
            val availableSet = capability.availableFeatures.toSet()

            NitroDeviceCapability(
                isSupported = capability.supportsOnDeviceAI,
                isModelReady = capability.modelInfo?.isLoaded == true,
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
    }

    // ──────────────────────────────────────────────────────────────────
    // AI Features
    // ──────────────────────────────────────────────────────────────────

    override fun summarize(text: String, options: Variant_NullType_NitroSummarizeOptions?): Promise<NitroSummarizeResult> {
        return Promise.async {
            val bulletCount = OndeviceAiHelper.bulletCount(options)
            val inputType = OndeviceAiHelper.inputType(options)
            val result = SummarizeChain(bulletCount = bulletCount, inputType = inputType).run(text)
            NitroSummarizeResult(
                summary = result.summary,
                originalLength = result.originalLength.toDouble(),
                summaryLength = result.summaryLength.toDouble(),
                confidence = result.confidence ?: 0.0,
            )
        }
    }

    override fun classify(text: String, options: Variant_NullType_NitroClassifyOptions?): Promise<NitroClassifyResult> {
        return Promise.async {
            val (categories, maxResults) = OndeviceAiHelper.classifyOptions(options)
            val result = ClassifyChain(categories = categories, maxResults = maxResults).run(text)
            val classifications = result.classifications.map { c ->
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
    }

    override fun extract(text: String, options: Variant_NullType_NitroExtractOptions?): Promise<NitroExtractResult> {
        return Promise.async {
            val entityTypes = OndeviceAiHelper.entityTypes(options)
            val result = ExtractChain(entityTypes = entityTypes).run(text)
            val entities = result.entities.map { e ->
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
    }

    override fun chat(message: String, options: Variant_NullType_NitroChatOptions?): Promise<NitroChatResult> {
        return Promise.async {
            val (systemPrompt, memory) = OndeviceAiHelper.chatOptions(options)
            val result = ChatChain(memory = memory, systemPrompt = systemPrompt).run(message)
            NitroChatResult(
                message = result.message,
                conversationId = result.conversationId ?: "",
                canContinue = result.canContinue,
            )
        }
    }

    override fun translate(text: String, options: NitroTranslateOptions): Promise<NitroTranslateResult> {
        return Promise.async {
            val (source, target) = OndeviceAiHelper.translateOptions(options)
            val result = TranslateChain(sourceLanguage = source, targetLanguage = target).run(text)
            NitroTranslateResult(
                translatedText = result.translatedText,
                sourceLanguage = result.sourceLanguage,
                targetLanguage = result.targetLanguage,
                confidence = result.confidence ?: 0.0,
            )
        }
    }

    override fun rewrite(text: String, options: NitroRewriteOptions): Promise<NitroRewriteResult> {
        return Promise.async {
            val style = OndeviceAiHelper.rewriteStyle(options)
            val result = RewriteChain(style = style).run(text)
            NitroRewriteResult(
                rewrittenText = result.rewrittenText,
                style = result.style?.name ?: "",
                confidence = result.confidence ?: 0.0,
            )
        }
    }

    override fun proofread(text: String): Promise<NitroProofreadResult> {
        return Promise.async {
            val result = ProofreadChain().run(text)
            val corrections = result.corrections.map { c ->
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
    }

    // ──────────────────────────────────────────────────────────────────
    // Chat Streaming
    // ──────────────────────────────────────────────────────────────────

    override fun chatStream(message: String, options: Variant_NullType_NitroChatOptions?): Promise<NitroChatResult> {
        return Promise.async {
            val (systemPrompt, memory) = OndeviceAiHelper.chatOptions(options)
            val chain = ChatChain(memory = memory, systemPrompt = systemPrompt)
            var accumulated = ""

            chain.streamRun(message).collect { chunk ->
                accumulated += chunk
                val streamChunk = NitroChatStreamChunk(
                    delta = chunk,
                    accumulated = accumulated,
                    isFinal = false,
                )
                chatStreamListeners.forEach { it(streamChunk) }
            }

            // Send final chunk
            val finalChunk = NitroChatStreamChunk(
                delta = "",
                accumulated = accumulated,
                isFinal = true,
            )
            chatStreamListeners.forEach { it(finalChunk) }

            NitroChatResult(
                message = accumulated,
                conversationId = "",
                canContinue = true,
            )
        }
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

    override fun getAvailableModels(): Promise<Array<NitroModelInfo>> {
        return Promise.async { emptyArray() }
    }

    override fun getDownloadedModels(): Promise<Array<String>> {
        return Promise.async { emptyArray() }
    }

    override fun getLoadedModel(): Promise<String> {
        return Promise.async { "" }
    }

    override fun getCurrentEngine(): Promise<NitroInferenceEngine> {
        return Promise.async {
            val status = locanara.getPromptApiStatus()
            if (status is PromptApiStatus.Available) {
                NitroInferenceEngine.PROMPT_API
            } else {
                NitroInferenceEngine.NONE
            }
        }
    }

    override fun downloadModel(modelId: String): Promise<Boolean> {
        return Promise.async {
            throw Exception("Model downloads are not supported on Android. Use downloadPromptApiModel() instead.")
        }
    }

    override fun addModelDownloadProgressListener(listener: (NitroModelDownloadProgress) -> Unit) {
        modelDownloadProgressListeners.add(listener)
    }

    override fun removeModelDownloadProgressListener(listener: (NitroModelDownloadProgress) -> Unit) {
        modelDownloadProgressListeners.remove(listener)
    }

    override fun loadModel(modelId: String): Promise<Unit> {
        return Promise.async {
            throw Exception("Model loading is not supported on Android.")
        }
    }

    override fun deleteModel(modelId: String): Promise<Unit> {
        return Promise.async {
            throw Exception("Model deletion is not supported on Android.")
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Android-specific: Prompt API
    // ──────────────────────────────────────────────────────────────────

    override fun getPromptApiStatus(): Promise<String> {
        return Promise.async {
            when (locanara.getPromptApiStatus()) {
                is PromptApiStatus.Available -> "available"
                is PromptApiStatus.Downloadable -> "downloadable"
                is PromptApiStatus.Downloading -> "downloading"
                is PromptApiStatus.NotAvailable -> "not_available"
            }
        }
    }

    override fun downloadPromptApiModel(): Promise<Boolean> {
        return Promise.async {
            locanara.downloadPromptApiModel { progress ->
                val pct = if (progress.bytesToDownload > 0) {
                    progress.bytesDownloaded.toDouble() / progress.bytesToDownload.toDouble()
                } else {
                    0.0
                }
                val p = NitroModelDownloadProgress(
                    modelId = "gemini-nano",
                    bytesDownloaded = progress.bytesDownloaded.toDouble(),
                    totalBytes = progress.bytesToDownload.toDouble(),
                    progress = pct,
                    state = NitroModelDownloadState.DOWNLOADING,
                )
                modelDownloadProgressListeners.forEach { it(p) }
            }

            // Send completed event
            val completedProgress = NitroModelDownloadProgress(
                modelId = "gemini-nano",
                bytesDownloaded = 0.0,
                totalBytes = 0.0,
                progress = 1.0,
                state = NitroModelDownloadState.COMPLETED,
            )
            modelDownloadProgressListeners.forEach { it(completedProgress) }

            true
        }
    }
}
