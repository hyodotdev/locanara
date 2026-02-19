import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";
import PlatformBadge from "../../../components/docs/PlatformBadge";
import PageNavigation from "../../../components/docs/PageNavigation";

function SummarizeAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Summarize API"
        description="SummarizeChain - built-in chain for text summarization using on-device AI."
        path="/docs/utils/summarize"
        keywords="summarize, text summarization, on-device AI, ML Kit GenAI"
      />
      <h1>summarize()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>SummarizeChain</code> | Convenience:{" "}
        <code>model.summarize()</code>
      </p>
      <p>
        Generate concise summaries from text using on-device AI. Supports
        different input types (article, conversation) and output formats (bullet
        points).
      </p>

      <PlatformBadge platforms={["ios", "android", "web"]} />

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Uses Apple Intelligence Foundation Models
          </li>
          <li>
            <strong>Android</strong>: Uses ML Kit GenAI Summarization API
          </li>
          <li>
            <strong>Max input</strong>: 4,000 tokens (auto-truncate available)
          </li>
          <li>
            <strong>Output types</strong>: 1, 2, or 3 bullet point summaries
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="framework-usage" level="h2">
          Framework Usage (Recommended)
        </AnchorLink>
        <p>Use the chain directly or via model convenience methods:</p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Chain — uses default model automatically
let result = try await SummarizeChain(bulletCount: 3).run("Your long text here...")
print(result.summary)

// Pipeline DSL
let result = try await FoundationLanguageModel().pipeline {
    Summarize(bulletCount: 3)
    Translate(to: "ko")
}.run("Your long text here...")

// One-liner convenience
let summary = try await FoundationLanguageModel().summarize("Your long text here...")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = SummarizeChain(bulletCount = 3).run("Your long text here...")
println(result.summary)

// Pipeline (fluent builder)
val model = LocanaraDefaults.model
val result = model.pipeline()
    .summarize(bulletCount = 3)
    .translate(to = "ko")
    .run("Your long text here...")

// One-liner convenience
val summary = model.summarize("Your long text here...")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="signature" level="h2">
          Low-Level API Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func summarize(
    input: String,
    parameters: SummarizeParametersInput?
) async throws -> SummarizeResult

