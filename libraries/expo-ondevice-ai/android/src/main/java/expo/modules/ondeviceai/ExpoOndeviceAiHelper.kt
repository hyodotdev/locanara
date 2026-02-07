package expo.modules.ondeviceai

import com.locanara.*

/// Decodes JS options maps into Locanara SDK input types
object ExpoOndeviceAiHelper {

    fun buildFeatureInput(
        feature: FeatureType,
        text: String,
        options: Map<String, Any>?
    ): ExecuteFeatureInput {
        val parameters = decodeParameters(feature, options)
        return ExecuteFeatureInput(
            feature = feature,
            input = text,
            parameters = parameters
        )
    }

    // MARK: - Parameter Decoding

    private fun decodeParameters(
        feature: FeatureType,
        options: Map<String, Any>?
    ): FeatureParametersInput? {
        val opts = options ?: return null

        return when (feature) {
            FeatureType.SUMMARIZE -> decodeSummarize(opts)
            FeatureType.CLASSIFY -> decodeClassify(opts)
            FeatureType.EXTRACT -> decodeExtract(opts)
            FeatureType.CHAT -> decodeChat(opts)
            FeatureType.TRANSLATE -> decodeTranslate(opts)
            FeatureType.REWRITE -> decodeRewrite(opts)
            FeatureType.PROOFREAD -> decodeProofread(opts)
            else -> null
        }
    }

    private fun decodeSummarize(opts: Map<String, Any>): FeatureParametersInput? {
        val inputType = (opts["inputType"] as? String)?.let {
            runCatching { SummarizeInputType.valueOf(it) }.getOrNull()
        }
        val outputType = (opts["outputType"] as? String)?.let {
            runCatching { SummarizeOutputType.valueOf(it) }.getOrNull()
        }
        if (inputType == null && outputType == null) return null
        return FeatureParametersInput(
            summarize = SummarizeParametersInput(inputType = inputType, outputType = outputType)
        )
    }

    private fun decodeClassify(opts: Map<String, Any>): FeatureParametersInput? {
        @Suppress("UNCHECKED_CAST")
        val categories = opts["categories"] as? List<String>
        val maxResults = (opts["maxResults"] as? Number)?.toInt()
        if (categories == null && maxResults == null) return null
        return FeatureParametersInput(
            classify = ClassifyParametersInput(categories = categories, maxResults = maxResults)
        )
    }

    private fun decodeExtract(opts: Map<String, Any>): FeatureParametersInput? {
        @Suppress("UNCHECKED_CAST")
        val entityTypes = opts["entityTypes"] as? List<String>
        val extractKeyValues = opts["extractKeyValues"] as? Boolean
        if (entityTypes == null && extractKeyValues == null) return null
        return FeatureParametersInput(
            extract = ExtractParametersInput(entityTypes = entityTypes, extractKeyValues = extractKeyValues)
        )
    }

    /**
     * Public helper to decode chat parameters from JS options map.
     * Used by chatStream bridge to extract ChatParametersInput directly.
     */
    @Suppress("UNCHECKED_CAST")
    fun decodeChatParameters(opts: Map<String, Any>?): ChatParametersInput? {
        val options = opts ?: return null
        val conversationId = options["conversationId"] as? String
        val systemPrompt = options["systemPrompt"] as? String
        val history = (options["history"] as? List<Map<String, String>>)?.mapNotNull { msg ->
            val role = msg["role"] ?: return@mapNotNull null
            val content = msg["content"] ?: return@mapNotNull null
            ChatMessageInput(role = role, content = content)
        }
        return ChatParametersInput(
            conversationId = conversationId,
            systemPrompt = systemPrompt,
            history = history
        )
    }

    @Suppress("UNCHECKED_CAST")
    private fun decodeChat(opts: Map<String, Any>): FeatureParametersInput {
        val conversationId = opts["conversationId"] as? String
        val systemPrompt = opts["systemPrompt"] as? String
        val history = (opts["history"] as? List<Map<String, String>>)?.mapNotNull { msg ->
            val role = msg["role"] ?: return@mapNotNull null
            val content = msg["content"] ?: return@mapNotNull null
            ChatMessageInput(role = role, content = content)
        }
        return FeatureParametersInput(
            chat = ChatParametersInput(
                conversationId = conversationId,
                systemPrompt = systemPrompt,
                history = history
            )
        )
    }

    private fun decodeTranslate(opts: Map<String, Any>): FeatureParametersInput? {
        val targetLanguage = opts["targetLanguage"] as? String ?: return null
        val sourceLanguage = opts["sourceLanguage"] as? String
        return FeatureParametersInput(
            translate = TranslateParametersInput(
                sourceLanguage = sourceLanguage,
                targetLanguage = targetLanguage
            )
        )
    }

    private fun decodeRewrite(opts: Map<String, Any>): FeatureParametersInput? {
        val outputType = (opts["outputType"] as? String)?.let {
            runCatching { RewriteOutputType.valueOf(it) }.getOrNull()
        } ?: return null
        return FeatureParametersInput(
            rewrite = RewriteParametersInput(outputType = outputType)
        )
    }

    private fun decodeProofread(opts: Map<String, Any>): FeatureParametersInput? {
        val inputType = (opts["inputType"] as? String)?.let {
            runCatching { ProofreadInputType.valueOf(it) }.getOrNull()
        }
        if (inputType == null) return null
        return FeatureParametersInput(
            proofread = ProofreadParametersInput(inputType = inputType)
        )
    }
}
