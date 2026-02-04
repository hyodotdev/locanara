import { Link } from "react-router-dom";
import { FaApple, FaAndroid, FaChrome } from "react-icons/fa";
import SEO from "../../components/SEO";
import PageNavigation from "../../components/PageNavigation";

function Introduction() {
  return (
    <div className="doc-page">
      <SEO
        title="Introduction"
        description="Locanara - A unified on-device AI SDK for iOS, Android, and Web platforms."
        path="/docs/introduction"
        keywords="Locanara, on-device AI, Apple Intelligence, Gemini Nano, Chrome Built-in AI"
      />
      <h1>Introduction</h1>
      <p>
        Locanara is a unified on-device AI SDK that provides a common API layer
        for iOS, Android, and Web platforms. All AI processing happens locally
        on the device, ensuring user privacy and enabling offline functionality.
      </p>

      <section>
        <h2 id="core-principles">Core Principles</h2>
        <ul>
          <li>
            <strong>On-Device Only</strong> - All AI processing happens locally.
            No cloud fallback.
          </li>
          <li>
            <strong>Privacy First</strong> - User data never leaves the device.
          </li>
          <li>
            <strong>Unified API</strong> - Same concepts and structure across
            all platforms.
          </li>
        </ul>
      </section>

      <section>
        <h2 id="supported-platforms">Supported Platforms</h2>
        <div className="api-cards-grid three-columns">
          <Link to="/docs/tutorials/ios" className="api-card">
            <div className="api-card-icon">
              <FaApple size={24} />
            </div>
            <h3>iOS / macOS</h3>
            <p>
              Apple Intelligence (Foundation Models)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                iOS 26+ / macOS 26+
              </span>
            </p>
          </Link>

          <Link to="/docs/tutorials/android" className="api-card">
            <div className="api-card-icon">
              <FaAndroid size={24} />
            </div>
            <h3>Android</h3>
            <p>
              Gemini Nano (ML Kit GenAI)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Android 14+ (API 34+)
              </span>
            </p>
          </Link>

          <Link to="/docs/tutorials/web" className="api-card">
            <div className="api-card-icon">
              <FaChrome size={24} />
            </div>
            <h3>Web</h3>
            <p>
              Chrome Built-in AI (Gemini Nano)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Chrome 128+
              </span>
            </p>
          </Link>
        </div>

        <div className="alert-card alert-card--info">
          <p>
            <strong>Looking for broader device support?</strong> The Community
            SDK requires devices with Apple Intelligence or Gemini Nano. For
            devices without these native AI capabilities,{" "}
            <a
              href="https://locanara.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Locanara Pro
            </a>{" "}
            provides a standalone inference engine that works on virtually any
            device. We are currently recruiting{" "}
            <strong>Founding Members</strong> to shape the future of on-device
            AI together.
          </p>
        </div>
      </section>

      <section>
        <h2 id="features">Available Features</h2>

        <h4>Community (Free)</h4>
        <p className="feature-subtitle">
          Requires devices with Apple Intelligence, Gemini Nano, or Chrome
          Built-in AI
        </p>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th className="text-center">iOS</th>
              <th className="text-center">Android</th>
              <th className="text-center">
                Web <span className="badge badge-pro">Pro</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Summarize", ios: true, android: true, web: true },
              { name: "Classify", ios: true, android: true, web: true },
              { name: "Extract", ios: true, android: true, web: true },
              { name: "Chat", ios: true, android: true, web: true },
              { name: "Translate", ios: true, android: true, web: true },
              { name: "Rewrite", ios: true, android: true, web: true },
              { name: "Proofread", ios: true, android: true, web: true },
              { name: "Describe Image", ios: false, android: true, web: false },
              { name: "Generate Image", ios: true, android: false, web: false },
            ].map((feature) => (
              <tr key={feature.name}>
                <td>{feature.name}</td>
                <td className="text-center">{feature.ios ? "✓" : "—"}</td>
                <td className="text-center">{feature.android ? "✓" : "—"}</td>
                <td className="text-center">{feature.web ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>
          Pro{" "}
          <a
            href="https://locanara.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="header-inline-link"
          >
            (Founding Members)
          </a>
        </h4>
        <p className="feature-subtitle">
          Works on any device with standalone inference engine
        </p>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th className="text-center">iOS</th>
              <th className="text-center">Android</th>
              <th className="text-center">
                Web <span className="badge badge-pro">Pro</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                name: "All Community Features",
                ios: true,
                android: true,
                web: true,
              },
              { name: "Describe Image", ios: true, android: true, web: true },
              { name: "Generate Image", ios: true, android: true, web: true },
              { name: "Fallback Engine", ios: true, android: true, web: true },
            ].map((feature) => (
              <tr key={feature.name}>
                <td>{feature.name}</td>
                <td className="text-center">{feature.ios ? "✓" : "—"}</td>
                <td className="text-center">{feature.android ? "✓" : "—"}</td>
                <td className="text-center">{feature.web ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 id="get-started">Get Started</h2>
        <p>Choose your platform to begin:</p>
        <ul>
          <li>
            <Link to="/docs/tutorials/ios">
              <strong>iOS SDK Tutorial</strong>
            </Link>{" "}
            - Build with Apple Intelligence
          </li>
          <li>
            <Link to="/docs/tutorials/android">
              <strong>Android SDK Tutorial</strong>
            </Link>{" "}
            - Build with Gemini Nano
          </li>
          <li>
            <Link to="/docs/tutorials/web">
              <strong>Web SDK Tutorial</strong>
            </Link>{" "}
            - Build with Chrome Built-in AI
          </li>
        </ul>
      </section>

      <PageNavigation
        next={{ to: "/docs/tutorials/ios", label: "iOS SDK Tutorial" }}
      />
    </div>
  );
}

export default Introduction;
