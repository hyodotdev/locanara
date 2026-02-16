import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function RewriteAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Rewrite API"
        description="RewriteChain - built-in chain for text rewriting using on-device AI."
        path="/docs/utils/rewrite"
        keywords="rewrite, rephrase, text style, on-device AI, ML Kit GenAI"
      />
      <h1>rewrite()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>RewriteChain</code> | Convenience:{" "}
        <code>model.rewrite()</code>
      </p>
      <p>
        Rephrase text with different styles or tones using on-device AI.
        Supports various output styles including professional, friendly,
        elaborate, shorten, and emojify.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>iOS</strong>: Uses Apple Intelligence Foundation Models
          </li>
          <li>
            <strong>Android</strong>: Uses ML Kit GenAI Rewriting API
          </li>
          <li>
            <strong>Styles</strong>: Professional, Friendly, Elaborate, Shorten,
            Emojify, Rephrase
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
let result = try await RewriteChain(style: .professional).run(
    "Hey! Can we meet up tomorrow?"
)
print(result.rewrittenText)

// One-liner convenience
let result = try await FoundationLanguageModel().rewrite(
    "Hey! Can we meet up tomorrow?",
    style: .professional
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(
    "Hey! Can we meet up tomorrow?"
)
println(result.rewrittenText)

// One-liner convenience
val result = LocanaraDefaults.model.rewrite(
    "Hey! Can we meet up tomorrow?",
    style = RewriteOutputType.PROFESSIONAL
)`}</CodeBlock>
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
              <CodeBlock language="swift">{`func rewrite(
    input: String,
    parameters: RewriteParametersInput
) async throws -> RewriteResult

struct RewriteParametersInput {
    let outputType: RewriteOutputType  // Required: style to apply
    let language: MLKitLanguage?
}

enum RewriteOutputType {
    case elaborate     // Make text more detailed
    case emojify       // Add emojis
    case shorten       // Make text more concise
    case friendly      // Casual, warm tone
    case professional  // Formal, business tone
    case rephrase      // Different wording, same meaning
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun rewrite(
    input: String,
    parameters: RewriteParametersInput
): RewriteResult

data class RewriteParametersInput(
    val outputType: RewriteOutputType,  // Required: style to apply
    val language: MLKitLanguage? = null
)

enum class RewriteOutputType {
    ELABORATE,     // Make text more detailed
    EMOJIFY,       // Add emojis
    SHORTEN,       // Make text more concise
    FRIENDLY,      // Casual, warm tone
    PROFESSIONAL,  // Formal, business tone
    REPHRASE       // Different wording, same meaning
}`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function rewrite(
  input: string,
  parameters: RewriteParametersInput
): Promise<RewriteResult>

interface RewriteParametersInput {
  outputType: RewriteOutputType;  // Required: style to apply
  language?: MLKitLanguage;
}

type RewriteOutputType =
  | 'ELABORATE'     // Make text more detailed
  | 'EMOJIFY'       // Add emojis
  | 'SHORTEN'       // Make text more concise
  | 'FRIENDLY'      // Casual, warm tone
  | 'PROFESSIONAL'  // Formal, business tone
  | 'REPHRASE';     // Different wording, same meaning`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<RewriteResult> rewrite(
  String input, {
  required RewriteParametersInput parameters,
});

class RewriteParametersInput {
  final RewriteOutputType outputType;  // Required: style to apply
  final MLKitLanguage? language;
}

enum RewriteOutputType {
  elaborate,     // Make text more detailed
  emojify,       // Add emojis
  shorten,       // Make text more concise
  friendly,      // Casual, warm tone
  professional,  // Formal, business tone
  rephrase,      // Different wording, same meaning
}`}</CodeBlock>
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
              <CodeBlock language="swift">{`struct RewriteResult {
    let rewrittenText: String       // Primary rewritten text
    let style: RewriteOutputType?   // Style that was applied
    let alternatives: [String]?     // Alternative suggestions
    let confidence: Double?         // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class RewriteResult(
    val rewrittenText: String,       // Primary rewritten text
    val style: RewriteOutputType?,   // Style that was applied
    val alternatives: List<String>?, // Alternative suggestions
    val confidence: Double?          // Confidence score (0.0 - 1.0)
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface RewriteResult {
  rewrittenText: string;       // Primary rewritten text
  style?: RewriteOutputType;   // Style that was applied
  alternatives?: string[];     // Alternative suggestions
  confidence?: number;         // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`class RewriteResult {
  final String rewrittenText;       // Primary rewritten text
  final RewriteOutputType? style;   // Style that was applied
  final List<String>? alternatives; // Alternative suggestions
  final double? confidence;         // Confidence score (0.0 - 1.0)
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

// Make text more professional
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .rewrite,
        input: "Hey! Can we meet up tomorrow to talk about the project?",
        parameters: FeatureParametersInput(
            rewrite: RewriteParametersInput(
                outputType: .professional
            )
        )
    )
)

if case .rewrite(let rewrite) = result.result {
    print(rewrite.rewrittenText)
    // Output: "I would like to schedule a meeting tomorrow to discuss
    //          the project details. Please let me know your availability."
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Make text more professional
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.REWRITE,
        input = "Hey! Can we meet up tomorrow to talk about the project?",
        parameters = FeatureParametersInput(
            rewrite = RewriteParametersInput(
                outputType = RewriteOutputType.PROFESSIONAL
            )
        )
    )
)

val rewrite = result.result?.rewrite
println(rewrite?.rewrittenText)
// Output: "I would like to schedule a meeting tomorrow to discuss
//          the project details. Please let me know your availability."`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Make text more professional
const result = await Locanara.rewrite({
  input: "Hey! Can we meet up tomorrow to talk about the project?",
  parameters: {
    outputType: 'PROFESSIONAL',
  },
});

console.log(result.rewrittenText);
// Output: "I would like to schedule a meeting tomorrow to discuss
//          the project details. Please let me know your availability."`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Make text more professional
final result = await Locanara.rewrite(
  input: "Hey! Can we meet up tomorrow to talk about the project?",
  parameters: RewriteParametersInput(
    outputType: RewriteOutputType.professional,
  ),
);

print(result.rewrittenText);
// Output: "I would like to schedule a meeting tomorrow to discuss
//          the project details. Please let me know your availability."`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="style-examples" level="h2">
          Style Examples
        </AnchorLink>
        <p>Original text: "The meeting is at 3pm tomorrow"</p>

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
                Style
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Output
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
                <code>PROFESSIONAL</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                "Please be advised that the meeting has been scheduled for 3:00
                PM tomorrow."
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>FRIENDLY</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                "Hey! Just a heads up - we're meeting at 3pm tomorrow!"
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>ELABORATE</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                "I wanted to remind you that our scheduled meeting will take
                place tomorrow afternoon at 3:00 PM. Please ensure you have all
                necessary materials prepared."
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>SHORTEN</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                "Meeting: 3pm tomorrow"
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>EMOJIFY</code>
              </td>
              <td
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                "The meeting is at 3pm tomorrow! See you there!"
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="platform-notes" level="h2">
          Platform Notes
        </AnchorLink>

        <h4>iOS (Apple Intelligence)</h4>
        <ul>
          <li>All styles supported via Foundation Models</li>
          <li>May return multiple alternative suggestions</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <ul>
          <li>Uses ML Kit GenAI Rewriting API</li>
          <li>Requires Android 14+ (API level 34)</li>
          <li>Model download may be required</li>
        </ul>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#rewrite-result">RewriteResult</Link>,{" "}
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/translate", label: "translate()" }}
        next={{ to: "/docs/utils/proofread", label: "proofread()" }}
      />
    </div>
  );
}

export default RewriteAPI;
