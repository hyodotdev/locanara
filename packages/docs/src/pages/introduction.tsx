import SEO from "../components/SEO";

function Introduction() {
  return (
    <div className="page-container">
      <SEO
        title="Why Locanara?"
        description="Locanara is an on-device AI framework inspired by LangChain. Build custom AI features with composable chains, memory, guardrails, and pipeline DSL."
        path="/introduction"
      />
      <div className="content-wrapper">
        <h1>Why Locanara?</h1>
        <p
          style={{
            fontSize: "1.25rem",
            color: "var(--text-secondary)",
            marginBottom: "3rem",
          }}
        >
          An on-device AI framework for iOS and Android. Composable chains,
          memory, guardrails, pipeline DSL — all on-device, complete privacy.
        </p>

        <section className="intro-section">
          <h2>The Problem</h2>
          <p>
            On-device AI capabilities are fragmented across platforms. iOS has
            Apple Intelligence with Foundation Models, Android has Gemini Nano
            with ML Kit GenAI, and Web has Chrome Built-in AI. Each platform has
            its own APIs, patterns, and limitations. Developers must learn
            different APIs for each platform, increasing complexity and
            development time.
          </p>
          <p>
            In the AI coding era, this fragmentation becomes even more
            problematic. AI assistants struggle to generate consistent code when
            every platform has different patterns, making on-device AI
            implementation unnecessarily complex.
          </p>
        </section>

        <section className="intro-section">
          <h2>Our Solution</h2>

          <h3>Privacy First</h3>
          <p>
            All AI processing happens on-device. Your users' data never leaves
            their device, ensuring complete privacy and security. No cloud
            dependencies, no data transmission, no privacy concerns.
          </p>

          <h3>Framework, Not Just API</h3>
          <p>
            Locanara is a composable framework inspired by LangChain.{" "}
            <code>Chain</code>, <code>Memory</code>, <code>Guardrail</code>, and{" "}
            <code>Pipeline</code> let you build, compose, and extend AI features
            — not just call a model. 7 built-in chains are included as both
            ready-to-use utilities and reference implementations.
          </p>

          <h3>Type Safety</h3>
          <p>
            All chains return compile-time typed results — your custom types,
            not raw text. The Pipeline DSL tracks types through each step at
            compile time.
          </p>

          <h3>Zero Cost</h3>
          <p>
            The iOS App Store and Google Play grew exponentially because
            developers could build and distribute apps for free. Locanara
            follows the same philosophy—completely free and open source. No API
            keys, no usage fees, no vendor lock-in. Just powerful on-device AI
            that anyone can use.
          </p>
        </section>

        <section className="intro-section">
          <h2>Built-in Chains (Samples)</h2>
          <p>
            7 built-in chains ship as both ready-to-use utilities and reference
            implementations for building your own:
          </p>
          <ul>
            <li>
              <strong>SummarizeChain</strong> / <strong>ClassifyChain</strong> /{" "}
              <strong>ExtractChain</strong>
            </li>
            <li>
              <strong>ChatChain</strong> / <strong>TranslateChain</strong> /{" "}
              <strong>RewriteChain</strong> / <strong>ProofreadChain</strong>
            </li>
          </ul>
          <p>
            The real power is implementing the <code>Chain</code> protocol to
            create AI features specific to your app.
          </p>
        </section>

        <section className="intro-section">
          <h2>Platform Support</h2>
          <ul>
            <li>
              <strong>iOS:</strong> Apple Intelligence with Foundation Models
              (iOS 26+)
            </li>
            <li>
              <strong>Android:</strong> Gemini Nano with ML Kit GenAI (Android
              14+, API 34+)
            </li>
            <li>
              <strong>Web:</strong> Chrome Built-in AI with Gemini Nano (Chrome
              128+)
            </li>
          </ul>
        </section>

        <section className="intro-section">
          <h2>Benefits</h2>
          <ul>
            <li>
              <strong>Privacy:</strong> All processing on-device, no data leaves
              the device
            </li>
            <li>
              <strong>Offline:</strong> Works without internet connection
            </li>
            <li>
              <strong>Fast:</strong> No network latency, instant responses
            </li>
            <li>
              <strong>Composable:</strong> Chain, Memory, Guardrail, Pipeline
              primitives
            </li>
            <li>
              <strong>Type Safe:</strong> Consistent types across all platforms
            </li>
            <li>
              <strong>Zero Cost:</strong> No API keys, no usage fees, no vendor
              lock-in
            </li>
          </ul>
        </section>

        <section className="intro-section">
          <h2>Getting Started</h2>
          <p>
            Ready to add on-device AI to your app? Check out our
            platform-specific tutorials:
          </p>
          <ul style={{ marginTop: "1rem" }}>
            <li>
              <a href="/docs/tutorials/ios">iOS SDK Tutorial</a>
            </li>
            <li>
              <a href="/docs/tutorials/android">Android SDK Tutorial</a>
            </li>
            <li>
              <a href="/docs/tutorials/web">Web SDK Tutorial</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Introduction;
