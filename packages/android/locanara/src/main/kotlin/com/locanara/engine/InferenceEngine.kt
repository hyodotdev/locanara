package com.locanara.engine

import com.locanara.InferenceEngineType
import kotlinx.coroutines.flow.Flow

/**
 * Unified inference engine protocol
 *
 * Matches iOS InferenceEngine protocol for cross-platform consistency.
 */
interface InferenceEngine {
    /** Engine type identifier */
    val engineType: InferenceEngineType

    /** Human-readable engine name */
    val engineName: String

    /** Whether a model is currently loaded */
    val isLoaded: Boolean

    /** Whether this engine supports multimodal (image) input */
    val isMultimodal: Boolean

    /**
     * Get the prompt template for this engine's loaded model
     * @return The appropriate ModelTemplate for formatting prompts
     */
    fun getPromptTemplate(): PromptBuilder.ModelTemplate

    /**
     * Generate text from prompt
     * @param prompt Input prompt
     * @param config Inference configuration
     * @return Generated text
     * @throws LocanaraException if generation fails
     */
    suspend fun generate(prompt: String, config: InferenceConfig): String

    /**
     * Generate text with streaming
     * @param prompt Input prompt
     * @param config Inference configuration
     * @return Flow of generated tokens
     */
    fun generateStreaming(prompt: String, config: InferenceConfig): Flow<String>

    /**
     * Cancel ongoing generation
     * @return true if cancellation was successful
     */
    fun cancel(): Boolean

    /**
     * Unload model from memory
     */
    fun unload()
}
