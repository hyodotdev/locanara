import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function SessionAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Session API"
        description="Session — stateful AI conversation management with Memory and Guardrails."
        path="/docs/apis/session"
      />
      <h1>Session</h1>
      <p>
        Session combines a Model, Memory, and optional Guardrails into a
        stateful conversation unit. Use <code>send()</code> for chat and{" "}
        <code>run()</code> for chain execution.
      </p>

      <TLDRBox>
        <ul>
          <li>
            Combines a <strong>Model</strong>, <strong>Memory</strong>, and
            optional <strong>Guardrails</strong> into a stateful conversation
          </li>
          <li>
            Use <code>send()</code> for chat, <code>run()</code> for chain
            execution
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="create" level="h2">
          Creating a Session
        </AnchorLink>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const session = new Session({
  model: new LocanaraModel(),
  memory: new BufferMemory({ maxEntries: 10, maxTokens: 2000 }),
  guardrails: [new InputLengthGuardrail({ maxCharacters: 500 })],
});`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let session = Session(
    model: FoundationLanguageModel(),
    memory: BufferMemory(maxEntries: 10, maxTokens: 2000),
    guardrails: [InputLengthGuardrail(maxCharacters: 500)]
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val session = Session(
    model = PromptApiModel(context),
    memory = BufferMemory(maxEntries = 10, maxTokens = 2000),
    guardrails = listOf(InputLengthGuardrail(maxCharacters = 500))
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="send" level="h2">
          send()
        </AnchorLink>
        <p>
          Send a message and get a response. Memory is automatically updated
          with both the user message and model response.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const response = await session.send("What's the capital of France?");`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let response = try await session.send("What's the capital of France?")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val response = session.send("What's the capital of France?")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="run" level="h2">
          run()
        </AnchorLink>
        <p>
          Run a chain within the session context. The session's memory and
          guardrails are applied automatically.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const result = await session.run(
  new SummarizeChain({ model }),
  new ChainInput({ text: longText })
);`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let result = try await session.run(
    SummarizeChain(model: model),
    input: ChainInput(text: longText)
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val result = session.run(
    SummarizeChain(model = model),
    input = ChainInput(text = longText)
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="reset" level="h2">
          reset()
        </AnchorLink>
        <p>Clear memory and start a fresh conversation.</p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`await session.reset();`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`await session.reset()`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`session.reset()`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Multi-turn Example
        </AnchorLink>
        <p>
          Context is preserved across turns. The model remembers previous
          messages through the session's memory.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const session = new Session({
  model: new LocanaraModel(),
  memory: new BufferMemory({ maxEntries: 20, maxTokens: 4000 }),
});

// Turn 1
const r1 = await session.send("My name is Alex.");
console.log(r1); // "Nice to meet you, Alex!"

// Turn 2
const r2 = await session.send("What are the benefits of on-device AI?");
console.log(r2); // Lists benefits of on-device AI

// Turn 3 — context is preserved
const r3 = await session.send("Can you summarize what we discussed?");
console.log(r3); // Summarizes the conversation including Alex's name and the AI topic`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let session = Session(
    model: FoundationLanguageModel(),
    memory: BufferMemory(maxEntries: 20, maxTokens: 4000)
)

// Turn 1
let r1 = try await session.send("My name is Alex.")
print(r1) // "Nice to meet you, Alex!"

// Turn 2
let r2 = try await session.send("What are the benefits of on-device AI?")
print(r2) // Lists benefits of on-device AI

// Turn 3 — context is preserved
let r3 = try await session.send("Can you summarize what we discussed?")
print(r3) // Summarizes the conversation including Alex's name and the AI topic`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val session = Session(
    model = PromptApiModel(context),
    memory = BufferMemory(maxEntries = 20, maxTokens = 4000)
)

// Turn 1
val r1 = session.send("My name is Alex.")
println(r1) // "Nice to meet you, Alex!"

// Turn 2
val r2 = session.send("What are the benefits of on-device AI?")
println(r2) // Lists benefits of on-device AI

// Turn 3 — context is preserved
val r3 = session.send("Can you summarize what we discussed?")
println(r3) // Summarizes the conversation including Alex's name and the AI topic`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/guardrail", label: "Guardrail" }}
        next={{ to: "/docs/apis/agent", label: "Agent" }}
      />
    </div>
  );
}

export default SessionAPI;
