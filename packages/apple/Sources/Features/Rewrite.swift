import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Rewrite feature executor
///
/// Rewrites text in different styles using Apple Intelligence Foundation Models.
/// Supports ML Kit compatible output types: ELABORATE, EMOJIFY, SHORTEN, FRIENDLY, PROFESSIONAL, REPHRASE
internal final class RewriteExecutor {

    /// Maximum input length (ML Kit limit: 256 tokens)
    private let maxInputLength = 256

    /// Execute rewrite feature
    ///
    /// - Parameters:
    ///   - input: Text to rewrite
    ///   - parameters: Rewrite parameters (outputType required)
    /// - Returns: RewriteResult with rewritten text and alternatives
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: RewriteParametersInput?
    ) async throws -> RewriteResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Validate parameters
        guard let params = parameters else {
            throw LocanaraError.invalidInput("outputType is required for rewriting")
        }

        // Try custom inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.rewrite(input: input, params: params)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: params
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: RewriteParametersInput
    ) async throws -> RewriteResult {
        let outputType = parameters.outputType

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
        throw LocanaraError.featureNotAvailable(.rewrite)
    }

    private func getStyleInstruction(for outputType: RewriteOutputType) -> String {
        switch outputType {
        case .elaborate:
            return "to be more detailed and elaborate. Add context and expand on the ideas."
        case .emojify:
            return "by adding appropriate emojis throughout the text to make it more expressive and fun."
        case .shorten:
            return "to be more concise. Remove unnecessary words while keeping the main meaning."
        case .friendly:
            return "in a friendly, casual tone. Make it warm and approachable."
        case .professional:
            return "in a professional, formal tone. Make it suitable for business communication."
        case .rephrase:
            return "using different words and sentence structures while keeping the same meaning."
        }
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        outputType: RewriteOutputType
    ) async throws -> RewriteResult {
        let session = LanguageModelSession()

        let styleInstruction = getStyleInstruction(for: outputType)

        let prompt = """
        Rewrite the following text \(styleInstruction)
        Return ONLY the rewritten text with no labels, headers, or alternatives.

        Text to rewrite:
        <input>\(input)</input>
        """

        let response = try await session.respond(to: prompt)
        let rewrittenText = response.content.trimmingCharacters(in: .whitespacesAndNewlines)

        return RewriteResult(
            rewrittenText: rewrittenText,
            style: outputType,
            alternatives: nil,
            confidence: 0.88
        )
    }
    #endif
}
