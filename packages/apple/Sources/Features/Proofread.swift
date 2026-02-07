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
        Return ONLY the corrected text with no labels, headers, or explanations.

        Text to proofread:
        <input>\(input)</input>
        """

        let response = try await session.respond(to: prompt)
        let correctedText = response.content.trimmingCharacters(in: .whitespacesAndNewlines)

        let corrections = correctedText != input
            ? Self.extractWordCorrections(original: input, corrected: correctedText)
            : []

        return ProofreadResult(
            correctedText: correctedText.isEmpty ? input : correctedText,
            corrections: corrections,
            hasCorrections: !corrections.isEmpty
        )
    }
    #endif

    /// Extract individual word-level corrections by diffing original and corrected text.
    static func extractWordCorrections(
        original: String,
        corrected: String
    ) -> [ProofreadCorrection] {
        var corrections: [ProofreadCorrection] = []

        let wordPattern = try! NSRegularExpression(pattern: "\\S+")
        let origMatches = wordPattern.matches(in: original, range: NSRange(original.startIndex..., in: original))
        let corrMatches = wordPattern.matches(in: corrected, range: NSRange(corrected.startIndex..., in: corrected))

        if origMatches.count == corrMatches.count {
            for i in 0..<origMatches.count {
                let origRange = Range(origMatches[i].range, in: original)!
                let corrRange = Range(corrMatches[i].range, in: corrected)!
                let origWord = String(original[origRange])
                let corrWord = String(corrected[corrRange])

                if origWord != corrWord {
                    let startPos = original.distance(from: original.startIndex, to: origRange.lowerBound)
                    let endPos = original.distance(from: original.startIndex, to: origRange.upperBound)

                    corrections.append(ProofreadCorrection(
                        original: origWord,
                        corrected: corrWord,
                        type: Self.guessErrorType(original: origWord, corrected: corrWord),
                        confidence: 0.9,
                        startPos: startPos,
                        endPos: endPos
                    ))
                }
            }
        }

        // Fallback: if word counts differ or no corrections found
        if corrections.isEmpty && original != corrected {
            corrections.append(ProofreadCorrection(
                original: original,
                corrected: corrected,
                type: nil,
                confidence: nil,
                startPos: nil,
                endPos: nil
            ))
        }

        return corrections
    }

    private static func guessErrorType(original: String, corrected: String) -> String {
        let origLetters = original.lowercased().filter { $0.isLetter }
        let corrLetters = corrected.lowercased().filter { $0.isLetter }
        if origLetters != corrLetters { return "spelling" }

        let origPunct = original.filter { !$0.isLetter && !$0.isNumber }
        let corrPunct = corrected.filter { !$0.isLetter && !$0.isNumber }
        if origPunct != corrPunct { return "punctuation" }

        return "grammar"
    }
}
