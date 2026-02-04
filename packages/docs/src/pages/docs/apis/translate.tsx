import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function TranslateAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Translate API"
        description="Locanara translate API - Translate text between languages using on-device AI."
        path="/docs/apis/translate"
        keywords="translate, translation, language, on-device AI"
      />
      <h1>translate()</h1>
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
        <AnchorLink id="signature" level="h2">
          Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func translate(
    input: String,
    parameters: TranslateParametersInput
) async throws -> TranslateResult

struct TranslateParametersInput {
    let sourceLanguage: String?  // Auto-detect if nil
    let targetLanguage: String   // Required: target language code
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun translate(
    input: String,
    parameters: TranslateParametersInput
): TranslateResult

data class TranslateParametersInput(
    val sourceLanguage: String? = null,  // Auto-detect if null
    val targetLanguage: String           // Required: target language code
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function translate(
  input: string,
  parameters: TranslateParametersInput
): Promise<TranslateResult>

interface TranslateParametersInput {
  sourceLanguage?: string;  // Auto-detect if undefined
  targetLanguage: string;   // Required: target language code
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<TranslateResult> translate(
  String input, {
  required TranslateParametersInput parameters,
});

class TranslateParametersInput {
  final String? sourceLanguage;  // Auto-detect if null
  final String targetLanguage;   // Required: target language code
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
            dart: (
              <CodeBlock language="dart">{`class TranslateResult {
  final String translatedText;   // Translated text
  final String sourceLanguage;   // Detected or specified source language
  final String targetLanguage;   // Target language
  final double? confidence;      // Confidence score (0.0 - 1.0)
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Translate English to Korean
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .translate,
        input: "Hello, how are you today?",
        parameters: FeatureParametersInput(
            translate: TranslateParametersInput(
                sourceLanguage: "en",
                targetLanguage: "ko"
            )
        )
    )
)

if case .translate(let translation) = result.result {
    print(translation.translatedText)
    // Output: "안녕하세요, 오늘 어떻게 지내세요?"
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Translate English to Korean
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.TRANSLATE,
        input = "Hello, how are you today?",
        parameters = FeatureParametersInput(
            translate = TranslateParametersInput(
                sourceLanguage = "en",
                targetLanguage = "ko"
            )
        )
    )
)

val translation = result.result?.translate
println(translation?.translatedText)
// Output: "안녕하세요, 오늘 어떻게 지내세요?"`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Translate English to Korean
const result = await Locanara.translate({
  input: "Hello, how are you today?",
  parameters: {
    sourceLanguage: 'en',
    targetLanguage: 'ko',
  },
});

console.log(result.translatedText);
// Output: "안녕하세요, 오늘 어떻게 지내세요?"`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Translate English to Korean
final result = await Locanara.translate(
  input: "Hello, how are you today?",
  parameters: TranslateParametersInput(
    sourceLanguage: 'en',
    targetLanguage: 'ko',
  ),
);

print(result.translatedText);
// Output: "안녕하세요, 오늘 어떻게 지내세요?"`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="auto-detect" level="h2">
          Auto-detect Source Language
        </AnchorLink>
        <p>
          Omit <code>sourceLanguage</code> to automatically detect the input
          language:
        </p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Auto-detect source language
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .translate,
        input: "Bonjour, comment allez-vous?",
        parameters: FeatureParametersInput(
            translate: TranslateParametersInput(
                targetLanguage: "en"  // sourceLanguage not specified
            )
        )
    )
)

if case .translate(let translation) = result.result {
    print("Detected: \\(translation.sourceLanguage)")  // "fr"
    print(translation.translatedText)
    // Output: "Hello, how are you?"
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Auto-detect source language
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.TRANSLATE,
        input = "Bonjour, comment allez-vous?",
        parameters = FeatureParametersInput(
            translate = TranslateParametersInput(
                targetLanguage = "en"  // sourceLanguage not specified
            )
        )
    )
)

val translation = result.result?.translate
println("Detected: \${translation?.sourceLanguage}")  // "fr"
println(translation?.translatedText)
// Output: "Hello, how are you?"`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Auto-detect source language
const result = await Locanara.translate({
  input: "Bonjour, comment allez-vous?",
  parameters: {
    targetLanguage: 'en',  // sourceLanguage not specified
  },
});

console.log(\`Detected: \${result.sourceLanguage}\`);  // "fr"
console.log(result.translatedText);
// Output: "Hello, how are you?"`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`// Auto-detect source language
final result = await Locanara.translate(
  input: "Bonjour, comment allez-vous?",
  parameters: TranslateParametersInput(
    targetLanguage: 'en',  // sourceLanguage not specified
  ),
);

print('Detected: \${result.sourceLanguage}');  // "fr"
print(result.translatedText);
// Output: "Hello, how are you?"`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="supported-languages" level="h2">
          Supported Languages
        </AnchorLink>
        <p>Common language codes:</p>
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
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>en</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                English
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>ko</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Korean
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>ja</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Japanese
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>zh</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Chinese
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>fr</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                French
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>de</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                German
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>es</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Spanish
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>it</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Italian
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
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/chat", label: "chat()" }}
        next={{ to: "/docs/apis/rewrite", label: "rewrite()" }}
      />
    </div>
  );
}

export default TranslateAPI;
