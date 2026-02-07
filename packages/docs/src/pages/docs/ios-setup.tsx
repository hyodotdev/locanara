import SEO from "../../components/SEO";
import CodeBlock from "../../components/CodeBlock";
import AnchorLink from "../../components/AnchorLink";
import Callout from "../../components/Callout";
import PlatformBadge from "../../components/PlatformBadge";
import PageNavigation from "../../components/PageNavigation";

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

      <PlatformBadge platforms={["ios"]} />

      <section>
        <AnchorLink id="requirements" level="h2">
          Requirements
        </AnchorLink>
        <ul>
          <li>
            <strong>iOS 26.0+</strong> or <strong>macOS 26.0+</strong>
          </li>
          <li>
            <strong>Xcode 16+</strong>
          </li>
          <li>
            <strong>Apple Silicon device</strong> (iPhone 15 Pro or later,
            M-series Mac)
          </li>
          <li>
            <strong>Apple Intelligence enabled</strong> on device
          </li>
        </ul>

        <Callout type="info">
          <p>
            Apple Intelligence requires compatible hardware and must be enabled
            in <strong>Settings → Apple Intelligence & Siri</strong>.
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
          code={`https://github.com/locanara/locanara-swift.git`}
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
let capability = await Locanara.getDeviceCapability()

if capability.isAvailable {
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
          code={`let result = await Locanara.summarize(
    text: "Your long text here...",
    style: .paragraph
)

switch result {
case .success(let summary):
    print(summary.text)
case .failure(let error):
    print("Error: \\(error)")
}`}
        />

        <AnchorLink id="translate" level="h3">
          Translate Text
        </AnchorLink>
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
    print("Error: \\(error)")
}`}
        />

        <AnchorLink id="chat" level="h3">
          Chat (Conversational AI)
        </AnchorLink>
        <CodeBlock
          language="swift"
          code={`let result = await Locanara.chat(
    messages: [
        ChatMessage(role: .user, content: "What is the capital of France?")
    ]
)

switch result {
case .success(let response):
    print(response.message)
case .failure(let error):
    print("Error: \\(error)")
}`}
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
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Summarize</td>
              <td>
                <code>summarize()</code>
              </td>
              <td>Condense text into key points</td>
            </tr>
            <tr>
              <td>Classify</td>
              <td>
                <code>classify()</code>
              </td>
              <td>Categorize text into labels</td>
            </tr>
            <tr>
              <td>Extract</td>
              <td>
                <code>extract()</code>
              </td>
              <td>Extract entities from text</td>
            </tr>
            <tr>
              <td>Chat</td>
              <td>
                <code>chat()</code>
              </td>
              <td>Conversational AI</td>
            </tr>
            <tr>
              <td>Translate</td>
              <td>
                <code>translate()</code>
              </td>
              <td>Language translation</td>
            </tr>
            <tr>
              <td>Rewrite</td>
              <td>
                <code>rewrite()</code>
              </td>
              <td>Rephrase with different styles</td>
            </tr>
            <tr>
              <td>Proofread</td>
              <td>
                <code>proofread()</code>
              </td>
              <td>Grammar and spelling check</td>
            </tr>
            <tr>
              <td>Describe Image</td>
              <td>
                <code>describeImage()</code>
              </td>
              <td>Generate image descriptions</td>
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
          code={`let result = await Locanara.summarize(text: text)

switch result {
case .success(let summary):
    // Handle success
    print(summary.text)

case .failure(let error):
    switch error {
    case .featureNotAvailable:
        print("This feature is not available on this device")
    case .modelNotReady:
        print("AI model is still loading")
    case .inputTooLong:
        print("Input text exceeds maximum length")
    case .networkError(let underlying):
        print("Network error: \\(underlying)")
    case .unknown(let message):
        print("Unknown error: \\(message)")
    }
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
            <li>Check iOS/macOS version is 26.0+ / 26.0+</li>
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
            Apple Intelligence models run entirely on-device. There is{" "}
            <strong>no cloud fallback</strong> - if the device doesn't support
            Apple Intelligence, the feature will not work.
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
