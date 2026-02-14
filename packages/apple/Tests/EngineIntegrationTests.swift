import XCTest
@testable import Locanara

/// Comprehensive tests for engine, model management, and integration logic.
///
/// These tests verify:
/// 1. LlamaCppEngine uses real LocalLLMClient (not stub)
/// 2. Engine types and state enums are correct
/// 3. Model management types and state machine
/// 4. InferenceRouter engine selection logic
/// 5. Device capability detection
/// 6. LocanaraClient engine API surface
/// 7. Model registry and storage
@available(iOS 15.0, macOS 14.0, *)
final class EngineIntegrationTests: XCTestCase {

    // MARK: - LlamaCppEngine Integration (catches stub-being-used bug)

    func testLlamaCppEngineIsRealImplementation() async {
        // This test ensures that LocalLLMClient is properly linked.
        // If the stub is active, LlamaCppEngine.create() throws FEATURE_NOT_AVAILABLE.
        // The real engine should throw a model-related error (file not found), not "not configured".
        XCTAssertEqual(LlamaCppEngine.engineType, .llamaCpp)

        let fakePath = URL(fileURLWithPath: "/tmp/nonexistent_model.gguf")
        do {
            _ = try await LlamaCppEngine.create(modelPath: fakePath)
            XCTFail("Should throw for nonexistent model path")
        } catch {
            let errorMessage = "\(error)"
            // Real implementation throws model-related errors (modelNotDownloaded, modelLoadFailed)
            // Stub throws "LocalLLMClient is not configured"
            XCTAssertFalse(
                errorMessage.contains("not configured"),
                "Stub is being used instead of real LlamaCppEngine. Ensure LocalLLMClient is linked."
            )
        }
    }

    func testLlamaCppEngineStaticProperties() {
        // Verify static properties are accessible without creating an instance
        XCTAssertEqual(LlamaCppEngine.engineType, .llamaCpp)
    }

    func testLlamaCppEngineConfigurationDefaults() {
        // Verify Configuration type exists with expected defaults
        let config = LlamaCppEngine.Configuration()
        XCTAssertEqual(config.contextSize, 8192)
        XCTAssertTrue(config.useMetal)
        XCTAssertEqual(config.gpuLayers, 99)
        XCTAssertEqual(config.batchSize, 512)
        XCTAssertGreaterThanOrEqual(config.numThreads, 2)
    }

    func testLlamaCppEngineConfigurationPresets() {
        let defaultConfig = LlamaCppEngine.Configuration.default
        XCTAssertEqual(defaultConfig.contextSize, 8192)
        XCTAssertTrue(defaultConfig.useMetal)
        XCTAssertEqual(defaultConfig.gpuLayers, 99)

        let lowMemConfig = LlamaCppEngine.Configuration.lowMemory
        XCTAssertEqual(lowMemConfig.contextSize, 4096)
        XCTAssertTrue(lowMemConfig.useMetal)
        XCTAssertEqual(lowMemConfig.gpuLayers, 20)
        XCTAssertEqual(lowMemConfig.numThreads, 2)
    }

    func testLlamaCppEngineStatisticsType() {
        // Verify Statistics type exists with expected properties
        let stats = LlamaCppEngine.Statistics(
            modelPath: "/tmp/test.gguf",
            isLoaded: false,
            contextSize: 8192,
            numThreads: 4,
            useMetal: true,
            modelInfo: nil
        )
        XCTAssertEqual(stats.modelPath, "/tmp/test.gguf")
        XCTAssertFalse(stats.isLoaded)
        XCTAssertEqual(stats.contextSize, 8192)
        XCTAssertEqual(stats.numThreads, 4)
        XCTAssertTrue(stats.useMetal)
        XCTAssertNil(stats.modelInfo)
    }