struct SummarizeParametersInput {
    let inputType: SummarizeInputType?    // .article or .conversation
    let outputType: SummarizeOutputType?  // .oneBullet, .twoBullets, .threeBullets
    let language: MLKitLanguage?
    let autoTruncate: Bool?               // Default: true
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun summarize(
    input: String,
    parameters: SummarizeParametersInput? = null
): SummarizeResult

data class SummarizeParametersInput(
    val inputType: SummarizeInputType? = null,    // ARTICLE or CONVERSATION
    val outputType: SummarizeOutputType? = null,  // ONE_BULLET, TWO_BULLETS, THREE_BULLETS
    val language: MLKitLanguage? = null,
    val autoTruncate: Boolean? = null             // Default: true
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function summarize(
  input: string,
  parameters?: SummarizeParametersInput
): Promise<SummarizeResult>

interface SummarizeParametersInput {
  inputType?: 'ARTICLE' | 'CONVERSATION';
  outputType?: 'ONE_BULLET' | 'TWO_BULLETS' | 'THREE_BULLETS';
  language?: MLKitLanguage;
  autoTruncate?: boolean;  // Default: true
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="parameters" level="h2">
          Parameters
        </AnchorLink>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Parameter
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Type
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>inputType</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                enum
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>ARTICLE</code> (default) for articles/documents,{" "}
                <code>CONVERSATION</code> for chat/dialogue
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>outputType</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                enum
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>ONE_BULLET</code> (default), <code>TWO_BULLETS</code>, or{" "}
                <code>THREE_BULLETS</code>
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>language</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                enum
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Language for summarization (ENGLISH, JAPANESE, KOREAN, etc.)
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>autoTruncate</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                boolean
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Auto-truncate input exceeding 4,000 tokens (default: true)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="result" level="h2">
          Result
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`struct SummarizeResult {
    let summary: String        // Summarized text
    let originalLength: Int    // Original text character count
    let summaryLength: Int     // Summary character count
    let confidence: Double?    // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class SummarizeResult(
    val summary: String,        // Summarized text
    val originalLength: Int,    // Original text character count
    val summaryLength: Int,     // Summary character count
    val confidence: Double?     // Confidence score (0.0 - 1.0)
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface SummarizeResult {
  summary: string;        // Summarized text
  originalLength: number; // Original text character count
  summaryLength: number;  // Summary character count
  confidence?: number;    // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Low-Level API Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Initialize SDK
try await LocanaraClient.shared.initialize()

// Basic summarization
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .summarize,
        input: """
        Apple announced significant updates to its AI strategy today.
        The company revealed new on-device AI capabilities that will
        be available across iPhone, iPad, and Mac devices. These features
        focus on privacy-first processing, ensuring user data never
        leaves the device. Key highlights include improved photo analysis,
        smarter text suggestions, and enhanced Siri capabilities.
        """,
        parameters: FeatureParametersInput(
            summarize: SummarizeParametersInput(
                inputType: .article,
                outputType: .twoBullets
            )
        )
    )
)

// Access the result
if case .summarize(let summary) = result.result {
    print(summary.summary)
    // Output:
    // • Apple announced new on-device AI capabilities for iPhone, iPad, and Mac
    // • Features focus on privacy-first processing with improved photos, text, and Siri
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Initialize SDK
val locanara = Locanara.getInstance(context)
locanara.initializeSDK(Platform.ANDROID)

// Basic summarization
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.SUMMARIZE,
        input = """
            Apple announced significant updates to its AI strategy today.
            The company revealed new on-device AI capabilities that will
            be available across iPhone, iPad, and Mac devices. These features
            focus on privacy-first processing, ensuring user data never
            leaves the device. Key highlights include improved photo analysis,
            smarter text suggestions, and enhanced Siri capabilities.
        """.trimIndent(),
        parameters = FeatureParametersInput(
            summarize = SummarizeParametersInput(
                inputType = SummarizeInputType.ARTICLE,
                outputType = SummarizeOutputType.TWO_BULLETS
            )
        )
    )
)

// Access the result
val summary = result.result?.summarize
println(summary?.summary)
// Output:
// • Apple announced new on-device AI capabilities for iPhone, iPad, and Mac
// • Features focus on privacy-first processing with improved photos, text, and Siri`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Initialize SDK
await Locanara.initialize();

// Basic summarization
const result = await Locanara.summarize({
  input: \`
    Apple announced significant updates to its AI strategy today.
    The company revealed new on-device AI capabilities that will
    be available across iPhone, iPad, and Mac devices. These features
    focus on privacy-first processing, ensuring user data never
    leaves the device. Key highlights include improved photo analysis,
    smarter text suggestions, and enhanced Siri capabilities.
  \`,
  parameters: {
    inputType: 'ARTICLE',
    outputType: 'TWO_BULLETS',
  },
});

console.log(result.summary);
// Output:
// • Apple announced new on-device AI capabilities for iPhone, iPad, and Mac
// • Features focus on privacy-first processing with improved photos, text, and Siri`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS</h4>
        <ul>
          <li>
            iOS 26+ uses Apple Intelligence (Foundation Models) automatically
          </li>
          <li>iOS 17+ supports llama.cpp with downloadable GGUF models</li>
          <li>RouterModel auto-selects the best available engine</li>
          <li>Supports English, Japanese, Korean, and other languages</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <ul>
          <li>Requires Android 14+ (API level 34)</li>
          <li>Uses Gemini Nano via ML Kit GenAI SDK</li>
          <li>Model may need to be downloaded before first use</li>
          <li>
            Check availability with <code>getGeminiNanoStatus()</code>
          </li>
        </ul>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#summarize-result">SummarizeResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{
          to: "/docs/utils",
          label: "Built-in Utils",
        }}
        next={{ to: "/docs/utils/classify", label: "classify()" }}
      />
    </div>
  );
}

export default SummarizeAPI;
