import Flutter
import Locanara

private let TAG = "[FlutterOndeviceAi]"

public class FlutterOndeviceAiPlugin: NSObject, FlutterPlugin, FlutterStreamHandler {
    private let client = LocanaraClient.shared
    private var channel: FlutterMethodChannel?
    private var chatStreamSink: FlutterEventSink?
    private var downloadProgressSink: FlutterEventSink?

    public static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(
            name: "flutter_ondevice_ai",
            binaryMessenger: registrar.messenger()
        )
        let instance = FlutterOndeviceAiPlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
        instance.channel = channel

        let chatStreamChannel = FlutterEventChannel(
            name: "flutter_ondevice_ai/chat_stream",
            binaryMessenger: registrar.messenger()
        )
        chatStreamChannel.setStreamHandler(instance)

        let downloadProgressChannel = FlutterEventChannel(
            name: "flutter_ondevice_ai/model_download_progress",
            binaryMessenger: registrar.messenger()
        )
        let downloadHandler = DownloadProgressHandler()
        downloadProgressChannel.setStreamHandler(downloadHandler)
        instance.downloadProgressHandler = downloadHandler
    }

    private var downloadProgressHandler: DownloadProgressHandler?

    // MARK: - FlutterStreamHandler (chat stream)

    public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        chatStreamSink = events
        return nil
    }

    public func onCancel(withArguments arguments: Any?) -> FlutterError? {
        chatStreamSink = nil
        return nil
    }

    // MARK: - Method Call Handler

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        Task { @MainActor in
            await handleAsync(call, result: result)
        }
    }

    @MainActor
    private func handleAsync(_ call: FlutterMethodCall, result: @escaping FlutterResult) async {
        let args = call.arguments as? [String: Any]

        switch call.method {
        case "initialize":
            await handleInitialize(result: result)
        case "getDeviceCapability":
            await handleGetDeviceCapability(result: result)
        case "summarize":
            await handleSummarize(args, result: result)
        case "classify":
            await handleClassify(args, result: result)
        case "extract":
            await handleExtract(args, result: result)
        case "chat":
            await handleChat(args, result: result)
        case "chatStream":
            await handleChatStream(args, result: result)
        case "translate":
            await handleTranslate(args, result: result)
        case "rewrite":
            await handleRewrite(args, result: result)
        case "proofread":
            await handleProofread(args, result: result)
        case "getAvailableModels":
            handleGetAvailableModels(result: result)
        case "getDownloadedModels":
            handleGetDownloadedModels(result: result)
        case "getLoadedModel":
            handleGetLoadedModel(result: result)
        case "getCurrentEngine":
            handleGetCurrentEngine(result: result)
        case "downloadModel":
            await handleDownloadModel(args, result: result)
        case "loadModel":
            await handleLoadModel(args, result: result)
        case "deleteModel":
            handleDeleteModel(args, result: result)
        case "switchToDeviceAI":
            await handleSwitchToDeviceAI(result: result)
        case "getPromptApiStatus":
            result("not_available")
        case "downloadPromptApiModel":
            result(false)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    // MARK: - Core

    private func handleInitialize(result: @escaping FlutterResult) async {
        NSLog("\(TAG) initialize() called")
        do {
            try await client.initialize()
            let engine = self.client.getCurrentEngine()
            NSLog("\(TAG) initialize() success — engine: \(engine.rawValue)")
            result(["success": true])
        } catch {
            NSLog("\(TAG) initialize() FAILED: \(error)")
            result(FlutterError(code: "ERR_INITIALIZE", message: error.localizedDescription, details: nil))
        }
    }

    private func handleGetDeviceCapability(result: @escaping FlutterResult) async {
        do {
            let capability = try client.getDeviceCapability()
            let deviceInfo = try? client.getDeviceInfoIOS()
            result(FlutterOndeviceAiSerialization.deviceCapability(
                capability,
                isModelReady: client.isModelReady(),
                supportsAppleIntelligence: deviceInfo?.supportsAppleIntelligence ?? false
            ))
        } catch {
            result(FlutterError(code: "ERR_DEVICE_CAPABILITY", message: error.localizedDescription, details: nil))
        }
    }

    // MARK: - AI Features

    private func handleSummarize(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) summarize() input length: \(text.count)")

        do {
            let bulletCount = FlutterOndeviceAiHelper.bulletCount(from: options)
            let inputType = FlutterOndeviceAiHelper.inputType(from: options)
            let r = try await SummarizeChain(bulletCount: bulletCount, inputType: inputType).run(text)
            NSLog("\(TAG) summarize() done — summary length: \(r.summaryLength)")
            result(FlutterOndeviceAiSerialization.summarize(r))
        } catch {
            result(FlutterError(code: "ERR_SUMMARIZE", message: error.localizedDescription, details: nil))
        }
    }

    private func handleClassify(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) classify() input length: \(text.count)")

        do {
            let (categories, maxResults) = FlutterOndeviceAiHelper.classifyOptions(from: options)
            let r = try await ClassifyChain(categories: categories, maxResults: maxResults).run(text)
            NSLog("\(TAG) classify() done — top: \(r.topClassification.label)")
            result(FlutterOndeviceAiSerialization.classify(r))
        } catch {
            result(FlutterError(code: "ERR_CLASSIFY", message: error.localizedDescription, details: nil))
        }
    }

    private func handleExtract(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) extract() input length: \(text.count)")

        do {
            let entityTypes = FlutterOndeviceAiHelper.entityTypes(from: options)
            let r = try await ExtractChain(entityTypes: entityTypes).run(text)
            NSLog("\(TAG) extract() done — \(r.entities.count) entities")
            result(FlutterOndeviceAiSerialization.extract(r))
        } catch {
            result(FlutterError(code: "ERR_EXTRACT", message: error.localizedDescription, details: nil))
        }
    }

    private func handleChat(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let message = args?["message"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "message is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) chat() message: \(message.prefix(100))")

        do {
            let (systemPrompt, memory) = FlutterOndeviceAiHelper.chatOptions(from: options)
            let r = try await ChatChain(memory: memory, systemPrompt: systemPrompt).run(message)
            NSLog("\(TAG) chat() done — response length: \(r.message.count)")
            result(FlutterOndeviceAiSerialization.chat(r))
        } catch {
            result(FlutterError(code: "ERR_CHAT", message: error.localizedDescription, details: nil))
        }
    }

    private func handleChatStream(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let message = args?["message"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "message is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) chatStream() message: \(message.prefix(100))")

        do {
            let (systemPrompt, memory) = FlutterOndeviceAiHelper.chatOptions(from: options)
            let chain = ChatChain(memory: memory, systemPrompt: systemPrompt)
            var accumulated = ""

            for try await chunk in chain.streamRun(message) {
                accumulated += chunk
                chatStreamSink?([
                    "delta": chunk,
                    "accumulated": accumulated,
                    "isFinal": false,
                    "conversationId": NSNull()
                ])
            }

            chatStreamSink?([
                "delta": "",
                "accumulated": accumulated,
                "isFinal": true,
                "conversationId": NSNull()
            ])

            NSLog("\(TAG) chatStream() done — total length: \(accumulated.count)")
            result([
                "message": accumulated,
                "conversationId": NSNull(),
                "canContinue": true
            ])
        } catch {
            result(FlutterError(code: "ERR_CHAT_STREAM", message: error.localizedDescription, details: nil))
        }
    }

    private func handleTranslate(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) translate() input length: \(text.count)")

        do {
            let (source, target) = FlutterOndeviceAiHelper.translateOptions(from: options)
            let r = try await TranslateChain(sourceLanguage: source, targetLanguage: target).run(text)
            NSLog("\(TAG) translate() done — \(r.sourceLanguage) → \(r.targetLanguage)")
            result(FlutterOndeviceAiSerialization.translate(r))
        } catch {
            result(FlutterError(code: "ERR_TRANSLATE", message: error.localizedDescription, details: nil))
        }
    }

    private func handleRewrite(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        let options = args?["options"] as? [String: Any]
        NSLog("\(TAG) rewrite() input length: \(text.count)")

        do {
            let style = FlutterOndeviceAiHelper.rewriteStyle(from: options)
            let r = try await RewriteChain(style: style).run(text)
            NSLog("\(TAG) rewrite() done")
            result(FlutterOndeviceAiSerialization.rewrite(r))
        } catch {
            result(FlutterError(code: "ERR_REWRITE", message: error.localizedDescription, details: nil))
        }
    }

    private func handleProofread(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let text = args?["text"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "text is required", details: nil))
            return
        }
        NSLog("\(TAG) proofread() input length: \(text.count)")

        do {
            let r = try await ProofreadChain().run(text)
            NSLog("\(TAG) proofread() done — \(r.corrections.count) corrections")
            result(FlutterOndeviceAiSerialization.proofread(r))
        } catch {
            result(FlutterError(code: "ERR_PROOFREAD", message: error.localizedDescription, details: nil))
        }
    }

    // MARK: - Model Management

    private func handleGetAvailableModels(result: @escaping FlutterResult) {
        let models = client.getAvailableModels()
        NSLog("\(TAG) getAvailableModels() → \(models.count) models")
        result(models.map { FlutterOndeviceAiSerialization.modelInfo($0) })
    }

    private func handleGetDownloadedModels(result: @escaping FlutterResult) {
        let ids = client.getDownloadedModels()
        NSLog("\(TAG) getDownloadedModels() → \(ids)")
        result(ids)
    }

    private func handleGetLoadedModel(result: @escaping FlutterResult) {
        let id = client.getLoadedModel()
        NSLog("\(TAG) getLoadedModel() → \(id ?? "nil")")
        result(id)
    }

    private func handleGetCurrentEngine(result: @escaping FlutterResult) {
        let engine = client.getCurrentEngine().rawValue
        NSLog("\(TAG) getCurrentEngine() → \(engine)")
        result(engine)
    }

    private func handleDownloadModel(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let modelId = args?["modelId"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "modelId is required", details: nil))
            return
        }
        NSLog("\(TAG) downloadModel(\(modelId)) starting...")

        do {
            let progressStream = try await client.downloadModelWithProgress(modelId)
            for await progress in progressStream {
                NSLog("\(TAG) downloadModel(\(modelId)) progress: \(Int(progress.progress * 100))%")
                downloadProgressHandler?.sink?([
                    "modelId": progress.modelId,
                    "bytesDownloaded": progress.bytesDownloaded,
                    "totalBytes": progress.totalBytes,
                    "progress": progress.progress,
                    "state": progress.state.rawValue
                ])
            }
            NSLog("\(TAG) downloadModel(\(modelId)) completed")
            result(true)
        } catch {
            NSLog("\(TAG) downloadModel(\(modelId)) FAILED: \(error)")
            result(FlutterError(code: "ERR_DOWNLOAD_MODEL", message: error.localizedDescription, details: nil))
        }
    }

    private func handleLoadModel(_ args: [String: Any]?, result: @escaping FlutterResult) async {
        guard let modelId = args?["modelId"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "modelId is required", details: nil))
            return
        }
        NSLog("\(TAG) loadModel(\(modelId)) starting...")

        do {
            try await client.loadModel(modelId)
            NSLog("\(TAG) loadModel(\(modelId)) success")
            result(nil)
        } catch {
            NSLog("\(TAG) loadModel(\(modelId)) FAILED: \(error)")
            result(FlutterError(code: "ERR_LOAD_MODEL", message: error.localizedDescription, details: nil))
        }
    }

    private func handleDeleteModel(_ args: [String: Any]?, result: @escaping FlutterResult) {
        guard let modelId = args?["modelId"] as? String else {
            result(FlutterError(code: "ERR_INVALID_ARGS", message: "modelId is required", details: nil))
            return
        }
        NSLog("\(TAG) deleteModel(\(modelId)) called")

        do {
            try client.deleteModel(modelId)
            NSLog("\(TAG) deleteModel(\(modelId)) success")
            result(nil)
        } catch {
            NSLog("\(TAG) deleteModel(\(modelId)) FAILED: \(error)")
            result(FlutterError(code: "ERR_DELETE_MODEL", message: error.localizedDescription, details: nil))
        }
    }

    private func handleSwitchToDeviceAI(result: @escaping FlutterResult) async {
        NSLog("\(TAG) switchToDeviceAI() called")
        do {
            try await client.switchToDeviceAI()
            NSLog("\(TAG) switchToDeviceAI() success")
            result(nil)
        } catch {
            NSLog("\(TAG) switchToDeviceAI() FAILED: \(error)")
            result(FlutterError(code: "ERR_SWITCH_ENGINE", message: error.localizedDescription, details: nil))
        }
    }
}

// MARK: - Download Progress Stream Handler

private class DownloadProgressHandler: NSObject, FlutterStreamHandler {
    var sink: FlutterEventSink?

    func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        sink = events
        return nil
    }

    func onCancel(withArguments arguments: Any?) -> FlutterError? {
        sink = nil
        return nil
    }
}
