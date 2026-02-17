import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ModelAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Model API"
        description="LocanaraModel — platform AI backend abstraction for iOS and Android."
        path="/docs/apis/model"
      />
      <h1>Model</h1>
      <p>
        <code>LocanaraModel</code> is the protocol/interface that abstracts
        platform AI backends. iOS uses <code>FoundationLanguageModel</code>{" "}
        (Apple Intelligence) and Android uses <code>PromptApiModel</code>{" "}
        (Gemini Nano).
      </p>

      <TLDRBox>
        <ul>
          <li>
            <code>LocanaraModel</code> is the protocol/interface that abstracts
            platform AI backends
          </li>
          <li>
            <strong>iOS</strong>: <code>FoundationLanguageModel</code> (Apple
            Intelligence)
          </li>
          <li>
            <strong>Android</strong>: <code>PromptApiModel</code> (Gemini Nano)
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="protocol" level="h2">
          LocanaraModel Protocol
        </AnchorLink>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface LocanaraModel {
  name: string;
  readonly isReady: boolean;
  maxContextTokens: number;
  generate(prompt: string, config?: GenerationConfig): Promise<ModelResponse>;
  stream(prompt: string, config?: GenerationConfig): AsyncIterable<string>;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public protocol LocanaraModel: Sendable {
    var name: String { get }
    var isReady: Bool { get async }
    var maxContextTokens: Int { get }
    func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse
    func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error>
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`interface LocanaraModel {
    val name: String
    val isReady: Boolean
    val maxContextTokens: Int
    suspend fun generate(prompt: String, config: GenerationConfig? = null): ModelResponse
    fun stream(prompt: String, config: GenerationConfig? = null): Flow<String>
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="config" level="h2">
          GenerationConfig
        </AnchorLink>
        <p>
          Configure generation parameters like temperature, top-K sampling, and
          max tokens. Use presets for common scenarios.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`// Custom config
const config: GenerationConfig = { temperature: 0.7, topK: 40, maxTokens: 1024 };

// Built-in presets
GenerationConfig.structured;      // temperature: 0.1
GenerationConfig.creative;        // temperature: 0.9
GenerationConfig.conversational;  // temperature: 0.7`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`// Custom config
let config = GenerationConfig(temperature: 0.7, topK: 40, maxTokens: 1024)

// Built-in presets
let structured = GenerationConfig.structured      // temperature: 0.1
let creative = GenerationConfig.creative           // temperature: 0.9
let conversational = GenerationConfig.conversational // temperature: 0.7`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Custom config
val config = GenerationConfig(temperature = 0.7f, topK = 40, maxTokens = 1024)

// Built-in presets
val structured = GenerationConfig.STRUCTURED      // temperature: 0.1
val creative = GenerationConfig.CREATIVE           // temperature: 0.9
val conversational = GenerationConfig.CONVERSATIONAL // temperature: 0.7`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="backends" level="h2">
          Platform Backends
        </AnchorLink>

        <h4>FoundationLanguageModel (iOS)</h4>
        <p>
          Uses Apple Intelligence via the Foundation Models framework. Requires
          iOS 26+ and an Apple Intelligence capable device.
        </p>
        <CodeBlock language="swift">{`let model = FoundationLanguageModel()`}</CodeBlock>

        <h4>PromptApiModel (Android)</h4>
        <p>
          Uses Gemini Nano via ML Kit GenAI. Requires Android 14+ (API level 34)
          with a supported device.
        </p>
        <CodeBlock language="kotlin">{`val model = PromptApiModel(context)`}</CodeBlock>
      </section>

      <section>
        <AnchorLink id="convenience" level="h2">
          Convenience Methods
        </AnchorLink>
        <p>
          All models have built-in convenience methods that create and run the
          corresponding built-in chain.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const model = new LocanaraModel();

// Each method is syntactic sugar for the corresponding built-in chain
const summary = await model.summarize(text);
const category = await model.classify(text, { labels: ["positive", "negative"] });
const translated = await model.translate(text, { to: "es" });
const rewritten = await model.rewrite(text, { tone: "professional" });
const proofread = await model.proofread(text);
const entities = await model.extract(text, { schema });
const reply = await model.chat("Hello!");`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let model = FoundationLanguageModel()

// Each method is syntactic sugar for the corresponding built-in chain
let summary = try await model.summarize(text)
let category = try await model.classify(text, labels: ["positive", "negative"])
let translated = try await model.translate(text, to: .spanish)
let rewritten = try await model.rewrite(text, tone: .professional)
let proofread = try await model.proofread(text)
let entities = try await model.extract(text, schema: schema)
let reply = try await model.chat("Hello!")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val model = PromptApiModel(context)

// Each method is syntactic sugar for the corresponding built-in chain
val summary = model.summarize(text)
val category = model.classify(text, labels = listOf("positive", "negative"))
val translated = model.translate(text, to = Language.SPANISH)
val rewritten = model.rewrite(text, tone = Tone.PROFESSIONAL)
val proofread = model.proofread(text)
val entities = model.extract(text, schema = schema)
val reply = model.chat("Hello!")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="response" level="h2">
          ModelResponse
        </AnchorLink>
        <p>
          The response from a model generation call, including the generated
          text, processing time, and optional token usage information.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface ModelResponse {
  text: string;
  processingTimeMs: number;
  tokenUsage?: TokenUsage;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public struct ModelResponse: Sendable {
    public let text: String
    public let processingTimeMs: Int
    public let tokenUsage: TokenUsage?
}

public struct TokenUsage: Sendable {
    public let promptTokens: Int
    public let completionTokens: Int
    public let totalTokens: Int
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ModelResponse(
    val text: String,
    val processingTimeMs: Int,
    val tokenUsage: TokenUsage?
)

data class TokenUsage(
    val promptTokens: Int,
    val completionTokens: Int,
    val totalTokens: Int
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        For details on each built-in utility, see{" "}
        <Link to="/docs/utils">Built-in Utils</Link>.
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/agent", label: "Agent" }}
        next={{ to: "/docs/utils", label: "Built-in Utils" }}
      />
    </div>
  );
}

export default ModelAPI;
