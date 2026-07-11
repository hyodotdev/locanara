import Foundation
import XCTest
@testable import Locanara

@available(iOS 15.0, macOS 14.0, *)
final class ModelPackageIntegrityTests: XCTestCase {
    private let mainData = Data("locanara".utf8)
    private let mainChecksum = "sha256:17a68f8b7f0bbaccbee31f5e9d2e9ea11f64ccbad9ecac3c757bc4dadfb74151"
    private let projectorData = Data("projector".utf8)
    private let projectorChecksum = "sha256:0f12166cd5d87ffdea9fac1f51ec96cb283f95e1e6b6dc35e14e15f2bad2ff69"

    private var testRoot: URL!
    private var storage: ModelStorage!

    override func setUpWithError() throws {
        testRoot = FileManager.default.temporaryDirectory
            .appendingPathComponent("locanara-model-tests-\(UUID().uuidString)", isDirectory: true)
        storage = ModelStorage(baseDirectory: testRoot)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: testRoot)
        storage = nil
        testRoot = nil
    }

    func testChecksumVerificationRejectsPlaceholdersAndMutation() async throws {
        try storage.createModelDirectory("main")
        try mainData.write(to: storage.getModelPath("main"))

        let autoResult = await storage.verifyChecksum("main", expectedChecksum: "sha256:auto")
        let placeholderResult = await storage.verifyChecksum("main", expectedChecksum: "placeholder")
        let validResult = await storage.verifyChecksum("main", expectedChecksum: mainChecksum)
        XCTAssertFalse(autoResult)
        XCTAssertFalse(placeholderResult)
        XCTAssertTrue(validResult)

        try Data("locanara!".utf8).write(to: storage.getModelPath("main"), options: .atomic)
        let mutatedResult = await storage.verifyChecksum("main", expectedChecksum: mainChecksum)
        XCTAssertFalse(mutatedResult)
    }

    func testPackageReadinessRequiresEveryVerifiedAsset() async throws {
        let model = makeMultimodalModel()
        let assets = try XCTUnwrap(model.packageAssets)
        XCTAssertEqual(assets.count, 2)

        try writeVerifiedAsset(
            assets[0],
            data: mainData,
            version: model.version
        )
        XCTAssertFalse(storage.isModelPackageDownloaded(model))

        try writeVerifiedAsset(
            assets[1],
            data: projectorData,
            version: model.version
        )
        XCTAssertFalse(
            storage.isModelPackageDownloaded(model),
            "Per-asset manifests are not a terminal package promotion"
        )
        try storage.savePackageCommit(model)
        XCTAssertTrue(storage.isModelPackageDownloaded(model))

        let tamperedProjector = Data("tampered!".utf8)
        XCTAssertEqual(tamperedProjector.count, projectorData.count)
        try tamperedProjector.write(
            to: storage.getModelPath(assets[1].modelId),
            options: .atomic
        )
        try FileManager.default.setAttributes(
            [.modificationDate: Date().addingTimeInterval(5)],
            ofItemAtPath: storage.getModelPath(assets[1].modelId).path
        )
        XCTAssertFalse(storage.isModelPackageDownloaded(model))
        let tamperedMetadata = await storage.verifyChecksumAndMetadata(
            assets[1].modelId,
            expectedChecksum: assets[1].checksum
        )
        XCTAssertNil(tamperedMetadata)

        let freshManager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader()
        )
        guard case .notDownloaded = freshManager.getModelState(model.modelId) else {
            return XCTFail("A fresh manager must reject same-size package mutation")
        }
    }

    func testUnverifiedAndLegacyManifestFilesAreNotDownloaded() throws {
        try storage.createModelDirectory("legacy")
        try mainData.write(to: storage.getModelPath("legacy"))
        XCTAssertFalse(storage.isModelDownloaded("legacy"))

        let legacyManifest = ModelStorage.ModelManifest(
            modelId: "legacy",
            version: "1",
            downloadedAt: Date(),
            fileSize: Int64(mainData.count),
            checksum: "sha256:auto",
            checksumVerified: true
        )
        try storage.saveManifest(legacyManifest, for: "legacy")
        XCTAssertFalse(storage.isModelDownloaded("legacy"))
    }

    func testCallerControlledModelIdCannotEscapeStorageRoot() throws {
        let sentinel = testRoot.deletingLastPathComponent()
            .appendingPathComponent("sentinel-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: sentinel, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: sentinel) }

        let maliciousId = "../\(sentinel.lastPathComponent)"
        let modelDirectory = storage.getModelDirectory(maliciousId).standardizedFileURL
        XCTAssertTrue(modelDirectory.path.hasPrefix(testRoot.standardizedFileURL.path + "/"))

        try storage.createModelDirectory(maliciousId)
        try storage.deleteModel(maliciousId)
        XCTAssertTrue(FileManager.default.fileExists(atPath: sentinel.path))

        let emptyIdDirectory = storage.getModelDirectory("").standardizedFileURL
        XCTAssertNotEqual(emptyIdDirectory, testRoot.standardizedFileURL)
        try storage.createModelDirectory("")
        try storage.deleteModel("")
        XCTAssertTrue(FileManager.default.fileExists(atPath: testRoot.path))
    }

    func testRegistryUsesImmutableCompleteModelPackage() throws {
        let model = ModelRegistry.shared.defaultModel
        let assets = try XCTUnwrap(model.packageAssets)
        let revision = "289f87d2bdcd6c2a6d08d889373d2a34ee799a57"

        XCTAssertEqual(assets.count, 2)
        for asset in assets {
            XCTAssertTrue(asset.url.path.contains("/resolve/\(revision)/"))
            XCTAssertFalse(asset.url.path.contains("/resolve/main/"))
            XCTAssertTrue(ModelStorage.isValidSHA256Checksum(asset.checksum))
        }

        XCTAssertEqual(model.totalDownloadSizeMB, 3341)
        XCTAssertEqual(
            Set(model.supportedFeatures),
            Set([
                .summarize, .classify, .extract, .chat,
                .translate, .rewrite, .proofread, .describeImage,
            ])
        )
    }

    func testIncompleteCompanionMetadataDoesNotProducePackageAssets() {
        let model = DownloadableModelInfo(
            modelId: "incomplete",
            name: "Incomplete",
            version: "1",
            sizeMB: 1,
            quantization: .int4,
            contextLength: 1024,
            downloadURL: URL(string: "https://locanara.test/model.gguf")!,
            checksum: mainChecksum,
            minMemoryMB: 1,
            supportedFeatures: [.chat],
            mmprojURL: URL(string: "https://locanara.test/mmproj.gguf"),
            mmprojSizeMB: 1
        )

        XCTAssertNil(model.packageAssets)
    }

    func testDownloaderCompletesPackageOnlyAfterBothAssetsTransfer() async {
        let downloader = makeStubDownloader()
        let model = makeMultimodalModel()
        var states: [ModelDownloadState] = []

        for await progress in downloader.downloadModel(model) {
            states.append(progress.state)
        }

        XCTAssertEqual(states.filter { $0 == .completed }.count, 1)
        XCTAssertFalse(states.contains(.failed))
        XCTAssertTrue(FileManager.default.fileExists(atPath: storage.getModelPath(model.modelId).path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: storage.getModelPath("\(model.modelId)-mmproj").path))
        XCTAssertFalse(storage.isModelPackageDownloaded(model), "Transfers must remain unavailable until verification")
    }

    func testDownloaderDoesNotCompleteWhenCompanionTransferFails() async {
        let downloader = makeStubDownloader()
        let model = DownloadableModelInfo(
            modelId: "failed-package",
            name: "Failed Package",
            version: "1",
            sizeMB: 1,
            quantization: .int4,
            contextLength: 1024,
            downloadURL: URL(string: "https://locanara.test/model.gguf")!,
            checksum: mainChecksum,
            minMemoryMB: 1,
            supportedFeatures: [.chat, .describeImage],
            mmprojURL: URL(string: "https://locanara.test/fail.gguf"),
            mmprojSizeMB: 1,
            mmprojChecksum: projectorChecksum
        )
        var states: [ModelDownloadState] = []

        for await progress in downloader.downloadModel(model) {
            states.append(progress.state)
        }

        XCTAssertFalse(states.contains(.completed))
        XCTAssertTrue(states.contains(.failed))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath("failed-package").path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath("failed-package-mmproj").path))
    }

    func testBetweenAssetCancellationIsTerminalAndKeepsAggregateStatus() async {
        let reachedBetweenAssets = DispatchSemaphore(value: 0)
        let releaseBetweenAssets = DispatchSemaphore(value: 0)
        let downloader = makeStubDownloader(betweenAssets: {
            reachedBetweenAssets.signal()
            releaseBetweenAssets.wait()
        })
        let model = makeMultimodalModel()
        let consumer = Task { () -> [ModelDownloadState] in
            var states: [ModelDownloadState] = []
            for await progress in downloader.downloadModel(model) {
                states.append(progress.state)
            }
            return states
        }

        XCTAssertEqual(reachedBetweenAssets.wait(timeout: .now() + 2), .success)
        XCTAssertTrue(downloader.isDownloading(model.modelId))
        XCTAssertEqual(downloader.getProgress(model.modelId), 0.5, accuracy: 0.0001)

        downloader.cancelDownload(model.modelId)
        var duplicateStates: [ModelDownloadState] = []
        for await progress in downloader.downloadModel(model) {
            duplicateStates.append(progress.state)
        }
        XCTAssertEqual(duplicateStates, [.failed])
        releaseBetweenAssets.signal()
        let states = await consumer.value

        XCTAssertEqual(states.filter { $0 == .cancelled }.count, 1)
        XCTAssertFalse(states.contains(.completed))
        XCTAssertFalse(downloader.isDownloading(model.modelId))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath(model.modelId).path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath("\(model.modelId)-mmproj").path))
    }

    func testCancellingConsumerStopsTransferWithoutPublishingFile() async throws {
        let downloader = makeStubDownloader()
        let model = DownloadableModelInfo(
            modelId: "cancelled-package",
            name: "Cancelled Package",
            version: "1",
            sizeMB: 1,
            quantization: .int4,
            contextLength: 1024,
            downloadURL: URL(string: "https://locanara.test/slow.gguf")!,
            checksum: mainChecksum,
            minMemoryMB: 1,
            supportedFeatures: [.chat]
        )

        let consumer = Task { () -> [ModelDownloadState] in
            var states: [ModelDownloadState] = []
            for await progress in downloader.downloadModel(model) {
                states.append(progress.state)
            }
            return states
        }

        try await Task.sleep(nanoseconds: 50_000_000)
        consumer.cancel()
        let states = await consumer.value
        try await Task.sleep(nanoseconds: 150_000_000)

        XCTAssertFalse(states.contains(.completed))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath(model.modelId).path))
    }

    func testManagerImmediateCancellationPublishesOneTerminalCancellation() async throws {
        let downloader = makeStubDownloader()
        let manager = ModelManager(
            registry: .shared,
            storage: storage,
            downloader: downloader
        )
        let modelId = ModelRegistry.defaultModelId
        let stream = try await manager.downloadModel(modelId)

        manager.cancelDownload(modelId)

        var states: [ModelDownloadState] = []
        for await progress in stream {
            states.append(progress.state)
        }

        XCTAssertEqual(states.filter { $0 == .cancelled }.count, 1)
        XCTAssertFalse(states.contains(.completed))
        XCTAssertFalse(storage.isModelPackageDownloaded(ModelRegistry.shared.defaultModel))
    }

    func testManagerImmediateDeleteCannotBeUndoneByDownloadTask() async throws {
        let downloader = makeStubDownloader()
        let manager = ModelManager(
            registry: .shared,
            storage: storage,
            downloader: downloader
        )
        let modelId = ModelRegistry.defaultModelId
        let stream = try await manager.downloadModel(modelId)

        try manager.deleteModel(modelId)

        for await _ in stream {}
        try await Task.sleep(nanoseconds: 150_000_000)
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath(modelId).path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: storage.getModelPath("\(modelId)-mmproj").path))
    }

    func testDeleteWinsBeforeTerminalSuccessPublication() async throws {
        let model = makeMultimodalModel()
        let registry = ModelRegistry(models: [model])
        let reachedPublication = DispatchSemaphore(value: 0)
        let releasePublication = DispatchSemaphore(value: 0)
        let manager = ModelManager(
            registry: registry,
            storage: storage,
            downloader: makeStubDownloader(),
            beforeSuccessfulCompletion: {
                reachedPublication.signal()
                releasePublication.wait()
            }
        )
        let stream = try await manager.downloadModel(model.modelId)
        let consumer = Task { () -> [ModelDownloadState] in
            var states: [ModelDownloadState] = []
            for await progress in stream {
                states.append(progress.state)
            }
            return states
        }

        XCTAssertEqual(reachedPublication.wait(timeout: .now() + 2), .success)
        XCTAssertFalse(storage.isModelPackageDownloaded(model))
        do {
            try await manager.loadModel(model.modelId)
            XCTFail("Load must be rejected before package commit publication")
        } catch {
            // Expected: the download token still owns the package mutation.
        }
        try manager.deleteModel(model.modelId)
        releasePublication.signal()
        let states = await consumer.value

        XCTAssertFalse(states.contains(.completed))
        XCTAssertEqual(states.filter { $0 == .cancelled }.count, 1)
        XCTAssertFalse(storage.isModelPackageDownloaded(model))
        guard case .notDownloaded = manager.getModelState(model.modelId) else {
            return XCTFail("Delete must remain the terminal lifecycle state")
        }
    }

    func testDeleteCancelsBlockedLoadAndDiscardsLateEngine() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let loaderEntered = AsyncGate()
        let releaseLoader = AsyncGate()
        let engine = TestLlamaEngine()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                await loaderEntered.open()
                await releaseLoader.wait()
                return .engine(engine)
            }
        )
        let loadTask = Task { try await manager.loadModel(model.modelId) }

        await loaderEntered.wait()
        try manager.deleteModel(model.modelId)
        await releaseLoader.open()

        do {
            try await loadTask.value
            XCTFail("A deleted model must not finish loading")
        } catch {
            // Expected: deletion owns the terminal lifecycle.
        }
        XCTAssertNil(manager.getLoadedModel())
        XCTAssertEqual(engine.unloadCount, 1)
        guard case .notDownloaded = manager.getModelState(model.modelId) else {
            return XCTFail("Delete must remain terminal after late loader return")
        }
    }

    func testDeleteCancelsPreparedBridgeBeforeCommit() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let loaderEntered = AsyncGate()
        let releaseLoader = AsyncGate()
        let bridge = TestPreparedBridge()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                bridge.prepareForTest()
                await loaderEntered.open()
                await releaseLoader.wait()
                return .bridge(PreparedBridgeBackend(bridge))
            }
        )
        let loadTask = Task { try await manager.loadModel(model.modelId) }

        await loaderEntered.wait()
        try manager.deleteModel(model.modelId)
        await releaseLoader.open()

        do {
            try await loadTask.value
            XCTFail("A deleted bridge model must not commit")
        } catch {
            // Expected: deletion invalidated the load token before publication.
        }
        XCTAssertNil(manager.getLoadedModel())
        XCTAssertFalse(bridge.isModelLoaded)
        XCTAssertEqual(bridge.commitCount, 0)
        XCTAssertEqual(bridge.discardCount, 1)
        XCTAssertEqual(bridge.unloadCount, 0)
        guard case .notDownloaded = manager.getModelState(model.modelId) else {
            return XCTFail("Delete must remain terminal after bridge preparation")
        }
    }

    func testPreparedBridgeCommitsAndUnloadsExactProvider() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let bridge = TestPreparedBridge()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                bridge.prepareForTest()
                return .bridge(PreparedBridgeBackend(bridge))
            }
        )

        try await manager.loadModel(model.modelId)

        XCTAssertEqual(manager.getLoadedModel(), model.modelId)
        XCTAssertTrue(bridge.isModelLoaded)
        XCTAssertEqual(bridge.commitCount, 1)
        XCTAssertEqual(bridge.discardCount, 0)

        manager.unloadModel(model.modelId)

        XCTAssertFalse(bridge.isModelLoaded)
        XCTAssertEqual(bridge.unloadCount, 1)
    }

    func testPreparedBridgeCommitFailureDiscardsAndCanRetry() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let bridge = TestPreparedBridge(failCommit: true)
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                bridge.prepareForTest()
                return .bridge(PreparedBridgeBackend(bridge))
            }
        )

        do {
            try await manager.loadModel(model.modelId)
            XCTFail("A failed bridge commit must fail the load")
        } catch {
            // Expected: ModelManager discards the still-prepared engine.
        }

        XCTAssertNil(manager.getLoadedModel())
        XCTAssertFalse(bridge.isModelLoaded)
        XCTAssertEqual(bridge.commitCount, 0)
        XCTAssertEqual(bridge.discardCount, 1)

        bridge.setCommitFailure(false)
        try await manager.loadModel(model.modelId)

        XCTAssertEqual(manager.getLoadedModel(), model.modelId)
        XCTAssertEqual(bridge.commitCount, 1)
        manager.unloadModel(model.modelId)
    }

    func testLegacyOnePhaseBridgeIsRejectedExplicitly() {
        XCTAssertThrowsError(
            try ModelManager.validatedPreparedBridge(TestLegacyBridge())
        ) { error in
            guard case let LocanaraError.modelLoadFailed(message) = error else {
                return XCTFail("Expected modelLoadFailed, got \(error)")
            }
            XCTAssertTrue(message.contains("safe prepared-model lifecycle"))
        }
    }

    func testConcurrentLoadsInvokeEngineLoaderOnce() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let loaderEntered = AsyncGate()
        let releaseLoader = AsyncGate()
        let invocationCount = LockedCounter()
        let engine = TestLlamaEngine()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                invocationCount.increment()
                await loaderEntered.open()
                await releaseLoader.wait()
                return .engine(engine)
            }
        )
        let firstLoad = Task { try await manager.loadModel(model.modelId) }

        await loaderEntered.wait()
        do {
            try await manager.loadModel(model.modelId)
            XCTFail("Concurrent load must be rejected")
        } catch {
            // Expected: the first load owns the global engine-construction gate.
        }
        XCTAssertEqual(invocationCount.value, 1)

        await releaseLoader.open()
        try await firstLoad.value
        XCTAssertEqual(manager.getLoadedModel(), model.modelId)
        manager.unloadModel(model.modelId)
    }

    func testCallerTaskCancellationNeverPublishesLoadedState() async throws {
        let model = makeMultimodalModel()
        try writeVerifiedPackage(model)
        let loaderEntered = AsyncGate()
        let releaseLoader = AsyncGate()
        let engine = TestLlamaEngine()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader(),
            engineLoader: { _, _ in
                await loaderEntered.open()
                await releaseLoader.wait()
                return .engine(engine)
            }
        )
        let loadTask = Task { try await manager.loadModel(model.modelId) }

        await loaderEntered.wait()
        loadTask.cancel()
        await releaseLoader.open()
        do {
            try await loadTask.value
            XCTFail("Cancelled load task must not publish success")
        } catch {
            // Expected.
        }

        XCTAssertNil(manager.getLoadedModel())
        XCTAssertEqual(engine.unloadCount, 1)
        guard case .downloaded = manager.getModelState(model.modelId) else {
            return XCTFail("Cancellation must preserve the verified package")
        }
    }

    func testUnsupportedBackgroundAndResumePathsFailExplicitly() async {
        let downloader = makeStubDownloader()
        var backgroundStates: [ModelDownloadState] = []
        for await progress in downloader.downloadModel(makeMultimodalModel(), useBackground: true) {
            backgroundStates.append(progress.state)
        }
        XCTAssertEqual(backgroundStates, [.failed])

        var resumeStates: [ModelDownloadState] = []
        for await progress in downloader.resumeDownload("test-model", resumeData: Data([0x01])) {
            resumeStates.append(progress.state)
        }
        XCTAssertEqual(resumeStates, [.failed])
    }

    func testStateCallbackCanReadModelStateWithoutDeadlock() async throws {
        let model = makeMultimodalModel()
        let manager = ModelManager(
            registry: ModelRegistry(models: [model]),
            storage: storage,
            downloader: makeStubDownloader()
        )
        let expectation = expectation(description: "state callback")
        expectation.assertForOverFulfill = false

        manager.onStateChange { change in
            guard change.modelId == model.modelId else { return }
            _ = manager.getModelState(model.modelId)
            expectation.fulfill()
        }

        let stream = try await manager.downloadModel(model.modelId)
        manager.cancelDownload(model.modelId)
        for await _ in stream {}
        await fulfillment(of: [expectation], timeout: 1)
    }

    func testManagerRejectsUnknownDeleteId() {
        XCTAssertThrowsError(try ModelManager.shared.deleteModel("../sentinel")) { error in
            guard case LocanaraError.invalidInput = error else {
                return XCTFail("Expected LocanaraError.invalidInput, got \(error)")
            }
        }
    }

    private func makeMultimodalModel() -> DownloadableModelInfo {
        DownloadableModelInfo(
            modelId: "test-model",
            name: "Test Model",
            version: "1",
            sizeMB: 1,
            quantization: .int4,
            contextLength: 1024,
            downloadURL: URL(string: "https://locanara.test/model.gguf")!,
            checksum: mainChecksum,
            minMemoryMB: 1,
            supportedFeatures: [.chat, .describeImage],
            promptFormat: .gemma,
            mmprojURL: URL(string: "https://locanara.test/mmproj.gguf"),
            mmprojSizeMB: 1,
            mmprojChecksum: projectorChecksum
        )
    }

    private func makeStubDownloader(
        betweenAssets: @Sendable @escaping () -> Void = {}
    ) -> ModelDownloader {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [ModelDownloadURLProtocol.self]
        return ModelDownloader(
            storage: storage,
            foregroundConfiguration: configuration,
            betweenAssets: betweenAssets
        )
    }

    private func writeVerifiedAsset(
        _ asset: DownloadableModelAsset,
        data: Data,
        version: String
    ) throws {
        try storage.createModelDirectory(asset.modelId)
        try data.write(to: storage.getModelPath(asset.modelId), options: .atomic)
        let metadata = try XCTUnwrap(storage.getModelFileMetadata(asset.modelId))
        try storage.saveManifest(
            ModelStorage.ModelManifest(
                modelId: asset.modelId,
                version: version,
                downloadedAt: Date(),
                fileSize: metadata.fileSize,
                checksum: asset.checksum,
                checksumVerified: true,
                fileModificationTime: metadata.modificationTime
            ),
            for: asset.modelId
        )
    }

    private func writeVerifiedPackage(_ model: DownloadableModelInfo) throws {
        let assets = try XCTUnwrap(model.packageAssets)
        for asset in assets {
            let data = asset.modelId.hasSuffix("-mmproj") ? projectorData : mainData
            try writeVerifiedAsset(asset, data: data, version: model.version)
        }
        try storage.savePackageCommit(model)
        XCTAssertTrue(storage.isModelPackageDownloaded(model))
    }
}

