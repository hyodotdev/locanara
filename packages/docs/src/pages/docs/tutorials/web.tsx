import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import Callout from "../../../components/Callout";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function WebTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Tutorial"
        description="Step-by-step tutorial for building a web app with Chrome Built-in AI using Locanara SDK."
        path="/docs/tutorials/web"
        keywords="Web tutorial, Chrome Built-in AI, Gemini Nano, TypeScript, on-device AI"
      />
      <h1>Web Tutorial</h1>
      <p>
        Build a complete web application with Chrome Built-in AI features using
        the Locanara Web SDK. This tutorial walks you through implementing text
        summarization, translation, chat, and more.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Platform:</strong> Chrome Canary/Dev with Built-in AI flags
          </li>
          <li>
            <strong>Language:</strong> TypeScript
          </li>
          <li>
            <strong>Features:</strong> Summarize, Translate, Chat, Rewrite,
            Proofread
          </li>
          <li>
            <strong>Time:</strong> ~20 minutes
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="setup" level="h2">
          1. Project Setup
        </AnchorLink>
        <p>Create a new project and install the Locanara Web SDK.</p>

        <h4>1. Configure GitHub Packages</h4>
        <p>
          Locanara Web SDK is hosted on GitHub Packages. Create or update{" "}
          <code>.npmrc</code> in your project root:
        </p>
        <CodeBlock language="text">{`@locanara:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN`}</CodeBlock>

        <Callout type="info" title="GitHub Packages Authentication">
          <p>Set up authentication:</p>
          <ol>
            <li>
              Create a Personal Access Token (PAT) with{" "}
              <code>read:packages</code> scope at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Settings
              </a>
            </li>
            <li>
              Replace <code>YOUR_GITHUB_TOKEN</code> in <code>.npmrc</code> with
              your token
            </li>
          </ol>
          <p>
            Or use environment variable:{" "}
            <code>
              npm config set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN
            </code>
          </p>
        </Callout>

        <h4>2. Initialize Project</h4>
        <CodeBlock language="bash">{`# Create a new project
mkdir locanara-web-demo
cd locanara-web-demo
npm init -y

# Install dependencies
npm install @locanara/web
npm install -D typescript vite`}</CodeBlock>

        <h4>3. Configure TypeScript</h4>
        <p>
          Create <code>tsconfig.json</code>:
        </p>
        <CodeBlock language="typescript">{`// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`}</CodeBlock>

        <h4>4. Create HTML Entry</h4>
        <p>
          Create <code>index.html</code>:
        </p>
        <CodeBlock language="xml">{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Locanara Web Demo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #0a0a0a;
      color: #fafafa;
    }
    textarea, input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a1a;
      color: #fafafa;
      font-size: 1rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .result {
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      margin-top: 1rem;
      white-space: pre-wrap;
    }
    .error { color: #ef4444; }
    .success { color: #4ade80; }
    section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #333;
      border-radius: 12px;
    }
    h2 { margin-top: 0; }
  </style>
</head>
<body>
  <h1>Locanara Web Demo</h1>
  <div id="ai-status"></div>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`}</CodeBlock>

        <Callout type="warning" title="Gemma License Attribution">
          <p>
            Locanara Web SDK uses the <strong>Gemma</strong> model for on-device
            AI. You must include the following attribution in your app (e.g., in
            footer, about page, or licenses section):
          </p>
          <CodeBlock language="text">{`Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms`}</CodeBlock>
          <p>
            For full license details, see the{" "}
            <a
              href="https://ai.google.dev/gemma/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gemma Terms of Use
            </a>
            .
          </p>
        </Callout>
      </section>

      <section>
        <AnchorLink id="check-capability" level="h2">
          2. Check Device Capability
        </AnchorLink>
        <p>Initialize Locanara and check if Chrome Built-in AI is available.</p>

        <CodeBlock language="typescript">{`import { Locanara, FeatureAvailability } from '@locanara/web';

// Initialize Locanara
const locanara = Locanara.getInstance({
  onDownloadProgress: (progress) => {
    const percent = progress.total > 0
      ? ((progress.loaded / progress.total) * 100).toFixed(1)
      : '0';
    console.log(\`Downloading model: \${percent}%\`);
  },
});

// Check device capability
const capability = await locanara.getDeviceCapability();

if (capability.supportsOnDeviceAI) {
  console.log('Chrome Built-in AI is available');
  console.log('Features:', capability.availableFeatures);
} else {
  console.log('Chrome Built-in AI not available');
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="summarize" level="h2">
          3. Summarize Text
        </AnchorLink>
        <p>Condense long text into key points.</p>

        <CodeBlock language="typescript">{`import { Locanara, SummarizeType, SummarizeLength } from '@locanara/web';

const locanara = Locanara.getInstance();

// Basic summarization
const result = await locanara.summarize(longText, {
  type: SummarizeType.KEY_POINTS,
  length: SummarizeLength.MEDIUM,
});
console.log(result.summary);

// Streaming summarization
for await (const chunk of locanara.summarizeStreaming(longText, {
  type: SummarizeType.TL_DR,
  length: SummarizeLength.SHORT,
})) {
  process.stdout.write(chunk);
}`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="translate" level="h2">
          4. Translate Text
        </AnchorLink>
        <p>Translate text between languages.</p>

        <CodeBlock language="typescript">{`// Basic translation
const result = await locanara.translate('Hello, how are you?', {
  sourceLanguage: 'en',
  targetLanguage: 'ko',
});
console.log(result.translatedText);

// Streaming translation
for await (const chunk of locanara.translateStreaming(text, {
  sourceLanguage: 'en',
  targetLanguage: 'ja',
})) {
  process.stdout.write(chunk);
}

// Language detection
const detected = await locanara.detectLanguage('Bonjour le monde');
console.log(detected.detectedLanguage); // 'fr'`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="chat" level="h2">
          5. Chat
        </AnchorLink>
        <p>Build conversational AI with streaming responses.</p>

        <CodeBlock language="typescript">{`// Basic chat
const result = await locanara.chat('What is the capital of France?');
console.log(result.response);

// Streaming chat (recommended for real-time UI)
for await (const chunk of locanara.chatStreaming('Tell me a story')) {
  process.stdout.write(chunk);
}

// Reset chat session to start fresh
await locanara.resetChat();`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="rewrite" level="h2">
          6. Rewrite Text
        </AnchorLink>
        <p>Rewrite text with different tones and lengths.</p>

        <CodeBlock language="typescript">{`import { RewriteTone, RewriteLength } from '@locanara/web';

// Basic rewrite
const result = await locanara.rewrite('hey whats up can we talk tomorrow', {
  tone: RewriteTone.MORE_FORMAL,
  length: RewriteLength.AS_IS,
});
console.log(result.rewrittenText);

// Available options:
// tone: MORE_FORMAL, MORE_CASUAL
// length: AS_IS, SHORTER, LONGER`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="proofread" level="h2">
          7. Proofread Text
        </AnchorLink>
        <p>Check and correct grammar and spelling errors.</p>

        <CodeBlock language="typescript">{`// Proofread text
const result = await locanara.proofread(
  'Their going to the store tommorow.'
);
console.log(result.correctedText);
// "They're going to the store tomorrow."`}</CodeBlock>

        <div className="alert-card alert-card--warning">
          <p>
            <strong>Important:</strong> You must use Chrome Canary or Dev
            channel with the experimental flags enabled. See{" "}
            <Link to="/docs/web-setup">Web Setup Guide</Link> for details.
          </p>
        </div>
      </section>

      <section>
        <AnchorLink id="next-steps" level="h2">
          Next Steps
        </AnchorLink>
        <ul>
          <li>
            <Link to="/docs/apis/web">Explore all Web APIs</Link> available in
            Chrome Built-in AI
          </li>
          <li>
            <Link to="/docs/apis/describe-image">Add image description</Link>{" "}
            for accessibility
          </li>
          <li>
            Learn about{" "}
            <Link to="/docs/apis/translate">language detection</Link> with{" "}
            <code>detectLanguage()</code>
          </li>
          <li>
            Check the{" "}
            <a
              href="https://github.com/locanara/locanara/tree/main/packages/web/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              complete example app
            </a>{" "}
            on GitHub
          </li>
          <li>
            Review <Link to="/docs/types/web">Web Types</Link> for all available
            options
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/android", label: "Android Tutorial" }}
      />
    </div>
  );
}

export default WebTutorial;
