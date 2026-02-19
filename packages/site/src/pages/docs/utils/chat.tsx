import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ChatAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Chat API"
        description="ChatChain - built-in chain for conversational AI using on-device models."
        path="/docs/utils/chat"
        keywords="chat, conversational AI, dialogue, on-device AI"
      />
      <h1>chat()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>ChatChain</code> | Session: <code>Session</code> +{" "}
        <code>BufferMemory</code>
      </p>
      <p>
        Have conversational AI interactions using on-device models. Supports
        conversation history, system prompts, and follow-up suggestions.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Uses Apple Intelligence Foundation Models
          </li>
          <li>
            <strong>Android</strong>: Experimental via Gemini Nano
          </li>
          <li>
            <strong>Features</strong>: Conversation history, system prompts,
            suggestions
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="framework-usage" level="h2">
          Framework Usage (Recommended)
        </AnchorLink>
        <p>
          For conversational AI, use Session with Memory for automatic
          conversation management:
        </p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// ChatChain with memory — uses default model automatically
let memory = BufferMemory()
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful assistant."
)

let r1 = try await chain.run("What's the capital of France?")
print(r1.message)

let r2 = try await chain.run("What about Germany?")  // remembers context
print(r2.message)

// Streaming
for try await chunk in chain.streamRun("Tell me a story") {
    print(chunk, terminator: "")
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// ChatChain with memory — uses default model automatically
val memory = BufferMemory()
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful assistant."
)

val r1 = chain.run("What's the capital of France?")
println(r1.message)

val r2 = chain.run("What about Germany?")  // remembers context
println(r2.message)

// Streaming
chain.streamRun("Tell me a story").collect { chunk ->
    print(chunk)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="result" level="h2">
          Result
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`struct ChatResult {
    let message: String              // AI response
    let conversationId: String?      // ID for continuing conversation
    let canContinue: Bool            // Whether conversation can continue
    let suggestedPrompts: [String]?  // Follow-up suggestions
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ChatResult(
    val message: String,              // AI response
    val conversationId: String?,      // ID for continuing conversation
    val canContinue: Boolean,         // Whether conversation can continue
    val suggestedPrompts: List<String>?  // Follow-up suggestions
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface ChatResult {
  message: string;              // AI response
  conversationId?: string;      // ID for continuing conversation
  canContinue: boolean;         // Whether conversation can continue
  suggestedPrompts?: string[];  // Follow-up suggestions
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS (Apple Intelligence)</h4>
        <ul>
          <li>Full conversational AI support</li>
          <li>Supports system prompts and conversation history</li>
          <li>May return suggested follow-up prompts</li>
        </ul>

        <h4>Android (Gemini Nano)</h4>
        <div className="alert-card alert-card--warning">
          <p>
            <strong>Experimental:</strong> Chat functionality on Android is
            experimental and may have limited capabilities compared to iOS.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#chat-result">ChatResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/extract", label: "extract()" }}
        next={{ to: "/docs/utils/translate", label: "translate()" }}
      />
    </div>
  );
}

export default ChatAPI;
