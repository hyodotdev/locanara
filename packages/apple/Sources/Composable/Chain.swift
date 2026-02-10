import Foundation

// MARK: - Chain Protocol

/// Core protocol for composable AI processing pipelines.
///
/// A Chain takes a `ChainInput` and produces a `ChainOutput`.
/// Chains can be composed sequentially, in parallel, or conditionally.
///
/// ```swift
/// let pipeline = SequentialChain(chains: [summarizeChain, translateChain])
/// let result = try await pipeline.invoke(ChainInput(text: article))
/// ```
@available(iOS 15.0, macOS 14.0, *)
public protocol Chain: Sendable {
    /// Human-readable name for logging and debugging
    var name: String { get }

    /// Execute this chain with the given input
    func invoke(_ input: ChainInput) async throws -> ChainOutput
}

// MARK: - Sequential Chain

/// Composes chains to run sequentially, passing output → input
@available(iOS 15.0, macOS 14.0, *)
public struct SequentialChain: Chain {
    public let name: String
    private let chains: [any Chain]

    public init(name: String = "SequentialChain", chains: [any Chain]) {
        self.name = name
        self.chains = chains
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        var current = input
        var lastOutput: ChainOutput?

        for chain in chains {
            let output = try await chain.invoke(current)
            current = ChainInput(text: output.text, metadata: output.metadata)
            lastOutput = output
        }

        guard let result = lastOutput else {
            throw LocanaraError.executionFailed("SequentialChain has no chains")
        }
        return result
    }
}

// MARK: - Parallel Chain

/// Runs chains in parallel and collects all results
@available(iOS 15.0, macOS 14.0, *)
public struct ParallelChain: Chain {
    public let name: String
    private let chains: [any Chain]

    public init(name: String = "ParallelChain", chains: [any Chain]) {
        self.name = name
        self.chains = chains
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let results = try await withThrowingTaskGroup(of: ChainOutput.self) { group in
            for chain in chains {
                group.addTask {
                    try await chain.invoke(input)
                }
            }

            var outputs: [ChainOutput] = []
            for try await result in group {
                outputs.append(result)
            }
            return outputs
        }

        let combinedText = results.map(\.text).joined(separator: "\n---\n")
        var combinedMetadata = input.metadata
        for result in results {
            combinedMetadata.merge(result.metadata) { _, new in new }
        }

        return ChainOutput(
            value: results,
            text: combinedText,
            metadata: combinedMetadata
        )
    }
}

// MARK: - Conditional Chain

/// Routes to different chains based on a condition function
@available(iOS 15.0, macOS 14.0, *)
public struct ConditionalChain: Chain {
    public let name: String
    private let condition: @Sendable (ChainInput) -> String
    private let branches: [String: any Chain]
    private let defaultChain: (any Chain)?

    public init(
        name: String = "ConditionalChain",
        condition: @escaping @Sendable (ChainInput) -> String,
        branches: [String: any Chain],
        defaultChain: (any Chain)? = nil
    ) {
        self.name = name
        self.condition = condition
        self.branches = branches
        self.defaultChain = defaultChain
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let branchKey = condition(input)
        guard let chain = branches[branchKey] ?? defaultChain else {
            throw LocanaraError.executionFailed(
                "No branch found for key '\(branchKey)' in ConditionalChain"
            )
        }
        return try await chain.invoke(input)
    }
}

// MARK: - Model Chain

/// A simple chain that sends input to a model and returns the response.
/// This is the basic building block for custom chains.
@available(iOS 15.0, macOS 14.0, *)
public struct ModelChain: Chain {
    public let name: String
    private let model: any LocanaraModel
    private let promptTemplate: PromptTemplate?
    private let config: GenerationConfig?

    public init(
        name: String = "ModelChain",
        model: (any LocanaraModel)? = nil,
        promptTemplate: PromptTemplate? = nil,
        config: GenerationConfig? = nil
    ) {
        self.name = name
        self.model = model ?? LocanaraDefaults.model
        self.promptTemplate = promptTemplate
        self.config = config
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt: String
        if let template = promptTemplate {
            var values = input.metadata
            values["text"] = input.text
            prompt = try template.format(values)
        } else {
            prompt = input.text
        }

        let response = try await model.generate(prompt: prompt, config: config)

        return ChainOutput(
            value: response.text,
            text: response.text,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }
}
