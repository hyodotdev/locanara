import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "ModelDownloader")

/// Handles model file downloads with progress tracking
///
/// Features:
/// - Background download support
/// - Progress reporting via AsyncStream
/// - Resume capability
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
        public let url: URL
        public let destinationURL: URL
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

    /// URLSession for downloads
    private lazy var urlSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.allowsCellularAccess = true
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true

        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    /// Background URLSession for background downloads
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "com.locanara.download")
        config.allowsCellularAccess = true
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true

        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    /// Serial queue for thread safety
    private let queue = DispatchQueue(label: "com.locanara.downloader")

    /// Model storage reference
    private let storage = ModelStorage.shared

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelDownloader()

    private override init() {
        super.init()
    }

    // MARK: - Public Methods

    /// Download a model file (and mmproj if multimodal)
    ///
    /// - Parameters:
    ///   - modelInfo: Model information including download URL
    ///   - useBackground: Whether to use background download
    /// - Returns: AsyncStream of download progress updates
    public func downloadModel(
        _ modelInfo: DownloadableModelInfo,
        useBackground: Bool = false
    ) -> AsyncStream<ModelDownloadProgress> {
        let modelId = modelInfo.modelId
        let mmprojId = "\(modelId)-mmproj"
        let totalSizeMB = modelInfo.sizeMB + (modelInfo.mmprojSizeMB ?? 0)

        return AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            Task {
                // Download main model first
                let mainSuccess = await self.downloadSingleFile(
                    id: modelId,
                    url: modelInfo.downloadURL,
                    sizeMB: modelInfo.sizeMB,
                    totalSizeMB: totalSizeMB,
                    useBackground: useBackground,
                    continuation: continuation
                )

                // Download mmproj only if main model succeeded
                if mainSuccess,
                   let mmprojURL = modelInfo.mmprojURL,
                   let mmprojSizeMB = modelInfo.mmprojSizeMB {
                    await self.downloadSingleFile(
                        id: mmprojId,
                        url: mmprojURL,
                        sizeMB: mmprojSizeMB,
                        totalSizeMB: totalSizeMB,
                        useBackground: useBackground,
                        continuation: continuation
                    )
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
        url: URL,
        sizeMB: Int,
        totalSizeMB: Int,
        useBackground: Bool,
        continuation: AsyncStream<ModelDownloadProgress>.Continuation
    ) async -> Bool {
        await withCheckedContinuation { (fileContinuation: CheckedContinuation<Bool, Never>) in
            self.queue.async {
                // Check if already downloading
                if self.activeTasks[id] != nil {
                    logger.warning("Download already in progress for: \(id)")
                    fileContinuation.resume(returning: true)
                    return
                }

                // Store continuation for progress updates
                self.progressContinuations[id] = continuation

                // Create download task
                let session = useBackground ? self.backgroundSession : self.urlSession
                let task = session.downloadTask(with: url)

                // Store task info
                let destinationURL = self.storage.getModelPath(id)
                self.taskInfo[id] = DownloadTask(
                    modelId: id,
                    url: url,
                    destinationURL: destinationURL,
                    state: .downloading(progress: 0),
                    bytesDownloaded: 0,
                    totalBytes: Int64(sizeMB) * 1024 * 1024
                )

                self.activeTasks[id] = task

                // Send initial progress
                continuation.yield(ModelDownloadProgress(
                    modelId: id,
                    bytesDownloaded: 0,
                    totalBytes: Int64(totalSizeMB) * 1024 * 1024,
                    state: .pending
                ))

                logger.info("Starting download for: \(id)")
                task.resume()

                // Wait for download to complete
                self.waitForDownload(id: id) {
                    let success = self.queue.sync { self.downloadResults[id] ?? false }
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

    /// Cancel a download in progress
    ///
    /// Also cancels the companion mmproj download for multimodal models.
    /// - Parameter modelId: Model identifier
    public func cancelDownload(_ modelId: String) {
        queue.async { [weak self] in
            guard let self = self else { return }

            // Cancel both the main model and its mmproj companion (if any)
            let idsToCancel = [modelId, "\(modelId)-mmproj"]
            for id in idsToCancel {
                guard let task = self.activeTasks[id] else { continue }
                task.cancel()
                self.activeTasks.removeValue(forKey: id)
                self.taskInfo.removeValue(forKey: id)

                // Notify cancellation
                self.progressContinuations[id]?.yield(ModelDownloadProgress(
                    modelId: id,
                    bytesDownloaded: 0,
                    totalBytes: 0,
                    state: .cancelled
                ))
                self.progressContinuations[id]?.finish()
                self.progressContinuations.removeValue(forKey: id)

                logger.info("Cancelled download for: \(id)")
            }
        }
    }

    /// Pause a download in progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Resume data for later continuation
    public func pauseDownload(_ modelId: String) async -> Data? {
        return await withCheckedContinuation { continuation in
            queue.async { [weak self] in
                guard let self = self,
                      let task = self.activeTasks[modelId] else {
                    continuation.resume(returning: nil)
                    return
                }

                task.cancel { resumeData in
                    self.queue.async {
                        self.activeTasks.removeValue(forKey: modelId)
                        if var info = self.taskInfo[modelId] {
                            info.state = .paused
                            self.taskInfo[modelId] = info
                        }

                        logger.info("Paused download for: \(modelId)")
                        continuation.resume(returning: resumeData)
                    }
                }
            }
        }
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
        return AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            self.queue.async {
                // Store continuation
                self.progressContinuations[modelId] = continuation

                // Create resumed task
                let task = self.urlSession.downloadTask(withResumeData: resumeData)
                self.activeTasks[modelId] = task

                logger.info("Resuming download for: \(modelId)")
                task.resume()

                continuation.onTermination = { @Sendable _ in
                    self.cancelDownload(modelId)
                }
            }
        }
    }

    /// Check if a download is in progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if download is active
    public func isDownloading(_ modelId: String) -> Bool {
        var result = false
        queue.sync {
            result = activeTasks[modelId] != nil
        }
        return result
    }

    /// Get current download progress
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Current progress (0.0 - 1.0)
    public func getProgress(_ modelId: String) -> Double {
        var result: Double = 0
        queue.sync {
            result = taskInfo[modelId]?.progress ?? 0
        }
        return result
    }

    /// Cancel all active downloads
    public func cancelAllDownloads() {
        queue.async { [weak self] in
            guard let self = self else { return }

            for (modelId, task) in self.activeTasks {
                task.cancel()
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: 0,
                    state: .cancelled
                ))
                self.progressContinuations[modelId]?.finish()
            }

            self.activeTasks.removeAll()
            self.taskInfo.removeAll()
            self.progressContinuations.removeAll()

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
        // Find the model ID for this task
        var modelId: String?
        queue.sync {
            for (id, task) in activeTasks where task == downloadTask {
                modelId = id
                break
            }
        }

        guard let modelId = modelId else {
            logger.error("Unknown download task completed")
            return
        }

        // IMPORTANT: Move file SYNCHRONOUSLY before this callback returns!
        // The temporary file at `location` is automatically deleted when this method returns.
        var moveError: Error?
        do {
            try storage.moveToFinalLocation(from: location, for: modelId)
            logger.info("Successfully moved downloaded file for: \(modelId)")
        } catch {
            moveError = error
            logger.error("Failed to move downloaded file: \(error.localizedDescription)")
        }

        // Now handle state updates asynchronously
        let capturedError = moveError
        queue.async { [weak self] in
            guard let self = self else { return }

            if let error = capturedError {
                self.downloadResults[modelId] = false
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: 0,
                    state: .failed
                ))
                logger.error("Download failed for \(modelId): \(error.localizedDescription)")
            } else {
                self.downloadResults[modelId] = true

                // Update state
                if var info = self.taskInfo[modelId] {
                    info.state = .completed(self.storage.getModelPath(modelId))
                    self.taskInfo[modelId] = info
                }

                // Notify completion (don't finish the stream here — the outer
                // downloadModel() handles stream termination after all files)
                let totalBytes = self.taskInfo[modelId]?.totalBytes ?? 0
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: totalBytes,
                    totalBytes: totalBytes,
                    state: .completed
                ))

                logger.info("Download completed for: \(modelId)")
            }

            // Cleanup task and per-file state.
            // The shared continuation is managed by the outer downloadModel() scope.
            self.activeTasks.removeValue(forKey: modelId)
            self.taskInfo.removeValue(forKey: modelId)
            self.progressContinuations.removeValue(forKey: modelId)
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

                // Send progress update
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: totalBytesWritten,
                    totalBytes: info.totalBytes,
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
                logger.debug("Download cancelled for: \(modelId)")
            } else {
                self.downloadResults[modelId] = false
                logger.error("Download failed for \(modelId): \(error.localizedDescription)")

                // Notify failure
                self.progressContinuations[modelId]?.yield(ModelDownloadProgress(
                    modelId: modelId,
                    bytesDownloaded: 0,
                    totalBytes: 0,
                    state: .failed
                ))
            }

            // Don't finish the stream here — let downloadModel() handle
            // stream termination after all files, same as the success path.
            self.activeTasks.removeValue(forKey: modelId)
            self.taskInfo.removeValue(forKey: modelId)
            self.progressContinuations.removeValue(forKey: modelId)
        }
    }
}

// MARK: - URLSessionDelegate

@available(iOS 15.0, macOS 14.0, *)
extension ModelDownloader: URLSessionDelegate {

    public func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        logger.info("Background URL session finished events")
    }
}
