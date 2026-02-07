import Foundation

/// Locanara SDK Tier
///
/// Community Edition - Uses Apple Intelligence (Foundation Models) for on-device AI.
public enum LocanaraTier: String, Sendable {
    case community = "community"
}

/// Current SDK tier - Community
public let currentTier: LocanaraTier = .community

/// Check if current tier is Community (always true for this SDK)
public var isCommunityTier: Bool {
    return true
}

/// Check if a feature requires Pro tier
///
/// - Parameter feature: Feature type to check
/// - Returns: true if feature requires Pro tier
/// - Note: Most features work in Community tier with Apple Intelligence.
///         describeImage requires Pro tier because Foundation Models is text-only.
public func requiresProTier(_ feature: FeatureType) -> Bool {
    switch feature {
    case .describeImage:
        // Foundation Models (Community tier) is text-only - no multimodal support
        return true
    case .describeImageAndroid:
        // Android-only feature
        return false
    case .generateImage:
        // Cross-platform image generation requires Pro tier
        return true
    case .generateImageIos:
        // iOS Community tier - uses Image Playground
        return false
    default:
        // All other features work with Foundation Models in Community tier
        return false
    }
}

/// Pro tier guard
///
/// Throws error if feature requires Pro tier (not available in Community)
/// - Parameter feature: Feature to check
/// - Throws: LocanaraError.proTierRequired if feature requires Pro
public func guardProTier(_ feature: FeatureType) throws {
    guard requiresProTier(feature) else { return }
    throw LocanaraError.proTierRequired(feature)
}

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
