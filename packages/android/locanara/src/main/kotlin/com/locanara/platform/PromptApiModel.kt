package com.locanara.platform

import android.content.Context
import android.graphics.Bitmap
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.ImagePart
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import com.locanara.LocanaraException
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraModel
import com.locanara.core.ModelResponse
import com.locanara.mlkit.MLKitPromptClient
import com.locanara.mlkit.PromptApiStatus
import com.locanara.mlkit.mapGenAiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Gemini Nano Prompt API implementation of [LocanaraModel].
 *
 * Wraps ML Kit GenAI Prompt API for on-device text generation.
 * Supports text-only and multimodal (text + image) prompts.
 *
 * ```kotlin
 * val model = PromptApiModel(context)
 * val response = model.generate("Hello", GenerationConfig.CONVERSATIONAL)
 *
 * // Multimodal: text + image
 * val response = model.generateWithImage("Describe this", bitmap)
 * ```
 */
class PromptApiModel(
    private val context: Context,
    private val promptClient: MLKitPromptClient? = null
) : LocanaraModel {

    override val name = "Gemini Nano (Prompt API)"
    override val maxContextTokens = 4096

    private var generativeModel: GenerativeModel? = null

    private fun getModel(): GenerativeModel {
        return generativeModel ?: Generation.getClient().also { generativeModel = it }
    }

    override val isReady: Boolean
        get() = promptClient?.isAvailable() ?: false

    override suspend fun generate(prompt: String, config: GenerationConfig?): ModelResponse =
        withContext(Dispatchers.IO) {
            try {
                val model = getModel()
                val startTime = System.currentTimeMillis()

                val request = generateContentRequest(TextPart(prompt)) {
                    temperature = config?.temperature ?: 0.7f
                    topK = config?.topK ?: 40
                    candidateCount = 1
                }
                val response = model.generateContent(request)
                val text = response.candidates.firstOrNull()?.text?.trim() ?: ""

                ModelResponse(
                    text = text,
                    processingTimeMs = (System.currentTimeMillis() - startTime).toInt()
                )
            } catch (e: Exception) {
                throw mapGenAiException(e)
            }
        }

    /**
     * Generate a response from a multimodal prompt (text + image).
     *
     * Requires Prompt API nano-v2 (Pixel 9+) or nano-v3 (Pixel 10+).
     */
    suspend fun generateWithImage(
        prompt: String,
        image: Bitmap,
        config: GenerationConfig? = null
    ): ModelResponse = withContext(Dispatchers.IO) {
        try {
            val model = getModel()
            val startTime = System.currentTimeMillis()

            val request = generateContentRequest(ImagePart(image), TextPart(prompt)) {
                temperature = config?.temperature ?: 0.7f
                topK = config?.topK ?: 40
                candidateCount = 1
            }
            val response = model.generateContent(request)
            val text = response.candidates.firstOrNull()?.text?.trim() ?: ""

            ModelResponse(
                text = text,
                processingTimeMs = (System.currentTimeMillis() - startTime).toInt()
            )
        } catch (e: Exception) {
            throw mapGenAiException(e)
        }
    }

    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = flow {
        try {
            val model = getModel()

            val request = generateContentRequest(TextPart(prompt)) {
                temperature = config?.temperature ?: 0.7f
                topK = config?.topK ?: 40
                candidateCount = 1
            }

            model.generateContentStream(request).collect { response ->
                val delta = response.candidates.firstOrNull()?.text ?: ""
                if (delta.isNotEmpty()) {
                    emit(delta)
                }
            }
        } catch (e: Exception) {
            throw mapGenAiException(e)
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Stream a response from a multimodal prompt (text + image).
     *
     * Requires Prompt API nano-v2 (Pixel 9+) or nano-v3 (Pixel 10+).
     */
    fun streamWithImage(
        prompt: String,
        image: Bitmap,
        config: GenerationConfig? = null
    ): Flow<String> = flow {
        try {
            val model = getModel()

            val request = generateContentRequest(ImagePart(image), TextPart(prompt)) {
                temperature = config?.temperature ?: 0.7f
                topK = config?.topK ?: 40
                candidateCount = 1
            }

            model.generateContentStream(request).collect { response ->
                val delta = response.candidates.firstOrNull()?.text ?: ""
                if (delta.isNotEmpty()) {
                    emit(delta)
                }
            }
        } catch (e: Exception) {
            throw mapGenAiException(e)
        }
    }.flowOn(Dispatchers.IO)
}
