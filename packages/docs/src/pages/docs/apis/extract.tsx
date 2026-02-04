import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function ExtractAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Extract API"
        description="Locanara extract API - Extract entities and key-value pairs from text using on-device AI."
        path="/docs/apis/extract"
        keywords="extract, entity extraction, NER, key-value, on-device AI"
      />
      <h1>extract()</h1>
      <p>
        Extract entities (people, places, dates, etc.) and key-value pairs from
        text using on-device AI.
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
            <strong>Entity types</strong>: Person, Location, Date, Organization,
            etc.
          </li>
          <li>
            <strong>Key-value</strong>: Extract structured data from text
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
              <CodeBlock language="swift">{`func extract(
    input: String,
    parameters: ExtractParametersInput?
) async throws -> ExtractResult

struct ExtractParametersInput {
    let entityTypes: [String]?    // Types to extract (nil = all)
    let extractKeyValues: Bool?   // Whether to extract key-value pairs
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`suspend fun extract(
    input: String,
    parameters: ExtractParametersInput? = null
): ExtractResult

data class ExtractParametersInput(
    val entityTypes: List<String>? = null,  // Types to extract (null = all)
    val extractKeyValues: Boolean? = null   // Whether to extract key-value pairs
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`async function extract(
  input: string,
  parameters?: ExtractParametersInput
): Promise<ExtractResult>

interface ExtractParametersInput {
  entityTypes?: string[];    // Types to extract (undefined = all)
  extractKeyValues?: boolean;  // Whether to extract key-value pairs
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`Future<ExtractResult> extract(
  String input, {
  ExtractParametersInput? parameters,
});

class ExtractParametersInput {
  final List<String>? entityTypes;    // Types to extract (null = all)
  final bool? extractKeyValues;       // Whether to extract key-value pairs
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
              <CodeBlock language="swift">{`struct ExtractResult {
    let entities: [Entity]           // Extracted entities
    let keyValuePairs: [KeyValuePair]?  // Extracted key-value pairs
}

struct Entity {
    let type: String       // "person", "location", "date", etc.
    let value: String      // The extracted value
    let confidence: Double // Confidence score (0.0 - 1.0)
    let startPos: Int?     // Start position in original text
    let endPos: Int?       // End position in original text
}

struct KeyValuePair {
    let key: String
    let value: String
    let confidence: Double?
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ExtractResult(
    val entities: List<Entity>,           // Extracted entities
    val keyValuePairs: List<KeyValuePair>?  // Extracted key-value pairs
)

data class Entity(
    val type: String,       // "person", "location", "date", etc.
    val value: String,      // The extracted value
    val confidence: Double, // Confidence score (0.0 - 1.0)
    val startPos: Int?,     // Start position in original text
    val endPos: Int?        // End position in original text
)

data class KeyValuePair(
    val key: String,
    val value: String,
    val confidence: Double?
)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`interface ExtractResult {
  entities: Entity[];           // Extracted entities
  keyValuePairs?: KeyValuePair[];  // Extracted key-value pairs
}

interface Entity {
  type: string;       // "person", "location", "date", etc.
  value: string;      // The extracted value
  confidence: number; // Confidence score (0.0 - 1.0)
  startPos?: number;  // Start position in original text
  endPos?: number;    // End position in original text
}

interface KeyValuePair {
  key: string;
  value: string;
  confidence?: number;
}`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`class ExtractResult {
  final List<Entity> entities;           // Extracted entities
  final List<KeyValuePair>? keyValuePairs;  // Extracted key-value pairs
}

class Entity {
  final String type;       // "person", "location", "date", etc.
  final String value;      // The extracted value
  final double confidence; // Confidence score (0.0 - 1.0)
  final int? startPos;     // Start position in original text
  final int? endPos;       // End position in original text
}

class KeyValuePair {
  final String key;
  final String value;
  final double? confidence;
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

// Extract all entities
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .extract,
        input: "John Smith will meet Sarah Johnson at Apple Park in Cupertino on December 15th, 2024."
    )
)

if case .extract(let extraction) = result.result {
    for entity in extraction.entities {
        print("\\(entity.type): \\(entity.value) (\\(entity.confidence))")
    }
    // Output:
    // person: John Smith (0.95)
    // person: Sarah Johnson (0.94)
    // organization: Apple (0.92)
    // location: Cupertino (0.96)
    // date: December 15th, 2024 (0.98)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.Locanara

// Extract all entities
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.EXTRACT,
        input = "John Smith will meet Sarah Johnson at Apple Park in Cupertino on December 15th, 2024."
    )
)

val extraction = result.result?.extract
extraction?.entities?.forEach { entity ->
    println("\${entity.type}: \${entity.value} (\${entity.confidence})")
}
// Output:
// person: John Smith (0.95)
// person: Sarah Johnson (0.94)
// organization: Apple (0.92)
// location: Cupertino (0.96)
// date: December 15th, 2024 (0.98)`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`import { Locanara } from 'react-native-locanara';

// Extract all entities
const result = await Locanara.extract({
  input: "John Smith will meet Sarah Johnson at Apple Park in Cupertino on December 15th, 2024.",
});

result.entities.forEach(entity => {
  console.log(\`\${entity.type}: \${entity.value} (\${entity.confidence})\`);
});
// Output:
// person: John Smith (0.95)
// person: Sarah Johnson (0.94)
// organization: Apple (0.92)
// location: Cupertino (0.96)
// date: December 15th, 2024 (0.98)`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`import 'package:flutter_locanara/flutter_locanara.dart';

// Extract all entities
final result = await Locanara.extract(
  input: "John Smith will meet Sarah Johnson at Apple Park in Cupertino on December 15th, 2024.",
);

for (final entity in result.entities) {
  print('\${entity.type}: \${entity.value} (\${entity.confidence})');
}
// Output:
// person: John Smith (0.95)
// person: Sarah Johnson (0.94)
// organization: Apple (0.92)
// location: Cupertino (0.96)
// date: December 15th, 2024 (0.98)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="specific-types" level="h2">
          Extract Specific Types
        </AnchorLink>
        <p>Filter extraction to specific entity types:</p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Extract only person and date entities
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .extract,
        input: "John Smith will meet Sarah Johnson at Apple Park on December 15th.",
        parameters: FeatureParametersInput(
            extract: ExtractParametersInput(
                entityTypes: ["person", "date"]
            )
        )
    )
)

// Output:
// person: John Smith
// person: Sarah Johnson
// date: December 15th`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Extract only person and date entities
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.EXTRACT,
        input = "John Smith will meet Sarah Johnson at Apple Park on December 15th.",
        parameters = FeatureParametersInput(
            extract = ExtractParametersInput(
                entityTypes = listOf("person", "date")
            )
        )
    )
)

// Output:
// person: John Smith
// person: Sarah Johnson
// date: December 15th`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Extract only person and date entities
const result = await Locanara.extract({
  input: "John Smith will meet Sarah Johnson at Apple Park on December 15th.",
  parameters: {
    entityTypes: ['person', 'date'],
  },
});

// Output:
// person: John Smith
// person: Sarah Johnson
// date: December 15th`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`// Extract only person and date entities
final result = await Locanara.extract(
  input: "John Smith will meet Sarah Johnson at Apple Park on December 15th.",
  parameters: ExtractParametersInput(
    entityTypes: ['person', 'date'],
  ),
);

// Output:
// person: John Smith
// person: Sarah Johnson
// date: December 15th`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="key-value-extraction" level="h2">
          Key-Value Extraction
        </AnchorLink>
        <p>Extract structured key-value pairs from text:</p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Extract key-value pairs from structured text
let result = try await LocanaraClient.shared.executeFeature(
    ExecuteFeatureInput(
        feature: .extract,
        input: "Order #12345 - Customer: John Smith - Total: $99.99 - Status: Shipped",
        parameters: FeatureParametersInput(
            extract: ExtractParametersInput(
                extractKeyValues: true
            )
        )
    )
)

if case .extract(let extraction) = result.result {
    for kv in extraction.keyValuePairs ?? [] {
        print("\\(kv.key): \\(kv.value)")
    }
    // Output:
    // Order: #12345
    // Customer: John Smith
    // Total: $99.99
    // Status: Shipped
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Extract key-value pairs from structured text
val result = locanara.executeFeature(
    ExecuteFeatureInput(
        feature = FeatureType.EXTRACT,
        input = "Order #12345 - Customer: John Smith - Total: \$99.99 - Status: Shipped",
        parameters = FeatureParametersInput(
            extract = ExtractParametersInput(
                extractKeyValues = true
            )
        )
    )
)

val extraction = result.result?.extract
extraction?.keyValuePairs?.forEach { kv ->
    println("\${kv.key}: \${kv.value}")
}
// Output:
// Order: #12345
// Customer: John Smith
// Total: \$99.99
// Status: Shipped`}</CodeBlock>
            ),
            typescript: (
              <CodeBlock language="typescript">{`// Extract key-value pairs from structured text
const result = await Locanara.extract({
  input: "Order #12345 - Customer: John Smith - Total: $99.99 - Status: Shipped",
  parameters: {
    extractKeyValues: true,
  },
});

result.keyValuePairs?.forEach(kv => {
  console.log(\`\${kv.key}: \${kv.value}\`);
});
// Output:
// Order: #12345
// Customer: John Smith
// Total: $99.99
// Status: Shipped`}</CodeBlock>
            ),
            dart: (
              <CodeBlock language="dart">{`// Extract key-value pairs from structured text
final result = await Locanara.extract(
  input: "Order #12345 - Customer: John Smith - Total: \$99.99 - Status: Shipped",
  parameters: ExtractParametersInput(
    extractKeyValues: true,
  ),
);

for (final kv in result.keyValuePairs ?? []) {
  print('\${kv.key}: \${kv.value}');
}
// Output:
// Order: #12345
// Customer: John Smith
// Total: \$99.99
// Status: Shipped`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="entity-types" level="h2">
          Supported Entity Types
        </AnchorLink>
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
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                Examples
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
                <code>person</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Names of people
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                John Smith, Sarah
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>location</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Places and addresses
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                New York, Tokyo
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>organization</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Companies and organizations
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Apple, Google
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>date</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Dates and times
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Dec 15, 2024
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>money</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Monetary values
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                $99.99, 100 EUR
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>email</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Email addresses
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                user@example.com
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <code>phone</code>
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Phone numbers
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                +1-555-123-4567
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
          <li>Full entity extraction support</li>
          <li>Key-value pair extraction available</li>
          <li>Returns position information for highlighting</li>
        </ul>

        <h4>Android (ML Kit GenAI)</h4>
        <div className="alert-card alert-card--warning">
          <p>
            <strong>Planned:</strong> Entity extraction is not yet available in
            ML Kit GenAI SDK. This feature will be added when Google releases
            the API.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/types#extract-result">ExtractResult</Link>,{" "}
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/classify", label: "classify()" }}
        next={{ to: "/docs/apis/chat", label: "chat()" }}
      />
    </div>
  );
}

export default ExtractAPI;
