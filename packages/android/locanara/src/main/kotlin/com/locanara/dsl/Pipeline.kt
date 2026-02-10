package com.locanara.dsl

import com.locanara.ChatResult
import com.locanara.ClassifyResult
import com.locanara.ExtractResult
import com.locanara.ProofreadResult
import com.locanara.RewriteOutputType
import com.locanara.RewriteResult
import com.locanara.SummarizeResult
import com.locanara.TranslateResult
import com.locanara.builtin.ChatChain
import com.locanara.builtin.ClassifyChain
import com.locanara.builtin.ExtractChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import com.locanara.composable.Chain
import com.locanara.composable.Memory
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * A type-safe AI pipeline. The `Output` type is tracked at compile time
 * through each fluent method call — the last step determines the return type.
 *
 * ```kotlin
 * // Compiler knows this returns TranslateResult
 * val result = model.pipeline()
 *     .summarize(bulletCount = 3)
 *     .translate(to = "ko")
 *     .run("article text")
 *
 * // Compile error: Type mismatch
 * val wrong: SummarizeResult = model.pipeline()
 *     .summarize(bulletCount = 3)
 *     .translate(to = "ko")
 *     .run("text")
 * ```
 */
class Pipeline<Output> internal constructor(
    private val model: LocanaraModel = LocanaraDefaults.model,
    internal val steps: List<(LocanaraModel) -> Chain>
) {
    /** Execute the pipeline. Returns the concrete output type of the last step. */
    @Suppress("UNCHECKED_CAST")
    suspend fun run(text: String, metadata: MutableMap<String, String> = mutableMapOf()): Output {
        require(steps.isNotEmpty()) { "Pipeline has no steps" }

        var currentInput = ChainInput(text = text, metadata = metadata)
        var lastOutput: ChainOutput? = null

        for (factory in steps) {
            val chain = factory(model)
            lastOutput = chain.invoke(currentInput)
            currentInput = ChainInput(
                text = lastOutput.text,
                metadata = lastOutput.metadata
            )
        }

        return lastOutput!!.value as Output
    }

    // -- Fluent step methods. Each returns Pipeline<NewOutputType>. --

    fun summarize(bulletCount: Int = 1): Pipeline<SummarizeResult> =
        Pipeline(model, steps + { SummarizeChain(model = it, bulletCount = bulletCount) })

    fun classify(
        categories: List<String> = listOf("positive", "negative", "neutral"),
        maxResults: Int = 3
    ): Pipeline<ClassifyResult> =
        Pipeline(model, steps + { ClassifyChain(model = it, categories = categories, maxResults = maxResults) })

    fun extract(
        entityTypes: List<String> = listOf("person", "location", "date", "organization")
    ): Pipeline<ExtractResult> =
        Pipeline(model, steps + { ExtractChain(model = it, entityTypes = entityTypes) })

    fun chat(
        memory: Memory? = null,
        systemPrompt: String = "You are a friendly, helpful assistant. Respond naturally."
    ): Pipeline<ChatResult> =
        Pipeline(model, steps + { ChatChain(model = it, memory = memory, systemPrompt = systemPrompt) })

    fun translate(to: String, from: String = "en"): Pipeline<TranslateResult> =
        Pipeline(model, steps + { TranslateChain(model = it, sourceLanguage = from, targetLanguage = to) })

    fun rewrite(style: RewriteOutputType): Pipeline<RewriteResult> =
        Pipeline(model, steps + { RewriteChain(model = it, style = style) })

    fun proofread(): Pipeline<ProofreadResult> =
        Pipeline(model, steps + { ProofreadChain(model = it) })
}

/**
 * Start building a type-safe pipeline.
 *
 * ```kotlin
 * val result = model.pipeline()
 *     .summarize(bulletCount = 3)
 *     .translate(to = "ko")
 *     .run("text")
 * // result is TranslateResult - compiler enforced
 * ```
 */
fun LocanaraModel.pipeline(): Pipeline<Unit> = Pipeline(this, emptyList())
