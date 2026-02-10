import Foundation

/// Built-in chain for text classification.
///
/// ```swift
/// let result = try await ClassifyChain(categories: ["positive", "negative"]).run("Great product!")
/// print(result.topClassification.label) // "positive"
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct ClassifyChain: Chain {
    public let name = "ClassifyChain"

    private let model: any LocanaraModel
    private let categories: [String]
    private let maxResults: Int

    public init(
        model: (any LocanaraModel)? = nil,
        categories: [String] = ["positive", "negative", "neutral"],
        maxResults: Int = 3
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.categories = categories
        self.maxResults = maxResults
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = try BuiltInPrompts.classify.format([
            "text": input.text,
            "categories": categories.joined(separator: ", ")
        ])

        let response = try await model.generate(prompt: prompt, config: .structured)
        let text = response.text.trimmingCharacters(in: .whitespacesAndNewlines)

        print("[ClassifyChain] raw response:\n---\n\(text)\n---")

        var classifications = text.components(separatedBy: "\n")
            .filter { !$0.isEmpty }
            .compactMap { line -> Classification? in
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                guard let colonIndex = trimmed.lastIndex(of: ":") else { return nil }
                let label = String(trimmed[trimmed.startIndex..<colonIndex]).trimmingCharacters(in: .whitespaces).lowercased()
                let scoreStr = String(trimmed[trimmed.index(after: colonIndex)...]).trimmingCharacters(in: .whitespaces)
                let score = Double(scoreStr) ?? 0.0
                guard categories.contains(where: { $0.lowercased() == label }) else { return nil }
                return Classification(label: label, score: score)
            }

        // Fallback: if parsing found nothing, match against known categories
        if classifications.isEmpty {
            let lower = text.lowercased()
            if let match = categories.first(where: { lower.contains($0.lowercased()) }) {
                classifications = [Classification(label: match.lowercased(), score: 1.0)]
            } else {
                classifications = [Classification(label: text, score: 1.0)]
            }
        }

        print("[ClassifyChain] parsed: \(classifications.map { "\($0.label): \($0.score)" })")

        let sorted = Array(classifications.sorted { $0.score > $1.score }.prefix(maxResults))
        let result = ClassifyResult(
            classifications: sorted,
            topClassification: sorted[0]
        )

        return ChainOutput(
            value: result,
            text: sorted[0].label,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `ClassifyResult` directly.
    public func run(_ text: String) async throws -> ClassifyResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(ClassifyResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from ClassifyChain")
        }
        return result
    }
}
