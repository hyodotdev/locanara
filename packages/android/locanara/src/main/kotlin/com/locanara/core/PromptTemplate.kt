package com.locanara.core

/**
 * A reusable prompt template with variable interpolation.
 *
 * ```kotlin
 * val template = PromptTemplate(
 *     template = "Summarize into {count} points:\n{text}",
 *     inputVariables = listOf("count", "text")
 * )
 * val prompt = template.format(mapOf("count" to "3", "text" to article))
 * ```
 */
data class PromptTemplate(
    /** The template string with {variable} placeholders */
    val template: String,
    /** Required variable names */
    val inputVariables: List<String>,
    /** Optional system instruction prefix */
    val systemInstruction: String? = null
) {
    /** Format the template with provided values */
    fun format(values: Map<String, String>): String {
        for (variable in inputVariables) {
            require(values.containsKey(variable)) {
                "Missing template variable: $variable"
            }
        }

        var result = template
        for ((key, value) in values) {
            result = result.replace("{$key}", value)
        }

        return if (systemInstruction != null) {
            "System instruction: $systemInstruction\n\n$result"
        } else {
            result
        }
    }

    companion object {
        /** Create from a string, auto-detecting {variable} placeholders */
        fun from(template: String): PromptTemplate {
            val pattern = Regex("""\{(\w+)\}""")
            val variables = pattern.findAll(template).map { it.groupValues[1] }.toList()
            return PromptTemplate(template = template, inputVariables = variables)
        }
    }
}
