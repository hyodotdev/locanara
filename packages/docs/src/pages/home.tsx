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
              to="/docs/updates/versions"
              className="version-badge"
              title="View versions"
            >
              v{LOCANARA_VERSIONS.types}
            </Link>
          </div>
          <p className="hero-subtitle">
            Unified On-Device AI SDK for iOS, Android, and Web
            <br />
            Privacy-first AI processing with GraphQL-based API
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
            Locanara is an SDK and common layer for developers to easily use
            on-device AI. Use the same concepts and structure across iOS,
            Android, Web, React Native, and Flutter.
            <br />
            <br />
            <strong>
              "AI that runs directly on device, regardless of platform."
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
              <h3>Unified API</h3>
              <p>
                Same concepts, same structure across all platforms. Platform
                differences handled by the SDK.
              </p>
            </div>
            <div className="benefit">
              <h3>Instant & Offline</h3>
              <p>
                No network required. AI responds instantly and works completely
                offline.
              </p>
            </div>
            <div className="benefit">
              <h3>Cross-Platform</h3>
              <p>
                iOS, Android, Web, React Native, Flutter. Native performance
                with unified API.
              </p>
            </div>
            <div className="benefit">
              <h3>Feature Rich</h3>
              <p>
                Summarize, Classify, Extract, Chat, Translate, Rewrite,
                Proofread, and Image Description.
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
            Unifying diverse platform AI APIs into a single, consistent SDK
          </p>
          <div className="specification-grid">
            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">📋</div>
                <h3>Unified Features</h3>
                <p>Standard AI capabilities across all platforms</p>
              </div>
              <div className="spec-items">
                <Link to="/docs/apis/summarize" className="spec-item">
                  <code>summarize()</code>
                  <span>Text summarization</span>
                </Link>
                <Link to="/docs/apis/classify" className="spec-item">
                  <code>classify()</code>
                  <span>Text classification</span>
                </Link>
                <Link to="/docs/apis/translate" className="spec-item">
                  <code>translate()</code>
                  <span>Language translation</span>
                </Link>
                <Link to="/docs/apis/chat" className="spec-item">
                  <code>chat()</code>
                  <span>Conversational AI</span>
                </Link>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">⚡</div>
                <h3>Platform APIs</h3>
                <p>Native integration with platform AI</p>
              </div>
              <div className="spec-items">
                <Link to="/docs/apis/ios" className="spec-item">
                  <code>Apple Intelligence</code>
                  <span>Foundation Models</span>
                </Link>
                <Link to="/docs/apis/android" className="spec-item">
                  <code>Gemini Nano</code>
                  <span>ML Kit GenAI</span>
                </Link>
                <Link to="/docs/apis/web" className="spec-item">
                  <code>Chrome Built-in AI</code>
                  <span>Gemini Nano for Web</span>
                </Link>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-header">
                <div className="spec-icon">🔧</div>
                <h3>Unified Types</h3>
                <p>GraphQL-based type definitions</p>
              </div>
              <div className="spec-items">
                <Link to="/docs/types#device-capability" className="spec-item">
                  <code>DeviceCapability</code>
                  <span>Device AI capabilities</span>
                </Link>
                <Link to="/docs/types#execution-result" className="spec-item">
                  <code>ExecutionResult</code>
                  <span>AI execution results</span>
                </Link>
                <Link to="/docs/types#feature-type" className="spec-item">
                  <code>FeatureType</code>
                  <span>Available AI features</span>
                </Link>
                <Link to="/docs/types#summarize-result" className="spec-item">
                  <code>SummarizeResult</code>
                  <span>Summarization output</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section section-who">
        <div className="section-container">
          <h2>Supported AI Features</h2>
          <p className="section-subtitle">
            Comprehensive on-device AI capabilities
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <Link
              to="/docs/apis/summarize"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>📝</div>
              <div>
                <h3>Summarize</h3>
                <p>Condense long text into key points</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/classify"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🏷️</div>
              <div>
                <h3>Classify</h3>
                <p>Categorize text into predefined labels</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/extract"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🔍</div>
              <div>
                <h3>Extract</h3>
                <p>Extract entities and key-value pairs</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/chat"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>💬</div>
              <div>
                <h3>Chat</h3>
                <p>Conversational AI interactions</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/translate"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🌐</div>
              <div>
                <h3>Translate</h3>
                <p>Multi-language translation</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/rewrite"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>✏️</div>
              <div>
                <h3>Rewrite</h3>
                <p>Rephrase with different styles</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/proofread"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>✅</div>
              <div>
                <h3>Proofread</h3>
                <p>Grammar and spelling correction</p>
              </div>
            </Link>

            <Link
              to="/docs/apis/describe-image"
              className="implementation-card"
              style={{ flex: "0 0 auto", minWidth: "180px" }}
            >
              <div style={{ fontSize: "2rem" }}>🖼️</div>
              <div>
                <h3>Describe Image</h3>
                <p>Generate image descriptions</p>
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
