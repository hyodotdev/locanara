import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "ModelManager")

/// Result of preparing a local-model backend. The external bridge registers
/// itself while the built-in engine is registered by `ModelManager` only after
/// the lifecycle token and verified files pass their final checks.
enum ModelLoadBackend: Sendable {
    case bridge
    case engine(any InferenceEngine & LlamaCppEngineProtocol)
}

typealias ModelEngineLoader = @Sendable (URL, URL?) async throws -> ModelLoadBackend

/// Central manager for model lifecycle operations
///
/// Coordinates:
/// - Model discovery and recommendation
/// - Download orchestration
/// - Model loading/unloading
/// - Storage management
@available(iOS 15.0, macOS 14.0, *)
public final class ModelManager: @unchecked Sendable {

    static let defaultEngineLoader: ModelEngineLoader = { modelPath, mmprojPath in
        try await ModelManager.loadDefaultBackend(
            modelPath: modelPath,
            mmprojPath: mmprojPath
        )
    }

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
    private let registry: ModelRegistry
    private let storage: ModelStorage
    private let downloader: ModelDownloader

    /// Currently loaded model ID
    private var loadedModelId: String?

    /// Engine reference (set after loading)
    private var currentEngine: LlamaCppEngineProtocol?

    /// Serial queue for state management
    private let stateQueue = DispatchQueue(label: "com.locanara.modelmanager.state")

    /// Callbacks run outside `stateQueue` so listeners can safely query state.
    private let callbackQueue = DispatchQueue(label: "com.locanara.modelmanager.callbacks")

    /// Generation tokens prevent a cancelled/deleted verification task from
    /// publishing a stale downloaded state afterward.
    private var activeOperations: [String: UUID] = [:]

    /// Cancelled operations remain active until their processing task reaches a
    /// safe quiescent point, preventing a replacement download from reusing the
    /// same paths while an older checksum task is still running.
    private var cancelledOperations: Set<UUID> = []

    /// Only one asynchronous engine construction may exist at a time because
    /// `InferenceRouter` owns a single active local engine.
    private var activeLoadOperation: (modelId: String, token: UUID)?

    /// Internal barrier used by deterministic lifecycle race tests. Production
    /// instances use the default no-op closure.
    private let beforeSuccessfulCompletion: @Sendable () -> Void

    /// Injectable loader makes load/delete races deterministic in tests.
    private let engineLoader: ModelEngineLoader

    /// Lock for loadedModelId and currentEngine access
    private let engineLock = NSLock()

    // MARK: - Initialization

    private convenience init() {
        self.init(
            registry: .shared,
            storage: .shared,
            downloader: .shared
        )
    }

