import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function ProofreadAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Proofread API"
        description="Locanara proofread API - Check and correct grammar, spelling, and style using on-device AI."
        path="/docs/apis/proofread"
        keywords="proofread, grammar check, spelling, on-device AI, ML Kit GenAI"
      />
      <h1>proofread()</h1>
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
        <AnchorLink id="signature" level="h2">
          Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func proofread(
    input: String,
    parameters: ProofreadParametersInput?
) async throws -> ProofreadResult

struct ProofreadParametersInput {
    let inputType: ProofreadInputType?  // .keyboard (default) or .voice
    let language: MLKitLanguage?
}

enum ProofreadInputType {
    case keyboard  // Text typed on keyboard
    case voice     // Text from speech-to-text
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun proofread(
    input: String,
    parameters: ProofreadParametersInput? = null
): ProofreadResult

data class ProofreadParametersInput(
    val inputType: ProofreadInputType? = null,  // KEYBOARD or VOICE
    val language: MLKitLanguage? = null
)

enum class ProofreadInputType {
    KEYBOARD,  // Text typed on keyboard
    VOICE      // Text from speech-to-text
}`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function proofread(
  input: string,
  parameters?: ProofreadParametersInput
): Promise<ProofreadResult>

interface ProofreadParametersInput {
  inputType?: 'KEYBOARD' | 'VOICE';
  language?: MLKitLanguage;
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<ProofreadResult> proofread(
  String input, {
  ProofreadParametersInput? parameters,
});

class ProofreadParametersInput {
  final ProofreadInputType? inputType;  // keyboard or voice
  final MLKitLanguage? language;
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
            dart: (
              <CodeBlock language="dart">{`class ProofreadResult {
  final String correctedText;              // Fully corrected text
  final List<ProofreadCorrection> corrections; // List of corrections
  final bool hasCorrections;               // Whether any corrections were made
}

class ProofreadCorrection {
  final String original;     // Original text segment
  final String corrected;    // Corrected text segment
  final String? type;        // Type: "grammar", "spelling", "punctuation"
  final double? confidence;  // Confidence score (0.0 - 1.0)
  final int? startPos;       // Start position in original
  final int? endPos;         // End position in original
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

// Proofread keyboard input
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .proofread,
        input: "Their going to the store tommorow to by some grocerys.",
        parameters: FeatureParametersInput(
            proofread: ProofreadParametersInput(
                inputType: .keyboard
            )
        )
    )
)

if case .proofread(let proofread) = result.result {
    print(proofread.correctedText)
    // Output: "They're going to the store tomorrow to buy some groceries."

    for correction in proofread.corrections {
        print("\\(correction.original) -> \\(correction.corrected) (\\(correction.type ?? ""))")
    }
    // Output:
    // Their -> They're (grammar)
    // tommorow -> tomorrow (spelling)
    // by -> buy (grammar)
    // grocerys -> groceries (spelling)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Proofread keyboard input
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.PROOFREAD,
        input = "Their going to the store tommorow to by some grocerys.",
        parameters = FeatureParametersInput(
            proofread = ProofreadParametersInput(
                inputType = ProofreadInputType.KEYBOARD
            )
        )
    )
)

val proofread = result.result?.proofread
println(proofread?.correctedText)
// Output: "They're going to the store tomorrow to buy some groceries."

proofread?.corrections?.forEach { correction ->
    println("\${correction.original} -> \${correction.corrected} (\${correction.type})")
}
// Output:
// Their -> They're (grammar)
// tommorow -> tomorrow (spelling)
// by -> buy (grammar)
// grocerys -> groceries (spelling)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Proofread keyboard input
const result = await Locanara.proofread({
  input: "Their going to the store tommorow to by some grocerys.",
  parameters: {
    inputType: 'KEYBOARD',
  },
});

console.log(result.correctedText);
// Output: "They're going to the store tomorrow to buy some groceries."

result.corrections.forEach(correction => {
  console.log(\`\${correction.original} -> \${correction.corrected} (\${correction.type})\`);
});
// Output:
// Their -> They're (grammar)
// tommorow -> tomorrow (spelling)
// by -> buy (grammar)
// grocerys -> groceries (spelling)`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Proofread keyboard input
final result = await Locanara.proofread(
  input: "Their going to the store tommorow to by some grocerys.",
  parameters: ProofreadParametersInput(
    inputType: ProofreadInputType.keyboard,
  ),
);

print(result.correctedText);
// Output: "They're going to the store tomorrow to buy some groceries."

for (final correction in result.corrections) {
  print('\${correction.original} -> \${correction.corrected} (\${correction.type})');
}
// Output:
// Their -> They're (grammar)
// tommorow -> tomorrow (spelling)
// by -> buy (grammar)
// grocerys -> groceries (spelling)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="voice-input" level="h2">
          Voice Input Example
        </AnchorLink>
        <p>
          Use <code>VOICE</code> input type for text from speech recognition,
          which may have different error patterns:
        </p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Proofread voice transcription
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .proofread,
        input: "i need to go to the meeting at too oclock",
        parameters: FeatureParametersInput(
            proofread: ProofreadParametersInput(
                inputType: .voice  // Optimized for speech-to-text errors
            )
        )
    )
)

// Output: "I need to go to the meeting at two o'clock."`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Proofread voice transcription
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.PROOFREAD,
        input = "i need to go to the meeting at too oclock",
        parameters = FeatureParametersInput(
            proofread = ProofreadParametersInput(
                inputType = ProofreadInputType.VOICE  // Optimized for speech-to-text
            )
        )
    )
)

// Output: "I need to go to the meeting at two o'clock."`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Proofread voice transcription
const result = await Locanara.proofread({
  input: "i need to go to the meeting at too oclock",
  parameters: {
    inputType: 'VOICE',  // Optimized for speech-to-text errors
  },
});

// Output: "I need to go to the meeting at two o'clock."`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`// Proofread voice transcription
final result = await Locanara.proofread(
  input: "i need to go to the meeting at too oclock",
  parameters: ProofreadParametersInput(
    inputType: ProofreadInputType.voice,  // Optimized for speech-to-text
  ),
);

// Output: "I need to go to the meeting at two o'clock."`}</CodeBlock>
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
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/rewrite", label: "rewrite()" }}
        next={{ to: "/docs/apis/describe-image", label: "describeImage()" }}
      />
    </div>
  );
}

export default ProofreadAPI;
