import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function RewriteTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Rewrite Tutorial"
        description="Learn how to rewrite text with different tones using Locanara SDK."
        path="/docs/tutorials/rewrite"
        keywords="rewrite, text rewriting, tone, style, Locanara"
      />
      <h1>Rewrite</h1>
      <p>
        Rewrite text with different tones — professional, friendly, elaborate,
        or shortened. The original meaning is preserved while adapting the
        style.
      </p>

      <section>
        <h2>1. Basic Rewrite</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let result = try await RewriteChain(style: .professional).run(
    "Hey! Can we meet tomorrow?"
)
print(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.RewriteChain
import com.locanara.RewriteOutputType

val result = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(
    "Hey! Can we meet tomorrow?"
)
println(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { rewrite } from 'expo-ondevice-ai'

const result = await rewrite('Hey! Can we meet tomorrow?', {
  outputType: 'PROFESSIONAL'
})
console.log(result.rewrittenText)
// "I would appreciate the opportunity to meet with you tomorrow."`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/rewrite_1.mp4"
          caption="Text input with style picker → rewritten text with applied style name"
        />
      </section>

      <section>
        <h2>2. Style Comparison</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let original = "Hey! Can we meet up tomorrow to talk about the project?"

// Professional
let pro = try await RewriteChain(style: .professional).run(original)
// "I would like to schedule a meeting for tomorrow to discuss the project."

// Friendly
let friendly = try await RewriteChain(style: .friendly).run(original)
// "Would love to catch up tomorrow and chat about the project!"

// Elaborate
let elaborate = try await RewriteChain(style: .elaborate).run(original)
// "I was wondering if you might be available tomorrow..."

// Shorten
let short = try await RewriteChain(style: .shorten).run(original)
// "Meeting tomorrow to discuss project?"`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val original = "Hey! Can we meet up tomorrow to talk about the project?"

// Professional
val pro = RewriteChain(style = RewriteOutputType.PROFESSIONAL).run(original)
// "I would like to schedule a meeting for tomorrow to discuss the project."

// Friendly
val friendly = RewriteChain(style = RewriteOutputType.FRIENDLY).run(original)
// "Would love to catch up tomorrow and chat about the project!"

// Elaborate
val elaborate = RewriteChain(style = RewriteOutputType.ELABORATE).run(original)
// "I was wondering if you might be available tomorrow..."

// Shorten
val short = RewriteChain(style = RewriteOutputType.SHORTEN).run(original)
// "Meeting tomorrow to discuss project?"`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { rewrite } from 'expo-ondevice-ai'

const original = 'Hey! Can we meet up tomorrow to talk about the project?'

// Professional
const pro = await rewrite(original, { outputType: 'PROFESSIONAL' })

// Friendly
const friendly = await rewrite(original, { outputType: 'FRIENDLY' })

// Elaborate
const elaborate = await rewrite(original, { outputType: 'ELABORATE' })

// Shorten
const short = await rewrite(original, { outputType: 'SHORTEN' })`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Proofread first, then rewrite in professional tone
let result = try await model.pipeline {
    Proofread()
    Rewrite(style: .professional)
}.run("Hey thier! Cna we mee tomorrow?")

print(result.rewrittenText)  // Corrected and professionalized`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Proofread first, then rewrite in professional tone
val result = model.pipeline()
    .proofread()
    .rewrite(style = RewriteOutputType.PROFESSIONAL)
    .run("Hey thier! Cna we mee tomorrow?")

println(result.rewrittenText)  // Corrected and professionalized`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, rewrite } from 'expo-ondevice-ai'

// Proofread first, then rewrite in professional tone (sequential calls)
const corrected = await proofread('Hey thier! Cna we mee tomorrow?')
const result = await rewrite(corrected.correctedText, {
  outputType: 'PROFESSIONAL'
})

console.log(result.rewrittenText)  // Corrected and professionalized`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Available Styles</h2>
        <table>
          <thead>
            <tr>
              <th>Swift</th>
              <th>Kotlin</th>
              <th>TypeScript</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>.professional</code>
              </td>
              <td>
                <code>PROFESSIONAL</code>
              </td>
              <td>
                <code>'PROFESSIONAL'</code>
              </td>
              <td>Formal, business-appropriate tone</td>
            </tr>
            <tr>
              <td>
                <code>.friendly</code>
              </td>
              <td>
                <code>FRIENDLY</code>
              </td>
              <td>
                <code>'FRIENDLY'</code>
              </td>
              <td>Casual, warm, and approachable</td>
            </tr>
            <tr>
              <td>
                <code>.elaborate</code>
              </td>
              <td>
                <code>ELABORATE</code>
              </td>
              <td>
                <code>'ELABORATE'</code>
              </td>
              <td>More detailed and descriptive</td>
            </tr>
            <tr>
              <td>
                <code>.shorten</code>
              </td>
              <td>
                <code>SHORTEN</code>
              </td>
              <td>
                <code>'SHORTEN'</code>
              </td>
              <td>Concise and to the point</td>
            </tr>
          </tbody>
        </table>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/translate", label: "Translate" }}
        next={{ to: "/docs/tutorials/proofread", label: "Proofread" }}
      />
    </div>
  );
}

export default RewriteTutorial;
