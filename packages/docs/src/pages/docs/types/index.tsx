import { Link } from "react-router-dom";
import APICard from "../../../components/APICard";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";
import CodeBlock from "../../../components/CodeBlock";

function TypesIndex() {
  return (
    <div className="doc-page">
      <SEO
        title="Types"
        description="Locanara type definitions - Chain, ChainInput, ChainOutput, DeviceCapability, and built-in chain result types."
        path="/docs/types"
        keywords="Locanara types, Chain, ChainInput, ChainOutput, Pipeline, Swift, Kotlin, on-device AI"
      />
      <h1>Types</h1>
      <p>
        Complete type definitions for Locanara. Includes framework types (Chain,
        Pipeline, Memory, Guardrail) and built-in chain result types.
      </p>

      <TLDRBox title="Type Categories">
        <ul>
          <li>
            <strong>Framework Types</strong>: Chain, ChainInput, ChainOutput,
            Pipeline, Memory, Guardrail
          </li>
          <li>
            <strong>Built-in Chain Types</strong>: SummarizeResult,
            ClassifyResult, TranslateResult
          </li>
          <li>
            <strong>Core Types</strong>: DeviceCapability, LocanaraModel
          </li>
          <li>
            <strong>Platform Types</strong>: iOS, Android, Web specific types (
            <Link to="#platform-specific-types">see below</Link>)
          </li>
        </ul>
      </TLDRBox>

      <section>
        <h2 id="chain">Chain Protocol</h2>
        <p>
          The core abstraction for building AI features. Implement this protocol
          to create custom chains.
        </p>
        <CodeBlock
          language="typescript"
          code={`// Chain protocol (Swift: protocol Chain, Kotlin: interface Chain)
interface Chain<Input extends ChainInput, Output extends ChainOutput> {
  id: string;
  invoke(input: Input): Promise<Output>;
}

interface ChainInput {
  text: string;
  metadata?: Record<string, any>;
}

interface ChainOutput {
  text: string;
  metadata?: Record<string, any>;
}`}
        />
      </section>

      <section>
        <h2 id="pipeline">Pipeline</h2>
        <p>Compose multiple chains with compile-time type safety.</p>
        <CodeBlock
          language="typescript"
          code={`// Pipeline composes chains: Chain A → Chain B → Chain C
interface Pipeline<Input extends ChainInput, Output extends ChainOutput> {
  steps: Chain[];
  run(input: Input): Promise<Output>;
}`}
        />
      </section>

      <section>
        <h2 id="memory">Memory</h2>
        <p>Conversation memory for stateful sessions.</p>
        <CodeBlock
          language="typescript"
          code={`interface Memory {
  addEntry(entry: MemoryEntry): void;
  getEntries(): MemoryEntry[];
  clear(): void;
}

// BufferMemory: keeps last N entries
// SummaryMemory: summarizes older entries`}
        />
      </section>

      <section>
        <h2 id="guardrail">Guardrail</h2>
        <p>Input/output validation for production use.</p>
        <CodeBlock
          language="typescript"
          code={`interface Guardrail {
  id: string;
  validate(text: string): GuardrailResult;
}

// Built-in: InputLengthGuardrail, ContentFilterGuardrail`}
        />
      </section>

      <section>
        <h2 id="device-capability">DeviceCapability</h2>
        <p>Represents the AI capabilities available on the current device.</p>
        <CodeBlock
          language="typescript"
          code={`interface DeviceCapability {
  isAvailable: boolean;
  platform: Platform;
  availableFeatures: FeatureType[];
  modelStatus?: ModelStatus;
}`}
        />
      </section>

      <section>
        <h2 id="feature-type">FeatureType</h2>
        <p>
          Enum of available built-in chains (used by the low-level{" "}
          <code>executeFeature()</code> API).
        </p>
        <CodeBlock
          language="typescript"
          code={`enum FeatureType {
  SUMMARIZE,
  CLASSIFY,
  EXTRACT,
  CHAT,
  TRANSLATE,
  REWRITE,
  PROOFREAD,
  DESCRIBE_IMAGE
}`}
        />
      </section>

      <section>
        <h2 id="execution-result">ExecutionResult</h2>
        <p>
          Result type for the low-level <code>executeFeature()</code> API. For
          framework usage, prefer Chain-specific result types.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface ExecutionResult {
  success: boolean;
  data?: string;
  error?: LocanaraError;
}`}
        />
      </section>

      <section>
        <h2 id="summarize-result">SummarizeResult</h2>
        <p>
          Output type for <code>SummarizeChain</code> /{" "}
          <code>model.summarize()</code>.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface SummarizeResult {
  text: string;
  style: SummarizeStyle;
}`}
        />
      </section>

      <section>
        <h2 id="classify-result">ClassifyResult</h2>
        <p>
          Output type for <code>ClassifyChain</code> /{" "}
          <code>model.classify()</code>.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface ClassifyResult {
  labels: ClassificationLabel[];
}

interface ClassificationLabel {
  label: string;
  confidence: number;
}`}
        />
      </section>

      <section>
        <h2 id="translate-result">TranslateResult</h2>
        <p>
          Output type for <code>TranslateChain</code> /{" "}
          <code>model.translate()</code>.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface TranslateResult {
  translatedText: string;
  sourceLanguage?: Language;
  targetLanguage: Language;
}`}
        />
      </section>

      <section>
        <h2 id="rewrite-result">RewriteResult</h2>
        <p>
          Output type for <code>RewriteChain</code> /{" "}
          <code>model.rewrite()</code>.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface RewriteResult {
  text: string;
  style: RewriteStyle;
}`}
        />
      </section>

      <section>
        <h2 id="proofread-result">ProofreadResult</h2>
        <p>
          Output type for <code>ProofreadChain</code> /{" "}
          <code>model.proofread()</code>.
        </p>
        <CodeBlock
          language="typescript"
          code={`interface ProofreadResult {
  correctedText: string;
  corrections: Correction[];
}

interface Correction {
  original: string;
  corrected: string;
  position: number;
}`}
        />
      </section>

      <section>
        <h2 id="platform-specific-types">Platform Specific Types</h2>
        <p>
          While the core types above are shared across all platforms, each
          platform has additional types specific to its underlying AI framework.
          These types provide platform-native functionality and expose
          framework-specific features.
        </p>
        <p>
          For example, iOS types include Apple Intelligence's{" "}
          <code>FoundationModelInfo</code> for model availability, Android types
          include <code>GeminiNanoInfo</code> for ML Kit GenAI status, and Web
          types include <code>FeatureAvailability</code> for Chrome Built-in AI
          detection.
        </p>
        <div className="api-cards-grid">
          <APICard
            title="iOS Types"
            description="Apple Intelligence types including FoundationModelInfo and iOS-specific result types."
            href="/docs/types/ios"
            count={6}
          />
          <APICard
            title="Android Types"
            description="Gemini Nano types including GeminiNanoInfo and ML Kit GenAI result types."
            href="/docs/types/android"
            count={5}
          />
          <APICard
            title="Web Types"
            description="Chrome Built-in AI types including FeatureAvailability and TypeScript result types."
            href="/docs/types/web"
            count={10}
          />
        </div>
      </section>
    </div>
  );
}

export default TypesIndex;
