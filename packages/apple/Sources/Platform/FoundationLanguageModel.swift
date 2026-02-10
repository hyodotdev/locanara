import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Apple Foundation Models implementation of the LocanaraModel protocol.
///
/// Wraps `LanguageModelSession` for on-device text generation using Apple Intelligence.
/// Requires iOS 26+ / macOS 26+ with Apple Intelligence support.
///
/// ```swift
/// let model = FoundationLanguageModel()
/// let response = try await model.generate(prompt: "Hello", config: .conversational)
/// ```
@available(iOS 15.0, macOS 14.0, *)
public struct FoundationLanguageModel: LocanaraModel {

    public let name = "Apple Foundation Models"
    public let maxContextTokens = 4096

    public init() {}

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

    public func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            guard case .available = SystemLanguageModel.default.availability else {
                throw LocanaraError.featureNotAvailable(.chat)
            }

            let startTime = Date()
            let session = LanguageModelSession()
            let response = try await session.respond(to: prompt)
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
        let session = LanguageModelSession()
        return try await session.respond(to: prompt, generating: type).content
    }
    #endif

    public func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error> {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            return AsyncThrowingStream { continuation in
                Task { @Sendable in
                    do {
                        let session = LanguageModelSession()
                        let stream = session.streamResponse(to: prompt)
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
}
