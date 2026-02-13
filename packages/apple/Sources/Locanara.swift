import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "SDK")

// MARK: - Locanara Namespace

/// Locanara SDK namespace for static properties
/// Note: Named LocanaraSDK to avoid conflict with module name 'Locanara'
/// Package source type
public enum PackageSource: String, Sendable {
    /// Compiled from local source code
    case localSource = "local_source"
    /// Loaded from released xcframework binary
    case releasedPackage = "released_package"

    /// Human-readable display name
    public var displayName: String {
        switch self {
        case .localSource: return "Local Source"
        case .releasedPackage: return "Released Package"
        }
    }
}

public enum LocanaraSDK {
    /// SDK version (keep in sync with locanara-versions.json)
    public static let version = "1.0.1"

    /// Detect if SDK is from local source or released package
    /// When loaded from xcframework, the bundle will be a framework bundle
    /// When compiled from source, the code is in the main app bundle
    public static var packageSource: PackageSource {
        // Get the bundle containing this code
        let sdkBundle = Bundle(for: BundleToken.self)

        // If it's a framework bundle (not the main bundle), it's from released package
        if sdkBundle.bundlePath.contains(".framework") ||
           sdkBundle.bundlePath.contains("Frameworks") {
            return .releasedPackage
        }

        return .localSource
    }
}

// Helper class to get the bundle containing SDK code
private final class BundleToken {}

/// Type of inference engine
public enum InferenceEngineType: String, Sendable, CaseIterable {
    /// Apple Foundation Models (iOS 26+)
    case foundationModels = "foundation_models"
    /// llama.cpp - GGUF models with Metal GPU acceleration
    case llamaCpp = "llama_cpp"
    /// MLX - Apple Silicon optimized (macOS)
    case mlx = "mlx"
    /// CoreML - NPU-accelerated inference
    case coreML = "core_ml"
    /// No engine available
    case none = "none"

    /// Human-readable display name
    public var displayName: String {
        switch self {
        case .foundationModels: return "Apple Intelligence"
        case .llamaCpp: return "llama.cpp"
        case .mlx: return "MLX"
        case .coreML: return "CoreML"
        case .none: return "None"
        }
    }

    /// Description of the engine
    public var engineDescription: String {
        switch self {
        case .foundationModels: return "Native Apple Intelligence (iOS 26+)"
        case .llamaCpp: return "llama.cpp with Metal GPU acceleration"
        case .mlx: return "MLX - Apple Silicon optimized (macOS)"
        case .coreML: return "CoreML - NPU-accelerated inference"
        case .none: return "No inference engine available"
        }
    }

    /// Whether this engine requires model download
    public var requiresModelDownload: Bool {
        switch self {
        case .llamaCpp, .mlx, .coreML: return true
        case .foundationModels, .none: return false
        }
    }
}

/// Locanara SDK for iOS
///
/// Provides a unified interface for on-device AI capabilities
/// built on top of Apple Intelligence, Foundation Models,
/// and fallback engines (llama.cpp) for older devices.
@available(iOS 15.0, macOS 14.0, tvOS 15.0, watchOS 8.0, *)
public final class LocanaraClient {

    // MARK: - Properties

    /// Shared singleton instance
    public nonisolated(unsafe) static let shared = LocanaraClient()

    /// Current SDK version (references LocanaraSDK.version)
    public static let version = LocanaraSDK.version

    private var isInitialized = false
    private var deviceCapability: DeviceCapability?
    private var contexts: [String: ExecutionContext] = [:]
    private var executionHistory: [String: [ExecutionResult]] = [:]
    private var availableFoundationModels: [FoundationModelInfoIOS] = []

    // Feature executors
    private lazy var summarizeExecutor = SummarizeExecutor()
    private lazy var classifyExecutor = ClassifyExecutor()
    private lazy var extractExecutor = ExtractExecutor()
    private lazy var chatExecutor = ChatExecutor()
    private lazy var translateExecutor = TranslateExecutor()
    private lazy var rewriteExecutor = RewriteExecutor()
    private lazy var proofreadExecutor = ProofreadExecutor()
    private lazy var describeImageExecutor = DescribeImageExecutor()
    private lazy var generateImageExecutor = GenerateImageExecutor()

