import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function TranslateTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Translate Tutorial"
        description="Learn how to translate text between languages using Locanara SDK."
        path="/docs/tutorials/translate"
        keywords="translate, language translation, Locanara"
      />
      <h1>Translate</h1>
      <p>
        Translate text between languages on-device. Supports any BCP-47 language
        code with source detection and confidence scores.
      </p>

      <section>
        <h2>1. Basic Translation</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let chain = TranslateChain(targetLanguage: "ko")
let result = try await chain.run("Hello, how are you today?")

print(result.translatedText)    // "안녕하세요, 오늘 어떠세요?"
print(result.sourceLanguage)    // "en"
print(result.targetLanguage)    // "ko"`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.TranslateChain

val chain = TranslateChain(targetLanguage = "ko")
val result = chain.run("Hello, how are you today?")

println(result.translatedText)    // "안녕하세요, 오늘 어떠세요?"
println(result.sourceLanguage)    // "en"
println(result.targetLanguage)    // "ko"`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { translate } from 'expo-ondevice-ai'

const result = await translate('Hello, how are you today?', {
  targetLanguage: 'ko'
})

console.log(result.translatedText)    // "안녕하세요, 오늘 어떠세요?"
console.log(result.sourceLanguage)    // "en"
console.log(result.targetLanguage)    // "ko"`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/translate_1.mp4"
          caption="Text input with language picker → translated text with source/target language codes and confidence"
        />
      </section>

      <section>
        <h2>2. Multiple Languages</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let text = "The weather is beautiful today."

let korean = try await TranslateChain(targetLanguage: "ko").run(text)
let japanese = try await TranslateChain(targetLanguage: "ja").run(text)
let spanish = try await TranslateChain(targetLanguage: "es").run(text)
let french = try await TranslateChain(targetLanguage: "fr").run(text)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val text = "The weather is beautiful today."

val korean = TranslateChain(targetLanguage = "ko").run(text)
val japanese = TranslateChain(targetLanguage = "ja").run(text)
val spanish = TranslateChain(targetLanguage = "es").run(text)
val french = TranslateChain(targetLanguage = "fr").run(text)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { translate } from 'expo-ondevice-ai'

const text = 'The weather is beautiful today.'

const korean = await translate(text, { targetLanguage: 'ko' })
const japanese = await translate(text, { targetLanguage: 'ja' })
const spanish = await translate(text, { targetLanguage: 'es' })
const french = await translate(text, { targetLanguage: 'fr' })`,
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
              code: `// Proofread then translate
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece with erors.")

// Summarize then translate
let result2 = try await model.pipeline {
    Summarize(bulletCount: 3)
    Translate(to: "ja")
}.run(longEnglishArticle)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Proofread then translate
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece with erors.")

// Summarize then translate
val result2 = model.pipeline()
    .summarize(bulletCount = 3)
    .translate(to = "ja")
    .run(longEnglishArticle)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { proofread, translate, summarize } from 'expo-ondevice-ai'

// Proofread then translate (sequential calls)
const corrected = await proofread('Ths is a tset sentece with erors.')
const result = await translate(corrected.correctedText, { targetLanguage: 'ko' })

// Summarize then translate
const summary = await summarize(longEnglishArticle, { outputType: 'THREE_BULLETS' })
const result2 = await translate(summary.summary, { targetLanguage: 'ja' })`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Supported Languages</h2>
        <p>
          Any valid{" "}
          <a
            href="https://www.iana.org/assignments/language-subtag-registry"
            target="_blank"
            rel="noopener noreferrer"
          >
            BCP-47 language code
          </a>{" "}
          is supported. Common examples:
        </p>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>en</code>
              </td>
              <td>English</td>
            </tr>
            <tr>
              <td>
                <code>ko</code>
              </td>
              <td>Korean</td>
            </tr>
            <tr>
              <td>
                <code>ja</code>
              </td>
              <td>Japanese</td>
            </tr>
            <tr>
              <td>
                <code>zh</code>
              </td>
              <td>Chinese</td>
            </tr>
            <tr>
              <td>
                <code>es</code>
              </td>
              <td>Spanish</td>
            </tr>
            <tr>
              <td>
                <code>fr</code>
              </td>
              <td>French</td>
            </tr>
            <tr>
              <td>
                <code>de</code>
              </td>
              <td>German</td>
            </tr>
            <tr>
              <td>
                <code>pt</code>
              </td>
              <td>Portuguese</td>
            </tr>
            <tr>
              <td>
                <code>it</code>
              </td>
              <td>Italian</td>
            </tr>
            <tr>
              <td>
                <code>ru</code>
              </td>
              <td>Russian</td>
            </tr>
            <tr>
              <td>
                <code>ar</code>
              </td>
              <td>Arabic</td>
            </tr>
            <tr>
              <td>
                <code>hi</code>
              </td>
              <td>Hindi</td>
            </tr>
          </tbody>
        </table>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/chat", label: "Chat" }}
        next={{ to: "/docs/tutorials/rewrite", label: "Rewrite" }}
      />
    </div>
  );
}

export default TranslateTutorial;
