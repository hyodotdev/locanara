import Foundation

/// Built-in chain for language translation.
///
/// ```swift
/// let result = try await TranslateChain(targetLanguage: "ko").run("Hello world")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct TranslateChain: Chain {
    public let name = "TranslateChain"

    private let model: any LocanaraModel
    private let sourceLanguage: String
    private let targetLanguage: String

    public init(
        model: (any LocanaraModel)? = nil,
        sourceLanguage: String = "en",
        targetLanguage: String
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.sourceLanguage = sourceLanguage
        self.targetLanguage = targetLanguage
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let sourceLang = Locale(identifier: "en")
            .localizedString(forIdentifier: sourceLanguage) ?? sourceLanguage
        let targetLang = Locale(identifier: "en")
            .localizedString(forIdentifier: targetLanguage) ?? targetLanguage

        let prompt = try BuiltInPrompts.translate.format([
            "text": input.text,
            "sourceLang": sourceLang,
            "targetLang": targetLang
        ])

        print("[TranslateChain] input: \(input.text.prefix(200))")
        let response = try await model.generate(prompt: prompt, config: .structured)
        let translated = BuiltInPrompts.stripPreamble(response.text.trimmingCharacters(in: .whitespacesAndNewlines))
        print("[TranslateChain] output: \(translated)")

        let result = TranslateResult(
            translatedText: translated,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: 0.90
        )

        return ChainOutput(
            value: result,
            text: translated,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `TranslateResult` directly.
    public func run(_ text: String) async throws -> TranslateResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(TranslateResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from TranslateChain")
        }
        return result
    }
}
