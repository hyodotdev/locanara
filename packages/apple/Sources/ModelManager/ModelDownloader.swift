import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "ModelDownloader")

/// Handles model file downloads with progress tracking
///
/// Features:
/// - Progress reporting via AsyncStream
/// - Package-level cancellation and single-flight ownership
@available(iOS 15.0, macOS 14.0, *)
public final class ModelDownloader: NSObject, @unchecked Sendable {

    // MARK: - Types

    /// Download task state
    public enum DownloadState: Sendable {
        case idle
        case downloading(progress: Double)
        case paused
        case completed(URL)
        case failed(String)
        case cancelled
    }

    /// Download task information
    public struct DownloadTask: Sendable {
        public let modelId: String
        public let packageModelId: String
        public let url: URL
        public let destinationURL: URL
        public let bytesOffset: Int64
        public let packageTotalBytes: Int64
        public var state: DownloadState
        public var bytesDownloaded: Int64
        public var totalBytes: Int64

        public var progress: Double {
            guard totalBytes > 0 else { return 0 }
            return Double(bytesDownloaded) / Double(totalBytes)
        }
    }

    // MARK: - Properties

    /// Active download tasks
    private var activeTasks: [String: URLSessionDownloadTask] = [:]

    /// Download task info
    private var taskInfo: [String: DownloadTask] = [:]

    /// Progress continuations for streaming updates
    private var progressContinuations: [String: AsyncStream<ModelDownloadProgress>.Continuation] = [:]

    /// Per-file download results (true = success, false = failure)
    private var downloadResults: [String: Bool] = [:]

    /// Package-level ownership prevents duplicate callers from fabricating a
    /// second successful lifecycle around the same URLSession task.
    private var activePackages: Set<String> = []

    /// Cancellation is remembered across the gap between package assets.
    private var cancelledPackages: Set<String> = []

    /// Aggregate package progress remains valid while moving between assets.
    private var packageProgress: [String: (downloaded: Int64, total: Int64)] = [:]

    /// Internal deterministic barrier for cancellation-between-assets tests.
    private let betweenAssets: @Sendable () -> Void

    /// URLSession for downloads
    private lazy var urlSession: URLSession = {
        let config = foregroundConfiguration
        config.allowsCellularAccess = true
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true

        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    /// Serial queue for thread safety
    private let queue = DispatchQueue(label: "com.locanara.downloader")

    /// Model storage reference
    private let storage: ModelStorage

    /// Injectable foreground configuration keeps transfer lifecycle tests local
    /// and deterministic without changing the production singleton.
    private let foregroundConfiguration: URLSessionConfiguration

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelDownloader()

    private override init() {
        self.storage = .shared
        self.foregroundConfiguration = .default
        self.betweenAssets = {}
        super.init()
    }

    init(
        storage: ModelStorage,
        foregroundConfiguration: URLSessionConfiguration,
        betweenAssets: @Sendable @escaping () -> Void = {}
    ) {
        self.storage = storage
        self.foregroundConfiguration = foregroundConfiguration
        self.betweenAssets = betweenAssets
        super.init()
    }

    // MARK: - Public Methods

    /// Download a model file (and mmproj if multimodal)
    ///
    /// - Parameters:
    ///   - modelInfo: Model information including download URL
    ///   - useBackground: Reserved. Verified background package restoration is
    ///     not currently supported and returns a failed stream.
    /// - Returns: AsyncStream of download progress updates
    public func downloadModel(
        _ modelInfo: DownloadableModelInfo,
        useBackground: Bool = false
    ) -> AsyncStream<ModelDownloadProgress> {
        let modelId = modelInfo.modelId

        return AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            guard !useBackground else {
                logger.warning("Verified background package downloads are not supported")
                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: Int64(modelInfo.totalDownloadSizeMB) * 1024 * 1024,
                    state: .failed
                ))
                continuation.finish()
                return
            }

