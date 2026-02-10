package com.locanara.composable

/**
 * A function that can be called by the model or agent.
 *
 * ```kotlin
 * val tool = FunctionTool(
 *     id = "weather",
 *     description = "Get current weather",
 *     parameterDescription = "city: City name"
 * ) { args -> "Sunny, 25°C in ${args["city"]}" }
 * ```
 */
interface Tool {
    /** Unique identifier for this tool */
    val id: String
    /** Human-readable description */
    val description: String
    /** Description of expected parameters */
    val parameterDescription: String

    /** Execute the tool with the given arguments */
    suspend fun execute(arguments: Map<String, String>): String
}

/**
 * A lambda-based tool implementation
 */
class FunctionTool(
    override val id: String,
    override val description: String,
    override val parameterDescription: String,
    private val handler: suspend (Map<String, String>) -> String
) : Tool {
    override suspend fun execute(arguments: Map<String, String>): String = handler(arguments)
}

/**
 * Built-in on-device document search tool
 */
class LocalSearchTool(
    private val documents: List<String>
) : Tool {
    override val id = "local_search"
    override val description = "Search through locally stored documents on-device"
    override val parameterDescription = "query: The search query string"

    override suspend fun execute(arguments: Map<String, String>): String {
        val query = arguments["query"]
            ?: throw IllegalArgumentException("Missing 'query' parameter")
        val results = documents.filter { it.contains(query, ignoreCase = true) }
        return if (results.isEmpty()) "No results found." else results.joinToString("\n")
    }
}
