import Foundation

/// Built-in chain for entity extraction.
///
/// ```swift
/// let result = try await ExtractChain(entityTypes: ["person", "location"]).run("Tim Cook announced...")
/// print(result.entities.map(\.value))
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct ExtractChain: Chain {
    public let name = "ExtractChain"

    private let model: any LocanaraModel
    private let entityTypes: [String]

    public init(
        model: (any LocanaraModel)? = nil,
        entityTypes: [String] = ["person", "location", "date", "organization"]
    ) {
        self.model = model ?? LocanaraDefaults.model
        self.entityTypes = entityTypes
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = try BuiltInPrompts.extract.format([
            "text": input.text,
            "entityTypes": entityTypes.joined(separator: ", ")
        ])

        print("[ExtractChain] input: \(input.text.prefix(200))")
        let response = try await model.generate(prompt: prompt, config: .structured)
        let text = response.text.trimmingCharacters(in: .whitespacesAndNewlines)
        print("[ExtractChain] output: \(text)")

        let entities = text.components(separatedBy: "\n")
            .filter { !$0.isEmpty }
            .compactMap { line -> Entity? in
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                guard let colonIndex = trimmed.firstIndex(of: ":") else {
                    return Entity(type: "extracted", value: trimmed, confidence: 0.8)
                }
                let type = String(trimmed[trimmed.startIndex..<colonIndex]).trimmingCharacters(in: .whitespaces).lowercased()
                let value = String(trimmed[trimmed.index(after: colonIndex)...]).trimmingCharacters(in: .whitespaces)
                guard !value.isEmpty else { return nil }
                return Entity(type: type, value: value, confidence: 0.9)
            }

        let result = ExtractResult(entities: entities)

        return ChainOutput(
            value: result,
            text: text,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    /// Type-safe execution that returns `ExtractResult` directly.
    public func run(_ text: String) async throws -> ExtractResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(ExtractResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type from ExtractChain")
        }
        return result
    }
}
