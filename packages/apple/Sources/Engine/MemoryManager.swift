import Foundation
import os.log
#if canImport(UIKit)
import UIKit
#endif

private let logger = Logger(subsystem: "com.locanara", category: "MemoryManager")

/// Manages memory for Locanara inference
///
/// Features:
/// - Memory pressure monitoring
/// - Automatic model unloading under pressure
/// - Memory statistics
/// - Low memory warnings
@available(iOS 15.0, macOS 14.0, *)
public final class MemoryManager: @unchecked Sendable {

    // MARK: - Types

    /// Memory pressure level
    public enum MemoryPressureLevel: String, Sendable {
        case normal = "normal"
        case warning = "warning"
        case critical = "critical"
    }

    /// Memory statistics
    public struct MemoryStats: Sendable {
        public let totalMemoryMB: Int
        public let availableMemoryMB: Int
        public let usedMemoryMB: Int
        public let pressureLevel: MemoryPressureLevel

        public var usagePercentage: Double {
            guard totalMemoryMB > 0 else { return 0 }
            return Double(usedMemoryMB) / Double(totalMemoryMB) * 100
        }
    }

    /// Memory event for observers
    public enum MemoryEvent: Sendable {
        case pressureChanged(MemoryPressureLevel)
        case lowMemoryWarning
        case criticalMemory
    }

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = MemoryManager()

    // MARK: - Properties

    /// Current memory pressure level
    public private(set) var currentPressureLevel: MemoryPressureLevel = .normal

    /// Memory event callbacks
    private var eventCallbacks: [(MemoryEvent) -> Void] = []

    /// Dispatch source for memory pressure
    private var memoryPressureSource: DispatchSourceMemoryPressure?

    /// Lock for thread safety
    private let lock = NSLock()

    /// Thresholds (percentage of total memory)
    private let warningThreshold: Double = 70.0
    private let criticalThreshold: Double = 85.0

    // MARK: - Initialization

    private init() {
        setupMemoryPressureMonitoring()
        setupLowMemoryNotification()
        updatePressureLevel()

        logger.info("MemoryManager initialized")
    }

    deinit {
        memoryPressureSource?.cancel()
    }

    // MARK: - Memory Information

    /// Get current memory statistics
    ///
    /// - Returns: MemoryStats with current memory info
    public func getMemoryStats() -> MemoryStats {
        let total = getTotalMemoryMB()
        let available = getAvailableMemoryMB()
        let used = total - available

        return MemoryStats(
            totalMemoryMB: total,
            availableMemoryMB: available,
            usedMemoryMB: used,
            pressureLevel: currentPressureLevel
        )
    }

    /// Get total device memory in MB
    ///
    /// - Returns: Total memory in MB
    public func getTotalMemoryMB() -> Int {
        return Int(ProcessInfo.processInfo.physicalMemory / 1_048_576)
    }

    /// Get available memory in MB
    ///
    /// - Returns: Available memory in MB
    public func getAvailableMemoryMB() -> Int {
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
            // Fallback: estimate available as 30% of total
            return getTotalMemoryMB() * 30 / 100
        }

        let pageSize = UInt(getpagesize())
        let freeMemory = UInt64(vmStats.free_count) * UInt64(pageSize)
        let inactiveMemory = UInt64(vmStats.inactive_count) * UInt64(pageSize)
        let purgableMemory = UInt64(vmStats.purgeable_count) * UInt64(pageSize)

