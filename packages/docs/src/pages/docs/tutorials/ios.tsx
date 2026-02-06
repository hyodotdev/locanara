import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";

import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function IOSTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Tutorial"
        description="Step-by-step tutorial for building an iOS app with Apple Intelligence using Locanara SDK."
        path="/docs/tutorials/ios"
        keywords="iOS tutorial, Apple Intelligence, SwiftUI, on-device AI, Locanara"
      />
      <h1>iOS Tutorial</h1>
      <p>
        Build a complete iOS app with Apple Intelligence features using the
        Locanara SDK. This tutorial walks you through implementing text
        summarization, classification, chat, and more.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Platform:</strong> iOS 26+ with Apple Intelligence
          </li>
          <li>
            <strong>Language:</strong> Swift 6.0 with SwiftUI
          </li>
          <li>
            <strong>Features:</strong> Summarize, Classify, Chat, Rewrite,
            Proofread
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
        <p>Create a new SwiftUI project and add the Locanara SDK.</p>

        <h4>Option A: Swift Package Manager (Recommended)</h4>
        <p>
          In Xcode, go to <strong>File → Add Package Dependencies</strong> and
          add:
        </p>
        <CodeBlock language="text">{`https://github.com/locanara/locanara-swift.git`}</CodeBlock>

        <h4>Option B: CocoaPods</h4>
        <p>
          Add to your <code>Podfile</code>:
        </p>
        <CodeBlock language="ruby">{`pod 'Locanara', '~> 1.0.0'`}</CodeBlock>
        <p>Then run:</p>
        <CodeBlock language="bash">{`pod install`}</CodeBlock>

        <h4>Import Locanara</h4>
        <CodeBlock language="swift">{`import SwiftUI
import Locanara`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="check-capability" level="h2">
          2. Check Device Capability
        </AnchorLink>
        <p>
          Check if the device supports Apple Intelligence before using AI
          features.
        </p>

        <CodeBlock language="swift">{`// Check device capability
let capability = try await LocanaraClient.shared.getDeviceCapability()

if capability.isAvailable {
    print("Apple Intelligence is available")
    print("Features: \\(capability.availableFeatures)")
} else {
    print("Apple Intelligence not available")
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="summarize" level="h2">
          3. Summarize Text
        </AnchorLink>
        <p>Condense long text into bullet points.</p>

        <CodeBlock language="swift">{`func summarize(text: String, outputType: SummarizeOutputType = .oneBullet) async throws -> SummarizeResult {
    let input = ExecuteFeatureInput(
        feature: .summarize,
        input: text,
        parameters: FeatureParametersInput(
            summarize: SummarizeParametersInput(
                inputType: .article,
                outputType: outputType,
                language: .english,
                autoTruncate: true
            )
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .summarize(let summarizeResult) = result.result {
        return summarizeResult
    }
    throw LocanaraError.featureNotAvailable
}

// Usage
let summary = try await summarize(text: longText, outputType: .threeBullets)
print(summary.summary)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="classify" level="h2">
          4. Classify Text
        </AnchorLink>
        <p>Categorize text into predefined labels.</p>

        <CodeBlock language="swift">{`func classify(text: String, categories: [String]) async throws -> ClassifyResult {
    let input = ExecuteFeatureInput(
        feature: .classify,
        input: text,
        parameters: FeatureParametersInput(
            classify: ClassifyParametersInput(
                categories: categories,
                maxResults: 3
            )
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .classify(let classifyResult) = result.result {
        return classifyResult
    }
    throw LocanaraError.featureNotAvailable
}

// Usage
let result = try await classify(
    text: "I love this product!",
    categories: ["positive", "negative", "neutral"]
)
print("Category: \\(result.topClassification.label)")
print("Confidence: \\(result.topClassification.score)")`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="chat" level="h2">
          5. Chat
        </AnchorLink>
        <p>Build a conversational AI with customizable system prompts.</p>

        <CodeBlock language="swift">{`func chat(prompt: String, systemPrompt: String = "You are a helpful assistant.") async throws -> ChatResult {
    let input = ExecuteFeatureInput(
        feature: .chat,
        input: prompt,
        parameters: FeatureParametersInput(
            chat: ChatParametersInput(
                systemPrompt: systemPrompt,
                temperature: 0.7,
                maxTokens: 1024
            )
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .chat(let chatResult) = result.result {
        return chatResult
    }
    throw LocanaraError.featureNotAvailable
}

// Usage
let response = try await chat(prompt: "What is Swift?")
print(response.response)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="rewrite" level="h2">
          6. Rewrite
        </AnchorLink>
        <p>Rewrite text with different tones like professional or friendly.</p>

        <CodeBlock language="swift">{`func rewrite(text: String, style: RewriteOutputType) async throws -> RewriteResult {
    let input = ExecuteFeatureInput(
        feature: .rewrite,
        input: text,
        parameters: FeatureParametersInput(
            rewrite: RewriteParametersInput(
                outputType: style
            )
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .rewrite(let rewriteResult) = result.result {
        return rewriteResult
    }
    throw LocanaraError.featureNotAvailable
}

// Usage - Available styles: .professional, .friendly, .elaborate, .shorten
let result = try await rewrite(
    text: "Hey! Can we meet up tomorrow?",
    style: .professional
)
print(result.rewrittenText)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="proofread" level="h2">
          7. Proofread
        </AnchorLink>
        <p>Check and correct grammar and spelling errors.</p>

        <CodeBlock language="swift">{`func proofread(text: String) async throws -> ProofreadResult {
    let input = ExecuteFeatureInput(
        feature: .proofread,
        input: text,
        parameters: FeatureParametersInput(
            proofread: ProofreadParametersInput()
        )
    )

    let result = try await LocanaraClient.shared.executeFeature(input)

    if case .proofread(let proofreadResult) = result.result {
        return proofreadResult
    }
    throw LocanaraError.featureNotAvailable
}

// Usage
let result = try await proofread(text: "Their going to the store tommorow.")
print(result.correctedText)
// "They're going to the store tomorrow."
for correction in result.corrections {
    print("\\(correction.original) → \\(correction.corrected)")
}`}</CodeBlock>
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
              href="https://github.com/locanara/locanara/tree/main/packages/apple/Example"
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
        prev={{ to: "/docs/tutorials", label: "Tutorials" }}
        next={{ to: "/docs/tutorials/android", label: "Android Tutorial" }}
      />
    </div>
  );
}

export default IOSTutorial;
