import Foundation

// MARK: - Agent Types

/// Configuration for an on-device agent
public struct AgentConfig: Sendable {
    /// Maximum number of reasoning/action steps before returning
    public var maxSteps: Int
    /// Available tools the agent can call
    public var tools: [any Tool]
    /// Available chains the agent can invoke
    public var chains: [any Chain]
    /// System prompt for the agent's reasoning
    public var systemPrompt: String?

    public init(
        maxSteps: Int = 3,
        tools: [any Tool] = [],
        chains: [any Chain] = [],
        systemPrompt: String? = nil
    ) {
        self.maxSteps = maxSteps
        self.tools = tools
        self.chains = chains
        self.systemPrompt = systemPrompt
    }
}

/// A single step in the agent's reasoning process
public struct AgentStep: Sendable {
    public let thought: String
    public let action: String
    public let input: String
    public let observation: String?
}

/// Result of an agent execution
public struct AgentResult: Sendable {
    public let answer: String
    public let steps: [AgentStep]
    public let totalSteps: Int
}

// MARK: - Agent

/// An on-device agent that reasons about which tools/chains to use.
///
/// Uses a simplified ReAct pattern optimized for small models:
/// 1. Thought: What should I do?
/// 2. Action: Which tool/chain to use?
/// 3. Observation: What was the result?
/// 4. Repeat or produce Final Answer
///
/// ```swift
/// let agent = Agent(
///     config: AgentConfig(
///         maxSteps: 3,
///         tools: [weatherTool],
///         chains: [summarizeChain]
///     )
/// )
/// let result = try await agent.run("What's the weather and summarize my notes?")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public final class Agent: @unchecked Sendable {
    private let model: any LocanaraModel
    private let config: AgentConfig
    private let memory: (any Memory)?

    public init(model: (any LocanaraModel)? = nil, config: AgentConfig, memory: (any Memory)? = nil) {
        self.model = model ?? LocanaraDefaults.model
        self.config = config
        self.memory = memory
    }

    /// Run the agent with a user query
    public func run(_ query: String) async throws -> AgentResult {
        var steps: [AgentStep] = []
        let input = ChainInput(text: query)

        let toolDescriptions = config.tools
            .map { "- \($0.id): \($0.description)" }
            .joined(separator: "\n")
        let chainDescriptions = config.chains
            .map { "- \($0.name): on-device AI chain" }
            .joined(separator: "\n")

        let memoryContext: String
        if let memory = memory {
            let entries = await memory.load(for: input)
            memoryContext = entries.map { "\($0.role): \($0.content)" }.joined(separator: "\n")
        } else {
            memoryContext = ""
        }

        var scratchpad = ""

        for step in 0..<config.maxSteps {
            let agentPrompt = """
            \(config.systemPrompt ?? "You are a helpful on-device AI assistant.")

            Available tools:
            \(toolDescriptions)

            Available chains:
            \(chainDescriptions)

            \(memoryContext.isEmpty ? "" : "Conversation context:\n\(memoryContext)\n")

            User query: \(query)

            \(scratchpad)

            Respond in this format:
            Thought: <your reasoning>
            Action: <tool_id or chain_name or FINAL_ANSWER>
            Input: <input to the action>
            """

            let response = try await model.generate(prompt: agentPrompt, config: .conversational)
            let parsed = parseAgentResponse(response.text)

            if parsed.action == "FINAL_ANSWER" {
                steps.append(AgentStep(
                    thought: parsed.thought, action: "FINAL_ANSWER",
                    input: parsed.input, observation: nil
                ))

                if let memory = memory {
                    await memory.save(
                        input: input,
                        output: ChainOutput(value: parsed.input, text: parsed.input)
                    )
                }

                return AgentResult(answer: parsed.input, steps: steps, totalSteps: step + 1)
            }

            // Execute the action
            let observation: String
            if let tool = config.tools.first(where: { $0.id == parsed.action }) {
                observation = try await tool.execute(arguments: ["query": parsed.input])
            } else if let chain = config.chains.first(where: { $0.name == parsed.action }) {
                let chainOutput = try await chain.invoke(ChainInput(text: parsed.input))
                observation = chainOutput.text
            } else {
                observation = "Unknown action: \(parsed.action)"
            }

            steps.append(AgentStep(
                thought: parsed.thought, action: parsed.action,
                input: parsed.input, observation: observation
            ))
            scratchpad += """
            Thought: \(parsed.thought)
            Action: \(parsed.action)
            Input: \(parsed.input)
            Observation: \(observation)

            """
        }

        let lastObservation = steps.last?.observation
            ?? "Could not determine answer within \(config.maxSteps) steps."
        return AgentResult(answer: lastObservation, steps: steps, totalSteps: config.maxSteps)
    }

    // MARK: - Private

    private struct ParsedAction {
        let thought: String
        let action: String
        let input: String
    }

    private func parseAgentResponse(_ text: String) -> ParsedAction {
        var thought = ""
        var action = "FINAL_ANSWER"
        var input = text

        for line in text.components(separatedBy: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("Thought:") {
                thought = String(trimmed.dropFirst("Thought:".count)).trimmingCharacters(in: .whitespaces)
            } else if trimmed.hasPrefix("Action:") {
                action = String(trimmed.dropFirst("Action:".count)).trimmingCharacters(in: .whitespaces)
            } else if trimmed.hasPrefix("Input:") {
                input = String(trimmed.dropFirst("Input:".count)).trimmingCharacters(in: .whitespaces)
            }
        }

        return ParsedAction(thought: thought, action: action, input: input)
    }
}
