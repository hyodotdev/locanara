import Foundation
import os.log
#if canImport(FoundationModels)
import FoundationModels
#endif

private let logger = Logger(subsystem: "com.locanara", category: "PersonalizationManager")

/// Error types for personalization operations
public enum PersonalizationError: LocalizedError {
    case notInitialized
    case noActiveProfile
    case profileNotFound(id: String)
    case executionFailed(message: String)
    case inferenceEngineNotReady

    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Personalization system not initialized"
        case .noActiveProfile:
            return "No active personalization profile"
        case .profileNotFound(let id):
            return "Profile not found: \(id)"
        case .executionFailed(let message):
            return "Execution failed: \(message)"
        case .inferenceEngineNotReady:
            return "Inference engine not ready"
        }
    }
}

/// Central manager for personalization features
@available(iOS 15.0, macOS 14.0, *)
public actor PersonalizationManager {
    // MARK: - Components

    private let feedbackCollector: FeedbackCollector
    private let preferenceAnalyzer: PreferenceAnalyzer
    private let promptOptimizer: PromptOptimizer
    private var inferenceRouter: InferenceRouter?

    private var isInitialized = false

    // MARK: - Initialization

    public init() {
        self.feedbackCollector = FeedbackCollector()
        self.preferenceAnalyzer = PreferenceAnalyzer(feedbackCollector: feedbackCollector)
        self.promptOptimizer = PromptOptimizer(preferenceAnalyzer: preferenceAnalyzer)
    }

    /// Initialize the personalization system
    public func initialize() async throws {
        guard !isInitialized else { return }

        try await feedbackCollector.initialize()
        isInitialized = true

        logger.info("Personalization manager initialized")
    }

    /// Shutdown the personalization system
    public func shutdown() async {
        await feedbackCollector.shutdown()
        isInitialized = false
    }

    /// Set the inference router for AI execution
    public func setInferenceRouter(_ router: InferenceRouter) {
        self.inferenceRouter = router
    }

    // MARK: - Profile Management

    /// Create a new personalization profile
    public func createProfile(name: String) async throws -> PersonalizationProfile {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await feedbackCollector.createProfile(name: name)
    }

    /// Get all profiles
    public func getProfiles() async throws -> [PersonalizationProfile] {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await feedbackCollector.getProfiles()
    }

    /// Get the active profile
    public func getActiveProfile() async throws -> PersonalizationProfile? {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await feedbackCollector.getActiveProfile()
    }

    /// Activate a profile
    public func activateProfile(_ profileId: String) async throws -> PersonalizationProfile {
        guard isInitialized else { throw PersonalizationError.notInitialized }

        // Clear prompt cache when switching profiles
        await promptOptimizer.clearAllCache()

        return try await feedbackCollector.activateProfile(profileId)
    }

    /// Deactivate all profiles
    public func deactivateProfile() async throws {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        try await feedbackCollector.deactivateProfiles()
    }

    /// Delete a profile
    public func deleteProfile(_ profileId: String) async throws {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        try await feedbackCollector.deleteProfile(profileId)
        await promptOptimizer.clearCache(profileId: profileId)
    }

    // MARK: - Feedback Recording

    /// Record feedback for an AI execution
    public func recordFeedback(
        executionId: String,
        liked: Bool,
        comment: String? = nil
    ) async throws {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        try await feedbackCollector.recordFeedback(
            executionId: executionId,
            liked: liked,
            comment: comment
        )

        // Invalidate prompt cache for the profile since preferences may have changed
        if let profile = try await feedbackCollector.getActiveProfile() {
            await promptOptimizer.clearCache(profileId: profile.profileId)
        }
    }

    /// Get feedback history for a profile
    public func getFeedbackHistory(
        profileId: String,
        limit: Int? = nil
    ) async throws -> [FeedbackRecord] {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await feedbackCollector.getFeedbackHistory(profileId: profileId, limit: limit)
    }

    /// Clear feedback for a profile
    public func clearFeedback(profileId: String) async throws {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        try await feedbackCollector.clearFeedback(profileId: profileId)
        await promptOptimizer.clearCache(profileId: profileId)
    }

    // MARK: - Personalized Execution

    /// Execute a feature with personalization applied
    public func executePersonalized(
        input: ExecuteFeatureInput,
        profileId: String? = nil
    ) async throws -> PersonalizedExecutionResult {
        guard isInitialized else { throw PersonalizationError.notInitialized }

        // Determine which profile to use
        let targetProfileId: String
        if let id = profileId {
            targetProfileId = id
        } else if let activeProfile = try await feedbackCollector.getActiveProfile() {
            targetProfileId = activeProfile.profileId
        } else {
            throw PersonalizationError.noActiveProfile
        }

        // Get optimized prompt
        let optimizedPrompt = try await promptOptimizer.generatePrompt(
            profileId: targetProfileId,
            feature: input.feature
        )

        // Execute with personalization
        let result = try await executeWithPersonalization(
            input: input,
            optimizedPrompt: optimizedPrompt,
            profileId: targetProfileId
        )

        return result
    }

    private func executeWithPersonalization(
        input: ExecuteFeatureInput,
        optimizedPrompt: OptimizedPrompt,
        profileId: String
    ) async throws -> PersonalizedExecutionResult {
        let executionId = UUID().uuidString

        // Build personalized input
        let personalizedInput = buildPersonalizedInput(
            originalInput: input.input,
            feature: input.feature,
            systemPrompt: optimizedPrompt.systemPrompt
        )

        // Execute through inference router
        let startTime = Date()

        do {
            let output: String

            // Try InferenceRouter first
            if let router = inferenceRouter, router.isModelReady() {
                output = try await router.execute(
                    feature: input.feature,
                    input: personalizedInput,
                    config: nil
                )
            } else {
                // Fallback: Use Foundation Models if available on iOS 26+
                #if canImport(FoundationModels)
                if #available(iOS 26.0, macOS 26.0, *) {
                    output = try await executeWithFoundationModels(prompt: personalizedInput)
                } else {
                    throw PersonalizationError.inferenceEngineNotReady
                }
                #else
                throw PersonalizationError.inferenceEngineNotReady
                #endif
            }

            let processingTimeMs = Int(Date().timeIntervalSince(startTime) * 1000)

            // Register execution for potential feedback
            await feedbackCollector.registerExecution(
                executionId: executionId,
                profileId: profileId,
                feature: input.feature,
                input: input.input,
                output: output
            )

            // Create execution result
            let executionResult = createExecutionResult(
                id: executionId,
                feature: input.feature,
                output: output,
                processingTimeMs: processingTimeMs
            )

            return PersonalizedExecutionResult(
                result: executionResult,
                feedbackId: executionId,
                personalizationApplied: optimizedPrompt.personalizationStrength > 0.1,
                personalizationScore: optimizedPrompt.personalizationStrength
            )

        } catch {
            throw PersonalizationError.executionFailed(message: error.localizedDescription)
        }
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func executeWithFoundationModels(prompt: String) async throws -> String {
        // Check if Foundation Models are available
        guard case .available = SystemLanguageModel.default.availability else {
            logger.warning("Foundation Models not available for personalization")
            throw PersonalizationError.inferenceEngineNotReady
        }

        logger.info("Using Foundation Models for personalized execution")

        let session = LanguageModelSession()
        let response = try await session.respond(to: prompt)

        logger.info("Foundation Models personalized execution completed")
        return response.content
    }
    #endif

    private func buildPersonalizedInput(
        originalInput: String,
        feature: FeatureType,
        systemPrompt: String
    ) -> String {
        // For chat-like features, prepend system prompt
        switch feature {
        case .chat, .rewrite, .summarize:
            return """
            System: \(systemPrompt)

            User: \(originalInput)
            """

        default:
            return originalInput
        }
    }

    private func createExecutionResult(
        id: String,
        feature: FeatureType,
        output: String,
        processingTimeMs: Int
    ) -> ExecutionResult {
        let resultData = createResultData(feature: feature, output: output)

        return ExecutionResult(
            id: id,
            feature: feature,
            state: .completed,
            result: resultData,
            processedOn: .onDevice,
            processingTimeMs: processingTimeMs,
            error: nil,
            startedAt: Date().timeIntervalSince1970 - Double(processingTimeMs) / 1000,
            completedAt: Date().timeIntervalSince1970
        )
    }

    private func createResultData(feature: FeatureType, output: String) -> ExecutionResultData {
        switch feature {
        case .chat:
            return .chat(ChatResult(
                message: output,
                conversationId: nil,
                canContinue: true,
                suggestedPrompts: nil
            ))

        case .summarize:
            return .summarize(SummarizeResult(
                summary: output,
                originalLength: 0,
                summaryLength: output.count,
                confidence: nil
            ))

        case .rewrite:
            return .rewrite(RewriteResult(
                rewrittenText: output,
                style: nil,
                alternatives: nil,
                confidence: nil
            ))

        case .translate:
            return .translate(TranslateResult(
                translatedText: output,
                sourceLanguage: "auto",
                targetLanguage: "en",
                confidence: nil
            ))

        case .classify:
            return .classify(ClassifyResult(
                classifications: [],
                topClassification: Classification(label: output, score: 1.0, metadata: nil)
            ))

        case .extract:
            return .extract(ExtractResult(
                entities: [],
                keyValuePairs: nil
            ))

        case .proofread:
            return .proofread(ProofreadResult(
                correctedText: output,
                corrections: [],
                hasCorrections: false
            ))

        case .describeImage, .describeImageAndroid:
            return .imageDescription(ImageDescriptionResult(
                description: output,
                alternatives: nil,
                confidence: nil
            ))

        case .generateImage, .generateImageIos:
            return .imageGeneration(ImageGenerationResult(
                imageUrls: [],
                count: 0,
                style: nil,
                prompt: nil
            ))
        }
    }

    // MARK: - Preferences

    /// Get analyzed preferences for a profile
    public func getPreferences(profileId: String) async throws -> UserPreferences {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await preferenceAnalyzer.analyzePreferences(profileId: profileId)
    }

    /// Get statistics for a profile
    public func getStatistics(profileId: String) async throws -> FeedbackStatistics {
        guard isInitialized else { throw PersonalizationError.notInitialized }
        return try await feedbackCollector.getStatistics(profileId: profileId)
    }
}
