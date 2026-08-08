import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import Callout from "../../../components/docs/Callout";
import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

const nativePipelineTabs = [
  {
    label: "Swift",
    language: "swift" as const,
    code: `let model = LocanaraDefaults.model

let pipeline = model.pipeline {
    Proofread()
    Translate(to: "ko")
}

let result: TranslateResult = try await pipeline.run("Helo wrld")`,
  },
  {
    label: "Kotlin",
    language: "kotlin" as const,
    code: `val model = PromptApiModel(context)

val pipeline = model.pipeline()
    .proofread()
    .translate(to = "ko")

val result: TranslateResult = pipeline.run("Helo wrld")`,
  },
];

function PipelineAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Pipeline API"
        description="Native Swift and Kotlin Pipeline builders with compile-time final-output type tracking."
        path="/docs/apis/pipeline"
      />
      <h1>Pipeline</h1>
      <p>
        Pipeline is a native Swift and Kotlin API for running multiple Chains in
        sequence. Every step receives the previous step&apos;s text and
        metadata, while the final step determines the type returned by{" "}
        <code>run()</code>.
      </p>

      <TLDRBox>
        <ul>
          <li>
            Swift uses <code>@PipelineBuilder</code>; Kotlin uses a fluent{" "}
            <code>Pipeline&lt;Output&gt;</code> builder.
          </li>
          <li>
            The compiler tracks the <strong>final result type</strong>, not the
            semantic compatibility of every adjacent step.
          </li>
          <li>
            Web and current wrappers do not expose this builder. Compose their
            public feature methods explicitly.
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="create" level="h2">
          Create and Run a Pipeline
        </AnchorLink>
        <p>
          Both builders execute their steps in declaration order. The examples
          below are the same calls used by the Apple and Android example apps.
        </p>
        <CodeTabs tabs={nativePipelineTabs} />
      </section>

      <section>
        <AnchorLink id="type-tracking" level="h2">
          What the Type System Guarantees
        </AnchorLink>
        <p>
          Adding a step changes the pipeline&apos;s generic output type to that
          step&apos;s result type. A pipeline ending in Translate therefore
          returns <code>TranslateResult</code>.
        </p>
        <Callout type="warning" title="Adjacent steps are runtime composition">
          Pipeline does not express a separate input type for each step. Steps
          exchange <code>ChainOutput.text</code> and metadata at runtime, so the
          compiler cannot prove that every neighboring pair is semantically
          compatible.
        </Callout>
      </section>

      <section>
        <AnchorLink id="steps" level="h2">
          Available Steps
        </AnchorLink>
        <table>
          <thead>
            <tr>
              <th>Swift</th>
              <th>Kotlin</th>
              <th>Final result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Summarize(bulletCount:)</code>
              </td>
              <td>
                <code>.summarize(bulletCount =)</code>
              </td>
              <td>
                <code>SummarizeResult</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>Classify(categories:maxResults:)</code>
              </td>
              <td>
                <code>.classify(categories =, maxResults =)</code>
              </td>
              <td>
                <code>ClassifyResult</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>Extract(entityTypes:)</code>
              </td>
              <td>
                <code>.extract(entityTypes =)</code>
              </td>
              <td>
                <code>ExtractResult</code>
              </td>
            </tr>
            <tr>
              <td>—</td>
              <td>
                <code>.chat(memory =, systemPrompt =)</code>
              </td>
              <td>
                <code>ChatResult</code> (Android only)
              </td>
            </tr>
            <tr>
              <td>
                <code>Translate(to:from:)</code>
              </td>
              <td>
                <code>.translate(to =, from =)</code>
              </td>
              <td>
                <code>TranslateResult</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>Rewrite(style:)</code>
              </td>
              <td>
                <code>.rewrite(style =)</code>
              </td>
              <td>
                <code>RewriteResult</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>Proofread()</code>
              </td>
              <td>
                <code>.proofread()</code>
              </td>
              <td>
                <code>ProofreadResult</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="run" level="h2">
          run()
        </AnchorLink>
        <p>
          The optional metadata map is forwarded through each step together with
          its text output.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `public func run(
    _ text: String,
    metadata: [String: String] = [:]
) async throws -> Output`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `suspend fun run(
    text: String,
    metadata: MutableMap<String, String> = mutableMapOf()
): Output`,
            },
          ]}
        />
      </section>

      <section>
        <AnchorLink id="web" level="h2">
          Web and Wrapper Composition
        </AnchorLink>
        <p>
          The Web SDK, Expo, React Native, and Flutter facades currently have no
          Pipeline builder. Call their feature methods in sequence, and use the
          real streaming variants where progressive output is useful.
        </p>
        <CodeTabs
          tabs={[
            {
              label: "Web",
              language: "typescript",
              code: `import { Locanara } from "locanara"

const ai = Locanara.getInstance()
const corrected = await ai.proofread("Helo wrld")
const options = { sourceLanguage: "en", targetLanguage: "ko" }
const translatedChunks: string[] = []

for await (const chunk of ai.translateStreaming(
  corrected.correctedText,
  options,
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

      <p className="type-link">
        Continue with the{" "}
        <Link to="/docs/tutorials/pipeline">Pipeline tutorial</Link> or see{" "}
        <Link to="/docs/apis/chain">Chain</Link>.
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/chain", label: "Chain" }}
        next={{ to: "/docs/apis/memory", label: "Memory" }}
      />
    </div>
  );
}

export default PipelineAPI;
