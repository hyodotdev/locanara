package com.locanara

import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraModel
import com.locanara.core.ModelResponse
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow

// MARK: - Shared Mock Helpers

/**
 * A configurable mock model for testing.
 * @param responseGenerator A function that returns a response for a given prompt.
 */
class MockModel(
    private val responseGenerator: (String) -> String = { "mock response" }
) : LocanaraModel {
    override val name = "MockModel"
    override val isReady = true
    override val maxContextTokens = 4000

    override suspend fun generate(prompt: String, config: GenerationConfig?): ModelResponse {
        val text = responseGenerator(prompt)
        return ModelResponse(text = text, processingTimeMs = 5)
    }

    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = emptyFlow()
}

/**
 * Creates a [LocanaraModel] stub that always throws the given [LocanaraException] when
 * [generate] is called. Used to test error propagation through chains.
 */
fun failingModel(error: LocanaraException): LocanaraModel = object : LocanaraModel {
    override val name = "FailingModel"
    override val isReady = true
    override val maxContextTokens = 4000
    override suspend fun generate(prompt: String, config: GenerationConfig?): ModelResponse = throw error
    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = emptyFlow()
}