    func testLlamaCppEngineBuildPrompt() {
        // Verify prompt building for different model types
        let gemmaPrompt = LlamaCppEngine.buildPrompt(
            systemPrompt: "You are helpful.",
            userMessage: "Hello",
            modelType: .gemma
        )
        XCTAssertTrue(gemmaPrompt.contains("<start_of_turn>"))
        XCTAssertTrue(gemmaPrompt.contains("Hello"))
        XCTAssertTrue(gemmaPrompt.contains("You are helpful."))

        let chatMLPrompt = LlamaCppEngine.buildPrompt(
            userMessage: "Hello",
            modelType: .chatML
        )
        XCTAssertTrue(chatMLPrompt.contains("<|im_start|>"))
        XCTAssertTrue(chatMLPrompt.contains("Hello"))

        let rawPrompt = LlamaCppEngine.buildPrompt(
            userMessage: "Hello",
            modelType: .raw
        )
        XCTAssertEqual(rawPrompt, "Hello")
    }

    // MARK: - InferenceEngineType Tests

    func testInferenceEngineTypeValues() {
        // Verify all engine type raw values for persistence
        XCTAssertEqual(InferenceEngineType.foundationModels.rawValue, "foundation_models")
        XCTAssertEqual(InferenceEngineType.llamaCpp.rawValue, "llama_cpp")
        XCTAssertEqual(InferenceEngineType.mlx.rawValue, "mlx")
        XCTAssertEqual(InferenceEngineType.coreML.rawValue, "core_ml")
        XCTAssertEqual(InferenceEngineType.none.rawValue, "none")
    }

    func testInferenceEngineTypeRoundTrip() {
        // Ensure rawValue init works (used for UserDefaults persistence)
        for type in InferenceEngineType.allCases {
            let reconstructed = InferenceEngineType(rawValue: type.rawValue)
            XCTAssertEqual(reconstructed, type, "Round-trip failed for \(type)")
        }
    }

    func testInferenceEngineTypeAllCases() {
        // Ensure all cases are present (catches missing cases after refactor)
        let allCases = InferenceEngineType.allCases
        XCTAssertEqual(allCases.count, 5)
        XCTAssertTrue(allCases.contains(.foundationModels))
        XCTAssertTrue(allCases.contains(.llamaCpp))
        XCTAssertTrue(allCases.contains(.mlx))
        XCTAssertTrue(allCases.contains(.coreML))
        XCTAssertTrue(allCases.contains(.none))
    }

    // MARK: - Model Download Types Tests

    func testModelDownloadStateValues() {
        // Verify all download states
        let allStates: [ModelDownloadState] = [
            .pending, .downloading, .verifying, .extracting,
            .completed, .failed, .cancelled
        ]
        XCTAssertEqual(allStates.count, 7)

        // Verify Codable round-trip
        for state in allStates {
            let data = try? JSONEncoder().encode(state)
            XCTAssertNotNil(data, "Failed to encode \(state)")
            if let data = data {
                let decoded = try? JSONDecoder().decode(ModelDownloadState.self, from: data)
                XCTAssertEqual(decoded, state, "Codable round-trip failed for \(state)")
            }
        }
    }

    func testModelStateValues() {
        let allStates: [ModelState] = [
            .notDownloaded, .downloading, .downloaded,
            .loading, .loaded, .unloading, .error
        ]
        XCTAssertEqual(allStates.count, 7)
    }

    func testModelDownloadProgressComputation() {
        let progress = ModelDownloadProgress(
            modelId: "test-model",
            bytesDownloaded: 500,
            totalBytes: 1000,
            state: .downloading
        )
        XCTAssertEqual(progress.progress, 0.5, accuracy: 0.001)
        XCTAssertEqual(progress.modelId, "test-model")
    }

    func testModelDownloadProgressZeroTotal() {
        let progress = ModelDownloadProgress(
            modelId: "test-model",
            bytesDownloaded: 0,
            totalBytes: 0,
            state: .pending
        )
        XCTAssertEqual(progress.progress, 0)
    }

    // MARK: - DownloadableModelInfo Tests

