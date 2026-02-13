package com.locanara.engine

import com.locanara.FeatureType

/**
 * Prompt builder for llama.cpp inference
 *
 * Formats prompts according to model-specific templates (Gemma, Llama, etc.)
 * Matches iOS PromptBuilder for cross-platform consistency.
 */
object PromptBuilder {

    /**
     * Supported model templates
     */
    enum class ModelTemplate {
        GEMMA,      // Google Gemma models
        LLAMA,      // Meta Llama models
        CHATML,     // ChatML format (many fine-tunes)
        RAW         // No special formatting
    }

    /**
     * Detect template from model filename
     */
    fun detectTemplate(modelPath: String): ModelTemplate {
        val lowerPath = modelPath.lowercase()
        return when {
            lowerPath.contains("gemma") -> ModelTemplate.GEMMA
            lowerPath.contains("llama") -> ModelTemplate.LLAMA
            lowerPath.contains("mistral") -> ModelTemplate.CHATML
            lowerPath.contains("phi") -> ModelTemplate.CHATML
            else -> ModelTemplate.GEMMA // Default to Gemma format
        }
    }

    /**
     * Build prompt for a feature
     */
    fun buildPrompt(
        feature: FeatureType,
        input: String,
        template: ModelTemplate,
        additionalContext: String? = null
    ): String {
        val systemPrompt = getSystemPrompt(feature)
        val userPrompt = getUserPrompt(feature, input, additionalContext)

        return formatWithTemplate(systemPrompt, userPrompt, template)
    }

    /**
     * Build chat prompt from conversation history
     */
    fun buildChatPrompt(
        messages: List<ChatMessage>,
        template: ModelTemplate,
        systemPrompt: String? = null
    ): String {
        return when (template) {
            ModelTemplate.GEMMA -> buildGemmaChat(messages, systemPrompt)
            ModelTemplate.LLAMA -> buildLlamaChat(messages, systemPrompt)
            ModelTemplate.CHATML -> buildChatMLChat(messages, systemPrompt)
            ModelTemplate.RAW -> messages.joinToString("\n") { "${it.role}: ${it.content}" }
        }
    }

    private fun getSystemPrompt(feature: FeatureType): String {
        return when (feature) {
            // Match iOS ProInferenceProvider prompts for consistency
            FeatureType.SUMMARIZE -> "You are a helpful assistant that summarizes text. Output in the same language as the input text. Do NOT translate."
            FeatureType.CLASSIFY -> "You are a text classifier. Respond with only the category name, nothing else."
            FeatureType.EXTRACT -> "You are an entity extraction assistant. Extract entities exactly as they appear in the text. Format each on a new line as 'type: value'."
            FeatureType.CHAT -> "You are a helpful assistant. Keep responses concise."
            FeatureType.TRANSLATE -> "You are a translator. Output ONLY the translation. Never mix languages."
            FeatureType.REWRITE -> "You are a writing assistant. Rewrite text according to instructions. Output only the rewritten text."
            FeatureType.PROOFREAD -> "You are a proofreader. Fix spelling and grammar errors. Output only the corrected text in the same language."
            FeatureType.DESCRIBE_IMAGE, FeatureType.DESCRIBE_IMAGE_ANDROID -> "You are an image description assistant. Describe the image in detail."
            FeatureType.GENERATE_IMAGE, FeatureType.GENERATE_IMAGE_IOS -> "You are an image generation assistant."
        }
    }

