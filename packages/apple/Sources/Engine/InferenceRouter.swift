import Foundation
import os.log
#if canImport(FoundationModels)
import FoundationModels
#endif

private let logger = Logger(subsystem: "com.locanara", category: "InferenceRouter")

/// Routes inference requests to the appropriate engine
///
/// Decision flow:
/// 1. iOS 26+ with Foundation Models available → Use Foundation Models
/// 2. iOS 15-25 with Locanara → Use selected fallback engine (llama.cpp, MLX, CoreML)
/// 3. Otherwise → Feature not available
///
/// Users can choose their preferred fallback engine through `setPreferredEngine()`.
@available(iOS 15.0, macOS 14.0, *)
public final class InferenceRouter: @unchecked Sendable {

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = InferenceRouter()

    // MARK: - Constants

    /// Delay for native resource cleanup when switching engines (milliseconds).
    ///
    /// This is a workaround for potential resource conflicts when rapidly
    /// switching between llama.cpp and Foundation Models engines. The delay
    /// provides time for native memory to be released before re-initializing.
    ///
    /// Note: This value is scaled from Android's ENGINE_SWITCH_CLEANUP_DELAY_MS (2000ms)
    /// because iOS memory management is generally faster.
    ///
    /// TODO: Investigate more deterministic resource cleanup detection.
    private static let engineSwitchCleanupDelayMs = 100

    // MARK: - Properties

    private let capabilityDetector = DeviceCapabilityDetector.shared
    private var currentEngineType: InferenceEngineType = .none
    private var preferredFallbackEngine: InferenceEngineType = .llamaCpp
    private var isInitialized = false
    private var engineSelectionMode: EngineSelectionMode = .auto

    // MARK: - Engine State

    /// Current active inference engine (unified protocol)
    private var activeEngine: (any InferenceEngine)?

    /// Legacy support for direct llama.cpp access
    private var llamaCppEngine: LlamaCppEngineProtocol? {
        activeEngine as? LlamaCppEngineProtocol
    }

    /// Serial queue for engine switching operations to prevent concurrent access
    private let engineSwitchQueue = DispatchQueue(label: "com.locanara.inferenceRouter.engineSwitch")

    // MARK: - Initialization

    private init() {}

    /// Initialize the inference router
    ///
    /// Detects device capabilities and prepares the appropriate engine.
    /// - Throws: LocanaraError if initialization fails
    public func initialize() async throws {
        guard !isInitialized else {
            logger.debug("InferenceRouter already initialized")
            return
        }

        let capability = capabilityDetector.detectCapabilities()
        logger.info("""
            Device capability detected:
            - Chipset: \(capability.chipset)
            - Memory: \(capability.availableMemoryMB)MB / \(capability.totalMemoryMB)MB
            - Neural Engine: \(capability.hasNeuralEngine)
            - Foundation Models: \(capability.supportsFoundationModels)
            - Recommended Model: \(capability.recommendedModel ?? "none")
            - Available Engines: \(InferenceEngineFactory.availableEngines().map { $0.displayName }.joined(separator: ", "))
            """)

        currentEngineType = capabilityDetector.recommendedEngine()

        switch currentEngineType {
        case .foundationModels:
            logger.info("Using Foundation Models engine")

        case .llamaCpp, .mlx, .coreML:
            logger.info("Using \(self.currentEngineType.displayName) engine")
            // Try to auto-load a downloaded model
            await autoLoadDownloadedModel()

        case .none:
            logger.warning("No inference engine available for this device")
            // Even when .none, try to load a downloaded model if available
            await autoLoadDownloadedModel()
        }

        isInitialized = true
    }

    /// Auto-load a downloaded model if available
    ///
    /// Called during initialization when Foundation Models are not available.
    /// Loads the first downloaded model found.
    private func autoLoadDownloadedModel() async {
        let downloadedModels = ModelManager.shared.getDownloadedModels()

        guard !downloadedModels.isEmpty else {
            logger.debug("No downloaded models to auto-load")
            return
        }

        // Load the first downloaded model
        let modelId = downloadedModels[0]
        logger.info("Auto-loading downloaded model: \(modelId)")

        do {
            try await ModelManager.shared.loadModel(modelId)
            logger.info("Auto-loaded model: \(modelId)")
        } catch {
            logger.error("Failed to auto-load model \(modelId): \(error.localizedDescription)")
        }
    }

