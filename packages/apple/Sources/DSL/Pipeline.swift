import Foundation

// MARK: - Type-erased Step (internal)

@available(iOS 15.0, macOS 14.0, *)
struct AnyPipelineStep: Sendable {
    private let _buildChain: @Sendable (any LocanaraModel) -> any Chain

    init<S: PipelineStep>(_ step: S) {
        self._buildChain = { model in step.buildChain(model: model) }
    }

    func buildChain(model: any LocanaraModel) -> any Chain {
        _buildChain(model)
    }
}

// MARK: - Pipeline Definition

/// Intermediate representation built by `@PipelineBuilder`.
/// The generic `Output` parameter tracks the output type of the last step at compile time.
@available(iOS 15.0, macOS 14.0, *)
public struct PipelineDefinition<Output: Sendable>: Sendable {
    let steps: [AnyPipelineStep]
}

// MARK: - Result Builder

/// Result builder that tracks the output type of the pipeline at compile time.
///
/// Each step added updates the `Output` type to match the last step's output.
/// This ensures the compiler catches type mismatches before runtime.
@available(iOS 15.0, macOS 14.0, *)
@resultBuilder
public struct PipelineBuilder {
    public static func buildPartialBlock<S: PipelineStep>(
        first: S
    ) -> PipelineDefinition<S.Output> {
        PipelineDefinition(steps: [AnyPipelineStep(first)])
    }

    public static func buildPartialBlock<PrevOutput: Sendable, S: PipelineStep>(
        accumulated: PipelineDefinition<PrevOutput>,
        next: S
    ) -> PipelineDefinition<S.Output> {
        PipelineDefinition(steps: accumulated.steps + [AnyPipelineStep(next)])
    }
}

// MARK: - Pipeline

/// A type-safe AI pipeline. The `Output` type is determined at compile time by the last step.
///
/// ```swift
/// // Compiler knows this returns TranslateResult
/// let result = try await model.pipeline {
///     Summarize(bulletCount: 3)
///     Translate(to: "ko")
/// }.run("article text")
///
/// // Compile error: Cannot convert TranslateResult to SummarizeResult
/// let wrong: SummarizeResult = try await model.pipeline {
///     Summarize(bulletCount: 3)
///     Translate(to: "ko")
/// }.run("text")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct Pipeline<Output: Sendable>: Sendable {
    private let model: any LocanaraModel
    private let steps: [AnyPipelineStep]

    init(model: (any LocanaraModel)? = nil, steps: [AnyPipelineStep]) {
        self.model = model ?? LocanaraDefaults.model
        self.steps = steps
    }

    /// Execute the pipeline. Returns the concrete output type of the last step.
    public func run(_ text: String, metadata: [String: String] = [:]) async throws -> Output {
        guard !steps.isEmpty else {
            throw LocanaraError.executionFailed("Pipeline has no steps")
        }

        var currentInput = ChainInput(text: text, metadata: metadata)
        var lastOutput: ChainOutput?

        for step in steps {
            let chain = step.buildChain(model: model)
            lastOutput = try await chain.invoke(currentInput)
            currentInput = ChainInput(
                text: lastOutput!.text,
                metadata: lastOutput!.metadata
            )
        }

        guard let result = lastOutput?.typed(Output.self) else {
            throw LocanaraError.executionFailed(
                "Pipeline output type mismatch: expected \(Output.self)"
            )
        }
        return result
    }
}

// MARK: - Model Extension

@available(iOS 15.0, macOS 14.0, *)
public extension LocanaraModel {
    /// Create a type-safe pipeline. The return type is determined by the last step.
    ///
    /// ```swift
    /// let result = try await model.pipeline {
    ///     Summarize(bulletCount: 3)
    ///     Translate(to: "ko")
    /// }.run("text")
    /// // result is TranslateResult - compiler enforced
    /// ```
    func pipeline<Output: Sendable>(
        @PipelineBuilder _ build: () -> PipelineDefinition<Output>
    ) -> Pipeline<Output> {
        let definition = build()
        return Pipeline(model: self, steps: definition.steps)
    }
}
