import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";

import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

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
            <strong>Platform:</strong> iOS 17+ (llama.cpp) / iOS 26+ (Apple
            Intelligence)
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
        <CodeBlock language="text">{`https://github.com/hyodotdev/locanara.git`}</CodeBlock>

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

if capability.supportsOnDeviceAI {
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
        <p>Condense long text into bullet points using SummarizeChain.</p>

        <CodeBlock language="swift">{`import Locanara

// Basic — single bullet summary
let result = try await SummarizeChain().run(longText)
print(result.summary)

// With options — 3 bullet points
let result = try await SummarizeChain(bulletCount: 3).run(longText)
print(result.summary)
print("Original: \\(result.originalLength) chars → Summary: \\(result.summaryLength) chars")`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="classify" level="h2">
          4. Classify Text
        </AnchorLink>
        <p>Categorize text into predefined labels using ClassifyChain.</p>

        <CodeBlock language="swift">{`// Classify with custom categories
let result = try await ClassifyChain(
    categories: ["positive", "negative", "neutral"]
).run("I love this product!")

print("Category: \\(result.topClassification.label)")
print("Confidence: \\(result.topClassification.score)")

// All classifications with scores
for classification in result.classifications {
    print("\\(classification.label): \\(classification.score)")
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="chat" level="h2">
          5. Chat
        </AnchorLink>
        <p>Build conversational AI with memory and streaming support.</p>

        <CodeBlock language="swift">{`// Simple chat
let result = try await ChatChain().run("What is Swift?")
print(result.message)

// Chat with memory (multi-turn conversation)
let memory = BufferMemory()
let chain = ChatChain(memory: memory, systemPrompt: "You are a helpful coding assistant.")

let r1 = try await chain.run("What is Swift?")
print(r1.message)

let r2 = try await chain.run("How does it compare to Kotlin?")
print(r2.message)  // Remembers previous context

// Streaming chat
for try await chunk in ChatChain(memory: memory).streamRun("Explain SwiftUI") {
    print(chunk, terminator: "")  // Print tokens as they arrive
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="rewrite" level="h2">
          6. Rewrite
        </AnchorLink>
        <p>Rewrite text with different tones like professional or friendly.</p>

        <CodeBlock language="swift">{`// Available styles: .professional, .friendly, .elaborate, .shorten
let result = try await RewriteChain(style: .professional).run(
    "Hey! Can we meet up tomorrow?"
)
print(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="proofread" level="h2">
          7. Proofread
        </AnchorLink>
        <p>Check and correct grammar and spelling errors.</p>

        <CodeBlock language="swift">{`let result = try await ProofreadChain().run(
    "Their going to the store tommorow."
)
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
              href="https://github.com/hyodotdev/locanara/tree/main/packages/apple/Example"
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
