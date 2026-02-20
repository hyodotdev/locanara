import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function TranslateAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Translate API"
        description="TranslateChain - built-in chain for language translation using on-device AI."
        path="/docs/utils/translate"
        keywords="translate, translation, language, on-device AI"
      />
      <h1>translate()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>TranslateChain</code> | Convenience:{" "}
        <code>model.translate()</code>
      </p>
      <p>
        Translate text between languages using on-device AI. Supports automatic
        source language detection.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Uses Apple Intelligence Foundation Models
          </li>
          <li>
            <strong>Android</strong>: Planned (not yet available in ML Kit
            GenAI)
          </li>
          <li>
            <strong>Auto-detect</strong>: Source language can be auto-detected
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
let result = try await TranslateChain(targetLanguage: "ko").run("Hello, how are you?")
print(result.translatedText)

// Pipeline: Proofread then Translate
let result = try await FoundationLanguageModel().pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Helo, how r you?")

// One-liner convenience
let translated = try await FoundationLanguageModel().translate("Hello", to: "ko")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = TranslateChain(targetLanguage = "ko").run("Hello, how are you?")
println(result.translatedText)

// Pipeline: Proofread then Translate
val model = LocanaraDefaults.model
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Helo, how r you?")

// One-liner convenience
val translated = model.translate("Hello", to = "ko")`}</CodeBlock>
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
              <CodeBlock language="swift">{`struct TranslateResult {
    let translatedText: String   // Translated text
    let sourceLanguage: String   // Detected or specified source language
    let targetLanguage: String   // Target language
    let confidence: Double?      // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class TranslateResult(
    val translatedText: String,   // Translated text
    val sourceLanguage: String,   // Detected or specified source language
    val targetLanguage: String,   // Target language
    val confidence: Double?       // Confidence score (0.0 - 1.0)
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface TranslateResult {
  translatedText: string;   // Translated text
  sourceLanguage: string;   // Detected or specified source language
  targetLanguage: string;   // Target language
  confidence?: number;      // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="supported-languages" level="h2">
          Supported Languages
        </AnchorLink>
        <p>
          Any valid{" "}
          <a
            href="https://www.iana.org/assignments/language-subtag-registry"
            target="_blank"
            rel="noopener noreferrer"
          >
            BCP-47 language code
          </a>{" "}
          is supported. Common examples:
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Code
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Language
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["en", "English"],
              ["ko", "Korean"],
              ["ja", "Japanese"],
              ["zh", "Chinese"],
              ["fr", "French"],
              ["de", "German"],
              ["es", "Spanish"],
              ["it", "Italian"],
              ["pt", "Portuguese"],
              ["ru", "Russian"],
              ["ar", "Arabic"],
              ["hi", "Hindi"],
            ].map(([code, name]) => (
              <tr key={code}>
                <td
                  style={{
                    padding: "0.5rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <code>{code}</code>
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS (Apple Intelligence)</h4>
        <ul>
          <li>Fully supported via Foundation Models</li>
          <li>Supports auto-detection of source language</li>
          <li>Wide language support</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <div className="alert-card alert-card--warning">
          <p>
            <strong>Planned:</strong> Translation is not yet available in ML Kit
            GenAI SDK. This feature will be added when Google releases the API.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#translate-result">TranslateResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/chat", label: "chat()" }}
        next={{ to: "/docs/utils/rewrite", label: "rewrite()" }}
      />
    </div>
  );
}

export default TranslateAPI;
