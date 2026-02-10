import Foundation

// MARK: - Convenience methods on LocanaraModel

@available(iOS 15.0, macOS 14.0, *)
public extension LocanaraModel {

    /// Summarize text.
    ///
    /// ```swift
    /// let result = try await model.summarize("article text", bulletCount: 3)
    /// print(result.summary)
    /// ```
    func summarize(_ text: String, bulletCount: Int = 1) async throws -> SummarizeResult {
        try await SummarizeChain(model: self, bulletCount: bulletCount).run(text)
    }

    /// Classify text into categories.
    ///
    /// ```swift
    /// let result = try await model.classify("Great product!", categories: ["positive", "negative"])
    /// print(result.topClassification.label)
    /// ```
    func classify(
        _ text: String,
        categories: [String] = ["positive", "negative", "neutral"],
        maxResults: Int = 3
    ) async throws -> ClassifyResult {
        try await ClassifyChain(model: self, categories: categories, maxResults: maxResults).run(text)
    }

    /// Extract entities from text.
    ///
    /// ```swift
    /// let result = try await model.extract("Tim Cook announced...", entityTypes: ["person", "location"])
    /// print(result.entities.map(\.value))
    /// ```
    func extract(
        _ text: String,
        entityTypes: [String] = ["person", "location", "date", "organization"]
    ) async throws -> ExtractResult {
        try await ExtractChain(model: self, entityTypes: entityTypes).run(text)
    }

    /// Chat with the model.
    ///
    /// ```swift
    /// let result = try await model.chat("Hello!")
    /// print(result.message)
    /// ```
    func chat(
        _ text: String,
        memory: (any Memory)? = nil,
        systemPrompt: String = "You are a friendly, helpful assistant. Respond naturally."
    ) async throws -> ChatResult {
        try await ChatChain(model: self, memory: memory, systemPrompt: systemPrompt).run(text)
    }

    /// Translate text to a target language.
    ///
    /// ```swift
    /// let result = try await model.translate("Hello world", to: "ko")
    /// print(result.translatedText)
    /// ```
    func translate(
        _ text: String,
        to targetLanguage: String,
        from sourceLanguage: String = "en"
    ) async throws -> TranslateResult {
        try await TranslateChain(
            model: self, sourceLanguage: sourceLanguage, targetLanguage: targetLanguage
        ).run(text)
    }

    /// Rewrite text in a specific style.
    ///
    /// ```swift
    /// let result = try await model.rewrite("hey whats up", style: .professional)
    /// print(result.rewrittenText)
    /// ```
    func rewrite(_ text: String, style: RewriteOutputType) async throws -> RewriteResult {
        try await RewriteChain(model: self, style: style).run(text)
    }

    /// Proofread text for grammar and spelling.
    ///
    /// ```swift
    /// let result = try await model.proofread("Ths is a tset")
    /// print(result.correctedText)
    /// ```
    func proofread(_ text: String) async throws -> ProofreadResult {
        try await ProofreadChain(model: self).run(text)
    }
}
