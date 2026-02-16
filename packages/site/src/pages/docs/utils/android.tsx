import { Link } from "react-router-dom";
import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function AndroidAPIs() {
  return (
    <div className="doc-page">
      <SEO
        title="Android APIs"
        description="Locanara Android-specific APIs - Gemini Nano and ML Kit GenAI APIs for on-device AI."
        path="/docs/utils/android"
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
            <strong>Core:</strong> getDeviceCapability, getGeminiNanoStatus
          </li>
          <li>
            <strong>Built-in Chains (ML Kit):</strong> SummarizeChain,
            RewriteChain, ProofreadChain
          </li>
          <li>
            <strong>Built-in Chains (Prompt API):</strong> ClassifyChain,
            ExtractChain, TranslateChain, ChatChain
          </li>
          <li>
            <strong>Model:</strong> PromptApiModel — platform backend for all
            chains
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="initialization">Initialization</h2>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.Locanara
import com.locanara.core.LocanaraDefaults
import com.locanara.platform.PromptApiModel

// Set up default model once at app startup
LocanaraDefaults.model = PromptApiModel(context)

// Initialize SDK
val locanara = Locanara.getInstance()
locanara.initializeSDK(Platform.ANDROID)`}
        />
      </section>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="kotlin"
          code={`val capability = Locanara.getInstance().getDeviceCapability()

if (capability.supportsOnDeviceAI) {
    println("Available features: \${capability.availableFeatures}")
}`}
        />

        <h3 id="get-gemini-nano-status">getGeminiNanoStatus()</h3>
        <p>Get Gemini Nano model availability and download status.</p>
        <CodeBlock
          language="kotlin"
          code={`val status = Locanara.getInstance().getGeminiNanoStatus()

println("Ready: \${status.isReady}")
println("Downloaded: \${status.isDownloaded}")`}
        />
      </section>

      <section>
        <h2 id="built-in-chains">Built-in Chains</h2>
        <p>
          All chains use <code>LocanaraDefaults.model</code> by default. Set it
          once at app startup with{" "}
          <code>LocanaraDefaults.model = PromptApiModel(context)</code>.
        </p>

        <h3 id="summarize">SummarizeChain</h3>
        <p>Summarize text using ML Kit Summarization API.</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.SummarizeChain

val result = SummarizeChain(bulletCount = 3).run(
    "Long article text..."
)
println(result.summary)
println("Original: \${result.originalLength} chars")
println("Summary: \${result.summaryLength} chars")`}
        />

        <h3 id="classify">ClassifyChain</h3>
        <p>
          Classify text into categories with confidence scores (via Prompt API).
        </p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.ClassifyChain

val result = ClassifyChain(
    categories = listOf("positive", "negative", "neutral")
).run("This product is amazing!")

println("Top: \${result.topClassification.label}")
result.classifications.forEach {
    println("\${it.label}: \${it.score}")
}`}
        />

        <h3 id="extract">ExtractChain</h3>
        <p>Extract entities from text (via Prompt API).</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.ExtractChain

val result = ExtractChain(
    entityTypes = listOf("person", "email", "date")
).run("Contact John at john@example.com on March 15th")

result.entities.forEach {
    println("\${it.type}: \${it.value}")
}`}
        />

        <h3 id="translate">TranslateChain</h3>
        <p>Translate text between languages (via Prompt API).</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.TranslateChain

val result = TranslateChain(
    targetLanguage = "ko"
).run("Hello, world!")

println(result.translatedText)`}
        />

        <h3 id="rewrite">RewriteChain</h3>
        <p>Rewrite text with different styles using ML Kit Rewriting API.</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.RewriteChain
import com.locanara.builtin.RewriteOutputType

// Styles: PROFESSIONAL, FRIENDLY, SHORTEN, ELABORATE
val result = RewriteChain(
    style = RewriteOutputType.PROFESSIONAL
).run("We gotta fix this bug ASAP")

println(result.rewrittenText)`}
        />

        <h3 id="proofread">ProofreadChain</h3>
        <p>Check grammar and spelling using ML Kit Proofreading API.</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.ProofreadChain

val result = ProofreadChain().run(
    "Thier going too the store"
)

println(result.correctedText)
result.corrections.forEach {
    println("\${it.original} -> \${it.corrected}")
}`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">ChatChain</h3>
        <p>Conversational AI with memory support via Prompt API.</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.builtin.ChatChain
import com.locanara.composable.BufferMemory

val memory = BufferMemory()
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful assistant."
)

val r1 = chain.run("What is the capital of France?")
println(r1.message)

val r2 = chain.run("What about Germany?")
println(r2.message)  // Remembers context`}
        />

        <h3 id="chat-stream">Streaming Chat</h3>
        <p>Stream tokens for real-time responses.</p>
        <CodeBlock
          language="kotlin"
          code={`val chain = ChatChain(
    memory = BufferMemory(),
    systemPrompt = "You are a storyteller."
)

chain.streamRun("Tell me a story").collect { chunk ->
    print(chunk)  // Print each token as it arrives
}`}
        />
      </section>

      <section>
        <h2 id="pipeline">Pipeline Builder</h2>
        <p>Compose chains with fluent builder API.</p>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// Proofread then translate
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Helo, how r you?")

println(result.translatedText)  // Corrected and translated`}
        />
      </section>

      <section>
        <h2 id="model-extensions">Model Extensions (One-Liners)</h2>
        <p>Convenience methods for quick usage.</p>
        <CodeBlock
          language="kotlin"
          code={`val model = LocanaraDefaults.model

val summary = model.summarize("Long text...")
val classified = model.classify("Great product!", categories = listOf("positive", "negative"))
val translated = model.translate("Hello", to = "ko")
val rewritten = model.rewrite("Fix bug ASAP", style = RewriteOutputType.PROFESSIONAL)
val proofread = model.proofread("Thier going too")`}
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
              ["SummarizeChain", "ML Kit Summarization", "Available"],
              ["RewriteChain", "ML Kit Rewriting", "Available"],
              ["ProofreadChain", "ML Kit Proofreading", "Available"],
              ["ClassifyChain", "Prompt API (Gemini Nano)", "Available"],
              ["ExtractChain", "Prompt API (Gemini Nano)", "Available"],
              ["TranslateChain", "Prompt API (Gemini Nano)", "Available"],
              ["ChatChain", "Prompt API (Gemini Nano)", "Available"],
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
        prev={{ to: "/docs/utils/ios", label: "iOS APIs" }}
        next={{ to: "/docs/utils/web", label: "Web APIs" }}
      />
    </div>
  );
}

export default AndroidAPIs;