            guard let assets = modelInfo.packageAssets else {
                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: 0,
                    state: .failed
                ))
                continuation.finish()
                return
            }

            // Acquire ownership before returning the stream. This closes the
            // create-then-immediately-cancel race and prevents a duplicate
            // stream's termination handler from cancelling the true owner.
            let totalBytes = Int64(modelInfo.totalDownloadSizeMB) * 1024 * 1024
            let ownsPackage = self.queue.sync {
                let inserted = self.activePackages.insert(modelId).inserted
                if inserted {
                    self.cancelledPackages.remove(modelId)
                    self.packageProgress[modelId] = (0, totalBytes)
                }
                return inserted
            }
            guard ownsPackage else {
                logger.warning("Download already in progress for package: \(modelId)")
                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: Int64(modelInfo.totalDownloadSizeMB) * 1024 * 1024,
                    state: .failed
                ))
                continuation.finish()
                return
            }

            continuation.onTermination = { [weak self] termination in
                if case .cancelled = termination {
                    self?.cancelDownload(modelId)
                }
            }

            Task { [weak self] in
                guard let self else {
                    continuation.finish()
                    return
                }

                defer {
                    self.queue.sync {
                        self.activePackages.remove(modelId)
                        self.cancelledPackages.remove(modelId)
                        self.packageProgress.removeValue(forKey: modelId)
                    }
                }

                continuation.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: totalBytes,
                    state: .pending
                ))

                var completedBytes: Int64 = 0
                for (index, asset) in assets.enumerated() {
                    let isCancelled = self.queue.sync {
                        self.cancelledPackages.contains(modelId)
                    }
                    guard !isCancelled else { break }

                    let success = await self.downloadSingleFile(
                        id: asset.modelId,
                        packageModelId: modelId,
                        url: asset.url,
                        sizeMB: asset.sizeMB,
                        bytesOffset: completedBytes,
                        packageTotalBytes: totalBytes,
                        continuation: continuation
                    )
                    guard success else { break }

                    completedBytes += Int64(asset.sizeMB) * 1024 * 1024
                    self.queue.sync {
                        self.packageProgress[modelId] = (completedBytes, totalBytes)
                    }
                    if index < assets.count - 1 {
                        self.betweenAssets()
                    }
                }

                let isCancelled = self.queue.sync {
                    self.cancelledPackages.contains(modelId)
                }
                if completedBytes == totalBytes && !isCancelled {
                    continuation.yield(ModelDownloadProgress(
                        modelId: modelId,
                        bytesDownloaded: totalBytes,
                        totalBytes: totalBytes,
                        state: .completed
                    ))
                } else {
                    self.cleanupPartialPackage(assets)
                    let snapshot = self.queue.sync {
                        self.packageProgress[modelId] ?? (completedBytes, totalBytes)
                    }
                    continuation.yield(ModelDownloadProgress(
                        modelId: modelId,
                        bytesDownloaded: snapshot.downloaded,
                        totalBytes: snapshot.total,
                        state: isCancelled ? .cancelled : .failed
                    ))
                }

                continuation.finish()
            }
        }
    }

    /// Download a single file
    /// - Returns: true if download succeeded, false if it failed
    @discardableResult
    private func downloadSingleFile(
        id: String,
        packageModelId: String,
        url: URL,
        sizeMB: Int,
        bytesOffset: Int64,
        packageTotalBytes: Int64,
        continuation: AsyncStream<ModelDownloadProgress>.Continuation
    ) async -> Bool {
        await withCheckedContinuation { (fileContinuation: CheckedContinuation<Bool, Never>) in
            self.queue.async {
                if self.cancelledPackages.contains(packageModelId) {
                    fileContinuation.resume(returning: false)
                    return
                }

                // Check if already downloading
                if self.activeTasks[id] != nil {
                    logger.warning("Download already in progress for: \(id)")
                    fileContinuation.resume(returning: false)
                    return
                }

                self.downloadResults.removeValue(forKey: id)

                // Store continuation for progress updates
                self.progressContinuations[id] = continuation

                // Create download task
                let task = self.urlSession.downloadTask(with: url)
                task.taskDescription = "\(packageModelId)|\(id)"

                // Store task info
                let destinationURL = self.storage.getModelPath(id)
                self.taskInfo[id] = DownloadTask(
                    modelId: id,
                    packageModelId: packageModelId,
                    url: url,
                    destinationURL: destinationURL,
                    bytesOffset: bytesOffset,
                    packageTotalBytes: packageTotalBytes,
                    state: .downloading(progress: 0),
                    bytesDownloaded: 0,
                    totalBytes: Int64(sizeMB) * 1024 * 1024
                )

                self.activeTasks[id] = task

                logger.info("Starting download for: \(id)")
                task.resume()

                // Wait for download to complete
                self.waitForDownload(id: id) {
                    let success = self.queue.sync {
                        self.downloadResults.removeValue(forKey: id) ?? false
                    }
                    fileContinuation.resume(returning: success)
                }
            }
        }
    }

    /// Wait for a download to complete
    private func waitForDownload(id: String, completion: @Sendable @escaping () -> Void) {
        DispatchQueue.global().async { [weak self] in
            while true {
                var isActive = false
                self?.queue.sync {
                    isActive = self?.activeTasks[id] != nil
                }
                if !isActive {
                    completion()
                    return
                }
                Thread.sleep(forTimeInterval: 0.1)
            }
        }
    }

    private func cleanupPartialPackage(_ assets: [DownloadableModelAsset]) {
        for asset in assets {
            do {
                try storage.deleteModel(asset.modelId)
            } catch {
                logger.error("Failed to remove partial package asset \(asset.modelId): \(error.localizedDescription)")
            }
        }
    }

    /// Cancel a download in progress
    ///
    /// Also cancels the companion mmproj download for multimodal models.
    /// - Parameter modelId: Model identifier
    public func cancelDownload(_ modelId: String) {
        queue.sync {
            self.cancelledPackages.insert(modelId)

            // Cancel both the main model and its mmproj companion (if any)
            let idsToCancel = [modelId, "\(modelId)-mmproj"]
            for id in idsToCancel {
                guard let task = activeTasks[id] else { continue }
                downloadResults[id] = false
                task.cancel()
                activeTasks.removeValue(forKey: id)
                taskInfo.removeValue(forKey: id)
                progressContinuations.removeValue(forKey: id)

                logger.info("Cancelled download for: \(id)")
            }
        }
    }

    /// Pause a download in progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Resume data for later continuation
    public func pauseDownload(_ modelId: String) async -> Data? {
        logger.warning("Pause is unsupported for verified multi-asset packages: \(modelId)")
        return nil
    }

    /// Resume a paused download
    ///
    /// - Parameters:
    ///   - modelId: Model identifier
    ///   - resumeData: Data from pauseDownload
    /// - Returns: AsyncStream of download progress updates
    public func resumeDownload(
        _ modelId: String,
        resumeData: Data
    ) -> AsyncStream<ModelDownloadProgress> {
        AsyncStream { continuation in
            logger.warning("Resume is unsupported for verified multi-asset packages: \(modelId)")
            continuation.yield(ModelDownloadProgress(
                modelId: modelId,
                bytesDownloaded: 0,
                totalBytes: Int64(resumeData.count),
                state: .failed
            ))
            continuation.finish()
        }
    }

    /// Check if a download is in progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if download is active
    public func isDownloading(_ modelId: String) -> Bool {
        queue.sync {
            activePackages.contains(modelId) || activeTasks[modelId] != nil
        }
    }

    /// Check whether any asset in a model package is downloading.
    func isDownloadingPackage(_ modelId: String) -> Bool {
        queue.sync { activePackages.contains(modelId) }
    }

    /// Get current download progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Current progress (0.0 - 1.0)
    public func getProgress(_ modelId: String) -> Double {
        queue.sync {
            if let snapshot = packageProgress[modelId], snapshot.total > 0 {
                return min(1, Double(snapshot.downloaded) / Double(snapshot.total))
            }
            return taskInfo[modelId]?.progress ?? 0
        }
    }

    /// Cancel all active downloads
    public func cancelAllDownloads() {
        queue.sync {
            cancelledPackages.formUnion(activePackages)

            for (modelId, task) in activeTasks {
                downloadResults[modelId] = false
                task.cancel()
            }

            activeTasks.removeAll()
            taskInfo.removeAll()
            progressContinuations.removeAll()

            logger.info("Cancelled all downloads")
        }
    }
}

