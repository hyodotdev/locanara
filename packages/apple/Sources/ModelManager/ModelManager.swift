import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "ModelManager")

/// Central manager for model lifecycle operations
///
/// Coordinates:
/// - Model discovery and recommendation
/// - Download orchestration
/// - Model loading/unloading
/// - Storage management
@available(iOS 15.0, macOS 14.0, *)
public final class ModelManager: @unchecked Sendable {

    // MARK: - Types

    /// Model lifecycle state
    public enum ModelLifecycleState: Sendable {
        case notDownloaded
        case downloading(progress: Double)
        case downloaded
        case verifying
        case loading
        case loaded
        case unloading
        case error(String)
    }

    /// Model state change event
    public struct ModelStateChange: Sendable {
        public let modelId: String
        public let previousState: ModelLifecycleState
        public let currentState: ModelLifecycleState
        public let timestamp: Date
    }

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelManager()

    // MARK: - Properties

    /// Current model states
    private var modelStates: [String: ModelLifecycleState] = [:]

    /// State change callbacks
    private var stateChangeCallbacks: [@Sendable (ModelStateChange) -> Void] = []

    /// Dependencies
    private let registry = ModelRegistry.shared
    private let storage = ModelStorage.shared
    private let downloader = ModelDownloader.shared

    /// Currently loaded model ID
    private var loadedModelId: String?

    /// Engine reference (set after loading)
    private var currentEngine: LlamaCppEngineProtocol?

    /// Serial queue for state management
    private let stateQueue = DispatchQueue(label: "com.locanara.modelmanager.state")

    /// Lock for loadedModelId and currentEngine access
    private let engineLock = NSLock()

    // MARK: - Initialization

    private init() {
        // Initialize states for all registered models
        for model in registry.models {
            let isDownloaded = storage.isModelDownloaded(model.modelId)
            modelStates[model.modelId] = isDownloaded ? .downloaded : .notDownloaded
        }

        logger.info("ModelManager initialized with \(self.registry.models.count) registered models")
    }

    // MARK: - State Management

    /// Get current state of a model
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Current lifecycle state
    public func getModelState(_ modelId: String) -> ModelLifecycleState {
        var state: ModelLifecycleState = .notDownloaded
        stateQueue.sync {
            state = modelStates[modelId] ?? .notDownloaded
        }
        return state
    }

    /// Subscribe to model state changes
    ///
    /// - Parameter callback: Callback for state changes
    public func onStateChange(_ callback: @Sendable @escaping (ModelStateChange) -> Void) {
        stateQueue.async { [weak self] in
            self?.stateChangeCallbacks.append(callback)
        }
    }

    /// Update model state and notify listeners
    private func updateState(_ modelId: String, to newState: ModelLifecycleState) {
        stateQueue.async { [weak self] in
            guard let self = self else { return }

            let previousState = self.modelStates[modelId] ?? .notDownloaded
            self.modelStates[modelId] = newState

            let change = ModelStateChange(
                modelId: modelId,
                previousState: previousState,
                currentState: newState,
                timestamp: Date()
            )

            // Notify all listeners
            for callback in self.stateChangeCallbacks {
                callback(change)
            }

            logger.debug("Model \(modelId) state: \(String(describing: previousState)) -> \(String(describing: newState))")
        }
    }

    // MARK: - Model Discovery

    /// Get all available models
    ///
    /// - Returns: Array of model info
    public func getAvailableModels() -> [DownloadableModelInfo] {
        return registry.models
    }

    /// Get recommended model for device
    ///
    /// - Parameter memoryMB: Available memory in MB
    /// - Returns: Recommended model info
    public func getRecommendedModel(forMemoryMB memoryMB: Int) -> DownloadableModelInfo? {
        return registry.getRecommendedModel(forMemoryMB: memoryMB)
    }

    /// Get downloaded models
    ///
    /// - Returns: Array of downloaded model IDs
    public func getDownloadedModels() -> [String] {
        return storage.listDownloadedModels()
    }

    /// Check if model is downloaded
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if model is downloaded
    public func isModelDownloaded(_ modelId: String) -> Bool {
        return storage.isModelDownloaded(modelId)
    }

    /// Check if model is loaded
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if model is currently loaded
    public func isModelLoaded(_ modelId: String) -> Bool {
        return engineLock.withLock { loadedModelId == modelId }
    }

    // MARK: - Download Operations