    /// Internal dependency injection for deterministic lifecycle tests.
    init(
        registry: ModelRegistry,
        storage: ModelStorage,
        downloader: ModelDownloader,
        beforeSuccessfulCompletion: @Sendable @escaping () -> Void = {},
        engineLoader: @escaping ModelEngineLoader = ModelManager.defaultEngineLoader
    ) {
        self.registry = registry
        self.storage = storage
        self.downloader = downloader
        self.beforeSuccessfulCompletion = beforeSuccessfulCompletion
        self.engineLoader = engineLoader

        // Initialize states for all registered models
        for model in registry.models {
            let isDownloaded = storage.isModelPackageDownloaded(model)
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
        stateQueue.sync {
            stateChangeCallbacks.append(callback)
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

            let callbacks = self.stateChangeCallbacks
            self.callbackQueue.async {
                for callback in callbacks {
                    callback(change)
                }
            }

            logger.debug("Model \(modelId) state: \(String(describing: previousState)) -> \(String(describing: newState))")
        }
    }

    private func beginOperation(_ modelId: String) -> UUID? {
        stateQueue.sync {
            guard activeOperations[modelId] == nil else { return nil }
            let token = UUID()
            activeOperations[modelId] = token
            return token
        }
    }

    private func beginLoadOperation(_ modelId: String) -> UUID? {
        stateQueue.sync {
            guard activeLoadOperation == nil,
                  activeOperations[modelId] == nil else {
                return nil
            }
            let token = UUID()
            activeOperations[modelId] = token
            activeLoadOperation = (modelId, token)
            return token
        }
    }

    private func isCurrentOperation(_ modelId: String, token: UUID) -> Bool {
        stateQueue.sync { activeOperations[modelId] == token }
    }

    @discardableResult
    private func finishOperation(_ modelId: String, token: UUID) -> Bool {
        stateQueue.sync {
            let wasCancelled = cancelledOperations.contains(token)
            if activeOperations[modelId] == token {
                _ = activeOperations.removeValue(forKey: modelId)
            }
            if activeLoadOperation?.modelId == modelId,
               activeLoadOperation?.token == token {
                activeLoadOperation = nil
            }
            _ = cancelledOperations.remove(token)
            return wasCancelled
        }
    }

    @discardableResult
    private func markOperationCancelled(_ modelId: String) -> Bool {
        stateQueue.sync {
            if let token = activeOperations[modelId] {
                _ = cancelledOperations.insert(token)
                return true
            }
            return false
        }
    }

    private func isOperationCancelled(_ modelId: String, token: UUID) -> Bool {
        stateQueue.sync {
            activeOperations[modelId] == token && cancelledOperations.contains(token)
        }
    }

    /// Atomically publish successful state and the terminal stream event only
    /// if cancellation/deletion did not win after the final manifest write.
    /// Keeping both actions inside the same state-queue critical section means
    /// delete can never return before an older task publishes success.
    private func publishSuccessfulCompletion(
        _ modelInfo: DownloadableModelInfo,
        token: UUID,
        progress: ModelDownloadProgress,
        continuation: AsyncStream<ModelDownloadProgress>.Continuation
    ) -> Bool {
        let modelId = modelInfo.modelId
        beforeSuccessfulCompletion()

        let publication: (ModelStateChange, [@Sendable (ModelStateChange) -> Void])? = stateQueue.sync {
            guard activeOperations[modelId] == token,
                  !cancelledOperations.contains(token) else {
                return nil
            }
            do {
                try storage.savePackageCommit(modelInfo)
            } catch {
                logger.error("Failed to commit verified model package: \(error.localizedDescription)")
                return nil
            }
            _ = activeOperations.removeValue(forKey: modelId)
            let previousState = modelStates[modelId] ?? .notDownloaded
            modelStates[modelId] = .downloaded
            let change = ModelStateChange(
                modelId: modelId,
                previousState: previousState,
                currentState: .downloaded,
                timestamp: Date()
            )

            continuation.yield(ModelDownloadProgress(
                modelId: modelId,
                bytesDownloaded: progress.totalBytes,
                totalBytes: progress.totalBytes,
                state: .completed
            ))
            return (change, stateChangeCallbacks)
        }

        guard let (change, callbacks) = publication else { return false }
        callbackQueue.async {
            for callback in callbacks {
                callback(change)
            }
        }
        logger.debug("Model \(modelId) state published as downloaded")
        return true
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
        return registry.models.compactMap { model in
            storage.isModelPackageDownloaded(model) ? model.modelId : nil
        }
    }

    /// Check if model is downloaded
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if model is downloaded
    public func isModelDownloaded(_ modelId: String) -> Bool {
        guard let modelInfo = registry.getModel(modelId) else { return false }
        return storage.isModelPackageDownloaded(modelInfo)
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

        guard let assets = modelInfo.packageAssets,
              assets.allSatisfy({ ModelStorage.isValidSHA256Checksum($0.checksum) }) else {
            throw LocanaraError.modelDownloadFailed("Model package metadata is incomplete or invalid")
        }

        // Check if already downloaded
        if storage.isModelPackageDownloaded(modelInfo) {
            logger.info("Model already downloaded: \(modelId)")
            return AsyncStream { continuation in
                let totalBytes = Int64(modelInfo.totalDownloadSizeMB) * 1024 * 1024
                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: totalBytes,
                    totalBytes: totalBytes,
                    state: .completed
                ))
                continuation.finish()
            }
        }

