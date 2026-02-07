import Foundation
import os.log
#if canImport(UIKit)
import UIKit
#endif
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Logger for Extensions
private let extensionsLogger = Logger(subsystem: "com.locanara", category: "Extensions")

// MARK: - DeviceInfoIOS Extensions

extension DeviceInfoIOS {
    /// Get current device information
    public static func current() -> DeviceInfoIOS {
        #if os(iOS) || os(tvOS)
        let modelIdentifier = getModelIdentifier()
        let version = ProcessInfo.processInfo.operatingSystemVersion
        let osVersion = "\(version.majorVersion).\(version.minorVersion).\(version.patchVersion)"
        #elseif os(macOS)
        let modelIdentifier = getModelIdentifier()
        let osVersion = ProcessInfo.processInfo.operatingSystemVersionString
        #else
        let modelIdentifier = "Unknown"
        let osVersion = "Unknown"
        #endif

        let systemLanguages = Locale.preferredLanguages
        let hasNeuralEngine = checkNeuralEngineSupport()
        let supportsAppleIntelligence = checkAppleIntelligenceSupport()

        return DeviceInfoIOS(
            modelIdentifier: modelIdentifier,
            osVersion: osVersion,
            supportsAppleIntelligence: supportsAppleIntelligence,
            systemLanguages: systemLanguages,
            hasNeuralEngine: hasNeuralEngine
        )
    }

    private static func getModelIdentifier() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }

    private static func checkNeuralEngineSupport() -> Bool {
        // All modern Apple devices (A11+) have Neural Engine
        // This is a simplified check
        #if os(iOS) || os(tvOS)
        if #available(iOS 18.0, *) {
            return true
        }
        return false
        #elseif os(macOS)
        if #available(macOS 15.0, *) {
            return true
        }
        return false
        #else
        return false
        #endif
    }

    private static func checkAppleIntelligenceSupport() -> Bool {
        // Apple Intelligence requires iOS 26+ / macOS 26+ AND actual device support
        // Some devices can run iOS 26 but don't support Apple Intelligence (e.g., iPhone 13 mini)
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Check actual runtime availability, not just OS version
            let availability = SystemLanguageModel.default.availability
            if case .available = availability {
                extensionsLogger.info("Apple Intelligence: available")
                return true
            }
            extensionsLogger.info("Apple Intelligence: unavailable - \(String(describing: availability))")
            return false
        }
        #endif
        extensionsLogger.info("Apple Intelligence: iOS 26+ not available")
        return false
    }
}

// MARK: - ContextPreferences Extensions

extension ContextPreferences {
    /// Default context preferences
    public init() {
        self.init(
            processingPreference: .auto,
            privacyLevel: .balanced,
            maxProcessingTimeMs: nil,
            enableCaching: true
        )
    }
}

// MARK: - ExecutionContext Extensions

extension ExecutionContext {
    /// Create a new execution context with auto-generated ID
    public init(preferences: ContextPreferences) {
        self.init(
            id: UUID().uuidString,
            recentActions: [],
            appState: nil,
            preferences: preferences,
            lastUpdated: Date().timeIntervalSince1970 * 1000
        )
    }
}

// MARK: - ExecutionResultData Codable

extension ExecutionResultData: Codable {
    private enum CodingKeys: String, CodingKey {
        case type
        case data
    }

    private enum ResultType: String, Codable {
        case summarize, classify, extract, chat, translate, rewrite, proofread, imageDescription, imageGeneration
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(ResultType.self, forKey: .type)

