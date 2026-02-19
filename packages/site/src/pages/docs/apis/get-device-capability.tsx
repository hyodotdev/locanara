import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function GetDeviceCapabilityAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Get Device Capability API"
        description="Locanara getDeviceCapability API - Check device AI capabilities and feature availability."
        path="/docs/apis/get-device-capability"
        keywords="device capability, AI availability, on-device AI, feature detection"
      />
      <h1>getDeviceCapability()</h1>
      <p>
        Check device AI capabilities and determine which features are available.
        Essential for graceful degradation and feature gating in your app.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Checks Apple Intelligence availability
          </li>
          <li>
            <strong>Android</strong>: Checks Gemini Nano / ML Kit GenAI status
          </li>
          <li>
            <strong>Use case</strong>: Feature gating, UI adaptation
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="signature" level="h2">
          Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func getDeviceCapability() async throws -> DeviceCapability

struct DeviceCapability {
    let supportsOnDeviceAI: Bool     // Device supports on-device AI
    let availableFeatures: [FeatureType]  // List of available features
    let platform: Platform          // .ios or .android
    let modelStatus: ModelStatus?   // Model download status (Android)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun getDeviceCapability(): DeviceCapability

data class DeviceCapability(
    val supportsOnDeviceAI: Boolean,    // Device supports on-device AI
    val availableFeatures: List<FeatureType>,  // List of available features
    val platform: Platform,             // IOS or ANDROID
    val modelStatus: ModelStatus?       // Model download status (Android)
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function getDeviceCapability(): Promise<DeviceCapability>

interface DeviceCapability {
  supportsOnDeviceAI: boolean;    // Device supports on-device AI
  availableFeatures: FeatureType[];  // List of available features
  platform: 'ios' | 'android';    // Current platform
  modelStatus?: ModelStatus;      // Model download status (Android)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Check device capability
let capability = try await LocanaraClient.shared.getDeviceCapability()

if capability.isSupported {
    print("On-device AI is available!")
    print("Available features: \\(capability.availableFeatures)")
} else {
    print("On-device AI is not supported on this device")
    // Fall back to cloud API or disable AI features
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Check device capability
val capability = locanara.getDeviceCapability()

if (capability.isSupported) {
    println("On-device AI is available!")
    println("Available features: \${capability.availableFeatures}")
} else {
    println("On-device AI is not supported on this device")
    // Fall back to cloud API or disable AI features
}`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Check device capability
const capability = await Locanara.getDeviceCapability();

if (capability.isSupported) {
  console.log('On-device AI is available!');
  console.log('Available features:', capability.availableFeatures);
} else {
  console.log('On-device AI is not supported on this device');
  // Fall back to cloud API or disable AI features
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="feature-gating" level="h2">
          Feature Gating Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Check if specific feature is available
let capability = try await LocanaraClient.shared.getDeviceCapability()

if capability.availableFeatures.contains(.summarize) {
    // Show summarize button
    summarizeButton.isHidden = false
} else {
    // Hide or disable summarize feature
    summarizeButton.isHidden = true
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Check if specific feature is available
val capability = locanara.getDeviceCapability()

if (capability.availableFeatures.contains(FeatureType.SUMMARIZE)) {
    // Show summarize button
    summarizeButton.visibility = View.VISIBLE
} else {
    // Hide or disable summarize feature
    summarizeButton.visibility = View.GONE
}`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Check if specific feature is available
const capability = await Locanara.getDeviceCapability();

const canSummarize = capability.availableFeatures.includes('SUMMARIZE');

return (
  <View>
    {canSummarize && (
      <Button title="Summarize" onPress={handleSummarize} />
    )}
  </View>
);`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS (Apple Intelligence)</h4>
        <ul>
          <li>Requires iOS 26.1+ and Apple Intelligence enabled device</li>
          <li>Check Settings → Apple Intelligence & Siri</li>
          <li>Available on iPhone 15 Pro, iPhone 16, and newer</li>
        </ul>

        <h4>Android (Gemini Nano)</h4>
        <ul>
          <li>Requires Android 14+ (API level 34)</li>
          <li>Model may need to be downloaded before first use</li>
          <li>
            Use <code>modelStatus</code> to check download progress
          </li>
        </ul>

        <div className="alert-card alert-card--info">
          <p>
            <strong>Tip:</strong> Always check device capability at app startup
            and cache the result to avoid repeated checks.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#device-capability">DeviceCapability</Link>,{" "}
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation next={{ to: "/docs/apis/chain", label: "Chain" }} />
    </div>
  );
}

export default GetDeviceCapabilityAPI;
