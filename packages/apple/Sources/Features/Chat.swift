import Foundation
import NaturalLanguage
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Chat feature executor
///
/// Generates conversational responses using Apple Intelligence Foundation Models.
/// Conversation history is managed entirely by the caller via the `history` parameter.
internal final class ChatExecutor {

    /// Default system prompt for general-purpose chat behavior.
    /// Used when the caller does not provide a custom systemPrompt.
    private static let defaultSystemPrompt =
        "You are a friendly, helpful assistant. Respond naturally to the user's messages. " +
        "Keep your responses concise and conversational."

    /// Detect the dominant language of the given text using NLLanguageRecognizer.
    private static func detectLanguage(_ text: String) -> String? {
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        guard let lang = recognizer.dominantLanguage else { return nil }
        return Locale(identifier: "en").localizedString(forIdentifier: lang.rawValue)
    }

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
        let prompt = Self.buildPrompt(input: input, parameters: parameters)

        let response = try await session.respond(to: prompt)
        let message = response.content

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

    /// Execute streaming chat feature
    ///
    /// - Parameters:
    ///   - input: User message
    ///   - parameters: Optional chat parameters
    /// - Returns: AsyncThrowingStream of ChatStreamChunk
    /// - Throws: LocanaraError if execution fails
    func executeStream(
        input: String,
        parameters: ChatParametersInput?
    ) async throws -> AsyncThrowingStream<ChatStreamChunk, Error> {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        let conversationId = parameters?.conversationId ?? UUID().uuidString

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return streamWithAppleIntelligence(
                    input: input,
                    conversationId: conversationId,
                    parameters: parameters
                )
            }
        }
        #endif

        throw LocanaraError.featureNotAvailable(.chat)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func streamWithAppleIntelligence(
        input: String,
        conversationId: String,
        parameters: ChatParametersInput?
    ) -> AsyncThrowingStream<ChatStreamChunk, Error> {
        let prompt = Self.buildPrompt(input: input, parameters: parameters)

        return AsyncThrowingStream { continuation in
            Task { @Sendable in
                do {
                    let session = LanguageModelSession()
                    let stream = session.streamResponse(to: prompt)
                    var previousContent = ""

                    for try await partialResponse in stream {
                        let currentContent = partialResponse.content
                        let delta = String(currentContent.dropFirst(previousContent.count))
                        previousContent = currentContent

                        if !delta.isEmpty {
                            let chunk = ChatStreamChunk(
                                delta: delta,
                                accumulated: currentContent,
                                isFinal: false,
                                conversationId: conversationId
                            )
                            continuation.yield(chunk)
                        }
                    }

                    // Yield final chunk
                    let finalChunk = ChatStreamChunk(
                        delta: "",
                        accumulated: previousContent,
                        isFinal: true,
                        conversationId: conversationId
                    )
                    continuation.yield(finalChunk)

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    #endif

    // MARK: - Prompt Building

    /// Build a complete prompt string from the input and parameters.
    /// Both streaming and non-streaming paths use this to ensure consistency.
    private static func buildPrompt(
        input: String,
        parameters: ChatParametersInput?
    ) -> String {
        let systemPrompt = parameters?.systemPrompt ?? defaultSystemPrompt
        let languageName = detectLanguage(input)
        let languageInstruction = languageName.map { " You MUST respond in \($0)." } ?? ""

        var contextPrompt = "System instruction: \(systemPrompt)\(languageInstruction)\n\n"

        if let history = parameters?.history {
            for msg in history {
                if msg.role == "user" {
                    contextPrompt += "User: \(msg.content)\n"
                } else if msg.role == "assistant" {
                    contextPrompt += "Assistant: \(msg.content)\n"
                }
            }
        }

        return contextPrompt + "User: \(input)\nAssistant:"
    }
}
