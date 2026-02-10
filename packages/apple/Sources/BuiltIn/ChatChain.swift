import Foundation
import NaturalLanguage

/// Built-in chain for conversational AI with memory support.
///
/// ```swift
/// let chain = ChatChain(memory: BufferMemory())
/// let result = try await chain.run("Hello!")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct ChatChain: Chain {
    public let name = "ChatChain"

    private let model: any LocanaraModel
    private let memory: (any Memory)?
    private let systemPrompt: String

    public init(
        model: (any LocanaraModel)? = nil,
        memory: (any Memory)? = nil,
        systemPrompt: String = "You are a friendly, helpful assistant."
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.memory = memory
        self.systemPrompt = systemPrompt
    }

    /// Detect the dominant language of the input text.
    /// Uses NLLanguageRecognizer only when non-Latin characters are present.
    /// Short Latin-only text defaults to English (avoids misdetection like "hi" → Catalan).
    private func detectLanguage(_ text: String) -> String {
        let hasNonLatin = text.unicodeScalars.contains { scalar in
            let v = scalar.value
            return (v >= 0xAC00 && v <= 0xD7AF) || // Hangul
                   (v >= 0x1100 && v <= 0x11FF) || // Hangul Jamo
                   (v >= 0x3130 && v <= 0x318F) || // Hangul Compat Jamo
                   (v >= 0x3040 && v <= 0x309F) || // Hiragana
                   (v >= 0x30A0 && v <= 0x30FF) || // Katakana
                   (v >= 0x4E00 && v <= 0x9FFF) || // CJK
                   (v >= 0x0600 && v <= 0x06FF) || // Arabic
                   (v >= 0x0400 && v <= 0x04FF) || // Cyrillic
                   (v >= 0x0E00 && v <= 0x0E7F)    // Thai
        }

        guard hasNonLatin else { return "English" }

        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        guard let lang = recognizer.dominantLanguage else { return "English" }
        return Locale(identifier: "en").localizedString(forIdentifier: lang.rawValue) ?? "English"
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        var historyText = ""
        if let memory = memory {
            let entries = await memory.load(for: input)
            historyText = entries.map { "\($0.role.capitalized): \($0.content)" }
                .joined(separator: "\n") + "\n"
        }

        let detectedLang = detectLanguage(input.text)
        let languageInstruction = "IMPORTANT: You MUST reply in \(detectedLang). Do NOT reply in any other language."

        let prompt = try BuiltInPrompts.chat.format([
            "text": input.text,
            "systemPrompt": "System instruction: \(systemPrompt)",
            "history": historyText,
            "languageInstruction": languageInstruction
        ])

        print("[ChatChain] detected language: \(detectedLang)")
        print("[ChatChain] input: \(input.text)")
        let response = try await model.generate(prompt: prompt, config: .conversational)
        let message = response.text.trimmingCharacters(in: .whitespacesAndNewlines)
        print("[ChatChain] output: \(message)")

        let result = ChatResult(
            message: message,
            canContinue: true
        )

        let output = ChainOutput(
            value: result,
            text: message,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )

        if let memory = memory {
            await memory.save(input: input, output: output)
        }

        return output
    }

    /// Type-safe execution that returns `ChatResult` directly.
    public func run(_ text: String) async throws -> ChatResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(ChatResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from ChatChain")
        }
        return result
    }

    /// Stream a chat response, yielding text chunks as they arrive.
    /// Memory is saved after the stream completes.
    public func streamRun(_ text: String) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task { @Sendable in
                do {
                    let input = ChainInput(text: text)
                    var historyText = ""
                    if let memory = memory {
                        let entries = await memory.load(for: input)
                        historyText = entries.map { "\($0.role.capitalized): \($0.content)" }
                            .joined(separator: "\n") + "\n"
                    }

                    let detectedLang = detectLanguage(text)
                    let languageInstruction = "IMPORTANT: You MUST reply in \(detectedLang). Do NOT reply in any other language."

                    let prompt = try BuiltInPrompts.chat.format([
                        "text": text,
                        "systemPrompt": "System instruction: \(systemPrompt)",
                        "history": historyText,
                        "languageInstruction": languageInstruction
                    ])

                    print("[ChatChain] streaming, detected language: \(detectedLang)")
                    print("[ChatChain] input: \(text)")

                    var accumulated = ""
                    for try await chunk in model.stream(prompt: prompt, config: .conversational) {
                        accumulated += chunk
                        continuation.yield(chunk)
                    }

                    print("[ChatChain] output (streamed): \(accumulated)")

                    if let memory = memory {
                        let result = ChatResult(message: accumulated, canContinue: true)
                        let output = ChainOutput(
                            value: result,
                            text: accumulated,
                            metadata: input.metadata,
                            processingTimeMs: nil
                        )
                        await memory.save(input: input, output: output)
                    }

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}
