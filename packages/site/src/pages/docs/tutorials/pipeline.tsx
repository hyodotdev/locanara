import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function PipelineTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Pipeline Tutorial"
        description="Learn the Pipeline DSL — compose multiple AI steps with compile-time type safety."
        path="/docs/tutorials/pipeline"
        keywords="Pipeline DSL, PipelineStep, compose, type-safe, multi-step AI, Locanara"
      />
      <h1>Pipeline</h1>
      <p>
        The Pipeline DSL provides a declarative way to compose multiple AI steps
        into a single workflow. On iOS, the result builder gives compile-time
        type checking. Pipelines are ideal for multi-step workflows like
        &quot;proofread then translate.&quot;
      </p>

      <section>
        <h2>1. Basic Pipeline</h2>
        <p>
          Compose multiple AI steps sequentially. Each step&apos;s output
          becomes the next step&apos;s input. Here, we fix typos first, then
          translate the corrected text.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let model = FoundationLanguageModel()

// Step 1: Proofread — fix typos
let proofread = try await model.proofread(
    "Ths is a tset of on-devce AI. It can proofread and then translte your text."
)
print("Corrected: \\(proofread.correctedText)")

// Step 2: Translate the corrected text
let translated = try await model.translate(proofread.correctedText, to: "ko")
print("Translated: \\(translated.translatedText)")
print("Confidence: \\(translated.confidence ?? 0)")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// Step 1: Proofread — fix typos
val proofread = model.proofread(
    "Ths is a tset of on-devce AI. It can proofread and then translte your text."
)
println("Corrected: \${proofread.correctedText}")

// Step 2: Translate the corrected text
val translated = model.translate(proofread.correctedText, to = "ko")
println("Translated: \${translated.translatedText}")
println("Confidence: \${translated.confidence}")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, translate } from 'expo-ondevice-ai'

// Step 1: Proofread — fix typos
const corrected = await proofread(
  'Ths is a tset of on-devce AI. It can proofread and then translte your text.'
)
console.log('Corrected:', corrected.correctedText)

// Step 2: Translate the corrected text
const translated = await translate(corrected.correctedText, {
  targetLanguage: 'ko'
})
console.log('Translated:', translated.translatedText)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// Step 1: Proofread — fix typos
final corrected = await ai.proofread(
  'Ths is a tset of on-devce AI. It can proofread and then translte your text.',
);
print('Corrected: \${corrected.correctedText}');

// Step 2: Translate the corrected text
final translated = await ai.translate(
  corrected.correctedText,
  options: TranslateOptions(targetLanguage: 'ko'),
);
print('Translated: \${translated.translatedText}');`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/framework_pipeline_dsl.mp4"
          caption="Pipeline — text with typos corrected first, then translated to Korean"
        />
      </section>

      <section>
        <h2>2. Pipeline Builder</h2>
        <p>
          Swift offers a declarative <code>@PipelineBuilder</code> result
          builder for compile-time type-safe composition. Other platforms
          achieve the same by chaining function calls sequentially. The return
          type is determined by the last step.
        </p>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let model = FoundationLanguageModel()

// Declarative pipeline — compiler enforces return type
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece about AI.")

// result is TranslateResult — compiler enforced
print(result.translatedText)
print(result.sourceLanguage ?? "auto")
print(result.targetLanguage)  // "ko"

// Three-step pipeline
let threeStep = try await model.pipeline {
    Proofread()
    Summarize(bulletCount: 3)
    Translate(to: "ja")
}.run(longArticleWithTypos)
// Returns TranslateResult (last step determines type)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.core.LocanaraDefaults

val model = LocanaraDefaults.model

// Fluent pipeline API
val proofread = model.proofread(
    "Ths is a tset sentece about AI."
)
val translated = model.translate(
    proofread.correctedText, to = "ko"
)
println(translated.translatedText)

// Three-step pipeline
val corrected = model.proofread(longArticleWithTypos)
val summary = model.summarize(corrected.correctedText, bulletCount = 3)
val result = model.translate(summary.summary, to = "ja")
println(result.translatedText)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, summarize, translate } from 'expo-ondevice-ai'

// Sequential calls as pipeline equivalent
const corrected = await proofread('Ths is a tset sentece about AI.')
const translated = await translate(corrected.correctedText, {
  targetLanguage: 'ko'
})
console.log(translated.translatedText)

// Three-step pipeline
const fixed = await proofread(longArticleWithTypos)
const summary = await summarize(fixed.correctedText, { outputType: 'THREE_BULLETS' })
const result = await translate(summary.summary, { targetLanguage: 'ja' })
console.log(result.translatedText)`,
            },
            {
              label: "Dart",
              language: "dart",
              code: `final ai = FlutterOndeviceAi.instance;

// Sequential calls as pipeline equivalent
final corrected = await ai.proofread('Ths is a tset sentece about AI.');
final translated = await ai.translate(
  corrected.correctedText,
  options: TranslateOptions(targetLanguage: 'ko'),
);
print(translated.translatedText);

// Three-step pipeline
final fixed = await ai.proofread(longArticleWithTypos);
final summary = await ai.summarize(
  fixed.correctedText,
  options: SummarizeOptions(outputType: SummarizeOutputType.threeBullets),
);
final result = await ai.translate(
  summary.summary,
  options: TranslateOptions(targetLanguage: 'ja'),
);
print(result.translatedText);`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>
            Pipeline steps execute sequentially — output feeds into next input
          </li>
          <li>
            <strong>Swift</strong>: <code>@PipelineBuilder</code> result builder
            for compile-time type safety
          </li>
          <li>
            Built-in steps: <code>Summarize()</code>, <code>Classify()</code>,{" "}
            <code>Translate(to:)</code>, <code>Proofread()</code>,{" "}
            <code>Rewrite(style:)</code>, <code>Extract()</code>
          </li>
          <li>
            The return type is determined by the <strong>last step</strong> in
            the pipeline
          </li>
          <li>
            Pipelines are syntactic sugar over <code>SequentialChain</code> —
            use whichever fits your style
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/chain", label: "Chain" }}
        next={{ to: "/docs/tutorials/memory", label: "Memory" }}
      />
    </div>
  );
}

export default PipelineTutorial;
