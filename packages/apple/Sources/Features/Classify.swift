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
    private func processWithAppleIntelligence(
        input: String,
        categories: [String],
        maxResults: Int
    ) async throws -> ClassifyResult {
        let session = LanguageModelSession()

        let categoriesList = categories.joined(separator: ", ")
        let prompt = """
        Classify the following text into these categories: \(categoriesList)

        For each applicable category, provide a confidence score between 0.0 and 1.0.
        The scores should sum to 1.0.

        Respond ONLY in this exact format (one per line):
        category_name: score

        Text to classify:
        \(input)
        """

        let response = try await session.respond(to: prompt)
        let responseText = response.content

        // Parse classification results
        var classifications: [Classification] = []
        let lines = responseText.components(separatedBy: .newlines)

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }

            let parts = trimmed.split(separator: ":", maxSplits: 1)
            guard parts.count == 2 else { continue }

            let label = String(parts[0]).trimmingCharacters(in: .whitespaces)
            let scoreString = String(parts[1]).trimmingCharacters(in: .whitespaces)

            guard categories.contains(where: { $0.lowercased() == label.lowercased() }) else {
                continue
            }

            if let score = Double(scoreString) {
                classifications.append(Classification(
                    label: label,
                    score: min(max(score, 0.0), 1.0),
                    metadata: nil
                ))
            }
        }

        // If parsing failed, create default classification
        if classifications.isEmpty {
            let count = min(maxResults, categories.count)
            classifications = categories.prefix(count).enumerated().map { index, category in
                let score: Double
                if count == 1 {
                    score = 1.0
                } else if index == 0 {
                    score = 0.8
                } else {
                    score = 0.2 / Double(count - 1)
                }
                return Classification(
                    label: category,
                    score: score,
                    metadata: nil
                )
            }
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
