import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function AndroidSummarizeTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Summarize Tutorial"
        description="Learn how to implement text summarization with Gemini Nano using Locanara SDK."
        path="/docs/tutorials/android-summarize"
        keywords="Android summarize, Gemini Nano, Kotlin, text summarization, Locanara"
      />
      <h1>Android: Summarize Tutorial</h1>
      <p>
        Learn how to implement text summarization that condenses long text into
        bullet points using Gemini Nano and ML Kit GenAI.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Android Studio with API 34+ SDK</li>
          <li>Device with Gemini Nano support</li>
          <li>
            Locanara SDK installed (see{" "}
            <a href="/docs/android-setup">Setup Guide</a>)
          </li>
        </ul>
      </section>

      <section>
        <h2>1. Basic Summarization</h2>
        <p>The simplest way to summarize text with default settings.</p>

        <CodeBlock language="kotlin">{`import com.locanara.*

suspend fun summarize(text: String): String {
    val locanara = Locanara.getInstance()

    val input = ExecuteFeatureInput(
        feature = FeatureType.SUMMARIZE,
        input = text,
        parameters = FeatureParametersInput(
            summarize = SummarizeParametersInput(
                inputType = SummarizeInputType.ARTICLE,
                outputType = SummarizeOutputType.ONE_BULLET
            )
        )
    )

    val result = locanara.executeFeature(input)
    return result.result?.summarize?.summary
        ?: throw LocanaraException("Summarization failed")
}

// Usage
val summary = summarize(longArticle)
println(summary)`}</CodeBlock>
      </section>

      <section>
        <h2>2. Output Type Options</h2>
        <p>Control the number of bullet points in the summary.</p>

        <CodeBlock language="kotlin">{`// Available output types
enum class SummarizeOutputType {
    ONE_BULLET,     // Single concise summary
    TWO_BULLETS,    // Two key points
    THREE_BULLETS   // Three key points
}

// Example with 3 bullets
val input = ExecuteFeatureInput(
    feature = FeatureType.SUMMARIZE,
    input = text,
    parameters = FeatureParametersInput(
        summarize = SummarizeParametersInput(
            inputType = SummarizeInputType.ARTICLE,
            outputType = SummarizeOutputType.THREE_BULLETS
        )
    )
)`}</CodeBlock>
      </section>

      <section>
        <h2>3. Input Type Options</h2>
        <p>Specify the content type for better summarization results.</p>

        <CodeBlock language="kotlin">{`// Available input types
enum class SummarizeInputType {
    ARTICLE,       // News articles, blog posts
    CONVERSATION   // Chat or dialogue
}

// Example for conversation summarization
val input = ExecuteFeatureInput(
    feature = FeatureType.SUMMARIZE,
    input = chatLog,
    parameters = FeatureParametersInput(
        summarize = SummarizeParametersInput(
            inputType = SummarizeInputType.CONVERSATION,
            outputType = SummarizeOutputType.ONE_BULLET
        )
    )
)`}</CodeBlock>
      </section>

      <section>
        <h2>4. Handle Long Text</h2>
        <p>
          Use <code>autoTruncate</code> to automatically handle text that
          exceeds the model's input limit.
        </p>

        <CodeBlock language="kotlin">{`val input = ExecuteFeatureInput(
    feature = FeatureType.SUMMARIZE,
    input = veryLongText,
    parameters = FeatureParametersInput(
        summarize = SummarizeParametersInput(
            inputType = SummarizeInputType.ARTICLE,
            outputType = SummarizeOutputType.THREE_BULLETS,
            autoTruncate = true  // Automatically truncate if too long
        )
    )
)`}</CodeBlock>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>SummarizeInputType</strong>: Choose between{" "}
            <code>ARTICLE</code> or <code>CONVERSATION</code>
          </li>
          <li>
            <strong>SummarizeOutputType</strong>: Choose <code>ONE_BULLET</code>
            , <code>TWO_BULLETS</code>, or <code>THREE_BULLETS</code>
          </li>
          <li>
            <strong>autoTruncate</strong>: Automatically truncates input if it
            exceeds the model&apos;s limit
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/android", label: "Android Tutorial" }}
        next={{
          to: "/docs/tutorials/android-chat",
          label: "Android Chat Tutorial",
        }}
      />
    </div>
  );
}

export default AndroidSummarizeTutorial;
