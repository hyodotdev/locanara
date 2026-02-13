import Foundation
import os.log
#if canImport(UIKit)
import UIKit
#endif
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Logger for DeviceCapabilityDetector
private let capabilityLogger = Logger(subsystem: "com.locanara", category: "DeviceCapabilityDetector")

/// Locanara device capability detector
///
/// Detects device capabilities to determine optimal inference path:
/// - iOS 26+: Use Foundation Models (fastest, OS-managed)
/// - iOS 15-25: Use llama.cpp with GGUF models (Locanara)
@available(iOS 15.0, macOS 14.0, *)
public final class DeviceCapabilityDetector: Sendable {

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = DeviceCapabilityDetector()

    private init() {}

    // MARK: - Public Methods

    /// Detect device capabilities for Locanara
    ///
    /// - Returns: ExtendedDeviceCapability with detailed device info
    public func detectCapabilities() -> ExtendedDeviceCapability {
        let hasNeuralEngine = checkNeuralEngineSupport()
        let (availableMemory, totalMemory) = getMemoryInfo()
        let chipset = detectChipset()
        let iosVersion = getIOSVersion()
        let supportsFoundationModels = checkFoundationModelsSupport()
        let recommendedModel = recommendModel(
            totalMemoryMB: totalMemory,
            hasNeuralEngine: hasNeuralEngine
        )

        return ExtendedDeviceCapability(
            hasNeuralEngine: hasNeuralEngine,
            availableMemoryMB: availableMemory,
            totalMemoryMB: totalMemory,
            chipset: chipset,
            iosVersion: iosVersion,
            supportsFoundationModels: supportsFoundationModels,
            recommendedModel: recommendedModel
        )
    }

    /// Check if Foundation Models are available
    ///
    /// - Returns: true if iOS 26+ and Foundation Models can be used
    public func canUseFoundationModels() -> Bool {
        return checkFoundationModelsSupport()
    }

