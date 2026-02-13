import Foundation

/// Unified inference engine protocol
///
/// All inference engines conform to this protocol for interchangeable use
/// in the InferenceRouter.
///
/// **Currently implemented:**
/// - LlamaCppEngine: Full implementation using llama.cpp (works on all platforms)
///
/// **Planned (not yet implemented):**
/// - MLXEngine: For Apple Silicon Macs (macOS only)
/// - CoreMLEngine: For Neural Engine acceleration
@available(iOS 15.0, macOS 14.0, *)
public protocol InferenceEngine: Sendable {
    /// Engine type identifier
    static var engineType: InferenceEngineType { get }

    /// Whether a model is currently loaded
    var isLoaded: Bool { get }

    /// Human-readable engine name
    var engineName: String { get }

    /// Generate text from prompt
    ///
    /// - Parameters:
    ///   - prompt: Input prompt
    ///   - config: Inference configuration
    /// - Returns: Generated text
    /// - Throws: LocanaraError if generation fails
    func generate(prompt: String, config: InferenceConfig) async throws -> String

    /// Generate text with streaming
    ///
    /// - Parameters:
    ///   - prompt: Input prompt
    ///   - config: Inference configuration
    /// - Returns: AsyncThrowingStream of generated tokens
    func generateStreaming(prompt: String, config: InferenceConfig) -> AsyncThrowingStream<String, Error>

    /// Cancel ongoing generation
    ///
    /// - Returns: true if cancellation was successful
    func cancel() -> Bool

    /// Unload model from memory
    func unload()
}

// MARK: - Engine Factory

/// Factory for creating inference engines
@available(iOS 15.0, macOS 14.0, *)
public enum InferenceEngineFactory {

    /// Create an engine of the specified type
    ///
    /// - Parameters:
    ///   - type: Engine type to create
    ///   - modelPath: Path to model file
    ///   - config: Engine-specific configuration
    /// - Returns: Configured inference engine
    /// - Throws: LocanaraError if creation fails
    public static func create(
        type: InferenceEngineType,
        modelPath: URL,
        config: InferenceEngineConfiguration = .default
    ) async throws -> any InferenceEngine {
        switch type {
        case .llamaCpp:
            guard #available(iOS 17.0, macOS 14.0, *) else {
                throw LocanaraError.custom(.featureNotAvailable, "LlamaCppEngine requires iOS 17.0+ or macOS 14.0+")
            }
            let llamaConfig = LlamaCppEngine.Configuration(
                numThreads: config.numThreads,
                contextSize: config.contextSize,
                batchSize: config.batchSize,
                useMetal: config.useGPU,
                gpuLayers: config.gpuLayers
            )
            return try await LlamaCppEngine.create(modelPath: modelPath, config: llamaConfig)

        case .mlx:
            #if os(macOS)
            return try await MLXEngine.create(modelPath: modelPath, config: config)
            #else
            throw LocanaraError.custom(.featureNotAvailable, "MLX is only available on macOS")
            #endif

        case .coreML:
            return try await CoreMLEngine.create(modelPath: modelPath, config: config)

        case .foundationModels, .none:
            throw LocanaraError.custom(.featureNotAvailable, "Cannot create engine for type: \(type)")
        }
    }

    /// Get available engine types for current device
    ///
    /// - Returns: Array of available engine types, ordered by recommendation
    ///
    /// - Note: Currently only llama.cpp is fully implemented.
    ///   MLX and CoreML are planned for future releases.
    public static func availableEngines() -> [InferenceEngineType] {
        var engines: [InferenceEngineType] = []

        // Check Foundation Models (iOS 26+)
        if #available(iOS 26.0, macOS 26.0, *) {
            engines.append(.foundationModels)
        }

        // llama.cpp is available on all platforms and is fully implemented
        engines.append(.llamaCpp)

        // Note: MLX and CoreML engines are not yet implemented
        // They will be added here when ready:
        // - MLX: macOS with Apple Silicon only
        // - CoreML: All Apple platforms with Neural Engine

        return engines
    }
}

// MARK: - Engine Configuration

/// Unified engine configuration
public struct InferenceEngineConfiguration: Sendable {
    /// Number of threads for inference
    public var numThreads: Int

    /// Context size (tokens)
    public var contextSize: Int

    /// Batch size for processing
    public var batchSize: Int

    /// Use GPU acceleration (Metal on Apple)
    public var useGPU: Bool

    /// GPU layers to offload (0 = CPU only)
    public var gpuLayers: Int

    /// Default configuration
    public static let `default` = InferenceEngineConfiguration(
        numThreads: ProcessInfo.processInfo.activeProcessorCount,
        contextSize: 2048,
        batchSize: 512,
        useGPU: true,
        gpuLayers: 32
    )

    public init(
        numThreads: Int = ProcessInfo.processInfo.activeProcessorCount,
        contextSize: Int = 2048,
        batchSize: Int = 512,
        useGPU: Bool = true,
        gpuLayers: Int = 32
    ) {
        self.numThreads = numThreads
        self.contextSize = contextSize
        self.batchSize = batchSize
        self.useGPU = useGPU
        self.gpuLayers = gpuLayers
    }
}

// MARK: - ProcessInfo Extension

extension ProcessInfo {
    /// Get machine hardware name (e.g., "arm64" on Apple Silicon)
    var machineHardwareName: String? {
        var sysinfo = utsname()
        uname(&sysinfo)
        return withUnsafePointer(to: &sysinfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                String(validatingCString: $0)
            }
        }
    }
}
