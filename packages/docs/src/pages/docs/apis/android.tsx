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
            getDeviceInfoAndroid
          </li>
          <li>
            <strong>Text (ML Kit):</strong> summarize, rewrite, proofread
          </li>
          <li>
            <strong>Text (Prompt API):</strong> classify, extract, translate
          </li>
          <li>
            <strong>Chat:</strong> chat, chatStream
          </li>
          <li>
            <strong>Image:</strong> describeImage
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="initialization">Initialization</h2>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.Locanara
import com.locanara.Platform

val locanara = Locanara.getInstance(context)

// Initialize SDK and Gemini Nano
locanara.initializeSDK(Platform.ANDROID)
locanara.initializeGeminiNano()`}
        />
      </section>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="kotlin"
          code={`val capability = locanara.getDeviceCapability()

if (capability.isAvailable) {
    println("Available features: \${capability.availableFeatures}")
}

// DeviceCapability
// - isAvailable: Boolean
// - platform: Platform.ANDROID
// - availableFeatures: List<FeatureType>`}
        />

        <h3 id="get-device-info">getDeviceInfoAndroid()</h3>
        <p>Get Android-specific device information.</p>
        <CodeBlock
          language="kotlin"
          code={`val info = locanara.getDeviceInfoAndroid()

println("API Level: \${info.apiLevel}")
println("Supports Gemini Nano: \${info.supportsGeminiNano}")
println("Total RAM: \${info.totalRAMMB} MB")`}
        />

        <h3 id="get-gemini-nano-status">getGeminiNanoStatus()</h3>
        <p>Get Gemini Nano model availability and download status.</p>
        <CodeBlock
          language="kotlin"
          code={`val status = locanara.getGeminiNanoStatus()

println("Ready: \${status.isReady}")
println("Downloaded: \${status.isDownloaded}")`}
        />

        <h3 id="prompt-api-status">Prompt API Status</h3>
        <p>
          Check and download the Prompt API model (required for classify,
          extract, translate, chat).
        </p>
        <CodeBlock
          language="kotlin"
          code={`// Check status
val status = locanara.getPromptApiStatus()

// Download if needed
locanara.downloadPromptApiModel { progress ->
    println("Download: \${progress.bytesDownloaded}/\${progress.bytesToDownload}")
}`}
        />
      </section>

      <section>
        <h2 id="feature-execution">Feature Execution</h2>
        <p>
          All features are executed through the unified{" "}
          <code>executeFeatureAndroid()</code> method with{" "}
          <code>ExecuteFeatureInput</code>.
        </p>

        <h3 id="summarize">summarize()</h3>
        <p>Summarize text using ML Kit Summarization API.</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.SUMMARIZE,
    input = "Long article text...",
    parameters = FeatureParametersInput(
        summarize = SummarizeParametersInput(
            inputType = SummarizeInputType.ARTICLE,       // or CONVERSATION
            outputType = SummarizeOutputType.THREE_BULLETS // or ONE_BULLET, TWO_BULLETS
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val summary = result.result as? SummarizeResult
    println(summary?.summary)
    println("Original: \${summary?.originalLength} chars")
    println("Summary: \${summary?.summaryLength} chars")
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="classify">classify()</h3>
        <p>
          Classify text into categories with confidence scores (via Prompt API).
        </p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.CLASSIFY,
    input = "This product is amazing!",
    parameters = FeatureParametersInput(
        classify = ClassifyParametersInput(
            categories = listOf("positive", "negative", "neutral"),
            maxResults = 3
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val classification = result.result as? ClassifyResult
    classification?.classifications?.forEach {
        println("\${it.label}: \${it.score}")
    }
    println("Top: \${classification?.topClassification?.label}")
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="extract">extract()</h3>
        <p>Extract entities and key-value pairs from text (via Prompt API).</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.EXTRACT,
    input = "Contact John at john@example.com on March 15th",
    parameters = FeatureParametersInput(
        extract = ExtractParametersInput(
            entityTypes = listOf("person", "email", "date"),
            extractKeyValues = true
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val extraction = result.result as? ExtractResult
    extraction?.entities?.forEach {
        println("\${it.type}: \${it.value} (\${it.confidence})")
    }
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="translate">translate()</h3>
        <p>Translate text between languages (via Prompt API).</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.TRANSLATE,
    input = "Hello, world!",
    parameters = FeatureParametersInput(
        translate = TranslateParametersInput(
            targetLanguage = "ko"
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val translation = result.result as? TranslateResult
    println(translation?.translatedText)
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="rewrite">rewrite()</h3>
        <p>Rewrite text with different styles using ML Kit Rewriting API.</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.REWRITE,
    input = "We gotta fix this bug ASAP",
    parameters = FeatureParametersInput(
        rewrite = RewriteParametersInput(
            outputType = RewriteOutputType.PROFESSIONAL // FRIENDLY, SHORTEN, ELABORATE, etc.
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val rewritten = result.result as? RewriteResult
    println(rewritten?.rewrittenText)
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="proofread">proofread()</h3>
        <p>Check grammar and spelling using ML Kit Proofreading API.</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.PROOFREAD,
    input = "Thier going too the store",
    parameters = FeatureParametersInput(
        proofread = ProofreadParametersInput(
            inputType = ProofreadInputType.KEYBOARD // or VOICE
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val proofread = result.result as? ProofreadResult
    println(proofread?.correctedText)
    proofread?.corrections?.forEach {
        println("\${it.original} -> \${it.corrected} [\${it.type}]")
    }
} catch (e: Exception) {
    println(e.message)
}`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">chat()</h3>
        <p>Conversational AI via Prompt API.</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.CHAT,
    input = "What is the capital of France?",
    parameters = FeatureParametersInput(
        chat = ChatParametersInput(
            systemPrompt = "You are a helpful assistant."
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val response = result.result as? ChatResult
    println(response?.message)
} catch (e: Exception) {
    println(e.message)
}`}
        />

        <h3 id="chat-stream">chatStream()</h3>
        <p>Streaming chat for real-time responses.</p>
        <CodeBlock
          language="kotlin"
          code={`locanara.chatStream(
    message = "Tell me a story",
    systemPrompt = "You are a storyteller."
).collect { chunk ->
    print(chunk.delta)  // Print each chunk as it arrives
    if (chunk.isFinal) {
        println("\\nDone! Full response: \${chunk.accumulated}")
    }
}`}
        />
      </section>

      <section>
        <h2 id="image-apis">Image APIs</h2>

        <h3 id="describe-image">describeImage()</h3>
        <p>Generate image descriptions using ML Kit.</p>
        <CodeBlock
          language="kotlin"
          code={`val input = ExecuteFeatureInput(
    feature = FeatureType.DESCRIBE_IMAGE_ANDROID,
    input = "",
    parameters = FeatureParametersInput(
        imageDescription = ImageDescriptionParametersInput(
            imagePath = "/path/to/image.jpg"  // or imageBase64
        )
    )
)

try {
    val result = locanara.executeFeatureAndroid(input)
    val description = result.result as? ImageDescriptionResult
    println(description?.text)
} catch (e: Exception) {
    println(e.message)
}`}
        />
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
                Backend
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
            {[
              ["Summarize", "ML Kit Summarization", "Available"],
              ["Rewrite", "ML Kit Rewriting", "Available"],
              ["Proofread", "ML Kit Proofreading", "Available"],
              ["Classify", "Prompt API (Gemini Nano)", "Available"],
              ["Extract", "Prompt API (Gemini Nano)", "Available"],
              ["Translate", "Prompt API (Gemini Nano)", "Available"],
              ["Chat", "Prompt API (Gemini Nano)", "Available"],
              ["Describe Image", "ML Kit ImageDescription", "Available"],
            ].map(([feature, backend, status], i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {feature}
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {backend}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 id="execution-result">ExecutionResult</h2>
        <p>
          All feature executions return an <code>ExecutionResult</code> with
          metadata.
        </p>
        <CodeBlock
          language="kotlin"
          code={`val result = locanara.executeFeatureAndroid(input)

// Metadata
println(result.id)               // Unique execution ID
println(result.feature)          // FeatureType
println(result.state)            // COMPLETED, FAILED, etc.
println(result.processedOn)      // ON_DEVICE
println(result.processingTimeMs) // Processing duration

// Feature result (cast to specific type)
when (val data = result.result) {
    is SummarizeResult -> println(data.summary)
    is ClassifyResult -> println(data.topClassification.label)
    is ExtractResult -> println(data.entities)
    is ChatResult -> println(data.message)
    is TranslateResult -> println(data.translatedText)
    is RewriteResult -> println(data.rewrittenText)
    is ProofreadResult -> println(data.correctedText)
    is ImageDescriptionResult -> println(data.text)
    else -> println("No result")
}`}
        />
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
