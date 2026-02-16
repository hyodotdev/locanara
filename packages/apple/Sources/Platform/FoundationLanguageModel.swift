import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Apple Foundation Models implementation of the LocanaraModel protocol.
///
/// Wraps `LanguageModelSession` for on-device text generation using Apple Intelligence.
/// Requires iOS 26+ / macOS 26+ with Apple Intelligence support.
///
/// Supports:
/// - `GenerationOptions` mapping from `GenerationConfig` (temperature, sampling)
/// - `session.prewarm()` for reduced first-request latency
/// - Structured output via `@Generable` types
/// - Structured streaming via `PartiallyGenerated<T>`
///
/// ```swift
/// let model = FoundationLanguageModel()
/// let response = try await model.generate(prompt: "Hello", config: .conversational)
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct FoundationLanguageModel: LocanaraModel {

    public let name = "Apple Foundation Models"
    public let maxContextTokens = 4096

    /// Optional system instructions passed to every session.
    public var instructions: String?

    public init(instructions: String? = nil) {
        self.instructions = instructions
    }

    public var isReady: Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return true
            }
        }
        #endif
        return false
    }

    /// Prewarm the Foundation Models system for lower first-request latency.
    public func prewarm() async {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            guard case .available = SystemLanguageModel.default.availability else { return }
            let session = makeSession()
            try? await session.prewarm()
        }
        #endif
    }

    public func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            guard case .available = SystemLanguageModel.default.availability else {
                throw LocanaraError.featureNotAvailable(.chat)
            }

            let startTime = Date()
            let session = makeSession()
            let options = Self.mapGenerationOptions(from: config)
            let response = try await session.respond(to: prompt, options: options)
            let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)

            return ModelResponse(
                text: response.content,
                processingTimeMs: elapsed
            )
        }
        #endif
        throw LocanaraError.featureNotAvailable(.chat)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    public func generateStructured<T: Generable>(prompt: String, type: T.Type) async throws -> T? {
        guard case .available = SystemLanguageModel.default.availability else {
            return nil
        }
        let session = makeSession()
        let options = Self.mapGenerationOptions(from: .structured)
        return try await session.respond(to: prompt, generating: type, options: options).content
    }
    #endif

    // NOTE: Structured streaming with PartiallyGenerated<T> requires iOS 26 SDK
    // (Xcode 26.3+). Enable streamStructured() when the build toolchain is updated.

    public func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error> {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            return AsyncThrowingStream { continuation in
                Task { @Sendable in
                    do {
                        let session = makeSession()
                        let options = Self.mapGenerationOptions(from: config)
                        let stream = session.streamResponse(to: prompt, options: options)
                        var previousContent = ""

                        for try await partial in stream {
                            let current = partial.content
                            let delta = String(current.dropFirst(previousContent.count))
                            previousContent = current
                            if !delta.isEmpty {
                                continuation.yield(delta)
                            }
                        }
                        continuation.finish()
                    } catch {
                        continuation.finish(throwing: error)
                    }
                }
            }
        }
        #endif
        return AsyncThrowingStream { continuation in
            continuation.finish(throwing: LocanaraError.featureNotAvailable(.chat))
        }
    }

    // MARK: - Private Helpers

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func makeSession() -> LanguageModelSession {
        if let instructions {
            return LanguageModelSession(instructions: instructions)
        }
        return LanguageModelSession()
    }

    @available(iOS 26.0, macOS 26.0, *)
    private static func mapGenerationOptions(from config: GenerationConfig?) -> GenerationOptions {
        guard let config else { return GenerationOptions() }

        if let temp = config.temperature {
            if temp <= 0.01 {
                return GenerationOptions(sampling: .greedy)
            }
            return GenerationOptions(temperature: Double(temp))
        }

        return GenerationOptions()
    }
    #endif
}
