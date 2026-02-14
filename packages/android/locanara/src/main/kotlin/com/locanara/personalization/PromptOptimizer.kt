package com.locanara.personalization

import com.locanara.FeatureType

/**
 * Generates optimized system prompts based on user preferences
 */
class PromptOptimizer {

    /**
     * Generate an optimized system prompt based on user preferences
     */
    fun generateSystemPrompt(
        preferences: UserPreferences,
        feature: FeatureType,
        basePrompt: String? = null
    ): String {
        val instructions = mutableListOf<String>()

        // Add base prompt if provided
        if (!basePrompt.isNullOrBlank()) {
            instructions.add(basePrompt)
        }

        // Add length preference
        instructions.add(preferences.preferredLength.description)

        // Add formality preference
        instructions.add(preferences.preferredFormality.description)

        // Add detail preference
        instructions.add(preferences.preferredDetail.description)

        // Add style preferences
        for (style in preferences.stylePreferences) {
            if (style.weight > 0.5) {
                instructions.add(style.description)
            }
        }

        // Add feature-specific preferences
        preferences.featurePreferences[feature]?.let { featurePref ->
            featurePref.preferredStyle?.let { style ->
                instructions.add("Format the response as: $style")
            }
            featurePref.additionalInstructions?.let { additionalInstructions ->
                instructions.add(additionalInstructions)
            }
        }

        // Add topic preferences if relevant
        if (preferences.preferredTopics.isNotEmpty() && preferences.confidence > 0.5) {
            val topicsStr = preferences.preferredTopics.take(5).joinToString(", ")
            instructions.add("The user has shown interest in topics like: $topicsStr. Connect to these topics when relevant.")
        }

        return buildPrompt(instructions)
    }

    /**
     * Generate a feature-specific optimized prompt
     */
    fun generateFeaturePrompt(
        feature: FeatureType,
        preferences: UserPreferences,
        userInput: String
    ): String {
        val basePrompt = getFeatureBasePrompt(feature)
        val personalizedPrompt = generateSystemPrompt(preferences, feature, basePrompt)

        return """
            |$personalizedPrompt
            |
            |User Input: $userInput
        """.trimMargin()
    }

    /**
     * Get default base prompt for a feature
     */
    private fun getFeatureBasePrompt(feature: FeatureType): String {
        return when (feature) {
            FeatureType.SUMMARIZE -> "You are a helpful assistant that summarizes text. Create a clear and accurate summary."
            FeatureType.CLASSIFY -> "You are a classification assistant. Categorize the input accurately."
            FeatureType.EXTRACT -> "You are an entity extraction assistant. Extract relevant information from the text."
            FeatureType.CHAT -> "You are a helpful, friendly AI assistant. Engage in natural conversation."
            FeatureType.TRANSLATE -> "You are a translation assistant. Translate accurately while preserving meaning."
            FeatureType.REWRITE -> "You are a writing assistant. Rewrite the text according to the requested style."
            FeatureType.PROOFREAD -> "You are a proofreading assistant. Correct grammar and spelling while preserving meaning."
            FeatureType.DESCRIBE_IMAGE -> "You are an image description assistant. Describe images accurately and helpfully."
            FeatureType.DESCRIBE_IMAGE_ANDROID -> "You are an image description assistant. Describe images accurately and helpfully."
            FeatureType.GENERATE_IMAGE -> "You are an image generation assistant."
            FeatureType.GENERATE_IMAGE_IOS -> "You are an image generation assistant."
        }
    }

    /**
     * Build the final prompt from instructions
     */
    private fun buildPrompt(instructions: List<String>): String {
        if (instructions.isEmpty()) {
            return "You are a helpful AI assistant."
        }

        return buildString {
            appendLine("You are a helpful AI assistant. Follow these guidelines for your responses:")
            appendLine()
            for ((index, instruction) in instructions.withIndex()) {
                appendLine("${index + 1}. $instruction")
            }
        }
    }

    /**
     * Enhance an existing prompt with personalization
     */
    fun enhancePrompt(
        originalPrompt: String,
        preferences: UserPreferences
    ): String {
        val enhancements = mutableListOf<String>()

        // Add relevant enhancements based on preferences
        when (preferences.preferredLength) {
            ResponseLength.SHORT -> enhancements.add("Keep the response concise.")
            ResponseLength.LONG -> enhancements.add("Provide a detailed response.")
            ResponseLength.MEDIUM -> {} // No modification needed
        }

        when (preferences.preferredFormality) {
            FormalityLevel.CASUAL -> enhancements.add("Use a friendly, casual tone.")
            FormalityLevel.FORMAL -> enhancements.add("Use formal, professional language.")
            FormalityLevel.NEUTRAL -> {} // No modification needed
        }

        if (preferences.stylePreferences.any { it.name == "bullets" && it.weight > 0.5 }) {
            enhancements.add("Use bullet points where appropriate.")
        }

        if (preferences.stylePreferences.any { it.name == "examples" && it.weight > 0.5 }) {
            enhancements.add("Include examples when helpful.")
        }

        if (enhancements.isEmpty()) {
            return originalPrompt
        }

        return buildString {
            append(originalPrompt)
            appendLine()
            appendLine()
            appendLine("Additional preferences:")
            for (enhancement in enhancements) {
                appendLine("- $enhancement")
            }
        }
    }

    /**
     * Get a summary of preferences as a readable string
     */
    fun getPreferenceSummary(preferences: UserPreferences): String {
        return buildString {
            appendLine("User Preferences (confidence: ${(preferences.confidence * 100).toInt()}%):")
            appendLine("- Response length: ${preferences.preferredLength.name.lowercase()}")
            appendLine("- Formality: ${preferences.preferredFormality.name.lowercase()}")
            appendLine("- Detail level: ${preferences.preferredDetail.name.lowercase()}")

            if (preferences.stylePreferences.isNotEmpty()) {
                appendLine("- Styles: ${preferences.stylePreferences.map { it.name }.joinToString(", ")}")
            }

            if (preferences.preferredTopics.isNotEmpty()) {
                appendLine("- Interested in: ${preferences.preferredTopics.take(5).joinToString(", ")}")
            }
        }
    }
}
