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

        For each correction, provide:
        - The original text
        - The corrected text
        - The type of error (spelling, grammar, punctuation)
        - A confidence score (0.0 to 1.0)

        Format your response as:
        CORRECTED: [The fully corrected text]

        CORRECTIONS:
        CORRECTION|original|corrected|type|confidence

        If there are no errors, respond with:
        CORRECTED: [original text]
        CORRECTIONS: NONE

        Text to proofread:
        \(input)
        """

        let response = try await session.respond(to: prompt)
        let responseText = response.content

        // Parse the response
        var correctedText = input
        var corrections: [ProofreadCorrection] = []
        var usedRanges: [Range<String.Index>] = []

        let lines = responseText.components(separatedBy: .newlines)
        var parsingCorrections = false

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if trimmed.hasPrefix("CORRECTED:") {
                correctedText = String(trimmed.dropFirst(10)).trimmingCharacters(in: .whitespaces)
            } else if trimmed == "CORRECTIONS:" || trimmed.hasPrefix("CORRECTIONS:") {
                parsingCorrections = true
                if trimmed.contains("NONE") {
                    parsingCorrections = false
                }
            } else if parsingCorrections && trimmed.hasPrefix("CORRECTION|") {
                let parts = trimmed.split(separator: "|")
                if parts.count >= 5 {
                    let original = String(parts[1]).trimmingCharacters(in: .whitespaces)
                    let corrected = String(parts[2]).trimmingCharacters(in: .whitespaces)
                    let type = String(parts[3]).trimmingCharacters(in: .whitespaces)
                    let confidenceStr = String(parts[4]).trimmingCharacters(in: .whitespaces)

                    var startPos: Int? = nil
                    var endPos: Int? = nil
                    var searchRange = input.startIndex..<input.endIndex

                    while let range = input.range(of: original, range: searchRange) {
                        let isUsed = usedRanges.contains { usedRange in
                            range.overlaps(usedRange)
                        }

                        if !isUsed {
                            startPos = input.distance(from: input.startIndex, to: range.lowerBound)
                            endPos = input.distance(from: input.startIndex, to: range.upperBound)
                            usedRanges.append(range)
                            break
                        }

                        if range.upperBound < input.endIndex {
                            searchRange = range.upperBound..<input.endIndex
                        } else {
                            break
                        }
                    }

                    let confidence = Double(confidenceStr) ?? 0.85

                    corrections.append(ProofreadCorrection(
                        original: original,
                        corrected: corrected,
                        type: type,
                        confidence: min(max(confidence, 0.0), 1.0),
                        startPos: startPos,
                        endPos: endPos
                    ))
                }
            }
        }

        return ProofreadResult(
            correctedText: correctedText,
            corrections: corrections,
            hasCorrections: !corrections.isEmpty
        )
    }
    #endif
}
