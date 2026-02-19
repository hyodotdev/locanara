import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ExtractAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Extract API"
        description="ExtractChain - built-in chain for entity extraction using on-device AI."
        path="/docs/utils/extract"
        keywords="extract, entity extraction, NER, key-value, on-device AI"
      />
      <h1>extract()</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
        Built-in chain: <code>ExtractChain</code> | Convenience:{" "}
        <code>model.extract()</code>
      </p>
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
        <AnchorLink id="framework-usage" level="h2">
          Framework Usage (Recommended)
        </AnchorLink>
        <p>Use the chain directly or via model convenience methods:</p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Chain — uses default model automatically
let result = try await ExtractChain(
    entityTypes: ["person", "location", "date"]
).run("John Smith meets Sarah at Apple Park on Dec 15th.")
for entity in result.entities {
    print("\\(entity.type): \\(entity.value)")
}

// One-liner convenience
let result = try await FoundationLanguageModel().extract("John Smith meets Sarah at Apple Park on Dec 15th.")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// Chain — uses default model automatically
val result = ExtractChain(
    entityTypes = listOf("person", "location", "date")
).run("John Smith meets Sarah at Apple Park on Dec 15th.")
result.entities.forEach { println("\${it.type}: \${it.value}") }

// One-liner convenience
val result = LocanaraDefaults.model.extract("John Smith meets Sarah at Apple Park on Dec 15th.")`}</CodeBlock>
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
        <Link to="/docs/utils">All Utils</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/utils/classify", label: "classify()" }}
        next={{ to: "/docs/utils/chat", label: "chat()" }}
      />
    </div>
  );
}

export default ExtractAPI;
