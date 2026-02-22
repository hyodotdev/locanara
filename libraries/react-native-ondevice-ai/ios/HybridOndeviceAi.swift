import Foundation
import Locanara
import NitroModules

@available(iOS 15.0, macOS 14.0, *)
class HybridOndeviceAi: HybridOndeviceAiSpec {

    private let client = LocanaraClient.shared

    // MARK: - Listener Storage

    private let listenerQueue = DispatchQueue(label: "com.locanara.ondeviceai.listeners")
    private var chatStreamListeners: [(NitroChatStreamChunk) -> Void] = []
    private var modelDownloadProgressListeners: [(NitroModelDownloadProgress) -> Void] = []

    // MARK: - Initialization

    func initialize() throws -> Promise<Bool> {
        return Promise.async {
            try await self.client.initialize()
            return true
        }
    }

    func getDeviceCapability() throws -> Promise<NitroDeviceCapability> {
        return Promise.async {
            let capability = try self.client.getDeviceCapability()
            let deviceInfo = try? self.client.getDeviceInfoIOS()
            let availableSet = Set(capability.availableFeatures)

            return NitroDeviceCapability(
                isSupported: capability.supportsOnDeviceAI,
                isModelReady: self.client.isModelReady(),
                supportsAppleIntelligence: deviceInfo?.supportsAppleIntelligence ?? false,
                platform: .apple,
                featureSummarize: availableSet.contains(.summarize),
                featureClassify: availableSet.contains(.classify),
                featureExtract: availableSet.contains(.extract),
                featureChat: availableSet.contains(.chat),
                featureTranslate: availableSet.contains(.translate),
                featureRewrite: availableSet.contains(.rewrite),
                featureProofread: availableSet.contains(.proofread),
                availableMemoryMB: Double(capability.availableMemoryMB ?? 0),
                isLowPowerMode: capability.isLowPowerMode
            )
        }
    }

    // MARK: - AI Features

    func summarize(text: String, options: Variant_NullType_NitroSummarizeOptions?) throws -> Promise<NitroSummarizeResult> {
        let opts: NitroSummarizeOptions? = if case .second(let v)? = options { v } else { nil }
        return Promise.async {
            let bulletCount = OndeviceAiHelper.bulletCount(from: opts)
            let inputType = OndeviceAiHelper.inputType(from: opts)
            let result = try await SummarizeChain(bulletCount: bulletCount, inputType: inputType).run(text)
            return NitroSummarizeResult(
                summary: result.summary,
                originalLength: Double(result.originalLength),
                summaryLength: Double(result.summaryLength),
                confidence: result.confidence ?? 0.0
            )
        }
    }

    func classify(text: String, options: Variant_NullType_NitroClassifyOptions?) throws -> Promise<NitroClassifyResult> {
        let opts: NitroClassifyOptions? = if case .second(let v)? = options { v } else { nil }
        return Promise.async {
            let (categories, maxResults) = OndeviceAiHelper.classifyOptions(from: opts)
            let result = try await ClassifyChain(categories: categories, maxResults: maxResults).run(text)
            let classifications = result.classifications.map { c in
                NitroClassification(
                    label: c.label,
                    score: c.score,
                    metadata: c.metadata ?? ""
                )
            }
            return NitroClassifyResult(
                classifications: classifications,
                topLabel: result.topClassification.label,
                topScore: result.topClassification.score
            )
        }
    }

    func extract(text: String, options: Variant_NullType_NitroExtractOptions?) throws -> Promise<NitroExtractResult> {
        let opts: NitroExtractOptions? = if case .second(let v)? = options { v } else { nil }
        return Promise.async {
            let entityTypes = OndeviceAiHelper.entityTypes(from: opts)
            let result = try await ExtractChain(entityTypes: entityTypes).run(text)
            let entities = result.entities.map { e in
                NitroExtractEntity(
                    type: e.type,
                    value: e.value,
                    confidence: e.confidence,
                    startPos: Double(e.startPos ?? 0),
                    endPos: Double(e.endPos ?? 0)
                )
            }
            return NitroExtractResult(entities: entities)
        }
    }

    func chat(message: String, options: Variant_NullType_NitroChatOptions?) throws -> Promise<NitroChatResult> {
        let opts: NitroChatOptions? = if case .second(let v)? = options { v } else { nil }
        return Promise.async {
            let (systemPrompt, memory) = OndeviceAiHelper.chatOptions(from: opts)
            let result = try await ChatChain(memory: memory, systemPrompt: systemPrompt).run(message)
            return NitroChatResult(
                message: result.message,
                conversationId: result.conversationId ?? "",
                canContinue: result.canContinue
            )
        }
    }

    func translate(text: String, options: NitroTranslateOptions) throws -> Promise<NitroTranslateResult> {
        return Promise.async {
            let (source, target) = OndeviceAiHelper.translateOptions(from: options)
            let result = try await TranslateChain(sourceLanguage: source, targetLanguage: target).run(text)
            return NitroTranslateResult(
                translatedText: result.translatedText,
                sourceLanguage: result.sourceLanguage,
                targetLanguage: result.targetLanguage,
                confidence: result.confidence ?? 0.0
            )
        }
    }

    func rewrite(text: String, options: NitroRewriteOptions) throws -> Promise<NitroRewriteResult> {
        return Promise.async {
            let style = OndeviceAiHelper.rewriteStyle(from: options)
            let result = try await RewriteChain(style: style).run(text)
            return NitroRewriteResult(
                rewrittenText: result.rewrittenText,
                style: result.style?.rawValue ?? "",
                confidence: result.confidence ?? 0.0
            )
        }
    }

