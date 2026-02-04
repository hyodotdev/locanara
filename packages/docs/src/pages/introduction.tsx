import SEO from "../components/SEO";

function Introduction() {
  return (
    <div className="page-container">
      <SEO
        title="Why Locanara?"
        description="Learn about Locanara - a unified SDK for on-device AI capabilities across iOS (Apple Intelligence), Android (Gemini Nano), and Web (Chrome Built-in AI)."
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
          A unified on-device AI SDK for iOS, Android, and Web. One API, all
          platforms, complete privacy.
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

          <h3>Unified API</h3>
          <p>
            Locanara defines standard methods like <code>summarize()</code>,{" "}
            <code>classify()</code>, <code>translate()</code>, and{" "}
            <code>chat()</code> that work consistently across all platforms.
            Write your AI features once, deploy everywhere.
          </p>

          <h3>Type Safety</h3>
          <p>
            All types like <code>DeviceCapability</code>,{" "}
            <code>ExecutionResult</code>, and <code>FeatureType</code> are
            consistent across iOS, Android, and Web, ensuring type safety and
            reducing cognitive load.
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
          <h2>Supported Features</h2>
          <ul>
            <li>
              <strong>Summarize:</strong> Condense long text into key points
            </li>
            <li>
              <strong>Classify:</strong> Categorize text into predefined labels
            </li>
            <li>
              <strong>Extract:</strong> Extract entities and key-value pairs
            </li>
            <li>
              <strong>Chat:</strong> Conversational AI interactions
            </li>
            <li>
              <strong>Translate:</strong> Multi-language translation
            </li>
            <li>
              <strong>Rewrite:</strong> Rephrase with different styles
            </li>
            <li>
              <strong>Proofread:</strong> Grammar and spelling correction
            </li>
            <li>
              <strong>Describe Image:</strong> Generate image descriptions
            </li>
          </ul>
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
              <strong>Unified:</strong> One API for iOS, Android, and Web
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
