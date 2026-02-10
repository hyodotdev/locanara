import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

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
        <AnchorLink id="signature" level="h2">
          Low-Level API Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func chat(
    input: String,
    parameters: ChatParametersInput?
) async throws -> ChatResult

struct ChatParametersInput {
    let conversationId: String?       // For multi-turn conversations
    let systemPrompt: String?         // AI personality/instructions
    let history: [ChatMessageInput]?  // Previous messages
}

struct ChatMessageInput {
    let role: String    // "user", "assistant", or "system"
    let content: String
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun chat(
    input: String,
    parameters: ChatParametersInput? = null
): ChatResult

data class ChatParametersInput(
    val conversationId: String? = null,       // For multi-turn conversations
    val systemPrompt: String? = null,         // AI personality/instructions
    val history: List<ChatMessageInput>? = null  // Previous messages
)

data class ChatMessageInput(
    val role: String,    // "user", "assistant", or "system"
    val content: String
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function chat(
  input: string,
  parameters?: ChatParametersInput
): Promise<ChatResult>

interface ChatParametersInput {
  conversationId?: string;       // For multi-turn conversations
  systemPrompt?: string;         // AI personality/instructions
  history?: ChatMessageInput[];  // Previous messages
}

interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<ChatResult> chat(
  String input, {
  ChatParametersInput? parameters,
});

class ChatParametersInput {
  final String? conversationId;       // For multi-turn conversations
  final String? systemPrompt;         // AI personality/instructions
  final List<ChatMessageInput>? history;  // Previous messages
}

class ChatMessageInput {
  final String role;    // "user", "assistant", or "system"
  final String content;
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
            dart: (
              <CodeBlock language="dart">{`class ChatResult {
  final String message;              // AI response
  final String? conversationId;      // ID for continuing conversation
  final bool canContinue;            // Whether conversation can continue
  final List<String>? suggestedPrompts;  // Follow-up suggestions
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Low-Level API Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Simple chat
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .chat,
        input: "What's the capital of France?"
    )
)

if case .chat(let chat) = result.result {
    print(chat.message)
    // Output: "The capital of France is Paris."
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Simple chat
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.CHAT,
        input = "What's the capital of France?"
    )
)

val chat = result.result?.chat
println(chat?.message)
// Output: "The capital of France is Paris."`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Simple chat
const result = await Locanara.chat({
  input: "What's the capital of France?",
});

console.log(result.message);
// Output: "The capital of France is Paris."`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Simple chat
final result = await Locanara.chat(
  input: "What's the capital of France?",
);

print(result.message);
// Output: "The capital of France is Paris."`}</CodeBlock>
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
