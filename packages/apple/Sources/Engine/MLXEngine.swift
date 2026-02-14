import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "MLXEngine")

/// MLX-based inference engine (macOS only)
///
/// Provides on-device LLM inference using Apple's MLX framework.
/// MLX is optimized for Apple Silicon and provides excellent performance
/// on macOS devices with M1/M2/M3/M4 chips.
///
/// **Status: Not yet implemented**
/// This engine is a placeholder for future MLX integration.
/// Currently, use LlamaCppEngine which works on all platforms.
///
/// References:
/// - https://github.com/ml-explore/mlx
/// - https://github.com/ml-explore/mlx-swift
@available(iOS 15.0, macOS 14.0, *)
public final class MLXEngine: @unchecked Sendable, InferenceEngine {

    // MARK: - InferenceEngine Protocol

    public static var engineType: InferenceEngineType { .mlx }

    public var engineName: String { "MLX" }

    // MARK: - Properties

    public private(set) var isLoaded: Bool = false

    private let modelPath: URL
    private let config: InferenceEngineConfiguration

    // MARK: - Initialization

    private init(modelPath: URL, config: InferenceEngineConfiguration) {
        self.modelPath = modelPath
        self.config = config
    }

    /// Create and initialize engine with model
    ///
    /// - Note: MLX engine is not yet implemented. Use LlamaCppEngine instead.
    public static func create(
        modelPath: URL,
        config: InferenceEngineConfiguration = .default
    ) async throws -> MLXEngine {
        throw LocanaraError.custom(
            .featureNotAvailable,
            "MLX engine is not yet implemented. Use LlamaCppEngine instead."
        )
    }

    // MARK: - InferenceEngine Protocol

    public func unload() {
        isLoaded = false
    }

    public func generate(prompt: String, config: InferenceConfig) async throws -> String {
        throw LocanaraError.custom(
            .featureNotAvailable,
            "MLX engine is not yet implemented. Use LlamaCppEngine instead."
        )
    }

    public func generateStreaming(
        prompt: String,
        config: InferenceConfig
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            continuation.finish(throwing: LocanaraError.custom(
                .featureNotAvailable,
                "MLX engine is not yet implemented. Use LlamaCppEngine instead."
            ))
        }
    }

    public func cancel() -> Bool {
        return false
    }
}

// MARK: - MLX Availability Check

@available(iOS 15.0, macOS 14.0, *)
extension MLXEngine {

    /// Check if MLX is available on current device
    ///
    /// - Note: Returns false until MLX integration is implemented
    public static var isAvailable: Bool {
        // MLX requires Apple Silicon Mac and is not yet implemented
        return false
    }

    /// Get MLX engine capabilities
    public static var capabilities: String {
        return "MLX engine is not yet implemented. Use LlamaCppEngine for on-device inference."
    }
}
