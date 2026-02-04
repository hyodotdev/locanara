import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Translate feature executor
///
/// Translates text between languages using Apple Intelligence Foundation Models.
internal final class TranslateExecutor {

    /// Supported language codes
    private let supportedLanguages = ["en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "ru"]

    /// Language names for prompts
    private let languageNames: [String: String] = [
        "en": "English",
        "ko": "Korean",
        "ja": "Japanese",
        "zh": "Chinese",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian"
    ]

    /// Execute translate feature
    ///
    /// - Parameters:
    ///   - input: Text to translate
    ///   - parameters: Optional translate parameters (target language required)
    /// - Returns: TranslateResult with translated text
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: TranslateParametersInput?
    ) async throws -> TranslateResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Validate parameters
        guard let params = parameters else {
            throw LocanaraError.invalidInput("Target language is required for translation")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.translate(input: input, params: params)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: params
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: TranslateParametersInput
    ) async throws -> TranslateResult {
        let targetLanguage = parameters.targetLanguage
        let sourceLanguage = parameters.sourceLanguage ?? detectLanguage(input)

        // Validate languages
        guard supportedLanguages.contains(targetLanguage) else {
            throw LocanaraError.invalidInput("Target language '\(targetLanguage)' is not supported")
        }

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    sourceLanguage: sourceLanguage,
                    targetLanguage: targetLanguage
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.translate)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        sourceLanguage: String,
        targetLanguage: String
    ) async throws -> TranslateResult {
        // If same language, return as-is
        if sourceLanguage == targetLanguage {
            return TranslateResult(
                translatedText: input,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                confidence: 1.0
            )
        }

        let session = LanguageModelSession()

        let sourceLangName = languageNames[sourceLanguage] ?? sourceLanguage
        let targetLangName = languageNames[targetLanguage] ?? targetLanguage

        let prompt = """
        Translate the following text from \(sourceLangName) to \(targetLangName).
        Provide ONLY the translation, no explanations or additional text.

        Text to translate:
        \(input)
        """

        let response = try await session.respond(to: prompt)
        let translatedText = response.content.trimmingCharacters(in: .whitespacesAndNewlines)

        return TranslateResult(
            translatedText: translatedText,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: 0.90
        )
    }
    #endif

    private func detectLanguage(_ text: String) -> String {
        // Simple language detection using linguistic tagger
        let tagger = NSLinguisticTagger(tagSchemes: [.language], options: 0)
        tagger.string = text

        if let language = tagger.dominantLanguage {
            // Convert to our supported format
            let languageCode = String(language.prefix(2))
            if supportedLanguages.contains(languageCode) {
                return languageCode
            }
        }

        return "en" // Default to English
    }
}
