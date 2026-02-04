import Foundation

// Note: ErrorCode enum is auto-generated in Types.swift from GraphQL schema

/// Locanara errors
public enum LocanaraError: Error, LocalizedError {
    case sdkNotInitialized
    case initializationFailed(String)
    case featureNotAvailable(FeatureType)
    case featureNotSupported(FeatureType)
    case capabilityCheckFailed
    case executionFailed(String)
    case invalidInput(String)
    case deviceNotSupported
    case contextNotFound(String)
    case permissionDenied
    case proTierRequired(FeatureType)
    case custom(ErrorCode, String)

    // Pro tier specific errors
    case modelNotDownloaded(String)
    case modelDownloadFailed(String)
    case modelLoadFailed(String)
    case insufficientMemory(required: Int, available: Int)
    case inferenceTimeout
    case inferenceCancelled

    // Upgrade guidance errors
    case upgradeRequired(UpgradeReason)

    // Foundation Models specific errors
    case modelAssetsUnavailable(availability: Any)

    public var errorDescription: String? {
        switch self {
        case .sdkNotInitialized:
            return "Locanara SDK is not initialized. Call initialize() first."
        case .initializationFailed(let reason):
            return "Failed to initialize SDK: \(reason)"
        case .featureNotAvailable(let feature):
            return "Feature '\(feature.rawValue)' is not available on this device."
        case .featureNotSupported(let feature):
            return "Feature '\(feature.rawValue)' is not supported."
        case .capabilityCheckFailed:
            return "Failed to check device capabilities."
        case .executionFailed(let reason):
            return "Execution failed: \(reason)"
        case .invalidInput(let reason):
            return "Invalid input: \(reason)"
        case .deviceNotSupported:
            return "This device is not supported."
        case .contextNotFound(let id):
            return "Context with id '\(id)' not found."
        case .permissionDenied:
            return "Permission denied. Please grant necessary permissions."
        case .proTierRequired(let feature):
            return "Feature '\(feature.rawValue)' requires Locanara Pro. Upgrade at https://docs-pro.locanara.com"
        case .custom(let code, let message):
            return "[\(code.rawValue)] \(message)"
        case .modelNotDownloaded(let modelId):
            return "Model '\(modelId)' is not downloaded. Call downloadFoundationModel() first."
        case .modelDownloadFailed(let reason):
            return "Model download failed: \(reason)"
        case .modelLoadFailed(let reason):
            return "Failed to load model: \(reason)"
        case .insufficientMemory(let required, let available):
            return "Insufficient memory. Required: \(required)MB, Available: \(available)MB"
        case .inferenceTimeout:
            return "Inference timed out."
        case .inferenceCancelled:
            return "Inference was cancelled."
        case .upgradeRequired(let reason):
            return reason.message
        case .modelAssetsUnavailable:
            return """
                Apple Intelligence model assets are not available on this device.
                This device may not support Apple Intelligence (requires iPhone 15 Pro or later).
                Upgrade to Locanara Pro for on-device AI on older devices.
                """
        }
    }

    public var errorCode: ErrorCode {
        switch self {
        case .sdkNotInitialized:
            return .sdkNotInitialized
        case .initializationFailed:
            return .initializationFailed
        case .featureNotAvailable:
            return .featureNotAvailable
        case .featureNotSupported:
            return .featureNotSupported
        case .capabilityCheckFailed:
            return .internalError
        case .executionFailed:
            return .executionFailed
        case .invalidInput:
            return .invalidInput
        case .deviceNotSupported:
            return .deviceNotSupported
        case .contextNotFound:
            return .contextNotFound
        case .permissionDenied:
            return .permissionDenied
        case .proTierRequired:
            return .proTierRequired
        case .custom(let code, _):
            return code
        case .modelNotDownloaded:
            return .modelDownloadRequired
        case .modelDownloadFailed:
            return .modelDownloadRequired
        case .modelLoadFailed:
            return .modelNotLoaded
        case .insufficientMemory:
            return .insufficientMemory
        case .inferenceTimeout:
            return .executionTimeout
        case .inferenceCancelled:
            return .executionCancelled
        case .upgradeRequired:
            return .proTierRequired
        case .modelAssetsUnavailable:
            return .featureNotAvailable
        }
    }
}

// MARK: - Upgrade Guidance

/// Reasons for requiring an upgrade to Pro tier
public enum UpgradeReason: Sendable {
    /// Device doesn't support Foundation Models (iOS < 26)
    case foundationModelsNotAvailable(iosVersion: String)

    /// Device lacks Apple Intelligence support
    case appleIntelligenceNotSupported(deviceModel: String)

    /// Feature requires Pro tier fallback engines
    case fallbackEngineRequired

    /// Custom model selection requires Pro
    case customModelRequired

    /// Human-readable message for the upgrade reason
    public var message: String {
        switch self {
        case .foundationModelsNotAvailable(let version):
            return """
                Apple Intelligence requires iOS 26 or later (current: iOS \(version)).
                Upgrade to Locanara Pro for on-device AI on iOS 15+.
                """
        case .appleIntelligenceNotSupported(let model):
            return """
                Apple Intelligence is not available on \(model).
                Upgrade to Locanara Pro for universal device support with llama.cpp, MLX, or CoreML.
                """
        case .fallbackEngineRequired:
            return """
                This feature requires a fallback inference engine.
                Upgrade to Locanara Pro to use llama.cpp, MLX, or CoreML on older devices.
                """
        case .customModelRequired:
            return """
                Custom model selection is only available in Locanara Pro.
                Community tier uses OS-managed Foundation Models.
                """
        }
    }

    /// URL for upgrade information
    public var upgradeURL: URL {
        URL(string: "https://docs-pro.locanara.com")!
    }

    /// Short title for UI display
    public var title: String {
        switch self {
        case .foundationModelsNotAvailable:
            return "iOS 26+ Required"
        case .appleIntelligenceNotSupported:
            return "Device Not Supported"
        case .fallbackEngineRequired:
            return "Pro Tier Required"
        case .customModelRequired:
            return "Pro Feature"
        }
    }
}

// MARK: - Upgrade Guidance Helper

/// Helper for generating upgrade guidance
public struct UpgradeGuidance: Sendable {

    /// Check if upgrade is needed and return appropriate guidance
    ///
    /// - Returns: UpgradeReason if upgrade is recommended, nil if Community tier is sufficient
    public static func checkUpgradeNeeded() -> UpgradeReason? {
        // Check iOS version
        let version = ProcessInfo.processInfo.operatingSystemVersion
        let versionString = "\(version.majorVersion).\(version.minorVersion)"

        if version.majorVersion < 26 {
            return .foundationModelsNotAvailable(iosVersion: versionString)
        }

        // Check device capability
        let deviceInfo = DeviceInfoIOS.current()
        if !deviceInfo.supportsAppleIntelligence {
            return .appleIntelligenceNotSupported(deviceModel: deviceInfo.modelIdentifier)
        }

        return nil
    }

    /// Get available engines information for upgrade prompt
    ///
    /// - Returns: Description of engines available in Pro tier
    public static var proTierEngines: String {
        """
        Locanara Pro includes multiple inference engines:

        • llama.cpp - GGUF models with Metal GPU acceleration
        • MLX - Apple Silicon optimized (macOS)
        • CoreML - NPU-accelerated inference

        Support for iOS 15+ and ~99% device coverage.
        """
    }
}
