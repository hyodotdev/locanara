import Foundation
import os.log
import CryptoKit

private let logger = Logger(subsystem: "com.locanara", category: "ModelStorage")

/// Manages model file storage on disk
///
/// Handles:
/// - Model directory structure
/// - File persistence and cleanup
/// - Checksum verification
/// - Storage space management
@available(iOS 15.0, macOS 14.0, *)
public final class ModelStorage: @unchecked Sendable {

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelStorage()

    // MARK: - Properties

    /// Base directory for model storage
    public let baseDirectory: URL

    /// File manager instance
    private let fileManager = FileManager.default

    /// Dispatch queue for file operations
    private let fileQueue = DispatchQueue(label: "com.locanara.storage", qos: .utility)

    // MARK: - Initialization

    private init() {
        // Use Documents directory for model storage
        // Documents directory has better mmap support on iOS devices
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        self.baseDirectory = documents.appendingPathComponent("Locanara/models", isDirectory: true)

        // Create base directory if needed
        try? fileManager.createDirectory(at: baseDirectory, withIntermediateDirectories: true)

        logger.info("Model storage initialized at: \(self.baseDirectory.path)")
    }

    // MARK: - Directory Management

    /// Get directory for a specific model
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: URL to model directory
    public func getModelDirectory(_ modelId: String) -> URL {
        return baseDirectory.appendingPathComponent(modelId, isDirectory: true)
    }

    /// Get path to model file
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: URL to model.gguf file
    public func getModelPath(_ modelId: String) -> URL {
        return getModelDirectory(modelId).appendingPathComponent("model.gguf")
    }

    /// Get path to manifest file
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: URL to manifest.json file
    public func getManifestPath(_ modelId: String) -> URL {
        return getModelDirectory(modelId).appendingPathComponent("manifest.json")
    }

    /// Create model directory
    ///
    /// - Parameter modelId: Model identifier
    /// - Throws: Error if directory creation fails
    public func createModelDirectory(_ modelId: String) throws {
        let directory = getModelDirectory(modelId)
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        logger.debug("Created model directory: \(directory.path)")
    }

    // MARK: - Model File Operations

    /// Check if model is downloaded
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if model file exists
    public func isModelDownloaded(_ modelId: String) -> Bool {
        let modelPath = getModelPath(modelId)
        return fileManager.fileExists(atPath: modelPath.path)
    }

    /// Get downloaded model size
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: File size in bytes, or nil if not downloaded
    public func getModelSize(_ modelId: String) -> Int64? {
        let modelPath = getModelPath(modelId)
        guard let attributes = try? fileManager.attributesOfItem(atPath: modelPath.path),
              let size = attributes[.size] as? Int64 else {
            return nil
        }
        return size
    }

    /// Delete model from storage
    ///
    /// - Parameter modelId: Model identifier
    /// - Throws: Error if deletion fails
    public func deleteModel(_ modelId: String) throws {
        let directory = getModelDirectory(modelId)
        if fileManager.fileExists(atPath: directory.path) {
            try fileManager.removeItem(at: directory)
            logger.info("Deleted model: \(modelId)")
        }
    }

    /// Delete all models
    ///
    /// - Throws: Error if deletion fails
    public func deleteAllModels() throws {
        let contents = try fileManager.contentsOfDirectory(at: baseDirectory, includingPropertiesForKeys: nil)
        for item in contents {
            try fileManager.removeItem(at: item)
        }
        logger.info("Deleted all models")
    }

    /// List downloaded models
    ///
    /// - Returns: Array of downloaded model IDs
    public func listDownloadedModels() -> [String] {
        guard let contents = try? fileManager.contentsOfDirectory(at: baseDirectory, includingPropertiesForKeys: nil) else {
            return []
        }

        return contents.compactMap { url -> String? in
            let modelId = url.lastPathComponent
            guard isModelDownloaded(modelId) else { return nil }
            return modelId
        }
    }

    // MARK: - Manifest Operations

    /// Model manifest structure
    public struct ModelManifest: Codable, Sendable {
        public let modelId: String
        public let version: String
        public let downloadedAt: Date
        public let fileSize: Int64
        public let checksum: String
        public let checksumVerified: Bool

        public init(
            modelId: String,
            version: String,
            downloadedAt: Date,
            fileSize: Int64,
            checksum: String,
            checksumVerified: Bool
        ) {
            self.modelId = modelId
            self.version = version
            self.downloadedAt = downloadedAt
            self.fileSize = fileSize
            self.checksum = checksum
            self.checksumVerified = checksumVerified
        }
    }

    /// Save manifest for model
    ///
    /// - Parameters:
    ///   - manifest: Manifest to save
    ///   - modelId: Model identifier
    /// - Throws: Error if save fails
    public func saveManifest(_ manifest: ModelManifest, for modelId: String) throws {
        let manifestPath = getManifestPath(modelId)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted

        let data = try encoder.encode(manifest)
        try data.write(to: manifestPath)
        logger.debug("Saved manifest for: \(modelId)")
    }

