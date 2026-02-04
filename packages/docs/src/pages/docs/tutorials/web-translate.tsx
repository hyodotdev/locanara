import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function WebTranslateTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Translate Tutorial"
        description="Learn how to implement multi-language translation with Chrome Built-in AI using Locanara SDK."
        path="/docs/tutorials/web-translate"
        keywords="Web translate, Chrome Built-in AI, TypeScript, translation, Locanara"
      />
      <h1>Web: Translate Tutorial</h1>
      <p>
        Learn how to implement multi-language translation using Chrome Built-in
        AI and the Locanara Web SDK.
      </p>

      <section>
        <h2>Prerequisites</h2>
        <ul>
          <li>Chrome Canary or Dev channel with Built-in AI flags enabled</li>
          <li>
            Locanara Web SDK installed (see{" "}
            <a href="/docs/web-setup">Setup Guide</a>)
          </li>
        </ul>
      </section>

      <section>
        <h2>Basic Translation</h2>
        <p>Simple translation between two languages.</p>

        <CodeBlock language="typescript">{`import { Locanara } from '@locanara/web';

const locanara = Locanara.getInstance();

async function translate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    const result = await locanara.translate(text, {
      sourceLanguage,
      targetLanguage,
    });
    return result.translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  }
}

// Usage
const translated = await translate('Hello, how are you?', 'en', 'ko');
console.log(translated); // "안녕하세요, 어떻게 지내세요?"`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming Translation</h2>
        <p>Get real-time translation results with streaming.</p>

        <CodeBlock language="typescript">{`async function translateWithStreaming(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  let fullResult = '';

  for await (const chunk of locanara.translateStreaming(text, {
    sourceLanguage,
    targetLanguage,
  })) {
    fullResult += chunk;
    onChunk(chunk);
  }

  return fullResult;
}

// Usage in UI
const resultElement = document.getElementById('translate-result')!;
resultElement.textContent = '';

await translateWithStreaming('Hello!', 'en', 'ja', (chunk) => {
  resultElement.textContent += chunk;
});`}</CodeBlock>
      </section>

      <section>
        <h2>Language Detection</h2>
        <p>Automatically detect the source language before translation.</p>

        <CodeBlock language="typescript">{`async function translateWithAutoDetect(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  // Detect source language
  const detected = await locanara.detectLanguage(text);
  const sourceLanguage = detected.detectedLanguage;

  console.log(\`Detected language: \${sourceLanguage}\`);

  // Translate
  const result = await locanara.translate(text, {
    sourceLanguage,
    targetLanguage,
  });

  return {
    translatedText: result.translatedText,
    detectedLanguage: sourceLanguage,
  };
}

// Usage
const result = await translateWithAutoDetect('Bonjour le monde', 'en');
// { translatedText: "Hello world", detectedLanguage: "fr" }`}</CodeBlock>
      </section>

      <section>
        <h2>Batch Translation</h2>
        <p>Translate multiple texts at once.</p>

        <CodeBlock language="typescript">{`async function translateBatch(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string[]> {
  return Promise.all(
    texts.map(text =>
      locanara.translate(text, { sourceLanguage, targetLanguage })
        .then(r => r.translatedText)
    )
  );
}

// Usage
const translations = await translateBatch(
  ['Hello', 'Goodbye', 'Thank you'],
  'en',
  'ko'
);
// ['안녕하세요', '안녕히 가세요', '감사합니다']`}</CodeBlock>
      </section>

      <section>
        <h2>Supported Languages</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            {[
              { code: "en", name: "English" },
              { code: "ko", name: "Korean" },
              { code: "ja", name: "Japanese" },
              { code: "zh", name: "Chinese (Simplified)" },
              { code: "es", name: "Spanish" },
              { code: "fr", name: "French" },
              { code: "de", name: "German" },
              { code: "pt", name: "Portuguese" },
              { code: "it", name: "Italian" },
              { code: "ru", name: "Russian" },
            ].map((lang) => (
              <tr key={lang.code}>
                <td>
                  <code>{lang.code}</code>
                </td>
                <td>{lang.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="table-note">
          Note: Available languages may vary based on Chrome version and
          downloaded language packs.
        </p>
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>sourceLanguage</strong>: ISO 639-1 code of the source
            language
          </li>
          <li>
            <strong>targetLanguage</strong>: ISO 639-1 code of the target
            language
          </li>
          <li>
            Use <code>detectLanguage()</code> for automatic source language
            detection
          </li>
          <li>Streaming translation provides better UX for longer texts</li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/web-chat", label: "Web Chat Tutorial" }}
        next={{ to: "/docs/types", label: "Types Reference" }}
      />
    </div>
  );
}

export default WebTranslateTutorial;
