import CodeTabs from "./CodeTabs";

/**
 * Reusable section for tutorials explaining model switching.
 * Shows a screenshot placeholder and code examples for switching
 * between AI engines on iOS, Android, and Expo.
 */
function ModelSwitchingSection() {
  return (
    <section>
      <h2>Model Selection</h2>
      <p>
        Locanara supports multiple AI engines per platform. You can let the SDK
        auto-select the best available engine, or manually switch between them.
      </p>

      <div
        style={{
          margin: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            width: "100%",
            maxWidth: "560px",
            aspectRatio: "16 / 9",
            border: "2px dashed rgba(45, 42, 38, 0.2)",
            borderRadius: "1rem",
            backgroundColor: "rgba(45, 42, 38, 0.03)",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#6b6560",
              margin: 0,
            }}
          >
            Screenshot coming soon
          </p>
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#6b6560",
            marginTop: "0.5rem",
            fontStyle: "italic",
          }}
        >
          Model selection UI — switch between native AI and downloaded models
        </p>
      </div>

      <h3>Auto Routing (Default)</h3>
      <p>
        The SDK automatically selects the best available engine. On iOS 26+, it
        uses Apple Intelligence. On older devices, it falls back to llama.cpp
        with downloaded GGUF models.
      </p>

      <CodeTabs
        tabs={[
          {
            label: "Swift",
            language: "swift",
            code: `let locanara = LocanaraClient.shared

// Auto-selects the best engine
let engine = locanara.getCurrentEngine()`,
          },
          {
            label: "Kotlin",
            language: "kotlin",
            code: `val locanara = Locanara.getInstance(context)

// Auto-selects the best engine
val capability = locanara.getDeviceCapability()`,
          },
          {
            label: "TypeScript",
            language: "typescript",
            code: `import { getCurrentEngine, getDeviceCapability } from 'expo-ondevice-ai';

// Auto-selects the best engine
const engine = await getCurrentEngine();
const capability = await getDeviceCapability();`,
          },
        ]}
      />

      <h3>Manual Switching</h3>
      <p>
        Switch between engines explicitly when you need control over which model
        to use.
      </p>

      <CodeTabs
        tabs={[
          {
            label: "Swift",
            language: "swift",
            code: `let locanara = LocanaraClient.shared

// Switch to native AI (Apple Intelligence)
try await locanara.switchToDeviceAI()

// Switch to a downloaded model (llama.cpp)
try await locanara.switchToExternalModel("llama-3.2-1b")

// Check current engine
let engine = locanara.getCurrentEngine()`,
          },
          {
            label: "Kotlin",
            language: "kotlin",
            code: `val locanara = Locanara.getInstance(context)

// Switch to native AI (Gemini Nano)
locanara.switchToDeviceAI()

// Switch to a downloaded model (ExecuTorch)
locanara.switchToExternalModel("llama-3.2-1b")

// Check current engine
val engine = locanara.getCurrentEngine()`,
          },
          {
            label: "TypeScript",
            language: "typescript",
            code: `import { loadModel, getCurrentEngine, getAvailableModels } from 'expo-ondevice-ai';

// Browse and download a model
const models = await getAvailableModels();
await downloadModel(models[0].modelId);

// Load and switch to it
await loadModel(models[0].modelId);

// Check current engine
const engine = await getCurrentEngine();`,
          },
        ]}
      />
    </section>
  );
}

export default ModelSwitchingSection;
