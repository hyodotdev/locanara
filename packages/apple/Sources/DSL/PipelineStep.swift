import Foundation

// MARK: - Pipeline Step Protocol

/// A declarative step in an AI pipeline with compile-time output type tracking.
@available(iOS 15.0, macOS 14.0, *)
public protocol PipelineStep<Output>: Sendable {
    associatedtype Output: Sendable
    func buildChain(model: any LocanaraModel) -> any Chain
}

// MARK: - Built-in Steps

/// Summarize text with configurable bullet count.
@available(iOS 15.0, macOS 14.0, *)
public struct Summarize: PipelineStep {
    public typealias Output = SummarizeResult

    private let bulletCount: Int

    public init(bulletCount: Int = 1) {
        self.bulletCount = bulletCount
    }

    public func buildChain(model: any LocanaraModel) -> any Chain {
        SummarizeChain(model: model, bulletCount: bulletCount)
    }
}

/// Classify text into categories.
@available(iOS 15.0, macOS 14.0, *)
public struct Classify: PipelineStep {
    public typealias Output = ClassifyResult

    private let categories: [String]
    private let maxResults: Int

    public init(
        categories: [String] = ["positive", "negative", "neutral"],
        maxResults: Int = 3
    ) {
        self.categories = categories
        self.maxResults = maxResults
    }

    public func buildChain(model: any LocanaraModel) -> any Chain {
        ClassifyChain(model: model, categories: categories, maxResults: maxResults)
    }
}

/// Extract entities from text.
@available(iOS 15.0, macOS 14.0, *)
public struct Extract: PipelineStep {
    public typealias Output = ExtractResult

    private let entityTypes: [String]

    public init(entityTypes: [String] = ["person", "location", "date", "organization"]) {
        self.entityTypes = entityTypes
    }

    public func buildChain(model: any LocanaraModel) -> any Chain {
        ExtractChain(model: model, entityTypes: entityTypes)
    }
}

/// Translate text to a target language.
@available(iOS 15.0, macOS 14.0, *)
public struct Translate: PipelineStep {
    public typealias Output = TranslateResult

    private let sourceLanguage: String
    private let targetLanguage: String

    public init(to targetLanguage: String, from sourceLanguage: String = "en") {
        self.targetLanguage = targetLanguage
        self.sourceLanguage = sourceLanguage
    }

    public func buildChain(model: any LocanaraModel) -> any Chain {
        TranslateChain(model: model, sourceLanguage: sourceLanguage, targetLanguage: targetLanguage)
    }
}

/// Rewrite text in a specific style.
@available(iOS 15.0, macOS 14.0, *)
public struct Rewrite: PipelineStep {
    public typealias Output = RewriteResult

    private let style: RewriteOutputType

    public init(style: RewriteOutputType) {
        self.style = style
    }

    public func buildChain(model: any LocanaraModel) -> any Chain {
        RewriteChain(model: model, style: style)
    }
}

/// Proofread text for grammar and spelling.
@available(iOS 15.0, macOS 14.0, *)
public struct Proofread: PipelineStep {
    public typealias Output = ProofreadResult

    public init() {}

    public func buildChain(model: any LocanaraModel) -> any Chain {
        ProofreadChain(model: model)
    }
}
