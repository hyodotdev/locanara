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

            // Community tier: use standard methods
            currentEngine = locanara.getCurrentInferenceEngine()
            isModelReady = locanara.isModelReady()

            // Check AI availability based on current engine
            await checkAIAvailability()

            // Load device info
            loadDeviceInfo()

            // Load available features
            loadAvailableFeatures()

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
        // Community tier: check device capability
        let featuresAvailable: Bool
        do {
            let capability = try locanara.getDeviceCapability()
            featuresAvailable = !capability.availableFeatures.isEmpty
        } catch {
            featuresAvailable = false
        }

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

    /// Refresh features list
    func refreshFeatures() {
        currentEngine = locanara.getCurrentInferenceEngine()
        isModelReady = locanara.isModelReady()
        loadAvailableFeatures()
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