    // MARK: - Initialization

    private init() {}

    /// Initialize the Locanara SDK
    ///
    /// - Throws: LocanaraError if initialization fails
    public func initialize() async throws {
        guard !isInitialized else {
            logger.info("Already initialized")
            return
        }

        // Check device capabilities
        self.deviceCapability = try await checkDeviceCapabilities()

        // Load available Foundation Models
        self.availableFoundationModels = await loadAvailableFoundationModels()

        // Initialize inference router (needed for RouterModel used by built-in chains)
        try await InferenceRouter.shared.initialize()

        isInitialized = true
        let source = LocanaraSDK.packageSource
        logger.info("Initialized successfully (v\(LocanaraSDK.version), \(source.displayName))")
    }

    // MARK: - Device Capabilities

    /// Get current device capabilities
    ///
    /// - Returns: DeviceCapability information
    /// - Throws: LocanaraError if not initialized
    public func getDeviceCapability() throws -> DeviceCapability {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard let capability = deviceCapability else {
            throw LocanaraError.capabilityCheckFailed
        }

        return capability
    }

    /// Check if a specific feature is available
    ///
    /// - Parameter feature: Feature type to check
    /// - Returns: true if feature is available
    public func isFeatureAvailable(_ feature: FeatureType) -> Bool {
        // Check device capability
        guard let capability = deviceCapability else {
            logger.debug("No device capability available")
            return false
        }

        let available = capability.availableFeatures.contains(feature)
        logger.debug("Feature check for \(String(describing: feature)): \(available)")
        return available
    }

    /// Custom inference provider
    ///
    /// When set, feature executors will use this provider for inference
    /// instead of Foundation Models.
    public var inferenceProvider: InferenceProvider?

    // MARK: - iOS-specific API (Query)

    /// Get iOS device information
    ///
    /// - Returns: DeviceInfoIOS with current device details
    /// - Throws: LocanaraError if not initialized
    public func getDeviceInfoIOS() throws -> DeviceInfoIOS {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        return DeviceInfoIOS.current()
    }

    /// Get available Foundation Models
    ///
    /// - Returns: Array of available Foundation Models
    /// - Throws: LocanaraError if not initialized
    public func getAvailableFoundationModels() throws -> [FoundationModelInfoIOS] {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        return availableFoundationModels
    }

    /// Check Apple Intelligence availability
    ///
    /// - Returns: true if Apple Intelligence is available on this device
    public func isAppleIntelligenceAvailable() -> Bool {
        guard let capability = deviceCapability else {
            return false
        }

        return capability.supportsOnDeviceAI
    }

