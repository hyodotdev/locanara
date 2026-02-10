package com.locanara.builtin

import com.locanara.ChatResult
import com.locanara.composable.Chain
import com.locanara.composable.Memory
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Built-in chain for conversational AI with memory support.
 *
 * ```kotlin
 * val chain = ChatChain(memory = BufferMemory())
 * val result = chain.run("Hello!")
 * println(result.message)
 * ```
 */
class ChatChain(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val memory: Memory? = null,
    private val systemPrompt: String = "You are a friendly, helpful assistant."
) : Chain {
    override val name = "ChatChain"

    /** Detect the dominant language of the input text using Unicode script analysis. */
    private fun detectLanguage(text: String): String {
        var korean = 0; var japanese = 0; var chinese = 0
        var arabic = 0; var cyrillic = 0; var thai = 0; var latin = 0
        for (ch in text) {
            when {
                ch in '\uAC00'..'\uD7AF' || ch in '\u1100'..'\u11FF' || ch in '\u3130'..'\u318F' -> korean++
                ch in '\u3040'..'\u309F' || ch in '\u30A0'..'\u30FF' -> japanese++
                ch in '\u4E00'..'\u9FFF' -> chinese++
                ch in '\u0600'..'\u06FF' -> arabic++
                ch in '\u0400'..'\u04FF' -> cyrillic++
                ch in '\u0E00'..'\u0E7F' -> thai++
                ch in 'A'..'Z' || ch in 'a'..'z' -> latin++
            }
        }
        val counts = mapOf(
            "Korean" to korean, "Japanese" to japanese, "Chinese" to chinese,
            "Arabic" to arabic, "Russian" to cyrillic, "Thai" to thai, "English" to latin
        )
        return counts.maxByOrNull { it.value }?.takeIf { it.value > 0 }?.key ?: "English"
    }

    override suspend fun invoke(input: ChainInput): ChainOutput {
        var historyText = ""
        memory?.let { mem ->
            val entries = mem.load(input)
            historyText = entries.joinToString("\n") {
                "${it.role.replaceFirstChar { c -> c.uppercase() }}: ${it.content}"
            } + "\n"
        }

        val detectedLang = detectLanguage(input.text)
        val languageInstruction = "IMPORTANT: You MUST reply in $detectedLang. Do NOT reply in any other language."

        val prompt = BuiltInPrompts.chat.format(
            mapOf(
                "text" to input.text,
                "systemPrompt" to "System instruction: $systemPrompt",
                "history" to historyText,
                "languageInstruction" to languageInstruction
            )
        )

        println("[ChatChain] detected language: $detectedLang")
        println("[ChatChain] input: ${input.text}")
        val response = model.generate(prompt, GenerationConfig.CONVERSATIONAL)
        val message = response.text.trim()
        println("[ChatChain] output: $message")

        val result = ChatResult(
            message = message,
            canContinue = true
        )

        val output = ChainOutput(
            value = result,
            text = message,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )

        memory?.save(input, output)

        return output
    }

    /** Type-safe execution that returns [ChatResult] directly. */
    suspend fun run(text: String): ChatResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<ChatResult>()
            ?: throw IllegalStateException("Unexpected output type from ChatChain")
    }

    /**
     * Stream a chat response, yielding text chunks as they arrive.
     * Memory is saved after the stream completes.
     */
    fun streamRun(text: String): Flow<String> = flow {
        val input = ChainInput(text = text)
        var historyText = ""
        memory?.let { mem ->
            val entries = mem.load(input)
            historyText = entries.joinToString("\n") {
                "${it.role.replaceFirstChar { c -> c.uppercase() }}: ${it.content}"
            } + "\n"
        }

        val detectedLang = detectLanguage(text)
        val languageInstruction = "IMPORTANT: You MUST reply in $detectedLang. Do NOT reply in any other language."

        val prompt = BuiltInPrompts.chat.format(
            mapOf(
                "text" to text,
                "systemPrompt" to "System instruction: $systemPrompt",
                "history" to historyText,
                "languageInstruction" to languageInstruction
            )
        )

        println("[ChatChain] streaming, detected language: $detectedLang")
        println("[ChatChain] input: $text")

        var accumulated = ""
        model.stream(prompt, GenerationConfig.CONVERSATIONAL).collect { chunk ->
            accumulated += chunk
            emit(chunk)
        }

        println("[ChatChain] output (streamed): $accumulated")

        memory?.let { mem ->
            val result = ChatResult(message = accumulated, canContinue = true)
            val output = ChainOutput(
                value = result,
                text = accumulated,
                metadata = input.metadata,
                processingTimeMs = null
            )
            mem.save(input, output)
        }
    }
}
