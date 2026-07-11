import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "LlamaCppBridge")

/// Legacy one-phase protocol for external llama.cpp engine providers.
///
/// Enables C++ interop-dependent llama.cpp code to be isolated in a separate
/// framework target, avoiding the viral propagation of C++ interop to modules
/// that import React Native or other C++-incompatible headers.
///
/// Implementations should:
/// 1. Create an `InferenceEngine`-conforming engine using LocalLLMClient
/// 2. Register it with `InferenceRouter.shared.registerEngine()`
/// 3. Signal completion via the callback
///
/// `ModelManager` deliberately rejects providers that conform only to this
/// protocol. Third-party bridges must also adopt
/// `LlamaCppPreparedBridgeProvider` so preparation has no global router side
/// effects before lifecycle validation commits the model.
@objc public protocol LlamaCppBridgeProvider: AnyObject {
    /// Load a model and register the engine with InferenceRouter.
    ///
    /// - Parameters:
    ///   - modelPath: Absolute path to the GGUF model file
    ///   - mmprojPath: Optional path to multimodal projector file
    ///   - completion: Called with nil on success, or an NSError on failure
    func loadAndRegisterModel(_ modelPath: String, mmprojPath: String?, completion: @escaping (NSError?) -> Void)

    /// Unload the current model and unregister from InferenceRouter.
    func unloadModel()

    /// Whether a model is currently loaded.
    var isModelLoaded: Bool { get }
}

/// Two-phase bridge lifecycle used by `ModelManager`.
///
/// Preparing a model must not mutate `InferenceRouter`. The manager calls
/// `commitPreparedModel()` only while its lifecycle token and verified files
/// are current. A stale or cancelled load is released with
/// `discardPreparedModel()` instead.
@objc public protocol LlamaCppPreparedBridgeProvider: LlamaCppBridgeProvider {
    /// Prepare an engine without registering it globally.
    func prepareModel(_ modelPath: String, mmprojPath: String?, completion: @escaping (NSError?) -> Void)

    /// Register the prepared engine. This must return promptly, must not call
    /// back into `ModelManager`, and must either complete fully or throw without
    /// leaving a partially committed router state.
    func commitPreparedModel() throws

    /// Release only the prepared engine without changing `InferenceRouter`.
    func discardPreparedModel()
}

/// Discovery mechanism for external llama.cpp bridge implementations.
///
/// The bridge is loaded via ObjC runtime (`NSClassFromString`) to avoid
/// compile-time import dependencies that would propagate C++ interop.
@available(iOS 15.0, macOS 14.0, *)
public enum LlamaCppBridge {
    /// Well-known class name for the bridge implementation.
    /// The bridge framework must register an `@objc` class with this exact name.
    private static let bridgeClassName = "LocanaraLlamaBridge.LlamaCppBridgeEngine"

    /// Cached bridge instance (singleton pattern)
    nonisolated(unsafe) private static var _cachedBridge: LlamaCppBridgeProvider?
    nonisolated(unsafe) private static var _didAttemptDiscovery = false

    /// Discover and return the bridge implementation, if available.
    ///
    /// - Returns: Bridge provider instance, or nil if no bridge is linked
    public static func findBridge() -> LlamaCppBridgeProvider? {
        if _didAttemptDiscovery {
            return _cachedBridge
        }
        _didAttemptDiscovery = true

        guard let cls = NSClassFromString(bridgeClassName) else {
            logger.debug("LlamaCpp bridge not found (class: \(bridgeClassName))")
            return nil
        }

        guard let providerClass = cls as? (NSObject & LlamaCppBridgeProvider).Type else {
            logger.warning("LlamaCpp bridge class found but does not conform to LlamaCppBridgeProvider")
            return nil
        }

        let provider: LlamaCppBridgeProvider = providerClass.init()
        _cachedBridge = provider
        logger.info("LlamaCpp bridge discovered: \(bridgeClassName)")
        return provider
    }

    /// Check if a bridge implementation is available without creating an instance.
    public static var isAvailable: Bool {
        return NSClassFromString(bridgeClassName) != nil
    }
}
