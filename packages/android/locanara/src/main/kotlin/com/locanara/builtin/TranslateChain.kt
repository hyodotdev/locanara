package com.locanara.builtin

import com.locanara.TranslateResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for language translation.
 */
class TranslateChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val sourceLanguage: String = "en",
    private val targetLanguage: String
) : Chain {
    override val name = "TranslateChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val sourceLang = java.util.Locale.forLanguageTag(sourceLanguage)
            .getDisplayLanguage(java.util.Locale.ENGLISH).ifEmpty { sourceLanguage }
        val targetLang = java.util.Locale.forLanguageTag(targetLanguage)
            .getDisplayLanguage(java.util.Locale.ENGLISH).ifEmpty { targetLanguage }

        val prompt = BuiltInPrompts.translate.format(
            mapOf("text" to input.text, "sourceLang" to sourceLang, "targetLang" to targetLang)
        )

        println("[TranslateChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val translated = BuiltInPrompts.stripPreamble(response.text.trim())
        println("[TranslateChain] output: $translated")

        val result = TranslateResult(
            translatedText = translated,
            sourceLanguage = sourceLanguage,
            targetLanguage = targetLanguage,
            confidence = 0.90
        )

        return ChainOutput(
            value = result,
            text = translated,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Type-safe execution that returns [TranslateResult] directly. */
    suspend fun run(text: String): TranslateResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<TranslateResult>()
            ?: throw IllegalStateException("Unexpected output type from TranslateChain")
    }
}