    // MARK: - Engine Selection

    /// Get available fallback engines for this device
    ///
    /// - Returns: Array of available engine types (excluding Foundation Models and none)
    public func getAvailableFallbackEngines() -> [InferenceEngineType] {
        return InferenceEngineFactory.availableEngines().filter {
            $0 != .foundationModels && $0 != .none
        }
    }

    /// Set preferred fallback engine
    ///
    /// When Foundation Models are not available, this engine will be used.
    /// - Parameter engine: Preferred engine type
    /// - Throws: LocanaraError if engine is not available on this device
    public func setPreferredEngine(_ engine: InferenceEngineType) throws {
        let available = getAvailableFallbackEngines()

        guard available.contains(engine) else {
            throw LocanaraError.custom(
                .featureNotAvailable,
                "\(engine.displayName) is not available on this device. Available: \(available.map { $0.displayName }.joined(separator: ", "))"
            )
        }

        preferredFallbackEngine = engine
        logger.info("Preferred fallback engine set to: \(engine.displayName)")

        // If we're currently using a fallback engine and it's different, we need to reload
        if currentEngineType != .foundationModels && currentEngineType != engine {
            currentEngineType = engine
            // Unload current engine
            activeEngine?.unload()
            activeEngine = nil
        }
    }

    /// Get current preferred fallback engine
    public func getPreferredEngine() -> InferenceEngineType {
        return preferredFallbackEngine
    }

    /// Get information about all available engines
    public func getEngineInfo() -> [EngineInfo] {
        return InferenceEngineFactory.availableEngines().map { type in
            EngineInfo(
                type: type,
                isAvailable: true,
                isActive: type == currentEngineType,
                isPreferred: type == preferredFallbackEngine
            )
        }
    }

