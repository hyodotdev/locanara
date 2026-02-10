import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function IOSSummarizeTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Summarize Tutorial"
        description="Learn how to implement text summarization with Apple Intelligence using Locanara SDK."
        path="/docs/tutorials/ios-summarize"
        keywords="iOS summarize, Apple Intelligence, SwiftUI, text summarization, Locanara"
      />
      <h1>iOS: Summarize Tutorial</h1>
      <p>
        Learn how to implement text summarization that condenses long text into
        bullet points using Apple Intelligence.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Xcode 16+ with iOS 26 SDK</li>
          <li>Device with Apple Intelligence support</li>
          <li>
            Locanara SDK installed (see{" "}
            <a href="/docs/ios-setup">Setup Guide</a>)
          </li>
        </ul>
      </section>

      <section>
        <h2>1. Basic Summarization</h2>
        <p>The simplest way to summarize text using SummarizeChain.</p>

        <CodeBlock language="swift">{`import Locanara

// Default: single bullet summary
let result = try await SummarizeChain().run(longArticle)
print(result.summary)
print("Original: \\(result.originalLength) chars -> Summary: \\(result.summaryLength) chars")`}</CodeBlock>
      </section>

      <section>
        <h2>2. Bullet Count Options</h2>
        <p>Control the number of bullet points in the summary.</p>

        <CodeBlock language="swift">{`// Single bullet (default)
let one = try await SummarizeChain(bulletCount: 1).run(text)

// Two key points
let two = try await SummarizeChain(bulletCount: 2).run(text)

// Three key points
let three = try await SummarizeChain(bulletCount: 3).run(text)
print(three.summary)`}</CodeBlock>
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>
        <p>Combine SummarizeChain with other chains using the Pipeline DSL.</p>

        <CodeBlock language="swift">{`// Summarize then translate to Korean
let result = try await model.pipeline {
    Summarize(bulletCount: 3)
    Translate(to: "ko")
}.run(longArticle)

print(result.translatedText)  // Korean summary`}</CodeBlock>
      </section>

      <section>
        <h2>4. Model Extension (One-Liner)</h2>
        <p>Use the convenience method for the simplest possible API.</p>

        <CodeBlock language="swift">{`let model = FoundationLanguageModel()

// One-liner convenience
let result = try await model.summarize(longArticle)
print(result.summary)`}</CodeBlock>
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
            <strong>Pipeline DSL</strong>: Compose with other chains like
            TranslateChain for multi-step workflows
          </li>
          <li>
            <strong>model.summarize()</strong>: One-liner convenience for quick
            usage
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/ios", label: "iOS Tutorial" }}
        next={{ to: "/docs/tutorials/ios-chat", label: "iOS Chat Tutorial" }}
      />
    </div>
  );
}

export default IOSSummarizeTutorial;
