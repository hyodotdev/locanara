import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function AgentAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Agent API"
        description="Agent — autonomous ReAct-lite reasoning with tools for on-device AI."
        path="/docs/apis/agent"
      />
      <h1>Agent</h1>
      <p>
        Agent implements a ReAct-lite reasoning pattern: Think, Act, Observe.
        Uses tools and chains to answer complex queries autonomously. All
        reasoning happens on-device.
      </p>

      <TLDRBox>
        <ul>
          <li>
            Implements <strong>ReAct-lite</strong> pattern: Think, Act, Observe
          </li>
          <li>Uses tools and chains to answer complex queries autonomously</li>
          <li>All reasoning happens on-device</li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="config" level="h2">
          AgentConfig
        </AnchorLink>
        <p>
          Configure the agent with a maximum number of reasoning steps,
          available tools, chains, and an optional system prompt.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const config: AgentConfig = {
  maxSteps: 5,
  tools: [searchTool, calculatorTool],
  chains: [new SummarizeChain({ model })],
  systemPrompt: "You are a helpful research assistant.",
};`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let config = AgentConfig(
    maxSteps: 5,
    tools: [searchTool, calculatorTool],
    chains: [SummarizeChain(model: model)],
    systemPrompt: "You are a helpful research assistant."
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val config = AgentConfig(
    maxSteps = 5,
    tools = listOf(searchTool, calculatorTool),
    chains = listOf(SummarizeChain(model = model)),
    systemPrompt = "You are a helpful research assistant."
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="create" level="h2">
          Creating an Agent
        </AnchorLink>
        <p>
          Create an agent with a model and configuration, then call{" "}
          <code>run()</code> with a query.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const agent = new Agent({ model: new LocanaraModel(), config });
const result = await agent.run("What are the key points about on-device AI?");
console.log(result.answer);`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let agent = Agent(model: FoundationLanguageModel(), config: config)
let result = try await agent.run("What are the key points about on-device AI?")
print(result.answer)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val agent = Agent(model = PromptApiModel(context), config = config)
val result = agent.run("What are the key points about on-device AI?")
println(result.answer)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="result" level="h2">
          AgentResult
        </AnchorLink>
        <p>
          The result contains the final answer along with the full reasoning
          trace of steps the agent took.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface AgentResult {
  answer: string;
  steps: AgentStep[];
  totalSteps: number;
}

interface AgentStep {
  thought: string;
  action: string;
  input: string;
  observation: string;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public struct AgentResult: Sendable {
    public let answer: String
    public let steps: [AgentStep]
    public let totalSteps: Int
}

public struct AgentStep: Sendable {
    public let thought: String
    public let action: String
    public let input: String
    public let observation: String
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class AgentResult(
    val answer: String,
    val steps: List<AgentStep>,
    val totalSteps: Int
)

data class AgentStep(
    val thought: String,
    val action: String,
    val input: String,
    val observation: String
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="tools" level="h2">
          Built-in Tools
        </AnchorLink>

        <h4>FunctionTool</h4>
        <p>
          A custom tool defined by a closure or lambda. Useful for integrating
          app-specific logic into the agent's reasoning loop.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const calculator = new FunctionTool({
  id: "calculator",
  description: "Performs basic arithmetic calculations",
  handler: (args) => {
    const expression = args.expression as string ?? "";
    return evaluate(expression);
  },
});`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let calculator = FunctionTool(
    id: "calculator",
    description: "Performs basic arithmetic calculations"
) { args in
    // Parse and evaluate the expression
    let expression = args["expression"] as? String ?? ""
    return evaluate(expression)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val calculator = FunctionTool(
    id = "calculator",
    description = "Performs basic arithmetic calculations"
) { args ->
    // Parse and evaluate the expression
    val expression = args["expression"] as? String ?: ""
    evaluate(expression)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>

        <h4>LocalSearchTool</h4>
        <p>
          Searches over a set of on-device documents. Useful for
          retrieval-augmented generation (RAG) patterns without a server.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const search = new LocalSearchTool({
  documents: [
    { title: "Privacy Policy", content: "All data stays on device..." },
    { title: "User Guide", content: "Getting started with Locanara..." },
  ],
});`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let search = LocalSearchTool(documents: [
    Document(title: "Privacy Policy", content: "All data stays on device..."),
    Document(title: "User Guide", content: "Getting started with Locanara...")
])`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val search = LocalSearchTool(documents = listOf(
    Document(title = "Privacy Policy", content = "All data stays on device..."),
    Document(title = "User Guide", content = "Getting started with Locanara...")
))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="trace" level="h2">
          Reasoning Trace
        </AnchorLink>
        <p>
          Inspect agent steps for debugging and observability. Each step shows
          the agent's thought process, the action it chose, and what it
          observed.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const result = await agent.run("Summarize the privacy policy");

result.steps.forEach((step, index) => {
  console.log(\`Step \${index + 1}:\`);
  console.log(\`  Thought: \${step.thought}\`);
  console.log(\`  Action: \${step.action}\`);
  console.log(\`  Input: \${step.input}\`);
  console.log(\`  Observation: \${step.observation}\`);
});

console.log(\`Final answer: \${result.answer}\`);
console.log(\`Total steps: \${result.totalSteps}\`);`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let result = try await agent.run("Summarize the privacy policy")

for (index, step) in result.steps.enumerated() {
    print("Step \\(index + 1):")
    print("  Thought: \\(step.thought)")
    print("  Action: \\(step.action)")
    print("  Input: \\(step.input)")
    print("  Observation: \\(step.observation)")
}

print("Final answer: \\(result.answer)")
print("Total steps: \\(result.totalSteps)")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val result = agent.run("Summarize the privacy policy")

result.steps.forEachIndexed { index, step ->
    println("Step \${index + 1}:")
    println("  Thought: \${step.thought}")
    println("  Action: \${step.action}")
    println("  Input: \${step.input}")
    println("  Observation: \${step.observation}")
}

println("Final answer: \${result.answer}")
println("Total steps: \${result.totalSteps}")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/session", label: "Session" }}
        next={{ to: "/docs/apis/model", label: "Model" }}
      />
    </div>
  );
}

export default AgentAPI;
