import { Link } from "react-router-dom";
import SEO from "../components/SEO";

function Languages() {
  return (
    <div className="page-container">
      <SEO
        title="SDKs & Implementations"
        description="On-device AI SDKs for React Native, Expo, Flutter, and Kotlin Multiplatform. Early access program available."
        path="/languages"
        keywords="locanara-react-native, locanara-expo, locanara-flutter, locanara-kmp, on-device AI"
      />
      <div className="content-wrapper">
        <h1>SDKs & Implementations</h1>
        <p className="page-subtitle">
          On-device AI SDKs for cross-platform development
        </p>

        <h2 style={{ marginTop: "2.5rem" }}>Locanara Core Modules</h2>
        <p className="page-subtitle">
          Official modules maintained under the Locanara organization. Core
          modules are kept private for advanced feature development and
          intellectual property protection.
        </p>
        <div className="languages-grid">
          <div className="language-card">
            <h3>locanara-apple</h3>
            <p>
              Official Locanara module for Apple platforms (Foundation Models)
            </p>
          </div>

          <div className="language-card">
            <h3>locanara-android</h3>
            <p>Official Locanara module for Android (Gemini Nano & ML Kit)</p>
          </div>

          <div className="language-card">
            <h3>locanara-web</h3>
            <p>Official Locanara module for Web (Chrome Built-in AI)</p>
          </div>
        </div>

        <h2 style={{ marginTop: "2.5rem" }}>Framework SDKs</h2>
        <p className="page-subtitle">
          Cross-platform SDKs built on Locanara core modules. Framework SDKs are
          available through our <strong>Membership Program</strong> with
          GitHub-based distribution and direct developer support.
        </p>

        <div
          className="alert-card alert-card--info"
          style={{ marginBottom: "1.5rem" }}
        >
          <p style={{ margin: 0 }}>
            <strong>Membership:</strong> Framework SDKs require an active
            membership for access and updates.{" "}
            <Link to="/early-access" style={{ textDecoration: "underline" }}>
              Learn about membership benefits
            </Link>
          </p>
        </div>

        <div className="languages-grid">
          <div className="language-card">
            <span className="badge badge-primary">Early Access</span>
            <h3>locanara-react-native</h3>
            <p>
              React Native implementation using Nitro Modules for
              high-performance native bridging
            </p>
            <pre className="code-snippet">{`npm install @locanara/react-native`}</pre>
          </div>

          <div className="language-card">
            <span className="badge badge-primary">Early Access</span>
            <h3>locanara-expo</h3>
            <p>
              Expo implementation using Expo Modules API for seamless managed
              workflow integration
            </p>
            <pre className="code-snippet">{`npx expo install @locanara/expo`}</pre>
          </div>

          <div className="language-card">
            <span className="badge badge-secondary">Coming Soon</span>
            <h3>locanara_flutter</h3>
            <p>Flutter implementation for cross-platform mobile development</p>
            <pre className="code-snippet">{`flutter pub add locanara_flutter --hosted-url=https://pub.locanara.com`}</pre>
          </div>

          <div className="language-card">
            <span className="badge badge-secondary">Coming Soon</span>
            <h3>locanara-kmp</h3>
            <p>Kotlin Multiplatform implementation for shared business logic</p>
            <pre className="code-snippet">{`implementation("ai.locanara:kmp:1.0.0")`}</pre>
          </div>
        </div>

        <div className="contribute-section">
          <h2>Early Access Program</h2>
          <p>
            Join our early access program to get private repository access,
            direct support from the core team, and help shape the roadmap. Early
            adopters play a crucial role in building the future of on-device AI
            development.
          </p>
          <Link to="/early-access" className="btn btn-primary">
            Apply for Early Access
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Languages;
