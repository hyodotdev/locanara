import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function ClassifyAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Classify API"
        description="Locanara classify API - Categorize text into predefined labels using on-device AI."
        path="/docs/apis/classify"
        keywords="classify, text classification, categorization, on-device AI"
      />
      <h1>classify()</h1>
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
        <AnchorLink id="signature" level="h2">
          Signature
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`func classify(
    input: String,
    parameters: ClassifyParametersInput?
) async throws -> ClassifyResult

struct ClassifyParametersInput {
    let categories: [String]?  // Predefined categories to classify into
    let maxResults: Int?       // Maximum number of classifications to return
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun classify(
    input: String,
    parameters: ClassifyParametersInput? = null
): ClassifyResult

data class ClassifyParametersInput(
    val categories: List<String>? = null,  // Predefined categories
    val maxResults: Int? = null            // Maximum results to return
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function classify(
  input: string,
  parameters?: ClassifyParametersInput
): Promise<ClassifyResult>

interface ClassifyParametersInput {
  categories?: string[];  // Predefined categories to classify into
  maxResults?: number;    // Maximum number of classifications to return
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<ClassifyResult> classify(
  String input, {
  ClassifyParametersInput? parameters,
});

class ClassifyParametersInput {
  final List<String>? categories;  // Predefined categories
  final int? maxResults;           // Maximum results to return
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
            dart: (
              <CodeBlock language="dart">{`class ClassifyResult {
  final List<Classification> classifications;  // All classifications
  final Classification topClassification;      // Highest scoring
}

class Classification {
  final String label;      // Category label
  final double score;      // Confidence score (0.0 - 1.0)
  final String? metadata;  // Additional metadata
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

// Sentiment analysis
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .classify,
        input: "I absolutely love this product! Best purchase ever!",
        parameters: FeatureParametersInput(
            classify: ClassifyParametersInput(
                categories: ["positive", "negative", "neutral"],
                maxResults: 3
            )
        )
    )
)

if case .classify(let classification) = result.result {
    print("Top: \\(classification.topClassification.label)")
    // Output: "Top: positive"

    for item in classification.classifications {
        print("\\(item.label): \\(item.score)")
    }
    // Output:
    // positive: 0.95
    // neutral: 0.04
    // negative: 0.01
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Sentiment analysis
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.CLASSIFY,
        input = "I absolutely love this product! Best purchase ever!",
        parameters = FeatureParametersInput(
            classify = ClassifyParametersInput(
                categories = listOf("positive", "negative", "neutral"),
                maxResults = 3
            )
        )
    )
)

val classification = result.result?.classify
println("Top: \${classification?.topClassification?.label}")
// Output: "Top: positive"

classification?.classifications?.forEach { item ->
    println("\${item.label}: \${item.score}")
}
// Output:
// positive: 0.95
// neutral: 0.04
// negative: 0.01`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Sentiment analysis
const result = await Locanara.classify({
  input: "I absolutely love this product! Best purchase ever!",
  parameters: {
    categories: ['positive', 'negative', 'neutral'],
    maxResults: 3,
  },
});

console.log(\`Top: \${result.topClassification.label}\`);
// Output: "Top: positive"

result.classifications.forEach(item => {
  console.log(\`\${item.label}: \${item.score}\`);
});
// Output:
// positive: 0.95
// neutral: 0.04
// negative: 0.01`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Sentiment analysis
final result = await Locanara.classify(
  input: "I absolutely love this product! Best purchase ever!",
  parameters: ClassifyParametersInput(
    categories: ['positive', 'negative', 'neutral'],
    maxResults: 3,
  ),
);

print('Top: \${result.topClassification.label}');
// Output: "Top: positive"

for (final item in result.classifications) {
  print('\${item.label}: \${item.score}');
}
// Output:
// positive: 0.95
// neutral: 0.04
// negative: 0.01`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="topic-classification" level="h2">
          Topic Classification Example
        </AnchorLink>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Topic classification
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .classify,
        input: "The latest iPhone features a new A18 chip with improved AI capabilities.",
        parameters: FeatureParametersInput(
            classify: ClassifyParametersInput(
                categories: ["technology", "sports", "politics", "entertainment", "business"]
            )
        )
    )
)

// Output: technology (0.92)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Topic classification
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.CLASSIFY,
        input = "The latest iPhone features a new A18 chip with improved AI capabilities.",
        parameters = FeatureParametersInput(
            classify = ClassifyParametersInput(
                categories = listOf("technology", "sports", "politics", "entertainment", "business")
            )
        )
    )
)

// Output: technology (0.92)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Topic classification
const result = await Locanara.classify({
  input: "The latest iPhone features a new A18 chip with improved AI capabilities.",
  parameters: {
    categories: ['technology', 'sports', 'politics', 'entertainment', 'business'],
  },
});

// Output: technology (0.92)`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`// Topic classification
final result = await Locanara.classify(
  input: "The latest iPhone features a new A18 chip with improved AI capabilities.",
  parameters: ClassifyParametersInput(
    categories: ['technology', 'sports', 'politics', 'entertainment', 'business'],
  ),
);

// Output: technology (0.92)`}</CodeBlock>
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
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/summarize", label: "summarize()" }}
        next={{ to: "/docs/apis/extract", label: "extract()" }}
      />
    </div>
  );
}

export default ClassifyAPI;
