import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import { SEO } from "../../../components/SEO";
import PageNavigation from "../../../components/docs/PageNavigation";

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
        <span className="badge badge-info">iOS 17+</span>
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
          <li>
            iOS 17+ (llama.cpp with GGUF models) / iOS 26+ (Apple Intelligence)
          </li>
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
        <h2 id="model-management">Model Management</h2>
        <p>
          On iOS, you can download and switch between open-source GGUF models
          using the llama.cpp engine. On Android, the Prompt API model (Gemini
          Nano) can be downloaded when available.
        </p>
        <CodeBlock language="typescript">{`import {
  getAvailableModels, downloadModel, loadModel,
  getCurrentEngine, getDownloadedModels, deleteModel
} from 'expo-ondevice-ai';

// Browse available models (iOS)
const models = await getAvailableModels();

// Download with progress callback
await downloadModel(models[0].modelId, (progress) => {
  console.log(\`\${Math.round(progress.progress * 100)}%\`);
});

// Load and switch to it
await loadModel(models[0].modelId);

// Check current engine
const engine = await getCurrentEngine();
// 'foundation_models' | 'llama_cpp' | 'prompt_api' | 'none'

// Clean up
await deleteModel(models[0].modelId);`}</CodeBlock>
        <p>
          For a complete guide on switching between engines, see the{" "}
          <Link to="/docs/tutorials/model-selection">
            Model Selection tutorial
          </Link>
          .
        </p>
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
