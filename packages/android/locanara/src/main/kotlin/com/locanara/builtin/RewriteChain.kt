package com.locanara.builtin

import com.locanara.RewriteOutputType
import com.locanara.RewriteResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for text rewriting in different styles.
 */
class RewriteChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val style: RewriteOutputType
) : Chain {
    override val name = "RewriteChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val styleInstruction = when (style) {
            RewriteOutputType.ELABORATE -> "to be more detailed and elaborate."
            RewriteOutputType.EMOJIFY -> "by adding appropriate emojis throughout."
            RewriteOutputType.SHORTEN -> "to be more concise."
            RewriteOutputType.FRIENDLY -> "in a friendly, casual tone."
            RewriteOutputType.PROFESSIONAL -> "in a professional, formal tone."
            RewriteOutputType.REPHRASE -> "using different words while keeping the same meaning."
        }

        val prompt = BuiltInPrompts.rewrite.format(
            mapOf("text" to input.text, "styleInstruction" to styleInstruction)
        )

        println("[RewriteChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val rewritten = BuiltInPrompts.stripPreamble(response.text.trim())
        println("[RewriteChain] output: $rewritten")

        val result = RewriteResult(
            rewrittenText = rewritten,
            style = style,
            alternatives = null,
            confidence = 0.88
        )

        return ChainOutput(
            value = result,
            text = rewritten,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Type-safe execution that returns [RewriteResult] directly. */
    suspend fun run(text: String): RewriteResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<RewriteResult>()
            ?: throw IllegalStateException("Unexpected output type from RewriteChain")
    }
}
