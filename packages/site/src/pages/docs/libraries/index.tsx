import { Link } from "react-router-dom";
import { SEO } from "../../../components/SEO";
import PageNavigation from "../../../components/docs/PageNavigation";

function LibrariesIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="Libraries"
        description="Third-party framework integrations for Locanara SDK."
        path="/docs/libraries"
        keywords="expo, react native, on-device AI, locanara"
      />
      <h1>Libraries</h1>
      <p>
        Third-party framework integrations for Locanara SDK. These libraries
        provide easy integration with popular development frameworks.
      </p>

      <section>
        <h2 id="available-libraries">Available Libraries</h2>
        <div className="api-cards-grid">
          <Link to="/docs/libraries/expo" className="api-card">
            <div className="api-card-icon">📱</div>
            <h3>expo-ondevice-ai</h3>
            <p>Expo module for on-device AI</p>
            <span className="badge badge-warning">In Progress</span>
          </Link>

          <div className="api-card disabled">
            <div className="api-card-icon">⚛️</div>
            <h3>react-native-ondevice-ai</h3>
            <p>React Native module for on-device AI</p>
            <span className="badge badge-secondary">Planned</span>
          </div>
        </div>
      </section>

      <section>
        <h2 id="why-use-libraries">Why Use Libraries?</h2>
        <p>
          While Locanara SDK provides native iOS and Android implementations,
          these libraries make it easy to integrate on-device AI into
          cross-platform applications:
        </p>
        <ul>
          <li>
            <strong>Unified API</strong> - Same JavaScript/TypeScript API across
            platforms
          </li>
          <li>
            <strong>Easy Setup</strong> - Simple npm/expo install with automatic
            native linking
          </li>
          <li>
            <strong>Type Safety</strong> - Full TypeScript support with type
            definitions
          </li>
          <li>
            <strong>Framework Integration</strong> - Built specifically for each
            framework's patterns
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/resources", label: "Resources" }}
        next={{ to: "/docs/libraries/expo", label: "expo-ondevice-ai" }}
      />
    </div>
  );
}

export default LibrariesIndex;
