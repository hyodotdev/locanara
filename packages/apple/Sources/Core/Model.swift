import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - Generation Configuration

/// Configuration for model generation behavior
public struct GenerationConfig: Sendable {
    /// Temperature controls randomness (0.0 = deterministic, 1.0 = creative)
    public var temperature: Float?
    /// Top-K sampling parameter
    public var topK: Int?
    /// Maximum number of tokens to generate
    public var maxTokens: Int?

    public init(temperature: Float? = nil, topK: Int? = nil, maxTokens: Int? = nil) {
        self.temperature = temperature
        self.topK = topK
        self.maxTokens = maxTokens
    }

    /// Preset for deterministic structured output
    public static let structured = GenerationConfig(temperature: 0.2, topK: 16)
    /// Preset for creative text generation
    public static let creative = GenerationConfig(temperature: 0.8, topK: 40)
    /// Preset for conversational responses
    public static let conversational = GenerationConfig(temperature: 0.7, topK: 40)
}

// MARK: - Model Response

/// Represents the response from a model invocation
public struct ModelResponse: Sendable {
    /// The raw text content of the response
    public let text: String
    /// Processing time in milliseconds
    public let processingTimeMs: Int?
    /// Token usage metadata (if available)
    public let tokenUsage: TokenUsage?

    public init(text: String, processingTimeMs: Int? = nil, tokenUsage: TokenUsage? = nil) {
        self.text = text
        self.processingTimeMs = processingTimeMs
        self.tokenUsage = tokenUsage
    }
}

/// Token usage metadata
public struct TokenUsage: Sendable {
    public let promptTokens: Int?
    public let completionTokens: Int?
    public let totalTokens: Int?

    public init(promptTokens: Int? = nil, completionTokens: Int? = nil, totalTokens: Int? = nil) {
        self.promptTokens = promptTokens
        self.completionTokens = completionTokens
        self.totalTokens = totalTokens
    }
}

// MARK: - Model Protocol

/// Core protocol abstracting over on-device AI models.
///
/// Implementations wrap platform-specific models (Foundation Models on iOS,
/// Gemini Nano / ML Kit on Android) behind a unified interface.
///
/// ```swift
/// let model = FoundationLanguageModel()
/// let response = try await model.generate(prompt: "Hello", config: .conversational)
/// print(response.text)
/// ```
@available(iOS 15.0, macOS 14.0, *)
public protocol LocanaraModel: Sendable {
    /// Human-readable name of this model backend
    var name: String { get }

    /// Whether this model is ready for inference
    var isReady: Bool { get }

    /// Maximum context window size in tokens
    var maxContextTokens: Int { get }

    /// Generate a text response from a prompt string
    func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse

    /// Stream a response as an async sequence of text chunks
    func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error>

    #if canImport(FoundationModels)
    /// Generate structured output using @Generable types (Apple Intelligence only).
    /// Returns nil if structured generation is not supported.
    @available(iOS 26.0, macOS 26.0, *)
    func generateStructured<T: Generable>(prompt: String, type: T.Type) async throws -> T?
    #endif
}

// MARK: - Default Implementations

@available(iOS 15.0, macOS 14.0, *)
extension LocanaraModel {
    /// Generate with default config
    public func generate(prompt: String) async throws -> ModelResponse {
        try await generate(prompt: prompt, config: nil)
    }

    /// Stream with default config
    public func stream(prompt: String) -> AsyncThrowingStream<String, Error> {
        stream(prompt: prompt, config: nil)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    public func generateStructured<T: Generable>(prompt: String, type: T.Type) async throws -> T? {
        nil
    }
    #endif
}

// MARK: - Defaults

/// Global defaults for Locanara framework.
///
/// On Apple platforms, the default model is `FoundationLanguageModel()`.
/// Set this once at app startup if you want to use a custom model:
/// ```swift
/// LocanaraDefaults.model = MyCustomModel()
/// ```
@available(iOS 15.0, macOS 14.0, *)
public enum LocanaraDefaults {
    /// The default model used by all built-in chains when no model is specified.
    public nonisolated(unsafe) static var model: any LocanaraModel = FoundationLanguageModel()
}
