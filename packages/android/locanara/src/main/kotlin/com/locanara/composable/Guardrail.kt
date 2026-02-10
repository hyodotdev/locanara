package com.locanara.composable

import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput

/**
 * Result of a guardrail check
 */
sealed class GuardrailResult {
    data object Passed : GuardrailResult()
    data class Blocked(val reason: String) : GuardrailResult()
    data class Modified(val newText: String, val reason: String) : GuardrailResult()
}

/**
 * Input/output validation and safety interface
 */
interface Guardrail {
    val name: String

    /** Check input before it reaches the model */
    suspend fun checkInput(input: ChainInput): GuardrailResult

    /** Check output before it is returned to the caller */
    suspend fun checkOutput(output: ChainOutput): GuardrailResult
}

/**
 * Validates input length against model constraints
 */
class InputLengthGuardrail(
    private val maxCharacters: Int = 16000,
    private val truncate: Boolean = true
) : Guardrail {
    override val name = "InputLengthGuardrail"

    override suspend fun checkInput(input: ChainInput): GuardrailResult {
        if (input.text.length <= maxCharacters) return GuardrailResult.Passed
        return if (truncate) {
            GuardrailResult.Modified(
                input.text.take(maxCharacters),
                "Input truncated from ${input.text.length} to $maxCharacters characters"
            )
        } else {
            GuardrailResult.Blocked("Input exceeds maximum length of $maxCharacters characters")
        }
    }

    override suspend fun checkOutput(output: ChainOutput) = GuardrailResult.Passed
}

/**
 * Blocks or filters sensitive content patterns
 */
class ContentFilterGuardrail(
    private val blockedPatterns: List<String> = emptyList()
) : Guardrail {
    override val name = "ContentFilterGuardrail"

    override suspend fun checkInput(input: ChainInput): GuardrailResult {
        for (pattern in blockedPatterns) {
            if (input.text.contains(pattern, ignoreCase = true)) {
                return GuardrailResult.Blocked("Input contains blocked content")
            }
        }
        return GuardrailResult.Passed
    }

    override suspend fun checkOutput(output: ChainOutput): GuardrailResult {
        for (pattern in blockedPatterns) {
            if (output.text.contains(pattern, ignoreCase = true)) {
                return GuardrailResult.Blocked("Output contains blocked content")
            }
        }
        return GuardrailResult.Passed
    }
}

/**
 * Wraps a chain with guardrail checks on input and output
 */
class GuardedChain(
    private val chain: Chain,
    private val guardrails: List<Guardrail>,
    override val name: String = "Guarded(${chain.name})"
) : Chain {
    override suspend fun invoke(input: ChainInput): ChainOutput {
        var currentInput = input

        for (guardrail in guardrails) {
            when (val result = guardrail.checkInput(currentInput)) {
                is GuardrailResult.Passed -> continue
                is GuardrailResult.Blocked ->
                    throw IllegalArgumentException("Blocked by ${guardrail.name}: ${result.reason}")
                is GuardrailResult.Modified ->
                    currentInput = ChainInput(result.newText, currentInput.metadata)
            }
        }

        val output = chain.invoke(currentInput)

        for (guardrail in guardrails) {
            when (val result = guardrail.checkOutput(output)) {
                is GuardrailResult.Passed -> continue
                is GuardrailResult.Blocked ->
                    throw IllegalStateException("Output blocked by ${guardrail.name}: ${result.reason}")
                is GuardrailResult.Modified ->
                    return ChainOutput(result.newText, result.newText, output.metadata, output.processingTimeMs)
            }
        }

        return output
    }
}
