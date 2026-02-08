import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Proofread feature executor
///
/// Proofreads text for grammar and spelling errors using Apple Intelligence Foundation Models.
/// Supports ML Kit compatible input types: KEYBOARD, VOICE
internal final class ProofreadExecutor {

    /// Maximum input length (ML Kit limit: 256 tokens)
    private let maxInputLength = 256

    /// Execute proofread feature
    ///
    /// - Parameters:
    ///   - input: Text to proofread
    ///   - parameters: Optional proofread parameters (ML Kit compatible)
    /// - Returns: ProofreadResult with corrected text and corrections list
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ProofreadParametersInput?
    ) async throws -> ProofreadResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.proofread(input: input, params: parameters)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: parameters
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: ProofreadParametersInput?
    ) async throws -> ProofreadResult {
        let inputType = parameters?.inputType ?? .keyboard

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    inputType: inputType
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.proofread)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ProofreadCorrectionOutput {
        @Guide(description: "The original incorrect word or phrase")
        var original: String
        @Guide(description: "The corrected version")
        var corrected: String
        @Guide(description: "Error type: spelling, grammar, or punctuation")
        var type: String
    }

    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ProofreadOutput {
        @Guide(description: "The full corrected text with all corrections applied")
        var correctedText: String
        @Guide(description: "List of individual corrections made, empty if no corrections needed")
        var corrections: [ProofreadCorrectionOutput]
    }

    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        inputType: ProofreadInputType
    ) async throws -> ProofreadResult {
        let session = LanguageModelSession()

        let contextHint = inputType == .voice
            ? "This text was transcribed from speech, so watch for homophones and speech-to-text errors."
            : "This text was typed, so watch for typos and spelling errors."

        let prompt = """
        Proofread the following text for grammar, spelling, and punctuation errors.
        \(contextHint)
        Provide the full corrected text and list each individual correction.

        Text to proofread:
        <input>\(input)</input>
        """

        let output = try await session.respond(to: prompt, generating: ProofreadOutput.self).content
        let correctedText = output.correctedText.trimmingCharacters(in: .whitespacesAndNewlines)

        let corrections = output.corrections.map { c in
            var correction = ProofreadCorrection(
                original: c.original,
                corrected: c.corrected,
                type: c.type,
                confidence: 0.9,
                startPos: nil,
                endPos: nil
            )
            if let range = input.range(of: c.original) {
                correction.startPos = input.distance(from: input.startIndex, to: range.lowerBound)
                correction.endPos = input.distance(from: input.startIndex, to: range.upperBound)
            }
            return correction
        }

        return ProofreadResult(
            correctedText: correctedText.isEmpty ? input : correctedText,
            corrections: corrections,
            hasCorrections: !corrections.isEmpty
        )
    }
    #endif
}
