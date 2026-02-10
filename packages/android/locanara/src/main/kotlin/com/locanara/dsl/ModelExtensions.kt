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
import com.locanara.composable.Memory
import com.locanara.core.LocanaraModel

/**
 * ```kotlin
 * val result = model.summarize("article text", bulletCount = 3)
 * println(result.summary)
 * ```
 */
suspend fun LocanaraModel.summarize(text: String, bulletCount: Int = 1): SummarizeResult =
    SummarizeChain(model = this, bulletCount = bulletCount).run(text)

/**
 * ```kotlin
 * val result = model.classify("Great product!", categories = listOf("positive", "negative"))
 * println(result.topClassification.label)
 * ```
 */
suspend fun LocanaraModel.classify(
    text: String,
    categories: List<String> = listOf("positive", "negative", "neutral"),
    maxResults: Int = 3
): ClassifyResult =
    ClassifyChain(model = this, categories = categories, maxResults = maxResults).run(text)

/**
 * ```kotlin
 * val result = model.extract("Tim Cook announced...", entityTypes = listOf("person", "location"))
 * println(result.entities.map { it.value })
 * ```
 */
suspend fun LocanaraModel.extract(
    text: String,
    entityTypes: List<String> = listOf("person", "location", "date", "organization")
): ExtractResult =
    ExtractChain(model = this, entityTypes = entityTypes).run(text)

/**
 * ```kotlin
 * val result = model.chat("Hello!")
 * println(result.message)
 * ```
 */
suspend fun LocanaraModel.chat(
    text: String,
    memory: Memory? = null,
    systemPrompt: String = "You are a friendly, helpful assistant. Respond naturally."
): ChatResult =
    ChatChain(model = this, memory = memory, systemPrompt = systemPrompt).run(text)

/**
 * ```kotlin
 * val result = model.translate("Hello world", to = "ko")
 * println(result.translatedText)
 * ```
 */
suspend fun LocanaraModel.translate(
    text: String,
    to: String,
    from: String = "en"
): TranslateResult =
    TranslateChain(model = this, sourceLanguage = from, targetLanguage = to).run(text)

/**
 * ```kotlin
 * val result = model.rewrite("hey whats up", style = RewriteOutputType.PROFESSIONAL)
 * println(result.rewrittenText)
 * ```
 */
suspend fun LocanaraModel.rewrite(text: String, style: RewriteOutputType): RewriteResult =
    RewriteChain(model = this, style = style).run(text)

/**
 * ```kotlin
 * val result = model.proofread("Ths is a tset")
 * println(result.correctedText)
 * ```
 */
suspend fun LocanaraModel.proofread(text: String): ProofreadResult =
    ProofreadChain(model = this).run(text)
