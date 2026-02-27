import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function MemoryTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Memory Tutorial"
        description="Learn BufferMemory and SummaryMemory — conversation history management for on-device AI."
        path="/docs/tutorials/memory"
        keywords="BufferMemory, SummaryMemory, conversation memory, context window, history management, Locanara"
      />
      <h1>Memory</h1>
      <p>
        Memory manages conversation history for multi-turn interactions.
        On-device models have small context windows (~4000 tokens), so memory
        strategies are critical. <strong>BufferMemory</strong> keeps recent
        turns verbatim. <strong>SummaryMemory</strong> compresses older turns
        into summaries to fit more context.
      </p>

      <section>
        <h2>1. BufferMemory</h2>
        <p>
          Keeps the last N conversation turns within a token budget. When limits
          are exceeded, oldest entries are removed automatically.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// Keep last 4 entries, max 500 tokens
let memory = BufferMemory(maxEntries: 4, maxTokens: 500)

// Save a conversation turn
await memory.save(
    input: ChainInput(text: "What is AI?"),
    output: ChainOutput(value: "AI is artificial intelligence." as any Sendable,
                        text: "AI is artificial intelligence.",
                        metadata: [:], processingTimeMs: nil)
)

// Load all entries
let entries = await memory.load(for: ChainInput(text: ""))
print(entries.count)                 // 2 (user + assistant)
print(memory.estimatedTokenCount)    // ~16 tokens

// When maxEntries (4) is exceeded, oldest entries are removed
await memory.clear()  // Reset memory`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.BufferMemory
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput

// Keep last 4 entries, max 500 tokens
val memory = BufferMemory(maxEntries = 4, maxTokens = 500)

// Save a conversation turn
memory.save(
    ChainInput(text = "What is AI?"),
    ChainOutput(value = "AI is artificial intelligence.",
                text = "AI is artificial intelligence.")
)

// Load all entries
val entries = memory.load(ChainInput(text = ""))
println(entries.size)                 // 2 (user + assistant)
println(memory.estimatedTokenCount)   // ~16 tokens

// When maxEntries (4) is exceeded, oldest entries are removed
memory.clear()  // Reset memory`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// Memory is native-only (Swift/Kotlin).
// Equivalent: manage a history array manually.
const history: Array<{ role: string; content: string }> = []
const maxEntries = 4

// Save a conversation turn
history.push({ role: 'user', content: 'What is AI?' })
history.push({ role: 'assistant', content: 'AI is artificial intelligence.' })

// Trim oldest when exceeding limit
while (history.length > maxEntries) {
  history.shift()
}

