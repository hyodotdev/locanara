import Foundation

/// Built-in chain for text rewriting in different styles.
///
/// ```swift
/// let result = try await RewriteChain(style: .professional).run("hey whats up")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct RewriteChain: Chain {
    public let name = "RewriteChain"

    private let model: any LocanaraModel
    private let style: RewriteOutputType

    public init(
        model: (any LocanaraModel)? = nil,
        style: RewriteOutputType
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.style = style
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let styleInstruction: String
        switch style {
        case .elaborate:
            styleInstruction = "to be more detailed and elaborate."
        case .emojify:
            styleInstruction = "by adding appropriate emojis throughout."
        case .shorten:
            styleInstruction = "to be more concise."
        case .friendly:
            styleInstruction = "in a friendly, casual tone."
        case .professional:
            styleInstruction = "in a professional, formal tone."
        case .rephrase:
            styleInstruction = "using different words while keeping the same meaning."
        }

        let prompt = try BuiltInPrompts.rewrite.format([
            "text": input.text,
            "styleInstruction": styleInstruction
        ])

        print("[RewriteChain] input: \(input.text.prefix(200))")
        let response = try await model.generate(prompt: prompt, config: .structured)
        let rewritten = BuiltInPrompts.stripPreamble(response.text.trimmingCharacters(in: .whitespacesAndNewlines))
        print("[RewriteChain] output: \(rewritten)")

        let result = RewriteResult(
            rewrittenText: rewritten,
            style: style,
            alternatives: nil,
            confidence: 0.88
        )

        return ChainOutput(
            value: result,
            text: rewritten,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `RewriteResult` directly.
    public func run(_ text: String) async throws -> RewriteResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(RewriteResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from RewriteChain")
        }
        return result
    }
}
