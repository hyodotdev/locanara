import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Chat feature executor
///
/// Generates conversational responses using Apple Intelligence Foundation Models.
internal final class ChatExecutor {

    /// Conversation storage for context
    private var conversations: [String: [ChatMessageInput]] = [:]

    /// Execute chat feature
    ///
    /// - Parameters:
    ///   - input: User message
    ///   - parameters: Optional chat parameters
    /// - Returns: ChatResult with AI response
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ChatParametersInput?
    ) async throws -> ChatResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.chat(input: input, params: parameters)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: parameters
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: ChatParametersInput?
    ) async throws -> ChatResult {
        let conversationId = parameters?.conversationId ?? UUID().uuidString

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    conversationId: conversationId,
                    parameters: parameters
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.chat)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        conversationId: String,
        parameters: ChatParametersInput?
    ) async throws -> ChatResult {
        let session = LanguageModelSession()

        var history = conversations[conversationId] ?? []
        var contextPrompt = ""

        if history.isEmpty, let systemPrompt = parameters?.systemPrompt {
            contextPrompt = "System instruction: \(systemPrompt)\n\n"
            history.append(ChatMessageInput(role: "system", content: systemPrompt))
        }

        if let providedHistory = parameters?.history {
            history.append(contentsOf: providedHistory)
        }

        for msg in history {
            if msg.role == "user" {
                contextPrompt += "User: \(msg.content)\n"
            } else if msg.role == "assistant" {
                contextPrompt += "Assistant: \(msg.content)\n"
            }
        }

        history.append(ChatMessageInput(role: "user", content: input))

        let prompt: String
        if contextPrompt.isEmpty {
            prompt = input
        } else {
            prompt = contextPrompt + "User: \(input)\nAssistant:"
        }

        let response = try await session.respond(to: prompt)
        let message = response.content

        history.append(ChatMessageInput(role: "assistant", content: message))
        conversations[conversationId] = history

        let suggestedPrompts = generateSuggestedPrompts(for: input, response: message)

        return ChatResult(
            message: message,
            conversationId: conversationId,
            canContinue: true,
            suggestedPrompts: suggestedPrompts
        )
    }
    #endif

    private func generateSuggestedPrompts(for input: String, response: String) -> [String] {
        return [
            "Tell me more",
            "Can you explain further?",
            "What are the alternatives?"
        ]
    }

    /// Clear conversation history
    ///
    /// - Parameter conversationId: Conversation to clear
    func clearConversation(_ conversationId: String) {
        conversations.removeValue(forKey: conversationId)
    }
}
