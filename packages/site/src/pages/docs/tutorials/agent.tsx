import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function AgentTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Agent Tutorial"
        description="Learn how to build on-device AI agents with tools and step-by-step reasoning using the ReAct-lite pattern."
        path="/docs/tutorials/agent"
        keywords="Agent, ReAct, tools, FunctionTool, LocalSearchTool, reasoning trace, on-device AI, Locanara"
      />
      <h1>Agent</h1>
      <p>
        The Agent uses a simplified ReAct (Reason + Act) pattern optimized for
        small on-device models. It reasons about which tools and chains to use,
        executes them, observes results, and iterates until it has a final
        answer. Each step produces a transparent reasoning trace.
      </p>

      <section>
        <h2>1. Define Tools</h2>
        <p>
          Agents use tools to interact with the world.{" "}
          <code>LocalSearchTool</code> searches through local documents.{" "}
          <code>FunctionTool</code> wraps any function as a tool the agent can
          call.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// Built-in: search through local documents
let searchTool = LocalSearchTool(documents: [
    "On-device AI processes data locally without sending it to the cloud. This ensures complete user privacy.",
    "Privacy regulations like GDPR and CCPA require apps to minimize data collection.",
    "Neural Processing Units (NPUs) are specialized hardware accelerators designed for AI workloads.",
])