    /// Switch to device's native AI (Apple Intelligence on iOS)
    ///
    /// Unloads any loaded llama.cpp engine to release native resources before switching.
    /// - Throws: LocanaraError if device AI is not available
    public func switchToDeviceAI() async throws {
        guard capabilityDetector.canUseFoundationModels() else {
            throw LocanaraError.custom(
                .featureNotAvailable,
                "Device AI (Apple Intelligence) is not available on this device"
            )
        }

        // Serialize engine switch operations to prevent concurrent access
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            engineSwitchQueue.async { [weak self] in
                guard let self = self else {
                    continuation.resume()
                    return
                }

                // Unload llama.cpp engine if loaded to release native resources
                if self.activeEngine != nil {
                    logger.warning("Unloading llama.cpp engine before switching to Foundation Models...")
                    self.activeEngine?.unload()
                    self.activeEngine = nil

                    // Brief delay to allow native memory cleanup before switching engines.
                    self.engineSwitchQueue.asyncAfter(deadline: .now() + .milliseconds(Self.engineSwitchCleanupDelayMs)) {
                        logger.warning("llama.cpp engine unloaded")
                        self.engineSelectionMode = .deviceAI
                        self.currentEngineType = .foundationModels
                        logger.info("Switched to device AI (Apple Intelligence)")
                        continuation.resume()
                    }
                    return
                }

                self.engineSelectionMode = .deviceAI
                self.currentEngineType = .foundationModels
                logger.info("Switched to device AI (Apple Intelligence)")
                continuation.resume()
            }
        }
    }

    /// Switch to external model (llama.cpp)
    ///
    /// Reloads the engine if it was unloaded during a previous switch to device AI.
    /// - Parameter modelId: Model identifier to use
    /// - Throws: LocanaraError if model is not downloaded or load fails
    public func switchToExternalModel(_ modelId: String) async throws {
        // Serialize engine switch operations to prevent concurrent access
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            engineSwitchQueue.async { [weak self] in
                guard let self = self else {
                    continuation.resume()
                    return
                }

                // Check if model is downloaded
                guard ModelManager.shared.isModelDownloaded(modelId) else {
                    continuation.resume(throwing: LocanaraError.custom(
                        .modelNotLoaded,
                        "Model \(modelId) is not downloaded. Download it first."
                    ))
                    return
                }

                // Reload engine if it was unloaded or if switching to a different model
                if self.activeEngine == nil || ModelManager.shared.getLoadedModel() != modelId {
                    logger.warning("Reloading llama.cpp engine for model: \(modelId)")

                    // Do the async load outside the queue to avoid breaking serialization with Task{}
                    DispatchQueue.global().async {
                        Task {
                            do {
                                try await ModelManager.shared.loadModel(modelId)
                                self.engineSwitchQueue.async {
                                    self.engineSelectionMode = .externalModel(modelId)
                                    self.currentEngineType = .llamaCpp
                                    logger.info("Switched to external model: \(modelId)")
                                    continuation.resume()
                                }
                            } catch {
                                logger.error("Failed to reload model \(modelId): \(error.localizedDescription)")
                                continuation.resume(throwing: error)
                            }
                        }
                    }
                    return
                } else {
                    self.engineSelectionMode = .externalModel(modelId)
                    self.currentEngineType = .llamaCpp
                    logger.info("Switched to external model: \(modelId)")
                    continuation.resume()
                }
            }
        }
    }

    /// Get currently selected engine mode
    public func getSelectedEngineMode() -> EngineSelectionMode {
        return engineSelectionMode
    }

    // MARK: - Feature Execution

    /// Execute a feature using the appropriate engine
    ///
    /// - Parameters:
    ///   - feature: Feature type to execute
    ///   - input: Input text
    ///   - config: Optional inference configuration
    /// - Returns: Generated text result
    /// - Throws: LocanaraError if execution fails
    public func execute(
        feature: FeatureType,
        input: String,
        config: InferenceConfig? = nil
    ) async throws -> String {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        switch currentEngineType {
        case .foundationModels:
            return try await executeWithFoundationModels(
                feature: feature,
                input: input,
                config: config
            )

        case .llamaCpp, .mlx, .coreML:
            return try await executeWithFallbackEngine(
                feature: feature,
                input: input,
                config: config
            )

        case .none:
            // Even if currentEngineType is .none, try fallback engine if model is loaded
            if activeEngine != nil {
                return try await executeWithFallbackEngine(
                    feature: feature,
                    input: input,
                    config: config
                )
            }
            throw LocanaraError.deviceNotSupported
        }
    }

    /// Execute a feature with streaming output
    ///
    /// - Parameters:
    ///   - feature: Feature type to execute
    ///   - input: Input text
    ///   - config: Optional inference configuration
    /// - Returns: AsyncStream of generated tokens
    public func executeStreaming(
        feature: FeatureType,
        input: String,
        config: InferenceConfig? = nil
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    guard self.isInitialized else {
                        continuation.finish(throwing: LocanaraError.sdkNotInitialized)
                        return
                    }

                    switch self.currentEngineType {
                    case .foundationModels:
                        let result = try await self.executeWithFoundationModels(
                            feature: feature,
                            input: input,
                            config: config
                        )
                        continuation.yield(result)
                        continuation.finish()

                    case .llamaCpp, .mlx, .coreML:
                        try await self.streamWithFallbackEngine(
                            feature: feature,
                            input: input,
                            config: config,
                            continuation: continuation
                        )

                    case .none:
                        // Even if currentEngineType is .none, try fallback engine if model is loaded
                        if self.activeEngine != nil {
                            try await self.streamWithFallbackEngine(
                                feature: feature,
                                input: input,
                                config: config,
                                continuation: continuation
                            )
                        } else {
                            continuation.finish(throwing: LocanaraError.deviceNotSupported)
                        }
                    }
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Engine Management

    /// Get current inference engine type
    public func getCurrentEngine() -> InferenceEngineType {
        return currentEngineType
    }

    /// Check if a model is loaded and ready
    public func isModelReady() -> Bool {
        switch currentEngineType {
        case .foundationModels:
            // Foundation Models are always ready when available
            return true

        case .llamaCpp, .mlx, .coreML:
            return activeEngine?.isLoaded ?? false

        case .none:
            return false
        }
    }

    /// Preload model into memory for faster inference
    ///
    /// - Parameter modelId: Model identifier to preload
    /// - Throws: LocanaraError if preload fails
    public func preloadModel(_ modelId: String) async throws {
        guard currentEngineType != .foundationModels && currentEngineType != .none else {
            logger.debug("preloadModel only applies to fallback engines")
            return
        }

        // TODO: Implement model preloading
        logger.info("Preloading model: \(modelId) for engine: \(self.currentEngineType.displayName)")
    }

    /// Unload model from memory
    ///
    /// - Parameter modelId: Model identifier to unload
    public func unloadModel(_ modelId: String) {
        guard currentEngineType != .foundationModels && currentEngineType != .none else {
            logger.debug("unloadModel only applies to fallback engines")
            return
        }

        logger.info("Unloading model: \(modelId)")
        activeEngine?.unload()
        activeEngine = nil
    }

    /// Cancel ongoing inference
    ///
    /// - Returns: true if cancellation was successful
    @discardableResult
    public func cancelInference() -> Bool {
        guard currentEngineType != .foundationModels && currentEngineType != .none else {
            return false
        }

        return activeEngine?.cancel() ?? false
    }

    /// Check if the current engine supports multimodal (image) input
    public func isMultimodalAvailable() -> Bool {
        guard let engine = activeEngine as? LlamaCppEngineProtocol else {
            return false
        }
        return engine.isMultimodal
    }

    /// Execute image description with the current engine
    ///
    /// - Parameters:
    ///   - prompt: Text prompt describing what to do with the image
    ///   - imageData: Raw image data (JPEG or PNG)
    ///   - config: Optional inference configuration
    /// - Returns: Generated text description
    /// - Throws: LocanaraError if execution fails or multimodal not supported
    public func executeWithImage(
        prompt: String,
        imageData: Data,
        config: InferenceConfig? = nil
    ) async throws -> String {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard let engine = activeEngine as? LlamaCppEngineProtocol else {
            throw LocanaraError.custom(.modelNotLoaded, "Model not loaded")
        }

        guard engine.isMultimodal else {
            throw LocanaraError.custom(.featureNotSupported, "Model does not support image input. mmproj file is required.")
        }

        let effectiveConfig = config ?? .chat
        return try await engine.generateWithImage(prompt: prompt, imageData: imageData, config: effectiveConfig)
    }

    // MARK: - Private Methods - Foundation Models

    @available(iOS 15.0, macOS 14.0, *)
    private func executeWithFoundationModels(
        feature: FeatureType,
        input: String,
        config: InferenceConfig?
    ) async throws -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Feature executors already build complete prompts, use input directly
            let session = LanguageModelSession()
            let response = try await session.respond(to: input)
            return response.content
        }
        #endif

        throw LocanaraError.featureNotAvailable(feature)
    }

    // MARK: - Private Methods - Fallback Engines

    private func executeWithFallbackEngine(
        feature: FeatureType,
        input: String,
        config: InferenceConfig?
    ) async throws -> String {
        guard let engine = activeEngine else {
            throw LocanaraError.custom(
                .modelNotLoaded,
                "Model not loaded. Call downloadFoundationModel() first. Engine: \(currentEngineType.displayName)"
            )
        }

        let effectiveConfig = config ?? getDefaultConfig(for: feature)
        return try await engine.generate(prompt: input, config: effectiveConfig)
    }

    private func streamWithFallbackEngine(
        feature: FeatureType,
        input: String,
        config: InferenceConfig?,
        continuation: AsyncThrowingStream<String, Error>.Continuation
    ) async throws {
        guard let engine = activeEngine else {
            throw LocanaraError.custom(
                .modelNotLoaded,
                "Model not loaded. Call downloadFoundationModel() first. Engine: \(currentEngineType.displayName)"
            )
        }

        let effectiveConfig = config ?? getDefaultConfig(for: feature)

        for try await token in engine.generateStreaming(prompt: input, config: effectiveConfig) {
            continuation.yield(token)
        }

        continuation.finish()
    }

    // MARK: - Prompt Building

    /// Build a basic prompt for a feature
    ///
    /// Note: This function is NOT used when called from feature executors,
    /// as they already build complete prompts. This is kept for potential
    /// future direct InferenceRouter usage.
    @available(*, deprecated, message: "Feature executors build their own prompts. Use input directly.")
    private func buildPrompt(feature: FeatureType, input: String) -> String {
        switch feature {
        case .summarize:
            return """
                Summarize the following text concisely:

                \(input)

                Summary:
                """

        case .classify:
            return """
                Classify the following text into the most appropriate category:

                \(input)

                Classification:
                """

        case .extract:
            return """
                Extract key entities (names, dates, locations, organizations) from the following text:

                \(input)

                Entities:
                """

        case .chat:
            return input

        case .translate:
            return """
                Translate the following text:

                \(input)

                Translation:
                """

        case .rewrite:
            return """
                Rewrite the following text:

                \(input)

                Rewritten:
                """

        case .proofread:
            return """
                Proofread and correct the following text:

                \(input)

                Corrected:
                """

        case .describeImage:
            return """
                Describe the image:

                \(input)

                Description:
                """

        case .describeImageAndroid:
            // Android-only feature - should not be called on iOS
            return input

        case .generateImage:
            // Image generation prompts are handled by the image generator
            return input

        case .generateImageIos:
            // iOS Image Playground - prompts handled by Image Playground API
            return input
        }
    }

    private func getDefaultConfig(for feature: FeatureType) -> InferenceConfig {
        switch feature {
        case .summarize:
            return .summarize
        case .classify:
            return .classify
        case .chat:
            return .chat
        default:
            return .chat
        }
    }

    // MARK: - Engine Registration

    /// Register an inference engine instance
    ///
    /// Called by ModelManager after model is loaded, or by external bridge providers.
    /// - Parameter engine: InferenceEngine instance
    public func registerEngine(_ engine: any InferenceEngine) {
        self.activeEngine = engine
        self.currentEngineType = type(of: engine).engineType
        logger.info("\(type(of: engine).engineType.displayName) engine registered")
    }

    /// Register llama.cpp engine instance (legacy support)
    ///
    /// Called by ModelManager after model is loaded.
    /// - Parameter engine: LlamaCppEngine instance
    public func registerEngine(_ engine: LlamaCppEngineProtocol) {
        if let inferenceEngine = engine as? any InferenceEngine {
            registerEngine(inferenceEngine)
        } else {
            // Fallback for protocol-only conformance
            self.activeEngine = engine as? any InferenceEngine
            self.currentEngineType = .llamaCpp
            logger.info("llama.cpp engine registered (legacy)")
        }
    }

    /// Unregister the current inference engine
    ///
    /// Called by ModelManager when model is unloaded or deleted, or by external bridge providers.
    public func unregisterEngine() {
        self.activeEngine = nil
        // Keep currentEngineType as the recommended type, but model is not loaded
        logger.info("Engine unregistered")
    }
}

