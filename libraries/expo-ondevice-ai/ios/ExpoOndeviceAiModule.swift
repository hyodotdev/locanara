import ExpoModulesCore
import Locanara

private let TAG = "[ExpoOndeviceAi]"

public class ExpoOndeviceAiModule: Module {
    private let client = LocanaraClient.shared

    public func definition() -> ModuleDefinition {
        Name("ExpoOndeviceAi")

        Events("onChatStreamChunk", "onModelDownloadProgress")

        AsyncFunction("initialize") { () -> [String: Any] in
            NSLog("\(TAG) initialize() called")
            do {
                try await client.initialize()
                let engine = self.client.getCurrentEngine()
                NSLog("\(TAG) initialize() success — engine: \(engine.rawValue)")
                return ["success": true]
            } catch {
                NSLog("\(TAG) initialize() FAILED: \(error)")
                throw error
            }
        }

        // MARK: - Model Management

        AsyncFunction("getAvailableModels") { () -> [[String: Any]] in
            let models = self.client.getAvailableModels()
            NSLog("\(TAG) getAvailableModels() → \(models.count) models")
            for m in models {
                NSLog("\(TAG)   - \(m.modelId) (\(m.name), \(m.sizeMB)MB, \(m.quantization.rawValue))")
            }
            return models.map { ExpoOndeviceAiSerialization.modelInfo($0) }
        }

        AsyncFunction("getDownloadedModels") { () -> [String] in
            let ids = self.client.getDownloadedModels()
            NSLog("\(TAG) getDownloadedModels() → \(ids)")
            return ids
        }

        AsyncFunction("getLoadedModel") { () -> String? in
            let id = self.client.getLoadedModel()
            NSLog("\(TAG) getLoadedModel() → \(id ?? "nil")")
            return id
        }

        AsyncFunction("getCurrentEngine") { () -> String in
            let engine = self.client.getCurrentEngine().rawValue
            NSLog("\(TAG) getCurrentEngine() → \(engine)")
            return engine
        }

        AsyncFunction("downloadModel") { (modelId: String) -> Bool in
            NSLog("\(TAG) downloadModel(\(modelId)) starting...")
            do {
                let progressStream = try await self.client.downloadModelWithProgress(modelId)
                for await progress in progressStream {
                    NSLog("\(TAG) downloadModel(\(modelId)) progress: \(Int(progress.progress * 100))% (\(progress.state.rawValue))")
                    self.sendEvent("onModelDownloadProgress", [
                        "modelId": progress.modelId,
                        "bytesDownloaded": progress.bytesDownloaded,
                        "totalBytes": progress.totalBytes,
                        "progress": progress.progress,
                        "state": progress.state.rawValue
                    ])
                }
                NSLog("\(TAG) downloadModel(\(modelId)) completed")
                return true
            } catch {
                NSLog("\(TAG) downloadModel(\(modelId)) FAILED: \(error)")
                throw error
            }
        }

        AsyncFunction("loadModel") { (modelId: String) in
            NSLog("\(TAG) loadModel(\(modelId)) starting...")
            do {
                try await self.client.loadModel(modelId)
                NSLog("\(TAG) loadModel(\(modelId)) success")
            } catch {
                NSLog("\(TAG) loadModel(\(modelId)) FAILED: \(error)")
                NSLog("\(TAG) loadModel error details: \(error.localizedDescription)")
                throw error
            }
        }

        AsyncFunction("deleteModel") { (modelId: String) in
            NSLog("\(TAG) deleteModel(\(modelId)) called")
            do {
                try self.client.deleteModel(modelId)
                NSLog("\(TAG) deleteModel(\(modelId)) success")
            } catch {
                NSLog("\(TAG) deleteModel(\(modelId)) FAILED: \(error)")
                throw error
            }
        }

        AsyncFunction("getDeviceCapability") { () -> [String: Any] in
            let capability = try client.getDeviceCapability()
            let deviceInfo = try? client.getDeviceInfoIOS()
            return ExpoOndeviceAiSerialization.deviceCapability(
                capability,
                isModelReady: client.isModelReady(),
                supportsAppleIntelligence: deviceInfo?.supportsAppleIntelligence ?? false
            )
        }

        AsyncFunction("summarize") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) summarize() input length: \(text.count)")
            let bulletCount = ExpoOndeviceAiHelper.bulletCount(from: options)
            let result = try await SummarizeChain(bulletCount: bulletCount).run(text)
            NSLog("\(TAG) summarize() done — summary length: \(result.summaryLength)")
            return ExpoOndeviceAiSerialization.summarize(result)
        }

        AsyncFunction("classify") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) classify() input length: \(text.count)")
            let (categories, maxResults) = ExpoOndeviceAiHelper.classifyOptions(from: options)
            let result = try await ClassifyChain(categories: categories, maxResults: maxResults).run(text)
            NSLog("\(TAG) classify() done — top: \(result.topClassification.label)")
            return ExpoOndeviceAiSerialization.classify(result)
        }

        AsyncFunction("extract") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) extract() input length: \(text.count)")
            let entityTypes = ExpoOndeviceAiHelper.entityTypes(from: options)
            let result = try await ExtractChain(entityTypes: entityTypes).run(text)
            NSLog("\(TAG) extract() done — \(result.entities.count) entities")
            return ExpoOndeviceAiSerialization.extract(result)
        }

        AsyncFunction("chat") { (message: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) chat() message: \(message.prefix(100))")
            let (systemPrompt, memory) = ExpoOndeviceAiHelper.chatOptions(from: options)
            let result = try await ChatChain(memory: memory, systemPrompt: systemPrompt).run(message)
            NSLog("\(TAG) chat() done — response length: \(result.message.count)")
            return ExpoOndeviceAiSerialization.chat(result)
        }

        AsyncFunction("chatStream") { (message: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) chatStream() message: \(message.prefix(100))")
            let (systemPrompt, memory) = ExpoOndeviceAiHelper.chatOptions(from: options)
            let chain = ChatChain(memory: memory, systemPrompt: systemPrompt)
            var accumulated = ""

            for try await chunk in chain.streamRun(message) {
                accumulated += chunk
                self.sendEvent("onChatStreamChunk", [
                    "delta": chunk,
                    "accumulated": accumulated,
                    "isFinal": false,
                    "conversationId": NSNull()
                ])
            }

            self.sendEvent("onChatStreamChunk", [
                "delta": "",
                "accumulated": accumulated,
                "isFinal": true,
                "conversationId": NSNull()
            ])

            NSLog("\(TAG) chatStream() done — total length: \(accumulated.count)")
            return [
                "message": accumulated,
                "conversationId": NSNull(),
                "canContinue": true
            ]
        }

        AsyncFunction("translate") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) translate() input length: \(text.count)")
            let (source, target) = ExpoOndeviceAiHelper.translateOptions(from: options)
            let result = try await TranslateChain(sourceLanguage: source, targetLanguage: target).run(text)
            NSLog("\(TAG) translate() done — \(result.sourceLanguage) → \(result.targetLanguage)")
            return ExpoOndeviceAiSerialization.translate(result)
        }

        AsyncFunction("rewrite") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) rewrite() input length: \(text.count)")
            let style = ExpoOndeviceAiHelper.rewriteStyle(from: options)
            let result = try await RewriteChain(style: style).run(text)
            NSLog("\(TAG) rewrite() done")
            return ExpoOndeviceAiSerialization.rewrite(result)
        }

        AsyncFunction("proofread") { (text: String, options: [String: Any]?) -> [String: Any] in
            NSLog("\(TAG) proofread() input length: \(text.count)")
            let result = try await ProofreadChain().run(text)
            NSLog("\(TAG) proofread() done — \(result.corrections.count) corrections")
            return ExpoOndeviceAiSerialization.proofread(result)
        }
    }
}
