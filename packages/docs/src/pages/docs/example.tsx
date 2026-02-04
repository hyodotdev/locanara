import SEO from "../../components/SEO";
import CodeBlock from "../../components/CodeBlock";

function Example() {
  return (
    <div className="doc-page">
      <SEO
        title="Example"
        description="How to run Locanara iOS, Android, and Web example apps for on-device AI"
        path="/docs/example"
        keywords="Locanara example, iOS example app, Android example app, Web example, on-device AI"
      />
      <h1>Example Apps</h1>
      <p>
        Locanara provides example applications for iOS, Android, and Web that
        demonstrate all on-device AI features.
      </p>

      <section>
        <h2 id="features" className="anchor-heading">
          Features Demonstrated
          <a href="#features" className="anchor-link">
            #
          </a>
        </h2>
        <ul>
          <li>
            <strong>Summarize</strong> - Condense long text into key points
          </li>
          <li>
            <strong>Classify</strong> - Categorize text into predefined labels
          </li>
          <li>
            <strong>Translate</strong> - Translate text between languages
          </li>
          <li>
            <strong>Chat</strong> - Conversational AI interactions
          </li>
          <li>
            <strong>Rewrite</strong> - Rephrase text with different styles
          </li>
          <li>
            <strong>Proofread</strong> - Grammar and spelling correction
          </li>
          <li>
            <strong>Describe Image</strong> - Generate image descriptions
          </li>
        </ul>
      </section>

      <section>
        <h2 id="ios-example" className="anchor-heading">
          iOS Example
          <a href="#ios-example" className="anchor-link">
            #
          </a>
        </h2>
        <h3>Requirements</h3>
        <ul>
          <li>Xcode 16+</li>
          <li>iOS 26+ device with Apple Intelligence enabled</li>
          <li>iPhone 15 Pro or later, or M-series Mac</li>
        </ul>

        <h3>Running the Example</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/locanara.git
cd locanara/packages/apple/Example

# Open in Xcode
open LocanaraExample.xcodeproj

# Select your device and run`}
        />

        <h3>Project Structure</h3>
        <CodeBlock
          language="text"
          code={`packages/apple/Example/
├── LocanaraExample/
│   ├── ContentView.swift      # Main view with feature list
│   ├── FeatureDetailView.swift # Individual feature demo
│   └── LocanaraExampleApp.swift
└── LocanaraExample.xcodeproj`}
        />
      </section>

      <section>
        <h2 id="android-example" className="anchor-heading">
          Android Example
          <a href="#android-example" className="anchor-link">
            #
          </a>
        </h2>
        <h3>Requirements</h3>
        <ul>
          <li>Android Studio Ladybug or later</li>
          <li>Android 14+ (API 34+) device</li>
          <li>Pixel 8/Pro or Samsung Galaxy S24+ with Gemini Nano</li>
        </ul>

        <h3>Running the Example</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/locanara.git
cd locanara/packages/android

# Open in Android Studio
./scripts/open-android-studio.sh

# Or open directly
# Android Studio → Open → select packages/android folder

# Select your device and run the 'example' module`}
        />

        <h3>Project Structure</h3>
        <CodeBlock
          language="text"
          code={`packages/android/
├── example/
│   └── src/main/kotlin/dev/hyo/locanaraexample/
│       ├── MainActivity.kt
│       ├── navigation/NavHost.kt
│       ├── ui/screens/
│       │   ├── FeatureListScreen.kt
│       │   ├── SummarizeScreen.kt
│       │   ├── RewriteScreen.kt
│       │   └── ...
│       └── viewmodel/LocanaraViewModel.kt
├── locanara/              # The SDK library
└── build.gradle.kts`}
        />
      </section>

      <section>
        <h2 id="usage-example" className="anchor-heading">
          Quick Usage Example
          <a href="#usage-example" className="anchor-link">
            #
          </a>
        </h2>

        <h3>Swift (iOS)</h3>
        <CodeBlock
          language="swift"
          code={`import Locanara

// Check device capability
let capability = await Locanara.getDeviceCapability()
guard capability.isAvailable else {
    print("AI features not available")
    return
}

// Summarize text
let result = await Locanara.summarize(
    text: "Long article text here...",
    style: .paragraph
)

switch result {
case .success(let summary):
    print("Summary: \\(summary.text)")
case .failure(let error):
    print("Error: \\(error.message)")
}`}
        />

        <h3>Kotlin (Android)</h3>
        <CodeBlock
          language="kotlin"
          code={`import com.locanara.Locanara

// Check device capability
val capability = Locanara.getDeviceCapability()
if (!capability.isAvailable) {
    println("AI features not available")
    return
}

// Summarize text
val result = Locanara.summarize(
    text = "Long article text here...",
    style = SummarizeStyle.PARAGRAPH
)

result.fold(
    onSuccess = { summary ->
        println("Summary: \${summary.text}")
    },
    onFailure = { error ->
        println("Error: \${error.message}")
    }
)`}
        />
      </section>

      <section>
        <h2 id="troubleshooting" className="anchor-heading">
          Troubleshooting
          <a href="#troubleshooting" className="anchor-link">
            #
          </a>
        </h2>
        <h3>iOS</h3>
        <ul>
          <li>
            Ensure Apple Intelligence is enabled in Settings → Apple
            Intelligence & Siri
          </li>
          <li>Use a real device (Simulator has limited AI support)</li>
          <li>Check device language is supported</li>
        </ul>

        <h3>Android</h3>
        <ul>
          <li>Ensure Gemini Nano model is downloaded</li>
          <li>Use a real device (Emulator doesn't support Gemini Nano)</li>
          <li>Check Google Play Services is up to date</li>
        </ul>
      </section>
    </div>
  );
}

export default Example;
