import CryptoKit
import Foundation
import os.log

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

    /// File metadata captured at the same time as checksum verification.
    /// Persisting this snapshot lets synchronous readiness checks reject files
    /// that changed after verification without hashing multi-gigabyte assets on
    /// every status query. `ModelManager.loadModel` still rehashes before use.
    struct ModelFileMetadata: Equatable, Sendable {
        let fileSize: Int64
        let modificationTime: TimeInterval
    }

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelStorage()

    // MARK: - Properties

    /// Base directory for model storage
    public let baseDirectory: URL

    /// File manager instance
    private let fileManager: FileManager

    /// Dispatch queue for file operations
    private let fileQueue = DispatchQueue(label: "com.locanara.storage", qos: .utility)

    // MARK: - Initialization

    private convenience init() {
        let fileManager = FileManager.default
        // Documents has better mmap support on iOS devices.
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        self.init(
            baseDirectory: documents.appendingPathComponent("Locanara/models", isDirectory: true),
            fileManager: fileManager
        )
    }

    /// Internal initializer for deterministic storage-integrity tests.
    init(baseDirectory: URL, fileManager: FileManager = .default) {
        self.baseDirectory = baseDirectory
        self.fileManager = fileManager

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
        return baseDirectory.appendingPathComponent(Self.storageComponent(for: modelId), isDirectory: true)
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
    /// - Returns: true only when a complete package commit is present
    public func isModelDownloaded(_ modelId: String) -> Bool {
        guard let commit = loadPackageCommit(modelId),
              commit.modelId == modelId else {
            return false
        }
        return packageCommitFilesAreVerified(commit)
    }

    /// Validate one package asset against its manifest. Asset verification is
    /// intentionally not exposed as package readiness.
    private func isVerifiedAsset(_ modelId: String) -> Bool {
        let modelPath = getModelPath(modelId)
        guard fileManager.fileExists(atPath: modelPath.path),
              let manifest = loadManifest(for: modelId),
              manifest.modelId == modelId,
              manifest.checksumVerified,
              Self.isValidSHA256Checksum(manifest.checksum),
              let verifiedModificationTime = manifest.fileModificationTime,
              let metadata = getModelFileMetadata(modelId),
              metadata.fileSize == manifest.fileSize,
              metadata.modificationTime == verifiedModificationTime else {
            return false
        }

        return true
    }

    private func packageCommitFilesAreVerified(_ commit: ModelPackageCommit) -> Bool {
        commit.assets.allSatisfy { asset in
            guard isVerifiedAsset(asset.modelId),
                  let manifest = loadManifest(for: asset.modelId) else {
                return false
            }
            return manifest.version == commit.version &&
                manifest.checksum.caseInsensitiveCompare(asset.checksum) == .orderedSame
        }
    }

    /// Check that every asset in a model package was verified against the
    /// currently registered version and checksum.
    func isModelPackageDownloaded(_ modelInfo: DownloadableModelInfo) -> Bool {
        guard let assets = modelInfo.packageAssets,
              packageCommitMatches(modelInfo) else {
            return false
        }

        return assets.allSatisfy { asset in
            guard isVerifiedAsset(asset.modelId),
                  let manifest = loadManifest(for: asset.modelId) else {
                return false
            }

            return manifest.version == modelInfo.version &&
                manifest.checksum.caseInsensitiveCompare(asset.checksum) == .orderedSame
        }
    }

    /// Get downloaded model size
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: File size in bytes, or nil if not downloaded
    public func getModelSize(_ modelId: String) -> Int64? {
        getModelFileMetadata(modelId)?.fileSize
    }

    /// Return the metadata used to bind a verified manifest to exact on-disk
    /// file state. The checksum verifier compares snapshots before and after
    /// hashing so a concurrent replacement cannot be certified accidentally.
    func getModelFileMetadata(_ modelId: String) -> ModelFileMetadata? {
        let modelPath = getModelPath(modelId)
        guard let attributes = try? fileManager.attributesOfItem(atPath: modelPath.path),
              let size = attributes[.size] as? Int64,
              let modificationDate = attributes[.modificationDate] as? Date else {
            return nil
        }
        return ModelFileMetadata(
            fileSize: size,
            modificationTime: modificationDate.timeIntervalSince1970
        )
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
            guard let modelId = Self.modelId(fromStorageComponent: url.lastPathComponent) else {
                return nil
            }
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
        /// Modification timestamp captured during checksum verification.
        /// `nil` invalidates manifests written by older, trust-on-existence
        /// implementations.
        public let fileModificationTime: TimeInterval?

        public init(
            modelId: String,
            version: String,
            downloadedAt: Date,
            fileSize: Int64,
            checksum: String,
            checksumVerified: Bool,
            fileModificationTime: TimeInterval? = nil
        ) {
            self.modelId = modelId
            self.version = version
            self.downloadedAt = downloadedAt
            self.fileSize = fileSize
            self.checksum = checksum
            self.checksumVerified = checksumVerified
            self.fileModificationTime = fileModificationTime
        }
    }

    /// Final package-level promotion record. Per-asset manifests prove that
    /// files were hashed, while this marker proves the complete asset set won
    /// the manager's final cancellation/token gate.
    struct ModelPackageCommit: Codable, Sendable {
        struct Asset: Codable, Sendable, Equatable {
            let modelId: String
            let checksum: String
        }

        let modelId: String
        let version: String
        let assets: [Asset]
    }

    private func getPackageCommitPath(_ modelId: String) -> URL {
        getModelDirectory(modelId).appendingPathComponent("package-commit.json")
    }

    func savePackageCommit(_ modelInfo: DownloadableModelInfo) throws {
        guard let assets = modelInfo.packageAssets else {
            throw LocanaraError.modelDownloadFailed("Model package metadata is incomplete")
        }
        try createModelDirectory(modelInfo.modelId)
        let commit = ModelPackageCommit(
            modelId: modelInfo.modelId,
            version: modelInfo.version,
            assets: assets.map {
                ModelPackageCommit.Asset(modelId: $0.modelId, checksum: $0.checksum.lowercased())
            }
        )
        let data = try JSONEncoder().encode(commit)
        try data.write(to: getPackageCommitPath(modelInfo.modelId), options: .atomic)
    }

    private func loadPackageCommit(_ modelId: String) -> ModelPackageCommit? {
        guard let data = try? Data(contentsOf: getPackageCommitPath(modelId)) else {
            return nil
        }
        return try? JSONDecoder().decode(ModelPackageCommit.self, from: data)
    }

    private func packageCommitMatches(_ modelInfo: DownloadableModelInfo) -> Bool {
        guard let assets = modelInfo.packageAssets,
              let commit = loadPackageCommit(modelInfo.modelId),
              commit.modelId == modelInfo.modelId,
              commit.version == modelInfo.version,
              commit.assets.count == assets.count else {
            return false
        }

        return zip(commit.assets, assets).allSatisfy { committed, expected in
            committed.modelId == expected.modelId &&
                committed.checksum.caseInsensitiveCompare(expected.checksum) == .orderedSame
        }
    }

    /// Save manifest for model
    ///
    /// - Parameters:
    ///   - manifest: Manifest to save
    ///   - modelId: Model identifier
    /// - Throws: Error if save fails
    public func saveManifest(_ manifest: ModelManifest, for modelId: String) throws {
        try createModelDirectory(modelId)
        let manifestPath = getManifestPath(modelId)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted

        let data = try encoder.encode(manifest)
        try data.write(to: manifestPath, options: .atomic)
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
        await verifyChecksumAndMetadata(modelId, expectedChecksum: expectedChecksum) != nil
    }

    /// Verify a file and return the unchanged metadata snapshot associated with
    /// the verified bytes. This is internal so lifecycle code can persist the
    /// exact snapshot in the manifest.
    func verifyChecksumAndMetadata(
        _ modelId: String,
        expectedChecksum: String
    ) async -> ModelFileMetadata? {
        let modelPath = getModelPath(modelId)

        guard fileManager.fileExists(atPath: modelPath.path) else {
            logger.warning("Model file not found for checksum verification: \(modelId)")
            return nil
        }

        guard Self.isValidSHA256Checksum(expectedChecksum) else {
            logger.error("Invalid SHA-256 checksum metadata for: \(modelId)")
            return nil
        }

        guard let metadataBeforeHash = getModelFileMetadata(modelId) else {
            logger.error("Unable to read file metadata before verification: \(modelId)")
            return nil
        }

        let expectedHash = String(expectedChecksum.dropFirst("sha256:".count))

        do {
            let actualHash = try await calculateSHA256(for: modelPath)
            let isValid = actualHash.lowercased() == expectedHash.lowercased()

            guard let metadataAfterHash = getModelFileMetadata(modelId),
                  metadataAfterHash == metadataBeforeHash else {
                logger.error("Model file changed during checksum verification: \(modelId)")
                return nil
            }

            if isValid {
                logger.info("Checksum verified for: \(modelId)")
            } else {
                logger.error("Checksum mismatch for: \(modelId)")
                logger.error("Expected: \(expectedHash)")
                logger.error("Actual: \(actualHash)")
            }

            return isValid ? metadataAfterHash : nil
        } catch {
            logger.error("Checksum calculation failed: \(error.localizedDescription)")
            return nil
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

                    while true {
                        let data = try handle.read(upToCount: bufferSize) ?? Data()
                        guard !data.isEmpty else { break }
                        hasher.update(data: data)
                    }

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
    public func moveToFinalLocation(
        from temporaryURL: URL,
        for modelId: String,
        packageModelId: String? = nil
    ) throws {
        try createModelDirectory(modelId)

        let finalPath = getModelPath(modelId)
        let manifestPath = getManifestPath(modelId)
        let packageCommitPath = getPackageCommitPath(packageModelId ?? modelId)

        // Invalidate any earlier trust record before replacing bytes. This
        // prevents a same-size response from becoming ready under a stale
        // manifest during the verification window.
        if fileManager.fileExists(atPath: manifestPath.path) {
            try fileManager.removeItem(at: manifestPath)
        }
        if fileManager.fileExists(atPath: packageCommitPath.path) {
            try fileManager.removeItem(at: packageCommitPath)
        }

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

    /// Validate the canonical checksum representation used by manifests and
    /// registry entries.
    static func isValidSHA256Checksum(_ checksum: String) -> Bool {
        guard checksum.count == "sha256:".count + 64,
              checksum.hasPrefix("sha256:") else {
            return false
        }

        return checksum.dropFirst("sha256:".count).allSatisfy { character in
            character.isHexDigit
        }
    }

    /// Encode caller-controlled IDs as one path component. Known registry IDs
    /// remain readable while separators, dots, percent signs, and Unicode are
    /// escaped, so no public storage method can traverse above `baseDirectory`.
    private static func storageComponent(for modelId: String) -> String {
        guard !modelId.isEmpty else { return "%EMPTY" }

        let allowed = Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
        return modelId.utf8.map { byte -> String in
            let scalar = UnicodeScalar(byte)
            let character = Character(scalar)
            if allowed.contains(character) {
                return String(character)
            }
            return String(format: "%%%02X", byte)
        }.joined()
    }

    /// Decode only path components produced by `storageComponent(for:)`.
    /// The canonical round-trip rejects malformed encodings and alternate path
    /// spellings before the decoded ID is used for another storage lookup.
    private static func modelId(fromStorageComponent component: String) -> String? {
        if component == storageComponent(for: "") {
            return ""
        }

        guard let modelId = component.removingPercentEncoding,
              storageComponent(for: modelId) == component else {
            return nil
        }
        return modelId
    }
}
