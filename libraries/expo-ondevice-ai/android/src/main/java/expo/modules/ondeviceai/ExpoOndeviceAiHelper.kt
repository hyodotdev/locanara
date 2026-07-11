package expo.modules.ondeviceai

import com.locanara.ChatMessageInput
import com.locanara.ChatParametersInput
import com.locanara.ProofreadInputType
import com.locanara.RewriteOutputType
import com.locanara.SummarizeInputType
import com.locanara.SummarizeOutputType

/** Decodes JS options maps into chain constructor parameters */
object ExpoOndeviceAiHelper {
    // region Summarize

    fun summarizeOutputType(options: Map<String, Any>?): SummarizeOutputType =
        when (options?.get("outputType") as? String) {
            "TWO_BULLETS" -> SummarizeOutputType.TWO_BULLETS
            "THREE_BULLETS" -> SummarizeOutputType.THREE_BULLETS
            else -> SummarizeOutputType.ONE_BULLET
        }

    fun summarizeInputType(options: Map<String, Any>?): SummarizeInputType =
        when (options?.get("inputType") as? String) {
            "CONVERSATION" -> SummarizeInputType.CONVERSATION
            else -> SummarizeInputType.ARTICLE
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

    fun extractOptions(options: Map<String, Any>?): Pair<List<String>, Boolean> {
        @Suppress("UNCHECKED_CAST")
        val entityTypes =
            (options?.get("entityTypes") as? List<String>)
                ?: listOf("person", "location", "date", "organization")
        val extractKeyValues = options?.get("extractKeyValues") as? Boolean ?: false
        return Pair(entityTypes, extractKeyValues)
    }

    // endregion

    // region Chat

    @Suppress("UNCHECKED_CAST")
    fun chatParameters(options: Map<String, Any>?): ChatParametersInput {
        val systemPrompt =
            (options?.get("systemPrompt") as? String)
                ?: "You are a friendly, helpful assistant."

        val historyArray = options?.get("history") as? List<Map<String, String>>
        val history =
            historyArray?.mapNotNull { message ->
                val role = message["role"] ?: return@mapNotNull null
                val content = message["content"] ?: return@mapNotNull null
                ChatMessageInput(role = role, content = content)
            }

        return ChatParametersInput(
            conversationId = options?.get("conversationId") as? String,
            systemPrompt = systemPrompt,
            history = history,
        )
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

    // region Proofread

    fun proofreadInputType(options: Map<String, Any>?): ProofreadInputType =
        when (options?.get("inputType") as? String) {
            "VOICE" -> ProofreadInputType.VOICE
            else -> ProofreadInputType.KEYBOARD
        }

    // endregion
}
