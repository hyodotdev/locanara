package com.locanara.core

import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json

/**
 * Parses model output text into structured types.
 *
 * ```kotlin
 * val parser = JSONOutputParser(MyResponse.serializer())
 * val result = parser.parse(modelOutput)
 * ```
 */
interface OutputParser<T> {
    /** Instructions to include in the prompt to guide output format */
    val formatInstructions: String

    /** Parse raw model output text into the target type */
    fun parse(text: String): T
}

/**
 * Parses JSON output into serializable types
 */
class JSONOutputParser<T>(
    private val serializer: KSerializer<T>
) : OutputParser<T> {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    override val formatInstructions: String =
        "Respond ONLY with valid JSON matching the expected schema. No explanations."

    override fun parse(text: String): T {
        val cleaned = text
            .replace(Regex("```(?:json)?\\s*"), "")
            .replace("```", "")
            .trim()
        return json.decodeFromString(serializer, cleaned)
    }
}

/**
 * Passthrough parser for plain text
 */
class TextOutputParser : OutputParser<String> {
    override val formatInstructions: String = ""
    override fun parse(text: String): String = text.trim()
}

/**
 * Parses delimited list responses
 */
class ListOutputParser(
    private val delimiter: String = "\n"
) : OutputParser<List<String>> {
    override val formatInstructions: String =
        "Return items separated by '$delimiter', one per line."

    override fun parse(text: String): List<String> =
        text.split(delimiter).map { it.trim() }.filter { it.isNotEmpty() }
}
