import { Link } from "react-router-dom";
import CodeBlock from "../../../components/CodeBlock";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function TypesWeb() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Types"
        description="Locanara Web-specific type definitions - Chrome Built-in AI types for TypeScript."
        path="/docs/types/web"
        keywords="Locanara types, Web, Chrome Built-in AI, Gemini Nano, TypeScript"
      />
      <h1>Web Types</h1>
      <p>
        Type definitions specific to Web/Chrome Built-in AI. All Web-specific
        types have the <code>Web</code> suffix to distinguish from other
        platforms.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Core:</strong>{" "}
            <a href="#chrome-ai-model-info">ChromeAIModelInfo</a>,{" "}
            <a href="#browser-info-web">BrowserInfoWeb</a>,{" "}
            <a href="#feature-capability-web">FeatureCapabilityWeb</a>
          </li>
          <li>
            <strong>Summarize:</strong>{" "}
            <a href="#summarize-type-web">SummarizeTypeWeb</a>,{" "}
            <a href="#summarize-length-web">SummarizeLengthWeb</a>,{" "}
            <a href="#summarize-format-web">SummarizeFormatWeb</a>
          </li>
          <li>
            <strong>Rewrite:</strong>{" "}
            <a href="#rewrite-tone-web">RewriteToneWeb</a>,{" "}
            <a href="#rewrite-length-web">RewriteLengthWeb</a>
          </li>
          <li>
            <strong>Writer:</strong>{" "}
            <a href="#writer-tone-web">WriterToneWeb</a>,{" "}
            <a href="#writer-length-web">WriterLengthWeb</a>
          </li>
          <li>
            <strong>All types have Web suffix</strong> to distinguish from other
            platforms
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="feature-availability-web">FeatureAvailabilityWeb</h2>
        <p>Status of Chrome Built-in AI feature availability.</p>
        <CodeBlock
          language="typescript"
          code={`enum FeatureAvailabilityWeb {
  AVAILABLE = 'AVAILABLE',      // Ready to use
  DOWNLOADABLE = 'DOWNLOADABLE', // Will download on first use
  UNAVAILABLE = 'UNAVAILABLE',   // Not available
}`}
        />
      </section>

      <section>
        <h2 id="chrome-ai-model-info">ChromeAIModelInfo</h2>
        <p>Chrome Built-in AI model information.</p>
        <CodeBlock
          language="typescript"
          code={`interface ChromeAIModelInfo {
  name: string;
  isDownloaded: boolean;
  isReady: boolean;
  supportedAPIs: string[];
}`}
        />
      </section>

      <section>
        <h2 id="browser-info-web">BrowserInfoWeb</h2>
        <p>Browser and environment information.</p>
        <CodeBlock
          language="typescript"
          code={`interface BrowserInfoWeb {
  browserName: string;
  browserVersion: string;
  supportsChromeAI: boolean;
  userAgent: string;
  availableAPIs: string[];
}`}
        />
      </section>

      <section>
        <h2 id="feature-capability-web">FeatureCapabilityWeb</h2>
        <p>Feature capability for web platform.</p>
        <CodeBlock
          language="typescript"
          code={`interface FeatureCapabilityWeb {
  feature: FeatureType;
  availability: FeatureAvailabilityWeb;
}`}
        />
      </section>

      <section>
        <h2 id="summarize-type-web">SummarizeTypeWeb</h2>
        <p>Type options for text summarization.</p>
        <CodeBlock
          language="typescript"
          code={`enum SummarizeTypeWeb {
  KEY_POINTS = 'KEY_POINTS',  // Key points extraction
  TLDR = 'TLDR',              // Too Long; Didn't Read
  TEASER = 'TEASER',          // Teaser/preview text
  HEADLINE = 'HEADLINE',      // Single headline
}`}
        />
      </section>

      <section>
        <h2 id="summarize-length-web">SummarizeLengthWeb</h2>
        <p>Length options for summarization.</p>
        <CodeBlock
          language="typescript"
          code={`enum SummarizeLengthWeb {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}`}
        />
      </section>

      <section>
        <h2 id="summarize-format-web">SummarizeFormatWeb</h2>
        <p>Output format for summarization.</p>
        <CodeBlock
          language="typescript"
          code={`enum SummarizeFormatWeb {
  MARKDOWN = 'MARKDOWN',
  PLAIN_TEXT = 'PLAIN_TEXT',
}`}
        />
      </section>

      <section>
        <h2 id="rewrite-tone-web">RewriteToneWeb</h2>
        <p>Tone options for text rewriting.</p>
        <CodeBlock
          language="typescript"
          code={`enum RewriteToneWeb {
  MORE_FORMAL = 'MORE_FORMAL',  // Professional tone
  AS_IS = 'AS_IS',              // Keep original tone
  MORE_CASUAL = 'MORE_CASUAL',  // Casual tone
}`}
        />
      </section>

      <section>
        <h2 id="rewrite-length-web">RewriteLengthWeb</h2>
        <p>Length options for rewriting.</p>
        <CodeBlock
          language="typescript"
          code={`enum RewriteLengthWeb {
  SHORTER = 'SHORTER',
  AS_IS = 'AS_IS',
  LONGER = 'LONGER',
}`}
        />
      </section>

      <section>
        <h2 id="writer-tone-web">WriterToneWeb</h2>
        <p>Tone options for Chrome Writer API.</p>
        <CodeBlock
          language="typescript"
          code={`enum WriterToneWeb {
  FORMAL = 'FORMAL',
  NEUTRAL = 'NEUTRAL',
  CASUAL = 'CASUAL',
}`}
        />
      </section>

      <section>
        <h2 id="writer-length-web">WriterLengthWeb</h2>
        <p>Length options for Chrome Writer API.</p>
        <CodeBlock
          language="typescript"
          code={`enum WriterLengthWeb {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}`}
        />
      </section>

      <section>
        <h2 id="execute-feature-options-web">ExecuteFeatureOptionsWeb</h2>
        <p>Web-specific execution options for AI features.</p>
        <CodeBlock
          language="typescript"
          code={`interface ExecuteFeatureOptionsWeb {
  summarizeType?: SummarizeTypeWeb;
  summarizeLength?: SummarizeLengthWeb;
  summarizeFormat?: SummarizeFormatWeb;
  rewriteTone?: RewriteToneWeb;
  rewriteLength?: RewriteLengthWeb;
  writerTone?: WriterToneWeb;
  writerLength?: WriterLengthWeb;
  sourceLanguage?: string;
  targetLanguage?: string;
  categories?: string[];
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  context?: string;
}`}
        />
      </section>

      <section>
        <h2 id="result-types">Result Types</h2>
        <p>Result types for each feature.</p>
        <CodeBlock
          language="typescript"
          code={`interface SummarizeResultWeb {
  summary: string;
}

interface TranslateResultWeb {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface ChatResultWeb {
  response: string;
}

interface RewriteResultWeb {
  rewrittenText: string;
}

interface ClassifyResultWeb {
  category: string;
  confidence: number;
}

interface ExtractResultWeb {
  entities: string;  // JSON string
}

interface ProofreadResultWeb {
  correctedText: string;
}

interface DescribeImageResultWeb {
  description: string;
}

interface DetectLanguageResultWeb {
  detectedLanguage: string;
  confidence: number;
}

interface WriteResultWeb {
  text: string;
}`}
        />
      </section>

      <section>
        <h2>See Also</h2>
        <ul>
          <li>
            <Link to="/docs/types">All Types</Link>
          </li>
          <li>
            <Link to="/docs/types/ios">iOS Types</Link>
          </li>
          <li>
            <Link to="/docs/types/android">Android Types</Link>
          </li>
          <li>
            <Link to="/docs/utils/web">Web APIs</Link>
          </li>
          <li>
            <Link to="/docs/web-setup">Web Setup Guide</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default TypesWeb;
