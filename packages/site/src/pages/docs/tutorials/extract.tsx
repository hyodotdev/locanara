import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ExtractTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Extract Tutorial"
        description="Learn how to extract named entities from text using Locanara SDK."
        path="/docs/tutorials/extract"
        keywords="extract, entity extraction, NER, Locanara"
      />
      <h1>Extract</h1>
      <p>
        Extract named entities like people, emails, phone numbers, dates, and
        locations from unstructured text.
      </p>

      <section>
        <h2>1. Basic Extraction</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let chain = ExtractChain(
    entityTypes: ["person", "email", "phone", "date", "location"]
)

let result = try await chain.run(
    "Contact John Smith at john@example.com or call 555-123-4567. " +
    "Meeting scheduled for January 15, 2025 at Apple Park, Cupertino."
)

for entity in result.entities {
    print("\\(entity.type): \\(entity.value) (\\(Int(entity.confidence * 100))%)")
}
// person: John Smith (95%)
// email: john@example.com (98%)
// phone: 555-123-4567 (97%)
// date: January 15, 2025 (93%)
// location: Apple Park, Cupertino (91%)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.ExtractChain

val chain = ExtractChain(
    entityTypes = listOf("person", "email", "phone", "date", "location")
)

val result = chain.run(
    "Contact John Smith at john@example.com or call 555-123-4567. " +
    "Meeting scheduled for January 15, 2025 at Googleplex, Mountain View."
)

for (entity in result.entities) {
    println("\${entity.type}: \${entity.value} (\${(entity.confidence * 100).toInt()}%)")
}
// person: John Smith (95%)
// email: john@example.com (98%)
// phone: 555-123-4567 (97%)
// date: January 15, 2025 (93%)
// location: Googleplex, Mountain View (91%)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { extract } from 'expo-ondevice-ai'

const result = await extract(
  'Contact John Smith at john@example.com or call 555-123-4567. ' +
  'Meeting scheduled for January 15, 2025 at the office.',
  { entityTypes: ['person', 'email', 'phone', 'date', 'location'] }
)

for (const entity of result.entities) {
  console.log(\`\${entity.type}: \${entity.value} (\${Math.round(entity.confidence * 100)}%)\`)
}
// person: John Smith (95%)
// email: john@example.com (98%)
// phone: 555-123-4567 (97%)
// date: January 15, 2025 (93%)
// location: the office (91%)`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/extract_1.mp4"
          caption="Text input → Extract Entities button → color-coded type badges (person, email, phone, date, location) with entity values and confidence scores"
        />
      </section>

      <section>
        <h2>Available Entity Types</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>person</code>
              </td>
              <td>Person names</td>
              <td>John Smith, Dr. Lee</td>
            </tr>
            <tr>
              <td>
                <code>email</code>
              </td>
              <td>Email addresses</td>
              <td>user@example.com</td>
            </tr>
            <tr>
              <td>
                <code>phone</code>
              </td>
              <td>Phone numbers</td>
              <td>555-123-4567</td>
            </tr>
            <tr>
              <td>
                <code>date</code>
              </td>
              <td>Dates and times</td>
              <td>January 15, 3pm tomorrow</td>
            </tr>
            <tr>
              <td>
                <code>location</code>
              </td>
              <td>Places and addresses</td>
              <td>Cupertino, Building 5</td>
            </tr>
          </tbody>
        </table>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/classify", label: "Classify" }}
        next={{ to: "/docs/tutorials/chat", label: "Chat" }}
      />
    </div>
  );
}

export default ExtractTutorial;