    private fun getUserPrompt(
        feature: FeatureType,
        input: String,
        additionalContext: String?
    ): String {
        val contextPrefix = additionalContext?.let { "Context: $it\n\n" } ?: ""

        return when (feature) {
            // Match iOS ProInferenceProvider prompts for consistency
            FeatureType.SUMMARIZE -> {
                // contextPrefix contains "Output exactly N bullet point(s)"
                // iOS format: "Summarize the following text in exactly N bullet point(s). Output in the same language as the input text. Do not translate.\n\nText:\n{input}"
                if (contextPrefix.isNotEmpty()) {
                    "$contextPrefix Output in the same language as the input text. Do not translate.\n\nText:\n$input"
                } else {
                    "Summarize the following text in exactly 1 bullet point. Output in the same language as the input text. Do not translate.\n\nText:\n$input"
                }
            }
            FeatureType.CLASSIFY -> {
                // iOS: "Classify the following text into one of these categories: {categories}\n\nText: {input}"
                "${contextPrefix}Classify the following text:\n\nText: $input"
            }
            FeatureType.EXTRACT -> {
                // iOS: "Extract all {types} from this text. Keep entity values in their original form:\n\n{input}"
                if (contextPrefix.isNotEmpty()) {
                    "$contextPrefix Keep entity values in their original form:\n\n$input"
                } else {
                    "Extract all entities from this text. Keep entity values in their original form:\n\n$input"
                }
            }
            FeatureType.CHAT -> input
            FeatureType.TRANSLATE -> {
                // iOS: "Translate the following text to {language}. Output only the translation:\n\n{input}"
                if (contextPrefix.isNotEmpty()) {
                    "$contextPrefix Output only the translation:\n\n$input"
                } else {
                    "Translate the following text. Output only the translation:\n\n$input"
                }
            }
            FeatureType.REWRITE -> {
                // iOS: "Rewrite this text {style}. Output in {language} only:\n\n{input}"
                if (contextPrefix.isNotEmpty()) {
                    "Rewrite this text with $contextPrefix:\n\n$input"
                } else {
                    "Rewrite this text:\n\n$input"
                }
            }
            FeatureType.PROOFREAD -> {
                // iOS: "Correct all spelling and grammar errors in this text. Keep the same language:\n\n{input}"
                "Correct all spelling and grammar errors in this text. Keep the same language:\n\n$input"
            }
            FeatureType.DESCRIBE_IMAGE, FeatureType.DESCRIBE_IMAGE_ANDROID -> "Describe what you see in this image."
            FeatureType.GENERATE_IMAGE, FeatureType.GENERATE_IMAGE_IOS -> input
        }
    }

    private fun formatWithTemplate(
        systemPrompt: String,
        userPrompt: String,
        template: ModelTemplate
    ): String {
        return when (template) {
            ModelTemplate.GEMMA -> """
                |<start_of_turn>user
                |$systemPrompt
                |
                |$userPrompt<end_of_turn>
                |<start_of_turn>model
            """.trimMargin()

            ModelTemplate.LLAMA -> """
                |<|begin_of_text|><|start_header_id|>system<|end_header_id|>
                |
                |$systemPrompt<|eot_id|><|start_header_id|>user<|end_header_id|>
                |
                |$userPrompt<|eot_id|><|start_header_id|>assistant<|end_header_id|>
                |
            """.trimMargin()

            ModelTemplate.CHATML -> """
                |<|im_start|>system
                |$systemPrompt<|im_end|>
                |<|im_start|>user
                |$userPrompt<|im_end|>
                |<|im_start|>assistant
            """.trimMargin()

            ModelTemplate.RAW -> "$systemPrompt\n\nUser: $userPrompt\n\nAssistant:"
        }
    }

    private fun buildGemmaChat(messages: List<ChatMessage>, systemPrompt: String?): String {
        val sb = StringBuilder()

        // Include system prompt in first user message if provided
        var systemIncluded = systemPrompt == null

        for (message in messages) {
            when (message.role) {
                ChatRole.USER -> {
                    sb.append("<start_of_turn>user\n")
                    if (!systemIncluded && systemPrompt != null) {
                        sb.append("$systemPrompt\n\n")
                        systemIncluded = true
                    }
                    sb.append("${message.content}<end_of_turn>\n")
                }
                ChatRole.ASSISTANT -> {
                    sb.append("<start_of_turn>model\n")
                    sb.append("${message.content}<end_of_turn>\n")
                }
                ChatRole.SYSTEM -> {
                    // Gemma handles system as part of user turn
                }
            }
        }

        sb.append("<start_of_turn>model\n")
        return sb.toString()
    }

    private fun buildLlamaChat(messages: List<ChatMessage>, systemPrompt: String?): String {
        val sb = StringBuilder()
        sb.append("<|begin_of_text|>")

        if (systemPrompt != null) {
            sb.append("<|start_header_id|>system<|end_header_id|>\n\n")
            sb.append("$systemPrompt<|eot_id|>")
        }

        for (message in messages) {
            val role = when (message.role) {
                ChatRole.USER -> "user"
                ChatRole.ASSISTANT -> "assistant"
                ChatRole.SYSTEM -> "system"
            }
            sb.append("<|start_header_id|>$role<|end_header_id|>\n\n")
            sb.append("${message.content}<|eot_id|>")
        }

        sb.append("<|start_header_id|>assistant<|end_header_id|>\n\n")
        return sb.toString()
    }

