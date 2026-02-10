import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function WebAPIs() {
  return (
    <div className="doc-page">
      <SEO
        title="Web APIs"
        description="Locanara Web-specific APIs - Chrome Built-in AI (Gemini Nano) APIs for on-device AI."
        path="/docs/utils/web"
        keywords="Web API, Chrome Built-in AI, Gemini Nano, on-device AI, TypeScript"
      />
      <h1>Web APIs</h1>
      <p>
        Web-specific APIs using Chrome Built-in AI (Gemini Nano). These APIs are
        available in Chrome Canary/Dev with experimental flags enabled.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong> getDeviceCapability, destroy
          </li>
          <li>
            <strong>Text:</strong> summarize, classify, extract, translate,
            rewrite, proofread
          </li>
          <li>
            <strong>Chat:</strong> chat, chatStreaming, resetChat
          </li>
          <li>
            <strong>Web-specific:</strong> detectLanguage, write
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="core-apis">Core APIs</h2>

        <h3 id="get-instance">getInstance()</h3>
        <p>Get singleton Locanara instance with optional configuration.</p>
        <CodeBlock
          language="typescript"
          code={`import { Locanara } from '@locanara/web';

const locanara = Locanara.getInstance({
  onDownloadProgress: (progress) => {
    const percent = (progress.loaded / progress.total) * 100;
    console.log(\`Downloading: \${percent.toFixed(1)}%\`);
  },
});`}
        />

        <h3 id="get-device-capability">getDeviceCapability()</h3>
        <p>Get device AI capabilities and available features.</p>
        <CodeBlock
          language="typescript"
          code={`const capability = await locanara.getDeviceCapability();

if (capability.supportsOnDeviceAI) {
  console.log('Chrome AI available!');

  for (const feature of capability.availableFeatures) {
    console.log(\`\${feature.feature}: \${feature.availability}\`);
  }
}

// Returns: DeviceCapability
// - platform: Platform.WEB
// - supportsOnDeviceAI: boolean
// - availableFeatures: FeatureCapability[]`}
        />
      </section>

      <section>
        <h2 id="text-apis">Text Processing APIs</h2>

        <h3 id="summarize">summarize()</h3>
        <p>Summarize text with configurable type and length.</p>
        <CodeBlock
          language="typescript"
          code={`import { SummarizeType, SummarizeLength } from '@locanara/web';

const result = await locanara.summarize(
  'Long article text...',
  {
    type: SummarizeType.KEY_POINTS,
    length: SummarizeLength.MEDIUM,
  }
);

console.log(result.summary);

// Streaming version
const longText = 'Your long article text here...';
for await (const chunk of locanara.summarizeStreaming(longText)) {
  process.stdout.write(chunk);
}`}
        />

        <h3 id="classify">classify()</h3>
        <p>Classify text into predefined categories.</p>
        <CodeBlock
          language="typescript"
          code={`const result = await locanara.classify(
  'This product is amazing!',
  {
    categories: ['positive', 'negative', 'neutral'],
  }
);

console.log(\`Category: \${result.category}\`);
console.log(\`Confidence: \${(result.confidence * 100).toFixed(1)}%\`);`}
        />

        <h3 id="extract">extract()</h3>
        <p>Extract entities from text.</p>
        <CodeBlock
          language="typescript"
          code={`const result = await locanara.extract(
  'Contact John at john@example.com or 555-1234',
  {
    schema: { name: 'string', email: 'string', phone: 'string' },
  }
);

console.log(result.entities);
// { name: 'John', email: 'john@example.com', phone: '555-1234' }`}
        />

        <h3 id="translate">translate()</h3>
        <p>Translate text between languages.</p>
        <CodeBlock
          language="typescript"
          code={`const result = await locanara.translate(
  'Hello, world!',
  {
    sourceLanguage: 'en',
    targetLanguage: 'ko',
  }
);

console.log(result.translatedText);  // '안녕하세요, 세상!'

// Streaming version
const textToTranslate = 'Hello, how are you today?';
const translateOptions = { sourceLanguage: 'en', targetLanguage: 'ko' };
for await (const chunk of locanara.translateStreaming(textToTranslate, translateOptions)) {
  process.stdout.write(chunk);
}`}
        />

        <h3 id="rewrite">rewrite()</h3>
        <p>Rewrite text with different tones.</p>
        <CodeBlock
          language="typescript"
          code={`import { RewriteTone, RewriteLength } from '@locanara/web';

const result = await locanara.rewrite(
  'hey whats up',
  {
    tone: RewriteTone.MORE_FORMAL,
    length: RewriteLength.AS_IS,
  }
);

console.log(result.rewrittenText);  // 'Hello, how are you?'`}
        />

        <h3 id="proofread">proofread()</h3>
        <p>Check grammar and spelling.</p>
        <CodeBlock
          language="typescript"
          code={`const result = await locanara.proofread(
  'Thier going too the store'
);

console.log(result.correctedText);  // "They're going to the store"`}
        />
      </section>

      <section>
        <h2 id="chat-apis">Chat APIs</h2>

        <h3 id="chat">chat()</h3>
        <p>Conversational AI with session context.</p>
        <CodeBlock
          language="typescript"
          code={`const result = await locanara.chat(
  'What is the capital of France?',
  {
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    topK: 40,
  }
);

console.log(result.response);  // 'The capital of France is Paris.'

// Continue conversation (context preserved)
const followUp = await locanara.chat('What about Germany?');
console.log(followUp.response);  // 'The capital of Germany is Berlin.'`}
        />

        <h3 id="chat-streaming">chatStreaming()</h3>
        <p>
          Streaming chat for real-time responses. Equivalent to{" "}
          <code>chain.streamRun()</code> on iOS/Android.
        </p>
        <CodeBlock
          language="typescript"
          code={`for await (const chunk of locanara.chatStreaming('Tell me a story')) {
  process.stdout.write(chunk);
}`}
        />

        <h3 id="reset-chat">resetChat()</h3>
        <p>Reset chat session and clear context.</p>
        <CodeBlock language="typescript" code={`await locanara.resetChat();`} />
      </section>

      <section>
        <h2 id="web-specific-apis">Web-Specific APIs</h2>

        <h3 id="detect-language">detectLanguage()</h3>
        <p>Detect language of text.</p>
        <CodeBlock
          language="typescript"
          code={`const results = await locanara.detectLanguage('Bonjour le monde!');

for (const result of results) {
  console.log(\`\${result.detectedLanguage}: \${(result.confidence * 100).toFixed(1)}%\`);
}
// fr: 95.2%
// en: 2.1%`}
        />

        <h3 id="write">write()</h3>
        <p>Generate text using Chrome Writer API.</p>
        <CodeBlock
          language="typescript"
          code={`import { WriterTone, WriterLength } from '@locanara/web';

const result = await locanara.write(
  'Write a short poem about coding',
  {
    tone: WriterTone.CASUAL,
    length: WriterLength.MEDIUM,
  }
);

console.log(result.text);

// Streaming version
const myPrompt = 'Write a haiku about programming';
for await (const chunk of locanara.writeStreaming(myPrompt)) {
  process.stdout.write(chunk);
}`}
        />
      </section>

      <section>
        <h2 id="cleanup">Cleanup</h2>

        <h3 id="destroy">destroy()</h3>
        <p>Destroy all cached instances and free resources.</p>
        <CodeBlock language="typescript" code={`locanara.destroy();`} />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types/web">Web Types</Link>
          </li>
          <li>
            <Link to="/docs/web-setup">Web Setup Guide</Link>
          </li>
          <li>
            <Link to="/docs/errors">Error Handling</Link>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/utils/android", label: "Android APIs" }}
      />
    </div>
  );
}

export default WebAPIs;