private final class LockedCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var count = 0

    func increment() {
        lock.withLock { count += 1 }
    }

    var value: Int {
        lock.withLock { count }
    }
}

@available(iOS 15.0, macOS 14.0, *)
private final class TestPreparedBridge: NSObject, LlamaCppPreparedBridgeProvider, @unchecked Sendable {
    private let lock = NSLock()
    private var prepared = false
    private var loaded = false
    private var commits = 0
    private var discards = 0
    private var unloads = 0
    private var failCommit: Bool

    init(failCommit: Bool = false) {
        self.failCommit = failCommit
        super.init()
    }

    var isModelLoaded: Bool { lock.withLock { loaded } }
    var commitCount: Int { lock.withLock { commits } }
    var discardCount: Int { lock.withLock { discards } }
    var unloadCount: Int { lock.withLock { unloads } }

    func prepareForTest() {
        lock.withLock { prepared = true }
    }

    func setCommitFailure(_ shouldFail: Bool) {
        lock.withLock { failCommit = shouldFail }
    }

    func prepareModel(
        _ modelPath: String,
        mmprojPath: String?,
        completion: @escaping (NSError?) -> Void
    ) {
        prepareForTest()
        completion(nil)
    }

    func commitPreparedModel() throws {
        try lock.withLock {
            guard prepared else {
                throw NSError(
                    domain: "TestPreparedBridge",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "No prepared model"]
                )
            }
            if failCommit {
                throw NSError(
                    domain: "TestPreparedBridge",
                    code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "Commit failed"]
                )
            }
            prepared = false
            loaded = true
            commits += 1
        }
    }

    func discardPreparedModel() {
        lock.withLock {
            guard prepared else { return }
            prepared = false
            discards += 1
        }
    }

    func loadAndRegisterModel(
        _ modelPath: String,
        mmprojPath: String?,
        completion: @escaping (NSError?) -> Void
    ) {
        prepareModel(modelPath, mmprojPath: mmprojPath) { [weak self] error in
            guard error == nil, let self else {
                completion(error)
                return
            }
            do {
                try self.commitPreparedModel()
                completion(nil)
            } catch {
                completion(error as NSError)
            }
        }
    }

    func unloadModel() {
        lock.withLock {
            guard loaded else { return }
            loaded = false
            unloads += 1
        }
    }
}

