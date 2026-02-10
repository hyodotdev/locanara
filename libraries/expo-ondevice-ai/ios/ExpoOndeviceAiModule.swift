import ExpoModulesCore
import Locanara

public class ExpoOndeviceAiModule: Module {
    private let client = LocanaraClient.shared

    public func definition() -> ModuleDefinition {
        Name("ExpoOndeviceAi")

        Events("onChatStreamChunk")

        AsyncFunction("initialize") { () -> [String: Any] in
            try await client.initialize()
            return ["success": true]
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
            let bulletCount = ExpoOndeviceAiHelper.bulletCount(from: options)
            let result = try await SummarizeChain(bulletCount: bulletCount).run(text)
            return ExpoOndeviceAiSerialization.summarize(result)
        }

        AsyncFunction("classify") { (text: String, options: [String: Any]?) -> [String: Any] in
            let (categories, maxResults) = ExpoOndeviceAiHelper.classifyOptions(from: options)
            let result = try await ClassifyChain(categories: categories, maxResults: maxResults).run(text)
            return ExpoOndeviceAiSerialization.classify(result)
        }

        AsyncFunction("extract") { (text: String, options: [String: Any]?) -> [String: Any] in
            let entityTypes = ExpoOndeviceAiHelper.entityTypes(from: options)
            let result = try await ExtractChain(entityTypes: entityTypes).run(text)
            return ExpoOndeviceAiSerialization.extract(result)
        }

        AsyncFunction("chat") { (message: String, options: [String: Any]?) -> [String: Any] in
            let (systemPrompt, memory) = ExpoOndeviceAiHelper.chatOptions(from: options)
            let result = try await ChatChain(memory: memory, systemPrompt: systemPrompt).run(message)
            return ExpoOndeviceAiSerialization.chat(result)
        }

        AsyncFunction("chatStream") { (message: String, options: [String: Any]?) -> [String: Any] in
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

            return [
                "message": accumulated,
                "conversationId": NSNull(),
                "canContinue": true
            ]
        }

        AsyncFunction("translate") { (text: String, options: [String: Any]?) -> [String: Any] in
            let (source, target) = ExpoOndeviceAiHelper.translateOptions(from: options)
            let result = try await TranslateChain(sourceLanguage: source, targetLanguage: target).run(text)
            return ExpoOndeviceAiSerialization.translate(result)
        }

        AsyncFunction("rewrite") { (text: String, options: [String: Any]?) -> [String: Any] in
            let style = ExpoOndeviceAiHelper.rewriteStyle(from: options)
            let result = try await RewriteChain(style: style).run(text)
            return ExpoOndeviceAiSerialization.rewrite(result)
        }

        AsyncFunction("proofread") { (text: String, options: [String: Any]?) -> [String: Any] in
            let result = try await ProofreadChain().run(text)
            return ExpoOndeviceAiSerialization.proofread(result)
        }
    }
}