    private fun buildChatMLChat(messages: List<ChatMessage>, systemPrompt: String?): String {
        val sb = StringBuilder()

        if (systemPrompt != null) {
            sb.append("<|im_start|>system\n")
            sb.append("$systemPrompt<|im_end|>\n")
        }

        for (message in messages) {
            val role = when (message.role) {
                ChatRole.USER -> "user"
                ChatRole.ASSISTANT -> "assistant"
                ChatRole.SYSTEM -> "system"
            }
            sb.append("<|im_start|>$role\n")
            sb.append("${message.content}<|im_end|>\n")
        }

        sb.append("<|im_start|>assistant\n")
        return sb.toString()
    }

    /**
     * Extract the assistant's response from full LLM output
     *
     * ExecuTorch returns the full prompt + generated text, so we need to
     * extract only the generated portion after the assistant marker.
     */
    fun extractResponse(fullOutput: String, template: ModelTemplate): String {
        return when (template) {
            ModelTemplate.LLAMA -> {
                // Find the assistant header and extract content after it
                // Format: <|start_header_id|>assistant<|end_header_id|>\n\nRESPONSE<|eot_id|>
                val assistantMarker = "<|start_header_id|>assistant<|end_header_id|>"
                val endMarker = "<|eot_id|>"

                val assistantIndex = fullOutput.lastIndexOf(assistantMarker)
                if (assistantIndex != -1) {
                    val startIndex = assistantIndex + assistantMarker.length
                    var response = fullOutput.substring(startIndex)

                    // Remove leading newlines
                    response = response.trimStart('\n')

                    // Remove end token if present
                    val endIndex = response.indexOf(endMarker)
                    if (endIndex != -1) {
                        response = response.substring(0, endIndex)
                    }

                    // Also remove other end tokens
                    response = response
                        .replace("<|end_of_text|>", "")
                        .replace("<|eot_id|>", "")
                        .trim()

                    response
                } else {
                    // Fallback: return as-is if marker not found
                    fullOutput.trim()
                }
            }

            ModelTemplate.GEMMA -> {
                // Find the model response marker
                // Format: <start_of_turn>model\nRESPONSE<end_of_turn>
                val modelMarker = "<start_of_turn>model"
                val endMarker = "<end_of_turn>"

                val modelIndex = fullOutput.lastIndexOf(modelMarker)
                if (modelIndex != -1) {
                    val startIndex = modelIndex + modelMarker.length
                    var response = fullOutput.substring(startIndex)

                    // Remove leading newlines
                    response = response.trimStart('\n')

                    // Remove end token if present
                    val endIndex = response.indexOf(endMarker)
                    if (endIndex != -1) {
                        response = response.substring(0, endIndex)
                    }

                    response.trim()
                } else {
                    fullOutput.trim()
                }
            }

            ModelTemplate.CHATML -> {
                // Find the assistant response marker
                // Format: <|im_start|>assistant\nRESPONSE<|im_end|>
                val assistantMarker = "<|im_start|>assistant"
                val endMarker = "<|im_end|>"

                val assistantIndex = fullOutput.lastIndexOf(assistantMarker)
                if (assistantIndex != -1) {
                    val startIndex = assistantIndex + assistantMarker.length
                    var response = fullOutput.substring(startIndex)

                    // Remove leading newlines
                    response = response.trimStart('\n')

                    // Remove end token if present
                    val endIndex = response.indexOf(endMarker)
                    if (endIndex != -1) {
                        response = response.substring(0, endIndex)
                    }

                    response.trim()
                } else {
                    fullOutput.trim()
                }
            }

            ModelTemplate.RAW -> {
                // Find "Assistant:" marker
                val marker = "Assistant:"
                val index = fullOutput.lastIndexOf(marker)
                if (index != -1) {
                    fullOutput.substring(index + marker.length).trim()
                } else {
                    fullOutput.trim()
                }
            }
        }
    }

    /**
     * Chat message for building conversation prompts
     */
    data class ChatMessage(
        val role: ChatRole,
        val content: String
    )

    /**
     * Chat roles
     */
    enum class ChatRole {
        USER,
        ASSISTANT,
        SYSTEM
    }
}
