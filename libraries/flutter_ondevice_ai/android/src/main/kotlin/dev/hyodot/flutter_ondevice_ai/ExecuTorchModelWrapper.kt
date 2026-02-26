package dev.hyodot.flutter_ondevice_ai

import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraModel
import com.locanara.core.ModelResponse
import com.locanara.engine.ExecuTorchEngine
import com.locanara.engine.InferenceConfig
import com.locanara.engine.PromptBuilder
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Wraps [ExecuTorchEngine] as a [LocanaraModel] so the built-in chains
 * (SummarizeChain, ChatChain, etc.) can use the loaded ExecuTorch model
 * via [com.locanara.core.LocanaraDefaults.model].
 */
class ExecuTorchModelWrapper(
    private val engine: ExecuTorchEngine
) : LocanaraModel {

    override val name: String = "ExecuTorch (${engine.engineName})"
    override val isReady: Boolean get() = engine.isLoaded
    override val maxContextTokens: Int = 8192

    private val template: PromptBuilder.ModelTemplate = engine.getPromptTemplate()

    override suspend fun generate(prompt: String, config: GenerationConfig?): ModelResponse {
        val startTime = System.currentTimeMillis()

        val formatted = PromptBuilder.buildChatPrompt(
            listOf(PromptBuilder.ChatMessage(PromptBuilder.ChatRole.USER, prompt)),
            template
        )

        val inferenceConfig = InferenceConfig(
            temperature = config?.temperature ?: 0.7f,
            topK = config?.topK ?: 40,
            maxTokens = config?.maxTokens ?: 2048
        )

        val text = engine.generate(formatted, inferenceConfig)

        return ModelResponse(
            text = text,
            processingTimeMs = (System.currentTimeMillis() - startTime).toInt()
        )
    }

    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = flow {
        val formatted = PromptBuilder.buildChatPrompt(
            listOf(PromptBuilder.ChatMessage(PromptBuilder.ChatRole.USER, prompt)),
            template
        )

        val inferenceConfig = InferenceConfig(
            temperature = config?.temperature ?: 0.7f,
            topK = config?.topK ?: 40,
            maxTokens = config?.maxTokens ?: 2048
        )

        engine.generateStreaming(formatted, inferenceConfig).collect { token ->
            emit(token)
        }
    }

    fun unload() {
        engine.unload()
    }
}
