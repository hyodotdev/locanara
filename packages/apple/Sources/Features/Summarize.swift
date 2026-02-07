import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Summarize feature executor
///
/// Generates summaries of input text using Apple Intelligence Foundation Models.
/// Supports ML Kit compatible input/output types.
internal final class SummarizeExecutor {

    /// Maximum input length (ML Kit limit: 4000 tokens)
    private let maxInputLength = 4000

    /// Execute summarize feature
    ///
    /// - Parameters:
    ///   - input: Text to summarize
    ///   - parameters: Optional summarize parameters (ML Kit compatible)
    /// - Returns: SummarizeResult with summarized text
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: SummarizeParametersInput?
    ) async throws -> SummarizeResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Auto-truncate if needed
        let processedInput: String
        if parameters?.autoTruncate != false && input.count > maxInputLength {
            processedInput = String(input.prefix(maxInputLength))
        } else {
            processedInput = input
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.summarize(input: processedInput, params: parameters)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: processedInput,
            parameters: parameters
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: SummarizeParametersInput?
    ) async throws -> SummarizeResult {
        let outputType = parameters?.outputType ?? .oneBullet

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    outputType: outputType
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.summarize)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        outputType: SummarizeOutputType
    ) async throws -> SummarizeResult {
        guard case .available = SystemLanguageModel.default.availability else {
            throw LocanaraError.modelAssetsUnavailable(availability: String(describing: SystemLanguageModel.default.availability))
        }

        let session = LanguageModelSession()

        let bulletCount: Int
        switch outputType {
        case .oneBullet:
            bulletCount = 1
        case .twoBullets:
            bulletCount = 2
        case .threeBullets:
            bulletCount = 3
        }

        let prompt = """
        Summarize the following text into exactly \(bulletCount) bullet point(s).
        Each bullet point should be concise and capture a key point.
        Format: Start each point with "• "

        Text to summarize:
        \(input)
        """

        do {
            let response = try await session.respond(to: prompt)
            let summary = response.content

            return SummarizeResult(
                summary: summary,
                originalLength: input.count,
                summaryLength: summary.count,
                confidence: 0.95
            )
        } catch {
            let errorDescription = error.localizedDescription.lowercased()
            if errorDescription.contains("asset") || errorDescription.contains("unavailable") {
                throw LocanaraError.modelAssetsUnavailable(availability: String(describing: SystemLanguageModel.default.availability))
            }
            throw LocanaraError.executionFailed(error.localizedDescription)
        }
    }
    #endif
}