    /// Load manifest for model
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: ModelManifest if exists
    public func loadManifest(for modelId: String) -> ModelManifest? {
        let manifestPath = getManifestPath(modelId)
        guard let data = try? Data(contentsOf: manifestPath) else {
            return nil
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        return try? decoder.decode(ModelManifest.self, from: data)
    }

    // MARK: - Checksum Verification

    /// Verify model file checksum
    ///
    /// - Parameters:
    ///   - modelId: Model identifier
    ///   - expectedChecksum: Expected SHA256 checksum (format: "sha256:...")
    /// - Returns: true if checksum matches
    public func verifyChecksum(_ modelId: String, expectedChecksum: String) async -> Bool {
        let modelPath = getModelPath(modelId)

        guard fileManager.fileExists(atPath: modelPath.path) else {
            logger.warning("Model file not found for checksum verification: \(modelId)")
            return false
        }

        // Skip verification for auto/placeholder checksums during development
        if expectedChecksum.contains("placeholder") || expectedChecksum.contains("auto") {
            logger.debug("Skipping checksum verification (auto/placeholder): \(modelId)")
            return true
        }

        // Extract hash from "sha256:..." format
        let expectedHash = expectedChecksum.replacingOccurrences(of: "sha256:", with: "")

        do {
            let actualHash = try await calculateSHA256(for: modelPath)
            let isValid = actualHash.lowercased() == expectedHash.lowercased()

            if isValid {
                logger.info("Checksum verified for: \(modelId)")
            } else {
                logger.error("Checksum mismatch for: \(modelId)")
                logger.error("Expected: \(expectedHash)")
                logger.error("Actual: \(actualHash)")
            }

            return isValid
        } catch {
            logger.error("Checksum calculation failed: \(error.localizedDescription)")
            return false
        }
    }

    /// Calculate SHA256 hash of file
    ///
    /// - Parameter url: File URL
    /// - Returns: Hex-encoded SHA256 hash
    private func calculateSHA256(for url: URL) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            fileQueue.async {
                do {
                    // Read file in chunks to avoid memory issues with large files
                    let handle = try FileHandle(forReadingFrom: url)
                    defer { try? handle.close() }

                    var hasher = SHA256()
                    let bufferSize = 1024 * 1024 // 1MB chunks

                    while autoreleasepool(invoking: {
                        guard let data = try? handle.read(upToCount: bufferSize),
                              !data.isEmpty else {
                            return false
                        }
                        hasher.update(data: data)
                        return true
                    }) {}

                    let digest = hasher.finalize()
                    let hashString = digest.compactMap { String(format: "%02x", $0) }.joined()

                    continuation.resume(returning: hashString)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    // MARK: - Storage Space Management

    /// Get total storage used by models
    ///
    /// - Returns: Total size in bytes
    public func getTotalStorageUsed() -> Int64 {
        var totalSize: Int64 = 0

        guard let enumerator = fileManager.enumerator(
            at: baseDirectory,
            includingPropertiesForKeys: [.fileSizeKey],
            options: [.skipsHiddenFiles]
        ) else {
            return 0
        }

        for case let fileURL as URL in enumerator {
            guard let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
                  let fileSize = resourceValues.fileSize else {
                continue
            }
            totalSize += Int64(fileSize)
        }

        return totalSize
    }

    /// Get available storage space
    ///
    /// - Returns: Available space in bytes
    public func getAvailableStorage() -> Int64 {
        #if os(tvOS) || os(watchOS)
        return 0
        #else
        do {
            let values = try baseDirectory.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
            return values.volumeAvailableCapacityForImportantUsage ?? 0
        } catch {
            logger.error("Failed to get available storage: \(error.localizedDescription)")
            return 0
        }
        #endif
    }

    /// Check if there's enough space for a model
    ///
    /// - Parameter sizeMB: Required size in MB
    /// - Returns: true if enough space available
    public func hasEnoughSpace(forSizeMB sizeMB: Int) -> Bool {
        let requiredBytes = Int64(sizeMB) * 1024 * 1024
        let availableBytes = getAvailableStorage()
        // Require 20% extra buffer
        return availableBytes > Int64(Double(requiredBytes) * 1.2)
    }

    // MARK: - Temporary Files

    /// Get temporary download path
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: URL for temporary download
    public func getTemporaryDownloadPath(_ modelId: String) -> URL {
        let tempDir = fileManager.temporaryDirectory
        return tempDir.appendingPathComponent("locanara_\(modelId)_\(UUID().uuidString).gguf")
    }

    /// Move downloaded file to final location
    ///
    /// - Parameters:
    ///   - temporaryURL: Temporary file location
    ///   - modelId: Model identifier
    /// - Throws: Error if move fails
    public func moveToFinalLocation(from temporaryURL: URL, for modelId: String) throws {
        try createModelDirectory(modelId)

        let finalPath = getModelPath(modelId)

        // Remove existing file if present
        if fileManager.fileExists(atPath: finalPath.path) {
            try fileManager.removeItem(at: finalPath)
        }

        try fileManager.moveItem(at: temporaryURL, to: finalPath)
        logger.info("Moved model to final location: \(finalPath.path)")
    }

    /// Clean up temporary files
    public func cleanupTemporaryFiles() {
        let tempDir = fileManager.temporaryDirectory

        guard let contents = try? fileManager.contentsOfDirectory(
            at: tempDir,
            includingPropertiesForKeys: nil
        ) else {
            return
        }

        for url in contents where url.lastPathComponent.hasPrefix("locanara_") {
            try? fileManager.removeItem(at: url)
        }

        logger.debug("Cleaned up temporary files")
    }
}
