import Foundation

/// Built-in chain for text summarization.
///
/// ```swift
/// let result = try await SummarizeChain(bulletCount: 3).run("article text here")
/// print(result.summary)
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct SummarizeChain: Chain {
    public let name = "SummarizeChain"

    private let model: any LocanaraModel
    private let bulletCount: Int
    private let inputTypeHint: String

    public init(
        model: (any LocanaraModel)? = nil,
        bulletCount: Int = 1,
        inputType: String = "text"
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.bulletCount = bulletCount
        self.inputTypeHint = inputType
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = try BuiltInPrompts.summarize.format([
            "text": input.text,
            "bulletCount": String(bulletCount),
            "inputTypeHint": inputTypeHint
        ])

        print("[SummarizeChain] input: \(input.text.prefix(200))")
        let response = try await model.generate(prompt: prompt, config: .structured)
        let summary = BuiltInPrompts.stripPreamble(response.text.trimmingCharacters(in: .whitespacesAndNewlines))
        print("[SummarizeChain] output: \(summary)")

        let result = SummarizeResult(
            summary: summary,
            originalLength: input.text.count,
            summaryLength: summary.count,
            confidence: 0.95
        )

        return ChainOutput(
            value: result,
            text: summary,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `SummarizeResult` directly.
    public func run(_ text: String) async throws -> SummarizeResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(SummarizeResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from SummarizeChain")
        }
        return result
    }
}
