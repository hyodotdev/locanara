package com.locanara.core

import kotlinx.coroutines.flow.Flow

/**
 * Configuration for model generation behavior
 */
data class GenerationConfig(
    /** Temperature controls randomness (0.0 = deterministic, 1.0 = creative) */
    val temperature: Float? = null,
    /** Top-K sampling parameter */
    val topK: Int? = null,
    /** Maximum number of tokens to generate */
    val maxTokens: Int? = null
) {
    companion object {
        /** Preset for deterministic structured output */
        val STRUCTURED = GenerationConfig(temperature = 0.2f, topK = 16)
        /** Preset for creative text generation */
        val CREATIVE = GenerationConfig(temperature = 0.8f, topK = 40)
        /** Preset for conversational responses */
        val CONVERSATIONAL = GenerationConfig(temperature = 0.7f, topK = 40)
    }
}

/**
 * Represents the response from a model invocation
 */
data class ModelResponse(
    /** The raw text content of the response */
    val text: String,
    /** Processing time in milliseconds */
    val processingTimeMs: Int? = null,
    /** Token usage metadata (if available) */
    val tokenUsage: TokenUsage? = null
)

/**
 * Token usage metadata
 */
data class TokenUsage(
    val promptTokens: Int? = null,
    val completionTokens: Int? = null,
    val totalTokens: Int? = null
)

/**
 * Core interface abstracting over on-device AI models.
 *
 * Implementations wrap platform-specific models (ML Kit, Prompt API)
 * behind a unified interface.
 *
 * ```kotlin
 * val model = PromptApiModel(context)
 * val response = model.generate("Hello", GenerationConfig.CONVERSATIONAL)
 * println(response.text)
 * ```
 */
interface LocanaraModel {
    /** Human-readable name of this model backend */
    val name: String

    /** Whether this model is ready for inference */
    val isReady: Boolean

    /** Maximum context window size in tokens */
    val maxContextTokens: Int

    /** Generate a text response from a prompt string */
    suspend fun generate(prompt: String, config: GenerationConfig? = null): ModelResponse

    /** Stream a response as a Flow of text chunks */
    fun stream(prompt: String, config: GenerationConfig? = null): Flow<String>
}

/**
 * Global defaults for Locanara framework.
 *
 * On Android, set the default model at app startup:
 * ```kotlin
 * LocanaraDefaults.model = PromptApiModel(context)
 * ```
 */
object LocanaraDefaults {
    private var _model: LocanaraModel? = null

    /** The default model used by all built-in chains when no model is specified. */
    var model: LocanaraModel
        get() = _model ?: throw IllegalStateException(
            "LocanaraDefaults.model not set. Call LocanaraDefaults.model = PromptApiModel(context) at app startup."
        )
        set(value) { _model = value }
}
