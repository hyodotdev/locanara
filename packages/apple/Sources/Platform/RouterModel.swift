import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Model implementation that routes inference through InferenceRouter.
///
/// When the active engine is Foundation Models, delegates to `FoundationLanguageModel`.
/// When the active engine is llama.cpp (or other external engine), delegates to
/// `InferenceRouter.execute()` so that chains automatically use whichever engine
/// is currently selected.
///
/// This is the default model set in `LocanaraDefaults.model` so that all built-in
/// chains (SummarizeChain, ClassifyChain, etc.) respect engine selection.
@available(iOS 15.0, macOS 14.0, *)
public struct RouterModel: LocanaraModel {

    public let name = "Router (auto-selects active engine)"
    public let maxContextTokens = 4096

    private let foundationModel = FoundationLanguageModel()

    public init() {}

    public var isReady: Bool {
        let router = InferenceRouter.shared
        switch router.getCurrentEngine() {
        case .foundationModels:
            return foundationModel.isReady
        case .llamaCpp, .mlx, .coreML:
            return router.isModelReady()
        case .none:
            return foundationModel.isReady || router.isModelReady()
        }
    }

    public func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse {
        let router = InferenceRouter.shared

        if shouldUseExternalEngine(router) {
            let inferenceConfig = mapConfig(config)
            let startTime = Date()
            let text = try await router.execute(feature: .chat, input: prompt, config: inferenceConfig)
            let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)
            return ModelResponse(text: text, processingTimeMs: elapsed)
        }

        return try await foundationModel.generate(prompt: prompt, config: config)
    }

    public func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error> {
        let router = InferenceRouter.shared

        if shouldUseExternalEngine(router) {
            let inferenceConfig = mapConfig(config)
            return router.executeStreaming(feature: .chat, input: prompt, config: inferenceConfig)
        }

        return foundationModel.stream(prompt: prompt, config: config)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    public func generateStructured<T: Generable>(prompt: String, type: T.Type) async throws -> T? {
        return try await foundationModel.generateStructured(prompt: prompt, type: type)
    }
    #endif

    // MARK: - Private

    private func shouldUseExternalEngine(_ router: InferenceRouter) -> Bool {
        switch router.getSelectedEngineMode() {
        case .externalModel:
            return router.isModelReady()
        case .deviceAI:
            return false
        case .auto:
            let engineType = router.getCurrentEngine()
            return engineType == .llamaCpp || engineType == .mlx || engineType == .coreML
        }
    }

    private func mapConfig(_ config: GenerationConfig?) -> InferenceConfig {
        guard let config else { return .chat }
        return InferenceConfig(
            temperature: Double(config.temperature ?? 0.7),
            topK: config.topK ?? 40,
            topP: 0.9,
            maxTokens: config.maxTokens ?? 1024
        )
    }
}
