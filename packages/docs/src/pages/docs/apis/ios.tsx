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
            <strong>Core:</strong> getDeviceCapability, getFoundationModelStatus
          </li>
          <li>
            <strong>Text:</strong> summarize, classify, extract, translate,
            rewrite, proofread
          </li>
          <li>
            <strong>Chat:</strong> chat, chatStream
          </li>
          <li>
            <strong>Image:</strong> describeImage
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="swift"
          code={`let capability = await Locanara.getDeviceCapability()

// Check availability
if capability.isAvailable {
    print("Available features: \\(capability.availableFeatures)")
}

// Returns: DeviceCapability
// - isAvailable: Bool
// - platform: .ios
// - availableFeatures: [FeatureType]
// - modelStatus: ModelStatus?`}
        />

        <h3 id="get-foundation-model-status">getFoundationModelStatus()</h3>
        <p>Get Apple Intelligence Foundation Models availability status.</p>
        <CodeBlock
          language="swift"
          code={`let status = await Locanara.getFoundationModelStatus()

switch status {
case .available:
    print("Foundation Models ready")
case .unavailable(let reason):
    print("Unavailable: \\(reason)")
case .notSupported:
    print("Device doesn't support Apple Intelligence")
}`}
        />
      </section>

      <section>
        <h2 id="text-apis">Text Processing APIs</h2>

        <h3 id="summarize">summarize()</h3>
        <p>Summarize text into key points.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.summarize(
    text: "Long article text...",
    style: .paragraph  // or .bullets, .keyPoints
)

switch result {
case .success(let summary):
    print(summary.text)
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="classify">classify()</h3>
        <p>Classify text into categories.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.classify(
    text: "This product is amazing!",
    labels: ["positive", "negative", "neutral"]
)

switch result {
case .success(let classification):
    for label in classification.labels {
        print("\\(label.label): \\(label.confidence)")
    }
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="extract">extract()</h3>
        <p>Extract entities and key-value pairs from text.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.extract(
    text: "Contact John at john@example.com or 555-1234",
    entityTypes: [.email, .phone, .person]
)

switch result {
case .success(let extraction):
    for entity in extraction.entities {
        print("\\(entity.type): \\(entity.value)")
    }
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="translate">translate()</h3>
        <p>Translate text between languages.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.translate(
    text: "Hello, world!",
    targetLanguage: .korean
)

switch result {
case .success(let translation):
    print(translation.translatedText)
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="rewrite">rewrite()</h3>
        <p>Rewrite text with different styles.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.rewrite(
    text: "We gotta fix this bug ASAP",
    style: .formal  // or .casual, .professional, .friendly
)

switch result {
case .success(let rewritten):
    print(rewritten.text)  // "We need to address this issue promptly"
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="proofread">proofread()</h3>
        <p>Check grammar and spelling.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.proofread(
    text: "Thier going too the store"
)

switch result {
case .success(let proofread):
    print(proofread.correctedText)  // "They're going to the store"
    for correction in proofread.corrections {
        print("\\(correction.original) -> \\(correction.corrected)")
    }
case .failure(let error):
    print(error.message)
}`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">chat()</h3>
        <p>Conversational AI with message history.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.chat(
    messages: [
        ChatMessage(role: .system, content: "You are a helpful assistant."),
        ChatMessage(role: .user, content: "What is the capital of France?")
    ]
)

switch result {
case .success(let response):
    print(response.message)  // "The capital of France is Paris."
case .failure(let error):
    print(error.message)
}`}
        />

        <h3 id="chat-stream">chatStream()</h3>
        <p>Streaming chat for real-time responses.</p>
        <CodeBlock
          language="swift"
          code={`let stream = Locanara.chatStream(
    messages: [
        ChatMessage(role: .user, content: "Tell me a story")
    ]
)

for await chunk in stream {
    print(chunk, terminator: "")  // Print each chunk as it arrives
}`}
        />
      </section>

      <section>
        <h2 id="image-apis">Image APIs</h2>

        <h3 id="describe-image">describeImage()</h3>
        <p>Generate descriptions for images.</p>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.describeImage(
    image: uiImage,
    style: .detailed  // or .brief, .accessibility
)

switch result {
case .success(let description):
    print(description.text)
case .failure(let error):
    print(error.message)
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
