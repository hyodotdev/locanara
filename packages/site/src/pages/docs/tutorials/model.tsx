import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ModelTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Model Tutorial"
        description="Learn how to use LocanaraModel directly with GenerationConfig presets and streaming for on-device AI."
        path="/docs/tutorials/model"
        keywords="LocanaraModel, FoundationLanguageModel, PromptApiModel, GenerationConfig, streaming, on-device AI, Locanara"
      />
      <h1>Model</h1>
      <p>
        Use the model layer directly for custom prompts with fine-grained
        control over generation behavior. GenerationConfig presets tune
        temperature and sampling for different use cases — structured for
        precise outputs, creative for varied responses, conversational for
        natural dialogue.
      </p>

      <section>
        <h2>1. Create a Model</h2>
        <p>
          Instantiate the platform-specific model. On iOS, use{" "}
          <code>FoundationLanguageModel</code> (Apple Intelligence). On Android,
          use <code>PromptApiModel</code> (Gemini Nano).
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// Apple Intelligence (iOS 26+ / macOS 26+)
let model = FoundationLanguageModel()

// Check model readiness
print(model.name)              // "FoundationLanguageModel"
print(model.isReady)           // true when AI is available
print(model.maxContextTokens)  // context window size`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.core.LocanaraDefaults
import com.locanara.platform.PromptApiModel

// Gemini Nano (Android 14+)
// Set up model at app startup
LocanaraDefaults.model = PromptApiModel(context)

// Use the default model
val model = LocanaraDefaults.model
println(model.name)              // "PromptApiModel"
println(model.isReady)           // true when Gemini Nano is available
println(model.maxContextTokens)  // context window size`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { getDeviceCapability } from 'expo-ondevice-ai'

// Check device AI availability
const capability = await getDeviceCapability()
console.log(capability.isSupported)  // true if on-device AI is available
console.log(capability.isModelReady) // true if model is loaded
console.log(capability.platform)     // 'IOS' | 'ANDROID' | 'WEB'

// The library manages the model internally —
// use feature functions (chat, summarize, etc.) directly`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

final ai = FlutterOndeviceAi.instance;

// Initialize the SDK
await ai.initialize();

// Check device AI availability
final capability = await ai.getDeviceCapability();
print(capability.isSupported);   // true if on-device AI is available
print(capability.isModelReady);  // true if model is loaded
print(capability.platform);      // OndeviceAiPlatform.ios / .android

// The plugin manages the model internally —
// use feature methods (chat, summarize, etc.) directly`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_model.mp4"
          caption="Model initialization — showing device AI availability and model status"
        />
      </section>

      <section>
        <h2>2. Generate with Config Presets</h2>
        <p>
          Three built-in presets control generation behavior. Each preset tunes{" "}
          <code>temperature</code> and <code>topK</code> for different use
          cases.
        </p>

        <table>
          <thead>
            <tr>
              <th>Preset</th>
              <th>Temperature</th>
              <th>TopK</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>.structured</code>
              </td>
              <td>0.2</td>
              <td>16</td>
              <td>Precise, factual outputs</td>
            </tr>
            <tr>
              <td>
                <code>.creative</code>
              </td>
              <td>0.8</td>
              <td>40</td>
              <td>Varied, expressive text</td>
            </tr>
            <tr>
              <td>
                <code>.conversational</code>
              </td>
              <td>0.7</td>
              <td>40</td>
              <td>Natural, balanced dialogue</td>
            </tr>
          </tbody>
        </table>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let model = FoundationLanguageModel()

// Structured — precise, deterministic
let structured = try await model.generate(
    prompt: "List 3 benefits of on-device AI",
    config: .structured
)
print(structured.text)
print("Time: \\(structured.processingTimeMs ?? 0)ms")

// Creative — varied, expressive
let creative = try await model.generate(
    prompt: "Write a tagline for an AI app",
    config: .creative
)

// Conversational — natural, balanced
let conversational = try await model.generate(
    prompt: "Explain what on-device AI means",
    config: .conversational
)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.core.GenerationConfig

val model = LocanaraDefaults.model

// Structured — precise, deterministic
val structured = model.generate(
    "List 3 benefits of on-device AI",
    GenerationConfig.STRUCTURED
)
println(structured.text)
println("Time: \${structured.processingTimeMs}ms")

// Creative — varied, expressive
val creative = model.generate(
    "Write a tagline for an AI app",
    GenerationConfig.CREATIVE
)

// Conversational — natural, balanced
val conversational = model.generate(
    "Explain what on-device AI means",
    GenerationConfig.CONVERSATIONAL
)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// GenerationConfig presets are native-only (Swift/Kotlin).
// The library uses balanced defaults internally.

const result = await chat('Explain what on-device AI means')
console.log(result.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// GenerationConfig presets are native-only (Swift/Kotlin).
// The plugin uses balanced defaults internally.

final result = await ai.chat('Explain what on-device AI means');
print(result.message);`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. Streaming</h2>
        <p>
          Stream tokens as they are generated for real-time UI updates. On iOS,
          streaming returns an <code>AsyncThrowingStream</code>. On Android, a{" "}
          <code>Flow</code>.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let model = FoundationLanguageModel()

// Stream tokens one by one
var accumulated = ""
for try await chunk in model.stream(prompt: "Explain SwiftUI", config: .conversational) {
    accumulated += chunk
    print(chunk, terminator: "")  // Print each token as it arrives
}
print("\\nFull response: \\(accumulated)")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val model = LocanaraDefaults.model

// Stream tokens one by one
var accumulated = ""
model.stream("Explain Jetpack Compose", GenerationConfig.CONVERSATIONAL)
    .collect { chunk ->
        accumulated += chunk
        print(chunk)  // Print each token as it arrives
    }
println("\\nFull response: $accumulated")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chatStream } from 'expo-ondevice-ai'

// Stream tokens via callback
const result = await chatStream('Explain React Native', {
  onChunk: (chunk) => {
    console.log(chunk.delta)        // New token
    console.log(chunk.accumulated)  // Full text so far
  }
})
console.log('Full response:', result.message)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// Stream tokens via callback
final result = await ai.chatStream(
  'Explain Flutter',
  options: ChatStreamOptions(
    onChunk: (chunk) {
      print(chunk.delta);        // New token
      print(chunk.accumulated);  // Full text so far
    },
  ),
);
print('Full response: \${result.message}');`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>LocanaraModel</strong> is the core protocol (Swift) /
            interface (Kotlin) for all AI operations
          </li>
          <li>
            <strong>Three presets</strong>: <code>.structured</code> (temp 0.2,
            topK 16), <code>.creative</code> (temp 0.8, topK 40),{" "}
            <code>.conversational</code> (temp 0.7, topK 40)
          </li>
          <li>
            <strong>Streaming</strong> returns{" "}
            <code>AsyncThrowingStream&lt;String&gt;</code> (Swift) /{" "}
            <code>Flow&lt;String&gt;</code> (Kotlin)
          </li>
          <li>
            All built-in chains (SummarizeChain, ChatChain, etc.) use{" "}
            <code>LocanaraDefaults.model</code> internally
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{
          to: "/docs/tutorials/model-selection",
          label: "Model Selection",
        }}
        next={{ to: "/docs/tutorials/chain", label: "Chain" }}
      />
    </div>
  );
}

export default ModelTutorial;