    /// Check if device supports Foundation Models but models are not ready
    ///
    /// This is useful for showing "Download Apple Intelligence models" prompt
    /// when the device is eligible but models haven't been downloaded yet.
    ///
    /// - Returns: true if iOS 26+ and eligible but models not downloaded
    public func isFoundationModelsEligibleButNotReady() -> Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            let availability = SystemLanguageModel.default.availability
            capabilityLogger.info("isFoundationModelsEligibleButNotReady: availability = \(String(describing: availability))")
            switch availability {
            case .available:
                capabilityLogger.info("isFoundationModelsEligibleButNotReady: Models are ready, returning false")
                return false  // Models are ready
            case .unavailable(let reason):
                capabilityLogger.info("isFoundationModelsEligibleButNotReady: unavailable reason = \(String(describing: reason))")
                switch reason {
                case .modelNotReady:
                    // Device is eligible but models not downloaded
                    capabilityLogger.info("isFoundationModelsEligibleButNotReady: modelNotReady, returning true")
                    return true
                default:
                    // Device not eligible (.deviceNotEligible, .requiresRecentOS, etc.)
                    capabilityLogger.info("isFoundationModelsEligibleButNotReady: other reason, returning false")
                    return false
                }
            @unknown default:
                capabilityLogger.info("isFoundationModelsEligibleButNotReady: unknown availability, returning false")
                return false
            }
        }
        #endif
        capabilityLogger.info("isFoundationModelsEligibleButNotReady: iOS 26+ not available, returning false")
        return false
    }

    /// Check if llama.cpp fallback is needed
    ///
    /// - Returns: true if device needs llama.cpp for on-device AI
    public func needsLlamaCppFallback() -> Bool {
        // Foundation Models require iOS 26+
        // Older devices need llama.cpp fallback
        return !checkFoundationModelsSupport()
    }

    /// Check if device can run Locanara features
    ///
    /// - Returns: true if device meets minimum requirements
    public func canRunExternalModels() -> Bool {
        let (_, totalMemory) = getMemoryInfo()
        let hasNeuralEngine = checkNeuralEngineSupport()

        // Minimum requirements:
        // - 4GB RAM (for Gemma-2-2B-it, the Locanara model)
        // - A12 Bionic or later (Neural Engine)
        // Note: iPhone 13 mini has 4GB but reports ~3.6GB due to system usage
        return totalMemory >= 4000 && hasNeuralEngine
    }

    /// Get recommended inference engine
    ///
    /// - Returns: InferenceEngineType based on device capabilities
    public func recommendedEngine() -> InferenceEngineType {
        if canUseFoundationModels() {
            return .foundationModels
        } else if canRunExternalModels() {
            // Default to llama.cpp, but user can change via InferenceRouter
            return .llamaCpp
        } else {
            return .none
        }
    }

    /// Get all available engines for this device
    ///
    /// - Returns: Array of available engine types, ordered by recommendation
    public func getAvailableEngines() -> [InferenceEngineType] {
        var engines: [InferenceEngineType] = []

        // Foundation Models (iOS 26+)
        if canUseFoundationModels() {
            engines.append(.foundationModels)
        }

        // Fallback engines (require Locanara minimum specs)
        if canRunExternalModels() {
            // llama.cpp - always available
            engines.append(.llamaCpp)

            // MLX - macOS with Apple Silicon only
            #if os(macOS)
            let chipset = detectChipset()
            if chipset.contains("M1") || chipset.contains("M2") ||
               chipset.contains("M3") || chipset.contains("M4") {
                engines.append(.mlx)
            }
            #endif

            // CoreML - available on all Apple platforms with Neural Engine
            if checkNeuralEngineSupport() {
                engines.append(.coreML)
            }
        }

        return engines
    }

    /// Check if a specific engine is available on this device
    ///
    /// - Parameter engine: Engine type to check
    /// - Returns: true if the engine can be used on this device
    public func isEngineAvailable(_ engine: InferenceEngineType) -> Bool {
        return getAvailableEngines().contains(engine)
    }

    /// Get engine recommendation with detailed info
    ///
    /// - Returns: EngineRecommendation with reasoning
    public func getEngineRecommendation() -> EngineRecommendation {
        let available = getAvailableEngines()

        if available.contains(.foundationModels) {
            return EngineRecommendation(
                recommended: .foundationModels,
                reason: "Native Apple Intelligence provides the best performance on iOS 26+",
                alternatives: available.filter { $0 != .foundationModels }
            )
        }

        if available.contains(.llamaCpp) {
            #if os(macOS)
            if available.contains(.mlx) {
                return EngineRecommendation(
                    recommended: .mlx,
                    reason: "MLX is optimized for Apple Silicon Macs",
                    alternatives: available.filter { $0 != .mlx }
                )
            }
            #endif

            return EngineRecommendation(
                recommended: .llamaCpp,
                reason: "llama.cpp provides broad model support with Metal GPU acceleration",
                alternatives: available.filter { $0 != .llamaCpp }
            )
        }

        return EngineRecommendation(
            recommended: .none,
            reason: "Device does not meet minimum requirements (4GB RAM, A12+ chip)",
            alternatives: []
        )
    }

    // MARK: - Private Methods

    private func checkNeuralEngineSupport() -> Bool {
        // Neural Engine detection strategy:
        // - iOS 17+ requires A12 Bionic or later, which all have Neural Engine
        // - macOS: Check if running on Apple Silicon (M1+)
        // This avoids maintaining device-specific chipset mappings

        #if os(macOS)
        // On macOS, check if running on Apple Silicon
        // Apple Silicon Macs (M1 and later) all have Neural Engine
        return isAppleSiliconMac()
        #else
        // iOS 17+ dropped support for A11 and older chips
        // All iOS 17+ compatible devices have A12 Bionic or newer = Neural Engine
        let version = ProcessInfo.processInfo.operatingSystemVersion
        if version.majorVersion >= 17 {
            return true
        }

        // Fallback for iOS 15-16: check chipset mapping
        let chipset = detectChipset()
        let a12OrLater = [
            "A12", "A13", "A14", "A15", "A16", "A17", "A18",
            "M1", "M2", "M3", "M4"
        ]
        return a12OrLater.contains { chipset.contains($0) }
        #endif
    }

    /// Check if running on Apple Silicon Mac
    private func isAppleSiliconMac() -> Bool {
        #if os(macOS)
        #if arch(arm64)
        // Running natively on Apple Silicon
        return true
        #else
        // Check if running under Rosetta 2
        var ret: Int32 = 0
        var size = MemoryLayout<Int32>.size
        let result = sysctlbyname("sysctl.proc_translated", &ret, &size, nil, 0)
        return result == 0 && ret == 1
        #endif
        #else
        return false
        #endif
    }

    private func getMemoryInfo() -> (available: Int, total: Int) {
        let totalMemory = Int(ProcessInfo.processInfo.physicalMemory / 1_048_576)

        // Get available memory using vm_statistics
        var vmStats = vm_statistics64()
        var size = mach_msg_type_number_t(
            MemoryLayout<vm_statistics64_data_t>.size / MemoryLayout<integer_t>.size
        )
        let hostPort = mach_host_self()

        let result = withUnsafeMutablePointer(to: &vmStats) { pointer in
            pointer.withMemoryRebound(to: integer_t.self, capacity: Int(size)) { ptr in
                host_statistics64(hostPort, HOST_VM_INFO64, ptr, &size)
            }
        }

        guard result == KERN_SUCCESS else {
            return (totalMemory / 2, totalMemory)
        }

        let pageSize = UInt64(getpagesize())
        let freeMemory = UInt64(vmStats.free_count) * pageSize / 1_048_576
        let inactiveMemory = UInt64(vmStats.inactive_count) * pageSize / 1_048_576
        let availableMemory = Int(freeMemory + inactiveMemory)

        return (availableMemory, totalMemory)
    }

    private func detectChipset() -> String {
        #if targetEnvironment(simulator)
        return "Simulator"
        #elseif os(macOS)
        // On macOS, get the actual chip model
        return getMacChipset()
        #else
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }

        return mapIdentifierToChipset(identifier)
        #endif
    }

    /// Get Mac chipset information using sysctl
    private func getMacChipset() -> String {
        #if os(macOS)
        var size: size_t = 0
        sysctlbyname("machdep.cpu.brand_string", nil, &size, nil, 0)
        var brand = [CChar](repeating: 0, count: size)
        sysctlbyname("machdep.cpu.brand_string", &brand, &size, nil, 0)
        let brandString = String(cString: brand)

        // Parse the brand string to extract chipset name
        if brandString.contains("Apple M") {
            // Extract M1, M2, M3, M4, etc.
            if let range = brandString.range(of: "Apple M\\d+ ?(Pro|Max|Ultra)?", options: .regularExpression) {
                return String(brandString[range])
            }
            return "Apple Silicon"
        } else if brandString.contains("Intel") {
            return "Intel"
        }

        return brandString.isEmpty ? "Unknown Mac" : brandString
        #else
        return "Unknown"
        #endif
    }

    private func mapIdentifierToChipset(_ identifier: String) -> String {
        // iPhone mappings
        let chipsetMap: [String: String] = [
            // iPhone 11 series (A13)
            "iPhone12,1": "A13 Bionic",
            "iPhone12,3": "A13 Bionic",
            "iPhone12,5": "A13 Bionic",
            // iPhone SE 2nd gen (A13)
            "iPhone12,8": "A13 Bionic",
            // iPhone 12 series (A14)
            "iPhone13,1": "A14 Bionic",
            "iPhone13,2": "A14 Bionic",
            "iPhone13,3": "A14 Bionic",
            "iPhone13,4": "A14 Bionic",
            // iPhone 13 series (A15)
            "iPhone14,2": "A15 Bionic",
            "iPhone14,3": "A15 Bionic",
            "iPhone14,4": "A15 Bionic",
            "iPhone14,5": "A15 Bionic",
            // iPhone SE 3rd gen (A15)
            "iPhone14,6": "A15 Bionic",
            // iPhone 14 series (A15/A16)
            "iPhone14,7": "A15 Bionic",
            "iPhone14,8": "A15 Bionic",
            "iPhone15,2": "A16 Bionic",
            "iPhone15,3": "A16 Bionic",
            // iPhone 15 series (A16/A17)
            "iPhone15,4": "A16 Bionic",
            "iPhone15,5": "A16 Bionic",
            "iPhone16,1": "A17 Pro",
            "iPhone16,2": "A17 Pro",
            // iPhone 16 series (A18)
            "iPhone17,1": "A18 Pro",
            "iPhone17,2": "A18 Pro",
            "iPhone17,3": "A18",
            "iPhone17,4": "A18",
            // iPad Air (4th gen) - A14
            "iPad13,1": "A14 Bionic",
            "iPad13,2": "A14 Bionic",
            // iPad mini (6th gen) - A15
            "iPad14,1": "A15 Bionic",
            "iPad14,2": "A15 Bionic",
            // iPad Air (5th gen) - M1
            "iPad13,16": "M1",
            "iPad13,17": "M1",
            // iPad Pro 11" (3rd gen) - M1
            "iPad13,4": "M1",
            "iPad13,5": "M1",
            "iPad13,6": "M1",
            "iPad13,7": "M1",
            // iPad Pro 12.9" (5th gen) - M1
            "iPad13,8": "M1",
            "iPad13,9": "M1",
            "iPad13,10": "M1",
            "iPad13,11": "M1",
            // iPad (10th gen) - A14
            "iPad13,18": "A14 Bionic",
            "iPad13,19": "A14 Bionic",
            // iPad Pro 11" (4th gen) - M2
            "iPad14,3": "M2",
            "iPad14,4": "M2",
            // iPad Pro 12.9" (6th gen) - M2
            "iPad14,5": "M2",
            "iPad14,6": "M2",
            // iPad Air (6th gen) 11" - M2
            "iPad14,8": "M2",
            "iPad14,9": "M2",
            // iPad Air (6th gen) 13" - M2
            "iPad14,10": "M2",
            "iPad14,11": "M2",
            // iPad Pro 11" (M4) - 2024
            "iPad16,3": "M4",
            "iPad16,4": "M4",
            // iPad Pro 13" (M4) - 2024
            "iPad16,5": "M4",
            "iPad16,6": "M4",
            // iPad mini (7th gen) - A17 Pro
            "iPad16,1": "A17 Pro",
            "iPad16,2": "A17 Pro",
        ]

        return chipsetMap[identifier] ?? "Unknown (\(identifier))"
    }

    private func getIOSVersion() -> String {
        let version = ProcessInfo.processInfo.operatingSystemVersion
        return "\(version.majorVersion).\(version.minorVersion).\(version.patchVersion)"
    }

    private func checkFoundationModelsSupport() -> Bool {
        // Foundation Models require iOS 26+ / macOS 26+ AND actual device support
        // iPhone 13 mini can run iOS 26 but doesn't support Apple Intelligence
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Check actual runtime availability, not just OS version
            // SystemLanguageModel.default.availability returns .available or .unavailable(reason)
            let availability = SystemLanguageModel.default.availability
            if case .available = availability {
                capabilityLogger.info("Foundation Models: available")
                return true
            }
            capabilityLogger.info("Foundation Models: unavailable - \(String(describing: availability))")
            return false
        }
        #endif
        capabilityLogger.info("Foundation Models: iOS 26+ not available")
        return false
    }

    private func recommendModel(totalMemoryMB: Int, hasNeuralEngine: Bool) -> String? {
        guard hasNeuralEngine else { return nil }

        // Locanara uses a single model: Gemma-2-2B-it
        // Requires 4GB+ RAM (iPhone 13 mini and newer)
        if totalMemoryMB >= 4000 {
            return "gemma-2-2b-it-q4"
        }

        return nil
    }
}

// InferenceEngineType is defined in the Locanara module

// MARK: - Engine Recommendation

/// Detailed engine recommendation with reasoning
public struct EngineRecommendation: Sendable {
    /// Recommended engine type
    public let recommended: InferenceEngineType

    /// Human-readable reason for the recommendation
    public let reason: String

    /// Alternative engines available on this device
    public let alternatives: [InferenceEngineType]

    /// Whether any engine is available
    public var hasAvailableEngine: Bool {
        recommended != .none
    }
}
