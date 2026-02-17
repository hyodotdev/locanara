import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";

function IOSChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Chat Tutorial"
        description="Advanced guide for building conversational AI with Apple Intelligence - ChatChain, memory strategies, and streaming."
        path="/docs/tutorials/ios-chat"
        keywords="iOS chat, Apple Intelligence, SwiftUI, ChatChain, BufferMemory, SummaryMemory, Locanara"
      />
      <h1>iOS: Chat Advanced Guide</h1>
      <p>
        Learn the core patterns for building conversational AI with Apple
        Intelligence. This guide covers ChatChain with memory strategies,
        streaming, and session management.
      </p>

      <section>
        <h2>Basic Chat</h2>
        <p>
          ChatChain provides conversational AI with built-in memory support.
        </p>

        <CodeBlock language="swift">{`import Locanara

// Simple one-shot chat
let result = try await ChatChain().run("What is Swift?")
print(result.message)`}</CodeBlock>
      </section>

      <section>
        <h2>System Prompt Design</h2>
        <p>
          System prompts define the AI&apos;s personality and behavior rules.
        </p>

        <h3>Basic Structure</h3>
        <CodeBlock language="swift">{`let chain = ChatChain(
    systemPrompt: """
    You are a customer support assistant for [Company].

    ## Your Role
    - Answer questions about products and services
    - Help troubleshoot common issues

    ## Guidelines
    - Be concise and direct
    - Never make promises about refunds
    """
)

let result = try await chain.run("How do I reset my password?")
print(result.message)`}</CodeBlock>

        <h3>Dynamic Context Injection</h3>
        <CodeBlock language="swift">{`func buildSystemPrompt(user: User, context: AppContext) -> String {
    """
    You are assisting \\(user.name).

    ## User Context
    - Account type: \\(user.accountType.rawValue)
    - Language: \\(user.preferredLanguage)
    - Current screen: \\(context.currentScreen)

    Respond in \\(user.preferredLanguage).
    """
}

let chain = ChatChain(
    systemPrompt: buildSystemPrompt(user: currentUser, context: appContext)
)`}</CodeBlock>
      </section>

      <section>
        <h2>Memory Strategies</h2>
        <p>
          Locanara provides two built-in memory strategies for multi-turn
          conversations. No manual history management needed.
        </p>

        <h3>BufferMemory (Last N Turns)</h3>
        <CodeBlock language="swift">{`// BufferMemory keeps the last N conversation turns
let memory = BufferMemory(maxTurns: 10)
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful coding assistant."
)

// Multi-turn conversation — memory is managed automatically
let r1 = try await chain.run("What is Swift?")
print(r1.message)

let r2 = try await chain.run("How does it compare to Kotlin?")
print(r2.message)  // Remembers previous context

let r3 = try await chain.run("Show me an example")
print(r3.message)  // Remembers both previous turns`}</CodeBlock>

        <h3>SummaryMemory (Compressed History)</h3>
        <CodeBlock language="swift">{`// SummaryMemory compresses older conversation into a summary
// Great for very long conversations
let memory = SummaryMemory()
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful assistant."
)

// As conversation grows, older turns are automatically
// compressed into a summary to save context window space
let r1 = try await chain.run("Tell me about machine learning")
let r2 = try await chain.run("What about neural networks?")
let r3 = try await chain.run("How do transformers work?")
// Earlier context is summarized, recent turns kept in full`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming Responses</h2>
        <p>
          For long responses, streaming improves user experience by showing
          tokens as they arrive.
        </p>
        <CodeBlock language="swift">{`let memory = BufferMemory()
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful assistant."
)

// Stream tokens as they arrive
var fullResponse = ""
for try await chunk in chain.streamRun("Explain SwiftUI") {
    fullResponse += chunk
    print(chunk, terminator: "")  // Print without newline
}

// Memory is updated automatically after stream completes`}</CodeBlock>
      </section>

      <section>
        <h2>Session (Stateful Conversations)</h2>
        <p>
          For more advanced conversation management with history tracking, use
          Session.
        </p>
        <CodeBlock language="swift">{`// Session wraps ChatChain with additional state management
let session = Session(
    systemPrompt: "You are a helpful assistant.",
    memory: BufferMemory(maxTurns: 20)
)

let r1 = try await session.send("What is Swift?")
print(r1.message)

// Access conversation history
print("Turn count: \\(session.turnCount)")

// Reset conversation
session.reset()`}</CodeBlock>
      </section>

      <section>
        <h2>SwiftUI Integration</h2>
        <CodeBlock language="swift">{`@Observable
class ChatViewModel {
    private let chain: ChatChain
    var messages: [(role: String, content: String)] = []
    var currentResponse = ""
    var isStreaming = false

    init() {
        let memory = BufferMemory(maxTurns: 20)
        self.chain = ChatChain(
            memory: memory,
            systemPrompt: "You are a helpful assistant."
        )
    }

    func send(_ message: String) async {
        messages.append((role: "user", content: message))
        isStreaming = true
        currentResponse = ""

        do {
            for try await chunk in chain.streamRun(message) {
                currentResponse += chunk
            }
            messages.append((role: "assistant", content: currentResponse))
        } catch {
            messages.append((role: "assistant", content: "Error: \\(error.localizedDescription)"))
        }

        currentResponse = ""
        isStreaming = false
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>
            <strong>BufferMemory</strong> for short conversations (up to ~20
            turns)
          </li>
          <li>
            <strong>SummaryMemory</strong> for long conversations where context
            compression is needed
          </li>
          <li>
            <strong>System prompt</strong>: Keep under 500 tokens to leave room
            for conversation
          </li>
          <li>
            <strong>Streaming</strong>: Always use <code>streamRun()</code> for
            user-facing chat to improve perceived responsiveness
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/ios-summarize", label: "iOS Summarize" }}
        next={{ to: "/docs/tutorials/ios-rewrite", label: "iOS Rewrite" }}
      />
    </div>
  );
}

export default IOSChatTutorial;
