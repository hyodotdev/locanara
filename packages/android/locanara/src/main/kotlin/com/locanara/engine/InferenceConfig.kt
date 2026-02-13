package com.locanara.engine

/**
 * Configuration for LLM inference
 *
 * Matches iOS InferenceConfig for cross-platform consistency.
 */
data class InferenceConfig(
    /** Controls randomness (0.0 = deterministic, 1.0 = very random) */
    val temperature: Float = 0.7f,

    /** Limits sampling to top K most likely tokens */
    val topK: Int = 40,

    /** Limits sampling to tokens with cumulative probability <= topP */
    val topP: Float = 0.9f,

    /** Maximum number of tokens to generate */
    val maxTokens: Int = 2048,

    /** Penalty for repeating tokens (1.0 = no penalty) */
    val repeatPenalty: Float = 1.1f,

    /** Random seed for reproducible generation (-1 for random) */
    val seed: Long = -1L,

    /** Stop sequences - generation stops when any of these are produced */
    val stopSequences: List<String>? = null
) {
    companion object {
        /** Default configuration */
        val default = InferenceConfig()

        /** Default configuration for chat */
        val chat = InferenceConfig(
            temperature = 0.7f,
            topK = 40,
            topP = 0.9f,
            maxTokens = 2048
        )

        /** Configuration for summarization */
        val summarize = InferenceConfig(
            temperature = 0.4f,
            topK = 40,
            topP = 0.9f,
            maxTokens = 300,
            repeatPenalty = 1.3f,
            stopSequences = listOf("</s>", "\n\n\n", "<end_of_turn>")
        )

        /** Configuration for classification */
        val classify = InferenceConfig(
            temperature = 0.2f,
            topK = 20,
            topP = 0.7f,
            maxTokens = 50,
            repeatPenalty = 1.3f,
            stopSequences = listOf("</s>", "\n\n")
        )

        /** Configuration for extraction */
        val extract = InferenceConfig(
            temperature = 0.3f,
            topK = 30,
            topP = 0.8f,
            maxTokens = 500,
            repeatPenalty = 1.2f
        )

        /** Configuration for translation */
        val translate = InferenceConfig(
            temperature = 0.3f,
            topK = 40,
            topP = 0.9f,
            maxTokens = 1000,
            repeatPenalty = 1.1f
        )

        /** Configuration for rewriting */
        val rewrite = InferenceConfig(
            temperature = 0.5f,
            topK = 40,
            topP = 0.9f,
            maxTokens = 1000,
            repeatPenalty = 1.2f
        )

        /** Configuration for proofreading */
        val proofread = InferenceConfig(
            temperature = 0.2f,
            topK = 30,
            topP = 0.8f,
            maxTokens = 1000,
            repeatPenalty = 1.1f
        )
    }
}
