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
    /// SDK version
    public static let version = "1.0.1"

    /// Check if Pro tier is available (always false in Community SDK)
    public static var isProTier: Bool {
        return false
    }

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
    /// No engine available
    case none = "none"

    /// Human-readable display name
    public var displayName: String {
        switch self {
        case .foundationModels: return "Apple Intelligence"
        case .none: return "None"
        }
    }

    /// Description of the engine
    public var engineDescription: String {
        switch self {
        case .foundationModels: return "Native Apple Intelligence (iOS 26+)"
        case .none: return "No inference engine available"
        }
    }

    /// Whether this engine requires model download
    public var requiresModelDownload: Bool {
        return false
    }
}

/// Locanara SDK for iOS - Community Edition
///
/// Provides a unified interface for on-device AI capabilities
/// built on top of Apple Intelligence and Foundation Models.
///
/// **Note:** This is the Community tier which only supports
/// devices with Apple Intelligence (iOS 26+).
/// For universal device support, upgrade to Locanara Pro.
@available(iOS 15.0, macOS 14.0, tvOS 15.0, watchOS 8.0, *)
public final class LocanaraClient {

    // MARK: - Properties

    /// Shared singleton instance
    public static let shared = LocanaraClient()

    /// Current SDK version
    public static let version = "1.0.1"

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
    /// Community tier only supports Foundation Models.
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

    /// Check if upgrade to Pro tier is recommended
    ///
    /// Returns guidance on why an upgrade might be beneficial,
    /// especially when Community tier features are limited.
    ///
    /// - Returns: UpgradeReason if upgrade is recommended, nil otherwise
    public func checkUpgradeRecommendation() -> UpgradeReason? {
        return UpgradeGuidance.checkUpgradeNeeded()
    }

    /// Get upgrade guidance for Pro tier
    ///
    /// - Returns: UpgradeGuidance with available Pro tier engines info
    public static var proTierInfo: String {
        return UpgradeGuidance.proTierEngines
    }

    /// Check if model is loaded and ready for inference
    ///
    /// Community tier: Returns true if Foundation Models are available
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

        // Check tier requirements
        try guardProTier(input.feature)

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

        if let opts = options, opts.modelId != nil {
            logger.warning("""
                executeFeatureIOS() modelId option is ignored in Community tier. \
                Foundation Models use OS-managed models. Upgrade to Pro for custom model selection.
                """)
        }

        return try await executeFeature(input)
    }

    /// Cancel an ongoing execution
    ///
    /// - Parameter executionId: Execution ID to cancel
    /// - Returns: VoidResult indicating success
    public func cancelExecution(_ executionId: String) -> VoidResult {
        logger.warning("""
            cancelExecution() is a no-op in Community tier. \
            Foundation Models operations complete quickly. \
            Upgrade to Pro for cancellable long-running inference.
            """)
        return VoidResult(success: true)
    }

    // MARK: - Model Management

    /// Download a specific Foundation Model
    ///
    /// - Parameter modelId: Model identifier to download
    /// - Returns: VoidResult indicating success
    /// - Throws: LocanaraError if download fails
    public func downloadFoundationModel(_ modelId: String) async throws -> VoidResult {
        guard isInitialized else {
            throw LocanaraError.sdkNotInitialized
        }

        logger.warning("""
            downloadFoundationModel() is a no-op in Community tier. \
            Foundation Models are managed by the OS. Upgrade to Pro for custom model downloads.
            """)
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

        logger.warning("""
            requestAppleIntelligencePermission() is a no-op in Community tier. \
            Apple Intelligence permission is handled by the OS.
            """)
        return VoidResult(success: true)
    }

    /// Preload models for better performance
    ///
    /// - Parameter features: Features to preload models for
    /// - Returns: VoidResult indicating success
    public func preloadModels(_ features: [FeatureType]) async -> VoidResult {
        logger.warning("""
            preloadModels() is a no-op in Community tier. \
            Foundation Models manage caching automatically via the OS. Upgrade to Pro for model preloading.
            """)
        return VoidResult(success: true)
    }

    /// Unload models to free memory
    ///
    /// - Parameter features: Features to unload models for
    /// - Returns: VoidResult indicating success
    public func unloadModels(_ features: [FeatureType]) -> VoidResult {
        logger.warning("""
            unloadModels() is a no-op in Community tier. \
            Foundation Models manage memory automatically via the OS.
            """)
        return VoidResult(success: true)
    }

    // MARK: - Private Methods

    private func checkDeviceCapabilities() async throws -> DeviceCapability {
        let deviceInfo = DeviceInfoIOS.current()

        // Filter available features for iOS Community tier:
        // - Exclude describeImage (Pro only - Foundation Models is text-only)
        // - Exclude describeImageAndroid (Android only)
        // - Exclude generateImage (Pro only - requires Stable Diffusion etc)
        // - Include generateImageIos (iOS Community - uses Image Playground)
        let iOSCommunityFeatures = FeatureType.allCases.filter { feature in
            switch feature {
            case .describeImage, .describeImageAndroid, .generateImage:
                return false  // Pro or Android only
            default:
                return true  // Including generateImageIos
            }
        }

        let featureCapabilities: [FeatureCapability] = deviceInfo.supportsAppleIntelligence
            ? iOSCommunityFeatures.map { feature in
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
                ? iOSCommunityFeatures
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
            // Pro tier only - requires Stable Diffusion or similar
            throw LocanaraError.proTierRequired(.generateImage)

        case .generateImageIos:
            let result = try await generateImageExecutor.execute(
                input: input.input,
                parameters: input.parameters?.imageGeneration
            )
            return .imageGeneration(result)
        }
    }
}