    func proofread(text: String) throws -> Promise<NitroProofreadResult> {
        return Promise.async {
            let result = try await ProofreadChain().run(text)
            let corrections = result.corrections.map { c in
                NitroProofreadCorrection(
                    original: c.original,
                    corrected: c.corrected,
                    type: c.type ?? "",
                    confidence: c.confidence ?? 0.0,
                    startPos: Double(c.startPos ?? 0),
                    endPos: Double(c.endPos ?? 0)
                )
            }
            return NitroProofreadResult(
                correctedText: result.correctedText,
                corrections: corrections,
                hasCorrections: result.hasCorrections
            )
        }
    }

    // MARK: - Chat Streaming

    func chatStream(message: String, options: Variant_NullType_NitroChatOptions?) throws -> Promise<NitroChatResult> {
        let opts: NitroChatOptions? = if case .second(let v)? = options { v } else { nil }
        return Promise.async {
            let (systemPrompt, memory) = OndeviceAiHelper.chatOptions(from: opts)
            let chain = ChatChain(memory: memory, systemPrompt: systemPrompt)
            var accumulated = ""

            for try await chunk in chain.streamRun(message) {
                accumulated += chunk
                let streamChunk = NitroChatStreamChunk(
                    delta: chunk,
                    accumulated: accumulated,
                    isFinal: false
                )
                let listeners = self.listenerQueue.sync { self.chatStreamListeners }
                for listener in listeners {
                    listener(streamChunk)
                }
            }

            // Send final chunk
            let finalChunk = NitroChatStreamChunk(
                delta: "",
                accumulated: accumulated,
                isFinal: true
            )
            let finalListeners = self.listenerQueue.sync { self.chatStreamListeners }
            for listener in finalListeners {
                listener(finalChunk)
            }

            return NitroChatResult(
                message: accumulated,
                conversationId: "",
                canContinue: true
            )
        }
    }

    func addChatStreamListener(listener: @escaping (_ chunk: NitroChatStreamChunk) -> Void) throws {
        listenerQueue.sync { chatStreamListeners.append(listener) }
    }

    func removeChatStreamListener(listener: @escaping (_ chunk: NitroChatStreamChunk) -> Void) throws {
        listenerQueue.sync { chatStreamListeners.removeAll { $0 as AnyObject === listener as AnyObject } }
    }

    // MARK: - Model Management

    func getAvailableModels() throws -> Promise<[NitroModelInfo]> {
        return Promise.async {
            let models = self.client.getAvailableModels()
            return models.map { m in
                NitroModelInfo(
                    modelId: m.modelId,
                    name: m.name,
                    version: m.version,
                    sizeMB: Double(m.sizeMB),
                    quantization: m.quantization.rawValue,
                    contextLength: Double(m.contextLength),
                    minMemoryMB: Double(m.minMemoryMB),
                    isMultimodal: m.isMultimodal
                )
            }
        }
    }

    func getDownloadedModels() throws -> Promise<[String]> {
        return Promise.async {
            self.client.getDownloadedModels()
        }
    }

    func getLoadedModel() throws -> Promise<String> {
        return Promise.async {
            self.client.getLoadedModel() ?? ""
        }
    }

    func getCurrentEngine() throws -> Promise<NitroInferenceEngine> {
        return Promise.async {
            let engine = self.client.getCurrentEngine()
            switch engine {
            case .foundationModels: return .foundation_models
            case .llamaCpp: return .llama_cpp
            case .mlx: return .mlx
            case .coreMl: return .core_ml
            default: return .none
            }
        }
    }

    func downloadModel(modelId: String) throws -> Promise<Bool> {
        return Promise.async {
            let progressStream = try await self.client.downloadModelWithProgress(modelId)
            for await progress in progressStream {
                let p = NitroModelDownloadProgress(
                    modelId: progress.modelId,
                    bytesDownloaded: Double(progress.bytesDownloaded),
                    totalBytes: Double(progress.totalBytes),
                    progress: progress.progress,
                    state: self.mapDownloadState(progress.state)
                )
                let listeners = self.listenerQueue.sync { self.modelDownloadProgressListeners }
                for listener in listeners {
                    listener(p)
                }
            }
            return true
        }
    }

    func addModelDownloadProgressListener(listener: @escaping (_ progress: NitroModelDownloadProgress) -> Void) throws {
        listenerQueue.sync { modelDownloadProgressListeners.append(listener) }
    }

    func removeModelDownloadProgressListener(listener: @escaping (_ progress: NitroModelDownloadProgress) -> Void) throws {
        listenerQueue.sync { modelDownloadProgressListeners.removeAll { $0 as AnyObject === listener as AnyObject } }
    }

    func loadModel(modelId: String) throws -> Promise<Void> {
        return Promise.async {
            try await self.client.loadModel(modelId)
        }
    }

    func deleteModel(modelId: String) throws -> Promise<Void> {
        return Promise.async {
            try self.client.deleteModel(modelId)
        }
    }

    // MARK: - Android-specific (no-op on iOS)

    func getPromptApiStatus() throws -> Promise<String> {
        return Promise.async {
            "not_available"
        }
    }

    func downloadPromptApiModel() throws -> Promise<Bool> {
        return Promise.async {
            throw NSError(
                domain: "OndeviceAi",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "downloadPromptApiModel is only available on Android."]
            )
        }
    }

    // MARK: - Private Helpers

    private func mapDownloadState(_ state: Locanara.ModelDownloadState) -> NitroModelDownloadState {
        switch state {
        case .pending: return .pending
        case .downloading: return .downloading
        case .verifying: return .verifying
        case .completed: return .completed
        case .failed: return .failed
        case .cancelled: return .cancelled
        @unknown default: return .pending
        }
    }
}
