import Foundation

/// Check if Foundation Models are available
///
/// - Returns: true if iOS 26+ / macOS 26+ (Foundation Models supported)
@available(iOS 15.0, macOS 14.0, *)
public func isFoundationModelsAvailable() -> Bool {
    if #available(iOS 26.0, macOS 26.0, *) {
        return true
    }
    return false
}

/// Check if llama.cpp fallback should be used
///
/// - Returns: true if Foundation Models not available (use llama.cpp instead)
@available(iOS 15.0, macOS 14.0, *)
public func shouldUseLlamaCppFallback() -> Bool {
    return !isFoundationModelsAvailable()
}
