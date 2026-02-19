import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ModelSelectionTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Model Selection Tutorial"
        description="Learn how to switch between AI engines — Apple Intelligence, llama.cpp, Gemini Nano, and ExecuTorch — using Locanara SDK."
        path="/docs/tutorials/model-selection"
        keywords="model selection, AI engine, RouterModel, InferenceRouter, Apple Intelligence, llama.cpp, Gemini Nano, ExecuTorch, Locanara"
      />
      <h1>Model Selection</h1>
      <p>
        Switch between multiple on-device AI engines. Locanara supports native
        platform engines and downloadable open-source models, with automatic
        routing or manual control.
      </p>

      <section>
        <h2>1. Check Device Capability</h2>
        <p>
          Before selecting a model, check what engines are available on the
          current device. The SDK reports which native AI and downloadable
          engines are supported.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let locanara = LocanaraClient.shared

// Check what's available
let capability = try await locanara.getDeviceCapability()
print(capability.supportsOnDeviceAI)

// List available engines
let engines = locanara.getAvailableEngines()
print(engines)  // [.foundationModels, .llamaCpp]

// Check current engine
let engine = locanara.getCurrentEngine()
print(engine)  // .foundationModels`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.Locanara

val locanara = Locanara.getInstance(context)

// Check what's available
val capability = locanara.getDeviceCapability()
println(capability.supportsOnDeviceAI)
println(capability.availableFeatures)

// Check Gemini Nano / Prompt API status
val status = locanara.getPromptApiStatus()
println(status)  // Available, Downloadable, Downloading, or NotAvailable`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { getDeviceCapability, getCurrentEngine } from 'expo-ondevice-ai';

// Check what's available
const capability = await getDeviceCapability();
console.log(capability.isSupported);
console.log(capability.features);

// Check current engine
const engine = await getCurrentEngine();
console.log(engine);  // 'foundation_models' | 'llama_cpp' | 'prompt_api'`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/model_selection_1.mp4"
          caption="Device capability check — showing available engines and current status"
        />
      </section>

      <section>
        <h2>2. Switch Between Engines</h2>
        <p>
          The SDK auto-selects the best engine by default. You can also manually
          switch — for example, to compare outputs between Apple Intelligence
          and a downloaded GGUF model.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let locanara = LocanaraClient.shared

// Use native AI (Apple Intelligence / Gemini Nano)
try await locanara.switchToDeviceAI()
let nativeResult = try await SummarizeChain().run(text)
print("Native: \\(nativeResult.summary)")

// Switch to downloaded model (llama.cpp / ExecuTorch)
try await locanara.switchToExternalModel("llama-3.2-1b")
let localResult = try await SummarizeChain().run(text)
print("Local: \\(localResult.summary)")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.Locanara
import com.locanara.builtin.SummarizeChain

val locanara = Locanara.getInstance(context)

// Android uses Gemini Nano via ML Kit (auto-managed by OS)
val result = SummarizeChain().run(text)
println("Result: \${result.summary}")

// If Prompt API model needs downloading
val status = locanara.getPromptApiStatus()
if (status is PromptApiStatus.Downloadable) {
    locanara.downloadPromptApiModel { progress ->
        println("Download: \${progress}")
    }
}`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize, loadModel, getCurrentEngine } from 'expo-ondevice-ai';

// Use native AI (auto-selected)
const nativeResult = await summarize(text);
console.log('Native:', nativeResult.summary);

// Switch to downloaded model
await loadModel('llama-3.2-1b');
const localResult = await summarize(text);
console.log('Local:', localResult.summary);

const engine = await getCurrentEngine();
console.log(engine);  // 'llama_cpp'`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/model_selection_2.mp4"
          caption="Engine switching — toggling between native AI and a downloaded model, then running the same chain"
        />
      </section>

      <section>
        <h2>3. Download & Load Models</h2>
        <p>
          Open-source models need to be downloaded before use. The SDK provides
          progress tracking for downloads and lifecycle management for loaded
          models.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let locanara = LocanaraClient.shared

