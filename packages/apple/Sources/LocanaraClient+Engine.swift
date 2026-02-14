import Foundation

/// Locanara extensions for LocanaraClient
///
/// These methods provide engine management and model selection capabilities.
/// They provide access to llama.cpp-based inference for devices without
/// Apple Intelligence support.
@available(iOS 15.0, macOS 14.0, tvOS 15.0, watchOS 8.0, *)
extension LocanaraClient {

    // MARK: - Components (lazy-loaded singletons)

    private var inferenceRouter: InferenceRouter { InferenceRouter.shared }
    private var capabilityDetector: DeviceCapabilityDetector { DeviceCapabilityDetector.shared }
    private var modelManager: ModelManager { ModelManager.shared }
    private var memoryManager: MemoryManager { MemoryManager.shared }

    // MARK: - Device Capability

    /// Get Locanara device capability
    ///
    /// - Returns: ExtendedDeviceCapability with detailed Locanara info
    public func getExtendedDeviceCapability() -> ExtendedDeviceCapability {
        return capabilityDetector.detectCapabilities()
    }

    // MARK: - Model Management

    /// Download model with progress stream
    ///
    /// - Parameter modelId: Model identifier to download
    /// - Returns: AsyncStream of download progress
    /// - Throws: LocanaraError if download fails
    public func downloadModelWithProgress(_ modelId: String) async throws -> AsyncStream<ModelDownloadProgress> {
        return try await modelManager.downloadModel(modelId)
    }

    /// Get available models for download
    ///
    /// - Returns: Array of available model info
    public func getAvailableModels() -> [DownloadableModelInfo] {
        return modelManager.getAvailableModels()
    }

    /// Get downloaded models
    ///
    /// - Returns: Array of downloaded model IDs
    public func getDownloadedModels() -> [String] {
        return modelManager.getDownloadedModels()
    }

    /// Get model state
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: Current model lifecycle state
    public func getModelState(_ modelId: String) -> ModelManager.ModelLifecycleState {
        return modelManager.getModelState(modelId)
    }

    /// Delete a downloaded model
    ///
    /// - Parameter modelId: Model identifier to delete
    /// - Throws: Error if deletion fails
    public func deleteModel(_ modelId: String) throws {
        try modelManager.deleteModel(modelId)
    }

    /// Get currently loaded model ID
    ///
    /// - Returns: Model ID if a model is loaded, nil otherwise
    public func getLoadedModel() -> String? {
        return modelManager.getLoadedModel()
    }

    /// Load a downloaded model into memory
    ///
    /// This must be called after downloading a model to make it ready for inference.
    /// - Parameter modelId: Model identifier to load
    /// - Throws: LocanaraError if load fails
    public func loadModel(_ modelId: String) async throws {
        try await modelManager.loadModel(modelId)
        // Switch engine selection to the loaded model
        try await inferenceRouter.switchToExternalModel(modelId)
    }

    // MARK: - Memory Management

    /// Get memory statistics
    ///
    /// - Returns: Current memory stats
    public func getMemoryStats() -> MemoryManager.MemoryStats {
        return memoryManager.getMemoryStats()
    }

    /// Get storage information
    ///
    /// - Returns: Tuple of (used, available) storage in bytes
    public func getStorageInfo() -> (used: Int64, available: Int64) {
        return (
            used: modelManager.getTotalStorageUsed(),
            available: modelManager.getAvailableStorage()
        )
    }

    // MARK: - Engine Selection

