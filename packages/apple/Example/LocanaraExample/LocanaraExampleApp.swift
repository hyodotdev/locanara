import SwiftUI
import Locanara

// MARK: - Package Source Compatibility

/// Helper to detect package source (works with both old and new SDK versions)
enum ExamplePackageSource: String {
    case localSource = "Local Source"
    case releasedPackage = "Released Package"

    /// Detect package source using SDK API if available, otherwise use bundle detection
    static var current: ExamplePackageSource {
        // Check if SDK provides packageSource (SDK 1.1.0+)
        // For older SDKs, fall back to bundle-based detection
        let locanaraBundle = Bundle(for: LocanaraClient.self)

        // If the bundle path contains .framework or Frameworks, it's from a released package
        if locanaraBundle.bundlePath.contains(".framework") ||
           locanaraBundle.bundlePath.contains("/Frameworks/") {
            return .releasedPackage
        }

        return .localSource
    }

    var displayColor: String {
        switch self {
        case .releasedPackage: return "blue"
        case .localSource: return "orange"
        }
    }
}

/// Locanara Example App
///
/// Demonstrates the Locanara on-device AI framework including:
/// - Built-in chains (Summarize, Classify, Extract, Chat, Translate, Rewrite, Proofread)
/// - Pipeline DSL for chain composition
/// - Memory management and guardrails
/// - AI availability check (Apple Intelligence)
@main
struct LocanaraExampleApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// MARK: - App State

/// Global app state for SDK lifecycle management
@MainActor
final class AppState: ObservableObject {

    enum SDKState: Equatable {
        case notInitialized
        case initializing
        case initialized
        case error(String)
    }

    enum AIAvailability: Equatable {
        case unknown
        case checking
        case available
    }

    @Published var sdkState: SDKState = .notInitialized
    @Published var aiAvailability: AIAvailability = .unknown
    @Published var deviceInfo: DeviceInfoDisplay?
    @Published var availableFeatures: [FeatureInfo] = []
    @Published var currentEngine: InferenceEngineType = .none
    @Published var isModelReady: Bool = false
    @Published var isFoundationModelsEligibleButNotReady: Bool = false

    // Model management
    @Published var availableModels: [ModelDisplayInfo] = []
    @Published var downloadProgress: Double = 0
    @Published var isDownloading: Bool = false
    @Published var downloadError: String?
    @Published var loadedModelId: String?

    // Locanara SDK instance
    private var locanara: LocanaraClient {
        LocanaraClient.shared
    }

    /// Initialize the SDK and check AI availability
    func initializeSDK() async {
        switch sdkState {
        case .initializing, .initialized:
            return
        default:
            break
        }

        sdkState = .initializing
        aiAvailability = .checking

        do {
            // Initialize SDK
            try await locanara.initialize()
            sdkState = .initialized

            // Log package source for verification
            let packageSource = ExamplePackageSource.current
            print("[LocanaraExample] Package Source: \(packageSource.rawValue)")

            // Auto-load last used model or first downloaded model
            await autoLoadModel()

            currentEngine = locanara.getCurrentEngine()
            isModelReady = locanara.isExternalModelReady()
            isFoundationModelsEligibleButNotReady = locanara.isFoundationModelsEligibleButNotReady()
            loadedModelId = locanara.getLoadedModel()

            // Check AI availability based on current engine
            await checkAIAvailability()

            // Load device info
            loadDeviceInfo()

            // Load available features
            loadAvailableFeatures()

            // Load available models
            loadAvailableModels()

        } catch {
            sdkState = .error(error.localizedDescription)
        }
    }

    /// Check if on-device AI is available
    private func checkAIAvailability() async {
        // Always mark as available - model download handled via AIStatusBanner
        aiAvailability = .available
    }

    /// Load device information
    private func loadDeviceInfo() {
        do {
            let info = try locanara.getDeviceInfoIOS()
            deviceInfo = DeviceInfoDisplay(
                modelIdentifier: info.modelIdentifier,
                osVersion: info.osVersion,
                supportsAppleIntelligence: info.supportsAppleIntelligence,
                systemLanguages: info.systemLanguages,
                hasNeuralEngine: info.hasNeuralEngine
            )
        } catch {
            print("[Example] Failed to load device info: \(error)")
        }
    }

