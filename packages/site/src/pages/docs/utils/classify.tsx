import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ClassifyAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Classify API"
        description="ClassifyChain - built-in chain for text classification using on-device AI."
        path="/docs/utils/classify"
        keywords="classify, text classification, categorization, on-device AI"
      />
      <h1>classify()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>ClassifyChain</code> | Convenience:{" "}
        <code>model.classify()</code>
      </p>
      <p>
        Categorize text into predefined labels or categories using on-device AI.
        Useful for sentiment analysis, topic detection, content moderation, and
        more.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Available via Apple Intelligence
          </li>
          <li>
            <strong>Android</strong>: Planned (not yet available in ML Kit
            GenAI)
          </li>
          <li>
            <strong>Use case</strong>: Sentiment analysis, topic detection,
            content filtering
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
let result = try await ClassifyChain(
    categories: ["positive", "negative", "neutral"]
).run("I love this product!")
print(result.topClassification.label)

// One-liner convenience
let result = try await FoundationLanguageModel().classify(
    "I love this product!",
    categories: ["positive", "negative", "neutral"]
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = ClassifyChain(
    categories = listOf("positive", "negative", "neutral")
).run("I love this product!")
println(result.topClassification.label)

// One-liner convenience
val result = LocanaraDefaults.model.classify(
    "I love this product!",
    categories = listOf("positive", "negative", "neutral")
)`}</CodeBlock>
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
              <CodeBlock language="swift">{`struct ClassifyResult {
    let classifications: [Classification]  // All classifications with scores
    let topClassification: Classification  // Highest scoring classification
}

struct Classification {
    let label: String      // Category label
    let score: Double      // Confidence score (0.0 - 1.0)
    let metadata: String?  // Additional metadata
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ClassifyResult(
    val classifications: List<Classification>,  // All classifications
    val topClassification: Classification       // Highest scoring
)

data class Classification(
    val label: String,      // Category label
    val score: Double,      // Confidence score (0.0 - 1.0)
    val metadata: String?   // Additional metadata
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface ClassifyResult {
  classifications: Classification[];  // All classifications with scores
  topClassification: Classification;  // Highest scoring classification
}

interface Classification {
  label: string;      // Category label
  score: number;      // Confidence score (0.0 - 1.0)
  metadata?: string;  // Additional metadata
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS (Apple Intelligence)</h4>
        <ul>
          <li>Fully supported via Foundation Models</li>
          <li>Custom categories supported</li>
          <li>Returns confidence scores for all categories</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <div className="alert-card alert-card--warning">
          <p>
            <strong>Planned:</strong> Classification is not yet available in ML
            Kit GenAI SDK. This feature will be added when Google releases the
            API.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#classify-result">ClassifyResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/summarize", label: "summarize()" }}
        next={{ to: "/docs/utils/extract", label: "extract()" }}
      />
    </div>
  );
}

export default ClassifyAPI;
