import Callout from "../../../components/docs/Callout";
import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function PipelineTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Pipeline Tutorial"
        description="Compose native Swift and Kotlin AI steps while tracking the final result type."
        path="/docs/tutorials/pipeline"
        keywords="Pipeline DSL, PipelineStep, compose, final output type, multi-step AI, Locanara"
      />
      <h1>Pipeline</h1>
      <p>
        Pipelines remove repetitive handoff code from multi-step native AI
        workflows. Declare the steps once, run them with one input, and receive
        the concrete result type produced by the final step.
      </p>

      <Callout type="info" title="Native builder availability">
        The Pipeline builder is implemented by the Apple and Android SDKs. Web,
        Expo, React Native, and Flutter currently compose feature calls
        explicitly; they do not expose a matching builder.
      </Callout>

      <section>
        <h2>1. Build a Native Pipeline</h2>
        <p>
          This pipeline proofreads the input and passes the corrected text to
          Translate. Both examples return <code>TranslateResult</code> because
          Translate is the final step.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let model = LocanaraDefaults.model

let result: TranslateResult = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece about on-devce AI.")

let translatedText = result.translatedText`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.TranslateResult
import com.locanara.dsl.pipeline
import com.locanara.platform.PromptApiModel

val model = PromptApiModel(context)

val result: TranslateResult = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece about on-devce AI.")

val translatedText = result.translatedText`,
            },
          ]}
        />
        <VideoPlaceholder
          src="/features/framework_pipeline_dsl.mp4"
          caption="Pipeline — proofread first, then translate to Korean"
        />
      </section>

      <section>
        <h2>2. Understand the Data Handoff</h2>
        <p>
          Each Chain returns a <code>ChainOutput</code>. Pipeline feeds that
          output&apos;s <code>text</code> and metadata into the next Chain, then
          converts the last Chain&apos;s value to the pipeline&apos;s generic
          result type.
        </p>
        <Callout type="warning" title="Final-output tracking, not typed edges">
          Swift and Kotlin track the final result type at compile time. They do
          not model a separate input type for each step, so adjacent semantic
          compatibility remains a runtime responsibility.
        </Callout>
      </section>

      <section>
        <h2>3. Configure More Steps</h2>
        <p>
          Parameters are the same ones accepted by the corresponding built-in
          Chains. The last call still determines the returned result type.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let result: TranslateResult = try await model.pipeline {
    Summarize(bulletCount: 3)
    Proofread()
    Translate(to: "ja")
}.run(article)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val result: TranslateResult = model.pipeline()
    .summarize(bulletCount = 3)
    .proofread()
    .translate(to = "ja")
    .run(article)`,
            },
          ]}
        />
      </section>

      <section>
        <h2>4. Implement a Custom Chain</h2>
        <p>
          A custom Chain defines its result value, implements{" "}
          <code>invoke()</code>, and can add a typed <code>run()</code>{" "}
          convenience method. The custom result is stored in{" "}
          <code>ChainOutput.value</code>; <code>text</code> is the value handed
          to a later pipeline step.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `struct Headline: Sendable {
    let text: String
}

struct HeadlineChain: Chain {
    let name = "HeadlineChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let response = try await model.generate(
            prompt: "Write one concise headline:\\n\\n\\(input.text)"
        )
        let result = Headline(text: response.text)
        return ChainOutput(
            value: result,
            text: result.text,
            metadata: input.metadata
        )
    }

    func run(_ text: String) async throws -> Headline {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(Headline.self) else {
            throw LocanaraError.executionFailed("Unexpected Headline output")
        }
        return result
    }
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `data class Headline(val text: String)

class HeadlineChain(
    private val model: LocanaraModel
) : Chain {
    override val name = "HeadlineChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val response = model.generate(
            "Write one concise headline:\\n\\n" + input.text
        )
        val result = Headline(text = response.text)
        return ChainOutput(
            value = result,
            text = result.text,
            metadata = input.metadata
        )
    }

    suspend fun run(text: String): Headline {
        return invoke(ChainInput(text = text)).typed<Headline>()
            ?: error("Unexpected Headline output")
    }
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>5. Choose the Right API Level</h2>
        <ul>
          <li>
            <strong>Simple:</strong> use <code>model.summarize()</code>,{" "}
            <code>model.translate()</code>, or another convenience extension.
          </li>
          <li>
            <strong>Chain:</strong> instantiate a built-in Chain when you need
            constructor options or direct <code>invoke()</code> access.
          </li>
          <li>
            <strong>Custom:</strong> implement Chain when the application owns
            the prompt, result type, or processing behavior.
          </li>
          <li>
            <strong>Pipeline:</strong> compose multiple native Chains when their
            text handoff matches the workflow you need.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Compose on Web and Wrappers</h2>
        <p>
          These packages expose feature methods rather than the native Pipeline
          builder. Keep the handoff explicit, and choose a streaming variant
          when the platform supplies a real stream.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Web",
              language: "typescript",
              code: `import { Locanara } from "locanara"

const ai = Locanara.getInstance()
const corrected = await ai.proofread("Helo wrld")
const translatedChunks: string[] = []

for await (const chunk of ai.translateStreaming(
  corrected.correctedText,
  { sourceLanguage: "en", targetLanguage: "ko" },
)) {
  translatedChunks.push(chunk)
}`,
            },
            {
              label: "Expo",
              language: "typescript",
              code: `import { proofread, translate } from "expo-ondevice-ai"

const corrected = await proofread("Helo wrld")
const translated = await translate(corrected.correctedText, {
  sourceLanguage: "en",
  targetLanguage: "ko",
})`,
            },
            {
              label: "React Native",
              language: "typescript",
              code: `import { proofread, translate } from "react-native-ondevice-ai"

const corrected = await proofread("Helo wrld")
const translated = await translate(corrected.correctedText, {
  sourceLanguage: "en",
  targetLanguage: "ko",
})`,
            },
            {
              label: "Flutter",
              language: "dart",
              code: `final corrected = await ai.proofread("Helo wrld");
final translated = await ai.translate(
  corrected.correctedText,
  options: TranslateOptions(
    sourceLanguage: "en",
    targetLanguage: "ko",
  ),
);`,
            },
          ]}
        />
      </section>

      <section>
        <h2>Key Points</h2>
        <ul>
          <li>Native Pipeline builders are available on Apple and Android.</li>
          <li>The final step determines the compile-time result type.</li>
          <li>
            Steps pass text and metadata; adjacent typed edges are not proven.
          </li>
          <li>
            Web and wrappers use explicit sequential calls and streaming APIs.
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
