package expo.modules.ondeviceai

import android.app.ActivityManager
import android.content.Context
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
import com.locanara.engine.ModelRegistry
import com.locanara.mlkit.PromptApiStatus
import com.locanara.platform.PromptApiModel
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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

    // Simulated model state (matches native example behavior)
    private val downloadedModelIds = mutableSetOf<String>()
    private var loadedModelId: String? = null

    private fun getDeviceMemoryMB(context: Context): Int {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)
        return (memInfo.totalMem / (1024 * 1024)).toInt()
    }

    override fun definition() =
        ModuleDefinition {
            Name("ExpoOndeviceAi")

            Events("onChatStreamChunk", "onModelDownloadProgress")

            OnDestroy {
                job.cancel("Module destroyed")
            }

            // MARK: - Model Management

            AsyncFunction("getAvailableModels") { promise: Promise ->
                val context = appContext.reactContext?.applicationContext
                    ?: throw IllegalStateException("React context is not available")
                val memoryMB = getDeviceMemoryMB(context)
                val models = ModelRegistry.getCompatibleModels(memoryMB)
                promise.resolve(models.map { ExpoOndeviceAiSerialization.modelInfo(it) })
            }

            AsyncFunction("getDownloadedModels") { promise: Promise ->
                promise.resolve(downloadedModelIds.toList())
            }

            AsyncFunction("getLoadedModel") { promise: Promise ->
                promise.resolve(loadedModelId)
            }

            AsyncFunction("getCurrentEngine") { promise: Promise ->
                val status = locanara.getPromptApiStatus()
                val engine = when (status) {
                    is PromptApiStatus.Available,
                    is PromptApiStatus.Downloadable,
                    is PromptApiStatus.Downloading -> "prompt_api"
                    else -> "none"
                }
                promise.resolve(engine)
            }

            AsyncFunction("getPromptApiStatus") { promise: Promise ->
                val status = locanara.getPromptApiStatus()
                val statusString =
                    when (status) {
                        is PromptApiStatus.Available -> "available"
                        is PromptApiStatus.Downloadable -> "downloadable"
                        is PromptApiStatus.Downloading -> "downloading"
                        is PromptApiStatus.NotAvailable -> "not_available"
                    }
                promise.resolve(statusString)
            }

            AsyncFunction("downloadPromptApiModel") { promise: Promise ->
                scope.launch {
                    try {
                        locanara.downloadPromptApiModel { progress ->
                            val pct =
                                if (progress.bytesToDownload > 0) {
                                    progress.bytesDownloaded.toDouble() / progress.bytesToDownload.toDouble()
                                } else {
                                    0.0
                                }
                            sendEvent(
                                "onModelDownloadProgress",
                                mapOf(
                                    "modelId" to "gemini-nano",
                                    "bytesDownloaded" to progress.bytesDownloaded,
                                    "totalBytes" to progress.bytesToDownload,
                                    "progress" to pct,
                                    "state" to "downloading",
                                ),
                            )
                        }
                        sendEvent(
                            "onModelDownloadProgress",
                            mapOf(
                                "modelId" to "gemini-nano",
                                "bytesDownloaded" to 0L,
                                "totalBytes" to 0L,
                                "progress" to 1.0,
                                "state" to "completed",
                            ),
                        )
                        promise.resolve(true)
                    } catch (e: Exception) {
                        promise.reject("ERR_DOWNLOAD_MODEL", e.message, e)
                    }
                }
            }

            AsyncFunction("downloadModel") { modelId: String, promise: Promise ->
                val model = ModelRegistry.getModel(modelId)
                if (model == null) {
                    promise.reject("ERR_NOT_FOUND", "Model not found: $modelId", null)
                    return@AsyncFunction
                }
                android.util.Log.d("ExpoOndeviceAi", "downloadModel: $modelId (${model.name}, ${model.sizeMB}MB) — simulated")
                downloadedModelIds.add(modelId)
                promise.resolve(true)
            }

            AsyncFunction("loadModel") { modelId: String, promise: Promise ->
                if (!downloadedModelIds.contains(modelId)) {
                    promise.reject("ERR_NOT_DOWNLOADED", "Model not downloaded: $modelId", null)
                    return@AsyncFunction
                }
                android.util.Log.d("ExpoOndeviceAi", "loadModel: $modelId — simulated")
                loadedModelId = modelId
                promise.resolve(null)
            }

            AsyncFunction("deleteModel") { modelId: String, promise: Promise ->
                android.util.Log.d("ExpoOndeviceAi", "deleteModel: $modelId — simulated")
                downloadedModelIds.remove(modelId)
                if (loadedModelId == modelId) loadedModelId = null
                promise.resolve(null)
            }

            AsyncFunction("initialize") { promise: Promise ->
                scope.launch {
                    try {
                        locanara.initializeSDK(Platform.ANDROID)
                        val context =
                            appContext.reactContext?.applicationContext
                                ?: throw IllegalStateException("React context is not available")
                        LocanaraDefaults.model = PromptApiModel(context)
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
                        val bulletCount = ExpoOndeviceAiHelper.bulletCount(options)
                        val inputType = ExpoOndeviceAiHelper.inputType(options)
                        val result = SummarizeChain(bulletCount = bulletCount, inputType = inputType).run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.summarize(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_SUMMARIZE", e.message, e)
                    }
                }
            }

            AsyncFunction("classify") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val (categories, maxResults) = ExpoOndeviceAiHelper.classifyOptions(options)
                        val result = ClassifyChain(categories = categories, maxResults = maxResults).run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.classify(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_CLASSIFY", e.message, e)
                    }
                }
            }

            AsyncFunction("extract") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val entityTypes = ExpoOndeviceAiHelper.entityTypes(options)
                        val result = ExtractChain(entityTypes = entityTypes).run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.extract(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_EXTRACT", e.message, e)
                    }
                }
            }

            AsyncFunction("chat") { message: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val (systemPrompt, memory) = ExpoOndeviceAiHelper.chatOptions(options)
                        val result = ChatChain(memory = memory, systemPrompt = systemPrompt).run(message)
                        promise.resolve(ExpoOndeviceAiSerialization.chat(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_CHAT", e.message, e)
                    }
                }
            }

            AsyncFunction("chatStream") { message: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val (systemPrompt, memory) = ExpoOndeviceAiHelper.chatOptions(options)
                        val chain = ChatChain(memory = memory, systemPrompt = systemPrompt)
                        var accumulated = ""

                        chain.streamRun(message).collect { chunk ->
                            accumulated += chunk
                            sendEvent(
                                "onChatStreamChunk",
                                mapOf(
                                    "delta" to chunk,
                                    "accumulated" to accumulated,
                                    "isFinal" to false,
                                    "conversationId" to null,
                                ),
                            )
                        }

                        sendEvent(
                            "onChatStreamChunk",
                            mapOf(
                                "delta" to "",
                                "accumulated" to accumulated,
                                "isFinal" to true,
                                "conversationId" to null,
                            ),
                        )

                        promise.resolve(
                            mapOf(
                                "message" to accumulated,
                                "conversationId" to null,
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
                        val (source, target) = ExpoOndeviceAiHelper.translateOptions(options)
                        val result = TranslateChain(sourceLanguage = source, targetLanguage = target).run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.translate(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_TRANSLATE", e.message, e)
                    }
                }
            }

            AsyncFunction("rewrite") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val style = ExpoOndeviceAiHelper.rewriteStyle(options)
                        val result = RewriteChain(style = style).run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.rewrite(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_REWRITE", e.message, e)
                    }
                }
            }

            AsyncFunction("proofread") { text: String, options: Map<String, Any>?, promise: Promise ->
                scope.launch {
                    try {
                        val result = ProofreadChain().run(text)
                        promise.resolve(ExpoOndeviceAiSerialization.proofread(result))
                    } catch (e: Exception) {
                        promise.reject("ERR_PROOFREAD", e.message, e)
                    }
                }
            }
        }
}
