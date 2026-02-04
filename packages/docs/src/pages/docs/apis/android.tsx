import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function AndroidAPIs() {
  return (
    <div className="doc-page">
      <SEO
        title="Android APIs"
        description="Locanara Android-specific APIs - Gemini Nano and ML Kit GenAI APIs for on-device AI."
        path="/docs/apis/android"
        keywords="Android API, Gemini Nano, ML Kit GenAI, on-device AI, Kotlin"
      />
      <h1>Android APIs</h1>
      <p>
        Android-specific APIs using Gemini Nano and ML Kit GenAI. These APIs are
        available on Android 14+ (API 34+) with supported devices.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong> getDeviceCapability, getGeminiNanoStatus,
            downloadGeminiNano
          </li>
          <li>
            <strong>Text:</strong> summarize, rewrite, proofread
          </li>
          <li>
            <strong>Image:</strong> describeImage
          </li>
          <li>
            <strong>Experimental:</strong> chat (AICore Inference)
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="kotlin"
          code={`val capability = Locanara.getDeviceCapability()

// Check availability
if (capability.isAvailable) {
    println("Available features: \${capability.availableFeatures}")
}

// Returns: DeviceCapability
// - isAvailable: Boolean
// - platform: Platform.ANDROID
// - availableFeatures: List<FeatureType>
// - modelStatus: ModelStatus?`}
        />

        <h3 id="get-gemini-nano-status">getGeminiNanoStatus()</h3>
        <p>Get Gemini Nano model availability and download status.</p>
        <CodeBlock
          language="kotlin"
          code={`val status = Locanara.getGeminiNanoStatus()

when (status.downloadStatus) {
    DownloadStatus.NOT_DOWNLOADED -> {
        println("Model not downloaded")
    }
    DownloadStatus.DOWNLOADING -> {
        println("Download progress: \${status.downloadProgress}%")
    }
    DownloadStatus.DOWNLOADED -> {
        println("Model ready to use")
    }
    DownloadStatus.FAILED -> {
        println("Download failed: \${status.error}")
    }
}`}
        />

        <h3 id="download-gemini-nano">downloadGeminiNano()</h3>
        <p>Download Gemini Nano model.</p>
        <CodeBlock
          language="kotlin"
          code={`// Start download
val result = Locanara.downloadGeminiNano()

result.fold(
    onSuccess = {
        println("Download started")
    },
    onFailure = { error ->
        println("Failed to start download: \${error.message}")
    }
)

// Monitor progress with getGeminiNanoStatus()`}
        />
      </section>

      <section>
        <h2 id="text-apis">Text Processing APIs</h2>

        <h3 id="summarize">summarize()</h3>
        <p>Summarize text using ML Kit Summarization API.</p>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.summarize(
    text = "Long article text...",
    style = SummarizeStyle.PARAGRAPH  // or BULLETS, KEY_POINTS
)

result.fold(
    onSuccess = { summary ->
        println(summary.text)
    },
    onFailure = { error ->
        println(error.message)
    }
)`}
        />

        <h3 id="rewrite">rewrite()</h3>
        <p>Rewrite text using ML Kit Rewriting API.</p>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.rewrite(
    text = "We gotta fix this bug ASAP",
    style = RewriteStyle.FORMAL  // or CASUAL, PROFESSIONAL, FRIENDLY
)

result.fold(
    onSuccess = { rewritten ->
        println(rewritten.text)  // "We need to address this issue promptly"
    },
    onFailure = { error ->
        println(error.message)
    }
)`}
        />

        <h3 id="proofread">proofread()</h3>
        <p>Check grammar and spelling using ML Kit Proofreading API.</p>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.proofread(
    text = "Thier going too the store"
)

result.fold(
    onSuccess = { proofread ->
        println(proofread.correctedText)  // "They're going to the store"
        proofread.corrections.forEach { correction ->
            println("\${correction.original} -> \${correction.corrected}")
        }
    },
    onFailure = { error ->
        println(error.message)
    }
)`}
        />
      </section>

      <section>
        <h2 id="image-apis">Image APIs</h2>

        <h3 id="describe-image">describeImage()</h3>
        <p>Generate image descriptions using ML Kit Image Description API.</p>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.describeImage(
    bitmap = bitmap,
    style = ImageDescriptionStyle.DETAILED  // or BRIEF, ACCESSIBILITY
)

result.fold(
    onSuccess = { description ->
        println(description.text)
    },
    onFailure = { error ->
        println(error.message)
    }
)`}
        />
      </section>

      <section>
        <h2 id="experimental-apis">Experimental APIs</h2>

        <h3 id="chat">chat() (Experimental)</h3>
        <p>
          Conversational AI using AICore Inference. This API is experimental and
          may have limited availability.
        </p>
        <CodeBlock
          language="kotlin"
          code={`val result = Locanara.chat(
    messages = listOf(
        ChatMessage(role = Role.USER, content = "What is the capital of France?")
    )
)

result.fold(
    onSuccess = { response ->
        println(response.message)
    },
    onFailure = { error ->
        println(error.message)
    }
)`}
        />
        <div
          style={{
            padding: "1rem",
            background: "rgba(255, 180, 0, 0.1)",
            borderLeft: "4px solid #ffb400",
            borderRadius: "0.5rem",
            margin: "1rem 0",
          }}
        >
          <strong>Note:</strong> Chat functionality via AICore is still
          experimental and may not be available on all devices.
        </div>
      </section>

      <section>
        <h2 id="feature-availability">Feature Availability</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Feature
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                ML Kit API
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Summarize
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Summarization
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Available
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Rewrite
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Rewriting
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Available
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Proofread
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Proofreading
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Available
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Describe Image
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                ImageDescription
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Available
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Chat
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                AICore Inference
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Experimental
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types/android">Android Types</Link>
          </li>
          <li>
            <Link to="/docs/android-setup">Android Setup Guide</Link>
          </li>
          <li>
            <Link to="/docs/errors">Error Handling</Link>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/apis/ios", label: "iOS APIs" }}
        next={{ to: "/docs/apis/web", label: "Web APIs" }}
      />
    </div>
  );
}

export default AndroidAPIs;