    /// Download a model
    ///
    /// - Parameter modelId: Model identifier to download
    /// - Returns: AsyncStream of download progress
    /// - Throws: LocanaraError if model not found or insufficient storage
    public func downloadModel(_ modelId: String) async throws -> AsyncStream<ModelDownloadProgress> {
        // Get model info
        guard let modelInfo = registry.getModel(modelId) else {
            throw LocanaraError.custom(.modelDownloadRequired, "Unknown model: \(modelId)")
        }

        // Check if already downloaded
        if storage.isModelDownloaded(modelId) {
            logger.info("Model already downloaded: \(modelId)")
            return AsyncStream { continuation in
                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: Int64(modelInfo.sizeMB) * 1024 * 1024,
                    totalBytes: Int64(modelInfo.sizeMB) * 1024 * 1024,
                    state: .completed
                ))
                continuation.finish()
            }
        }

        // Check storage space
        guard storage.hasEnoughSpace(forSizeMB: modelInfo.sizeMB) else {
            throw LocanaraError.custom(
                .insufficientMemory,
                "Not enough storage space. Required: \(modelInfo.sizeMB)MB"
            )
        }

        // Update state
        updateState(modelId, to: .downloading(progress: 0))

        // Start download
        logger.info("Starting download for model: \(modelId)")
        let progressStream = downloader.downloadModel(modelInfo)

        // Return a transformed stream that updates state
        return AsyncStream { continuation in
            Task { [weak self, progressStream] in
                for await progress in progressStream {
                    // Update state based on progress
                    switch progress.state {
                    case .downloading:
                        self?.updateState(modelId, to: .downloading(progress: progress.progress))
                    case .verifying:
                        self?.updateState(modelId, to: .verifying)
                    case .completed:
                        // Verify checksum
                        self?.updateState(modelId, to: .verifying)
                        continuation.yield(ModelDownloadProgress(
                            modelId: modelId,
                            bytesDownloaded: progress.bytesDownloaded,
                            totalBytes: progress.totalBytes,
                            state: .verifying
                        ))

                        let isValid = await self?.verifyDownload(modelId, modelInfo: modelInfo) ?? false
                        if isValid {
                            self?.updateState(modelId, to: .downloaded)
                            continuation.yield(ModelDownloadProgress(
                                modelId: modelId,
                                bytesDownloaded: progress.totalBytes,
                                totalBytes: progress.totalBytes,
                                state: .completed
                            ))
                        } else {
                            self?.updateState(modelId, to: .error("Checksum verification failed"))
                            continuation.yield(ModelDownloadProgress(
                                modelId: modelId,
                                bytesDownloaded: progress.bytesDownloaded,
                                totalBytes: progress.totalBytes,
                                state: .failed
                            ))
                        }
                        continue
                    case .failed:
                        self?.updateState(modelId, to: .error("Download failed"))
                        continuation.yield(progress)
                        continue
                    case .cancelled:
                        self?.updateState(modelId, to: .notDownloaded)
                        continuation.yield(progress)
                        continue
                    default:
                        break
                    }

                    continuation.yield(progress)
                }
                continuation.finish()
            }
        }
    }

    /// Cancel model download
    ///
    /// - Parameter modelId: Model identifier
    public func cancelDownload(_ modelId: String) {
        downloader.cancelDownload(modelId)
        updateState(modelId, to: .notDownloaded)
    }

    /// Verify downloaded model
    private func verifyDownload(_ modelId: String, modelInfo: DownloadableModelInfo) async -> Bool {
        // Verify checksum
        let isValid = await storage.verifyChecksum(modelId, expectedChecksum: modelInfo.checksum)

        if isValid {
            // Create manifest
            let manifest = ModelStorage.ModelManifest(
                modelId: modelId,
                version: modelInfo.version,
                downloadedAt: Date(),
                fileSize: storage.getModelSize(modelId) ?? 0,
                checksum: modelInfo.checksum,
                checksumVerified: true
            )
            try? storage.saveManifest(manifest, for: modelId)
            logger.info("Model verified and manifest saved: \(modelId)")
        } else {
            // Delete corrupted download
            try? storage.deleteModel(modelId)
            logger.error("Model verification failed, deleted: \(modelId)")
        }

        return isValid
    }

    // MARK: - Load/Unload Operations

    /// Load model into memory
    ///
    /// - Parameter modelId: Model identifier to load
    /// - Throws: LocanaraError if load fails
    public func loadModel(_ modelId: String) async throws {
        // Check if already loaded
        let (alreadyLoaded, currentId) = engineLock.withLock {
            (loadedModelId == modelId, loadedModelId)
        }
        if alreadyLoaded {
            logger.debug("Model already loaded: \(modelId)")
            return
        }

        // Check if downloaded
        guard storage.isModelDownloaded(modelId) else {
            throw LocanaraError.modelNotDownloaded(modelId)
        }

        // Unload current model if any
        if let currentId = currentId {
            unloadModel(currentId)
        }

        // Update state
        updateState(modelId, to: .loading)

        do {
            // Create engine instance with optional mmproj for multimodal support
            let modelPath = storage.getModelPath(modelId)

            // Check if mmproj exists for this model (multimodal support)
            let mmprojId = "\(modelId)-mmproj"
            let mmprojPath: URL?
            if storage.isModelDownloaded(mmprojId) {
                mmprojPath = storage.getModelPath(mmprojId)
                logger.info("Multimodal projector found: \(mmprojId)")
            } else {
                mmprojPath = nil
                logger.debug("No multimodal projector found for: \(modelId)")
            }

            // Try external bridge first (for environments where C++ interop is isolated,
            // e.g. Expo/React Native builds where the bridge pod has C++ interop enabled
            // but the main module does not)
            if let bridge = LlamaCppBridge.findBridge() {
                try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                    bridge.loadAndRegisterModel(
                        modelPath.path,
                        mmprojPath: mmprojPath?.path
                    ) { error in
                        if let error {
                            continuation.resume(throwing: error)
                        } else {
                            continuation.resume()
                        }
                    }
                }
                engineLock.withLock { loadedModelId = modelId }
                updateState(modelId, to: .loaded)
                let multimodalStatus = mmprojPath != nil ? " (multimodal enabled)" : ""
                logger.info("Model loaded via bridge: \(modelId)\(multimodalStatus)")
                return
            }

            // Fall through to built-in LlamaCppEngine
            guard #available(iOS 17.0, macOS 14.0, *) else {
                throw LocanaraError.modelLoadFailed("LlamaCppEngine requires iOS 17.0+ or macOS 14.0+")
            }
            let engine = try await LlamaCppEngine.create(
                modelPath: modelPath,
                mmprojPath: mmprojPath
            )

            // Store references
            engineLock.withLock {
                currentEngine = engine
                loadedModelId = modelId
            }

            // Register with inference router (using InferenceEngine protocol)
            InferenceRouter.shared.registerEngine(engine as any InferenceEngine)

            updateState(modelId, to: .loaded)
            let multimodalStatus = mmprojPath != nil ? " (multimodal enabled)" : ""
            logger.info("Model loaded: \(modelId)\(multimodalStatus)")

        } catch {
            updateState(modelId, to: .error(error.localizedDescription))
            throw LocanaraError.modelLoadFailed(error.localizedDescription)
        }
    }

    /// Unload model from memory
    ///
    /// - Parameter modelId: Model identifier to unload
    public func unloadModel(_ modelId: String) {
        let isLoaded = engineLock.withLock { loadedModelId == modelId }
        guard isLoaded else {
            logger.debug("Model not loaded, nothing to unload: \(modelId)")
            return
        }

        updateState(modelId, to: .unloading)

        // Use bridge for unloading if available, otherwise direct unregister
        if let bridge = LlamaCppBridge.findBridge(), bridge.isModelLoaded {
            bridge.unloadModel()
        } else {
            InferenceRouter.shared.unregisterEngine()
        }

        // Release engine
        engineLock.withLock {
            currentEngine = nil
            loadedModelId = nil
        }

        updateState(modelId, to: .downloaded)
        logger.info("Model unloaded: \(modelId)")
    }

    /// Get currently loaded model
    ///
    /// - Returns: Model ID if a model is loaded
    public func getLoadedModel() -> String? {
        return engineLock.withLock { loadedModelId }
    }

    /// Get the current engine
    ///
    /// - Returns: Engine instance if model is loaded
    public func getEngine() -> LlamaCppEngineProtocol? {
        return engineLock.withLock { currentEngine }
    }

    // MARK: - Delete Operations

    /// Delete a downloaded model
    ///
    /// - Parameter modelId: Model identifier to delete
    /// - Throws: Error if deletion fails
    public func deleteModel(_ modelId: String) throws {
        // Unload if loaded
        if engineLock.withLock({ loadedModelId == modelId }) {
            unloadModel(modelId)
        }

        // Delete from storage
        try storage.deleteModel(modelId)
        updateState(modelId, to: .notDownloaded)

        logger.info("Model deleted: \(modelId)")
    }

    /// Delete all downloaded models
    ///
    /// - Throws: Error if deletion fails
    public func deleteAllModels() throws {
        // Unload current model
        if let currentId = engineLock.withLock({ loadedModelId }) {
            unloadModel(currentId)
        }

        // Delete all from storage
        try storage.deleteAllModels()

        // Reset all states
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            for modelId in self.modelStates.keys {
                self.modelStates[modelId] = .notDownloaded
            }
        }

        logger.info("All models deleted")
    }

    // MARK: - Storage Info

    /// Get total storage used by models
    ///
    /// - Returns: Storage used in bytes
    public func getTotalStorageUsed() -> Int64 {
        return storage.getTotalStorageUsed()
    }

    /// Get available storage space
    ///
    /// - Returns: Available space in bytes
    public func getAvailableStorage() -> Int64 {
        return storage.getAvailableStorage()
    }

    // MARK: - Auto Model Selection

    /// Automatically select and prepare the best model for device
    ///
    /// - Parameter memoryMB: Available memory in MB
    /// - Returns: AsyncStream of download progress (if download needed)
    public func autoSelectAndPrepare(forMemoryMB memoryMB: Int) async throws -> AsyncStream<ModelDownloadProgress>? {
        // Get recommended model
        guard let recommendedModel = registry.getRecommendedModel(forMemoryMB: memoryMB) else {
            throw LocanaraError.deviceNotSupported
        }

        let modelId = recommendedModel.modelId

        // Check if already downloaded and loaded
        if isModelLoaded(modelId) {
            logger.info("Recommended model already loaded: \(modelId)")
            return nil
        }

        // Check if downloaded but not loaded
        if isModelDownloaded(modelId) {
            logger.info("Loading recommended model: \(modelId)")
            try await loadModel(modelId)
            return nil
        }

        // Need to download
        logger.info("Downloading recommended model: \(modelId)")
        return try await downloadModel(modelId)
    }
}