// Browse available models
let models = locanara.getAvailableModels()
for model in models {
    print("\\(model.name) — \\(model.sizeMB)MB, \\(model.quantization)")
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val locanara = Locanara.getInstance(context)

// Check Gemini Nano status
val nanoStatus = locanara.getGeminiNanoStatus()
println("\${nanoStatus.version} — ready: \${nanoStatus.isReady}")
println("Capabilities: \${nanoStatus.capabilities}")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { getAvailableModels } from 'expo-ondevice-ai';

// Browse available models
const models = await getAvailableModels();
models.forEach(model => {
  console.log(\`\${model.name} — \${model.sizeMB}MB, \${model.quantization}\`);
});`,
            },
          ]}
        />

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Download with progress
let progress = try await locanara.downloadModelWithProgress("llama-3.2-1b")
for await update in progress {
    print("\\(Int(update.progress * 100))% — \\(update.state)")
}

// Load into memory (also switches engine)
try await locanara.loadModel("llama-3.2-1b")
print(locanara.getCurrentEngine())  // .llamaCpp`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Download Prompt API model (Gemini Nano) if needed
val status = locanara.getPromptApiStatus()
if (status is PromptApiStatus.Downloadable) {
    locanara.downloadPromptApiModel { progress ->
        println("Downloading: \$progress")
    }
}

// After download, initialize Gemini Nano
locanara.initializeGeminiNano()
println("Gemini Nano ready: \${locanara.getGeminiNanoStatus().isReady}")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { downloadModel, loadModel, getCurrentEngine } from 'expo-ondevice-ai';

// Download with progress
await downloadModel('llama-3.2-1b', (progress) => {
  console.log(\`\${Math.round(progress.progress * 100)}% — \${progress.state}\`);
});

// Load into memory (also switches engine)
await loadModel('llama-3.2-1b');
console.log(await getCurrentEngine());  // 'llama_cpp'`,
            },
          ]}
        />
      </section>

      <section>
        <h2>4. Clean Up</h2>
        <p>
          Delete downloaded models to free up storage. Check which models are
          currently on disk before cleaning up.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let locanara = LocanaraClient.shared

// Check what's downloaded
let downloaded = locanara.getDownloadedModels()
print(downloaded)  // ["llama-3.2-1b"]

// Check what's loaded
let loaded = locanara.getLoadedModel()
print(loaded)  // "llama-3.2-1b"

// Switch back to native AI before deleting
try await locanara.switchToDeviceAI()

// Delete the model
try locanara.deleteModel("llama-3.2-1b")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val locanara = Locanara.getInstance(context)

// Android models are managed by the OS (ML Kit / AICore)
// Recheck Prompt API status after changes
val status = locanara.recheckPromptApiStatus()
println("Prompt API: \$status")

// Unload models to free memory
locanara.unloadModels(emptyList())`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { getDownloadedModels, getLoadedModel, deleteModel } from 'expo-ondevice-ai';

// Check what's downloaded
const downloaded = await getDownloadedModels();
console.log(downloaded);  // ['llama-3.2-1b']

// Check what's loaded
const loaded = await getLoadedModel();
console.log(loaded);  // 'llama-3.2-1b'

// Delete the model
await deleteModel('llama-3.2-1b');`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>Auto routing</strong>: The SDK picks the best available
            engine by default — recommended for most use cases
          </li>
          <li>
            <strong>iOS</strong>: <code>switchToDeviceAI()</code> /{" "}
            <code>switchToExternalModel()</code> for manual engine control;{" "}
            <code>downloadModelWithProgress()</code> / <code>loadModel()</code>{" "}
            / <code>deleteModel()</code> for open-source model management
          </li>
          <li>
            <strong>Android</strong>: Models are OS-managed via ML Kit / AICore;
            use <code>downloadPromptApiModel()</code> to download Gemini Nano
          </li>
          <li>All engines run entirely on-device — no cloud fallback</li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/proofread", label: "Proofread" }}
        next={{ to: "/docs/libraries/expo", label: "expo-ondevice-ai" }}
      />
    </div>
  );
}

export default ModelSelectionTutorial;
