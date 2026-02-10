import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Built-in chain for grammar and spelling correction.
///
/// Uses `@Generable` structured output on Apple Intelligence for accurate corrections
/// with a detailed corrections list. Falls back to text-based proofreading on other models.
///
/// ```swift
/// let result = try await ProofreadChain().run("Ths is a tset")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct ProofreadChain: Chain {
    public let name = "ProofreadChain"

    private let model: any LocanaraModel

    public init(model: (any LocanaraModel)? = nil) {
        self.model = model ?? LocanaraDefaults.model
    }

    // MARK: - @Generable structured output types

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct CorrectionOutput {
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
        var corrections: [CorrectionOutput]
    }
    #endif

    // MARK: - Invoke

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        print("[ProofreadChain] input: \(input.text.prefix(200))")

        let startTime = Date()

        // Try structured generation first (Apple Intelligence)
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            let prompt = """
            Proofread the following text for grammar, spelling, and punctuation errors.
            Provide the full corrected text and list each individual correction.

            Text to proofread:
            <input>\(input.text.replacingOccurrences(of: "</input>", with: ""))</input>
            """

            if let output: ProofreadOutput = try await model.generateStructured(prompt: prompt, type: ProofreadOutput.self) {
                let correctedText = output.correctedText.trimmingCharacters(in: .whitespacesAndNewlines)
                let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)
                print("[ProofreadChain] output (structured): \(correctedText)")

                var searchStart = input.text.startIndex
                let corrections = output.corrections.map { c in
                    var correction = ProofreadCorrection(
                        original: c.original,
                        corrected: c.corrected,
                        type: c.type,
                        confidence: 0.9,
                        startPos: nil,
                        endPos: nil
                    )
                    if let range = input.text.range(of: c.original, range: searchStart..<input.text.endIndex) {
                        correction.startPos = input.text.distance(from: input.text.startIndex, to: range.lowerBound)
                        correction.endPos = input.text.distance(from: input.text.startIndex, to: range.upperBound)
                        searchStart = range.upperBound
                    }
                    return correction
                }

                let result = ProofreadResult(
                    correctedText: correctedText.isEmpty ? input.text : correctedText,
                    corrections: corrections,
                    hasCorrections: !corrections.isEmpty
                )

                return ChainOutput(
                    value: result,
                    text: correctedText,
                    metadata: input.metadata,
                    processingTimeMs: elapsed
                )
            }
        }
        #endif

        // Fallback: text-based proofreading
        let prompt = try BuiltInPrompts.proofread.format([
            "text": input.text
        ])

        let response = try await model.generate(prompt: prompt, config: .structured)
        let corrected = BuiltInPrompts.stripPreamble(response.text.trimmingCharacters(in: .whitespacesAndNewlines))
        print("[ProofreadChain] output (text): \(corrected)")

        let result = ProofreadResult(
            correctedText: corrected,
            corrections: [],
            hasCorrections: corrected != input.text
        )

        return ChainOutput(
            value: result,
            text: corrected,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `ProofreadResult` directly.
    public func run(_ text: String) async throws -> ProofreadResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(ProofreadResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from ProofreadChain")
        }
        return result
    }
}
