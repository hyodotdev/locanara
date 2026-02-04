import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import Callout from "../../../components/Callout";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";
import ProOnly, { CommunityOnly } from "../../../components/ProOnly";

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

        <CommunityOnly>
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
        </CommunityOnly>

        <ProOnly>
          <h4>1. Configure GitHub Packages Repository</h4>
          <p>
            Locanara Pro is hosted on GitHub Packages. Add the repository to
            your <code>settings.gradle.kts</code>:
          </p>
          <CodeBlock language="kotlin">{`// settings.gradle.kts
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
}`}</CodeBlock>

          <Callout type="info" title="GitHub Packages Authentication">
            <p>Set up authentication using one of these methods:</p>
            <ol>
              <li>
                Create a Personal Access Token (PAT) with{" "}
                <code>read:packages</code> scope at{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Settings
                </a>
              </li>
              <li>
                Add to <code>~/.gradle/gradle.properties</code>:
              </li>
            </ol>
            <CodeBlock language="text">{`gpr.user=YOUR_GITHUB_USERNAME
gpr.key=YOUR_GITHUB_TOKEN`}</CodeBlock>
            <p>
              Or set environment variables: <code>GITHUB_USERNAME</code> and{" "}
              <code>GITHUB_TOKEN</code>
            </p>
          </Callout>

          <h4>2. Add Dependencies</h4>
          <p>
            In your app's <code>build.gradle.kts</code>:
          </p>
          <CodeBlock language="kotlin">{`dependencies {
    implementation("com.locanara:locanara:1.0.0")
}`}</CodeBlock>

          <h4>3. Configure Manifest</h4>
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

          <Callout type="warning" title="Gemma License Attribution">
            <p>
              Locanara Pro uses the <strong>Gemma 3</strong> model for on-device
              AI on devices without Apple Intelligence or Gemini Nano support.
              You must include the following attribution in your app (e.g., in
              Settings, About, or Licenses screen):
            </p>
            <CodeBlock language="text">{`Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms`}</CodeBlock>
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
      </section>

      <section>
        <AnchorLink id="check-capability" level="h2">
          2. Check Device Capability
        </AnchorLink>
        <p>
          Check if the device supports Gemini Nano before using AI features.
        </p>

        <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Get Locanara instance
val locanara = Locanara.getInstance()

// Check device capability
val capability = locanara.getDeviceCapability()

if (capability.isAvailable) {
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
        <p>Condense long text into bullet points.</p>

        <CodeBlock language="kotlin">{`import com.locanara.*

suspend fun summarize(
    text: String,
    inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
    outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET
): SummarizeResult {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.SUMMARIZE,
        input = text,
        parameters = FeatureParametersInput(
            summarize = SummarizeParametersInput(
                inputType = inputType,
                outputType = outputType,
                autoTruncate = true
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.summarize
        ?: throw LocanaraException("Summarization failed")
}

// Usage
val summary = summarize(
    text = longArticle,
    outputType = SummarizeOutputType.THREE_BULLETS
)
println(summary.summary)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="classify" level="h2">
          4. Classify Text
        </AnchorLink>
        <p>Categorize text into predefined labels.</p>

        <CodeBlock language="kotlin">{`suspend fun classify(
    text: String,
    categories: List<String>
): ClassifyResult {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.CLASSIFY,
        input = text,
        parameters = FeatureParametersInput(
            classify = ClassifyParametersInput(
                categories = categories,
                maxResults = 3
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.classify
        ?: throw LocanaraException("Classification failed")
}

// Usage
val result = classify(
    text = "I love this product!",
    categories = listOf("positive", "negative", "neutral")
)
println("Category: \${result.topClassification.label}")
println("Confidence: \${result.topClassification.score}")`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="rewrite" level="h2">
          5. Rewrite Text
        </AnchorLink>
        <p>Rewrite text with different tones like professional or friendly.</p>

        <CodeBlock language="kotlin">{`suspend fun rewrite(
    text: String,
    style: RewriteOutputType
): RewriteResult {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.REWRITE,
        input = text,
        parameters = FeatureParametersInput(
            rewrite = RewriteParametersInput(
                outputType = style
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.rewrite
        ?: throw LocanaraException("Rewrite failed")
}

// Usage - Available styles: PROFESSIONAL, FRIENDLY, ELABORATE, SHORTEN
val result = rewrite(
    text = "Hey! Can we meet up tomorrow?",
    style = RewriteOutputType.PROFESSIONAL
)
println(result.rewrittenText)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="proofread" level="h2">
          6. Proofread Text
        </AnchorLink>
        <p>Check and correct grammar and spelling errors.</p>

        <CodeBlock language="kotlin">{`suspend fun proofread(text: String): ProofreadResult {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.PROOFREAD,
        input = text,
        parameters = FeatureParametersInput(
            proofread = ProofreadParametersInput()
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.proofread
        ?: throw LocanaraException("Proofreading failed")
}

// Usage
val result = proofread("Their going to the store tommorow.")
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
        <p>Build a conversational AI with customizable system prompts.</p>

        <CodeBlock language="kotlin">{`suspend fun chat(
    prompt: String,
    systemPrompt: String = "You are a helpful assistant."
): ChatResult {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.CHAT,
        input = prompt,
        parameters = FeatureParametersInput(
            chat = ChatParametersInput(
                systemPrompt = systemPrompt,
                temperature = 0.7,
                maxTokens = 1024
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.chat
        ?: throw LocanaraException("Chat failed")
}

// Usage
val response = chat(prompt = "What is Kotlin?")
println(response.response)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="next-steps" level="h2">
          Next Steps
        </AnchorLink>
        <ul>
          <li>
            <Link to="/docs/apis/describe-image">Add image description</Link>{" "}
            for accessibility
          </li>
          <li>
            <Link to="/docs/apis/translate">Add translation</Link> for
            multi-language support
          </li>
          <li>
            <Link to="/docs/apis/extract">Add entity extraction</Link> for
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
        next={
          import.meta.env.VITE_DOCS_TIER === "pro"
            ? { to: "/docs/tutorials/web", label: "Web Tutorial" }
            : undefined
        }
      />
    </div>
  );
}

export default AndroidTutorial;
