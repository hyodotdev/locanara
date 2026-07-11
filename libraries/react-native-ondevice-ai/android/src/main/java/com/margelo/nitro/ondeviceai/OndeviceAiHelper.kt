package com.margelo.nitro.ondeviceai

import com.locanara.ChatMessageInput
import com.locanara.ChatParametersInput
import com.locanara.DeviceCapability
import com.locanara.FeatureType
import com.locanara.ProofreadInputType
import com.locanara.RewriteOutputType
import com.locanara.SummarizeInputType
import com.locanara.SummarizeOutputType

/** Decodes Nitro option structs into Locanara chain constructor parameters */
object OndeviceAiHelper {
    private val wrapperFeatures =
        setOf(
            FeatureType.SUMMARIZE,
            FeatureType.CLASSIFY,
            FeatureType.EXTRACT,
            FeatureType.CHAT,
            FeatureType.TRANSLATE,
            FeatureType.REWRITE,
            FeatureType.PROOFREAD,
        )
    private val promptCapabilities = setOf("chat", "classify", "extract", "translate")

    fun isWrapperReady(capability: DeviceCapability): Boolean = capability.availableFeatures.any { it in wrapperFeatures }

    fun isWrapperSupported(capability: DeviceCapability): Boolean {
        val promptSupported =
            capability.modelInfo
                ?.geminiNanoAndroid
                ?.capabilities
                ?.any { it in promptCapabilities } == true
        return isWrapperReady(capability) || promptSupported
    }

    // region Summarize

    fun summarizeOutputType(options: Variant_NullType_NitroSummarizeOptions?): SummarizeOutputType {
        val opts = options?.asSecondOrNull()
        return when (opts?.outputType) {
            NitroSummarizeOutputType.TWO_BULLETS -> SummarizeOutputType.TWO_BULLETS
            NitroSummarizeOutputType.THREE_BULLETS -> SummarizeOutputType.THREE_BULLETS
            else -> SummarizeOutputType.ONE_BULLET
        }
    }

    fun summarizeInputType(options: Variant_NullType_NitroSummarizeOptions?): SummarizeInputType {
        val opts = options?.asSecondOrNull()
        return when (opts?.inputType) {
            NitroSummarizeInputType.CONVERSATION -> SummarizeInputType.CONVERSATION
            else -> SummarizeInputType.ARTICLE
        }
    }

    // endregion

    // region Classify

    fun classifyOptions(options: Variant_NullType_NitroClassifyOptions?): Pair<List<String>, Int> {
        val opts = options?.asSecondOrNull()
        val categories =
            opts?.categories?.asSecondOrNull()?.toList()
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

    fun chatParameters(options: Variant_NullType_NitroChatOptions?): ChatParametersInput {
        val opts = options?.asSecondOrNull()
        val systemPrompt =
            opts?.systemPrompt?.asSecondOrNull()
                ?: "You are a friendly, helpful assistant."

        val history =
            opts?.history?.asSecondOrNull()?.map { message ->
                ChatMessageInput(
                    role = message.role.name.lowercase(),
                    content = message.content,
                )
            }

        return ChatParametersInput(
            conversationId = opts?.conversationId?.asSecondOrNull(),
            systemPrompt = systemPrompt,
            history = history,
        )
    }

    // endregion

    // region Translate

    fun translateOptions(options: NitroTranslateOptions): Pair<String, String> = Pair(options.sourceLanguage, options.targetLanguage)

    // endregion

    // region Rewrite

    fun rewriteStyle(options: NitroRewriteOptions): RewriteOutputType =
        when (options.outputType) {
            NitroRewriteOutputType.ELABORATE -> RewriteOutputType.ELABORATE
            NitroRewriteOutputType.EMOJIFY -> RewriteOutputType.EMOJIFY
            NitroRewriteOutputType.SHORTEN -> RewriteOutputType.SHORTEN
            NitroRewriteOutputType.FRIENDLY -> RewriteOutputType.FRIENDLY
            NitroRewriteOutputType.PROFESSIONAL -> RewriteOutputType.PROFESSIONAL
            NitroRewriteOutputType.REPHRASE -> RewriteOutputType.REPHRASE
        }

    // endregion

    // region Proofread

    fun proofreadInputType(options: NitroProofreadOptions): ProofreadInputType =
        when (options.inputType) {
            NitroProofreadInputType.VOICE -> ProofreadInputType.VOICE
            NitroProofreadInputType.KEYBOARD -> ProofreadInputType.KEYBOARD
        }

    // endregion
}
