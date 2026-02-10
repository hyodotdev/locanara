package com.locanara.runtime

import com.locanara.composable.BufferMemory
import com.locanara.composable.Chain
import com.locanara.composable.Guardrail
import com.locanara.composable.GuardrailResult
import com.locanara.composable.Memory
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel
import java.util.UUID

/**
 * A stateful AI session that manages conversation state, memory, and guardrails.
 *
 * ```kotlin
 * val session = Session(
 *     memory = BufferMemory(),
 *     guardrails = listOf(InputLengthGuardrail())
 * )
 * val response = session.send("Hello!")
 * ```
 */
class Session(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val memory: Memory = BufferMemory(),
    private val guardrails: List<Guardrail> = emptyList()
) {
    val id: String = UUID.randomUUID().toString()

    /** Send a message and get a response, maintaining conversation state */
    suspend fun send(message: String): String {
        var processedText = message
        for (guardrail in guardrails) {
            when (val result = guardrail.checkInput(ChainInput(processedText))) {
                is GuardrailResult.Passed -> continue
                is GuardrailResult.Blocked ->
                    throw IllegalArgumentException("Blocked: ${result.reason}")
                is GuardrailResult.Modified -> processedText = result.newText
            }
        }

        val input = ChainInput(processedText)
        val entries = memory.load(input)
        val prompt = buildString {
            entries.forEach { appendLine("${it.role}: ${it.content}") }
            appendLine("User: $processedText")
            append("Assistant:")
        }

        val response = model.generate(prompt, GenerationConfig.CONVERSATIONAL)

        var outputText = response.text
        val output = ChainOutput(outputText, outputText)
        for (guardrail in guardrails) {
            when (val result = guardrail.checkOutput(output)) {
                is GuardrailResult.Passed -> continue
                is GuardrailResult.Blocked ->
                    throw IllegalStateException("Blocked: ${result.reason}")
                is GuardrailResult.Modified -> outputText = result.newText
            }
        }

        memory.save(input, ChainOutput(outputText, outputText))
        return outputText
    }

    /** Run a built-in chain within this session context */
    suspend fun run(chain: Chain, input: String): ChainOutput {
        return chain.invoke(ChainInput(input))
    }

    /** Clear session memory */
    suspend fun reset() {
        memory.clear()
    }
}