    /// iOS-relevant feature types (excludes Android-specific duplicates)
    private static let iosFeatureTypes: [FeatureType] = [
        .summarize, .classify, .extract, .chat,
        .translate, .rewrite, .proofread,
    ]

    /// Features that are not yet implemented (shown as Coming Soon)
    private static let comingSoonFeatures: Set<FeatureType> = []

    /// Load available features
    private func loadAvailableFeatures() {
        // Check if model is ready (either Foundation Models or llama.cpp)
        let featuresAvailable = isModelReady

        availableFeatures = Self.iosFeatureTypes.map { feature in
            let isComingSoon = Self.comingSoonFeatures.contains(feature)
            return FeatureInfo(
                type: feature,
                isAvailable: isComingSoon ? false : featuresAvailable,
                isComingSoon: isComingSoon,
                description: featureDescription(for: feature)
            )
        }
    }

    private func featureDescription(for feature: FeatureType) -> String {
        switch feature {
        case .summarize:
            return "Condense long text into concise summaries"
        case .classify:
            return "Categorize content into predefined labels"
        case .extract:
            return "Extract entities and key information from text"
        case .chat:
            return "Have conversational interactions with AI"
        case .translate:
            return "Translate text between languages"
        case .rewrite:
            return "Rewrite text in different styles or tones"
        case .proofread:
            return "Check and correct grammar and spelling"
        default:
            return ""
        }
    }

    // MARK: - Model Management

    /// Load available models for download
    private func loadAvailableModels() {
        let models = locanara.getAvailableModels()
        let downloadedModels = Set(locanara.getDownloadedModels())
        let currentLoadedModel = locanara.getLoadedModel()
        loadedModelId = currentLoadedModel

        let capability = locanara.getExtendedDeviceCapability()

        availableModels = models.map { model in
            ModelDisplayInfo(
                modelId: model.modelId,
                name: model.name,
                sizeMB: model.sizeMB,
                isDownloaded: downloadedModels.contains(model.modelId),
                isRecommended: model.modelId == capability.recommendedModel,
                isLoaded: model.modelId == currentLoadedModel
            )
        }
    }

    /// Download the recommended model
    func downloadRecommendedModel() async {
        let capability = locanara.getExtendedDeviceCapability()
        guard let modelId = capability.recommendedModel else {
            downloadError = "No recommended model found for this device"
            return
        }
        await downloadModel(modelId)
    }

    /// Download a specific model
    func downloadModel(_ modelId: String) async {
        isDownloading = true
        downloadProgress = 0
        downloadError = nil

        do {
            let progressStream = try await locanara.downloadModelWithProgress(modelId)

            for await progress in progressStream {
                downloadProgress = progress.progress

                switch progress.state {
                case .completed:
                    isDownloading = false
                    // Load the model into memory after download completes
                    do {
                        try await locanara.loadModel(modelId)
                        saveLastUsedModel(modelId)
                        downloadError = nil
                    } catch {
                        downloadError = "Failed to load model: \(error.localizedDescription)"
                    }
                    isModelReady = locanara.isExternalModelReady()
                    currentEngine = locanara.getCurrentEngine()
                    loadedModelId = locanara.getLoadedModel()
                    if isModelReady {
                        downloadError = nil
                    }
                    loadAvailableModels()
                    await checkAIAvailability()
                    loadAvailableFeatures()

                case .failed:
                    isDownloading = false
                    downloadError = "Download failed"

                case .cancelled:
                    isDownloading = false
                    downloadError = "Download cancelled"

                default:
                    break
                }
            }
        } catch {
            isDownloading = false
            downloadError = error.localizedDescription
        }
    }

    /// Delete a downloaded model
    func deleteModel(_ modelId: String) async {
        do {
            try locanara.deleteModel(modelId)
            isModelReady = locanara.isExternalModelReady()
            currentEngine = locanara.getCurrentEngine()
            loadAvailableModels()
            await checkAIAvailability()
            loadAvailableFeatures()
        } catch {
            print("[Example] Failed to delete model: \(error)")
        }
    }

    /// Load a downloaded model into memory
    func loadModel(_ modelId: String) async {
        do {
            try await locanara.loadModel(modelId)
            saveLastUsedModel(modelId)
            downloadError = nil
            isModelReady = locanara.isExternalModelReady()
            currentEngine = locanara.getCurrentEngine()
            loadedModelId = locanara.getLoadedModel()
            loadAvailableModels()
            await checkAIAvailability()
            loadAvailableFeatures()
        } catch {
            downloadError = "Failed to load model: \(error.localizedDescription)"
        }
    }

