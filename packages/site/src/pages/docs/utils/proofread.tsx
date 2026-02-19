import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ProofreadAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Proofread API"
        description="ProofreadChain - built-in chain for grammar and spelling correction using on-device AI."
        path="/docs/utils/proofread"
        keywords="proofread, grammar check, spelling, on-device AI, ML Kit GenAI"
      />
      <h1>proofread()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>ProofreadChain</code> | Convenience:{" "}
        <code>model.proofread()</code>
      </p>
      <p>
        Check and correct grammar, spelling, and style errors using on-device
        AI. Supports different input types for keyboard or voice input.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Uses Apple Intelligence Foundation Models
          </li>
          <li>
            <strong>Android</strong>: Uses ML Kit GenAI Proofreading API
          </li>
          <li>
            <strong>Input types</strong>: Keyboard (default) or Voice
          </li>
          <li>
            <strong>Returns</strong>: Corrected text with list of changes
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
let result = try await ProofreadChain().run("Ther are many erors in this sentance.")
print(result.correctedText)

// Pipeline: Proofread then Translate
let result = try await FoundationLanguageModel().pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ther are many erors in this sentance.")

// One-liner convenience
let proofread = try await FoundationLanguageModel().proofread("Ther are many erors in this sentance.")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = ProofreadChain().run("Ther are many erors in this sentance.")
println(result.correctedText)

// Pipeline: Proofread then Translate
val model = LocanaraDefaults.model
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ther are many erors in this sentance.")

// One-liner convenience
val proofread = model.proofread("Ther are many erors in this sentance.")`}</CodeBlock>
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
              <CodeBlock language="swift">{`struct ProofreadResult {
    let correctedText: String              // Fully corrected text
    let corrections: [ProofreadCorrection] // List of corrections made
    let hasCorrections: Bool               // Whether any corrections were made
}

struct ProofreadCorrection {
    let original: String     // Original text segment
    let corrected: String    // Corrected text segment
    let type: String?        // Type: "grammar", "spelling", "punctuation"
    let confidence: Double?  // Confidence score (0.0 - 1.0)
    let startPos: Int?       // Start position in original
    let endPos: Int?         // End position in original
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ProofreadResult(
    val correctedText: String,              // Fully corrected text
    val corrections: List<ProofreadCorrection>, // List of corrections
    val hasCorrections: Boolean             // Whether any corrections were made
)

data class ProofreadCorrection(
    val original: String,     // Original text segment
    val corrected: String,    // Corrected text segment
    val type: String?,        // Type: "grammar", "spelling", "punctuation"
    val confidence: Double?,  // Confidence score (0.0 - 1.0)
    val startPos: Int?,       // Start position in original
    val endPos: Int?          // End position in original
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface ProofreadResult {
  correctedText: string;              // Fully corrected text
  corrections: ProofreadCorrection[]; // List of corrections made
  hasCorrections: boolean;            // Whether any corrections were made
}

interface ProofreadCorrection {
  original: string;     // Original text segment
  corrected: string;    // Corrected text segment
  type?: string;        // Type: "grammar", "spelling", "punctuation"
  confidence?: number;  // Confidence score (0.0 - 1.0)
  startPos?: number;    // Start position in original
  endPos?: number;      // End position in original
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
          <li>Supports both keyboard and voice input types</li>
          <li>Returns detailed correction information</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <ul>
          <li>Uses ML Kit GenAI Proofreading API</li>
          <li>Requires Android 14+ (API level 34)</li>
          <li>Optimized for both keyboard and voice input</li>
        </ul>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#proofread-result">ProofreadResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/rewrite", label: "rewrite()" }}
        next={{ to: "/docs/utils/ios", label: "iOS APIs" }}
      />
    </div>
  );
}

export default ProofreadAPI;