    /// Get current inference engine (Locanara version)
    ///
    /// This method checks both Foundation Models and llama.cpp fallback.
    /// Respects user's engine selection if they manually switched engines.
    /// Use this instead of `getCurrentInferenceEngine()` when using Locanara.
    ///
    /// - Returns: Current active inference engine
    public func getCurrentEngine() -> InferenceEngineType {
        // Check user's selection mode first
        switch inferenceRouter.getSelectedEngineMode() {
        case .deviceAI:
            if capabilityDetector.canUseFoundationModels() {
                return .foundationModels
            }
        case .externalModel(let modelId):
            if modelManager.getLoadedModel() == modelId {
                return .llamaCpp
            }
        case .auto:
            break
        }

        // Auto mode: prioritize Foundation Models
        if capabilityDetector.canUseFoundationModels() {
            return .foundationModels
        }

        // Check if a model is loaded in llama.cpp
        if modelManager.getLoadedModel() != nil {
            return .llamaCpp
        }

        // Check if device can run external models (but no model loaded yet)
        if capabilityDetector.canRunExternalModels() {
            // Return .none to indicate model download needed
            return .none
        }

        return .none
    }

    /// Check if model is ready (Locanara version)
    ///
    /// - Returns: true if either Foundation Models or llama.cpp model is ready
    public func isExternalModelReady() -> Bool {
        // Foundation Models ready
        if capabilityDetector.canUseFoundationModels() {
            return true
        }

        // llama.cpp model loaded
        if modelManager.getLoadedModel() != nil {
            return true
        }

        return false
    }

    /// Check if device supports Foundation Models but models are not downloaded
    ///
    /// Use this to show "Download Apple Intelligence" prompt when device is
    /// eligible for Apple Intelligence but the models haven't been downloaded yet.
    ///
    /// - Returns: true if eligible but models not downloaded
    public func isFoundationModelsEligibleButNotReady() -> Bool {
        return capabilityDetector.isFoundationModelsEligibleButNotReady()
    }

    /// Get available fallback inference engines
    ///
    /// - Returns: Array of available engine types for this device
    public func getAvailableEngines() -> [InferenceEngineType] {
        return capabilityDetector.getAvailableEngines()
    }

    /// Get engine recommendation for this device
    ///
    /// - Returns: EngineRecommendation with reasoning
    public func getEngineRecommendation() -> EngineRecommendation {
        return capabilityDetector.getEngineRecommendation()
    }

    /// Set preferred fallback engine
    ///
    /// When Foundation Models are not available, this engine will be used.
    /// - Parameter engine: Preferred engine type (.llamaCpp, .mlx, or .coreML)
    /// - Throws: LocanaraError if engine is not available on this device
    public func setPreferredEngine(_ engine: InferenceEngineType) throws {
        try inferenceRouter.setPreferredEngine(engine)
    }

    /// Get current preferred fallback engine
    ///
    /// - Returns: Currently preferred engine type
    public func getPreferredEngine() -> InferenceEngineType {
        return inferenceRouter.getPreferredEngine()
    }

    /// Switch to device's native AI (Apple Intelligence on iOS)
    ///
    /// Unloads any loaded llama.cpp engine to release native resources before switching.
    /// - Throws: LocanaraError if device AI is not available
    public func switchToDeviceAI() async throws {
        try await inferenceRouter.switchToDeviceAI()
    }

    /// Switch to external model (llama.cpp)
    ///
    /// Reloads the engine if it was unloaded during a previous switch to device AI.
    /// - Parameter modelId: Model identifier to use
    /// - Throws: LocanaraError if model is not downloaded or load fails
    public func switchToExternalModel(_ modelId: String) async throws {
        try await inferenceRouter.switchToExternalModel(modelId)
    }

    /// Get currently selected engine mode
    ///
    /// - Returns: Current engine selection mode
    public func getSelectedEngineMode() -> EngineSelectionMode {
        return inferenceRouter.getSelectedEngineMode()
    }

    /// Get information about all engines
    ///
    /// - Returns: Array of EngineInfo for each available engine
    public func getEngineInfo() -> [EngineInfo] {
        return inferenceRouter.getEngineInfo()
    }

    /// Auto-select and prepare the best model for device
    ///
    /// - Returns: AsyncStream of download progress if download needed, nil otherwise
    /// - Throws: LocanaraError if device is not supported
    public func autoSelectModel() async throws -> AsyncStream<ModelDownloadProgress>? {
        let capability = capabilityDetector.detectCapabilities()
        return try await modelManager.autoSelectAndPrepare(forMemoryMB: capability.totalMemoryMB)
    }

