package com.margelo.nitro.ondeviceai

import com.locanara.RewriteOutputType
import com.locanara.composable.Memory
import com.locanara.composable.MemoryEntry
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput

/** Decodes Nitro option structs into Locanara chain constructor parameters */
object OndeviceAiHelper {

    // region Summarize

    fun bulletCount(options: Variant_NullType_NitroSummarizeOptions?): Int {
        val opts = options?.asSecondOrNull()
        return when (opts?.outputType) {
            NitroSummarizeOutputType.TWO_BULLETS -> 2
            NitroSummarizeOutputType.THREE_BULLETS -> 3
            else -> 1
        }
    }

    fun inputType(options: Variant_NullType_NitroSummarizeOptions?): String {
        val opts = options?.asSecondOrNull()
        return when (opts?.inputType) {
            NitroSummarizeInputType.CONVERSATION -> "conversation"
            else -> "text"
        }
    }

    // endregion

    // region Classify

    fun classifyOptions(options: Variant_NullType_NitroClassifyOptions?): Pair<List<String>, Int> {
        val opts = options?.asSecondOrNull()
        val categories = opts?.categories?.asSecondOrNull()?.toList()
            ?: listOf("positive", "negative", "neutral")
        val maxResults = opts?.maxResults?.asSecondOrNull()?.toInt() ?: 3
        return Pair(categories, maxResults)
    }

    // endregion

    // region Extract

    fun entityTypes(options: Variant_NullType_NitroExtractOptions?): List<String> {
        val opts = options?.asSecondOrNull()
        return opts?.entityTypes?.asSecondOrNull()?.toList()
            ?: listOf("person", "location", "date", "organization")
    }

    // endregion

    // region Chat

    fun chatOptions(options: Variant_NullType_NitroChatOptions?): Pair<String, Memory?> {
        val opts = options?.asSecondOrNull()
        val systemPrompt = opts?.systemPrompt?.asSecondOrNull()
            ?: "You are a friendly, helpful assistant."

        val history = opts?.history?.asSecondOrNull()?.toList()
        val memory: Memory? = if (!history.isNullOrEmpty()) {
            PrefilledMemory(history)
        } else {
            null
        }

        return Pair(systemPrompt, memory)
    }

    // endregion

    // region Translate

    fun translateOptions(options: NitroTranslateOptions): Pair<String, String> {
        return Pair(options.sourceLanguage, options.targetLanguage)
    }

    // endregion

    // region Rewrite

    fun rewriteStyle(options: NitroRewriteOptions): RewriteOutputType {
        return when (options.outputType) {
            NitroRewriteOutputType.ELABORATE -> RewriteOutputType.ELABORATE
            NitroRewriteOutputType.EMOJIFY -> RewriteOutputType.EMOJIFY
            NitroRewriteOutputType.SHORTEN -> RewriteOutputType.SHORTEN
            NitroRewriteOutputType.FRIENDLY -> RewriteOutputType.FRIENDLY
            NitroRewriteOutputType.PROFESSIONAL -> RewriteOutputType.PROFESSIONAL
            NitroRewriteOutputType.REPHRASE -> RewriteOutputType.REPHRASE
        }
    }

    // endregion
}

/**
 * Memory adapter that provides pre-filled chat history from JS.
 */
private class PrefilledMemory(
    history: List<NitroChatMessage>,
) : Memory {
    private val entries: List<MemoryEntry> =
        history.map { msg ->
            MemoryEntry(role = msg.role.name.lowercase(), content = msg.content)
        }

    override suspend fun load(input: ChainInput): List<MemoryEntry> = entries

    override suspend fun save(input: ChainInput, output: ChainOutput) { }

    override suspend fun clear() { }

    override val estimatedTokenCount: Int
        get() = entries.sumOf { it.content.length / 4 }
}