@available(iOS 15.0, macOS 14.0, *)
private final class TestLegacyBridge: NSObject, LlamaCppBridgeProvider {
    var isModelLoaded: Bool { false }

    func loadAndRegisterModel(
        _ modelPath: String,
        mmprojPath: String?,
        completion: @escaping (NSError?) -> Void
    ) {
        completion(nil)
    }

    func unloadModel() {}
}

private actor AsyncGate {
    private var isOpen = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func wait() async {
        guard !isOpen else { return }
        await withCheckedContinuation { continuation in
            waiters.append(continuation)
        }
    }

    func open() {
        guard !isOpen else { return }
        isOpen = true
        let pending = waiters
        waiters.removeAll()
        for waiter in pending {
            waiter.resume()
        }
    }
}

@available(iOS 15.0, macOS 14.0, *)
private final class TestLlamaEngine: @unchecked Sendable, InferenceEngine, LlamaCppEngineProtocol {
    static let engineType: InferenceEngineType = .llamaCpp

    private let lock = NSLock()
    private var loaded = true
    private var unloadCalls = 0

    var isLoaded: Bool { lock.withLock { loaded } }
    var isMultimodal: Bool { true }
    var engineName: String { "Test llama.cpp" }
    var unloadCount: Int { lock.withLock { unloadCalls } }

