package com.locanara.composable

import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * A single entry in conversation memory
 */
data class MemoryEntry(
    val role: String,
    val content: String,
    val timestamp: Double = System.currentTimeMillis().toDouble()
)

/**
 * Protocol for conversation/context memory management.
 * Designed for on-device models with small context windows (~4000 tokens).
 */
interface Memory {
    /** Load relevant memory for the given input */
    suspend fun load(input: ChainInput): List<MemoryEntry>

    /** Save a new input/output pair to memory */
    suspend fun save(input: ChainInput, output: ChainOutput)

    /** Clear all stored memory */
    suspend fun clear()

    /** Current estimated token count for stored context */
    val estimatedTokenCount: Int
}

/**
 * Buffer memory that keeps the last N conversation turns.
 *
 * ```kotlin
 * val memory = BufferMemory(maxEntries = 10, maxTokens = 2000)
 * memory.save(input, output)
 * val entries = memory.load(nextInput)
 * ```
 */
class BufferMemory(
    private val maxEntries: Int = 10,
    private val maxTokens: Int = 2000
) : Memory {
    private val entries = mutableListOf<MemoryEntry>()

    override suspend fun load(input: ChainInput): List<MemoryEntry> = entries.toList()

    override suspend fun save(input: ChainInput, output: ChainOutput) {
        entries.add(MemoryEntry("user", input.text))
        entries.add(MemoryEntry("assistant", output.text))

        while (entries.size > maxEntries * 2) entries.removeAt(0)
        while (estimatedTokenCount > maxTokens && entries.size > 2) entries.removeAt(0)
    }

    override suspend fun clear() { entries.clear() }

    override val estimatedTokenCount: Int
        get() = entries.sumOf { it.content.length / 4 }
}

/**
 * Summary memory that compresses older messages into a summary.
 * Ideal for long conversations on models with small context windows.
 */
class SummaryMemory(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val recentWindowSize: Int = 4
) : Memory {
    private val recentEntries = mutableListOf<MemoryEntry>()
    private var summary: String = ""

    override suspend fun load(input: ChainInput): List<MemoryEntry> {
        val result = mutableListOf<MemoryEntry>()
        if (summary.isNotEmpty()) {
            result.add(MemoryEntry("system", "Previous conversation summary: $summary", 0.0))
        }
        result.addAll(recentEntries)
        return result
    }

    override suspend fun save(input: ChainInput, output: ChainOutput) {
        recentEntries.add(MemoryEntry("user", input.text))
        recentEntries.add(MemoryEntry("assistant", output.text))

        if (recentEntries.size > recentWindowSize * 2) {
            val toSummarize = recentEntries.take(2)
            repeat(2) { recentEntries.removeAt(0) }

            val conversationText = toSummarize.joinToString("\n") { "${it.role}: ${it.content}" }
            val currentSummary = if (summary.isEmpty()) "" else "Existing summary: $summary\n\n"
            val prompt = "${currentSummary}Summarize this conversation exchange in one concise sentence:\n$conversationText"

            try {
                val response = model.generate(prompt, GenerationConfig.STRUCTURED)
                summary = response.text
            } catch (_: Exception) { /* Keep existing summary on failure */ }
        }
    }

    override suspend fun clear() {
        recentEntries.clear()
        summary = ""
    }

    override val estimatedTokenCount: Int
        get() = (summary.length / 4) + recentEntries.sumOf { it.content.length / 4 }
}
