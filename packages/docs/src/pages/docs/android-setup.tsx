import SEO from "../../components/SEO";
import CodeBlock from "../../components/CodeBlock";
import AnchorLink from "../../components/AnchorLink";
import Callout from "../../components/Callout";
import PlatformBadge from "../../components/PlatformBadge";
import PageNavigation from "../../components/PageNavigation";
import ProOnly, { CommunityOnly } from "../../components/ProOnly";

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

      <PlatformBadge platforms={["android"]} />

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

        <CommunityOnly>
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
        </CommunityOnly>

        <ProOnly>
          <CodeBlock
            language="kotlin"
            code={`// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven {
            url = uri("https://maven.pkg.github.com/locanara/locanara")
            credentials {
                username = System.getenv("GITHUB_USERNAME") ?: project.findProperty("gpr.user") as String?
                password = System.getenv("GITHUB_TOKEN") ?: project.findProperty("gpr.key") as String?
            }
        }
    }
}

// app/build.gradle.kts
dependencies {
    implementation("com.locanara:locanara:1.0.0")
}`}
          />

          <Callout type="info" title="GitHub Packages Authentication">
            <p>
              The Pro package is hosted on GitHub Packages. Set up
              authentication:
            </p>
            <ol>
              <li>
                Create a Personal Access Token (PAT) with{" "}
                <code>read:packages</code> scope
              </li>
              <li>
                Add to <code>~/.gradle/gradle.properties</code>:
              </li>
            </ol>
            <CodeBlock
              language="text"
              code={`gpr.user=YOUR_GITHUB_USERNAME
gpr.key=YOUR_GITHUB_TOKEN`}
            />
            <p>
              Or set environment variables: <code>GITHUB_USERNAME</code> and{" "}
              <code>GITHUB_TOKEN</code>
            </p>
          </Callout>

          <Callout type="warning" title="Gemma License Attribution">
            <p>
              Locanara Pro uses the <strong>Gemma 3</strong> model for on-device
              AI on devices without Apple Intelligence or Gemini Nano support.
              You must include the following attribution in your app (e.g., in
              Settings, About, or Licenses screen):
            </p>
            <CodeBlock
              language="text"
              code={`Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms`}
            />
            <p>
              For full license details, see the{" "}
              <a
                href="https://ai.google.dev/gemma/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gemma Terms of Use
              </a>
              .
            </p>
          </Callout>
        </ProOnly>

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
          Import the SDK
        </AnchorLink>
        <CodeBlock language="kotlin" code={`import com.locanara.Locanara`} />

        <AnchorLink id="check-availability" level="h3">
          Check Device Capability
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`// Check if Gemini Nano is available
val capability = Locanara.getDeviceCapability()

if (capability.isAvailable) {
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

        <AnchorLink id="download-model" level="h3">
          Download Gemini Nano Model
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`// Check model status and download if needed
val status = Locanara.getGeminiNanoStatus()

when (status.downloadStatus) {
    DownloadStatus.NOT_DOWNLOADED -> {
        // Trigger model download
        Locanara.downloadGeminiNano()
    }
    DownloadStatus.DOWNLOADING -> {
        println("Download progress: \${status.downloadProgress}%")
    }
    DownloadStatus.DOWNLOADED -> {
        println("Model ready to use")
    }
}`}
        />

        <AnchorLink id="summarize" level="h3">
          Summarize Text
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.summarize(
    text = "Your long text here...",
    style = SummarizeStyle.PARAGRAPH
)

result.fold(
    onSuccess = { summary ->
        println(summary.text)
    },
    onFailure = { error ->
        println("Error: $error")
    }
)`}
        />

        <AnchorLink id="rewrite" level="h3">
          Rewrite Text
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.rewrite(
    text = "Your text here...",
    style = RewriteStyle.FORMAL
)

result.fold(
    onSuccess = { rewritten ->
        println(rewritten.text)
    },
    onFailure = { error ->
        println("Error: $error")
    }
)`}
        />

        <AnchorLink id="proofread" level="h3">
          Proofread Text
        </AnchorLink>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.proofread(
    text = "Text with erors to fix..."
)

result.fold(
    onSuccess = { proofread ->
        println("Corrected: \${proofread.correctedText}")
        proofread.corrections.forEach { correction ->
            println("\${correction.original} -> \${correction.corrected}")
        }
    },
    onFailure = { error ->
        println("Error: $error")
    }
)`}
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
              <th>ML Kit API</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Summarize</td>
              <td>
                <code>Summarization</code>
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Rewrite</td>
              <td>
                <code>Rewriting</code>
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Proofread</td>
              <td>
                <code>Proofreading</code>
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Describe Image</td>
              <td>
                <code>ImageDescription</code>
              </td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Chat</td>
              <td>
                <code>AICore Inference</code>
              </td>
              <td>Experimental</td>
            </tr>
            <tr>
              <td>Translate</td>
              <td>
                <code>-</code>
              </td>
              <td>Planned</td>
            </tr>
            <tr>
              <td>Classify</td>
              <td>
                <code>-</code>
              </td>
              <td>Planned</td>
            </tr>
            <tr>
              <td>Extract</td>
              <td>
                <code>-</code>
              </td>
              <td>Planned</td>
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
          code={`val result = Locanara.summarize(text = text)

result.fold(
    onSuccess = { summary ->
        // Handle success
        println(summary.text)
    },
    onFailure = { error ->
        when (error) {
            is LocanaraError.FeatureNotAvailable ->
                println("This feature is not available on this device")
            is LocanaraError.ModelNotReady ->
                println("Gemini Nano model is not ready")
            is LocanaraError.InputTooLong ->
                println("Input text exceeds maximum length")
            is LocanaraError.Unknown ->
                println("Unknown error: \${error.message}")
        }
    }
)`}
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
            Gemini Nano models run entirely on-device. There is{" "}
            <strong>no cloud fallback</strong> - if the device doesn't support
            Gemini Nano, the feature will not work.
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
