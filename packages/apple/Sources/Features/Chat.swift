import Foundation
import NaturalLanguage
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Chat feature executor
///
/// Generates conversational responses using Apple Intelligence Foundation Models.
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

        // Use caller's systemPrompt if provided, otherwise use default
        let systemPrompt = parameters?.systemPrompt ?? Self.defaultSystemPrompt

        // Detect user's language and add explicit instruction
        let languageName = Self.detectLanguage(input)
        let languageInstruction = languageName.map { " You MUST respond in \($0)." } ?? ""

        var contextPrompt = "System instruction: \(systemPrompt)\(languageInstruction)\n\n"
        if history.isEmpty {
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

        let prompt = contextPrompt + "User: \(input)\nAssistant:"

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
        // Pre-capture all values from self before the stream closure
        var history = conversations[conversationId] ?? []
        let systemPrompt = parameters?.systemPrompt ?? Self.defaultSystemPrompt
        let languageName = Self.detectLanguage(input)
        let languageInstruction = languageName.map { " You MUST respond in \($0)." } ?? ""

        var contextPrompt = "System instruction: \(systemPrompt)\(languageInstruction)\n\n"
        if history.isEmpty {
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
        let prompt = contextPrompt + "User: \(input)\nAssistant:"

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

    /// Clear conversation history
    ///
    /// - Parameter conversationId: Conversation to clear
    func clearConversation(_ conversationId: String) {
        conversations.removeValue(forKey: conversationId)
    }
}
