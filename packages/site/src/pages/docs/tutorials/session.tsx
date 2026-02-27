import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function SessionTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Session Tutorial"
        description="Learn how to build stateful chat with automatic memory management using Session."
        path="/docs/tutorials/session"
        keywords="Session, stateful chat, memory management, send, reset, conversational AI, Locanara"
      />
      <h1>Session</h1>
      <p>
        Session provides a stateful chat interface with automatic memory
        management. Call <code>send()</code> to chat — the session loads
        conversation history, generates a response, and saves both to memory
        automatically. Call <code>reset()</code> to clear state and start over.
      </p>

      <section>
        <h2>1. Create a Session</h2>
        <p>
          Initialize a Session with a memory strategy. BufferMemory is the most
          common choice for chat applications.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let memory = BufferMemory(maxEntries: 5, maxTokens: 1500)
let session = Session(memory: memory)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.composable.BufferMemory
import com.locanara.runtime.Session

val memory = BufferMemory(maxEntries = 5, maxTokens = 1500)
val session = Session(memory = memory)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// Session is native-only (Swift/Kotlin).
// Equivalent: track conversationId for stateful chat.
let conversationId: string | undefined`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

// Session is native-only (Swift/Kotlin).
// Equivalent: track conversationId for stateful chat.
String? conversationId;
final ai = FlutterOndeviceAi.instance;`,
            },
          ]}
        />
      </section>

      <section>
        <h2>2. Send Messages</h2>
        <p>
          Each <code>send()</code> call automatically loads context from memory,
          generates a response, and saves the exchange. The session remembers
          everything.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let r1 = try await session.send("What is Swift?")
print(r1)  // Response about Swift

// Session remembers context — r2 knows about r1
let r2 = try await session.send("How does it compare to Kotlin?")
print(r2)  // Compares to Swift using previous context

let r3 = try await session.send("Which should I learn first?")
print(r3)  // Knows the full conversation history`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val r1 = session.send("What is Kotlin?")
println(r1)  // Response about Kotlin

// Session remembers context — r2 knows about r1
val r2 = session.send("How does it compare to Swift?")
println(r2)  // Compares to Kotlin using previous context

val r3 = session.send("Which should I learn first?")
println(r3)  // Knows the full conversation history`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `const r1 = await chat('What is TypeScript?', {
  conversationId,
  systemPrompt: 'You are a helpful assistant.'
})
conversationId = r1.conversationId  // Track for continuity
console.log(r1.message)

// Continue same conversation
const r2 = await chat('How does it compare to JavaScript?', { conversationId })
console.log(r2.message)  // Remembers previous context
console.log('Can continue:', r2.canContinue)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final r1 = await ai.chat('What is Dart?', options: ChatOptions(
  conversationId: conversationId,
  systemPrompt: 'You are a helpful assistant.',
));
conversationId = r1.conversationId;  // Track for continuity
print(r1.message);

// Continue same conversation
final r2 = await ai.chat('How does it compare to Kotlin?', options: ChatOptions(
  conversationId: conversationId,
));
print(r2.message);  // Remembers previous context
print('Can continue: \${r2.canContinue}');`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_session.mp4"
          caption="Session chat — sending messages, observing memory entries growing in real-time"
        />
      </section>

      <section>
        <h2>3. Reset Session</h2>
        <p>
          Clear memory and start a fresh conversation. Always reset when
          switching topics or starting a new chat.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Clear all memory and start fresh
await session.reset()

// New conversation — no previous context
let fresh = try await session.send("Tell me about machine learning")
print(fresh)  // No knowledge of previous conversation`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Clear all memory and start fresh
session.reset()

// New conversation — no previous context
val fresh = session.send("Tell me about machine learning")
println(fresh)  // No knowledge of previous conversation`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Reset by creating a new conversation ID
conversationId = undefined

// New conversation — no previous context
const fresh = await chat('Tell me about machine learning')
conversationId = fresh.conversationId
console.log(fresh.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `// Reset by clearing the conversation ID
conversationId = null;

// New conversation — no previous context
final fresh = await ai.chat('Tell me about machine learning');
conversationId = fresh.conversationId;
print(fresh.message);`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>Session</strong> wraps a model + memory for stateful
            conversations
          </li>
          <li>
            <code>send()</code> automatically loads memory, generates response,
            saves both
          </li>
          <li>
            <code>reset()</code> clears memory — always call when starting a new
            conversation
          </li>
          <li>
            Combine with <strong>SummaryMemory</strong> for long conversations
          </li>
          <li>Session ID is auto-generated for tracking</li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/guardrail", label: "Guardrail" }}
        next={{ to: "/docs/tutorials/agent", label: "Agent" }}
      />
    </div>
  );
}

export default SessionTutorial;
