package com.locanara.builtin

import com.locanara.Classification
import com.locanara.ClassifyResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for text classification.
 *
 * ```kotlin
 * val result = ClassifyChain(categories = listOf("positive", "negative")).run("Great product!")
 * println(result.topClassification.label) // "positive"
 * ```
 */
class ClassifyChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val categories: List<String> = listOf("positive", "negative", "neutral"),
    private val maxResults: Int = 3
) : Chain {
    override val name = "ClassifyChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt = BuiltInPrompts.classify.format(
            mapOf("text" to input.text, "categories" to categories.joinToString(", "))
        )

        println("[ClassifyChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val text = response.text.trim()
        println("[ClassifyChain] output: $text")

        var classifications = text.lines()
            .filter { it.isNotBlank() }
            .mapNotNull { line ->
                val trimmed = line.trim()
                val colonIndex = trimmed.lastIndexOf(':')
                if (colonIndex < 0) return@mapNotNull null
                val label = trimmed.substring(0, colonIndex).trim().lowercase()
                val scoreStr = trimmed.substring(colonIndex + 1).trim()
                val score = scoreStr.toDoubleOrNull() ?: return@mapNotNull null
                if (categories.none { it.lowercase() == label }) return@mapNotNull null
                Classification(label = label, score = score)
            }

        // Fallback: if parsing found nothing, match against known categories
        if (classifications.isEmpty()) {
            val lower = text.lowercase()
            val match = categories.firstOrNull { lower.contains(it.lowercase()) }
            classifications = listOf(Classification(label = (match ?: text).lowercase(), score = 1.0))
        }

        val sorted = classifications.sortedByDescending { it.score }.take(maxResults)
        val result = ClassifyResult(
            classifications = sorted,
            topClassification = sorted[0]
        )

        return ChainOutput(
            value = result,
            text = sorted[0].label,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Type-safe execution that returns [ClassifyResult] directly. */
    suspend fun run(text: String): ClassifyResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<ClassifyResult>()
            ?: throw IllegalStateException("Unexpected output type from ClassifyChain")
    }
}
