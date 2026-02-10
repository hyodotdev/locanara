import { Link } from "react-router-dom";
import APICard from "../../../components/APICard";
import CodeBlock from "../../../components/CodeBlock";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function APIsIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="APIs"
        description="Core framework APIs for Locanara on-device AI — Chain, Pipeline, Memory, Guardrail, Session, Agent, and Model."
        path="/docs/apis"
        keywords="Locanara APIs, Chain, Pipeline, Memory, Guardrail, Session, Agent, Model, on-device AI"
      />
      <h1>APIs</h1>
      <p>
        Core framework primitives for building composable, production-ready AI
        features.
      </p>

      <TLDRBox title="Framework APIs">
        <ul>
          <li>
            <strong>Chain</strong>: Composable AI building block
          </li>
          <li>
            <strong>Pipeline</strong>: Type-safe chain composition
          </li>
          <li>
            <strong>Memory</strong>: Conversation history management
          </li>
          <li>
            <strong>Guardrail</strong>: Input/output validation
          </li>
          <li>
            <strong>Session</strong>: Stateful conversation management
          </li>
          <li>
            <strong>Agent</strong>: Autonomous reasoning with tools
          </li>
          <li>
            <strong>Model</strong>: Platform AI backend abstraction
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2>Quick Example</h2>
        <p>
          Combine a <code>Pipeline</code> with a <code>Guardrail</code> to build
          a safe, composable AI feature in just a few lines.
        </p>
        <CodeBlock
          language="swift"
          code={`// Swift — Pipeline + Guardrail
let guard = InputLengthGuardrail(maxLength: 2000)
let pipeline = Pipeline(
    steps: [SummarizeChain(), TranslateChain(to: .spanish)]
)

let guarded = GuardedChain(chain: pipeline, guardrails: [guard])
let result = try await guarded.invoke(ChainInput(text: article))`}
        />
        <CodeBlock
          language="kotlin"
          code={`// Kotlin — Pipeline + Guardrail
val guard = InputLengthGuardrail(maxLength = 2000)
val pipeline = Pipeline(
    steps = listOf(SummarizeChain(), TranslateChain(to = Language.SPANISH))
)

val guarded = GuardedChain(chain = pipeline, guardrails = listOf(guard))
val result = guarded.invoke(ChainInput(text = article))`}
        />
      </section>

      <section>
        <h2>API Reference</h2>
        <p>
          Explore each framework primitive. Click a card to view its full API
          documentation.
        </p>
        <div className="api-cards-grid">
          <APICard
            title="getDeviceCapability"
            description="Check device AI capabilities and determine which features are available."
            href="/docs/apis/get-device-capability"
            count={3}
          />
          <APICard
            title="Chain"
            description="Chain, ModelChain, SequentialChain, ParallelChain, ConditionalChain."
            href="/docs/apis/chain"
            count={5}
          />
          <APICard
            title="Pipeline"
            description="Type-safe chain composition with compile-time validation."
            href="/docs/apis/pipeline"
            count={2}
          />
          <APICard
            title="Memory"
            description="Memory, BufferMemory, SummaryMemory."
            href="/docs/apis/memory"
            count={3}
          />
          <APICard
            title="Guardrail"
            description="Guardrail, InputLengthGuardrail, ContentFilterGuardrail, GuardedChain."
            href="/docs/apis/guardrail"
            count={4}
          />
          <APICard
            title="Session"
            description="Stateful conversation management with memory and context."
            href="/docs/apis/session"
            count={1}
          />
          <APICard
            title="Agent"
            description="Agent, AgentConfig, FunctionTool, LocalSearchTool."
            href="/docs/apis/agent"
            count={4}
          />
          <APICard
            title="Model"
            description="LocanaraModel, FoundationLanguageModel, PromptApiModel."
            href="/docs/apis/model"
            count={3}
          />
        </div>
      </section>

      <p className="type-link">
        For built-in utility functions (summarize, classify, translate, etc.),
        see <Link to="/docs/utils">Built-in Utils</Link>.
      </p>
    </div>
  );
}

export default APIsIndex;
