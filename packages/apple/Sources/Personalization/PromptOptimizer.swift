import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "PromptOptimizer")

/// Optimized prompt generated from user preferences
public struct OptimizedPrompt: Sendable {
    /// The generated system prompt
    public let systemPrompt: String

    /// User preferences used for generation
    public let preferences: UserPreferences

    /// Feature this prompt is optimized for
    public let feature: FeatureType?

    /// When this prompt was generated
    public let generatedAt: Date

    /// Personalization strength (0.0 - 1.0)
    public let personalizationStrength: Double

    public init(
        systemPrompt: String,
        preferences: UserPreferences,
        feature: FeatureType? = nil,
        generatedAt: Date = Date(),
        personalizationStrength: Double = 0.5
    ) {
        self.systemPrompt = systemPrompt
        self.preferences = preferences
        self.feature = feature
        self.generatedAt = generatedAt
        self.personalizationStrength = personalizationStrength
    }
}

/// Generates optimized prompts based on user preferences
public actor PromptOptimizer {
    private let preferenceAnalyzer: PreferenceAnalyzer

    /// Cached optimized prompts by profile ID
    private var promptCache: [String: OptimizedPrompt] = [:]

    /// Cache validity duration (1 hour)
    private let cacheValiditySeconds: TimeInterval = 3600

    public init(preferenceAnalyzer: PreferenceAnalyzer) {
        self.preferenceAnalyzer = preferenceAnalyzer
    }

    // MARK: - Prompt Generation

    /// Generate an optimized system prompt for a profile
    public func generatePrompt(
        profileId: String,
        feature: FeatureType? = nil,
        basePrompt: String? = nil
    ) async throws -> OptimizedPrompt {
        // Check cache
        if let cached = promptCache[profileId],
           Date().timeIntervalSince(cached.generatedAt) < cacheValiditySeconds {
            // If feature-specific and cached prompt matches, return it
            if cached.feature == feature {
                logger.debug("Using cached prompt for profile: \(profileId)")
                return cached
            }
        }

        // Analyze preferences
        let preferences = try await preferenceAnalyzer.analyzePreferences(profileId: profileId)

        // Build the optimized prompt
        let systemPrompt = buildSystemPrompt(
            preferences: preferences,
            feature: feature,
            basePrompt: basePrompt
        )

        let optimizedPrompt = OptimizedPrompt(
            systemPrompt: systemPrompt,
            preferences: preferences,
            feature: feature,
            personalizationStrength: preferences.confidence
        )

        // Cache the result
        promptCache[profileId] = optimizedPrompt

        logger.info("Generated optimized prompt for profile: \(profileId) (confidence: \(preferences.confidence))")

        return optimizedPrompt
    }

    /// Clear cached prompt for a profile
    public func clearCache(profileId: String) {
        promptCache.removeValue(forKey: profileId)
    }

    /// Clear all cached prompts
    public func clearAllCache() {
        promptCache.removeAll()
    }

    // MARK: - Prompt Building

    private func buildSystemPrompt(
        preferences: UserPreferences,
        feature: FeatureType?,
        basePrompt: String?
    ) -> String {
        var components: [String] = []

        // Start with base prompt if provided
        if let base = basePrompt {
            components.append(base)
        } else {
            components.append("You are a helpful AI assistant.")
        }

        // Add personalization preamble
        if preferences.confidence > 0.3 {
            components.append("")
            components.append("Based on user preferences:")
        }

        // Add length preference
        if preferences.confidence > 0.2 {
            components.append("- \(preferences.preferredLength.description)")
        }

        // Add formality preference
        if preferences.confidence > 0.2 {
            components.append("- \(preferences.preferredFormality.description)")
        }

        // Add detail level preference
        if preferences.confidence > 0.2 {
            components.append("- \(preferences.preferredDetail.description)")
        }

        // Add style preferences
        for style in preferences.stylePreferences where style.weight > 0.3 {
            components.append("- \(style.description)")
        }

        // Add feature-specific preferences
        if let feature = feature,
           let featurePref = preferences.featurePreferences[feature] {
            if let instructions = featurePref.additionalInstructions {
                components.append("")
                components.append("For this task: \(instructions)")
            }
        }

        // Add topic context if relevant
        if !preferences.preferredTopics.isEmpty && preferences.confidence > 0.4 {
            let topTopics = preferences.preferredTopics.prefix(5).joined(separator: ", ")
            components.append("")
            components.append("The user often discusses topics related to: \(topTopics)")
        }

        return components.joined(separator: "\n")
    }

    // MARK: - Feature-Specific Prompts

    /// Generate an optimized prompt for summarization
    public func generateSummarizePrompt(
        profileId: String,
        inputLength: Int
    ) async throws -> OptimizedPrompt {
        let preferences = try await preferenceAnalyzer.analyzePreferences(profileId: profileId)

        var promptComponents: [String] = [
            "Summarize the following text."
        ]

        // Add length guidance based on preferences
        switch preferences.preferredLength {
        case .short:
            promptComponents.append("Keep the summary very concise (1-2 sentences).")
        case .medium:
            promptComponents.append("Provide a moderate-length summary capturing key points.")
        case .long:
            promptComponents.append("Create a comprehensive summary with all important details.")
        }

        // Add style guidance
        for style in preferences.stylePreferences {
            if style.name == "bullet_points" && style.weight > 0.3 {
                promptComponents.append("Use bullet points to organize the summary.")
                break
            }
        }

        return OptimizedPrompt(
            systemPrompt: promptComponents.joined(separator: " "),
            preferences: preferences,
            feature: .summarize,
            personalizationStrength: preferences.confidence
        )
    }

    /// Generate an optimized prompt for chat
    public func generateChatPrompt(
        profileId: String,
        conversationContext: String? = nil
    ) async throws -> OptimizedPrompt {
        let preferences = try await preferenceAnalyzer.analyzePreferences(profileId: profileId)

        var promptComponents: [String] = [
            "You are a helpful conversational AI assistant."
        ]

        // Add formality
        promptComponents.append(preferences.preferredFormality.description)

        // Add length
        switch preferences.preferredLength {
        case .short:
            promptComponents.append("Keep responses brief and to the point.")
        case .medium:
            promptComponents.append("Provide helpful, moderately-detailed responses.")
        case .long:
            promptComponents.append("Feel free to provide thorough, detailed responses.")
        }

        // Add example preference
        for style in preferences.stylePreferences {
            if style.name == "examples" && style.weight > 0.3 {
                promptComponents.append("Include examples when they would be helpful.")
            }
        }

        if let context = conversationContext {
            promptComponents.append("")
            promptComponents.append("Context: \(context)")
        }

        return OptimizedPrompt(
            systemPrompt: promptComponents.joined(separator: " "),
            preferences: preferences,
            feature: .chat,
            personalizationStrength: preferences.confidence
        )
    }

    /// Generate an optimized prompt for rewriting
    public func generateRewritePrompt(
        profileId: String,
        style: RewriteOutputType
    ) async throws -> OptimizedPrompt {
        let preferences = try await preferenceAnalyzer.analyzePreferences(profileId: profileId)

        var promptComponents: [String] = []

        switch style {
        case .professional:
            promptComponents.append("Rewrite the text in a professional tone.")
            if preferences.preferredFormality == .formal {
                promptComponents.append("Use formal, business-appropriate language.")
            }

        case .friendly:
            promptComponents.append("Rewrite the text in a friendly, approachable tone.")
            if preferences.preferredFormality == .casual {
                promptComponents.append("Feel free to use casual, conversational language.")
            }

        case .elaborate:
            promptComponents.append("Expand and elaborate on the text.")
            promptComponents.append(preferences.preferredDetail.description)

        case .shorten:
            promptComponents.append("Make the text more concise.")
            promptComponents.append("Remove unnecessary words while preserving meaning.")

        case .emojify:
            promptComponents.append("Add appropriate emojis to make the text more expressive.")

        case .rephrase:
            promptComponents.append("Rephrase the text while maintaining its meaning.")
        }

        return OptimizedPrompt(
            systemPrompt: promptComponents.joined(separator: " "),
            preferences: preferences,
            feature: .rewrite,
            personalizationStrength: preferences.confidence
        )
    }
}

// MARK: - Prompt Templates

extension PromptOptimizer {
    /// Get the base system prompt for a feature
    public func getBasePrompt(for feature: FeatureType) -> String {
        switch feature {
        case .summarize:
            return "You are a summarization assistant. Create clear, accurate summaries of the provided text."

        case .classify:
            return "You are a classification assistant. Categorize the provided text according to the given categories."

        case .extract:
            return "You are an extraction assistant. Extract the requested information from the provided text."

        case .chat:
            return "You are a helpful conversational assistant. Engage in natural, helpful dialogue."

        case .translate:
            return "You are a translation assistant. Translate text accurately while preserving meaning and tone."

        case .rewrite:
            return "You are a writing assistant. Rewrite text according to the specified style."

        case .proofread:
            return "You are a proofreading assistant. Identify and correct errors in the provided text."

        case .describeImage, .describeImageAndroid:
            return "You are an image description assistant. Provide accurate, helpful descriptions of images."

        case .generateImage, .generateImageIos:
            return "You are an image generation assistant."
        }
    }
}
