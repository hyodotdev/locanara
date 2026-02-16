import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function TypesIOS() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Types"
        description="Locanara iOS-specific type definitions - FoundationModelInfoIOS, DeviceInfoIOS, ExecuteFeatureOptionsIOS for Swift."
        path="/docs/types/ios"
        keywords="Locanara types, iOS, Apple Intelligence, Foundation Models, Swift"
      />
      <h1>iOS Types</h1>
      <p>
        Type definitions specific to iOS/Apple Intelligence. All iOS-specific
        types have the <code>IOS</code> suffix to distinguish from other
        platforms.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong>{" "}
            <a href="#foundation-model-info-ios">FoundationModelInfoIOS</a>,{" "}
            <a href="#device-info-ios">DeviceInfoIOS</a>
          </li>
          <li>
            <strong>Options:</strong>{" "}
            <a href="#execute-feature-options-ios">ExecuteFeatureOptionsIOS</a>
          </li>
          <li>
            <strong>All types have IOS suffix</strong> to distinguish from other
            platforms
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="foundation-model-info-ios">FoundationModelInfoIOS</h2>
        <p>Detailed information about Apple Foundation Models.</p>
        <CodeBlock
          language="swift"
          code={`struct FoundationModelInfoIOS {
    let modelId: String
    let version: String?
    let supportedLanguages: [String]
    let capabilities: [String]
    let requiresDownload: Bool
    let downloadSizeMB: Int?
    let isAvailable: Bool
}`}
        />
      </section>

      <section>
        <h2 id="device-info-ios">DeviceInfoIOS</h2>
        <p>iOS-specific device information.</p>
        <CodeBlock
          language="swift"
          code={`struct DeviceInfoIOS {
    let modelIdentifier: String
    let osVersion: String
    let supportsAppleIntelligence: Bool
    let systemLanguages: [String]
    let hasNeuralEngine: Bool
}`}
        />
      </section>

      <section>
        <h2 id="execute-feature-options-ios">ExecuteFeatureOptionsIOS</h2>
        <p>iOS-specific execution options for AI features.</p>
        <CodeBlock
          language="swift"
          code={`struct ExecuteFeatureOptionsIOS {
    var useAppleIntelligence: Bool?
    var modelId: String?
    var requireOnDevice: Bool?
}`}
        />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types">All Types</Link>
          </li>
          <li>
            <Link to="/docs/types/android">Android Types</Link>
          </li>
          <li>
            <Link to="/docs/types/web">Web Types</Link>
          </li>
          <li>
            <Link to="/docs/utils/ios">iOS APIs</Link>
          </li>
          <li>
            <Link to="/docs/ios-setup">iOS Setup Guide</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default TypesIOS;
