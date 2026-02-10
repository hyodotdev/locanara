import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";

import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function AndroidTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Tutorial"
        description="Step-by-step tutorial for building an Android app with Gemini Nano using Locanara SDK."
        path="/docs/tutorials/android"
        keywords="Android tutorial, Gemini Nano, ML Kit GenAI, Kotlin, Jetpack Compose, on-device AI"
      />
      <h1>Android Tutorial</h1>
      <p>
        Build a complete Android app with Gemini Nano features using the
        Locanara SDK. This tutorial walks you through implementing text
        summarization, rewriting, proofreading, and more using ML Kit GenAI.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Platform:</strong> Android 14+ (API 34+) with Gemini Nano
          </li>
          <li>
            <strong>Language:</strong> Kotlin 2.0 with Jetpack Compose
          </li>
          <li>
            <strong>Features:</strong> Summarize, Rewrite, Proofread, Chat
          </li>
          <li>
            <strong>Time:</strong> ~30 minutes
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="setup" level="h2">
          1. Project Setup
        </AnchorLink>
        <p>
          Create a new Android project with Jetpack Compose and add the Locanara
          SDK.
        </p>

        <h4>Add Dependencies</h4>
        <p>
          In your app's <code>build.gradle.kts</code>:
        </p>
        <CodeBlock language="kotlin">{`dependencies {
    implementation("com.locanara:locanara:1.0.0")

    // ML Kit GenAI dependencies (included transitively)
    implementation("com.google.android.gms:play-services-mlkit-genai-common:17.0.0")
    implementation("com.google.android.gms:play-services-mlkit-genai-summarization:17.0.0")
    implementation("com.google.android.gms:play-services-mlkit-genai-rewriting:17.0.0")
    implementation("com.google.android.gms:play-services-mlkit-genai-proofreading:17.0.0")
}`}</CodeBlock>

        <h4>Configure Manifest</h4>
        <p>
          Add the required permissions in <code>AndroidManifest.xml</code>:
        </p>
        <CodeBlock language="xml">{`<manifest>
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".LocanaraExampleApp"
        ...>
        <!-- Download notification channel for model downloads -->
        <property
            android:name="genai.model.downloadNotification.channelId"
            android:value="genai_downloads" />
    </application>
</manifest>`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="check-capability" level="h2">
          2. Check Device Capability
        </AnchorLink>
        <p>
          Check if the device supports Gemini Nano before using AI features.
        </p>

        <CodeBlock language="kotlin">{`import com.locanara.Locanara
import com.locanara.core.LocanaraDefaults
import com.locanara.platform.PromptApiModel

// Set up default model once at app startup
LocanaraDefaults.model = PromptApiModel(context)

// Check device capability
val locanara = Locanara.getInstance()
val capability = locanara.getDeviceCapability()

if (capability.supportsOnDeviceAI) {
    println("Gemini Nano is available")
    println("Features: \${capability.availableFeatures}")
} else {
    println("Gemini Nano not available")
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="summarize" level="h2">
          3. Summarize Text
        </AnchorLink>
        <p>Condense long text into bullet points using SummarizeChain.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.SummarizeChain

// Basic — single bullet summary
val result = SummarizeChain().run(longArticle)
println(result.summary)

// With options — 3 bullet points
val result = SummarizeChain(bulletCount = 3).run(longArticle)
println(result.summary)
println("Original: \${result.originalLength} chars → Summary: \${result.summaryLength} chars")`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="classify" level="h2">
          4. Classify Text
        </AnchorLink>
        <p>Categorize text into predefined labels using ClassifyChain.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.ClassifyChain

// Classify with custom categories
val result = ClassifyChain(
    categories = listOf("positive", "negative", "neutral")
).run("I love this product!")

println("Category: \${result.topClassification.label}")
println("Confidence: \${result.topClassification.score}")

// All classifications with scores
result.classifications.forEach { c ->
    println("\${c.label}: \${c.score}")
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="rewrite" level="h2">
          5. Rewrite Text
        </AnchorLink>
        <p>Rewrite text with different tones like professional or friendly.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.RewriteChain

// Available styles: PROFESSIONAL, FRIENDLY, ELABORATE, SHORTEN
val result = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(
    "Hey! Can we meet up tomorrow?"
)
println(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="proofread" level="h2">
          6. Proofread Text
        </AnchorLink>
        <p>Check and correct grammar and spelling errors.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.ProofreadChain

val result = ProofreadChain().run("Their going to the store tommorow.")
println(result.correctedText)
// "They're going to the store tomorrow."
result.corrections.forEach { correction ->
    println("\${correction.original} → \${correction.corrected}")
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="chat" level="h2">
          7. Chat
        </AnchorLink>
        <p>Build conversational AI with memory and streaming support.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.ChatChain
import com.locanara.composable.BufferMemory

// Simple chat
val result = ChatChain().run("What is Kotlin?")
println(result.message)

// Chat with memory (multi-turn conversation)
val memory = BufferMemory()
val chain = ChatChain(memory = memory, systemPrompt = "You are a helpful coding assistant.")

val r1 = chain.run("What is Kotlin?")
println(r1.message)

val r2 = chain.run("How does it compare to Swift?")
println(r2.message)  // Remembers previous context

// Streaming chat
ChatChain(memory = memory).streamRun("Explain Jetpack Compose").collect { chunk ->
    print(chunk)  // Print tokens as they arrive
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="next-steps" level="h2">
          Next Steps
        </AnchorLink>
        <ul>
          <li>
            <Link to="/docs/utils/classify">Add classification</Link> for
            content categorization
          </li>
          <li>
            <Link to="/docs/utils/translate">Add translation</Link> for
            multi-language support
          </li>
          <li>
            <Link to="/docs/utils/extract">Add entity extraction</Link> for
            structured data
          </li>
          <li>
            Check the{" "}
            <a
              href="https://github.com/locanara/locanara/tree/main/packages/android/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              complete example app
            </a>{" "}
            on GitHub
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/ios", label: "iOS Tutorial" }}
        next={undefined}
      />
    </div>
  );
}

export default AndroidTutorial;
