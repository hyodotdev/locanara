package com.locanara.builtin

import com.locanara.ProofreadCorrection
import com.locanara.ProofreadResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for grammar and spelling correction.
 *
 * ```kotlin
 * val result = ProofreadChain().run("Ths is a tset")
 * println(result.correctedText) // "This is a test"
 * ```
 */
class ProofreadChain(
    private val model: LocanaraModel = LocanaraDefaults.model
) : Chain {
    override val name = "ProofreadChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt = BuiltInPrompts.proofread.format(
            mapOf("text" to input.text)
        )

        println("[ProofreadChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val corrected = BuiltInPrompts.stripPreamble(response.text.trim())
        println("[ProofreadChain] output: $corrected")

        val corrections = detectCorrections(input.text, corrected)
        println("[ProofreadChain] corrections: ${corrections.joinToString { "${it.original} → ${it.corrected}" }}")

        val result = ProofreadResult(
            correctedText = corrected,
            corrections = corrections,
            hasCorrections = corrections.isNotEmpty()
        )

        return ChainOutput(
            value = result,
            text = corrected,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Detect corrections by comparing original and corrected text word-by-word. */
    private fun detectCorrections(original: String, corrected: String): List<ProofreadCorrection> {
        val originalWords = original.split("\\s+".toRegex())
        val correctedWords = corrected.split("\\s+".toRegex())
        val corrections = mutableListOf<ProofreadCorrection>()

        val minLen = minOf(originalWords.size, correctedWords.size)
        var searchStart = 0
        for (i in 0 until minLen) {
            if (originalWords[i] != correctedWords[i]) {
                val origClean = originalWords[i].replace(Regex("[^a-zA-Z']"), "")
                val corrClean = correctedWords[i].replace(Regex("[^a-zA-Z']"), "")
                val type = if (origClean.equals(corrClean, ignoreCase = true)) "punctuation" else "spelling"

                val startPos = original.indexOf(originalWords[i], searchStart)
                val endPos = if (startPos >= 0) startPos + originalWords[i].length else null
                if (startPos >= 0) searchStart = startPos + originalWords[i].length

                corrections.add(
                    ProofreadCorrection(
                        original = originalWords[i],
                        corrected = correctedWords[i],
                        type = type,
                        confidence = 0.9,
                        startPos = if (startPos >= 0) startPos else null,
                        endPos = endPos
                    )
                )
            }
        }
        return corrections
    }

    /** Type-safe execution that returns [ProofreadResult] directly. */
    suspend fun run(text: String): ProofreadResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<ProofreadResult>()
            ?: throw IllegalStateException("Unexpected output type from ProofreadChain")
    }
}
