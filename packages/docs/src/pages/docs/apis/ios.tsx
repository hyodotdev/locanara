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
        path="/docs/apis/ios"
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
            isAppleIntelligenceAvailable, getDeviceInfoIOS
          </li>
          <li>
            <strong>Text:</strong> summarize, classify, extract, translate,
            rewrite, proofread
          </li>
          <li>
            <strong>Chat:</strong> chat, chatStream
          </li>
          <li>
            <strong>Image:</strong> generateImage (Image Playground)
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="initialization">Initialization</h2>
        <CodeBlock
          language="swift"
          code={`import Locanara

// Initialize SDK (required before use)
try await LocanaraClient.shared.initialize()`}
        />
      </section>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="swift"
          code={`let capability = try LocanaraClient.shared.getDeviceCapability()

if capability.isAvailable {
    print("Available features: \\(capability.availableFeatures)")
}

// DeviceCapability
// - isAvailable: Bool
// - platform: .ios
// - availableFeatures: [FeatureType]`}
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
        <h2 id="feature-execution">Feature Execution</h2>
        <p>
          Most features are executed through the unified{" "}
          <code>executeFeature()</code> method with{" "}
          <code>ExecuteFeatureInput</code>. The exception is{" "}
          <code>chatStream()</code>, which has its own streaming API.
        </p>

        <h3 id="summarize">summarize()</h3>
        <p>Summarize text into structured bullet points.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .summarize,
    input: "Long article text...",
    parameters: FeatureParametersInput(
        summarize: SummarizeParametersInput(
            inputType: .article,       // or .conversation
            outputType: .threeBullets, // or .oneBullet, .twoBullets
            language: .english,
            autoTruncate: true
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .summarize(let summary) = result.result {
        print(summary.summary)           // Bullet point summary
        print(summary.originalLength)    // Original text length
        print(summary.summaryLength)     // Summary length
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="classify">classify()</h3>
        <p>Classify text into categories with confidence scores.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .classify,
    input: "This product is amazing!",
    parameters: FeatureParametersInput(
        classify: ClassifyParametersInput(
            categories: ["positive", "negative", "neutral"],
            maxResults: 3
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .classify(let classification) = result.result {
        // Sorted by score, highest first
        for item in classification.classifications {
            print("\\(item.label): \\(item.score)")
        }
        print("Top: \\(classification.topClassification.label)")
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="extract">extract()</h3>
        <p>Extract entities and key-value pairs from text.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .extract,
    input: "Contact John at john@example.com on March 15th",
    parameters: FeatureParametersInput(
        extract: ExtractParametersInput(
            entityTypes: ["person", "email", "date"],
            extractKeyValues: true
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .extract(let extraction) = result.result {
        for entity in extraction.entities {
            print("\\(entity.type): \\(entity.value) (\\(entity.confidence))")
        }
        if let kvPairs = extraction.keyValuePairs {
            for kv in kvPairs {
                print("\\(kv.key) = \\(kv.value)")
            }
        }
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="translate">translate()</h3>
        <p>Translate text between languages.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .translate,
    input: "Hello, world!",
    parameters: FeatureParametersInput(
        translate: TranslateParametersInput(
            targetLanguage: "ko"  // Target language code
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .translate(let translation) = result.result {
        print(translation.translatedText)
        print(translation.sourceLanguage)
        print(translation.targetLanguage)
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="rewrite">rewrite()</h3>
        <p>Rewrite text with different styles.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .rewrite,
    input: "We gotta fix this bug ASAP",
    parameters: FeatureParametersInput(
        rewrite: RewriteParametersInput(
            outputType: .professional  // .friendly, .shorten, .elaborate, etc.
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .rewrite(let rewritten) = result.result {
        print(rewritten.rewrittenText)
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="proofread">proofread()</h3>
        <p>Check grammar and spelling with detailed corrections.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .proofread,
    input: "Thier going too the store",
    parameters: FeatureParametersInput(
        proofread: ProofreadParametersInput(
            inputType: .keyboard  // or .voice
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .proofread(let proofread) = result.result {
        print(proofread.correctedText)
        for correction in proofread.corrections {
            print("\\(correction.original) -> \\(correction.corrected) [\\(correction.type)]")
        }
    }
} catch {
    print(error.localizedDescription)
}`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">chat()</h3>
        <p>Conversational AI with message history.</p>
        <CodeBlock
          language="swift"
          code={`let input = ExecuteFeatureInput(
    feature: .chat,
    input: "What is the capital of France?",
    parameters: FeatureParametersInput(
        chat: ChatParametersInput(
            systemPrompt: "You are a helpful assistant.",
            history: [
                ChatMessageInput(role: .user, content: "Hi!"),
                ChatMessageInput(role: .assistant, content: "Hello!")
            ]
        )
    )
)

do {
    let result = try await LocanaraClient.shared.executeFeature(input)
    if case .chat(let response) = result.result {
        print(response.message)
        print(response.suggestedPrompts ?? [])
    }
} catch {
    print(error.localizedDescription)
}`}
        />

        <h3 id="chat-stream">chatStream()</h3>
        <p>Streaming chat for real-time responses.</p>
        <CodeBlock
          language="swift"
          code={`let stream = try await LocanaraClient.shared.chatStream(
    input: "Tell me a story",
    parameters: ChatParametersInput(
        systemPrompt: "You are a storyteller."
    )
)

for try await chunk in stream {
    print(chunk.delta, terminator: "")  // Print each chunk as it arrives
    if chunk.isFinal {
        print("\\nDone! Full response: \\(chunk.accumulated)")
    }
}`}
        />
      </section>

      <section>
        <h2 id="execution-result">ExecutionResult</h2>
        <p>
          All feature executions return an <code>ExecutionResult</code> with
          metadata.
        </p>
        <CodeBlock
          language="swift"
          code={`let result = try await LocanaraClient.shared.executeFeature(input)

// Metadata
print(result.id)                // Unique execution ID
print(result.feature)           // FeatureType
print(result.state)             // .completed, .failed, etc.
print(result.processedOn)       // .onDevice
print(result.processingTimeMs)  // Processing duration

// Feature result (union type)
switch result.result {
case .summarize(let r):  print(r.summary)
case .classify(let r):   print(r.topClassification.label)
case .extract(let r):    print(r.entities)
case .chat(let r):       print(r.message)
case .translate(let r):  print(r.translatedText)
case .rewrite(let r):    print(r.rewrittenText)
case .proofread(let r):  print(r.correctedText)
case .imageGeneration(let r): print(r.imageUrls)
case .none:              print("No result")
default: break
}`}
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
        prev={{ to: "/docs/apis/describe-image", label: "describeImage()" }}
        next={{ to: "/docs/apis/android", label: "Android APIs" }}
      />
    </div>
  );
}

export default iOSAPIs;
