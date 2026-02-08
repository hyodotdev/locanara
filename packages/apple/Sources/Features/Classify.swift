import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Classify feature executor
///
/// Classifies input text into categories using Apple Intelligence Foundation Models.
internal final class ClassifyExecutor {

    /// Execute classify feature
    ///
    /// - Parameters:
    ///   - input: Text to classify
    ///   - parameters: Optional classify parameters
    /// - Returns: ClassifyResult with classifications
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ClassifyParametersInput?
    ) async throws -> ClassifyResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.classify(input: input, params: parameters)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: parameters
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: ClassifyParametersInput?
    ) async throws -> ClassifyResult {
        let categories = parameters?.categories ?? ["positive", "negative", "neutral"]
        let maxResults = parameters?.maxResults ?? 3

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    categories: categories,
                    maxResults: maxResults
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.classify)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ClassifyItemOutput {
        @Guide(description: "Category label from the provided list")
        var label: String
        @Guide(description: "Confidence score between 0.0 and 1.0")
        var score: Double
    }

    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ClassifyOutput {
        @Guide(description: "Classification results for each category")
        var items: [ClassifyItemOutput]
    }

    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        categories: [String],
        maxResults: Int
    ) async throws -> ClassifyResult {
        let session = LanguageModelSession()

        let categoriesList = categories.joined(separator: ", ")
        let prompt = """
        Classify the following text into these categories: \(categoriesList)
        Assign a confidence score between 0.0 and 1.0 to each applicable category.
        The scores should sum to 1.0.

        Text to classify:
        <input>\(input)</input>
        """

        let output = try await session.respond(to: prompt, generating: ClassifyOutput.self).content

        var classifications = output.items
            .filter { item in categories.contains(where: { $0.lowercased() == item.label.lowercased() }) }
            .map { item in
                Classification(
                    label: item.label,
                    score: min(max(item.score, 0.0), 1.0),
                    metadata: nil
                )
            }

        classifications.sort { $0.score > $1.score }
        classifications = Array(classifications.prefix(maxResults))

        guard let topClassification = classifications.first else {
            throw LocanaraError.executionFailed("No classifications generated")
        }

        return ClassifyResult(
            classifications: classifications,
            topClassification: topClassification
        )
    }
    #endif
}