        switch type {
        case .summarize:
            let data = try container.decode(SummarizeResult.self, forKey: .data)
            self = .summarize(data)
        case .classify:
            let data = try container.decode(ClassifyResult.self, forKey: .data)
            self = .classify(data)
        case .extract:
            let data = try container.decode(ExtractResult.self, forKey: .data)
            self = .extract(data)
        case .chat:
            let data = try container.decode(ChatResult.self, forKey: .data)
            self = .chat(data)
        case .translate:
            let data = try container.decode(TranslateResult.self, forKey: .data)
            self = .translate(data)
        case .rewrite:
            let data = try container.decode(RewriteResult.self, forKey: .data)
            self = .rewrite(data)
        case .proofread:
            let data = try container.decode(ProofreadResult.self, forKey: .data)
            self = .proofread(data)
        case .imageDescription:
            let data = try container.decode(ImageDescriptionResult.self, forKey: .data)
            self = .imageDescription(data)
        case .imageGeneration:
            let data = try container.decode(ImageGenerationResult.self, forKey: .data)
            self = .imageGeneration(data)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .summarize(let data):
            try container.encode(ResultType.summarize, forKey: .type)
            try container.encode(data, forKey: .data)
        case .classify(let data):
            try container.encode(ResultType.classify, forKey: .type)
            try container.encode(data, forKey: .data)
        case .extract(let data):
            try container.encode(ResultType.extract, forKey: .type)
            try container.encode(data, forKey: .data)
        case .chat(let data):
            try container.encode(ResultType.chat, forKey: .type)
            try container.encode(data, forKey: .data)
        case .translate(let data):
            try container.encode(ResultType.translate, forKey: .type)
            try container.encode(data, forKey: .data)
        case .rewrite(let data):
            try container.encode(ResultType.rewrite, forKey: .type)
            try container.encode(data, forKey: .data)
        case .proofread(let data):
            try container.encode(ResultType.proofread, forKey: .type)
            try container.encode(data, forKey: .data)
        case .imageDescription(let data):
            try container.encode(ResultType.imageDescription, forKey: .type)
            try container.encode(data, forKey: .data)
        case .imageGeneration(let data):
            try container.encode(ResultType.imageGeneration, forKey: .type)
            try container.encode(data, forKey: .data)
        }
    }
}

// MARK: - EventData Codable

extension EventData: Codable {
    private enum CodingKeys: String, CodingKey {
        case type
        case data
    }

    private enum EventType: String, Codable {
        case capabilityChanged, modelLoaded, modelUnloaded
        case executionStarted, executionCompleted, executionFailed
        case contextUpdated
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(EventType.self, forKey: .type)

        switch type {
        case .capabilityChanged:
            let data = try container.decode(CapabilityChangedEvent.self, forKey: .data)
            self = .capabilityChangedEvent(data)
        case .modelLoaded:
            let data = try container.decode(ModelLoadedEvent.self, forKey: .data)
            self = .modelLoadedEvent(data)
        case .modelUnloaded:
            let data = try container.decode(ModelUnloadedEvent.self, forKey: .data)
            self = .modelUnloadedEvent(data)
        case .executionStarted:
            let data = try container.decode(ExecutionStartedEvent.self, forKey: .data)
            self = .executionStartedEvent(data)
        case .executionCompleted:
            let data = try container.decode(ExecutionCompletedEvent.self, forKey: .data)
            self = .executionCompletedEvent(data)
        case .executionFailed:
            let data = try container.decode(ExecutionFailedEvent.self, forKey: .data)
            self = .executionFailedEvent(data)
        case .contextUpdated:
            let data = try container.decode(ContextUpdatedEvent.self, forKey: .data)
            self = .contextUpdatedEvent(data)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .capabilityChangedEvent(let data):
            try container.encode(EventType.capabilityChanged, forKey: .type)
            try container.encode(data, forKey: .data)
        case .modelLoadedEvent(let data):
            try container.encode(EventType.modelLoaded, forKey: .type)
            try container.encode(data, forKey: .data)
        case .modelUnloadedEvent(let data):
            try container.encode(EventType.modelUnloaded, forKey: .type)
            try container.encode(data, forKey: .data)
        case .executionStartedEvent(let data):
            try container.encode(EventType.executionStarted, forKey: .type)
            try container.encode(data, forKey: .data)
        case .executionCompletedEvent(let data):
            try container.encode(EventType.executionCompleted, forKey: .type)
            try container.encode(data, forKey: .data)
        case .executionFailedEvent(let data):
            try container.encode(EventType.executionFailed, forKey: .type)
            try container.encode(data, forKey: .data)
        case .contextUpdatedEvent(let data):
            try container.encode(EventType.contextUpdated, forKey: .type)
            try container.encode(data, forKey: .data)
        }
    }
}
