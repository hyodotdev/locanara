import SEO from "../../components/SEO";
import CodeBlock from "../../components/CodeBlock";

function WebSetup() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Setup"
        description="Complete guide to setting up Locanara for Web with Chrome Built-in AI (Gemini Nano)."
        path="/docs/web-setup"
        keywords="Locanara Web, Chrome Built-in AI, Gemini Nano, on-device AI, TypeScript"
      />
      <h1>Web Setup Guide</h1>
      <p>Setting up Locanara for Web with Chrome Built-in AI (Gemini Nano).</p>

      <section>
        <h2 id="requirements" className="anchor-heading">
          Requirements
          <a href="#requirements" className="anchor-link">
            #
          </a>
        </h2>
        <ul>
          <li>
            <strong>Chrome 140+</strong> (Latest Stable, Canary, or Dev)
          </li>
          <li>
            <strong>Operating System:</strong> Windows 10+, macOS 13+ (Ventura),
            Linux, or ChromeOS (Chromebook Plus)
          </li>
          <li>
            <strong>Hardware:</strong> 22GB+ free disk space, GPU with 4GB+ VRAM
            or CPU with 16GB+ RAM
          </li>
          <li>
            <strong>Chrome flags enabled</strong> (see below)
          </li>
        </ul>

        <div
          style={{
            padding: "1rem",
            background: "rgba(251, 191, 36, 0.1)",
            borderLeft: "4px solid #fbbf24",
            borderRadius: "0.5rem",
            margin: "1rem 0",
          }}
        >
          <strong>Note:</strong> Chrome Built-in AI is experimental and requires
          specific flags to be enabled. Model download is ~1-2GB.
        </div>
      </section>

      <section>
        <h2 id="enable-chrome-ai" className="anchor-heading">
          Enable Chrome Built-in AI
          <a href="#enable-chrome-ai" className="anchor-link">
            #
          </a>
        </h2>

        <h3>1. Install Chrome 140+</h3>
        <p>
          Download from{" "}
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
          >
            chrome.com
          </a>{" "}
          (Latest Stable supports Built-in AI)
        </p>

        <h3>2. Enable Chrome Flags</h3>
        <p>
          Enable these flags in <code>chrome://flags</code>:
        </p>
        <CodeBlock
          language="text"
          code={`chrome://flags/#optimization-guide-on-device-model → Enabled BypassPerfRequirement
chrome://flags/#prompt-api-for-gemini-nano → Enabled
chrome://flags/#summarization-api-for-gemini-nano → Enabled
chrome://flags/#translation-api → Enabled
chrome://flags/#rewriter-api-for-gemini-nano → Enabled
chrome://flags/#writer-api-for-gemini-nano → Enabled
chrome://flags/#language-detection-api → Enabled`}
        />

        <h3>3. Restart Chrome</h3>
        <p>Click "Relaunch" button or close and reopen Chrome completely.</p>

        <h3>4. Download the Model</h3>
        <p>
          After enabling the flags, the Gemini Nano model needs to be
          downloaded:
        </p>
        <ol>
          <li>
            Go to <code>chrome://components</code>
          </li>
          <li>
            Find <strong>Optimization Guide On Device Model</strong>
          </li>
          <li>
            Click <strong>Check for update</strong> to download the model
          </li>
          <li>Wait for the download to complete (may take several minutes)</li>
        </ol>

        <h3>5. Verify Model Status</h3>
        <p>
          Visit <code>chrome://on-device-internals</code> and check the Model
          Status tab. You can also verify in DevTools Console:
        </p>
        <CodeBlock
          language="javascript"
          code={`await LanguageModel.availability()
// Should return "available"`}
        />
      </section>

      <section>
        <h2 id="installation" className="anchor-heading">
          Installation
          <a href="#installation" className="anchor-link">
            #
          </a>
        </h2>

        <h3 id="npm" className="anchor-heading">
          npm / yarn / bun
          <a href="#npm" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="bash"
          code={`# npm
npm install @locanara/web

# yarn
yarn add @locanara/web

# bun
bun add @locanara/web`}
        />

        <h3 id="cdn" className="anchor-heading">
          CDN
          <a href="#cdn" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="xml"
          code={`<script type="module">
  import { Locanara } from 'https://esm.sh/@locanara/web';
</script>`}
        />
      </section>

      <section>
        <h2 id="basic-usage" className="anchor-heading">
          Basic Usage
          <a href="#basic-usage" className="anchor-link">
            #
          </a>
        </h2>

        <h3 id="import" className="anchor-heading">
          Import the SDK
          <a href="#import" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="typescript"
          code={`import { Locanara, FeatureAvailability } from '@locanara/web';`}
        />

        <h3 id="initialize" className="anchor-heading">
          Initialize
          <a href="#initialize" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="typescript"
          code={`// Get singleton instance with optional download progress callback
const locanara = Locanara.getInstance({
  onDownloadProgress: (progress) => {
    const percent = (progress.loaded / progress.total) * 100;
    console.log(\`Downloading model: \${percent.toFixed(1)}%\`);
  },
});`}
        />

        <h3 id="check-capabilities" className="anchor-heading">
          Check Capabilities
          <a href="#check-capabilities" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="typescript"
          code={`const capability = await locanara.getDeviceCapability();

if (capability.supportsOnDeviceAI) {
  console.log('Chrome AI available!');

  for (const feature of capability.availableFeatures) {
    if (feature.availability === FeatureAvailability.AVAILABLE) {
      console.log(\`\${feature.feature}: Ready\`);
    } else if (feature.availability === FeatureAvailability.DOWNLOADABLE) {
      console.log(\`\${feature.feature}: Will download on first use\`);
    }
  }
}`}
        />

        <h3 id="use-features" className="anchor-heading">
          Use Features
          <a href="#use-features" className="anchor-link">
            #
          </a>
        </h3>
        <CodeBlock
          language="typescript"
          code={`// Summarize
const summary = await locanara.summarize('Long text here...', {
  type: SummarizeType.KEY_POINTS,
  length: SummarizeLength.MEDIUM,
});
console.log(summary.summary);

// Translate
const translation = await locanara.translate('Hello, world!', {
  sourceLanguage: 'en',
  targetLanguage: 'ko',
});
console.log(translation.translatedText);

// Chat
const response = await locanara.chat('What is the capital of France?');
console.log(response.response);

// Rewrite
const rewritten = await locanara.rewrite('hey whats up', {
  tone: RewriteTone.MORE_FORMAL,
});
console.log(rewritten.rewrittenText);`}
        />
      </section>

      <section>
        <h2 id="streaming" className="anchor-heading">
          Streaming Support
          <a href="#streaming" className="anchor-link">
            #
          </a>
        </h2>
        <p>Most features support streaming for real-time output:</p>
        <CodeBlock
          language="typescript"
          code={`// Streaming chat
for await (const chunk of locanara.chatStreaming('Tell me a story')) {
  process.stdout.write(chunk);
}

// Streaming summarize
for await (const chunk of locanara.summarizeStreaming(longText)) {
  console.log(chunk);
}`}
        />
      </section>

      <section>
        <h2 id="cleanup" className="anchor-heading">
          Cleanup
          <a href="#cleanup" className="anchor-link">
            #
          </a>
        </h2>
        <CodeBlock
          language="typescript"
          code={`// Reset chat session
await locanara.resetChat();

// Destroy all cached instances
locanara.destroy();`}
        />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <a href="/docs/types/web">Web Types</a>
          </li>
          <li>
            <a href="/docs/utils/web">Web APIs</a>
          </li>
          <li>
            <a href="/docs/errors">Error Handling</a>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default WebSetup;
