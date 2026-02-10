package com.locanara.composable

import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel
import com.locanara.core.PromptTemplate
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope

/**
 * Core interface for composable AI processing pipelines.
 *
 * ```kotlin
 * val pipeline = SequentialChain(chains = listOf(summarizeChain, translateChain))
 * val result = pipeline.invoke(ChainInput(text = article))
 * ```
 */
interface Chain {
    /** Human-readable name for logging and debugging */
    val name: String

    /** Execute this chain with the given input */
    suspend fun invoke(input: ChainInput): ChainOutput
}

/**
 * Composes chains to run sequentially, passing output → input
 */
class SequentialChain(
    override val name: String = "SequentialChain",
    private val chains: List<Chain>
) : Chain {
    override suspend fun invoke(input: ChainInput): ChainOutput {
        var current = input
        var lastOutput: ChainOutput? = null

        for (chain in chains) {
            val output = chain.invoke(current)
            current = ChainInput(text = output.text, metadata = output.metadata)
            lastOutput = output
        }

        return lastOutput ?: throw IllegalStateException("SequentialChain has no chains")
    }
}

/**
 * Runs chains in parallel and collects results
 */
class ParallelChain(
    override val name: String = "ParallelChain",
    private val chains: List<Chain>
) : Chain {
    override suspend fun invoke(input: ChainInput): ChainOutput = coroutineScope {
        val results = chains.map { chain ->
            async { chain.invoke(input) }
        }.awaitAll()

        val combinedText = results.joinToString("\n---\n") { it.text }
        val combinedMetadata = input.metadata.toMutableMap()
        results.forEach { combinedMetadata.putAll(it.metadata) }

        ChainOutput(
            value = results,
            text = combinedText,
            metadata = combinedMetadata
        )
    }
}

/**
 * Routes to different chains based on a condition
 */
class ConditionalChain(
    override val name: String = "ConditionalChain",
    private val condition: (ChainInput) -> String,
    private val branches: Map<String, Chain>,
    private val defaultChain: Chain? = null
) : Chain {
    override suspend fun invoke(input: ChainInput): ChainOutput {
        val branchKey = condition(input)
        val chain = branches[branchKey] ?: defaultChain
            ?: throw IllegalStateException("No branch for key '$branchKey'")
        return chain.invoke(input)
    }
}

/**
 * A simple chain that sends input to a model and returns the response.
 */
class ModelChain(
    override val name: String = "ModelChain",
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val promptTemplate: PromptTemplate? = null,
    private val config: GenerationConfig? = null
) : Chain {
    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt: String = if (promptTemplate != null) {
            val values = input.metadata.toMutableMap()
            values["text"] = input.text
            promptTemplate.format(values)
        } else {
            input.text
        }

        val response = model.generate(prompt, config)

        return ChainOutput(
            value = response.text,
            text = response.text,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }
}
