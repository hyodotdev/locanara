import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function SummarizeTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Summarize Tutorial"
        description="Learn how to implement text summarization using Locanara SDK on iOS, Android, and Web."
        path="/docs/tutorials/summarize"
        keywords="summarize, text summarization, Apple Intelligence, Gemini Nano, Locanara"
      />
      <h1>Summarize</h1>
      <p>
        Condense long text into bullet points using on-device AI. SummarizeChain
        provides configurable bullet counts and returns both the summary and
        length metadata.
      </p>

      <section>
        <h2>1. Summarization</h2>
        <p>
          Summarize text with a configurable bullet count (1, 2, or 3). Results
          include the summary and character counts.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

// 1 bullet
let one = try await SummarizeChain(bulletCount: 1).run(longArticle)
print(one.summary)
print("Original: \\(one.originalLength) chars -> Summary: \\(one.summaryLength) chars")

// 2 bullets
let two = try await SummarizeChain(bulletCount: 2).run(longArticle)

// 3 bullets
let three = try await SummarizeChain(bulletCount: 3).run(longArticle)
print(three.summary)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.SummarizeChain

// 1 bullet
val one = SummarizeChain(bulletCount = 1).run(longArticle)
println(one.summary)
println("Original: \${one.originalLength} chars -> Summary: \${one.summaryLength} chars")

// 2 bullets
val two = SummarizeChain(bulletCount = 2).run(longArticle)

// 3 bullets
val three = SummarizeChain(bulletCount = 3).run(longArticle)
println(three.summary)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize } from 'expo-ondevice-ai'

// 1 bullet
const one = await summarize(longArticle, { outputType: 'ONE_BULLET' })
console.log(one.summary)
console.log(\`Original: \${one.originalLength} chars -> Summary: \${one.summaryLength} chars\`)

// 2 bullets
const two = await summarize(longArticle, { outputType: 'TWO_BULLETS' })

// 3 bullets
const three = await summarize(longArticle, { outputType: 'THREE_BULLETS' })
console.log(three.summary)`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/summarize_1.mp4"
          caption="Text input with bullet count segmented picker (1/2/3) → Summarize button → summary result with original/summary character counts"
        />
      </section>

      <section>
        <h2>2. Pipeline Composition</h2>
        <p>Combine SummarizeChain with other chains using the Pipeline DSL.</p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Summarize then translate to Korean
let result = try await model.pipeline {
    Summarize(bulletCount: 3)
    Translate(to: "ko")
}.run(longArticle)

print(result.translatedText)  // Korean summary`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Summarize then translate to Korean
val result = model.pipeline()
    .summarize(bulletCount = 3)
    .translate(to = "ko")
    .run(longArticle)

println(result.translatedText)  // Korean summary`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize, translate } from 'expo-ondevice-ai'

// Summarize then translate to Korean (sequential calls)
const summary = await summarize(longArticle, { outputType: 'THREE_BULLETS' })
const result = await translate(summary.summary, { targetLanguage: 'ko' })

console.log(result.translatedText)  // Korean summary`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. One-Liner Convenience</h2>
        <p>Use the model extension for the simplest possible API.</p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let model = FoundationLanguageModel()
let result = try await model.summarize(longArticle)
print(result.summary)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val model = LocanaraDefaults.model
val result = model.summarize(longArticle)
println(result.summary)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { summarize } from 'expo-ondevice-ai'

const result = await summarize(longArticle)
console.log(result.summary)`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>SummarizeChain</strong>: Configure with{" "}
            <code>bulletCount</code> (1, 2, or 3)
          </li>
          <li>
            <strong>SummarizeResult</strong>: Contains <code>summary</code>,{" "}
            <code>originalLength</code>, and <code>summaryLength</code>
          </li>
          <li>
            <strong>Pipeline DSL</strong>: Compose with other chains like
            TranslateChain for multi-step workflows
          </li>
          <li>
            <strong>model.summarize()</strong>: One-liner convenience for quick
            usage
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials", label: "Tutorials" }}
        next={{ to: "/docs/tutorials/classify", label: "Classify" }}
      />
    </div>
  );
}

export default SummarizeTutorial;
