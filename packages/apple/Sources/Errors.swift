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
    case custom(ErrorCode, String)

    // Model & inference errors
    case modelNotDownloaded(String)
    case modelDownloadFailed(String)
    case modelLoadFailed(String)
    case insufficientMemory(required: Int, available: Int)
    case inferenceTimeout
    case inferenceCancelled

    // Foundation Models specific errors
    case modelAssetsUnavailable(availability: String)

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
        case .custom(let code, let message):
            return "[\(code.rawValue)] \(message)"
        case .modelNotDownloaded(let modelId):
            return "Model '\(modelId)' is not downloaded. Call downloadModel() first."
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
        case .modelAssetsUnavailable:
            return """
                Apple Intelligence model assets are not available on this device. \
                This device may not support Apple Intelligence (requires iPhone 15 Pro or later). \
                On older devices, Locanara will use llama.cpp as a fallback engine.
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
        case .modelAssetsUnavailable:
            return .featureNotAvailable
        }
    }
}
