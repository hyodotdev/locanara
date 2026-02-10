package com.locanara.runtime

import com.locanara.composable.Chain
import com.locanara.composable.Memory
import com.locanara.composable.Tool
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraDefaults
import com.locanara.core.LocanaraModel

/**
 * Configuration for an on-device agent
 */
data class AgentConfig(
    /** Maximum number of reasoning/action steps */
    val maxSteps: Int = 3,
    /** Available tools the agent can call */
    val tools: List<Tool> = emptyList(),
    /** Available chains the agent can invoke */
    val chains: List<Chain> = emptyList(),
    /** System prompt for the agent */
    val systemPrompt: String? = null
)

data class AgentStep(
    val thought: String,
    val action: String,
    val input: String,
    val observation: String?
)

data class AgentResult(
    val answer: String,
    val steps: List<AgentStep>,
    val totalSteps: Int
)

/**
 * An on-device agent that reasons about which tools/chains to use.
 * Uses a simplified ReAct pattern optimized for small models.
 *
 * ```kotlin
 * val agent = Agent(
 *     config = AgentConfig(
 *         maxSteps = 3,
 *         tools = listOf(weatherTool),
 *         chains = listOf(summarizeChain)
 *     )
 * )
 * val result = agent.run("What's the weather?")
 * ```
 */
class Agent(
    private val model: LocanaraModel = LocanaraDefaults.model,
    private val config: AgentConfig,
    private val memory: Memory? = null
) {
    suspend fun run(query: String): AgentResult {
        val steps = mutableListOf<AgentStep>()
        val input = ChainInput(query)

        val toolDescriptions = config.tools.joinToString("\n") { "- ${it.id}: ${it.description}" }
        val chainDescriptions = config.chains.joinToString("\n") { "- ${it.name}: on-device AI chain" }

        val memoryContext = memory?.load(input)
            ?.joinToString("\n") { "${it.role}: ${it.content}" } ?: ""

        var scratchpad = ""

        for (step in 0 until config.maxSteps) {
            val agentPrompt = buildString {
                appendLine(config.systemPrompt ?: "You are a helpful on-device AI assistant.")
                appendLine("\nAvailable tools:\n$toolDescriptions")
                appendLine("\nAvailable chains:\n$chainDescriptions")
                if (memoryContext.isNotEmpty()) appendLine("\nConversation context:\n$memoryContext")
                appendLine("\nUser query: $query")
                if (scratchpad.isNotEmpty()) appendLine("\n$scratchpad")
                appendLine("\nRespond in this format:")
                appendLine("Thought: <your reasoning>")
                appendLine("Action: <tool_id or chain_name or FINAL_ANSWER>")
                appendLine("Input: <input to the action>")
            }

            val response = model.generate(agentPrompt, GenerationConfig.CONVERSATIONAL)
            val parsed = parseAgentResponse(response.text)

            if (parsed.action == "FINAL_ANSWER") {
                steps.add(AgentStep(parsed.thought, "FINAL_ANSWER", parsed.input, null))
                memory?.save(input, ChainOutput(parsed.input, parsed.input))
                return AgentResult(parsed.input, steps, step + 1)
            }

            val observation = when {
                config.tools.any { it.id == parsed.action } ->
                    config.tools.first { it.id == parsed.action }
                        .execute(mapOf("query" to parsed.input))
                config.chains.any { it.name == parsed.action } ->
                    config.chains.first { it.name == parsed.action }
                        .invoke(ChainInput(parsed.input)).text
                else -> "Unknown action: ${parsed.action}"
            }

            steps.add(AgentStep(parsed.thought, parsed.action, parsed.input, observation))
            scratchpad += "Thought: ${parsed.thought}\nAction: ${parsed.action}\nInput: ${parsed.input}\nObservation: $observation\n\n"
        }

        val lastObservation = steps.lastOrNull()?.observation ?: "Could not determine answer."
        return AgentResult(lastObservation, steps, config.maxSteps)
    }

    private data class ParsedAction(val thought: String, val action: String, val input: String)

    private fun parseAgentResponse(text: String): ParsedAction {
        var thought = ""
        var action = "FINAL_ANSWER"
        var input = text

        for (line in text.lines()) {
            val trimmed = line.trim()
            when {
                trimmed.startsWith("Thought:") -> thought = trimmed.removePrefix("Thought:").trim()
                trimmed.startsWith("Action:") -> action = trimmed.removePrefix("Action:").trim()
                trimmed.startsWith("Input:") -> input = trimmed.removePrefix("Input:").trim()
            }
        }

        return ParsedAction(thought, action, input)
    }
}