// MARK: - Engine Info

/// Information about an inference engine
public struct EngineInfo: Sendable {
    /// Engine type
    public let type: InferenceEngineType

    /// Whether the engine is available on this device
    public let isAvailable: Bool

    /// Whether this engine is currently active
    public let isActive: Bool

    /// Whether this is the preferred fallback engine
    public let isPreferred: Bool

    /// Human-readable display name
    public var displayName: String { type.displayName }

    /// Engine description
    public var description: String { type.engineDescription }

    /// Whether model download is required
    public var requiresModelDownload: Bool { type.requiresModelDownload }
}

// MARK: - Engine Selection Mode

/// Mode for engine selection
public enum EngineSelectionMode: Equatable, Sendable {
    /// Auto-select best available engine (device AI if available, then llama.cpp)
    case auto
    /// Force use of device's native AI (Apple Intelligence on iOS, Gemini Nano on Android)
    case deviceAI
    /// Force use of external model (llama.cpp)
    case externalModel(String)
}

// MARK: - LlamaCppEngine Protocol

/// Protocol for llama.cpp engine implementation
///
/// This protocol allows for easier testing and future engine swapping.
public protocol LlamaCppEngineProtocol: Sendable {
    /// Whether a model is currently loaded
    var isLoaded: Bool { get }

    /// Whether this engine supports multimodal (image) input
    var isMultimodal: Bool { get }

    /// Generate text from prompt
    func generate(prompt: String, config: InferenceConfig) async throws -> String

    /// Generate text with streaming
    func generateStreaming(prompt: String, config: InferenceConfig) -> AsyncThrowingStream<String, Error>

    /// Generate text with image input (for multimodal models)
    func generateWithImage(prompt: String, imageData: Data, config: InferenceConfig) async throws -> String

    /// Cancel ongoing generation
    func cancel() -> Bool
}
