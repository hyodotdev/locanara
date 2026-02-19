import { SEO } from "../../components/SEO";
import CodeBlock from "../../components/docs/CodeBlock";
import AnchorLink from "../../components/docs/AnchorLink";
import Callout from "../../components/docs/Callout";
import PageNavigation from "../../components/docs/PageNavigation";

function AndroidSetup() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Setup"
        description="Complete guide to setting up Locanara for Android with Gemini Nano and ML Kit GenAI."
        path="/docs/android-setup"
        keywords="Locanara Android, Gemini Nano, ML Kit GenAI, on-device AI, Kotlin"
      />
      <h1>Android Setup Guide</h1>
      <p>Setting up Locanara for Android with Gemini Nano and ML Kit GenAI.</p>

      <section>
        <AnchorLink id="requirements" level="h2">
          Requirements
        </AnchorLink>
        <ul>
          <li>
            <strong>Android 14+ (API 34+)</strong>
          </li>
          <li>
            <strong>Google Play Services</strong>
          </li>
          <li>
            <strong>Supported device</strong> (Pixel 8/Pro or later, Samsung
            Galaxy S24+)
          </li>
          <li>
            <strong>Gemini Nano model</strong> downloaded on device
          </li>
        </ul>

        <Callout type="info">
          <p>
            Gemini Nano requires supported hardware and may need to be
            downloaded separately via Google Play Services.
          </p>
        </Callout>
      </section>

      <section>
        <AnchorLink id="installation" level="h2">
          Installation
        </AnchorLink>

        <AnchorLink id="gradle-setup" level="h3">
          Gradle Setup
        </AnchorLink>
        <p>Add Locanara to your project:</p>

        <CodeBlock
          language="kotlin"
          code={`// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

// app/build.gradle.kts
dependencies {
    implementation("com.locanara:locanara:1.0.0")
}`}
        />

        <AnchorLink id="manifest-config" level="h3">
          Manifest Configuration
        </AnchorLink>
        <CodeBlock
          language="xml"
          code={`<!-- AndroidManifest.xml -->
<application>
    <!-- Required for ML Kit GenAI -->
    <meta-data
        android:name="com.google.mlkit.genai.DEPENDENCIES"
        android:value="summarization,proofreading,rewriting,image_description" />
</application>`}
        />
      </section>

      <section>
        <AnchorLink id="basic-usage" level="h2">
          Basic Usage
        </AnchorLink>

        <AnchorLink id="import" level="h3">
          Set Up Default Model
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.Locanara
import com.locanara.core.LocanaraDefaults
import com.locanara.platform.PromptApiModel

// Set the default model once at app startup
LocanaraDefaults.model = PromptApiModel(context)`}
        />

        <AnchorLink id="check-availability" level="h3">
          Check Device Capability
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`// Check if Gemini Nano is available
val capability = Locanara.getInstance().getDeviceCapability()

if (capability.supportsOnDeviceAI) {
    println("AI features available: \${capability.availableFeatures}")
} else {
    println("Gemini Nano not available")
}`}
        />

        <Callout type="tip" title="Best Practice">
          <p>
            Always check device capability before calling AI features. This
            ensures a smooth user experience on unsupported devices.
          </p>
        </Callout>

        <AnchorLink id="summarize" level="h3">
          Summarize Text
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.SummarizeChain

// Using SummarizeChain
val result = SummarizeChain(bulletCount = 3).run(
    "Your long text here..."
)
println(result.summary)
println("Original: \${result.originalLength} chars")`}
        />

        <AnchorLink id="rewrite" level="h3">
          Rewrite Text
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.RewriteChain
import com.locanara.RewriteOutputType

// Using RewriteChain
val result = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(
    "Your text here..."
)
println(result.rewrittenText)`}
        />

        <AnchorLink id="chat" level="h3">
          Chat (Conversational AI)
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.ChatChain
import com.locanara.composable.BufferMemory

// Chat with memory
val memory = BufferMemory()
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful assistant."
)

val r1 = chain.run("What is the capital of France?")
println(r1.message)  // "The capital of France is Paris."

val r2 = chain.run("What about Germany?")
println(r2.message)  // Remembers context from previous turn`}
        />
      </section>

      <section>
        <AnchorLink id="available-features" level="h2">
          Available Features
        </AnchorLink>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Chain / Backend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Summarize</td>
              <td>
                <code>SummarizeChain</code> (ML Kit)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Rewrite</td>
              <td>
                <code>RewriteChain</code> (ML Kit)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Proofread</td>
              <td>
                <code>ProofreadChain</code> (ML Kit)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Classify</td>
              <td>
                <code>ClassifyChain</code> (Prompt API)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Extract</td>
              <td>
                <code>ExtractChain</code> (Prompt API)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Translate</td>
              <td>
                <code>TranslateChain</code> (Prompt API)
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Chat</td>
              <td>
                <code>ChatChain</code> (Prompt API)
              </td>
              <td>Available</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="error-handling" level="h2">
          Error Handling
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`try {
    val result = SummarizeChain().run(text)
    println(result.summary)
} catch (e: LocanaraException) {
    when (e) {
        is LocanaraException.FeatureNotAvailable ->
            println("This feature is not available on this device")
        is LocanaraException.ModelNotReady ->
            println("Gemini Nano model is not ready")
        is LocanaraException.InputTooLong ->
            println("Input text exceeds maximum length")
        else ->
            println("Error: \${e.message}")
    }
}`}
        />
      </section>

      <section>
        <AnchorLink id="troubleshooting" level="h2">
          Troubleshooting
        </AnchorLink>

        <Callout type="warning" title="Gemini Nano Not Available">
          <ul>
            <li>
              Verify device is Pixel 8/Pro or later, or Samsung Galaxy S24+
            </li>
            <li>Check Android version is 14+ (API 34+)</li>
            <li>Ensure Google Play Services is up to date</li>
            <li>Model may need to be downloaded first</li>
          </ul>
        </Callout>

        <h3>Model Download Fails</h3>
        <ul>
          <li>Check internet connection</li>
          <li>Ensure sufficient storage space (2GB+ recommended)</li>
          <li>Try downloading on WiFi instead of cellular</li>
          <li>Clear Google Play Services cache and retry</li>
        </ul>

        <h3>Feature Returns Error</h3>
        <ul>
          <li>
            Verify the feature is available via{" "}
            <code>getDeviceCapability()</code>
          </li>
          <li>Check input doesn't exceed maximum length</li>
          <li>Ensure model is fully downloaded</li>
        </ul>
      </section>

      <section>
        <AnchorLink id="best-practices" level="h2">
          Best Practices
        </AnchorLink>
        <ul>
          <li>
            Set <code>LocanaraDefaults.model</code> once at app startup
          </li>
          <li>
            Always check <code>getDeviceCapability()</code> before using
            features
          </li>
          <li>Handle model download state gracefully</li>
          <li>Show download progress to users when downloading model</li>
          <li>Use coroutines for async operations</li>
          <li>Cache results when appropriate</li>
          <li>Test on real devices (Emulator doesn't support Gemini Nano)</li>
        </ul>

        <Callout type="danger" title="Important">
          <p>
            All AI processing runs entirely on-device.{" "}
            <strong>There is no cloud fallback.</strong> If Gemini Nano is not
            available, the SDK can fall back to the ExecuTorch engine with
            downloaded models on supported devices.
          </p>
        </Callout>
      </section>

      <PageNavigation
        prev={{ to: "/docs/ios-setup", label: "iOS Setup" }}
        next={{ to: "/docs/web-setup", label: "Web Setup" }}
      />
    </div>
  );
}

export default AndroidSetup;
