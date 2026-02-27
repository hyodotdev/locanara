import { Link } from "react-router-dom";
import { SEO } from "../../../components/SEO";
import PageNavigation from "../../../components/docs/PageNavigation";

function TutorialsIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="Tutorials"
        description="Step-by-step tutorials for implementing on-device AI features with Locanara SDK."
        path="/docs/tutorials"
        keywords="Locanara tutorial, iOS tutorial, Android tutorial, on-device AI, Swift, Kotlin"
      />
      <h1>Tutorials</h1>
      <p>
        Step-by-step guides to help you implement on-device AI features using
        Locanara. Each tutorial includes code for all platforms (Swift, Kotlin,
        TypeScript) so you can follow along regardless of your target platform.
      </p>

      <section>
        <h2 id="setup">Platform Setup</h2>
        <p>
          Before diving into feature tutorials, set up the SDK for your
          platform.
        </p>
        <div className="api-cards-grid">
          <Link to="/docs/ios-setup" className="api-card">
            <h3>iOS Setup</h3>
            <p>
              Install via SPM, configure Apple Intelligence or llama.cpp engine.
            </p>
          </Link>
          <Link to="/docs/android-setup" className="api-card">
            <h3>Android Setup</h3>
            <p>Install via Maven Central, configure Gemini Nano with ML Kit.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 id="feature-tutorials">Feature Tutorials</h2>
        <div className="api-cards-grid">
          <Link to="/docs/tutorials/summarize" className="api-card">
            <h3>Summarize</h3>
            <p>Condense long text into key bullet points.</p>
          </Link>
          <Link to="/docs/tutorials/classify" className="api-card">
            <h3>Classify</h3>
            <p>Categorize content into predefined labels.</p>
          </Link>
          <Link to="/docs/tutorials/extract" className="api-card">
            <h3>Extract</h3>
            <p>Pull structured data from unstructured text.</p>
          </Link>
          <Link to="/docs/tutorials/chat" className="api-card">
            <h3>Chat</h3>
            <p>Build conversational AI with memory and streaming.</p>
          </Link>
          <Link to="/docs/tutorials/translate" className="api-card">
            <h3>Translate</h3>
            <p>Translate text between languages on-device.</p>
          </Link>
          <Link to="/docs/tutorials/rewrite" className="api-card">
            <h3>Rewrite</h3>
            <p>Change tone and style of text.</p>
          </Link>
          <Link to="/docs/tutorials/proofread" className="api-card">
            <h3>Proofread</h3>
            <p>Grammar and spelling correction with diff tracking.</p>
          </Link>
          <Link to="/docs/tutorials/model-selection" className="api-card">
            <h3>Model Selection</h3>
            <p>Switch between AI engines and manage downloadable models.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 id="framework-tutorials">Framework Tutorials</h2>
        <p>
          Learn the composable building blocks of Locanara — the same primitives
          used by the built-in features above. Build custom AI workflows using
          chains, pipelines, memory, and agents.
        </p>
        <div className="api-cards-grid">
          <Link to="/docs/tutorials/model" className="api-card">
            <h3>Model</h3>
            <p>
              Direct model usage with GenerationConfig presets and streaming.
            </p>
          </Link>
          <Link to="/docs/tutorials/chain" className="api-card">
            <h3>Chain</h3>
            <p>
              Compose AI logic with ModelChain, SequentialChain, ParallelChain,
              and custom chains.
            </p>
          </Link>
          <Link to="/docs/tutorials/pipeline" className="api-card">
            <h3>Pipeline</h3>
            <p>Multi-step AI composition with compile-time type safety.</p>
          </Link>
          <Link to="/docs/tutorials/memory" className="api-card">
            <h3>Memory</h3>
            <p>
              BufferMemory and SummaryMemory for conversation history
              management.
            </p>
          </Link>
          <Link to="/docs/tutorials/guardrail" className="api-card">
            <h3>Guardrail</h3>
            <p>Input validation and content safety for AI chains.</p>
          </Link>
          <Link to="/docs/tutorials/session" className="api-card">
            <h3>Session</h3>
            <p>Stateful chat with automatic memory management.</p>
          </Link>
          <Link to="/docs/tutorials/agent" className="api-card">
            <h3>Agent</h3>
            <p>ReAct-lite agents with tools and step-by-step reasoning.</p>
          </Link>
        </div>
      </section>

      <PageNavigation
        prev={{ to: "/docs/resources", label: "Resources" }}
        next={{ to: "/docs/tutorials/summarize", label: "Summarize Tutorial" }}
      />
    </div>
  );
}

export default TutorialsIndex;