        // Check storage space
        guard storage.hasEnoughSpace(forSizeMB: modelInfo.totalDownloadSizeMB) else {
            throw LocanaraError.custom(
                .insufficientMemory,
                "Not enough storage space. Required: \(modelInfo.totalDownloadSizeMB)MB"
            )
        }

        guard let operationToken = beginOperation(modelId) else {
            throw LocanaraError.modelDownloadFailed("A model operation is already in progress for \(modelId)")
        }

        // Update state
        updateState(modelId, to: .downloading(progress: 0))

        // Start download
        logger.info("Starting download for model: \(modelId)")
        let progressStream = downloader.downloadModel(modelInfo)

        // Return a transformed stream that updates state
        return AsyncStream { continuation in
            let processingTask = Task { [weak self, progressStream] in
                guard let self else {
                    continuation.finish()
                    return
                }

                for await progress in progressStream {
                    guard self.isCurrentOperation(modelId, token: operationToken) else {
                        break
                    }

                    if self.isOperationCancelled(modelId, token: operationToken) {
                        self.cleanupPackage(modelInfo)
                        self.finishOperation(modelId, token: operationToken)
                        self.updateState(modelId, to: .notDownloaded)
                        continuation.yield(ModelDownloadProgress(
                            modelId: modelId,
                            bytesDownloaded: progress.bytesDownloaded,
                            totalBytes: progress.totalBytes,
                            state: .cancelled
                        ))
                        continuation.finish()
                        return
                    }

                    // Update state based on progress
                    switch progress.state {
                    case .downloading:
                        self.updateState(modelId, to: .downloading(progress: progress.progress))
                    case .verifying:
                        self.updateState(modelId, to: .verifying)
                    case .completed:
                        // The downloader emits package completion only after all
                        // files have transferred. Verify every asset before
                        // publishing the one terminal success event.
                        self.updateState(modelId, to: .verifying)
                        continuation.yield(ModelDownloadProgress(
                            modelId: modelId,
                            bytesDownloaded: progress.bytesDownloaded,
                            totalBytes: progress.totalBytes,
                            state: .verifying
                        ))

                        let isValid = await self.verifyDownload(modelInfo, token: operationToken)
                        guard self.isCurrentOperation(modelId, token: operationToken) else {
                            self.cleanupPackage(modelInfo)
                            self.updateState(modelId, to: .notDownloaded)
                            continuation.finish()
                            return
                        }

                        if self.isOperationCancelled(modelId, token: operationToken) {
                            self.cleanupPackage(modelInfo)
                            self.finishOperation(modelId, token: operationToken)
                            self.updateState(modelId, to: .notDownloaded)
                            continuation.yield(ModelDownloadProgress(
                                modelId: modelId,
                                bytesDownloaded: progress.bytesDownloaded,
                                totalBytes: progress.totalBytes,
                                state: .cancelled
                            ))
                            continuation.finish()
                            return
                        }

                        if isValid {
                            if !self.publishSuccessfulCompletion(
                                modelInfo,
                                token: operationToken,
                                progress: progress,
                                continuation: continuation
                            ) {
                                self.cleanupPackage(modelInfo)
                                let wasCancelled = self.isOperationCancelled(
                                    modelId,
                                    token: operationToken
                                )
                                self.finishOperation(modelId, token: operationToken)
                                self.updateState(
                                    modelId,
                                    to: wasCancelled ? .notDownloaded : .error("Operation superseded")
                                )
                                continuation.yield(ModelDownloadProgress(
                                    modelId: modelId,
                                    bytesDownloaded: progress.bytesDownloaded,
                                    totalBytes: progress.totalBytes,
                                    state: wasCancelled ? .cancelled : .failed
                                ))
                            }
                        } else {
                            let wasCancelled = self.finishOperation(
                                modelId,
                                token: operationToken
                            )
                            self.updateState(
                                modelId,
                                to: wasCancelled
                                    ? .notDownloaded
                                    : .error("Package verification failed")
                            )
                            continuation.yield(ModelDownloadProgress(
                                modelId: modelId,
                                bytesDownloaded: progress.bytesDownloaded,
                                totalBytes: progress.totalBytes,
                                state: wasCancelled ? .cancelled : .failed
                            ))
                        }
                        continue
                    case .failed:
                        self.cleanupPackage(modelInfo)
                        let wasCancelled = self.finishOperation(modelId, token: operationToken)
                        self.updateState(
                            modelId,
                            to: wasCancelled ? .notDownloaded : .error("Download failed")
                        )
                        continuation.yield(ModelDownloadProgress(
                            modelId: modelId,
                            bytesDownloaded: progress.bytesDownloaded,
                            totalBytes: progress.totalBytes,
                            state: wasCancelled ? .cancelled : .failed
                        ))
                        continue
                    case .cancelled:
                        self.cleanupPackage(modelInfo)
                        self.finishOperation(modelId, token: operationToken)
                        self.updateState(modelId, to: .notDownloaded)
                        continuation.yield(ModelDownloadProgress(
                            modelId: modelId,
                            bytesDownloaded: progress.bytesDownloaded,
                            totalBytes: progress.totalBytes,
                            state: .cancelled
                        ))
                        continue
                    default:
                        break
                    }

                    continuation.yield(progress)
                }

                if self.isCurrentOperation(modelId, token: operationToken) {
                    self.cleanupPackage(modelInfo)
                    let wasCancelled = self.isOperationCancelled(modelId, token: operationToken)
                    self.finishOperation(modelId, token: operationToken)
                    self.updateState(
                        modelId,
                        to: wasCancelled
                            ? .notDownloaded
                            : .error("Download ended without a terminal result")
                    )
                }
                continuation.finish()
            }

            continuation.onTermination = { [weak self] termination in
                if case .cancelled = termination,
                   self?.isCurrentOperation(modelId, token: operationToken) == true {
                    processingTask.cancel()
                    self?.cancelDownload(modelId)
                }
            }
        }
    }

    /// Cancel model download
    ///
    /// - Parameter modelId: Model identifier
    public func cancelDownload(_ modelId: String) {
        guard markOperationCancelled(modelId) else {
            logger.debug("No active model download to cancel: \(modelId)")
            return
        }
        downloader.cancelDownload(modelId)
        if let modelInfo = registry.getModel(modelId) {
            cleanupPackage(modelInfo)
        }
        updateState(modelId, to: .notDownloaded)
    }

    /// Verify downloaded model
    private func verifyDownload(_ modelInfo: DownloadableModelInfo, token: UUID) async -> Bool {
        guard let assets = modelInfo.packageAssets else { return false }
        var verifiedMetadata: [String: ModelStorage.ModelFileMetadata] = [:]

        for asset in assets {
            guard isCurrentOperation(modelInfo.modelId, token: token),
                  !isOperationCancelled(modelInfo.modelId, token: token) else {
                return false
            }
            guard let metadata = await storage.verifyChecksumAndMetadata(
                asset.modelId,
                expectedChecksum: asset.checksum
            ) else {
                cleanupPackage(modelInfo)
                logger.error("Model package verification failed: \(asset.modelId)")
                return false
            }
            verifiedMetadata[asset.modelId] = metadata
            guard isCurrentOperation(modelInfo.modelId, token: token),
                  !isOperationCancelled(modelInfo.modelId, token: token) else {
                return false
            }
        }

        do {
            for asset in assets {
                guard let metadata = verifiedMetadata[asset.modelId],
                      storage.getModelFileMetadata(asset.modelId) == metadata else {
                    throw LocanaraError.modelDownloadFailed("Missing verified asset: \(asset.modelId)")
                }
                let manifest = ModelStorage.ModelManifest(
                    modelId: asset.modelId,
                    version: modelInfo.version,
                    downloadedAt: Date(),
                    fileSize: metadata.fileSize,
                    checksum: asset.checksum,
                    checksumVerified: true,
                    fileModificationTime: metadata.modificationTime
                )
                let persisted = try stateQueue.sync {
                    guard activeOperations[modelInfo.modelId] == token,
                          !cancelledOperations.contains(token) else {
                        return false
                    }
                    try storage.saveManifest(manifest, for: asset.modelId)
                    return true
                }
                guard persisted else { return false }
            }
            logger.info("Model package verified and manifests saved: \(modelInfo.modelId)")
            return true
        } catch {
            cleanupPackage(modelInfo)
            logger.error("Failed to persist verified model package: \(error.localizedDescription)")
            return false
        }
    }

    private func cleanupPackage(_ modelInfo: DownloadableModelInfo) {
        guard let assets = modelInfo.packageAssets else {
            try? storage.deleteModel(modelInfo.modelId)
            try? storage.deleteModel("\(modelInfo.modelId)-mmproj")
            return
        }

        for asset in assets {
            try? storage.deleteModel(asset.modelId)
        }
    }

    static func loadDefaultBackend(modelPath: URL, mmprojPath: URL?) async throws -> ModelLoadBackend {
        // External bridges isolate C++ interop for wrapper builds and perform
        // their own router registration.
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
            return .bridge
        }

        guard #available(iOS 17.0, *) else {
            throw LocanaraError.modelLoadFailed("LlamaCppEngine requires iOS 17.0+")
        }
        let engine = try await LlamaCppEngine.create(
            modelPath: modelPath,
            mmprojPath: mmprojPath
        )
        return .engine(engine)
    }

    private func discardPreparedBackend(_ backend: ModelLoadBackend) {
        switch backend {
        case .bridge:
            if let bridge = LlamaCppBridge.findBridge(), bridge.isModelLoaded {
                bridge.unloadModel()
            }
        case let .engine(engine):
            engine.unload()
        }
    }

    /// Commit a prepared engine only while the load token and every verified
    /// file snapshot are still current. Delete/unload synchronizes on the same
    /// queue, so registration cannot happen after either operation returns.
    private func publishLoadedBackend(
        _ backend: ModelLoadBackend,
        modelInfo: DownloadableModelInfo,
        token: UUID,
        verifiedMetadata: [String: ModelStorage.ModelFileMetadata]
    ) -> Bool {
        let publication: (ModelStateChange, [@Sendable (ModelStateChange) -> Void])? = stateQueue.sync {
            guard activeOperations[modelInfo.modelId] == token,
                  activeLoadOperation?.modelId == modelInfo.modelId,
                  activeLoadOperation?.token == token,
                  !cancelledOperations.contains(token),
                  let assets = modelInfo.packageAssets,
                  assets.allSatisfy({ asset in
                      guard let verified = verifiedMetadata[asset.modelId] else { return false }
                      return storage.getModelFileMetadata(asset.modelId) == verified
                  }),
                  storage.isModelPackageDownloaded(modelInfo) else {
                return nil
            }

            switch backend {
            case .bridge:
                engineLock.withLock {
                    currentEngine = nil
                    loadedModelId = modelInfo.modelId
                }
            case let .engine(engine):
                InferenceRouter.shared.registerEngine(engine as any InferenceEngine)
                engineLock.withLock {
                    currentEngine = engine
                    loadedModelId = modelInfo.modelId
                }
            }

            _ = activeOperations.removeValue(forKey: modelInfo.modelId)
            activeLoadOperation = nil
            _ = cancelledOperations.remove(token)

            let previousState = modelStates[modelInfo.modelId] ?? .downloaded
            modelStates[modelInfo.modelId] = .loaded
            let change = ModelStateChange(
                modelId: modelInfo.modelId,
                previousState: previousState,
                currentState: .loaded,
                timestamp: Date()
            )
            return (change, stateChangeCallbacks)
        }

        guard let (change, callbacks) = publication else { return false }
        callbackQueue.async {
            for callback in callbacks {
                callback(change)
            }
        }
        return true
    }

    // MARK: - Load/Unload Operations

    /// Load model into memory
    ///
    /// - Parameter modelId: Model identifier to load
    /// - Throws: LocanaraError if load fails
    public func loadModel(_ modelId: String) async throws {
        guard let modelInfo = registry.getModel(modelId) else {
            throw LocanaraError.invalidInput("Unknown model: \(modelId)")
        }

        // Check if already loaded
        let (alreadyLoaded, currentId) = engineLock.withLock {
            (loadedModelId == modelId, loadedModelId)
        }
        if alreadyLoaded {
            logger.debug("Model already loaded: \(modelId)")
            return
        }

        guard let operationToken = beginLoadOperation(modelId) else {
            throw LocanaraError.modelLoadFailed("Another model operation is already in progress")
        }

        // Check if downloaded
        guard storage.isModelPackageDownloaded(modelInfo) else {
            finishOperation(modelId, token: operationToken)
            throw LocanaraError.modelNotDownloaded(modelId)
        }

        // A manifest is a fast readiness index, not a substitute for checking
        // the bytes that will enter the native engine. Rehash every package
        // asset immediately before load so same-size local corruption cannot
        // survive a process restart and reach llama.cpp.
        guard let assets = modelInfo.packageAssets else {
            finishOperation(modelId, token: operationToken)
            throw LocanaraError.modelLoadFailed("Model package metadata is incomplete")
        }
        var verifiedMetadata: [String: ModelStorage.ModelFileMetadata] = [:]
        for asset in assets {
            guard let metadata = await storage.verifyChecksumAndMetadata(
                asset.modelId,
                expectedChecksum: asset.checksum
            ) else {
                cleanupPackage(modelInfo)
                finishOperation(modelId, token: operationToken)
                updateState(modelId, to: .notDownloaded)
                throw LocanaraError.modelNotDownloaded(modelId)
            }
            verifiedMetadata[asset.modelId] = metadata

            guard !Task.isCancelled,
                  isCurrentOperation(modelId, token: operationToken),
                  !isOperationCancelled(modelId, token: operationToken) else {
                if Task.isCancelled {
                    markOperationCancelled(modelId)
                }
                finishOperation(modelId, token: operationToken)
                updateState(
                    modelId,
                    to: storage.isModelPackageDownloaded(modelInfo)
                        ? .downloaded
                        : .notDownloaded
                )
                throw LocanaraError.modelLoadFailed("Model load was cancelled")
            }
        }

        // Unload current model if any
        if let currentId = currentId {
            unloadModel(currentId)
        }

        // Update state
        updateState(modelId, to: .loading)

        var preparedBackend: ModelLoadBackend?
        do {
            // Create engine instance with optional mmproj for multimodal support
            let modelPath = storage.getModelPath(modelId)

            // Check if mmproj exists for this model (multimodal support)
            let mmprojId = "\(modelId)-mmproj"
            let mmprojPath: URL?
            if modelInfo.isMultimodal {
                mmprojPath = storage.getModelPath(mmprojId)
                logger.info("Multimodal projector found: \(mmprojId)")
            } else {
                mmprojPath = nil
                logger.debug("No multimodal projector found for: \(modelId)")
            }

            let backend = try await engineLoader(modelPath, mmprojPath)
            preparedBackend = backend
            if Task.isCancelled {
                markOperationCancelled(modelId)
                discardPreparedBackend(backend)
                preparedBackend = nil
                throw CancellationError()
            }
            guard publishLoadedBackend(
                backend,
                modelInfo: modelInfo,
                token: operationToken,
                verifiedMetadata: verifiedMetadata
            ) else {
                discardPreparedBackend(backend)
                preparedBackend = nil
                throw LocanaraError.modelLoadFailed("Model load was cancelled or superseded")
            }
            preparedBackend = nil
            let multimodalStatus = mmprojPath != nil ? " (multimodal enabled)" : ""
            logger.info("Model loaded: \(modelId)\(multimodalStatus)")

        } catch {
            if let preparedBackend {
                discardPreparedBackend(preparedBackend)
            }
            let wasCancelled = finishOperation(modelId, token: operationToken)
            if wasCancelled {
                updateState(
                    modelId,
                    to: storage.isModelPackageDownloaded(modelInfo)
                        ? .downloaded
                        : .notDownloaded
                )
            } else if !isModelLoaded(modelId) {
                updateState(modelId, to: .error(error.localizedDescription))
            }
            throw LocanaraError.modelLoadFailed(error.localizedDescription)
        }
    }

    /// Unload model from memory
    ///
    /// - Parameter modelId: Model identifier to unload
    public func unloadModel(_ modelId: String) {
        let result: ([ModelStateChange], [@Sendable (ModelStateChange) -> Void])? = stateQueue.sync {
            if activeLoadOperation?.modelId == modelId,
               let token = activeLoadOperation?.token {
                _ = cancelledOperations.insert(token)
            }

            guard engineLock.withLock({ loadedModelId == modelId }) else {
                return nil
            }

            let previousState = modelStates[modelId] ?? .loaded
            modelStates[modelId] = .unloading
            let unloadingChange = ModelStateChange(
                modelId: modelId,
                previousState: previousState,
                currentState: .unloading,
                timestamp: Date()
            )

            let engine = engineLock.withLock { () -> LlamaCppEngineProtocol? in
                let engine = currentEngine
                currentEngine = nil
                loadedModelId = nil
                return engine
            }

            // Use bridge for unloading if available, otherwise direct unregister.
            if let bridge = LlamaCppBridge.findBridge(), bridge.isModelLoaded {
                bridge.unloadModel()
            } else {
                (engine as? any InferenceEngine)?.unload()
                InferenceRouter.shared.unregisterEngine()
            }

            let finalState: ModelLifecycleState = registry.getModel(modelId).map {
                storage.isModelPackageDownloaded($0) ? .downloaded : .notDownloaded
            } ?? .notDownloaded
            modelStates[modelId] = finalState
            let unloadedChange = ModelStateChange(
                modelId: modelId,
                previousState: .unloading,
                currentState: finalState,
                timestamp: Date()
            )
            return ([unloadingChange, unloadedChange], stateChangeCallbacks)
        }

        guard let (changes, callbacks) = result else {
            logger.debug("Model not loaded, nothing to unload: \(modelId)")
            return
        }
        callbackQueue.async {
            for change in changes {
                for callback in callbacks {
                    callback(change)
                }
            }
        }
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
        guard let modelInfo = registry.getModel(modelId) else {
            throw LocanaraError.invalidInput("Unknown model: \(modelId)")
        }

        // Cancel an in-flight download/load before checking loaded state. Both
        // final publication paths synchronize on `stateQueue`, so either the
        // operation wins first and is unloaded below, or deletion wins and the
        // older task can no longer publish.
        markOperationCancelled(modelId)
        downloader.cancelDownload(modelId)
        unloadModel(modelId)

        // Delete the complete package, including its vision projector.
        guard let assets = modelInfo.packageAssets else {
            throw LocanaraError.modelDownloadFailed("Model package metadata is incomplete")
        }
        for asset in assets {
            try storage.deleteModel(asset.modelId)
        }
        updateState(modelId, to: .notDownloaded)

        logger.info("Model deleted: \(modelId)")
    }

    /// Delete all downloaded models
    ///
    /// - Throws: Error if deletion fails
    public func deleteAllModels() throws {
        for model in registry.models {
            markOperationCancelled(model.modelId)
        }
        downloader.cancelAllDownloads()

        // Unload after cancellation is recorded. If a load committed first,
        // its loaded ID is visible here; otherwise its token prevents commit.
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