    func testDownloadableModelInfoCreation() {
        let model = DownloadableModelInfo(
            modelId: "gemma-3-4b-it-q4",
            name: "Gemma 3 4B IT Q4",
            version: "1.0.0",
            sizeMB: 2500,
            quantization: .int4,
            contextLength: 4096,
            downloadURL: URL(string: "https://example.com/model.gguf")!,
            checksum: "abc123",
            minMemoryMB: 4096,
            supportedFeatures: [.summarize, .chat, .translate],
            promptFormat: .gemma
        )
        XCTAssertEqual(model.modelId, "gemma-3-4b-it-q4")
        XCTAssertEqual(model.sizeMB, 2500)
        XCTAssertEqual(model.quantization, .int4)
        XCTAssertEqual(model.promptFormat, .gemma)
        XCTAssertFalse(model.isMultimodal)
        XCTAssertNil(model.mmprojURL)
    }

    func testDownloadableModelInfoMultimodal() {
        let model = DownloadableModelInfo(
            modelId: "gemma-3-4b-it-q4-vision",
            name: "Gemma 3 4B Vision",
            version: "1.0.0",
            sizeMB: 3000,
            quantization: .int4,
            contextLength: 4096,
            downloadURL: URL(string: "https://example.com/model.gguf")!,
            checksum: "abc123",
            minMemoryMB: 4096,
            supportedFeatures: [.summarize, .chat],
            promptFormat: .gemma,
            mmprojURL: URL(string: "https://example.com/mmproj.gguf"),
            mmprojSizeMB: 200
        )
        XCTAssertTrue(model.isMultimodal)
        XCTAssertNotNil(model.mmprojURL)
        XCTAssertEqual(model.mmprojSizeMB, 200)
    }

    // MARK: - Quantization & Prompt Format Tests

    func testModelQuantizationTypes() {
        let types: [ModelQuantization] = [.int4, .int8, .float16, .float32]
        XCTAssertEqual(types.count, 4)
        XCTAssertEqual(ModelQuantization.int4.rawValue, "int4")
        XCTAssertEqual(ModelQuantization.float16.rawValue, "float16")
    }

    func testPromptFormatValues() {
        // Ensure all prompt formats exist (prevents missing case after adding new model families)
        let formats: [PromptFormat] = [
            .chatml, .qwen, .gemma, .llama2, .llama3,
            .phi3, .mistral, .alpaca, .vicuna, .zephyr, .raw
        ]
        XCTAssertEqual(formats.count, 11)
        XCTAssertEqual(PromptFormat.chatml.rawValue, "chatml")
        XCTAssertEqual(PromptFormat.gemma.rawValue, "gemma")
    }

    // MARK: - InferenceConfig Tests

    func testInferenceConfigDefaults() {
        let config = InferenceConfig()
        XCTAssertEqual(config.temperature, 0.7, accuracy: 0.001)
        XCTAssertEqual(config.topK, 40)
        XCTAssertEqual(config.topP, 0.9, accuracy: 0.001)
        XCTAssertEqual(config.maxTokens, 2048)
        XCTAssertEqual(config.repeatPenalty, 1.1, accuracy: 0.001)
        XCTAssertNil(config.seed)
        XCTAssertNil(config.stopSequences)
    }

    func testInferenceConfigPresets() {
        let chat = InferenceConfig.chat
        XCTAssertEqual(chat.temperature, 0.7, accuracy: 0.001)
        XCTAssertEqual(chat.maxTokens, 2048)

        let summarize = InferenceConfig.summarize
        XCTAssertEqual(summarize.temperature, 0.4, accuracy: 0.001)
        XCTAssertEqual(summarize.maxTokens, 300)
        XCTAssertNotNil(summarize.stopSequences)

        let classify = InferenceConfig.classify
        XCTAssertEqual(classify.temperature, 0.2, accuracy: 0.001)
        XCTAssertEqual(classify.maxTokens, 50)
    }

    func testInferenceConfigFromAdvancedOptions() {
        let options = AdvancedInferenceOptions(
            temperature: 0.5,
            maxTokens: 512,
            repeatPenalty: 1.2
        )
        let config = InferenceConfig(from: options, base: .chat)
        XCTAssertEqual(config.temperature, 0.5, accuracy: 0.001)
        XCTAssertEqual(config.maxTokens, 512)
        XCTAssertEqual(config.repeatPenalty, 1.2, accuracy: 0.001)
        // Non-overridden values should fall back to base
        XCTAssertEqual(config.topK, InferenceConfig.chat.topK)
        XCTAssertEqual(config.topP, InferenceConfig.chat.topP, accuracy: 0.001)
    }

