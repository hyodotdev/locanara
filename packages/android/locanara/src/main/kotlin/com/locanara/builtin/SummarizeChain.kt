package com.locanara.builtin

import com.locanara.SummarizeResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for text summarization.
 *
 * ```kotlin
 * val result = SummarizeChain(bulletCount = 3).run("article text")
 * println(result.summary)
 * ```
 */
class SummarizeChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val bulletCount: Int = 1,
    private val inputType: String = "text"
) : Chain {
    override val name = "SummarizeChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt = BuiltInPrompts.summarize.format(
            mapOf("text" to input.text, "bulletCount" to bulletCount.toString(), "inputTypeHint" to inputType)
        )

        println("[SummarizeChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val summary = BuiltInPrompts.stripPreamble(response.text.trim())
        println("[SummarizeChain] output: $summary")

        val result = SummarizeResult(
            summary = summary,
            originalLength = input.text.length,
            summaryLength = summary.length,
            confidence = 0.95
        )

        return ChainOutput(
            value = result,
            text = summary,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Type-safe execution that returns [SummarizeResult] directly. */
    suspend fun run(text: String): SummarizeResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<SummarizeResult>()
            ?: throw IllegalStateException("Unexpected output type from SummarizeChain")
    }
}
