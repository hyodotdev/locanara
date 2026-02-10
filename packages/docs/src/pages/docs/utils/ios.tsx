import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function iOSAPIs() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS APIs"
        description="Locanara iOS-specific APIs - Apple Intelligence and Foundation Models APIs for on-device AI."
        path="/docs/utils/ios"
        keywords="iOS API, Apple Intelligence, Foundation Models, on-device AI, Swift"
      />
      <h1>iOS APIs</h1>
      <p>
        iOS-specific APIs using Apple Intelligence and Foundation Models. These
        APIs are available on iOS 26+ and macOS 26+.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong> getDeviceCapability,
            isAppleIntelligenceAvailable
          </li>
          <li>
            <strong>Built-in Chains:</strong> SummarizeChain, ClassifyChain,
            ExtractChain, TranslateChain, RewriteChain, ProofreadChain,
            ChatChain
          </li>
          <li>
            <strong>Model:</strong> FoundationLanguageModel — platform backend
            for all chains
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="initialization">Initialization</h2>
        <CodeBlock
          language="swift"
          code={`import Locanara

// iOS auto-defaults to FoundationLanguageModel — no setup needed
// Just start using chains directly`}
        />
      </section>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="swift"
          code={`let capability = try await LocanaraClient.shared.getDeviceCapability()

if capability.supportsOnDeviceAI {
    print("Available features: \\(capability.availableFeatures)")
}`}
        />

        <h3 id="is-apple-intelligence-available">
          isAppleIntelligenceAvailable()
        </h3>
        <p>Check if Apple Intelligence Foundation Models are available.</p>
        <CodeBlock
          language="swift"
          code={`if LocanaraClient.shared.isAppleIntelligenceAvailable() {
    print("Apple Intelligence is ready")
}`}
        />
      </section>

      <section>
        <h2 id="built-in-chains">Built-in Chains</h2>
        <p>
          All chains use <code>LocanaraDefaults.model</code> (auto-set to{" "}
          <code>FoundationLanguageModel()</code> on iOS). No model parameter
          needed.
        </p>

        <h3 id="summarize">SummarizeChain</h3>
        <p>Summarize text into structured bullet points.</p>
        <CodeBlock
          language="swift"
          code={`// Basic summarization
let result = try await SummarizeChain(bulletCount: 3).run(
    "Long article text..."
)
print(result.summary)           // Bullet point summary
print(result.originalLength)    // Original text length
print(result.summaryLength)     // Summary length`}
        />

        <h3 id="classify">ClassifyChain</h3>
        <p>Classify text into categories with confidence scores.</p>
        <CodeBlock
          language="swift"
          code={`let result = try await ClassifyChain(
    categories: ["positive", "negative", "neutral"]
).run("This product is amazing!")

print("Top: \\(result.topClassification.label)")
for item in result.classifications {
    print("\\(item.label): \\(item.score)")
}`}
        />

        <h3 id="extract">ExtractChain</h3>
        <p>Extract entities from text.</p>
        <CodeBlock
          language="swift"
          code={`let result = try await ExtractChain(
    entityTypes: ["person", "email", "date"]
).run("Contact John at john@example.com on March 15th")

for entity in result.entities {
    print("\\(entity.type): \\(entity.value)")
}`}
        />

        <h3 id="translate">TranslateChain</h3>
        <p>Translate text between languages.</p>
        <CodeBlock
          language="swift"
          code={`let result = try await TranslateChain(
    targetLanguage: "ko"
).run("Hello, world!")

print(result.translatedText)   // "안녕하세요, 세계!"
print(result.sourceLanguage)   // "en"
print(result.targetLanguage)   // "ko"`}
        />

        <h3 id="rewrite">RewriteChain</h3>
        <p>Rewrite text with different styles.</p>
        <CodeBlock
          language="swift"
          code={`// Styles: .professional, .friendly, .shorten, .elaborate
let result = try await RewriteChain(
    style: .professional
).run("We gotta fix this bug ASAP")

print(result.rewrittenText)`}
        />

        <h3 id="proofread">ProofreadChain</h3>
        <p>Check grammar and spelling with detailed corrections.</p>
        <CodeBlock
          language="swift"
          code={`let result = try await ProofreadChain().run(
    "Thier going too the store"
)

print(result.correctedText)
for correction in result.corrections {
    print("\\(correction.original) -> \\(correction.corrected)")
}`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">ChatChain</h3>
        <p>Conversational AI with memory support.</p>
        <CodeBlock
          language="swift"
          code={`let memory = BufferMemory()
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful assistant."
)

let r1 = try await chain.run("What is the capital of France?")
print(r1.message)

let r2 = try await chain.run("What about Germany?")
print(r2.message)  // Remembers context`}
        />

        <h3 id="chat-stream">Streaming Chat</h3>
        <p>Stream tokens for real-time responses.</p>
        <CodeBlock
          language="swift"
          code={`let chain = ChatChain(
    memory: BufferMemory(),
    systemPrompt: "You are a storyteller."
)

for try await chunk in chain.streamRun("Tell me a story") {
    print(chunk, terminator: "")  // Print each token as it arrives
}`}
        />
      </section>

      <section>
        <h2 id="pipeline-dsl">Pipeline DSL</h2>
        <p>Compose chains with compile-time type safety.</p>
        <CodeBlock
          language="swift"
          code={`let model = FoundationLanguageModel()

// Proofread then translate
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Helo, how r you?")

print(result.translatedText)  // Corrected and translated`}
        />
      </section>

      <section>
        <h2 id="model-extensions">Model Extensions (One-Liners)</h2>
        <p>Convenience methods for quick usage.</p>
        <CodeBlock
          language="swift"
          code={`let model = FoundationLanguageModel()

let summary = try await model.summarize("Long text...")
let classified = try await model.classify("Great product!", categories: ["positive", "negative"])
let translated = try await model.translate("Hello", to: "ko")
let rewritten = try await model.rewrite("Fix bug ASAP", style: .professional)
let proofread = try await model.proofread("Thier going too")`}
        />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types/ios">iOS Types</Link>
          </li>
          <li>
            <Link to="/docs/ios-setup">iOS Setup Guide</Link>
          </li>
          <li>
            <Link to="/docs/errors">Error Handling</Link>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/utils/proofread", label: "proofread()" }}
        next={{ to: "/docs/utils/android", label: "Android APIs" }}
      />
    </div>
  );
}

export default iOSAPIs;
