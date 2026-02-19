import { SEO } from "../../components/SEO";
import CodeBlock from "../../components/docs/CodeBlock";
import AnchorLink from "../../components/docs/AnchorLink";
import Callout from "../../components/docs/Callout";
import PageNavigation from "../../components/docs/PageNavigation";

function IOSSetup() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Setup"
        description="Complete guide to setting up Locanara for iOS with Apple Intelligence and Foundation Models."
        path="/docs/ios-setup"
        keywords="Locanara iOS, Apple Intelligence, Foundation Models, on-device AI, Swift"
      />
      <h1>iOS Setup Guide</h1>
      <p>
        Setting up Locanara for iOS with Apple Intelligence and Foundation
        Models.
      </p>

      <section>
        <AnchorLink id="requirements" level="h2">
          Requirements
        </AnchorLink>
        <ul>
          <li>
            <strong>iOS 17.0+</strong> or <strong>macOS 15.0+</strong> (with
            llama.cpp engine and downloadable GGUF models)
          </li>
          <li>
            <strong>iOS 26.0+</strong> or <strong>macOS 26.0+</strong> (for
            Apple Intelligence / Foundation Models)
          </li>
          <li>
            <strong>Xcode 16+</strong>
          </li>
        </ul>

        <Callout type="info">
          <p>
            Locanara supports two AI engines on iOS. On iOS 26+ devices with
            Apple Intelligence, the SDK uses Foundation Models automatically. On
            older devices (iOS 17+), you can download GGUF models via the
            ModelManager and use the llama.cpp engine. The RouterModel
            auto-selects the best available engine.
          </p>
        </Callout>
      </section>

      <section>
        <AnchorLink id="installation" level="h2">
          Installation
        </AnchorLink>

        <AnchorLink id="project-setup" level="h3">
          1. Project Setup
        </AnchorLink>
        <p>Create a new SwiftUI project and add the Locanara SDK.</p>

        <p>
          <strong>Option A: Swift Package Manager (Recommended)</strong>
        </p>
        <p>
          In Xcode, go to <strong>File → Add Package Dependencies</strong> and
          add:
        </p>
        <CodeBlock
          language="text"
          code={`https://github.com/hyodotdev/locanara.git`}
        />

        <p>
          <strong>Option B: CocoaPods</strong>
        </p>
        <p>
          Add to your <code>Podfile</code>:
        </p>
        <CodeBlock language="ruby" code={`pod 'Locanara', '~> 1.0.0'`} />
        <p>Then run:</p>
        <CodeBlock language="bash" code={`pod install`} />

        <AnchorLink id="import" level="h3">
          Import Locanara
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`import SwiftUI
import Locanara`}
        />
      </section>

      <section>
        <AnchorLink id="basic-usage" level="h2">
          Basic Usage
        </AnchorLink>

        <AnchorLink id="check-availability" level="h3">
          Check Device Capability
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`// Check if Apple Intelligence is available
let capability = try await LocanaraClient.shared.getDeviceCapability()

if capability.supportsOnDeviceAI {
    print("AI features available: \\(capability.availableFeatures)")
} else {
    print("Apple Intelligence not available")
}`}
        />

        <Callout type="tip" title="Best Practice">
          <p>
            Always check device capability before calling AI features. This
            ensures a smooth user experience on unsupported devices.
          </p>
        </Callout>

        <AnchorLink id="summarize" level="h3">
          Summarize Text
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`// Using SummarizeChain
let result = try await SummarizeChain(bulletCount: 3).run(
    "Your long text here..."
)
print(result.summary)
print("Original: \\(result.originalLength) chars")`}
        />

        <AnchorLink id="translate" level="h3">
          Translate Text
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`// Using TranslateChain
let result = try await TranslateChain(targetLanguage: "ko").run(
    "Hello, world!"
)
print(result.translatedText)  // "안녕하세요, 세계!"`}
        />

        <AnchorLink id="chat" level="h3">
          Chat (Conversational AI)
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`// Using ChatChain with memory
let memory = BufferMemory()
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful assistant."
)

let r1 = try await chain.run("What is the capital of France?")
print(r1.message)  // "The capital of France is Paris."

let r2 = try await chain.run("What about Germany?")
print(r2.message)  // Remembers context from previous turn`}
        />
      </section>

      <section>
        <AnchorLink id="available-features" level="h2">
          Available Features
        </AnchorLink>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Chain</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Summarize</td>
              <td>
                <code>SummarizeChain</code>
              </td>
              <td>Condense text into key points</td>
            </tr>
            <tr>
              <td>Classify</td>
              <td>
                <code>ClassifyChain</code>
              </td>
              <td>Categorize text into labels</td>
            </tr>
            <tr>
              <td>Extract</td>
              <td>
                <code>ExtractChain</code>
              </td>
              <td>Extract entities from text</td>
            </tr>
            <tr>
              <td>Chat</td>
              <td>
                <code>ChatChain</code>
              </td>
              <td>Conversational AI</td>
            </tr>
            <tr>
              <td>Translate</td>
              <td>
                <code>TranslateChain</code>
              </td>
              <td>Language translation</td>
            </tr>
            <tr>
              <td>Rewrite</td>
              <td>
                <code>RewriteChain</code>
              </td>
              <td>Rephrase with different styles</td>
            </tr>
            <tr>
              <td>Proofread</td>
              <td>
                <code>ProofreadChain</code>
              </td>
              <td>Grammar and spelling check</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="error-handling" level="h2">
          Error Handling
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`do {
    let result = try await SummarizeChain().run(text)
    print(result.summary)
} catch let error as LocanaraError {
    switch error {
    case .featureNotAvailable:
        print("This feature is not available on this device")
    case .modelNotReady:
        print("AI model is still loading")
    case .inputTooLong:
        print("Input text exceeds maximum length")
    default:
        print("Error: \\(error)")
    }
} catch {
    print("Unexpected error: \\(error)")
}`}
        />
      </section>

      <section>
        <AnchorLink id="troubleshooting" level="h2">
          Troubleshooting
        </AnchorLink>

        <Callout type="warning" title="Apple Intelligence Not Available">
          <ul>
            <li>Verify device is iPhone 15 Pro or later, or M-series Mac</li>
            <li>
              Check iOS/macOS version is 26.0+ for Apple Intelligence, or 17.0+
              for llama.cpp engine
            </li>
            <li>
              Enable Apple Intelligence in Settings → Apple Intelligence & Siri
            </li>
            <li>Ensure device language and Siri language are supported</li>
          </ul>
        </Callout>

        <h3>Features Return Unavailable</h3>
        <ul>
          <li>Some features may require additional model downloads</li>
          <li>Wait for models to finish downloading in background</li>
          <li>Check available storage space on device</li>
        </ul>

        <h3>Slow Response Times</h3>
        <ul>
          <li>First request may be slower as models load into memory</li>
          <li>Subsequent requests will be faster</li>
          <li>Long text inputs take more time to process</li>
        </ul>
      </section>

      <section>
        <AnchorLink id="best-practices" level="h2">
          Best Practices
        </AnchorLink>
        <ul>
          <li>
            Always check <code>getDeviceCapability()</code> before using
            features
          </li>
          <li>Handle all error cases gracefully with fallback UI</li>
          <li>Show loading indicators during AI processing</li>
          <li>Cache results when appropriate to avoid redundant processing</li>
          <li>Use streaming for chat to provide real-time feedback</li>
          <li>Test on real devices (Simulator has limited AI support)</li>
        </ul>

        <Callout type="danger" title="Important">
          <p>
            All AI processing runs entirely on-device.{" "}
            <strong>There is no cloud fallback.</strong> If Apple Intelligence
            is not available, the SDK can fall back to the llama.cpp engine with
            downloaded GGUF models on iOS 17+ devices.
          </p>
        </Callout>
      </section>

      <PageNavigation
        next={{ to: "/docs/android-setup", label: "Android Setup" }}
      />
    </div>
  );
}

export default IOSSetup;
