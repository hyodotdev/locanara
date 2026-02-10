package com.locanara.runtime

import com.locanara.composable.Chain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import kotlinx.coroutines.delay

/**
 * Record of a chain execution for history and debugging
 */
data class ChainExecutionRecord(
    val chainName: String,
    val input: String,
    val output: String?,
    val processingTimeMs: Int,
    val success: Boolean,
    val attempt: Int,
    val timestamp: Double
)

/**
 * Chain execution engine with instrumentation, retries, and history tracking.
 *
 * ```kotlin
 * val executor = ChainExecutor(maxRetries = 1)
 * val output = executor.execute(summarizeChain, ChainInput(text = article))
 * println(executor.getHistory())
 * ```
 */
class ChainExecutor(
    private val maxRetries: Int = 1
) {
    private val history = mutableListOf<ChainExecutionRecord>()

    /** Execute a chain with timing, retries, and history tracking */
    suspend fun execute(chain: Chain, input: ChainInput): ChainOutput {
        val startTime = System.currentTimeMillis()
        var lastError: Exception? = null

        for (attempt in 0..maxRetries) {
            try {
                val output = chain.invoke(input)
                val endTime = System.currentTimeMillis()
                history.add(
                    ChainExecutionRecord(
                        chainName = chain.name,
                        input = input.text,
                        output = output.text,
                        processingTimeMs = (endTime - startTime).toInt(),
                        success = true,
                        attempt = attempt + 1,
                        timestamp = startTime.toDouble()
                    )
                )
                return output
            } catch (e: Exception) {
                lastError = e
                if (attempt < maxRetries) {
                    delay(100)
                }
            }
        }

        val endTime = System.currentTimeMillis()
        history.add(
            ChainExecutionRecord(
                chainName = chain.name,
                input = input.text,
                output = null,
                processingTimeMs = (endTime - startTime).toInt(),
                success = false,
                attempt = maxRetries + 1,
                timestamp = startTime.toDouble()
            )
        )
        throw lastError ?: IllegalStateException("Chain execution failed")
    }

    /** Get execution history */
    fun getHistory(): List<ChainExecutionRecord> = history.toList()

    /** Clear execution history */
    fun clearHistory() { history.clear() }
}