// Pass history to chat
const result = await chat('Tell me more', { history })
console.log(result.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

// Memory is native-only (Swift/Kotlin).
// Equivalent: manage a history list manually.
final history = <ChatMessage>[];
const maxEntries = 4;

// Save a conversation turn
history.add(ChatMessage(role: ChatRole.user, content: 'What is AI?'));
history.add(ChatMessage(role: ChatRole.assistant, content: 'AI is artificial intelligence.'));

// Trim oldest when exceeding limit
while (history.length > maxEntries) {
  history.removeAt(0);
}

// Pass history to chat
final ai = FlutterOndeviceAi.instance;
final result = await ai.chat('Tell me more', options: ChatOptions(history: history));
print(result.message);`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_memory_buffer.mp4"
          caption="BufferMemory — adding conversation turns, observing automatic eviction when limit reached"
        />
      </section>

      <section>
        <h2>2. SummaryMemory</h2>
        <p>
          Compresses older entries using the model while keeping recent turns
          verbatim. Older messages get summarized into a single system message,
          maximizing useful context within the token budget.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// Keep 2 recent turns verbatim, compress older ones
let memory = SummaryMemory(recentWindowSize: 2)

// After many turns, older entries are compressed
// Recent turns kept verbatim, older ones summarized
let entries = await memory.load(for: ChainInput(text: ""))
// First entry may be a "system" summary of older messages
for entry in entries {
    print("\\(entry.role): \\(entry.content)")
}

await memory.clear()  // Reset`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.SummaryMemory

// Keep 2 recent turns verbatim, compress older ones
val memory = SummaryMemory(recentWindowSize = 2)

// After many turns, older entries are compressed
val entries = memory.load(ChainInput(text = ""))
// First entry may be a "system" summary of older messages
for (entry in entries) {
    println("\${entry.role}: \${entry.content}")
}

memory.clear()  // Reset`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat, summarize } from 'expo-ondevice-ai'

// SummaryMemory is native-only.
// Equivalent: manually summarize older history.
const history: Array<{ role: string; content: string }> = []

// When history gets long, summarize older turns
if (history.length > 10) {
  const oldContext = history.slice(0, -4).map(m => m.content).join('\\n')
  const summary = await summarize(oldContext)
  // Replace old entries with a summary
  history.splice(0, history.length - 4, {
    role: 'system',
    content: summary.summary
  })
}`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

final ai = FlutterOndeviceAi.instance;

// SummaryMemory is native-only.
// Equivalent: manually summarize older history.
final history = <ChatMessage>[];

// When history gets long, summarize older turns
if (history.length > 10) {
  final oldContext = history.sublist(0, history.length - 4)
      .map((m) => m.content).join('\n');
  final summary = await ai.summarize(oldContext);
  // Replace old entries with a summary
  history.removeRange(0, history.length - 4);
  history.insert(0, ChatMessage(
    role: ChatRole.system,
    content: summary.summary,
  ));
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. Memory with ChatChain</h2>
        <p>
          Pass memory to ChatChain for automatic conversation history
          management. The chain loads context before each call and saves the
          exchange after.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let memory = BufferMemory(maxEntries: 10)
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful coding assistant."
)

let r1 = try await chain.run("What is Swift?")
print(r1.message)

// Memory tracks context — r2 knows about r1
let r2 = try await chain.run("How does it compare to Kotlin?")
print(r2.message)  // Remembers previous context`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.BufferMemory
import com.locanara.builtin.ChatChain

val memory = BufferMemory(maxEntries = 10)
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful coding assistant."
)

val r1 = chain.run("What is Kotlin?")
println(r1.message)

// Memory tracks context — r2 knows about r1
val r2 = chain.run("How does it compare to Swift?")
println(r2.message)  // Remembers previous context`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

const history: Array<{ role: string; content: string }> = []
const systemPrompt = 'You are a helpful coding assistant.'

const r1 = await chat('What is TypeScript?', { systemPrompt, history })
history.push({ role: 'user', content: 'What is TypeScript?' })
history.push({ role: 'assistant', content: r1.message })

// Pass history for context — r2 knows about r1
const r2 = await chat('How does it compare to JavaScript?', { systemPrompt, history })
console.log(r2.message)  // Remembers previous context`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

final history = <ChatMessage>[];
const systemPrompt = 'You are a helpful coding assistant.';

final r1 = await ai.chat('What is Dart?', options: ChatOptions(
  systemPrompt: systemPrompt, history: history,
));
history.add(ChatMessage(role: ChatRole.user, content: 'What is Dart?'));
history.add(ChatMessage(role: ChatRole.assistant, content: r1.message));

// Pass history for context — r2 knows about r1
final r2 = await ai.chat('How does it compare to Kotlin?', options: ChatOptions(
  systemPrompt: systemPrompt, history: history,
));
print(r2.message);  // Remembers previous context`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>BufferMemory</strong>: fixed window — keeps last N entries
            within token budget. Best for short conversations (~20 turns).
          </li>
          <li>
            <strong>SummaryMemory</strong>: compresses older entries using the
            model. Best for long conversations where context compression is
            needed.
          </li>
          <li>
            <strong>Token estimation</strong>: <code>content.length / 4</code>{" "}
            (rough approximation)
          </li>
          <li>
            Always call <code>memory.clear()</code> when starting a new
            conversation
          </li>
          <li>
            <strong>Memory protocol</strong>: <code>load()</code>,{" "}
            <code>save()</code>, <code>clear()</code>,{" "}
            <code>estimatedTokenCount</code>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/pipeline", label: "Pipeline" }}
        next={{ to: "/docs/tutorials/guardrail", label: "Guardrail" }}
      />
    </div>
  );
}

export default MemoryTutorial;
