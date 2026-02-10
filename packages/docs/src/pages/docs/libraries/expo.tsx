import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";
import SEO from "../../../components/SEO";
import PageNavigation from "../../../components/PageNavigation";

function ExpoLibrary() {
  return (
    <div className="doc-page">
      <SEO
        title="expo-ondevice-ai"
        description="Expo module for on-device AI using Locanara SDK."
        path="/docs/libraries/expo"
        keywords="expo, on-device AI, locanara, react native"
      />
      <h1>expo-ondevice-ai</h1>
      <p>
        Expo module for on-device AI using Locanara SDK. All AI processing
        happens locally on-device.
      </p>

      <div className="badge-group">
        <span className="badge badge-warning">In Progress</span>
        <span className="badge badge-info">iOS 26+</span>
        <span className="badge badge-info">Android 14+</span>
      </div>

      <section>
        <h2 id="installation">Installation</h2>
        <CodeBlock language="bash">{`npx expo install expo-ondevice-ai`}</CodeBlock>
      </section>

      <section>
        <h2 id="requirements">Requirements</h2>
        <ul>
          <li>Expo SDK 52+</li>
          <li>iOS 26+ (Apple Intelligence)</li>
          <li>Android 14+ (Gemini Nano)</li>
        </ul>
      </section>

      <section>
        <h2 id="quick-start">Quick Start</h2>
        <CodeBlock language="typescript">{`import { getDeviceCapability, summarize } from 'expo-ondevice-ai';

// Check device support
const capability = await getDeviceCapability();
if (capability.isSupported) {
  // Use on-device AI
  const result = await summarize('Long text to summarize...');
  console.log(result.summary);
}`}</CodeBlock>
      </section>

      <section>
        <h2 id="available-apis">Available APIs</h2>
        <p>
          This library exposes the same API as Locanara SDK. See the{" "}
          <Link to="/docs/utils">API Reference</Link> for detailed
          documentation.
        </p>
        <ul>
          <li>
            <Link to="/docs/apis/get-device-capability">
              <code>getDeviceCapability()</code>
            </Link>{" "}
            - Check device AI support
          </li>
          <li>
            <Link to="/docs/utils/summarize">
              <code>summarize()</code>
            </Link>{" "}
            - Text summarization
          </li>
          <li>
            <Link to="/docs/utils/classify">
              <code>classify()</code>
            </Link>{" "}
            - Text classification
          </li>
          <li>
            <Link to="/docs/utils/extract">
              <code>extract()</code>
            </Link>{" "}
            - Entity extraction
          </li>
          <li>
            <Link to="/docs/utils/chat">
              <code>chat()</code>
            </Link>{" "}
            - Conversational AI
          </li>
          <li>
            <Link to="/docs/utils/translate">
              <code>translate()</code>
            </Link>{" "}
            - Language translation
          </li>
          <li>
            <Link to="/docs/utils/rewrite">
              <code>rewrite()</code>
            </Link>{" "}
            - Text rewriting
          </li>
          <li>
            <Link to="/docs/utils/proofread">
              <code>proofread()</code>
            </Link>{" "}
            - Grammar correction
          </li>
        </ul>
      </section>

      <section>
        <h2 id="source-code">Source Code</h2>
        <p>
          <a
            href="https://github.com/hyodotdev/locanara/tree/main/libraries/expo-ondevice-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/hyodotdev/locanara/libraries/expo-ondevice-ai
          </a>
        </p>
      </section>

      <PageNavigation
        prev={{ to: "/docs/libraries", label: "Libraries" }}
        next={{ to: "/docs/utils", label: "API Reference" }}
      />
    </div>
  );
}

export default ExpoLibrary;
