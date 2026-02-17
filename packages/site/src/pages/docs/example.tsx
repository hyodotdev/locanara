import { SEO } from "../../components/SEO";
import CodeBlock from "../../components/docs/CodeBlock";

function Example() {
  return (
    <div className="doc-page">
      <SEO
        title="Example"
        description="How to run Locanara iOS, Android, and Web example apps for on-device AI"
        path="/docs/example"
        keywords="Locanara example, iOS example app, Android example app, Web example, on-device AI"
      />
      <h1>Example Apps</h1>
      <p>
        Locanara provides example applications for iOS and Android that
        demonstrate the framework&apos;s capabilities — built-in chains,
        Pipeline DSL, Memory, Guardrails, Session, and Agent.
      </p>

      <section>
        <h2 id="features" className="anchor-heading">
          Features Demonstrated
          <a href="#features" className="anchor-link">
            #
          </a>
        </h2>
        <p>
          <strong>Framework Showcase</strong> (iOS):
        </p>
        <ul>
          <li>
            <strong>Pipeline DSL</strong> - Compose chains (e.g., Proofread →
            Translate)
          </li>
          <li>
            <strong>Guarded Chains</strong> - Input/output guardrails for safe
            AI
          </li>
          <li>
            <strong>Custom Chain</strong> - Implement the Chain protocol for
            your own AI logic
          </li>
          <li>
            <strong>Session + Memory</strong> - Stateful conversations with
            BufferMemory
          </li>
          <li>
            <strong>Agent + Tools</strong> - ReAct-lite agent with reasoning
            trace
          </li>
        </ul>
        <p>
          <strong>Built-in Chains</strong> (7 samples):
        </p>
        <ul>
          <li>
            <strong>SummarizeChain</strong> - Condense long text into key points
          </li>
          <li>
            <strong>ClassifyChain</strong> - Categorize text into predefined
            labels
          </li>
          <li>
            <strong>TranslateChain</strong> - Translate text between languages
          </li>
          <li>
            <strong>ChatChain</strong> - Conversational AI interactions
          </li>
          <li>
            <strong>RewriteChain</strong> - Rephrase text with different styles
          </li>
          <li>
            <strong>ProofreadChain</strong> - Grammar and spelling correction
          </li>
          <li>
            <strong>ExtractChain</strong> - Entity extraction from text
          </li>
        </ul>
      </section>

      <section>
        <h2 id="ios-example" className="anchor-heading">
          iOS Example
          <a href="#ios-example" className="anchor-link">
            #
          </a>
        </h2>
        <h3>Requirements</h3>
        <ul>
          <li>Xcode 16+</li>
          <li>
            iOS 17+ device (iOS 26+ for Apple Intelligence, or download GGUF
            model for llama.cpp)
          </li>
        </ul>

        <h3>Running the Example</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/hyodotdev/locanara.git
cd locanara/packages/apple/Example

# Open in Xcode
open LocanaraExample.xcodeproj

# Select your device and run`}
        />

        <h3>Project Structure</h3>
        <CodeBlock
          language="text"
          code={`packages/apple/Example/
├── LocanaraExample/
│   ├── LocanaraExampleApp.swift
│   └── components/
│       ├── navigation/
│       │   └── MainTabNavigation.swift
│       ├── pages/
│       │   ├── FeatureDetail/       # Built-in chain demos
│       │   │   ├── SummarizeDemo.swift
│       │   │   ├── ClassifyDemo.swift
│       │   │   ├── ChatDemo/
│       │   │   └── ...
│       │   └── FrameworkShowcase/   # Pipeline, Agent, Session demos
│       │       ├── PipelineDemo.swift
│       │       ├── AgentDemo.swift
│       │       └── ...
│       └── shared/
└── LocanaraExample.xcodeproj`}
        />
      </section>

      <section>
        <h2 id="android-example" className="anchor-heading">
          Android Example
          <a href="#android-example" className="anchor-link">
            #
          </a>
        </h2>
        <h3>Requirements</h3>
        <ul>
          <li>Android Studio Ladybug or later</li>
          <li>Android 14+ (API 34+) device</li>
          <li>Pixel 8/Pro or Samsung Galaxy S24+ with Gemini Nano</li>
        </ul>

        <h3>Running the Example</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/hyodotdev/locanara.git
cd locanara/packages/android

# Open in Android Studio
# Android Studio → Open → select packages/android folder

# Select your device and run the 'example' module`}
        />

        <h3>Project Structure</h3>
        <CodeBlock
          language="text"
          code={`packages/android/
├── example/
│   └── src/main/kotlin/com/locanara/example/
│       ├── MainActivity.kt
│       └── components/
│           ├── navigation/
│           │   └── MainTabNavigation.kt
│           ├── pages/
│           │   ├── SummarizeScreen.kt
│           │   ├── ChatScreen.kt
│           │   ├── framework/          # Pipeline, Agent, Session demos
│           │   │   ├── PipelineDemo.kt
│           │   │   ├── AgentDemo.kt
│           │   │   └── ...
│           │   └── ...
│           └── shared/
├── locanara/              # The SDK library
└── build.gradle.kts`}
        />
      </section>

      <section>
        <h2 id="usage-example" className="anchor-heading">
          Quick Usage Example
          <a href="#usage-example" className="anchor-link">
            #
          </a>
        </h2>

        <h3>Swift (iOS)</h3>
        <CodeBlock
          language="swift"
          code={`import Locanara

// Check device capability
let capability = try await LocanaraClient.shared.getDeviceCapability()
guard capability.supportsOnDeviceAI else {
    print("Apple Intelligence not available")
    return
}

// Summarize text
let result = try await SummarizeChain(bulletCount: 3).run(
    "Long article text here..."
)
print(result.summary)

// Chat with memory
let memory = BufferMemory()
let chain = ChatChain(memory: memory, systemPrompt: "You are a helpful assistant.")
let r1 = try await chain.run("What is Swift?")
print(r1.message)

// Pipeline composition
let translated = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece")
print(translated.translatedText)`}
        />

        <h3>Kotlin (Android)</h3>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.Locanara
import com.locanara.core.LocanaraDefaults
import com.locanara.platform.PromptApiModel
import com.locanara.builtin.*
import com.locanara.composable.BufferMemory

// Set up default model once at app startup
LocanaraDefaults.model = PromptApiModel(context)

// Check device capability
val capability = Locanara.getInstance().getDeviceCapability()
if (!capability.supportsOnDeviceAI) {
    println("Gemini Nano not available")
    return
}

// Summarize text
val result = SummarizeChain(bulletCount = 3).run(
    "Long article text here..."
)
println(result.summary)

// Chat with memory
val memory = BufferMemory()
val chain = ChatChain(memory = memory, systemPrompt = "You are a helpful assistant.")
val r1 = chain.run("What is Kotlin?")
println(r1.message)

// Pipeline composition
val translated = LocanaraDefaults.model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece")
println(translated.translatedText)`}
        />
      </section>

      <section>
        <h2 id="real-world-patterns" className="anchor-heading">
          Real-World Patterns
          <a href="#real-world-patterns" className="anchor-link">
            #
          </a>
        </h2>
        <p>Common patterns for integrating Locanara into production apps.</p>

        <h3>Smart Note Editor</h3>
        <p>Proofread user input, then translate — all in one pipeline:</p>
        <CodeBlock
          language="swift"
          code={`// Smart note editor: fix errors then translate
let pipeline = FoundationLanguageModel().pipeline {
    Proofread()
    Translate(to: "ko")
}

// User types a messy note
let result = try await pipeline.run("Ther are many erors in this sentance.")
// result.translatedText → Korean translation of corrected text`}
        />

        <h3>Content Moderation Pipeline</h3>
        <p>Summarize user content with guardrail validation:</p>
        <CodeBlock
          language="swift"
          code={`// Summarize with content safety guardrail
let guardrail = ContentFilterGuardrail(blockedPatterns: ["violence", "hate"])
let guarded = GuardedChain(
    chain: SummarizeChain(bulletCount: 2),
    guardrails: [guardrail]
)

do {
    let output = try await guarded.invoke(ChainInput(text: userInput))
    showSummary(output.text)
} catch {
    showWarning("Content blocked: \\(error.localizedDescription)")
}`}
        />

        <h3>Support Chat with Context</h3>
        <p>Stateful chat that remembers conversation history:</p>
        <CodeBlock
          language="kotlin"
          code={`// Support chat with memory and streaming
val memory = BufferMemory(maxTurns = 20)
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful customer support agent for an e-commerce app."
)

// Stream responses to UI
chain.streamRun(userMessage).collect { chunk ->
    appendToUI(chunk)  // Update UI as tokens arrive
}

// Memory persists across calls — no manual history management`}
        />
      </section>

      <section>
        <h2 id="custom-chain-examples" className="anchor-heading">
          Custom Chain Examples
          <a href="#custom-chain-examples" className="anchor-link">
            #
          </a>
        </h2>
        <p>
          The real power of Locanara is building AI features specific to your
          app. Here's a food label analyzer chain on each platform.
        </p>

        <h3>iOS (Swift)</h3>
        <CodeBlock
          language="swift"
          code={`import Locanara

// 1. Define your result type
struct FoodLabelResult: Sendable {
    let calories: Int
    let allergens: [String]
    let healthScore: Double
}

// 2. Implement Chain
struct FoodLabelChain: Chain {
    let name = "FoodLabelChain"
    private let model: any LocanaraModel

    init(model: (any LocanaraModel)? = nil) {
        self.model = model ?? LocanaraDefaults.model
    }

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let template = PromptTemplate.from(
            "Analyze this food label. Return JSON with calories (int), " +
            "allergens (string array), healthScore (0.0-1.0).\\n\\nLabel: {text}"
        )
        let prompt = try template.format(["text": input.text])
        let response = try await model.generate(prompt: prompt, config: .structured)
        let result = try JSONDecoder().decode(FoodLabelResult.self, from: Data(response.text.utf8))
        return ChainOutput(value: result, text: response.text, metadata: input.metadata)
    }

    func run(_ text: String) async throws -> FoodLabelResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(FoodLabelResult.self) else {
            throw LocanaraError.executionFailed("Unexpected output type")
        }
        return result
    }
}

// 3. Use it
let result = try await FoodLabelChain().run("Calories: 250, Contains: milk, nuts")
print(result.allergens)    // ["milk", "nuts"]
print(result.healthScore)  // 0.65`}
        />

        <h3>Android (Kotlin)</h3>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.composable.Chain
import com.locanara.core.*

// 1. Define your result type
data class FoodLabelResult(
    val calories: Int,
    val allergens: List<String>,
    val healthScore: Double
)

// 2. Implement Chain
class FoodLabelChain(
    private val model: LocanaraModel = LocanaraDefaults.model
) : Chain {
    override val name = "FoodLabelChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val template = PromptTemplate.from(
            "Analyze this food label. Return JSON with calories (int), " +
            "allergens (string array), healthScore (0.0-1.0).\\n\\nLabel: {text}"
        )
        val prompt = template.format(mapOf("text" to input.text))
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val result = Gson().fromJson(response.text, FoodLabelResult::class.java)
        return ChainOutput(value = result, text = response.text, metadata = input.metadata)
    }

    suspend fun run(text: String): FoodLabelResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<FoodLabelResult>()
            ?: throw IllegalStateException("Unexpected output type")
    }
}