// Custom: any function as a tool
let dateTool = FunctionTool(
    id: "current_date",
    description: "Get the current date and time",
    parameterDescription: "No parameters needed"
) { _ in
    DateFormatter.localizedString(
        from: Date(), dateStyle: .full, timeStyle: .short
    )
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.LocalSearchTool
import com.locanara.composable.FunctionTool
import java.text.DateFormat
import java.util.Date

// Built-in: search through local documents
val searchTool = LocalSearchTool(documents = listOf(
    "On-device AI processes data locally without sending it to the cloud. This ensures complete user privacy.",
    "Privacy regulations like GDPR and CCPA require apps to minimize data collection.",
    "Neural Processing Units (NPUs) are specialized hardware accelerators designed for AI workloads.",
))

// Custom: any function as a tool
val dateTool = FunctionTool(
    id = "current_date",
    description = "Get the current date and time",
    parameterDescription = "No parameters needed"
) { _ ->
    DateFormat.getDateTimeInstance(DateFormat.FULL, DateFormat.SHORT).format(Date())
}`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Agent and tools are native-only (Swift/Kotlin).
// On-device agents require tight model-tool integration
// that runs entirely on the device.
//
// For similar patterns in TypeScript, you can orchestrate
// multiple API calls manually:

import { chat, summarize } from 'expo-ondevice-ai'

// Search function (equivalent to LocalSearchTool)
function searchDocuments(query: string, docs: string[]): string {
  const lower = query.toLowerCase()
  return docs.filter(d => d.toLowerCase().includes(lower)).join('\\n')
}

// Use search results as context for chat
const docs = ['On-device AI processes data locally...', '...']
const context = searchDocuments('privacy', docs)
const result = await chat(\`Based on this context: \${context}\n\nAnswer: What about privacy?\`)
console.log(result.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `// Agent and tools are native-only (Swift/Kotlin).
// On-device agents require tight model-tool integration
// that runs entirely on the device.
//
// For similar patterns in Dart, you can orchestrate
// multiple API calls manually:

import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

// Search function (equivalent to LocalSearchTool)
String searchDocuments(String query, List<String> docs) {
  final lower = query.toLowerCase();
  return docs.where((d) => d.toLowerCase().contains(lower)).join('\n');
}

// Use search results as context for chat
final ai = FlutterOndeviceAi.instance;
final docs = ['On-device AI processes data locally...', '...'];
final context = searchDocuments('privacy', docs);
final result = await ai.chat(
  'Based on this context: $context\n\nAnswer: What about privacy?',
);
print(result.message);`,
            },
          ]}
        />
      </section>

      <section>
        <h2>2. Create and Run an Agent</h2>
        <p>
          Configure the agent with <code>maxSteps</code> (limits iterations),
          tools, and optional chains. Then call <code>run()</code> with your
          query.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let agent = Agent(
    config: AgentConfig(
        maxSteps: 3,
        tools: [searchTool, dateTool],
        chains: [SummarizeChain()]
    )
)

let result = try await agent.run("What do the documents say about privacy?")
print(result.answer)                 // Final answer
print("Steps taken: \\(result.totalSteps)")  // Number of reasoning steps`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.runtime.Agent
import com.locanara.runtime.AgentConfig
import com.locanara.builtin.SummarizeChain

val agent = Agent(
    config = AgentConfig(
        maxSteps = 3,
        tools = listOf(searchTool, dateTool),
        chains = listOf(SummarizeChain())
    )
)

val result = agent.run("What do the documents say about privacy?")
println(result.answer)                   // Final answer
println("Steps taken: \${result.totalSteps}")  // Number of reasoning steps`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat, summarize } from 'expo-ondevice-ai'

// Manual agent-like orchestration
const query = 'What do the documents say about privacy?'

// Step 1: Search documents
const searchResults = searchDocuments('privacy', docs)

// Step 2: Summarize if needed
const summary = await summarize(searchResults)

// Step 3: Generate final answer
const answer = await chat(
  \`Based on this summary: \${summary.summary}\n\nAnswer the question: \${query}\`
)
console.log(answer.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// Manual agent-like orchestration
const query = 'What do the documents say about privacy?';

// Step 1: Search documents
final searchResults = searchDocuments('privacy', docs);

// Step 2: Summarize if needed
final summary = await ai.summarize(searchResults);

// Step 3: Generate final answer
final answer = await ai.chat(
  'Based on this summary: \${summary.summary}\n\nAnswer the question: $query',
);
print(answer.message);`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_agent_tools.mp4"
          caption="Agent running — searching documents, reasoning through steps, producing final answer"
        />
      </section>

      <section>
        <h2>3. Reasoning Trace</h2>
        <p>
          The agent&apos;s reasoning is fully transparent. Each step records a{" "}
          <strong>thought</strong> (what the agent is thinking), an{" "}
          <strong>action</strong> (which tool/chain to use), and an{" "}
          <strong>observation</strong> (the result). Inspect{" "}
          <code>result.steps</code> for debugging and explainability.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Inspect the reasoning trace
for (i, step) in result.steps.enumerated() {
    print("--- Step \\(i + 1) ---")
    print("Thought:     \\(step.thought)")
    print("Action:      \\(step.action)(\\(step.input))")
    if let observation = step.observation {
        print("Observation: \\(observation)")
    }
}

// Example output:
// --- Step 1 ---
// Thought:     I need to search for information about privacy.
// Action:      local_search(privacy)
// Observation: On-device AI processes data locally... Privacy regulations...
//
// --- Step 2 ---
// Thought:     I found relevant information. Let me provide a final answer.
// Action:      FINAL_ANSWER(Based on the documents, privacy is ensured by...)
// Observation: nil`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Inspect the reasoning trace
result.steps.forEachIndexed { i, step ->
    println("--- Step \${i + 1} ---")
    println("Thought:     \${step.thought}")
    println("Action:      \${step.action}(\${step.input})")
    step.observation?.let { println("Observation: $it") }
}

// Example output:
// --- Step 1 ---
// Thought:     I need to search for information about privacy.
// Action:      local_search(privacy)
// Observation: On-device AI processes data locally... Privacy regulations...
//
// --- Step 2 ---
// Thought:     I found relevant information. Let me provide a final answer.
// Action:      FINAL_ANSWER(Based on the documents, privacy is ensured by...)
// Observation: null`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Reasoning trace is native-only.
// For manual orchestration, log each step yourself:

console.log('Step 1: Search')
const searchResults = searchDocuments('privacy', docs)
console.log('Found:', searchResults.substring(0, 100))

console.log('Step 2: Summarize')
const summary = await summarize(searchResults)
console.log('Summary:', summary.summary)

console.log('Step 3: Answer')
const answer = await chat(\`Context: \${summary.summary}\n\nQuestion: ...\`)
console.log('Answer:', answer.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `// Reasoning trace is native-only.
// For manual orchestration, log each step yourself:

print('Step 1: Search');
final searchResults = searchDocuments('privacy', docs);
print('Found: \${searchResults.substring(0, 100)}');

print('Step 2: Summarize');
final summary = await ai.summarize(searchResults);
print('Summary: \${summary.summary}');

print('Step 3: Answer');
final answer = await ai.chat('Context: \${summary.summary}\n\nQuestion: ...');
print('Answer: \${answer.message}');`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            Agent follows the <strong>ReAct pattern</strong>: Thought → Action →
            Observation → repeat
          </li>
          <li>
            <code>maxSteps</code> limits iterations (default 3) — important for
            on-device performance
          </li>
          <li>
            <strong>LocalSearchTool</strong>: built-in on-device document search
          </li>
          <li>
            <strong>FunctionTool</strong>: wraps any closure/lambda as a tool
          </li>
          <li>
            Agent can use both <strong>tools</strong> and{" "}
            <strong>chains</strong> (e.g., SummarizeChain) in its reasoning
          </li>
          <li>
            Reasoning trace is transparent — inspect <code>result.steps</code>{" "}
            for debugging
          </li>
          <li>
            Agent uses <code>FINAL_ANSWER</code> action to terminate
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/session", label: "Session" }}
        next={{ to: "/docs/libraries/expo", label: "expo-ondevice-ai" }}
      />
    </div>
  );
}

export default AgentTutorial;
