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
        <p>The simplest way to summarize text with default settings.</p>

        <CodeBlock language="swift">{`import Locanara

func summarize(text: String) async throws -> String {
    let input = ExecuteFeatureInput(
        feature: .summarize,
        input: text,
        parameters: FeatureParametersInput(
            summarize: SummarizeParametersInput(
                inputType: .article,
                outputType: .oneBullet
            )
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .summarize(let summarizeResult) = result.result {
        return summarizeResult.summary
    }
    throw LocanaraError.featureNotAvailable
}

// Usage
let summary = try await summarize(text: longArticle)
print(summary)`}</CodeBlock>
      </section>

      <section>
        <h2>2. Output Type Options</h2>
        <p>Control the number of bullet points in the summary.</p>

        <CodeBlock language="swift">{`// Available output types
enum SummarizeOutputType {
    case oneBullet      // Single concise summary
    case twoBullets     // Two key points
    case threeBullets   // Three key points
}

// Example with 3 bullets
let input = ExecuteFeatureInput(
    feature: .summarize,
    input: text,
    parameters: FeatureParametersInput(
        summarize: SummarizeParametersInput(
            inputType: .article,
            outputType: .threeBullets  // Change output type here
        )
    )
)`}</CodeBlock>
      </section>

      <section>
        <h2>3. Input Type Options</h2>
        <p>Specify the content type for better summarization results.</p>

        <CodeBlock language="swift">{`// Available input types
enum SummarizeInputType {
    case article      // News articles, blog posts
    case email        // Email content
    case document     // General documents
    case conversation // Chat or dialogue
}

// Example for email summarization
let input = ExecuteFeatureInput(
    feature: .summarize,
    input: emailContent,
    parameters: FeatureParametersInput(
        summarize: SummarizeParametersInput(
            inputType: .email,
            outputType: .oneBullet
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

        <CodeBlock language="swift">{`let input = ExecuteFeatureInput(
    feature: .summarize,
    input: veryLongText,
    parameters: FeatureParametersInput(
        summarize: SummarizeParametersInput(
            inputType: .article,
            outputType: .threeBullets,
            autoTruncate: true  // Automatically truncate if too long
        )
    )
)`}</CodeBlock>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>SummarizeOutputType</strong>: Choose between{" "}
            <code>.oneBullet</code>, <code>.twoBullets</code>, or{" "}
            <code>.threeBullets</code>
          </li>
          <li>
            <strong>SummarizeInputType</strong>: Specify the content type like{" "}
            <code>.article</code>, <code>.email</code>, or{" "}
            <code>.document</code>
          </li>
          <li>
            <strong>autoTruncate</strong>: Automatically truncates input if it
            exceeds the model&apos;s limit
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
