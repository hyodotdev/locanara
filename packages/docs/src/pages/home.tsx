import { Link } from "react-router-dom";
import { LOCANARA_VERSIONS } from "../lib/versioning";
import { LOGO_PATH } from "../lib/config";
import SEO from "../components/SEO";

function Home() {
  return (
    <div className="home">
      <SEO path="/" />
      <section className="hero">
        <div className="hero-container">
          <img
            src={LOGO_PATH}
            alt="Locanara"
            className="hero-logo"
            style={{ width: "120px", height: "120px", marginBottom: "2rem" }}
          />
          <h1 className="hero-title">
            Loca<span className="highlight">nara</span>
          </h1>
          <div style={{ marginBottom: "1.5rem" }}>
            <Link
              to="/docs/introduction"
              className="version-badge"
              title="View versions"
            >
              v{LOCANARA_VERSIONS.types}
            </Link>
          </div>
          <p className="hero-subtitle">
            On-Device AI Framework for iOS and Android
            <br />
            Composable chains, memory, guardrails, and pipeline DSL —
            privacy-first
          </p>
          <div className="hero-actions">
            <Link to="/introduction" className="btn btn-primary">
              Get Started
            </Link>
            <a
              href="https://github.com/locanara"
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Github
            </a>
          </div>
          <div className="hero-divider" role="separator" aria-hidden="true" />
          <div className="hero-caption">Platform SDKs</div>
          <div className="hero-modules hero-modules-grid">
            <a
              href="https://github.com/locanara/locanara-apple"
              target="_blank"
              rel="noopener noreferrer"
              className="module-card"
              title="Locanara SDK for iOS"
            >
              <div className="module-text">
                <div className="module-title">locanara-apple</div>
                <div className="module-desc">
                  Apple Intelligence & Foundation Models
                </div>
              </div>
            </a>
            <a
              href="https://github.com/locanara/locanara-android"
              target="_blank"
              rel="noopener noreferrer"
              className="module-card"
              title="Locanara SDK for Android"
            >
              <div className="module-text">
                <div className="module-title">locanara-android</div>
                <div className="module-desc">Gemini Nano & ML Kit GenAI</div>
              </div>
            </a>
            <a
              href="https://github.com/locanara/locanara-web"
              target="_blank"
              rel="noopener noreferrer"
              className="module-card"
              title="Locanara SDK for Web"
            >
              <div className="module-text">
                <div className="module-title">locanara-web</div>
                <div className="module-desc">
                  Chrome Built-in AI (Gemini Nano)
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="home-section section-problem">
        <div className="section-container">
          <h2>What We're Building</h2>
          <p
            className="section-subtitle"
            style={{
              maxWidth: "800px",
              margin: "0 auto 3rem",
              lineHeight: "1.8",
              textAlign: "center",
            }}
          >
            Locanara is an on-device AI framework inspired by LangChain,
            purpose-built for mobile. Build, compose, and extend AI features
            using platform-native models — all processing happens locally.
            <br />
            <br />
            <strong>
              "A framework for building AI features, not just calling a model."
            </strong>
          </p>
          <div className="benefit-grid">
            <div className="benefit">
              <h3>Privacy First</h3>
              <p>
                All AI processing happens on-device. Your data never leaves the
                device.
              </p>
            </div>
            <div className="benefit">
              <h3>Composable Chains</h3>
              <p>
                Build AI features by composing chains. Implement the Chain
                protocol to create custom functionality.
              </p>
            </div>
            <div className="benefit">
              <h3>Pipeline DSL</h3>
              <p>
                Chain multiple operations with compile-time type safety.
                Proofread then translate in one pipeline.
              </p>
            </div>
            <div className="benefit">
              <h3>Memory & Guardrails</h3>
              <p>
                Built-in conversation memory (Buffer, Summary) and input/output
                guardrails for production use.
              </p>
            </div>
            <div className="benefit">
              <h3>7 Built-in Chains</h3>
              <p>
                Summarize, Classify, Extract, Chat, Translate, Rewrite,
                Proofread — ready to use and extendable.
              </p>
            </div>
            <div className="benefit">
              <h3>Open Source</h3>
              <p>
                Fully open source and community-driven. Contribute, extend, and
                customize.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section section-how">
        <div className="section-container">
          <h2>How Locanara Works</h2>
          <p className="section-subtitle">
            A layered framework — like LangChain, but for on-device AI
          </p>
          <div className="specification-grid">
            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">🔗</div>
                <h3>Chain Protocol</h3>
                <p>Build your own AI features</p>
              </div>
              <div className="spec-items">
                <Link
                  to="/docs/why-locanara#our-approach"
                  className="spec-item"
                >
                  <code>Chain</code>
                  <span>Implement custom AI logic</span>
                </Link>
                <Link
                  to="/docs/why-locanara#our-approach"
                  className="spec-item"
                >
                  <code>Pipeline</code>
                  <span>Compose chains with type safety</span>
                </Link>
                <Link
                  to="/docs/why-locanara#our-approach"
                  className="spec-item"
                >
                  <code>Memory</code>
                  <span>Buffer &amp; Summary memory</span>
                </Link>
                <Link
                  to="/docs/why-locanara#our-approach"
                  className="spec-item"
                >
                  <code>Guardrail</code>
                  <span>Input/output validation</span>
                </Link>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">⚡</div>
                <h3>Platform Backends</h3>
                <p>Native integration with OS AI</p>
              </div>
              <div className="spec-items">
                <Link to="/docs/tutorials/ios" className="spec-item">
                  <code>Apple Intelligence</code>
                  <span>Foundation Models</span>
                </Link>
                <Link to="/docs/tutorials/android" className="spec-item">
                  <code>Gemini Nano</code>
                  <span>ML Kit GenAI</span>
                </Link>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">📦</div>
                <h3>7 Built-in Chains</h3>
                <p>Samples &amp; ready-to-use utilities</p>
              </div>
              <div className="spec-items">
                <Link to="/docs/utils/summarize" className="spec-item">
                  <code>SummarizeChain</code>
                  <span>Text summarization</span>
                </Link>
                <Link to="/docs/utils/classify" className="spec-item">
                  <code>ClassifyChain</code>
                  <span>Text classification</span>
                </Link>
                <Link to="/docs/utils/translate" className="spec-item">
                  <code>TranslateChain</code>
                  <span>Language translation</span>
                </Link>
                <Link to="/docs/utils/chat" className="spec-item">
                  <code>ChatChain</code>
                  <span>Conversational AI</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section section-who">
        <div className="section-container">
          <h2>Build Any AI Feature</h2>
          <p className="section-subtitle">
            Implement the Chain protocol to create your own — built-in chains
            are just samples
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <div
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🔗</div>
              <div>
                <h3>Your Custom Chain</h3>
                <p>Content moderation, food labels, medical triage...</p>
              </div>
            </div>

            <Link
              to="/docs/utils/summarize"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>📝</div>
              <div>
                <h3>SummarizeChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/classify"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🏷️</div>
              <div>
                <h3>ClassifyChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/extract"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🔍</div>
              <div>
                <h3>ExtractChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/chat"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>💬</div>
              <div>
                <h3>ChatChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/translate"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🌐</div>
              <div>
                <h3>TranslateChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/rewrite"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>✏️</div>
              <div>
                <h3>RewriteChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>

            <Link
              to="/docs/utils/proofread"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>✅</div>
              <div>
                <h3>ProofreadChain</h3>
                <p>Built-in sample</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section section-trust">
        <div className="section-container">
          <h2>Built by Open Source Veterans</h2>
          <p className="section-subtitle">
            Years of experience building cross-platform SDKs (react-native-iap,
            flutter_inapp_purchase, expo-iap).
            <br />
            We specialize in unifying fragmented platform APIs.
          </p>
        </div>
      </section>

      <section className="home-section section-why">
        <div className="section-container">
          <h2>Get Started</h2>
          <p className="section-subtitle">
            Start building with on-device AI today
          </p>
          <div className="cta-container">
            <Link to="/introduction" className="cta-button">
              <span>🚀</span> Read the Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
