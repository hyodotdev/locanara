package dev.hyodot.flutter_ondevice_ai

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
import com.locanara.engine.ExecuTorchEngine
import com.locanara.engine.ModelRegistry
import com.locanara.mlkit.PromptApiStatus
import com.locanara.platform.PromptApiModel
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

private const val TAG = "[FlutterOndeviceAi]"

class FlutterOndeviceAiPlugin : FlutterPlugin, MethodCallHandler {
    private var channel: MethodChannel? = null
    private var chatStreamChannel: EventChannel? = null
    private var downloadProgressChannel: EventChannel? = null
    private var chatStreamSink: EventChannel.EventSink? = null
    private var downloadProgressSink: EventChannel.EventSink? = null
    private var context: Context? = null
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.Main)

    private val locanara: Locanara by lazy {
        Locanara.getInstance(context!!)
    }

    // Model management state
    private var loadedModelId: String? = null
    private var activeModelWrapper: ExecuTorchModelWrapper? = null
    private var promptApiModel: PromptApiModel? = null  // saved reference for switchToDeviceAI

    /**
     * Override download URLs for models whose SDK-bundled URLs require authentication.
     * The SDK's ModelRegistry is compiled into the Maven artifact so we patch URLs here.
     */
    private data class ModelURLOverride(
        val downloadURL: String,
        val tokenizerURL: String,
        val sizeMB: Int
    )

    private val modelURLOverrides = mapOf(
        "llama-3.2-3b-instruct" to ModelURLOverride(
            downloadURL = "https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/main/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte",
            tokenizerURL = "https://huggingface.co/executorch-community/Llama-3.2-1B-ET/resolve/main/tokenizer.model",
            sizeMB = 2550
        )
    )

    /** Directory where downloaded models are stored */
    private fun modelsDir(): File = File(context!!.filesDir, "locanara/models")

    /** Directory for a specific model */
    private fun modelDir(modelId: String): File = File(modelsDir(), modelId)

    /** Check which models have been downloaded to disk */
    private fun getDownloadedModelIdsFromDisk(): List<String> {
        val dir = modelsDir()
        if (!dir.exists()) return emptyList()
        return dir.listFiles()
            ?.filter { it.isDirectory && File(it, "model.pte").exists() }
            ?.map { it.name }
            ?: emptyList()
    }

    private fun getDeviceMemoryMB(): Int {
        val am = context!!.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)
        return (memInfo.totalMem / (1024 * 1024)).toInt()
    }

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        context = binding.applicationContext

        channel = MethodChannel(binding.binaryMessenger, "flutter_ondevice_ai")
        channel?.setMethodCallHandler(this)

        chatStreamChannel = EventChannel(binding.binaryMessenger, "flutter_ondevice_ai/chat_stream")
        chatStreamChannel?.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                chatStreamSink = events
            }
            override fun onCancel(arguments: Any?) {
                chatStreamSink = null
            }
        })

        downloadProgressChannel = EventChannel(binding.binaryMessenger, "flutter_ondevice_ai/model_download_progress")
        downloadProgressChannel?.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                downloadProgressSink = events
            }
            override fun onCancel(arguments: Any?) {
                downloadProgressSink = null
            }
        })
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        activeModelWrapper?.unload()
        activeModelWrapper = null
        loadedModelId = null
        channel?.setMethodCallHandler(null)
        channel = null
        chatStreamChannel?.setStreamHandler(null)
        chatStreamChannel = null
        downloadProgressChannel?.setStreamHandler(null)
        downloadProgressChannel = null
        job.cancel("Plugin detached")
    }

    override fun onMethodCall(call: MethodCall, result: Result) {
        scope.launch {
            handleMethodCall(call, result)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleMethodCall(call: MethodCall, result: Result) {
        when (call.method) {
            "initialize" -> handleInitialize(result)
            "getDeviceCapability" -> handleGetDeviceCapability(result)
            "summarize" -> handleSummarize(call, result)
            "classify" -> handleClassify(call, result)
            "extract" -> handleExtract(call, result)
            "chat" -> handleChat(call, result)
            "chatStream" -> handleChatStream(call, result)
            "translate" -> handleTranslate(call, result)
            "rewrite" -> handleRewrite(call, result)
            "proofread" -> handleProofread(call, result)
            "getAvailableModels" -> handleGetAvailableModels(result)
            "getDownloadedModels" -> handleGetDownloadedModels(result)
            "getLoadedModel" -> handleGetLoadedModel(result)
            "getCurrentEngine" -> handleGetCurrentEngine(result)
            "downloadModel" -> handleDownloadModel(call, result)
            "loadModel" -> handleLoadModel(call, result)
            "deleteModel" -> handleDeleteModel(call, result)
            "getPromptApiStatus" -> handleGetPromptApiStatus(result)
            "downloadPromptApiModel" -> handleDownloadPromptApiModel(result)
            "switchToDeviceAI" -> handleSwitchToDeviceAI(result)
            else -> result.notImplemented()
        }
    }

    // region Core

    private suspend fun handleInitialize(result: Result) {
        try {
            withTimeout(30_000L) {
                locanara.initializeSDK(Platform.ANDROID)
            }
            val appContext = context ?: throw IllegalStateException("Context is not available")
            val model = PromptApiModel(appContext)
            promptApiModel = model
            LocanaraDefaults.model = model
            result.success(mapOf("success" to true))
        } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
            android.util.Log.e(TAG, "Initialize timed out after 30s", e)
            result.error("ERR_INITIALIZE", "Initialization timed out. The device may not support on-device AI.", null)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Initialize failed", e)
            result.error("ERR_INITIALIZE", e.message, null)
        }
    }

    private suspend fun handleGetDeviceCapability(result: Result) {
        try {
            val capability = locanara.getDeviceCapability()
            result.success(FlutterOndeviceAiSerialization.deviceCapability(capability))
        } catch (e: Exception) {
            result.error("ERR_DEVICE_CAPABILITY", e.message, null)
        }
    }

    // endregion

    // region AI Features

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleSummarize(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val options = call.argument<Map<String, Any>>("options")
            val bulletCount = FlutterOndeviceAiHelper.bulletCount(options)
            val inputType = FlutterOndeviceAiHelper.inputType(options)
            val r = SummarizeChain(bulletCount = bulletCount, inputType = inputType).run(text)
            result.success(FlutterOndeviceAiSerialization.summarize(r))
        } catch (e: Exception) {
            android.util.Log.e(TAG, "summarize failed", e)
            result.error("ERR_SUMMARIZE", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleClassify(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val options = call.argument<Map<String, Any>>("options")
            val (categories, maxResults) = FlutterOndeviceAiHelper.classifyOptions(options)
            val r = ClassifyChain(categories = categories, maxResults = maxResults).run(text)
            result.success(FlutterOndeviceAiSerialization.classify(r))
        } catch (e: Exception) {
            result.error("ERR_CLASSIFY", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleExtract(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val options = call.argument<Map<String, Any>>("options")
            val entityTypes = FlutterOndeviceAiHelper.entityTypes(options)
            val r = ExtractChain(entityTypes = entityTypes).run(text)
            result.success(FlutterOndeviceAiSerialization.extract(r))
        } catch (e: Exception) {
            result.error("ERR_EXTRACT", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleChat(call: MethodCall, result: Result) {
        try {
            val message = call.argument<String>("message") ?: throw IllegalArgumentException("message is required")
            val options = call.argument<Map<String, Any>>("options")
            val (systemPrompt, memory) = FlutterOndeviceAiHelper.chatOptions(options)
            val r = ChatChain(memory = memory, systemPrompt = systemPrompt).run(message)
            result.success(FlutterOndeviceAiSerialization.chat(r))
        } catch (e: Exception) {
            result.error("ERR_CHAT", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleChatStream(call: MethodCall, result: Result) {
        try {
            val message = call.argument<String>("message") ?: throw IllegalArgumentException("message is required")
            val options = call.argument<Map<String, Any>>("options")
            val (systemPrompt, memory) = FlutterOndeviceAiHelper.chatOptions(options)
            val chain = ChatChain(memory = memory, systemPrompt = systemPrompt)
            var accumulated = ""

            chain.streamRun(message).collect { chunk ->
                accumulated += chunk
                chatStreamSink?.success(
                    mapOf(
                        "delta" to chunk,
                        "accumulated" to accumulated,
                        "isFinal" to false,
                        "conversationId" to null,
                    )
                )
            }

            chatStreamSink?.success(
                mapOf(
                    "delta" to "",
                    "accumulated" to accumulated,
                    "isFinal" to true,
                    "conversationId" to null,
                )
            )

            result.success(
                mapOf(
                    "message" to accumulated,
                    "conversationId" to null,
                    "canContinue" to true,
                )
            )
        } catch (e: Exception) {
            result.error("ERR_CHAT_STREAM", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleTranslate(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val options = call.argument<Map<String, Any>>("options")
            val (source, target) = FlutterOndeviceAiHelper.translateOptions(options)
            val r = TranslateChain(sourceLanguage = source, targetLanguage = target).run(text)
            result.success(FlutterOndeviceAiSerialization.translate(r))
        } catch (e: Exception) {
            result.error("ERR_TRANSLATE", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleRewrite(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val options = call.argument<Map<String, Any>>("options")
            val style = FlutterOndeviceAiHelper.rewriteStyle(options)
            val r = RewriteChain(style = style).run(text)
            result.success(FlutterOndeviceAiSerialization.rewrite(r))
        } catch (e: Exception) {
            result.error("ERR_REWRITE", e.message, null)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private suspend fun handleProofread(call: MethodCall, result: Result) {
        try {
            val text = call.argument<String>("text") ?: throw IllegalArgumentException("text is required")
            val r = ProofreadChain().run(text)
            result.success(FlutterOndeviceAiSerialization.proofread(r))
        } catch (e: Exception) {
            result.error("ERR_PROOFREAD", e.message, null)
        }
    }

    // endregion

    // region Model Management

    private fun handleGetAvailableModels(result: Result) {
        val memoryMB = getDeviceMemoryMB()
        val models = ModelRegistry.getCompatibleModels(memoryMB)
        android.util.Log.d(TAG, "getAvailableModels: memoryMB=$memoryMB, count=${models.size}")
        models.forEach { m ->
            val override = modelURLOverrides[m.modelId]
            val sizeMB = override?.sizeMB ?: m.sizeMB
            android.util.Log.d(TAG, "  model: ${m.modelId} (${m.name}, ${sizeMB}MB, ${m.quantization.name})")
        }
        result.success(models.map { m ->
            val info = FlutterOndeviceAiSerialization.modelInfo(m)
            val override = modelURLOverrides[m.modelId]
            if (override != null) {
                info.toMutableMap().apply { put("sizeMB", override.sizeMB) }
            } else {
                info
            }
        })
    }

    private fun handleGetDownloadedModels(result: Result) {
        val ids = getDownloadedModelIdsFromDisk()
        android.util.Log.d(TAG, "getDownloadedModels: $ids")
        result.success(ids)
    }

    private fun handleGetLoadedModel(result: Result) {
        android.util.Log.d(TAG, "getLoadedModel: $loadedModelId")
        result.success(loadedModelId)
    }

    private fun handleGetCurrentEngine(result: Result) {
        // If a custom model is loaded via ExecuTorch, report llama_cpp engine
        if (activeModelWrapper != null && loadedModelId != null) {
            android.util.Log.d(TAG, "getCurrentEngine: llama_cpp (ExecuTorch, model=$loadedModelId)")
            result.success("llama_cpp")
            return
        }
        val status = locanara.getPromptApiStatus()
        val engine = when (status) {
            is PromptApiStatus.Available,
            is PromptApiStatus.Downloadable,
            is PromptApiStatus.Downloading -> "prompt_api"
            else -> "none"
        }
        android.util.Log.d(TAG, "getCurrentEngine: status=$status, engine=$engine")
        result.success(engine)
    }

    /**
     * Download a model's .pte and tokenizer.bin files from HuggingFace.
     * Reports progress via the downloadProgressSink EventChannel.
     */
    private suspend fun handleDownloadModel(call: MethodCall, result: Result) {
        val modelId = call.argument<String>("modelId")
            ?: return result.error("ERR_INVALID_ARGS", "modelId is required", null)
        val modelInfo = ModelRegistry.getModel(modelId)
        if (modelInfo == null) {
            android.util.Log.e(TAG, "downloadModel: model not found: $modelId")
            return result.error("ERR_NOT_FOUND", "Model not found: $modelId", null)
        }

        // Already downloaded?
        val dir = modelDir(modelId)
        val modelFile = File(dir, "model.pte")
        val tokenizerFile = File(dir, "tokenizer.model")
        if (modelFile.exists() && tokenizerFile.exists()) {
            android.util.Log.d(TAG, "downloadModel: $modelId already downloaded")
            result.success(true)
            return
        }

        // Use override URLs (public repos) if available, otherwise fall back to SDK URLs
        val override = modelURLOverrides[modelId]
        val actualDownloadURL = override?.downloadURL ?: modelInfo.downloadURL
        val actualTokenizerURL = override?.tokenizerURL ?: modelInfo.tokenizerURL
        val actualSizeMB = override?.sizeMB ?: modelInfo.sizeMB

        android.util.Log.d(TAG, "downloadModel: $modelId (${modelInfo.name}, ${actualSizeMB}MB) — starting real download")
        android.util.Log.d(TAG, "downloadModel: URL=$actualDownloadURL")

        try {
            dir.mkdirs()

            // Download .pte model file
            val totalBytes = actualSizeMB.toLong() * 1024 * 1024
            downloadFile(
                url = actualDownloadURL,
                destFile = modelFile,
                modelId = modelId,
                totalBytesEstimate = totalBytes
            )

            // Download tokenizer
            if (actualTokenizerURL != null) {
                android.util.Log.d(TAG, "downloadModel: downloading tokenizer from $actualTokenizerURL")
                downloadFile(
                    url = actualTokenizerURL,
                    destFile = tokenizerFile,
                    modelId = modelId,
                    totalBytesEstimate = totalBytes,  // keep progress at 100% during tokenizer
                    silent = true
                )
            }

            // Report completed
            scope.launch {
                downloadProgressSink?.success(
                    mapOf(
                        "modelId" to modelId,
                        "bytesDownloaded" to modelFile.length(),
                        "totalBytes" to modelFile.length(),
                        "progress" to 1.0,
                        "state" to "completed",
                    )
                )
            }

            android.util.Log.d(TAG, "downloadModel: $modelId complete — ${modelFile.length() / (1024 * 1024)}MB")
            result.success(true)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "downloadModel: $modelId failed", e)
            // Clean up partial download
            dir.deleteRecursively()
            result.error("ERR_DOWNLOAD_MODEL", "Download failed: ${e.message}", null)
        }
    }

    /**
     * Download a single file with progress reporting.
     */
    private suspend fun downloadFile(
        url: String,
        destFile: File,
        modelId: String,
        totalBytesEstimate: Long,
        silent: Boolean = false
    ) = withContext(Dispatchers.IO) {
        val tempFile = File(destFile.parent, "${destFile.name}.tmp")

        // Follow redirects manually (HuggingFace redirects to CDN)
        var currentUrl = url
        var connection: HttpURLConnection
        var redirectCount = 0
        while (true) {
            connection = URL(currentUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 30_000
            connection.readTimeout = 900_000  // 15 min timeout for large model downloads
            connection.instanceFollowRedirects = false  // handle manually
            connection.setRequestProperty("User-Agent", "Locanara-Flutter/1.0")
            connection.connect()

            val code = connection.responseCode
            if (code in 301..302 || code == 307 || code == 308) {
                val location = connection.getHeaderField("Location")
                connection.disconnect()
                if (location == null || ++redirectCount > 10) {
                    throw Exception("Too many redirects or missing Location header")
                }
                android.util.Log.d(TAG, "downloadFile: redirect $code → $location")
                currentUrl = location
                continue
            }

            if (code !in 200..299) {
                connection.disconnect()
                throw Exception("HTTP $code from $currentUrl")
            }
            break
        }

        try {
            val contentLength = connection.contentLengthLong.let { if (it > 0) it else totalBytesEstimate }

            connection.inputStream.use { input ->
                tempFile.outputStream().use { output ->
                    val buffer = ByteArray(256 * 1024)  // 256KB buffer
                    var bytesRead: Long = 0
                    var lastProgressReport = 0L

                    while (true) {
                        val count = input.read(buffer)
                        if (count == -1) break
                        output.write(buffer, 0, count)
                        bytesRead += count

                        // Report progress every 500KB (avoid flooding UI thread)
                        if (!silent && bytesRead - lastProgressReport > 512 * 1024) {
                            lastProgressReport = bytesRead
                            val progress = if (contentLength > 0) {
                                (bytesRead.toDouble() / contentLength).coerceAtMost(0.99)
                            } else 0.0

                            scope.launch {
                                downloadProgressSink?.success(
                                    mapOf(
                                        "modelId" to modelId,
                                        "bytesDownloaded" to bytesRead,
                                        "totalBytes" to contentLength,
                                        "progress" to progress,
                                        "state" to "downloading",
                                    )
                                )
                            }
                        }
                    }
                }
            }

            // Atomic move: rename temp → final
            if (!tempFile.renameTo(destFile)) {
                tempFile.copyTo(destFile, overwrite = true)
                tempFile.delete()
            }

            android.util.Log.d(TAG, "downloadFile: ${destFile.name} done (${destFile.length() / (1024 * 1024)}MB)")
        } finally {
            connection.disconnect()
            if (tempFile.exists()) tempFile.delete()
        }
    }

    /**
     * Load a downloaded model into memory via ExecuTorchEngine.
     * Switches LocanaraDefaults.model so all chains use the loaded model.
     */
    private suspend fun handleLoadModel(call: MethodCall, result: Result) {
        val modelId = call.argument<String>("modelId")
            ?: return result.error("ERR_INVALID_ARGS", "modelId is required", null)

        val dir = modelDir(modelId)
        val modelFile = File(dir, "model.pte")
        val tokenizerFile = File(dir, "tokenizer.model")

        if (!modelFile.exists()) {
            android.util.Log.e(TAG, "loadModel: model file not found: ${modelFile.absolutePath}")
            return result.error("ERR_NOT_DOWNLOADED", "Model not downloaded: $modelId", null)
        }
        if (!tokenizerFile.exists()) {
            android.util.Log.e(TAG, "loadModel: tokenizer not found: ${tokenizerFile.absolutePath}")
            return result.error("ERR_NOT_DOWNLOADED", "Tokenizer not found: $modelId", null)
        }

        android.util.Log.d(TAG, "loadModel: $modelId — loading via ExecuTorchEngine...")

        try {
            // Unload any previous model
            activeModelWrapper?.unload()
            activeModelWrapper = null

            val appContext = context ?: throw IllegalStateException("Context not available")
            val engine = ExecuTorchEngine.create(appContext, modelFile, tokenizerFile)
            val wrapper = ExecuTorchModelWrapper(engine)

            activeModelWrapper = wrapper
            loadedModelId = modelId
            LocanaraDefaults.model = wrapper

            android.util.Log.d(TAG, "loadModel: $modelId loaded successfully — LocanaraDefaults.model switched to ExecuTorch")
            result.success(null)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "loadModel: $modelId failed", e)
            result.error("ERR_LOAD_MODEL", "Failed to load model: ${e.message}", null)
        }
    }

    /**
     * Delete a downloaded model from disk.
     * If the model is currently loaded, unloads it first and restores PromptApiModel.
     */
    private fun handleDeleteModel(call: MethodCall, result: Result) {
        val modelId = call.argument<String>("modelId")
            ?: return result.error("ERR_INVALID_ARGS", "modelId is required", null)

        android.util.Log.d(TAG, "deleteModel: $modelId")

        // If this model is loaded, unload first
        if (loadedModelId == modelId) {
            activeModelWrapper?.unload()
            activeModelWrapper = null
            loadedModelId = null
            restorePromptApiModel()
        }

        // Delete from disk
        val dir = modelDir(modelId)
        if (dir.exists()) {
            dir.deleteRecursively()
            android.util.Log.d(TAG, "deleteModel: $modelId deleted from disk")
        }

        result.success(null)
    }

    /**
     * Switch back to device-native AI (Gemini Nano / Prompt API).
     * Unloads the ExecuTorch model and restores PromptApiModel.
     */
    private fun handleSwitchToDeviceAI(result: Result) {
        android.util.Log.d(TAG, "switchToDeviceAI: unloading ExecuTorch, restoring PromptApiModel")
        activeModelWrapper?.unload()
        activeModelWrapper = null
        loadedModelId = null
        restorePromptApiModel()
        result.success(null)
    }

    private fun restorePromptApiModel() {
        val model = promptApiModel
        if (model != null) {
            LocanaraDefaults.model = model
            android.util.Log.d(TAG, "restorePromptApiModel: LocanaraDefaults.model = PromptApiModel")
        }
    }

    private fun handleGetPromptApiStatus(result: Result) {
        val status = locanara.getPromptApiStatus()
        val statusString = when (status) {
            is PromptApiStatus.Available -> "available"
            is PromptApiStatus.Downloadable -> "downloadable"
            is PromptApiStatus.Downloading -> "downloading"
            is PromptApiStatus.NotAvailable -> "not_available"
        }
        android.util.Log.d(TAG, "getPromptApiStatus: $statusString")
        result.success(statusString)
    }

    private suspend fun handleDownloadPromptApiModel(result: Result) {
        try {
            android.util.Log.d(TAG, "downloadPromptApiModel: starting...")
            locanara.downloadPromptApiModel { progress ->
                val pct = if (progress.bytesToDownload > 0) {
                    progress.bytesDownloaded.toDouble() / progress.bytesToDownload.toDouble()
                } else {
                    0.0
                }
                downloadProgressSink?.success(
                    mapOf(
                        "modelId" to "gemini-nano",
                        "bytesDownloaded" to progress.bytesDownloaded,
                        "totalBytes" to progress.bytesToDownload,
                        "progress" to pct,
                        "state" to "downloading",
                    )
                )
            }
            downloadProgressSink?.success(
                mapOf(
                    "modelId" to "gemini-nano",
                    "bytesDownloaded" to 0L,
                    "totalBytes" to 0L,
                    "progress" to 1.0,
                    "state" to "completed",
                )
            )
            android.util.Log.d(TAG, "downloadPromptApiModel: done")
            result.success(true)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "downloadPromptApiModel: failed", e)
            result.error("ERR_DOWNLOAD_MODEL", e.message, null)
        }
    }

    // endregion
}
