package com.locanara.platform

import android.content.Context
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraModel
import com.locanara.core.ModelResponse
import com.locanara.mlkit.MLKitPromptClient
import com.locanara.mlkit.PromptApiStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Gemini Nano Prompt API implementation of [LocanaraModel].
 *
 * Wraps ML Kit GenAI Prompt API for on-device text generation.
 *
 * ```kotlin
 * val model = PromptApiModel(context)
 * val response = model.generate("Hello", GenerationConfig.CONVERSATIONAL)
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
        }

    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = flow {
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
    }.flowOn(Dispatchers.IO)
}
