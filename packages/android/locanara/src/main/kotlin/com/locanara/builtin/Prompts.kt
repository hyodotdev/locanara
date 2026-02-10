package com.locanara.builtin

import com.locanara.core.PromptTemplate

/** Pre-built prompt templates for common on-device AI tasks */
object BuiltInPrompts {
    val summarize = PromptTemplate(
        template = """
            Summarize the following text into exactly {bulletCount} concise bullet point(s), each capturing a key point.

            Text to summarize:
            <input>{text}</input>
        """.trimIndent(),
        inputVariables = listOf("text", "bulletCount")
    )

    val classify = PromptTemplate(
        template = """
            Classify the following text into one or more of these categories: {categories}

            Return ONLY the matching categories with confidence scores, one per line, in this exact format:
            category: score

            Scores should be between 0.0 and 1.0 and sum to 1.0.
            Do not include any other text, headers, or explanation.

            Text to classify:
            <input>{text}</input>
        """.trimIndent(),
        inputVariables = listOf("text", "categories")
    )

    val extract = PromptTemplate(
        template = """
            Extract entities from the following text.
            Entity types to find: {entityTypes}

            Return ONLY a list of entities, one per line, in this exact format:
            type: value

            Do not include any other text, headers, numbering, or explanation.

            Text:
            <input>{text}</input>
        """.trimIndent(),
        inputVariables = listOf("text", "entityTypes")
    )

    val translate = PromptTemplate(
        template = """
            Translate the following text from {sourceLang} to {targetLang}.
            Provide ONLY the translation, no explanations or additional text.

            Text to translate:
            {text}
        """.trimIndent(),
        inputVariables = listOf("text", "sourceLang", "targetLang")
    )

    val rewrite = PromptTemplate(
        template = """
            Rewrite the following text {styleInstruction}
            Return ONLY the rewritten text with no labels, headers, or alternatives.

            Text to rewrite:
            <input>{text}</input>
        """.trimIndent(),
        inputVariables = listOf("text", "styleInstruction")
    )

    val proofread = PromptTemplate(
        template = """
            Proofread the following text for grammar, spelling, and punctuation errors.
            Return the corrected text.

            Text to proofread:
            <input>{text}</input>
        """.trimIndent(),
        inputVariables = listOf("text")
    )

    /** Clean up on-device model output: strip preambles and wrapping quotes. */
    fun stripPreamble(text: String): String {
        var result = text

        // Strip preamble lines (e.g. "Certainly! Here is...")
        val parts = result.split("\n\n", limit = 2)
        if (parts.size >= 2) {
            val first = parts[0].lowercase()
            val patterns = listOf("certainly", "sure", "of course", "here is", "here's", "below is", "here are")
            if (patterns.any { first.contains(it) }) {
                result = parts[1].trim()
            }
        }

        // Strip wrapping quotes the model sometimes adds
        if (result.startsWith("\"") && result.endsWith("\"") && result.length > 2) {
            result = result.substring(1, result.length - 1)
        }

        // Strip markdown formatting (bold, italic, headers)
        result = result.replace(Regex("\\*\\*(.+?)\\*\\*"), "$1")  // **bold**
        result = result.replace(Regex("(?<![*])\\*(?![*])(.+?)(?<![*])\\*(?![*])"), "$1")  // *italic*
        result = result.replace(Regex("^#{1,6}\\s+", RegexOption.MULTILINE), "")  // # headers

        return result
    }

    val chat = PromptTemplate(
        template = """
            {systemPrompt}

            {languageInstruction}

            {history}User: {text}
            Assistant:
        """.trimIndent(),
        inputVariables = listOf("text", "systemPrompt", "history", "languageInstruction")
    )
}