// 3. Use it
val result = FoodLabelChain().run("Calories: 250, Contains: milk, nuts")
println(result.allergens)    // [milk, nuts]
println(result.healthScore)  // 0.65`}
        />

        <h3>Expo / React Native (TypeScript)</h3>
        <CodeBlock
          language="typescript"
          code={`import { OnDeviceAI } from 'expo-ondevice-ai';

// Custom chain pattern in TypeScript
interface FoodLabelResult {
  calories: number;
  allergens: string[];
  healthScore: number;
}

async function analyzeFoodLabel(labelText: string): Promise<FoodLabelResult> {
  const result = await OnDeviceAI.chat({
    input: \`Analyze this food label. Return JSON with calories (int),
allergens (string array), healthScore (0.0-1.0).

Label: \${labelText}\`,
  });

  return JSON.parse(result.message) as FoodLabelResult;
}

// Use it
const result = await analyzeFoodLabel("Calories: 250, Contains: milk, nuts");
console.log(result.allergens);    // ["milk", "nuts"]
console.log(result.healthScore);  // 0.65`}
        />
      </section>

      <section>
        <h2 id="troubleshooting" className="anchor-heading">
          Troubleshooting
          <a href="#troubleshooting" className="anchor-link">
            #
          </a>
        </h2>
        <h3>iOS</h3>
        <ul>
          <li>
            Ensure Apple Intelligence is enabled in Settings → Apple
            Intelligence & Siri
          </li>
          <li>Use a real device (Simulator has limited AI support)</li>
          <li>Check device language is supported</li>
        </ul>

        <h3>Android</h3>
        <ul>
          <li>Ensure Gemini Nano model is downloaded</li>
          <li>Use a real device (Emulator doesn't support Gemini Nano)</li>
          <li>Check Google Play Services is up to date</li>
        </ul>
      </section>
    </div>
  );
}

export default Example;
