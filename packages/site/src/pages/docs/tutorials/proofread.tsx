import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ProofreadTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Proofread Tutorial"
        description="Learn how to proofread and correct grammar and spelling using Locanara SDK."
        path="/docs/tutorials/proofread"
        keywords="proofread, grammar correction, spelling, Locanara"
      />
      <h1>Proofread</h1>
      <p>
        Automatically correct grammar and spelling errors with detailed
        correction tracking.
      </p>

      <section>
        <h2>1. Basic Proofreading</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let result = try await ProofreadChain().run(
    "I recieve your message and will definately respond untill tommorow. " +
    "Thier was a wierd occurence."
)

print(result.correctedText)
// "I receive your message and will definitely respond until tomorrow.
//  There was a weird occurrence."

print(result.hasCorrections)       // true
print(result.corrections.count)    // 6`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.ProofreadChain

val result = ProofreadChain().run(
    "I recieve your message and will definately respond untill tommorow. " +
    "Thier was a wierd occurence."
)

println(result.correctedText)
// "I receive your message and will definitely respond until tomorrow.
//  There was a weird occurrence."

println(result.hasCorrections)       // true
println(result.corrections.size)     // 6`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread } from 'expo-ondevice-ai'

const result = await proofread(
  'I recieve your message and will definately respond untill tommorow. ' +
  'Thier was a wierd occurence.'
)

console.log(result.correctedText)
// "I receive your message and will definitely respond until tomorrow.
//  There was a weird occurrence."

console.log(result.hasCorrections)       // true
console.log(result.corrections.length)   // 6`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/proofread_1.mp4"
          caption="Text input → Proofread button → corrected text with correction count badge and corrections list"
        />
      </section>

      <section>
        <h2>2. Correction Details</h2>
        <p>
          Each correction includes the original word, corrected word, and
          correction type.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let result = try await ProofreadChain().run(
    "The companys performence was truely exceptionel last quater."
)

for correction in result.corrections {
    print("\\(correction.original) → \\(correction.corrected)")
    if let type = correction.type {
        print("  Type: \\(type)")
    }
}
// companys → company's (Type: grammar)
// performence → performance (Type: spelling)
// truely → truly (Type: spelling)
// exceptionel → exceptional (Type: spelling)
// quater → quarter (Type: spelling)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val result = ProofreadChain().run(
    "The companys performence was truely exceptionel last quater."
)

for (correction in result.corrections) {
    println("\${correction.original} → \${correction.corrected}")
    correction.type?.let { println("  Type: $it") }
}
// companys → company's (Type: grammar)
// performence → performance (Type: spelling)
// truely → truly (Type: spelling)
// exceptionel → exceptional (Type: spelling)
// quater → quarter (Type: spelling)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread } from 'expo-ondevice-ai'

const result = await proofread(
  'The companys performence was truely exceptionel last quater.'
)

for (const correction of result.corrections) {
  console.log(\`\${correction.original} → \${correction.corrected}\`)
  if (correction.type) {
    console.log(\`  Type: \${correction.type}\`)
  }
}
// companys → company's (Type: grammar)
// performence → performance (Type: spelling)
// truely → truly (Type: spelling)
// exceptionel → exceptional (Type: spelling)
// quater → quarter (Type: spelling)`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. Pipeline Composition</h2>
        <p>
          Proofread pairs naturally with Translate and Rewrite — fix errors
          first, then transform.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Proofread then translate
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece with meny erors.")

// Proofread then rewrite professionally
let result2 = try await model.pipeline {
    Proofread()
    Rewrite(style: .professional)
}.run("hey thier, can we mee tommorow?")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Proofread then translate
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece with meny erors.")

// Proofread then rewrite professionally
val result2 = model.pipeline()
    .proofread()
    .rewrite(style = RewriteOutputType.PROFESSIONAL)
    .run("hey thier, can we mee tommorow?")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, translate, rewrite } from 'expo-ondevice-ai'

// Proofread then translate (sequential calls)
const corrected = await proofread('Ths is a tset sentece with meny erors.')
const result = await translate(corrected.correctedText, { targetLanguage: 'ko' })

// Proofread then rewrite professionally
const corrected2 = await proofread('hey thier, can we mee tommorow?')
const result2 = await rewrite(corrected2.correctedText, {
  outputType: 'PROFESSIONAL'
})`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            <strong>ProofreadChain</strong>: No configuration needed — just run
            it
          </li>
          <li>
            <strong>ProofreadResult</strong>: Contains{" "}
            <code>correctedText</code>, <code>hasCorrections</code>, and{" "}
            <code>corrections</code> array
          </li>
          <li>
            Each <strong>Correction</strong> has <code>original</code>,{" "}
            <code>corrected</code>, and optional <code>type</code> (spelling,
            grammar)
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/rewrite", label: "Rewrite" }}
        next={{
          to: "/docs/tutorials/model-selection",
          label: "Model Selection",
        }}
      />
    </div>
  );
}

export default ProofreadTutorial;