    func testInferenceConfigFromNilOptions() {
        let config = InferenceConfig(from: nil, base: .summarize)
        XCTAssertEqual(config.temperature, InferenceConfig.summarize.temperature, accuracy: 0.001)
        XCTAssertEqual(config.maxTokens, InferenceConfig.summarize.maxTokens)
    }

    // MARK: - AdvancedInferenceOptions Tests

    func testAdvancedInferenceOptionsCodable() throws {
        let options = AdvancedInferenceOptions(
            temperature: 0.5,
            topK: 30,
            topP: 0.85,
            maxTokens: 256,
            repeatPenalty: 1.15,
            seed: 42,
            stopSequences: ["END"]
        )

        let data = try JSONEncoder().encode(options)
        let decoded = try JSONDecoder().decode(AdvancedInferenceOptions.self, from: data)

        XCTAssertEqual(decoded.temperature, 0.5)
        XCTAssertEqual(decoded.topK, 30)
        XCTAssertEqual(decoded.topP, 0.85)
        XCTAssertEqual(decoded.maxTokens, 256)
        XCTAssertEqual(decoded.repeatPenalty, 1.15)
        XCTAssertEqual(decoded.seed, 42)
        XCTAssertEqual(decoded.stopSequences, ["END"])
    }

    // MARK: - GenerationResult Tests

    func testGenerationResult() {
        let result = GenerationResult(
            text: "Hello world",
            tokenCount: 3,
            generationTimeMs: 100,
            finishReason: .endOfSequence
        )
        XCTAssertEqual(result.text, "Hello world")
        XCTAssertEqual(result.tokenCount, 3)
        XCTAssertEqual(result.tokensPerSecond, 30.0, accuracy: 0.1)
        XCTAssertEqual(result.finishReason, .endOfSequence)
    }

    func testGenerationResultZeroTime() {
        let result = GenerationResult(
            text: "test",
            tokenCount: 1,
            generationTimeMs: 0,
            finishReason: .maxTokens
        )
        XCTAssertEqual(result.tokensPerSecond, 0)
    }

    func testFinishReasonValues() {
        let reasons: [FinishReason] = [.endOfSequence, .maxTokens, .cancelled, .error]
        XCTAssertEqual(reasons.count, 4)
    }

    // MARK: - ExtendedDeviceCapability Tests

    func testExtendedDeviceCapabilityCreation() {
        let capability = ExtendedDeviceCapability(
            hasNeuralEngine: true,
            availableMemoryMB: 2048,
            totalMemoryMB: 8192,
            chipset: "Apple M1",
            iosVersion: "18.0",
            supportsFoundationModels: false,
            recommendedModel: "gemma-3-4b-it-q4"
        )
        XCTAssertTrue(capability.hasNeuralEngine)
        XCTAssertEqual(capability.totalMemoryMB, 8192)
        XCTAssertEqual(capability.chipset, "Apple M1")
        XCTAssertFalse(capability.supportsFoundationModels)
        XCTAssertEqual(capability.recommendedModel, "gemma-3-4b-it-q4")
    }

    // MARK: - DeviceCapabilityDetector Tests

    func testDeviceCapabilityDetectorSingleton() {
        let detector1 = DeviceCapabilityDetector.shared
        let detector2 = DeviceCapabilityDetector.shared
        XCTAssertTrue(detector1 === detector2)
    }

    func testDeviceCapabilityDetection() {
        let capability = DeviceCapabilityDetector.shared.detectCapabilities()
        // On macOS test environment, we should get valid results
        XCTAssertGreaterThan(capability.totalMemoryMB, 0)
        XCTAssertGreaterThan(capability.availableMemoryMB, 0)
        XCTAssertFalse(capability.chipset.isEmpty)
        XCTAssertFalse(capability.iosVersion.isEmpty)
    }

