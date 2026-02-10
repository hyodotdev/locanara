import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function MemoryAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Memory API"
        description="Memory — conversation history management for stateful AI sessions."
        path="/docs/apis/memory"
      />
      <h1>Memory</h1>
      <p>
        Conversation history management for stateful AI sessions. Memory stores
        past exchanges so the on-device model can maintain context across
        multiple turns.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Memory</strong> stores conversation history for multi-turn
            AI sessions.
          </li>
          <li>
            <strong>BufferMemory</strong> keeps recent turns in a fixed-size
            buffer.
          </li>
          <li>
            <strong>SummaryMemory</strong> compresses older messages into a
            rolling summary.
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="protocol" level="h2">
          Memory Protocol
        </AnchorLink>
        <p>
          The <code>Memory</code> protocol defines how conversation history is
          loaded, saved, and cleared. Each implementation controls its own
          storage and eviction strategy.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface Memory {
  load(input: ChainInput): Promise<MemoryEntry[]>;
  save(input: ChainInput, output: ChainOutput): Promise<void>;
  clear(): Promise<void>;
  readonly estimatedTokenCount: number;
}

interface MemoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public protocol Memory: AnyObject, Sendable {
    func load(for input: ChainInput) async -> [MemoryEntry]
    func save(input: ChainInput, output: ChainOutput) async
    func clear() async
    var estimatedTokenCount: Int { get async }
}

public struct MemoryEntry: Sendable {
    public let role: String      // "user" or "assistant"
    public let content: String
    public let timestamp: Date
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`interface Memory {
    suspend fun load(input: ChainInput): List<MemoryEntry>
    suspend fun save(input: ChainInput, output: ChainOutput)
    suspend fun clear()
    val estimatedTokenCount: Int
}

data class MemoryEntry(
    val role: String,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="buffer" level="h2">
          BufferMemory
        </AnchorLink>
        <p>
          Keeps the last N conversation turns in memory. When{" "}
          <code>maxEntries</code> or <code>maxTokens</code> is exceeded, the
          oldest entries are removed first.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const memory = new BufferMemory({ maxEntries: 10, maxTokens: 2000 });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let memory = BufferMemory(maxEntries: 10, maxTokens: 2000)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val memory = BufferMemory(maxEntries = 10, maxTokens = 2000)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="summary" level="h2">
          SummaryMemory
        </AnchorLink>
        <p>
          Compresses older entries into a rolling summary using the on-device
          model. Keeps the most recent entries verbatim for full context, while
          older exchanges are summarized to save token budget.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const memory = new SummaryMemory({ model, maxRecentEntries: 3 });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let memory = SummaryMemory(model: model, maxRecentEntries: 3)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val memory = SummaryMemory(model, maxRecentEntries = 3)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="usage" level="h2">
          Usage with Session
        </AnchorLink>
        <p>
          Attach a Memory instance to a Session for automatic conversation
          history management. The session saves each exchange after every{" "}
          <code>send()</code> call.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const session = new Session({
  model: new LocanaraModel(),
  memory: new BufferMemory({ maxEntries: 10 }),
});
const response = await session.send("Hello!");
// Memory automatically saves the exchange`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let session = Session(
    model: FoundationLanguageModel(),
    memory: BufferMemory(maxEntries: 10)
)
let response = try await session.send("Hello!")
// Memory automatically saves the exchange`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val session = Session(
    model = PromptApiModel(context),
    memory = BufferMemory(maxEntries = 10)
)
val response = session.send("Hello!")
// Memory automatically saves the exchange`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis/chain">Chain</Link>,{" "}
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/pipeline", label: "Pipeline" }}
        next={{ to: "/docs/apis/guardrail", label: "Guardrail" }}
      />
    </div>
  );
}

export default MemoryAPI;