    func generate(prompt: String, config: InferenceConfig) async throws -> String { prompt }

    func generateStreaming(
        prompt: String,
        config: InferenceConfig
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            continuation.yield(prompt)
            continuation.finish()
        }
    }

    func generateWithImage(
        prompt: String,
        imageData: Data,
        config: InferenceConfig
    ) async throws -> String { prompt }

    func cancel() -> Bool { true }

    func unload() {
        lock.withLock {
            loaded = false
            unloadCalls += 1
        }
    }
}

private final class ModelDownloadURLProtocol: URLProtocol, @unchecked Sendable {
    private let lock = NSLock()
    private var pendingWork: DispatchWorkItem?

    override class func canInit(with request: URLRequest) -> Bool {
        request.url?.host == "locanara.test" || request.url?.host == "huggingface.co"
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let url = request.url else {
            client?.urlProtocol(self, didFailWithError: URLError(.badURL))
            return
        }

        let work = DispatchWorkItem { [weak self] in
            guard let self, !self.isStopped else { return }
            let isFailure = url.lastPathComponent == "fail.gguf"
            let response = HTTPURLResponse(
                url: url,
                statusCode: isFailure ? 500 : 200,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/octet-stream"]
            )!
            self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            let responseData: Data
            switch url.lastPathComponent {
            case "model.gguf":
                responseData = Data("locanara".utf8)
            case "mmproj.gguf":
                responseData = Data("projector".utf8)
            default:
                responseData = isFailure
                    ? Data("failure".utf8)
                    : Data(url.lastPathComponent.utf8)
            }
            self.client?.urlProtocol(
                self,
                didLoad: responseData
            )
            self.client?.urlProtocolDidFinishLoading(self)
        }
        lock.withLock { pendingWork = work }

        if url.lastPathComponent == "slow.gguf" || url.host == "huggingface.co" {
            DispatchQueue.global().asyncAfter(deadline: .now() + 1, execute: work)
        } else {
            work.perform()
        }
    }

    override func stopLoading() {
        lock.withLock {
            pendingWork?.cancel()
            pendingWork = nil
        }
    }

    private var isStopped: Bool {
        lock.withLock { pendingWork?.isCancelled ?? true }
    }
}