    func testAvailableEngines() {
        let engines = DeviceCapabilityDetector.shared.getAvailableEngines()
        // llama.cpp should always be available (LocalLLMClient is linked)
        XCTAssertTrue(engines.contains(.llamaCpp), "llama.cpp engine should be available")
    }

    func testEngineRecommendation() {
        let recommendation = DeviceCapabilityDetector.shared.getEngineRecommendation()
        XCTAssertFalse(recommendation.reason.isEmpty)
        // Should have at least one option
        XCTAssertTrue(recommendation.hasAvailableEngine)
    }

    // MARK: - EngineSelectionMode Tests

    func testEngineSelectionModeEquatable() {
        XCTAssertEqual(EngineSelectionMode.auto, .auto)
        XCTAssertEqual(EngineSelectionMode.deviceAI, .deviceAI)
        XCTAssertEqual(
            EngineSelectionMode.externalModel("model-a"),
            EngineSelectionMode.externalModel("model-a")
        )
        XCTAssertNotEqual(
            EngineSelectionMode.externalModel("model-a"),
            EngineSelectionMode.externalModel("model-b")
        )
        XCTAssertNotEqual(EngineSelectionMode.auto, .deviceAI)
    }

    // MARK: - ModelManager Tests

    func testModelManagerSingleton() {
        let manager1 = ModelManager.shared
        let manager2 = ModelManager.shared
        XCTAssertTrue(manager1 === manager2)
    }

    func testGetAvailableModels() {
        let models = ModelManager.shared.getAvailableModels()
        // ModelRegistry should have at least one model registered
        XCTAssertGreaterThan(models.count, 0, "ModelRegistry should have registered models")

        // Verify each model has valid data
        for model in models {
            XCTAssertFalse(model.modelId.isEmpty, "Model ID should not be empty")
            XCTAssertFalse(model.name.isEmpty, "Model name should not be empty")
            XCTAssertGreaterThan(model.sizeMB, 0, "Model size should be positive")
            XCTAssertGreaterThan(model.contextLength, 0, "Context length should be positive")
            XCTAssertGreaterThan(model.minMemoryMB, 0, "Min memory should be positive")
            XCTAssertFalse(model.supportedFeatures.isEmpty, "Should support at least one feature")
        }
    }

    func testModelRegistryUniqueIds() {
        let models = ModelManager.shared.getAvailableModels()
        let ids = models.map { $0.modelId }
        let uniqueIds = Set(ids)
        XCTAssertEqual(ids.count, uniqueIds.count, "Model IDs must be unique")
    }

    func testModelManagerInitialState() {
        // No model should be loaded initially
        XCTAssertNil(ModelManager.shared.getLoadedModel())
    }

    func testModelManagerGetDownloadedModels() {
        // Should return an array (may be empty in test environment)
        let downloaded = ModelManager.shared.getDownloadedModels()
        XCTAssertNotNil(downloaded)
    }

    // MARK: - ModelStorage Tests

    func testModelStorageModelDirectory() throws {
        let storage = ModelStorage.shared
        let modelDir = storage.getModelDirectory("test-model")
        // Should return a valid URL
        XCTAssertFalse(modelDir.path.isEmpty)
        XCTAssertTrue(modelDir.path.contains("test-model"))
    }

    func testModelStorageModelPath() throws {
        let storage = ModelStorage.shared
        let modelPath = storage.getModelPath("test-model")
        XCTAssertTrue(modelPath.path.hasSuffix(".gguf"))
    }

    func testModelStorageTotalUsed() throws {
        let used = ModelStorage.shared.getTotalStorageUsed()
        XCTAssertGreaterThanOrEqual(used, 0)
    }

    func testModelStorageAvailableSpace() throws {
        let available = ModelStorage.shared.getAvailableStorage()
        XCTAssertGreaterThan(available, 0)
    }

    // MARK: - InferenceRouter Tests

    func testInferenceRouterSingleton() {
        let router1 = InferenceRouter.shared
        let router2 = InferenceRouter.shared
        XCTAssertTrue(router1 === router2)
    }

