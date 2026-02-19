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
