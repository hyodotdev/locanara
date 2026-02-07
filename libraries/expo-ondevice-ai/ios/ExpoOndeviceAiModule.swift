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
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .summarize, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("classify") { (text: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .classify, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("extract") { (text: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .extract, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("chat") { (message: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .chat, text: message, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("chatStream") { (message: String, options: [String: Any]?) -> [String: Any] in
            let params = ExpoOndeviceAiHelper.decodeChatParameters(options)
            let stream = try await self.client.chatStream(input: message, parameters: params)
            var finalMessage = ""
            var finalConversationId: String?

            for try await chunk in stream {
                self.sendEvent("onChatStreamChunk", [
                    "delta": chunk.delta,
                    "accumulated": chunk.accumulated,
                    "isFinal": chunk.isFinal,
                    "conversationId": chunk.conversationId as Any
                ])
                if chunk.isFinal {
                    finalMessage = chunk.accumulated
                    finalConversationId = chunk.conversationId
                }
            }

            return [
                "message": finalMessage,
                "conversationId": finalConversationId as Any,
                "canContinue": true,
                "suggestedPrompts": ["Tell me more", "Can you explain?", "What else?"]
            ]
        }

        AsyncFunction("translate") { (text: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .translate, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("rewrite") { (text: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .rewrite, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }

        AsyncFunction("proofread") { (text: String, options: [String: Any]?) -> [String: Any] in
            let input = ExpoOndeviceAiHelper.buildFeatureInput(feature: .proofread, text: text, options: options)
            let result = try await client.executeFeature(input)
            return try ExpoOndeviceAiSerialization.result(result)
        }
    }
}