    func testInferenceRouterDefaultEngineMode() {
        let mode = InferenceRouter.shared.getSelectedEngineMode()
        XCTAssertEqual(mode, .auto, "Default engine mode should be auto")
    }

    func testInferenceRouterPreferredEngine() {
        let preferred = InferenceRouter.shared.getPreferredEngine()
        XCTAssertEqual(preferred, .llamaCpp, "Default preferred engine should be llama.cpp")
    }

    func testInferenceRouterEngineInfo() {
        let info = InferenceRouter.shared.getEngineInfo()
        // Should have at least some engine info
        XCTAssertGreaterThan(info.count, 0)

        // Verify each info entry has valid data
        for entry in info {
            XCTAssertFalse(entry.displayName.isEmpty)
            XCTAssertFalse(entry.description.isEmpty)
        }
    }

    // MARK: - LocanaraClient Engine API Surface Tests

    func testLocanaraClientEngineAPIsExist() {
        let client = LocanaraClient.shared

        // Verify all engine management APIs compile and are accessible
        let _: [DownloadableModelInfo] = client.getAvailableModels()
        let _: [String] = client.getDownloadedModels()
        let _: String? = client.getLoadedModel()
        let _: InferenceEngineType = client.getCurrentEngine()
        let _: Bool = client.isExternalModelReady()
        let _: Bool = client.isFoundationModelsEligibleButNotReady()
        let _: ExtendedDeviceCapability = client.getExtendedDeviceCapability()
        let _: [InferenceEngineType] = client.getAvailableEngines()
        let _: EngineRecommendation = client.getEngineRecommendation()
        let _: InferenceEngineType = client.getPreferredEngine()
        let _: EngineSelectionMode = client.getSelectedEngineMode()
        let _: [EngineInfo] = client.getEngineInfo()
        let _: MemoryManager.MemoryStats = client.getMemoryStats()
        let _: (used: Int64, available: Int64) = client.getStorageInfo()
    }

    func testLocanaraClientGetCurrentEngine() {
        let engine = LocanaraClient.shared.getCurrentEngine()
        // Without initialization, should be .none or .foundationModels
        XCTAssertTrue(InferenceEngineType.allCases.contains(engine))
    }

    func testLocanaraClientGetAvailableModels() {
        let models = LocanaraClient.shared.getAvailableModels()
        XCTAssertGreaterThan(models.count, 0, "Should have available models registered")
    }

    // MARK: - MemoryManager Tests

    func testMemoryManagerSingleton() {
        let manager1 = MemoryManager.shared
        let manager2 = MemoryManager.shared
        XCTAssertTrue(manager1 === manager2)
    }

    func testMemoryStats() {
        let stats = MemoryManager.shared.getMemoryStats()
        XCTAssertGreaterThan(stats.totalMemoryMB, 0)
        XCTAssertGreaterThan(stats.availableMemoryMB, 0)
        XCTAssertGreaterThanOrEqual(stats.usedMemoryMB, 0)
    }

    // MARK: - LocanaraClient Basic API Tests

    func testLocanaraClientVersion() {
        let version = LocanaraClient.version
        XCTAssertFalse(version.isEmpty)
    }

    func testLocanaraClientSharedSingleton() {
        let client1 = LocanaraClient.shared
        let client2 = LocanaraClient.shared
        XCTAssertTrue(client1 === client2)
    }

    func testLocanaraClientGetCurrentInferenceEngine() {
        // Community API
        let engine = LocanaraClient.shared.getCurrentInferenceEngine()
        XCTAssertTrue(InferenceEngineType.allCases.contains(engine))
    }

    func testLocanaraClientIsModelReady() {
        let isReady = LocanaraClient.shared.isModelReady()
        // Should be a valid boolean (no crash)
        XCTAssertNotNil(isReady)
    }

    // MARK: - InferenceEngineFactory Tests