    /// Refresh features list
    func refreshFeatures() {
        isModelReady = locanara.isExternalModelReady()
        isFoundationModelsEligibleButNotReady = locanara.isFoundationModelsEligibleButNotReady()
        currentEngine = locanara.getCurrentEngine()
        loadedModelId = locanara.getLoadedModel()
        if isModelReady {
            downloadError = nil
        }
        loadAvailableModels()
        loadAvailableFeatures()
    }

    /// Switch to Apple Intelligence (device AI)
    func switchToAppleIntelligence() {
        Task {
            do {
                try await locanara.switchToDeviceAI()
                await MainActor.run {
                    downloadError = nil
                    savePreferredEngine(.foundationModels)
                    refreshFeatures()
                }
            } catch {
                await MainActor.run {
                    downloadError = "Failed to switch: \(error.localizedDescription)"
                }
            }
        }
    }

    /// Switch to external model (llama.cpp)
    func switchToExternalModel(_ modelId: String) {
        Task {
            do {
                try await locanara.switchToExternalModel(modelId)
                await MainActor.run {
                    downloadError = nil
                    savePreferredEngine(.llamaCpp)
                    saveLastUsedModel(modelId)
                    refreshFeatures()
                }
            } catch {
                await MainActor.run {
                    downloadError = "Failed to switch: \(error.localizedDescription)"
                }
            }
        }
    }

    // MARK: - Auto Model Loading

    private static let lastUsedModelKey = "com.locanara.example.lastUsedModel"
    private static let preferredEngineKey = "com.locanara.example.preferredEngine"

    private func savePreferredEngine(_ engine: InferenceEngineType) {
        UserDefaults.standard.set(engine.rawValue, forKey: Self.preferredEngineKey)
    }

    private func getPreferredEngine() -> InferenceEngineType? {
        guard let rawValue = UserDefaults.standard.string(forKey: Self.preferredEngineKey) else {
            return nil
        }
        return InferenceEngineType(rawValue: rawValue)
    }

    private func autoLoadModel() async {
        let preferredEngine = getPreferredEngine()
        let downloadedModels = locanara.getDownloadedModels()

        guard !downloadedModels.isEmpty else { return }

        var loadedModel: String?
        if let lastModelId = UserDefaults.standard.string(forKey: Self.lastUsedModelKey),
           downloadedModels.contains(lastModelId) {
            do {
                try await locanara.loadModel(lastModelId)
                downloadError = nil
                loadedModel = lastModelId
            } catch {
                print("[Example] Failed to auto-load last used model: \(error)")
            }
        }

        if loadedModel == nil {
            let firstModel = downloadedModels[0]
            do {
                try await locanara.loadModel(firstModel)
                saveLastUsedModel(firstModel)
                downloadError = nil
                loadedModel = firstModel
            } catch {
                print("[Example] Failed to auto-load first model: \(error)")
            }
        }

        if preferredEngine == .llamaCpp, let modelId = loadedModel {
            do {
                try await locanara.switchToExternalModel(modelId)
            } catch {
                print("[Example] Failed to switch to external model: \(error)")
            }
        }
    }

    private func saveLastUsedModel(_ modelId: String) {
        UserDefaults.standard.set(modelId, forKey: Self.lastUsedModelKey)
    }

    /// Check if device needs model download
    var needsModelDownload: Bool {
        return currentEngine == .none || (currentEngine != .foundationModels && !isModelReady)
    }
}

// MARK: - Display Models

struct DeviceInfoDisplay: Equatable {
    let modelIdentifier: String
    let osVersion: String
    let supportsAppleIntelligence: Bool
    let systemLanguages: [String]
    let hasNeuralEngine: Bool
}

struct FeatureInfo: Identifiable, Equatable {
    let id = UUID()
    let type: FeatureType
    let isAvailable: Bool
    var isComingSoon: Bool = false
    let description: String
}

struct ModelDisplayInfo: Identifiable, Equatable {
    var id: String { modelId }
    let modelId: String
    let name: String
    let sizeMB: Int
    let isDownloaded: Bool
    let isRecommended: Bool
    var isLoaded: Bool = false
}
