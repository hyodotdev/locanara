import Foundation

// MARK: - Inference Provider Protocol

/// Protocol for inference providers that can execute AI features
///
/// This protocol allows the Community tier to delegate inference execution
/// to Pro tier implementations without compile-time dependencies.
///
/// **Usage:**
/// - Community tier: Defines this protocol and checks for registered provider
/// - Pro tier: Implements this protocol and registers with LocanaraClient
///
/// **Example:**
/// ```swift
/// // Pro tier registers provider during initialization
/// LocanaraClient.shared.inferenceProvider = ProInferenceProvider()
///
/// // Community tier uses provider if available
/// if let provider = LocanaraClient.shared.inferenceProvider {
///     return try await provider.summarize(input: text, params: params)
/// }
/// ```
@available(iOS 15.0, macOS 14.0, tvOS 15.0, watchOS 8.0, *)
public protocol InferenceProvider: Sendable {

    // MARK: - Availability

    /// Check if the provider is ready for inference
    ///
    /// - Returns: true if a model is loaded and ready
    func isReady() -> Bool

    // MARK: - Feature Execution

    /// Execute summarize feature
    ///
    /// - Parameters:
    ///   - input: Text to summarize
    ///   - params: Optional summarize parameters
    /// - Returns: SummarizeResult with summarized text
    /// - Throws: LocanaraError if execution fails
    func summarize(input: String, params: SummarizeParametersInput?) async throws -> SummarizeResult

    /// Execute classify feature
    ///
    /// - Parameters:
    ///   - input: Text to classify
    ///   - params: Optional classify parameters
    /// - Returns: ClassifyResult with classifications
    /// - Throws: LocanaraError if execution fails
    func classify(input: String, params: ClassifyParametersInput?) async throws -> ClassifyResult

    /// Execute extract feature
    ///
    /// - Parameters:
    ///   - input: Text to extract entities from
    ///   - params: Optional extract parameters
    /// - Returns: ExtractResult with extracted entities
    /// - Throws: LocanaraError if execution fails
    func extract(input: String, params: ExtractParametersInput?) async throws -> ExtractResult

    /// Execute chat feature
    ///
    /// - Parameters:
    ///   - input: User message
    ///   - params: Optional chat parameters
    /// - Returns: ChatResult with AI response
    /// - Throws: LocanaraError if execution fails
    func chat(input: String, params: ChatParametersInput?) async throws -> ChatResult

    /// Execute translate feature
    ///
    /// - Parameters:
    ///   - input: Text to translate
    ///   - params: Translate parameters (target language required)
    /// - Returns: TranslateResult with translated text
    /// - Throws: LocanaraError if execution fails
    func translate(input: String, params: TranslateParametersInput?) async throws -> TranslateResult

    /// Execute rewrite feature
    ///
    /// - Parameters:
    ///   - input: Text to rewrite
    ///   - params: Rewrite parameters (output type required)
    /// - Returns: RewriteResult with rewritten text
    /// - Throws: LocanaraError if execution fails
    func rewrite(input: String, params: RewriteParametersInput?) async throws -> RewriteResult

    /// Execute proofread feature
    ///
    /// - Parameters:
    ///   - input: Text to proofread
    ///   - params: Optional proofread parameters
    /// - Returns: ProofreadResult with corrections
    /// - Throws: LocanaraError if execution fails
    func proofread(input: String, params: ProofreadParametersInput?) async throws -> ProofreadResult

    /// Execute describe image feature
    ///
    /// - Parameters:
    ///   - input: Image description context or path
    ///   - params: Optional image description parameters
    /// - Returns: ImageDescriptionResult with description
    /// - Throws: LocanaraError if execution fails
    func describeImage(input: String, params: ImageDescriptionParametersInput?) async throws -> ImageDescriptionResult

    /// Execute generate image feature
    ///
    /// - Parameters:
    ///   - input: Generation context or hint
    ///   - params: Image generation parameters (prompt required)
    /// - Returns: ImageGenerationResult with generated image URLs
    /// - Throws: LocanaraError if execution fails
    func generateImage(input: String, params: ImageGenerationParametersInput?) async throws -> ImageGenerationResult
}