    func testInferenceEngineFactoryAvailableEngines() {
        let engines = InferenceEngineFactory.availableEngines()
        // llama.cpp should always be available
        XCTAssertTrue(engines.contains(.llamaCpp))
        // .none should never be in the list
        XCTAssertFalse(engines.contains(.none))
    }

    func testInferenceEngineFactoryCreateWithInvalidType() async {
        // Creating .none or .foundationModels engine should throw
        do {
            _ = try await InferenceEngineFactory.create(
                type: .none,
                modelPath: URL(fileURLWithPath: "/tmp/test.gguf")
            )
            XCTFail("Should throw for .none engine type")
        } catch {
            // Expected
        }
    }

    // MARK: - InferenceEngineConfiguration Tests

    func testInferenceEngineConfigurationDefaults() {
        let config = InferenceEngineConfiguration.default
        XCTAssertGreaterThan(config.numThreads, 0)
        XCTAssertEqual(config.contextSize, 2048)
        XCTAssertEqual(config.batchSize, 512)
        XCTAssertTrue(config.useGPU)
        XCTAssertEqual(config.gpuLayers, 32)
    }

    func testInferenceEngineConfigurationCustom() {
        let config = InferenceEngineConfiguration(
            numThreads: 2,
            contextSize: 4096,
            batchSize: 256,
            useGPU: false,
            gpuLayers: 0
        )
        XCTAssertEqual(config.numThreads, 2)
        XCTAssertEqual(config.contextSize, 4096)
        XCTAssertEqual(config.batchSize, 256)
        XCTAssertFalse(config.useGPU)
        XCTAssertEqual(config.gpuLayers, 0)
    }

    // MARK: - EngineInfo Tests

    func testEngineInfoProperties() {
        let info = EngineInfo(
            type: .llamaCpp,
            isAvailable: true,
            isActive: false,
            isPreferred: true
        )
        XCTAssertEqual(info.type, .llamaCpp)
        XCTAssertTrue(info.isAvailable)
        XCTAssertFalse(info.isActive)
        XCTAssertTrue(info.isPreferred)
        XCTAssertEqual(info.displayName, "llama.cpp")
        XCTAssertFalse(info.description.isEmpty)
        XCTAssertTrue(info.requiresModelDownload)
    }

    func testEngineInfoFoundationModels() {
        let info = EngineInfo(
            type: .foundationModels,
            isAvailable: true,
            isActive: true,
            isPreferred: false
        )
        XCTAssertEqual(info.displayName, "Apple Intelligence")
        XCTAssertFalse(info.requiresModelDownload)
    }

    // MARK: - ModelStorage Manifest Tests

    func testModelStorageManifestCodable() throws {
        let manifest = ModelStorage.ModelManifest(
            modelId: "test-model",
            version: "1.0.0",
            downloadedAt: Date(),
            fileSize: 2_500_000_000,
            checksum: "sha256:abc123",
            checksumVerified: true
        )
        XCTAssertEqual(manifest.modelId, "test-model")
        XCTAssertEqual(manifest.version, "1.0.0")
        XCTAssertEqual(manifest.fileSize, 2_500_000_000)
        XCTAssertTrue(manifest.checksumVerified)
    }

    func testModelStorageIsNotDownloaded() {
        // A nonexistent model should not be reported as downloaded
        XCTAssertFalse(ModelStorage.shared.isModelDownloaded("nonexistent-model-xyz"))
    }

    func testModelStorageHasEnoughSpace() {
        // Should have enough space for a tiny model
        XCTAssertTrue(ModelStorage.shared.hasEnoughSpace(forSizeMB: 1))
    }

    // MARK: - InferenceEngineType Display Properties Tests

    func testInferenceEngineTypeDisplayNames() {
        XCTAssertEqual(InferenceEngineType.foundationModels.displayName, "Apple Intelligence")
        XCTAssertEqual(InferenceEngineType.llamaCpp.displayName, "llama.cpp")
        XCTAssertFalse(InferenceEngineType.none.displayName.isEmpty)
    }