    // MARK: - Advanced Inference APIs

    /// Summarize text with advanced inference options
    ///
    /// This method allows fine-tuning the inference parameters for better control.
    ///
    /// - Parameters:
    ///   - input: Text to summarize
    ///   - params: Optional summarize parameters (outputType, inputType, etc.)
    ///   - options: Optional advanced inference options (temperature, maxTokens, etc.)
    /// - Returns: SummarizeResult with summarized text
    /// - Throws: LocanaraError if execution fails
    ///
    /// Example:
    /// ```swift
    /// let options = AdvancedInferenceOptions(maxTokens: 128, temperature: 0.2)
    /// let result = try await client.summarizeWithOptions(text, params: params, options: options)
    /// ```
    public func summarizeWithOptions(
        _ input: String,
        params: SummarizeParametersInput? = nil,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> SummarizeResult {
        try await LocalModelInferenceProvider.shared.summarizeWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Classify text with advanced inference options
    ///
    /// - Parameters:
    ///   - input: Text to classify
    ///   - params: Optional classify parameters (categories, maxResults)
    ///   - options: Optional advanced inference options
    /// - Returns: ClassifyResult with classifications
    /// - Throws: LocanaraError if execution fails
    public func classifyWithOptions(
        _ input: String,
        params: ClassifyParametersInput? = nil,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> ClassifyResult {
        try await LocalModelInferenceProvider.shared.classifyWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Chat with advanced inference options
    ///
    /// - Parameters:
    ///   - input: User message
    ///   - params: Optional chat parameters (history, systemPrompt)
    ///   - options: Optional advanced inference options
    /// - Returns: ChatResult with AI response
    /// - Throws: LocanaraError if execution fails
    public func chatWithOptions(
        _ input: String,
        params: ChatParametersInput? = nil,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> ChatResult {
        try await LocalModelInferenceProvider.shared.chatWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Translate text with advanced inference options
    ///
    /// - Parameters:
    ///   - input: Text to translate
    ///   - params: Translate parameters (targetLanguage required)
    ///   - options: Optional advanced inference options
    /// - Returns: TranslateResult with translated text
    /// - Throws: LocanaraError if execution fails
    public func translateWithOptions(
        _ input: String,
        params: TranslateParametersInput,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> TranslateResult {
        try await LocalModelInferenceProvider.shared.translateWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Rewrite text with advanced inference options
    ///
    /// - Parameters:
    ///   - input: Text to rewrite
    ///   - params: Rewrite parameters (outputType required)
    ///   - options: Optional advanced inference options
    /// - Returns: RewriteResult with rewritten text
    /// - Throws: LocanaraError if execution fails
    public func rewriteWithOptions(
        _ input: String,
        params: RewriteParametersInput,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> RewriteResult {
        try await LocalModelInferenceProvider.shared.rewriteWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Proofread text with advanced inference options
    ///
    /// - Parameters:
    ///   - input: Text to proofread
    ///   - params: Optional proofread parameters
    ///   - options: Optional advanced inference options
    /// - Returns: ProofreadResult with corrections
    /// - Throws: LocanaraError if execution fails
    public func proofreadWithOptions(
        _ input: String,
        params: ProofreadParametersInput? = nil,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> ProofreadResult {
        try await LocalModelInferenceProvider.shared.proofreadWithOptions(
            input: input,
            params: params,
            options: options
        )
    }

    /// Extract entities with advanced inference options
    ///
    /// - Parameters:
    ///   - input: Text to extract from
    ///   - params: Optional extract parameters
    ///   - options: Optional advanced inference options
    /// - Returns: ExtractResult with extracted entities
    /// - Throws: LocanaraError if execution fails
    public func extractWithOptions(
        _ input: String,
        params: ExtractParametersInput? = nil,
        options: AdvancedInferenceOptions? = nil
    ) async throws -> ExtractResult {
        try await LocalModelInferenceProvider.shared.extractWithOptions(
            input: input,
            params: params,
            options: options
        )
    }
}
