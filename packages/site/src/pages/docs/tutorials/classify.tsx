import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ClassifyTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Classify Tutorial"
        description="Learn how to classify text into custom categories with confidence scores using Locanara SDK."
        path="/docs/tutorials/classify"
        keywords="classify, text classification, sentiment analysis, Locanara"
      />
      <h1>Classify</h1>
      <p>
        Classify text into custom categories with confidence scores. Great for
        content routing, sentiment analysis, and auto-tagging.
      </p>

      <section>
        <h2>1. Basic Classification</h2>
        <p>
          Classify text into categories using ClassifyChain. Results include the
          top classification and scores for all categories.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let chain = ClassifyChain(
    categories: ["Technology", "Sports", "Entertainment", "Business", "Health"]
)

let result = try await chain.run(
    "The new iPhone features an incredible camera system with advanced computational photography."
)

// Top result
print(result.topClassification.label)  // "Technology"
print(result.topClassification.score)  // 0.92

// All categories with scores
for classification in result.classifications {
    print("\\(classification.label): \\(Int(classification.score * 100))%")
}
// Technology: 92%
// Business: 5%
// Entertainment: 2%
// Sports: 1%
// Health: 0%`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.ClassifyChain

val chain = ClassifyChain(
    categories = listOf("Technology", "Sports", "Entertainment", "Business", "Health")
)

val result = chain.run(
    "The new Pixel features an incredible camera system with advanced computational photography."
)

// Top result
println(result.topClassification.label)  // "Technology"
println(result.topClassification.score)  // 0.92

// All categories with scores
for (classification in result.classifications) {
    println("\${classification.label}: \${(classification.score * 100).toInt()}%")
}
// Technology: 92%
// Business: 5%
// Entertainment: 2%
// Sports: 1%
// Health: 0%`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { classify } from 'expo-ondevice-ai'

const result = await classify(
  'The new phone features an incredible camera system with advanced computational photography.',
  { categories: ['Technology', 'Sports', 'Entertainment', 'Business', 'Health'] }
)

// Top result
console.log(result.topClassification.label)  // "Technology"
console.log(result.topClassification.score)  // 0.92

// All categories with scores
for (const classification of result.classifications) {
  console.log(\`\${classification.label}: \${Math.round(classification.score * 100)}%\`)
}
// Technology: 92%
// Business: 5%
// Entertainment: 2%
// Sports: 1%
// Health: 0%`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/classify_1.mp4"
          caption="Text input with comma-separated categories → Classify button → all categories with progress bars and confidence percentages, top result bolded"
        />
      </section>

      <section>
        <h2>2. Custom Categories</h2>
        <p>Define any categories that fit your app&apos;s needs.</p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Support ticket routing
let ticketRouter = ClassifyChain(
    categories: ["Billing", "Technical", "Account", "General"]
)
let ticket = try await ticketRouter.run("I can't log into my account")
print(ticket.topClassification.label)  // "Account"

// Content moderation
let moderator = ClassifyChain(
    categories: ["Safe", "Spam", "Offensive", "Off-topic"]
)
let review = try await moderator.run(userComment)
if review.topClassification.label != "Safe" {
    flagForReview(review.topClassification.label)
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Support ticket routing
val ticketRouter = ClassifyChain(
    categories = listOf("Billing", "Technical", "Account", "General")
)
val ticket = ticketRouter.run("I can't log into my account")
println(ticket.topClassification.label)  // "Account"

// Content moderation
val moderator = ClassifyChain(
    categories = listOf("Safe", "Spam", "Offensive", "Off-topic")
)
val review = moderator.run(userComment)
if (review.topClassification.label != "Safe") {
    flagForReview(review.topClassification.label)
}`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `// Support ticket routing
const ticket = await classify(
  "I can't log into my account",
  { categories: ['Billing', 'Technical', 'Account', 'General'] }
)
console.log(ticket.topClassification.label)  // "Account"

// Content moderation
const review = await classify(userComment, {
  categories: ['Safe', 'Spam', 'Offensive', 'Off-topic']
})
if (review.topClassification.label !== 'Safe') {
  flagForReview(review.topClassification.label)
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. One-Liner Convenience</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let result = try await model.classify(
    "Breaking: Stock market reaches all-time high",
    categories: ["Technology", "Sports", "Business", "Health"]
)
print(result.topClassification.label)  // "Business"`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val result = model.classify(
    "Breaking: Stock market reaches all-time high",
    categories = listOf("Technology", "Sports", "Business", "Health")
)
println(result.topClassification.label)  // "Business"`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `const result = await classify(
  'Breaking: Stock market reaches all-time high',
  { categories: ['Technology', 'Sports', 'Business', 'Health'] }
)
console.log(result.topClassification.label)  // "Business"`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>ClassifyChain</strong>: Configure with custom{" "}
            <code>categories</code> array
          </li>
          <li>
            <strong>ClassifyResult</strong>: Contains{" "}
            <code>topClassification</code> and <code>classifications</code> (all
            categories with scores)
          </li>
          <li>
            Each <strong>Classification</strong> has <code>label</code> and{" "}
            <code>score</code> (0.0 - 1.0)
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/summarize", label: "Summarize" }}
        next={{ to: "/docs/tutorials/extract", label: "Extract" }}
      />
    </div>
  );
}

export default ClassifyTutorial;