    func testInferenceEngineTypeRequiresModelDownload() {
        XCTAssertTrue(InferenceEngineType.llamaCpp.requiresModelDownload)
        XCTAssertTrue(InferenceEngineType.mlx.requiresModelDownload)
        XCTAssertTrue(InferenceEngineType.coreML.requiresModelDownload)
        XCTAssertFalse(InferenceEngineType.foundationModels.requiresModelDownload)
        XCTAssertFalse(InferenceEngineType.none.requiresModelDownload)
    }

    func testInferenceEngineTypeDescriptions() {
        for type in InferenceEngineType.allCases {
            XCTAssertFalse(type.engineDescription.isEmpty, "\(type) should have a description")
        }
    }

    // MARK: - MemoryStats Tests

    func testMemoryStatsUsagePercentage() {
        let stats = MemoryManager.shared.getMemoryStats()
        XCTAssertGreaterThanOrEqual(stats.usagePercentage, 0)
        XCTAssertLessThanOrEqual(stats.usagePercentage, 100)
    }
}

// MARK: - ModelRegistry Tests

@available(iOS 15.0, macOS 14.0, *)
final class ModelRegistryTests: XCTestCase {

    func testRegisteredModelsExist() {
        let models = ModelRegistry.shared.models
        XCTAssertGreaterThan(models.count, 0, "ModelRegistry should have at least one model")
    }

    func testRegisteredModelsHaveValidURLs() {
        let models = ModelRegistry.shared.models
        for model in models {
            XCTAssertNotNil(model.downloadURL.host, "Model \(model.modelId) should have a valid download URL")
        }
    }

    func testRegisteredModelsHaveChecksums() {
        let models = ModelRegistry.shared.models
        for model in models {
            XCTAssertFalse(model.checksum.isEmpty, "Model \(model.modelId) should have a checksum")
        }
    }

    func testDefaultModelId() {
        XCTAssertEqual(ModelRegistry.defaultModelId, "gemma-3-4b-it-q4")
    }

    func testDefaultModel() {
        let defaultModel = ModelRegistry.shared.defaultModel
        XCTAssertEqual(defaultModel.modelId, ModelRegistry.defaultModelId)
    }

    func testGetModelById() {
        let models = ModelRegistry.shared.models
        guard let firstModel = models.first else {
            XCTFail("No models registered")
            return
        }

        let found = ModelRegistry.shared.getModel(firstModel.modelId)
        XCTAssertNotNil(found)
        XCTAssertEqual(found?.modelId, firstModel.modelId)
    }

    func testGetModelByInvalidId() {
        let found = ModelRegistry.shared.getModel("nonexistent-model-id")
        XCTAssertNil(found)
    }

    func testIsRegistered() {
        XCTAssertTrue(ModelRegistry.shared.isRegistered(ModelRegistry.defaultModelId))
        XCTAssertFalse(ModelRegistry.shared.isRegistered("nonexistent-model"))
    }

    func testCompatibleModelsForLargeMemory() {
        // Device with 16GB should be able to run all models
        let models = ModelRegistry.shared.getCompatibleModels(forMemoryMB: 16384)
        XCTAssertGreaterThanOrEqual(models.count, ModelRegistry.shared.models.count)
    }

    func testCompatibleModelsForTinyMemory() {
        // Device with 1GB can't run any model
        let models = ModelRegistry.shared.getCompatibleModels(forMemoryMB: 1024)
        XCTAssertEqual(models.count, 0)
    }

    func testRecommendedModelForSufficientMemory() {
        let recommended = ModelRegistry.shared.getRecommendedModel(forMemoryMB: 16384)
        XCTAssertNotNil(recommended)
    }

    func testRecommendedModelForInsufficientMemory() {
        let recommended = ModelRegistry.shared.getRecommendedModel(forMemoryMB: 512)
        XCTAssertNil(recommended)
    }

    func testModelsSupportExpectedFeatures() {
        let models = ModelRegistry.shared.models
        for model in models {
            // Every model should support at least summarize and chat
            XCTAssertTrue(
                model.supportedFeatures.contains(.summarize) || model.supportedFeatures.contains(.chat),
                "Model \(model.modelId) should support basic features"
            )
        }
    }
}
