import Foundation

// MARK: - Chain I/O Types

/// Input to a chain step. Contains the primary value plus metadata.
///
/// ```swift
/// let input = ChainInput(text: "Hello world")
/// let output = try await chain.invoke(input)
/// ```
public struct ChainInput: Sendable {
    /// Primary text input
    public let text: String
    /// Arbitrary key-value metadata carried through the chain
    public var metadata: [String: String]

    public init(text: String, metadata: [String: String] = [:]) {
        self.text = text
        self.metadata = metadata
    }
}

/// Output from a chain step.
///
/// Internally carries a type-erased value for chain composition.
/// Use `typed(_:)` for safe downcasting, or prefer the typed `run()` methods
/// on built-in chains which return concrete types directly.
public struct ChainOutput: Sendable {
    /// The result value (type-erased for composition)
    public let value: any Sendable
    /// The raw text representation
    public let text: String
    /// Metadata carried forward
    public var metadata: [String: String]
    /// Processing time for this step
    public let processingTimeMs: Int?

    public init(
        value: any Sendable,
        text: String,
        metadata: [String: String] = [:],
        processingTimeMs: Int? = nil
    ) {
        self.value = value
        self.text = text
        self.metadata = metadata
        self.processingTimeMs = processingTimeMs
    }

    /// Type-safe value accessor. Returns nil if the value is not the expected type.
    public func typed<T: Sendable>(_ type: T.Type) -> T? {
        value as? T
    }
}
