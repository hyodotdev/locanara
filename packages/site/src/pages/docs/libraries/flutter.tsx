import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import { SEO } from "../../../components/SEO";
import PageNavigation from "../../../components/docs/PageNavigation";

function FlutterLibrary() {
  return (
    <div className="doc-page">
      <SEO
        title="flutter_ondevice_ai"
        description="Flutter plugin for on-device AI using Locanara SDK."
        path="/docs/libraries/flutter"
        keywords="flutter, dart, on-device AI, locanara, plugin"
      />
      <h1>flutter_ondevice_ai</h1>
      <p>
        Flutter plugin for on-device AI using Locanara SDK. Supports iOS,
        Android, and Web (Chrome Built-in AI) from a single Dart API.
      </p>

      <div className="badge-group">
        <span className="badge badge-warning">In Progress</span>
        <span className="badge badge-info">iOS 17+</span>
        <span className="badge badge-info">Android 14+</span>
        <span className="badge badge-info">Web (Chrome 138+)</span>
      </div>

      <section>
        <h2 id="installation">Installation</h2>
        <CodeBlock language="bash">{`flutter pub add flutter_ondevice_ai`}</CodeBlock>
      </section>

      <section>
        <h2 id="requirements">Requirements</h2>
        <ul>
          <li>Flutter 3.3+, Dart SDK &gt;=3.3.0</li>
          <li>
            iOS 17+ (llama.cpp with GGUF models) / iOS 26+ (Apple Intelligence)
          </li>
          <li>Android 14+ (Gemini Nano via ExecuTorch)</li>
          <li>Web: Chrome 138+ with Gemini Nano enabled</li>
        </ul>
      </section>

      <section>
        <h2 id="quick-start">Quick Start</h2>
        <CodeBlock language="dart">{`import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

final ai = FlutterOndeviceAi.instance;

// Initialize
await ai.initialize();

// Check device support
final capability = await ai.getDeviceCapability();
if (capability.isSupported) {
  // Use on-device AI
  final result = await ai.summarize('Long text to summarize...');
  print(result.summary);
}`}</CodeBlock>
      </section>

      <section>
        <h2 id="available-apis">Available APIs</h2>
        <p>
          All APIs are accessed via the <code>FlutterOndeviceAi.instance</code>{" "}
          singleton. The API surface is identical to the native SDKs. See the{" "}
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
            / <code>chatStream()</code> - Conversational AI
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
        <h2 id="framework">Framework</h2>
        <p>
          Under the hood, Locanara is a composable AI framework inspired by
          LangChain. The built-in utils above are pre-built{" "}
          <Link to="/docs/apis/chain">Chains</Link> — but you can compose your
          own multi-step AI workflows using the native SDK directly.
        </p>
        <ul>
          <li>
            <Link to="/docs/apis/chain">
              <code>Chain</code>
            </Link>{" "}
            - Composable building block for AI logic
          </li>
          <li>
            <Link to="/docs/apis/pipeline">
              <code>Pipeline</code>
            </Link>{" "}
            - Chain multiple steps with type-safe DSL
          </li>
          <li>
            <Link to="/docs/apis/memory">
              <code>Memory</code>
            </Link>{" "}
            - Conversation context (Buffer / Summary)
          </li>
          <li>
            <Link to="/docs/apis/guardrail">
              <code>Guardrail</code>
            </Link>{" "}
            - Input/output validation and safety
          </li>
          <li>
            <Link to="/docs/apis/session">
              <code>Session</code>
            </Link>{" "}
            - Stateful conversation management
          </li>
          <li>
            <Link to="/docs/apis/agent">
              <code>Agent</code>
            </Link>{" "}
            - Autonomous ReAct-style reasoning with tools
          </li>
        </ul>
        <CodeBlock language="swift">{`// Example: Pipeline DSL (native SDK)
// Proofread → Translate in one pipeline
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Hello wrold, how are you?")`}</CodeBlock>
      </section>

      <section>
        <h2 id="streaming">Chat Streaming</h2>
        <CodeBlock language="dart">{`final result = await ai.chatStream(
  'Tell me about on-device AI',
  options: ChatStreamOptions(
    onChunk: (chunk) {
      // Real-time streaming
      print(chunk.delta);
    },
  ),
);
print(result.message);`}</CodeBlock>
      </section>

      <section>
        <h2 id="model-management">Model Management</h2>
        <CodeBlock language="dart">{`// Browse available models
final models = await ai.getAvailableModels();

// Download with progress
await ai.downloadModel(
  models.first.modelId,
  onProgress: (progress) {
    print('\${(progress.progress * 100).round()}%');
  },
);

// Load and switch engine
await ai.loadModel(models.first.modelId);

// Check current engine
final engine = await ai.getCurrentEngine();

// Clean up
await ai.deleteModel(models.first.modelId);`}</CodeBlock>
      </section>

      <section>
        <h2 id="web-support">Web Support</h2>
        <p>
          On web, the plugin uses Chrome Built-in AI (Gemini Nano) APIs
          directly. Chrome 138+ is required with the following flags enabled:
        </p>
        <ul>
          <li>
            <code>chrome://flags/#optimization-guide-on-device-model</code>
          </li>
          <li>
            <code>chrome://flags/#prompt-api-for-gemini-nano</code>
          </li>
          <li>
            <code>
              chrome://flags/#enable-experimental-web-platform-features
            </code>
          </li>
        </ul>
        <p>
          See the <Link to="/docs/web-setup">Web Setup Guide</Link> for details.
        </p>
      </section>

      <section>
        <h2 id="source-code">Source Code</h2>
        <p>
          <a
            href="https://github.com/hyodotdev/locanara/tree/main/libraries/flutter_ondevice_ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/hyodotdev/locanara/libraries/flutter_ondevice_ai
          </a>
        </p>
      </section>

      <PageNavigation
        prev={{
          to: "/docs/libraries/expo",
          label: "expo-ondevice-ai",
        }}
        next={{ to: "/docs/utils", label: "API Reference" }}
      />
    </div>
  );
}

export default FlutterLibrary;
