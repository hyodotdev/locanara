package com.locanara.builtin

import com.locanara.Entity
import com.locanara.ExtractResult
import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Built-in chain for entity extraction.
 *
 * ```kotlin
 * val result = ExtractChain(entityTypes = listOf("person", "location")).run("Tim Cook announced...")
 * println(result.entities.map { it.value })
 * ```
 */
class ExtractChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val entityTypes: List<String> = listOf("person", "location", "date", "organization")
) : Chain {
    override val name = "ExtractChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt = BuiltInPrompts.extract.format(
            mapOf("text" to input.text, "entityTypes" to entityTypes.joinToString(", "))
        )

        println("[ExtractChain] input: ${input.text.take(200)}")
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val text = response.text.trim()
        println("[ExtractChain] output: $text")

        val entities = text.lines()
            .filter { it.isNotBlank() }
            .mapNotNull { line ->
                val trimmed = line.trim()
                val colonIndex = trimmed.indexOf(':')
                if (colonIndex < 0) {
                    Entity(type = "extracted", value = trimmed, confidence = 0.8)
                } else {
                    val type = trimmed.substring(0, colonIndex).trim().lowercase()
                    val value = trimmed.substring(colonIndex + 1).trim()
                    if (value.isEmpty()) null
                    else Entity(type = type, value = value, confidence = 0.9)
                }
            }

        val result = ExtractResult(entities = entities)

        return ChainOutput(
            value = result,
            text = text,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    /** Type-safe execution that returns [ExtractResult] directly. */
    suspend fun run(text: String): ExtractResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<ExtractResult>()
            ?: throw IllegalStateException("Unexpected output type from ExtractChain")
    }
}