    /// Get current inference engine type
    ///
    /// Returns the active inference engine being used for AI operations.
    /// Returns the active inference engine being used for AI operations.
    ///
    /// - Returns: InferenceEngineType being used
    public func getCurrentInferenceEngine() -> InferenceEngineType {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if let capability = deviceCapability, capability.supportsOnDeviceAI {
                return .foundationModels
            }
        }
        #endif
        return .none
    }

    /// Check if model is loaded and ready for inference
    ///
    /// Returns true if Foundation Models are available or a fallback engine is loaded
    ///
    /// - Returns: true if model is ready
    public func isModelReady() -> Bool {
        return getCurrentInferenceEngine() == .foundationModels
    }

    // MARK: - Context Management

    /// Get execution context by ID
    ///
    /// - Parameter contextId: Context identifier
    /// - Returns: ExecutionContext if found
    /// - Throws: LocanaraError if not found
    public func getContext(_ contextId: String) throws -> ExecutionContext {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard let context = contexts[contextId] else {
            throw LocanaraError.contextNotFound(contextId)
        }

        return context
    }

    /// Create a new execution context
    ///
    /// - Parameter preferences: Optional context preferences
    /// - Returns: New ExecutionContext
    /// - Throws: LocanaraError if not initialized
    public func createContext(preferences: ContextPreferencesInput? = nil) throws -> ExecutionContext {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        let contextPreferences: ContextPreferences
        if let prefs = preferences {
            contextPreferences = ContextPreferences(
                processingPreference: prefs.processingPreference ?? .auto,
                privacyLevel: prefs.privacyLevel ?? .balanced,
                maxProcessingTimeMs: prefs.maxProcessingTimeMs,
                enableCaching: prefs.enableCaching ?? true
            )
        } else {
            contextPreferences = ContextPreferences()
        }

        let context = ExecutionContext(preferences: contextPreferences)
        contexts[context.id] = context
        executionHistory[context.id] = []

        return context
    }

    /// Update an existing context
    ///
    /// - Parameter input: Update context input
    /// - Returns: Updated ExecutionContext
    /// - Throws: LocanaraError if context not found
    public func updateContext(_ input: UpdateContextInput) throws -> ExecutionContext {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard var context = contexts[input.contextId] else {
            throw LocanaraError.contextNotFound(input.contextId)
        }

        var newActions = context.recentActions ?? []
        if let addActions = input.addActions {
            newActions.append(contentsOf: addActions)
        }

        let currentPrefs = context.preferences ?? ContextPreferences()
        let newPreferences: ContextPreferences
        if let prefs = input.preferences {
            newPreferences = ContextPreferences(
                processingPreference: prefs.processingPreference ?? currentPrefs.processingPreference,
                privacyLevel: prefs.privacyLevel ?? currentPrefs.privacyLevel,
                maxProcessingTimeMs: prefs.maxProcessingTimeMs ?? currentPrefs.maxProcessingTimeMs,
                enableCaching: prefs.enableCaching ?? currentPrefs.enableCaching
            )
        } else {
            newPreferences = currentPrefs
        }

        context = ExecutionContext(
            id: context.id,
            recentActions: newActions,
            appState: input.appState ?? context.appState,
            preferences: newPreferences,
            lastUpdated: Date().timeIntervalSince1970
        )

        contexts[context.id] = context
        return context
    }

    /// Delete a context
    ///
    /// - Parameter contextId: Context ID to delete
    /// - Returns: VoidResult indicating success
    /// - Throws: LocanaraError if not initialized
    public func deleteContext(_ contextId: String) throws -> VoidResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        contexts.removeValue(forKey: contextId)
        executionHistory.removeValue(forKey: contextId)

        return VoidResult(success: true)
    }

    // MARK: - Execution History

    /// Get execution result by ID
    ///
    /// - Parameter executionId: Execution identifier
    /// - Returns: ExecutionResult if found, nil otherwise
    public func getExecutionResult(_ executionId: String) -> ExecutionResult? {
        for history in executionHistory.values {
            if let result = history.first(where: { $0.id == executionId }) {
                return result
            }
        }
        return nil
    }

    /// Get execution history for a context
    ///
    /// - Parameters:
    ///   - contextId: Context identifier
    ///   - limit: Optional limit on number of results
    /// - Returns: Array of ExecutionResults
    public func getExecutionHistory(contextId: String, limit: Int? = nil) -> [ExecutionResult] {
        guard let history = executionHistory[contextId] else {
            return []
        }

        if let limit = limit {
            return Array(history.suffix(limit))
        }

        return history
    }

    /// Clear execution history for a context
    ///
    /// - Parameter contextId: Context ID to clear history for
    /// - Returns: VoidResult indicating success
    public func clearHistory(_ contextId: String) -> VoidResult {
        executionHistory[contextId] = []
        return VoidResult(success: true)
    }

    // MARK: - Feature Execution

    /// Execute an AI feature
    ///
    /// - Parameter input: Feature execution input
    /// - Returns: ExecutionResult with feature output
    /// - Throws: LocanaraError if execution fails
    public func executeFeature(_ input: ExecuteFeatureInput) async throws -> ExecutionResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard isFeatureAvailable(input.feature) else {
            throw LocanaraError.featureNotAvailable(input.feature)
        }

        let startTime = Date().timeIntervalSince1970
        let executionId = UUID().uuidString

        do {
            let resultData = try await executeFeatureInternal(input)
            let endTime = Date().timeIntervalSince1970

            let result = ExecutionResult(
                id: executionId,
                feature: input.feature,
                state: .completed,
                result: resultData,
                processedOn: .onDevice,
                processingTimeMs: Int((endTime - startTime) * 1000),
                error: nil,
                startedAt: startTime,
                completedAt: endTime
            )

            // Store in history if context provided
            if let contextId = input.contextId {
                executionHistory[contextId, default: []].append(result)
            }

            return result
        } catch {
            let endTime = Date().timeIntervalSince1970

            let executionError = ExecutionError(
                code: "EXECUTION_FAILED",
                message: error.localizedDescription,
                details: nil,
                isRecoverable: true
            )

            let result = ExecutionResult(
                id: executionId,
                feature: input.feature,
                state: .failed,
                result: nil,
                processedOn: .onDevice,
                processingTimeMs: Int((endTime - startTime) * 1000),
                error: executionError,
                startedAt: startTime,
                completedAt: endTime
            )

            // Store in history if context provided
            if let contextId = input.contextId {
                executionHistory[contextId, default: []].append(result)
            }

            throw LocanaraError.executionFailed(error.localizedDescription)
        }
    }

    /// Execute feature with iOS-specific options
    ///
    /// - Parameters:
    ///   - input: Feature execution input
    ///   - options: iOS-specific options
    /// - Returns: ExecutionResult with feature output
    /// - Throws: LocanaraError if execution fails
    public func executeFeatureIOS(
        _ input: ExecuteFeatureInput,
        options: ExecuteFeatureOptionsIOS? = nil
    ) async throws -> ExecutionResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        // Check if on-device only is required
        if let opts = options, opts.requireOnDevice == true {
            guard isAppleIntelligenceAvailable() else {
                throw LocanaraError.featureNotAvailable(input.feature)
            }
        }

        return try await executeFeature(input)
    }

    /// Cancel an ongoing execution
    ///
    /// - Parameter executionId: Execution ID to cancel
    /// - Returns: VoidResult indicating success
    public func cancelExecution(_ executionId: String) -> VoidResult {
        // TODO: Integrate with InferenceRouter for cancellable engine-based inference
        return VoidResult(success: true)
    }

    // MARK: - Model Management

    /// Download a model
    ///
    /// For Foundation Models, this is a no-op (OS-managed).
    /// For llama.cpp models, use LocanaraClient+Engine extension methods.
    ///
    /// - Parameter modelId: Model identifier to download
    /// - Returns: VoidResult indicating success
    /// - Throws: LocanaraError if download fails
    public func downloadFoundationModel(_ modelId: String) async throws -> VoidResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        // Foundation Models are managed by the OS
        return VoidResult(success: true)
    }

    /// Request Apple Intelligence permission
    ///
    /// - Returns: VoidResult indicating success
    /// - Throws: LocanaraError if permission request fails
    public func requestAppleIntelligencePermission() async throws -> VoidResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        // Apple Intelligence permission is handled by the OS
        return VoidResult(success: true)
    }

    /// Preload models for better performance
    ///
    /// - Parameter features: Features to preload models for
    /// - Returns: VoidResult indicating success
    public func preloadModels(_ features: [FeatureType]) async -> VoidResult {
        // TODO: Integrate with ModelManager for engine-based preloading
        return VoidResult(success: true)
    }

    /// Unload models to free memory
    ///
    /// - Parameter features: Features to unload models for
    /// - Returns: VoidResult indicating success
    public func unloadModels(_ features: [FeatureType]) -> VoidResult {
        // TODO: Integrate with ModelManager for engine-based unloading
        return VoidResult(success: true)
    }

    // MARK: - Streaming

    /// Stream a chat response as a sequence of chunks
    ///
    /// - Parameters:
    ///   - input: User message
    ///   - parameters: Optional chat parameters
    /// - Returns: AsyncThrowingStream of ChatStreamChunk
    /// - Throws: LocanaraError if not initialized or feature unavailable
    public func chatStream(
        input: String,
        parameters: ChatParametersInput? = nil
    ) async throws -> AsyncThrowingStream<ChatStreamChunk, Error> {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        guard isFeatureAvailable(.chat) else {
            throw LocanaraError.featureNotAvailable(.chat)
        }

        return try await chatExecutor.executeStream(
            input: input,
            parameters: parameters
        )
    }

    // MARK: - Private Methods

    private func checkDeviceCapabilities() async throws -> DeviceCapability {
        let deviceInfo = DeviceInfoIOS.current()

        // Filter available features for iOS
        let iOSFeatures = FeatureType.allCases.filter { feature in
            switch feature {
            case .describeImageAndroid:
                return false  // Android only
            default:
                return true
            }
        }

        let featureCapabilities: [FeatureCapability] = deviceInfo.supportsAppleIntelligence
            ? iOSFeatures.map { feature in
                FeatureCapability(
                    feature: feature,
                    level: .full,
                    estimatedProcessingTimeMs: 500,
                    maxInputLength: 10000
                )
            }
            : []

        let availableMemory = Int(ProcessInfo.processInfo.physicalMemory / 1_048_576)

        return DeviceCapability(
            platform: .ios,
            supportsOnDeviceAI: deviceInfo.supportsAppleIntelligence,
            availableFeatures: deviceInfo.supportsAppleIntelligence
                ? iOSFeatures
                : [],
            featureCapabilities: featureCapabilities,
            availableMemoryMB: availableMemory,
            isLowPowerMode: ProcessInfo.processInfo.isLowPowerModeEnabled,
            modelInfo: nil
        )
    }

    private func loadAvailableFoundationModels() async -> [FoundationModelInfoIOS] {
        var models: [FoundationModelInfoIOS] = []

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Foundation Models is text-only (no multimodal/image support)
            models.append(FoundationModelInfoIOS(
                modelId: "apple.foundation.language",
                version: "1.0",
                supportedLanguages: ["en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "ru"],
                capabilities: ["summarize", "classify", "extract", "chat", "translate", "rewrite", "proofread"],
                requiresDownload: false,
                downloadSizeMB: nil,
                isAvailable: true
            ))
        }
        #endif

        return models
    }

    private func executeFeatureInternal(_ input: ExecuteFeatureInput) async throws -> ExecutionResultData {
        switch input.feature {
        case .summarize:
            let result = try await summarizeExecutor.execute(
                input: input.input,
                parameters: input.parameters?.summarize
            )
            return .summarize(result)

        case .classify:
            let result = try await classifyExecutor.execute(
                input: input.input,
                parameters: input.parameters?.classify
            )
            return .classify(result)

        case .extract:
            let result = try await extractExecutor.execute(
                input: input.input,
                parameters: input.parameters?.extract
            )
            return .extract(result)

        case .chat:
            let result = try await chatExecutor.execute(
                input: input.input,
                parameters: input.parameters?.chat
            )
            return .chat(result)

        // Note: chatStream is handled separately via chatStream() method

        case .translate:
            let result = try await translateExecutor.execute(
                input: input.input,
                parameters: input.parameters?.translate
            )
            return .translate(result)

        case .rewrite:
            let result = try await rewriteExecutor.execute(
                input: input.input,
                parameters: input.parameters?.rewrite
            )
            return .rewrite(result)

        case .proofread:
            let result = try await proofreadExecutor.execute(
                input: input.input,
                parameters: input.parameters?.proofread
            )
            return .proofread(result)

        case .describeImage:
            let result = try await describeImageExecutor.execute(
                input: input.input,
                parameters: input.parameters?.imageDescription
            )
            return .imageDescription(result)

        case .describeImageAndroid:
            // Android-only feature - not available on iOS
            throw LocanaraError.featureNotAvailable(.describeImageAndroid)

        case .generateImage:
            // Cross-platform image generation - not yet implemented
            throw LocanaraError.featureNotSupported(.generateImage)

        case .generateImageIos:
            let result = try await generateImageExecutor.execute(
                input: input.input,
                parameters: input.parameters?.imageGeneration
            )
            return .imageGeneration(result)
        }
    }
}
