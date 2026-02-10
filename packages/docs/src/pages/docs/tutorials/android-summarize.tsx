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
        bullet points using Gemini Nano.
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
          <li>
            Default model set at startup:{" "}
            <code>LocanaraDefaults.model = PromptApiModel(context)</code>
          </li>
        </ul>
      </section>

      <section>
        <h2>1. Basic Summarization</h2>
        <p>The simplest way to summarize text using SummarizeChain.</p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.SummarizeChain

// Default: single bullet summary
val result = SummarizeChain().run(longArticle)
println(result.summary)
println("Original: \${result.originalLength} chars -> Summary: \${result.summaryLength} chars")`}</CodeBlock>
      </section>

      <section>
        <h2>2. Bullet Count Options</h2>
        <p>Control the number of bullet points in the summary.</p>

        <CodeBlock language="kotlin">{`// Single bullet (default)
val one = SummarizeChain(bulletCount = 1).run(text)

// Two key points
val two = SummarizeChain(bulletCount = 2).run(text)

// Three key points
val three = SummarizeChain(bulletCount = 3).run(text)
println(three.summary)`}</CodeBlock>
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>
        <p>
          Combine SummarizeChain with other chains using the Pipeline builder.
        </p>

        <CodeBlock language="kotlin">{`import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// Summarize then translate to Korean
val result = model.pipeline()
    .summarize(bulletCount = 3)
    .translate(to = "ko")
    .run(longArticle)

println(result.translatedText)  // Korean summary`}</CodeBlock>
      </section>

      <section>
        <h2>4. Model Extension (One-Liner)</h2>
        <p>Use the convenience method for the simplest possible API.</p>

        <CodeBlock language="kotlin">{`import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// One-liner convenience
val result = model.summarize(longArticle)
println(result.summary)`}</CodeBlock>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>SummarizeChain</strong>: Configure with{" "}
            <code>bulletCount</code> (1, 2, or 3)
          </li>
          <li>
            <strong>SummarizeResult</strong>: Contains <code>summary</code>,{" "}
            <code>originalLength</code>, and <code>summaryLength</code>
          </li>
          <li>
            <strong>Pipeline</strong>: Compose with other chains like
            TranslateChain for multi-step workflows
          </li>
          <li>
            <strong>model.summarize()</strong>: One-liner convenience for quick
            usage
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