        let availableBytes = freeMemory + inactiveMemory + purgableMemory
        return Int(availableBytes / 1_048_576)
    }

    /// Check if there's enough memory for an operation
    ///
    /// - Parameter requiredMB: Required memory in MB
    /// - Returns: true if enough memory is available
    public func hasEnoughMemory(requiredMB: Int) -> Bool {
        let available = getAvailableMemoryMB()
        // Require 20% buffer
        let requiredWithBuffer = Int(Double(requiredMB) * 1.2)
        return available >= requiredWithBuffer
    }

    /// Check if device can safely run inference
    ///
    /// - Returns: true if memory conditions are safe for inference
    public func canRunInference() -> Bool {
        return currentPressureLevel != .critical && hasEnoughMemory(requiredMB: 500)
    }

    // MARK: - Memory Pressure Handling

    /// Subscribe to memory events
    ///
    /// - Parameter callback: Callback for memory events
    public func onMemoryEvent(_ callback: @escaping (MemoryEvent) -> Void) {
        lock.lock()
        defer { lock.unlock() }
        eventCallbacks.append(callback)
    }

    /// Request memory cleanup
    ///
    /// Triggers cleanup operations to free memory.
    public func requestCleanup() {
        logger.info("Memory cleanup requested")

        // Notify observers to release cached resources
        notifyEvent(.lowMemoryWarning)

        // Suggest garbage collection
        #if DEBUG
        logger.debug("Available memory after cleanup request: \(self.getAvailableMemoryMB())MB")
        #endif
    }

    // MARK: - Private Methods

    private func setupMemoryPressureMonitoring() {
        let source = DispatchSource.makeMemoryPressureSource(
            eventMask: [.warning, .critical],
            queue: .main
        )

        source.setEventHandler { [weak self] in
            guard let self = self else { return }

            let event = source.data
            if event.contains(.critical) {
                self.handleMemoryPressure(.critical)
            } else if event.contains(.warning) {
                self.handleMemoryPressure(.warning)
            }
        }

        source.resume()
        memoryPressureSource = source
    }

    private func setupLowMemoryNotification() {
        #if canImport(UIKit) && !os(watchOS)
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleMemoryPressure(.warning)
        }
        #endif
    }

    private func handleMemoryPressure(_ level: MemoryPressureLevel) {
        lock.lock()
        let previousLevel = currentPressureLevel
        currentPressureLevel = level
        lock.unlock()

        if previousLevel != level {
            logger.warning("Memory pressure changed: \(previousLevel.rawValue) -> \(level.rawValue)")
            notifyEvent(.pressureChanged(level))
        }

        switch level {
        case .warning:
            notifyEvent(.lowMemoryWarning)
        case .critical:
            notifyEvent(.criticalMemory)
        case .normal:
            break
        }
    }

    private func updatePressureLevel() {
        let stats = getMemoryStats()

        let newLevel: MemoryPressureLevel
        if stats.usagePercentage >= criticalThreshold {
            newLevel = .critical
        } else if stats.usagePercentage >= warningThreshold {
            newLevel = .warning
        } else {
            newLevel = .normal
        }

        lock.lock()
        currentPressureLevel = newLevel
        lock.unlock()
    }

    private func notifyEvent(_ event: MemoryEvent) {
        lock.lock()
        let callbacks = eventCallbacks
        lock.unlock()

        for callback in callbacks {
            callback(event)
        }
    }
}

// MARK: - Memory Estimation

@available(iOS 15.0, macOS 14.0, *)
extension MemoryManager {

    /// Estimate memory requirement for a model
    ///
    /// - Parameter modelInfo: Model information
    /// - Returns: Estimated runtime memory in MB
    public func estimateMemoryRequirement(for modelInfo: DownloadableModelInfo) -> Int {
        // Base memory is model size
        var estimatedMB = modelInfo.sizeMB

        // Add overhead based on quantization
        switch modelInfo.quantization {
        case .int4:
            estimatedMB += modelInfo.sizeMB / 4  // ~25% overhead
        case .int8:
            estimatedMB += modelInfo.sizeMB / 3  // ~33% overhead
        case .float16:
            estimatedMB += modelInfo.sizeMB / 2  // ~50% overhead
        case .float32:
            estimatedMB += modelInfo.sizeMB      // ~100% overhead
        }

        // Add context buffer (based on context length)
        let contextOverhead = modelInfo.contextLength * 4 / 1024  // ~4KB per token
        estimatedMB += contextOverhead

        // Add general runtime overhead
        estimatedMB += 200  // Base runtime overhead

        return estimatedMB
    }

    /// Get maximum recommended context size for current memory
    ///
    /// - Returns: Maximum context size in tokens
    public func getMaxContextSize() -> Int {
        let availableMB = getAvailableMemoryMB()

        // Reserve 500MB for model and system
        let availableForContext = max(0, availableMB - 500)

        // ~4KB per token for KV cache
        let maxTokens = availableForContext * 1024 / 4

        // Cap at reasonable limits
        return min(max(512, maxTokens), 8192)
    }
}

// MARK: - Diagnostic Information

@available(iOS 15.0, macOS 14.0, *)
extension MemoryManager {

    /// Get diagnostic information
    ///
    /// - Returns: Dictionary with memory diagnostics
    public func getDiagnostics() -> [String: Any] {
        let stats = getMemoryStats()

        return [
            "totalMemoryMB": stats.totalMemoryMB,
            "availableMemoryMB": stats.availableMemoryMB,
            "usedMemoryMB": stats.usedMemoryMB,
            "usagePercentage": String(format: "%.1f%%", stats.usagePercentage),
            "pressureLevel": stats.pressureLevel.rawValue,
            "canRunInference": canRunInference(),
            "maxContextSize": getMaxContextSize()
        ]
    }
}
