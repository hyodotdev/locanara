import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import { SEO } from "../../../components/SEO";
import PageNavigation from "../../../components/docs/PageNavigation";

function ReactNativeLibrary() {
  return (
    <div className="doc-page">
      <SEO
        title="react-native-ondevice-ai"
        description="React Native Nitro module for on-device AI using Locanara SDK."
        path="/docs/libraries/react-native"
        keywords="react native, nitro modules, on-device AI, locanara"
      />
      <h1>react-native-ondevice-ai</h1>
      <p>
        React Native module for on-device AI using Locanara SDK and{" "}
        <a
          href="https://nitro.margelo.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nitro Modules
        </a>
        . For bare React Native apps without Expo. Expo users should use{" "}
        <Link to="/docs/libraries/expo">expo-ondevice-ai</Link> instead.
      </p>

      <div className="badge-group">
        <span className="badge badge-warning">In Progress</span>
        <span className="badge badge-info">iOS 17+</span>
        <span className="badge badge-info">Android 14+</span>
      </div>

      <section>
        <h2 id="installation">Installation</h2>
        <CodeBlock language="bash">{`npm install react-native-ondevice-ai react-native-nitro-modules
cd ios && pod install`}</CodeBlock>
      </section>

      <section>
        <h2 id="requirements">Requirements</h2>
        <ul>
          <li>React Native 0.76+</li>
          <li>Nitro Modules</li>
          <li>
            iOS 17+ (llama.cpp with GGUF models) / iOS 26+ (Apple Intelligence)
          </li>
          <li>Android 14+ (Gemini Nano)</li>
        </ul>
        <p>
          <strong>Note:</strong> Web is not supported. Nitro Modules is a
          native-only bridge. For web support, use{" "}
          <Link to="/docs/libraries/expo">expo-ondevice-ai</Link>.
        </p>
      </section>

      <section>
        <h2 id="quick-start">Quick Start</h2>
        <CodeBlock language="typescript">{`import { getDeviceCapability, summarize } from 'react-native-ondevice-ai';

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
          This library exposes the same API as{" "}
          <Link to="/docs/libraries/expo">expo-ondevice-ai</Link>. See the{" "}
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
        <h2 id="streaming">Chat Streaming</h2>
        <CodeBlock language="typescript">{`import { chatStream } from 'react-native-ondevice-ai';

const result = await chatStream('Tell me about on-device AI', {
  onChunk: (chunk) => {
    // Real-time streaming via Nitro listener pattern
    console.log(chunk.delta);
  },
});
console.log(result.message);`}</CodeBlock>
      </section>

      <section>
        <h2 id="model-management">Model Management</h2>
        <CodeBlock language="typescript">{`import {
  getAvailableModels, downloadModel, loadModel,
  getCurrentEngine, deleteModel
} from 'react-native-ondevice-ai';

// Browse available models (iOS)
const models = await getAvailableModels();

// Download with progress
await downloadModel(models[0].modelId, (progress) => {
  console.log(\`\${Math.round(progress.progress * 100)}%\`);
});

// Load and switch engine
await loadModel(models[0].modelId);

// Check current engine
const engine = await getCurrentEngine();`}</CodeBlock>
      </section>

      <section>
        <h2 id="source-code">Source Code</h2>
        <p>
          <a
            href="https://github.com/hyodotdev/locanara/tree/main/libraries/react-native-ondevice-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/hyodotdev/locanara/libraries/react-native-ondevice-ai
          </a>
        </p>
      </section>

      <PageNavigation
        prev={{ to: "/docs/libraries/expo", label: "expo-ondevice-ai" }}
        next={{ to: "/docs/libraries/flutter", label: "flutter_ondevice_ai" }}
      />
    </div>
  );
}

export default ReactNativeLibrary;
