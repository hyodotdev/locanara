package expo.modules.ondeviceai

import com.locanara.RewriteOutputType
import com.locanara.composable.Memory
import com.locanara.composable.MemoryEntry
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput

/** Decodes JS options maps into chain constructor parameters */
object ExpoOndeviceAiHelper {
    // region Summarize

    fun bulletCount(options: Map<String, Any>?): Int {
        val outputType = options?.get("outputType") as? String
        return when (outputType) {
            "TWO_BULLETS" -> 2
            "THREE_BULLETS" -> 3
            else -> 1
        }
    }

    fun inputType(options: Map<String, Any>?): String =
        when (options?.get("inputType") as? String) {
            "CONVERSATION" -> "conversation"
            else -> "text"
        }

    // endregion

    // region Classify

    fun classifyOptions(options: Map<String, Any>?): Pair<List<String>, Int> {
        @Suppress("UNCHECKED_CAST")
        val categories =
            (options?.get("categories") as? List<String>)
                ?: listOf("positive", "negative", "neutral")
        val maxResults = (options?.get("maxResults") as? Number)?.toInt() ?: 3
        return Pair(categories, maxResults)
    }

    // endregion

    // region Extract

    fun entityTypes(options: Map<String, Any>?): List<String> {
        @Suppress("UNCHECKED_CAST")
        return (options?.get("entityTypes") as? List<String>)
            ?: listOf("person", "location", "date", "organization")
    }

    // endregion

    // region Chat

    @Suppress("UNCHECKED_CAST")
    fun chatOptions(options: Map<String, Any>?): Pair<String, Memory?> {
        val systemPrompt =
            (options?.get("systemPrompt") as? String)
                ?: "You are a friendly, helpful assistant."

        val historyArray = options?.get("history") as? List<Map<String, String>>
        val memory: Memory? =
            if (!historyArray.isNullOrEmpty()) {
                PrefilledMemory(historyArray)
            } else {
                null
            }

        return Pair(systemPrompt, memory)
    }

    // endregion

    // region Translate

    fun translateOptions(options: Map<String, Any>?): Pair<String, String> {
        val source = (options?.get("sourceLanguage") as? String) ?: "en"
        val target = (options?.get("targetLanguage") as? String) ?: "en"
        return Pair(source, target)
    }

    // endregion

    // region Rewrite

    fun rewriteStyle(options: Map<String, Any>?): RewriteOutputType {
        val outputType = options?.get("outputType") as? String
        return outputType?.let {
            runCatching { RewriteOutputType.valueOf(it) }.getOrNull()
        } ?: RewriteOutputType.REPHRASE
    }

    // endregion
}

/**
 * Memory adapter that provides pre-filled chat history from JS.
 */
private class PrefilledMemory(
    history: List<Map<String, String>>,
) : Memory {
    private val entries: List<MemoryEntry> =
        history.mapNotNull { msg ->
            val role = msg["role"] ?: return@mapNotNull null
            val content = msg["content"] ?: return@mapNotNull null
            MemoryEntry(role = role, content = content)
        }

    override suspend fun load(input: ChainInput): List<MemoryEntry> = entries

    override suspend fun save(
        input: ChainInput,
        output: ChainOutput,
    ) { }

    override suspend fun clear() { }

    override val estimatedTokenCount: Int
        get() = entries.sumOf { it.content.length / 4 }
}