// MARK: - URLSessionDownloadDelegate

@available(iOS 15.0, macOS 14.0, *)
extension ModelDownloader: URLSessionDownloadDelegate {

    public func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        queue.sync {
            guard let modelId = activeTasks.first(where: { $0.value == downloadTask })?.key,
                  var info = taskInfo[modelId] else {
                logger.error("Unknown download task completed")
                return
            }

            var completionError: Error?
            if cancelledPackages.contains(info.packageModelId) {
                completionError = URLError(.cancelled)
            } else if let response = downloadTask.response as? HTTPURLResponse,
                      !(200...299).contains(response.statusCode) {
                completionError = NSError(
                    domain: NSURLErrorDomain,
                    code: response.statusCode,
                    userInfo: [NSLocalizedDescriptionKey: "Unexpected HTTP status \(response.statusCode)"]
                )
            } else {
                do {
                    // The URLSession-owned temporary file disappears when this
                    // callback returns, so the move must stay synchronous.
                    try storage.moveToFinalLocation(
                        from: location,
                        for: modelId,
                        packageModelId: info.packageModelId
                    )
                    info.state = .completed(storage.getModelPath(modelId))
                    taskInfo[modelId] = info
                    logger.info("Downloaded package asset: \(modelId)")
                } catch {
                    completionError = error
                }
            }

            if let error = completionError {
                downloadResults[modelId] = false
                logger.error("Download failed for \(modelId): \(error.localizedDescription)")
            } else {
                downloadResults[modelId] = true
            }

            activeTasks.removeValue(forKey: modelId)
            taskInfo.removeValue(forKey: modelId)
            progressContinuations.removeValue(forKey: modelId)
        }
    }

    public func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        // Find the model ID for this task
        var modelId: String?
        queue.sync {
            for (id, task) in activeTasks where task == downloadTask {
                modelId = id
                break
            }
        }

        guard let modelId = modelId else { return }

        queue.async { [weak self] in
            guard let self = self else { return }

            // Update task info
            if var info = self.taskInfo[modelId] {
                info.bytesDownloaded = totalBytesWritten
                info.totalBytes = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : info.totalBytes
                info.state = .downloading(progress: info.progress)
                self.taskInfo[modelId] = info
                let aggregateBytes = min(
                    info.packageTotalBytes,
                    info.bytesOffset + totalBytesWritten
                )
                let previousBytes = self.packageProgress[info.packageModelId]?.downloaded ?? 0
                self.packageProgress[info.packageModelId] = (
                    max(previousBytes, aggregateBytes),
                    info.packageTotalBytes
                )

                // Send progress update
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: info.packageModelId,
                    bytesDownloaded: aggregateBytes,
                    totalBytes: info.packageTotalBytes,
                    state: .downloading
                ))
            }
        }
    }

    public func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        guard let error = error else { return }

        // Find the model ID for this task
        var modelId: String?
        queue.sync {
            for (id, activeTask) in activeTasks where activeTask == task {
                modelId = id
                break
            }
        }

        guard let modelId = modelId else { return }

        queue.async { [weak self] in
            guard let self = self else { return }

            // Check if cancelled
            let nsError = error as NSError
            if nsError.code == NSURLErrorCancelled {
                self.downloadResults[modelId] = false
                logger.debug("Download cancelled for: \(modelId)")
            } else {
                self.downloadResults[modelId] = false
                logger.error("Download failed for \(modelId): \(error.localizedDescription)")
            }

            // Don't finish the stream here — let downloadModel() handle
            // stream termination after all files, same as the success path.
            self.activeTasks.removeValue(forKey: modelId)
            self.taskInfo.removeValue(forKey: modelId)
            self.progressContinuations.removeValue(forKey: modelId)
        }
    }
}
