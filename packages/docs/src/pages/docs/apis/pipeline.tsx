import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function PipelineAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Pipeline API"
        description="Pipeline DSL — compose multiple AI steps with compile-time type safety."
        path="/docs/apis/pipeline"
      />
      <h1>Pipeline</h1>
      <p>
        A type-safe DSL for composing multiple AI steps into a single execution
        flow. Each step's output automatically flows to the next step's input.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Type-safe DSL</strong> for composing chains. Swift uses{" "}
            <code>@resultBuilder</code>, Kotlin uses a fluent builder.
          </li>
          <li>
            Each step's output flows to the next step's input automatically.
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="create" level="h2">
          Creating a Pipeline
        </AnchorLink>
        <p>
          Use the <code>pipeline</code> builder on any model to create a
          multi-step AI workflow. Steps execute sequentially, with each step
          receiving the previous step's output.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const model = new LocanaraModel();

const pipeline = model.pipeline(
  proofread(),
  translate({ to: "ko" })
);
const result = await pipeline.run("Helo wrld");`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let model = FoundationLanguageModel()

let pipeline = model.pipeline {
    Proofread()
    Translate(to: "ko")
}
let result = try await pipeline.run("Helo wrld")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val model = PromptApiModel(context)

val pipeline = model.pipeline {
    proofread()
    translate(to = "ko")
}
val result = pipeline.run("Helo wrld")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="steps" level="h2">
          Available Steps
        </AnchorLink>
        <p>
          Locanara provides built-in pipeline steps for common AI operations.
          Each step maps to a corresponding chain internally.
        </p>
        <table>
          <thead>
            <tr>
              <th>Swift</th>
              <th>Kotlin</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Summarize(style:)</code>
              </td>
              <td>
                <code>summarize(style=)</code>
              </td>
              <td>Condense text into a shorter form</td>
            </tr>
            <tr>
              <td>
                <code>Classify(categories:)</code>
              </td>
              <td>
                <code>classify(categories=)</code>
              </td>
              <td>Categorize text into predefined labels</td>
            </tr>
            <tr>
              <td>
                <code>Extract(entityTypes:)</code>
              </td>
              <td>
                <code>extract(entityTypes=)</code>
              </td>
              <td>Pull structured entities from text</td>
            </tr>
            <tr>
              <td>
                <code>Chat(systemPrompt:)</code>
              </td>
              <td>
                <code>chat(systemPrompt=)</code>
              </td>
              <td>Conversational AI with a system prompt</td>
            </tr>
            <tr>
              <td>
                <code>Translate(to:)</code>
              </td>
              <td>
                <code>translate(to=)</code>
              </td>
              <td>Translate text to a target language</td>
            </tr>
            <tr>
              <td>
                <code>Rewrite(style:)</code>
              </td>
              <td>
                <code>rewrite(style=)</code>
              </td>
              <td>Rewrite text in a different style or tone</td>
            </tr>
            <tr>
              <td>
                <code>Proofread()</code>
              </td>
              <td>
                <code>proofread()</code>
              </td>
              <td>Correct grammar and spelling</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <AnchorLink id="protocol" level="h2">
          Pipeline Protocol
        </AnchorLink>
        <p>
          The <code>Pipeline</code> struct holds a model reference and a list of
          steps. Call <code>run()</code> to execute the full pipeline.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface Pipeline<Output> {
  run(text: string, metadata?: Record<string, string>): Promise<Output>;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public struct Pipeline<Output: Sendable>: Sendable {
    public func run(_ text: String, metadata: [String: String]) async throws -> Output
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`class Pipeline<Output>(
    private val model: LocanaraModel,
    private val steps: List<(LocanaraModel) -> Chain>
) {
    suspend fun run(text: String, metadata: Map<String, String> = emptyMap()): Output
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="example" level="h2">
          Multi-step Example
        </AnchorLink>
        <p>
          Combine multiple steps to build sophisticated text processing
          workflows. This example proofreads text, summarizes it, then
          translates the summary.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`// Proofread -> Summarize -> Translate
const pipeline = model.pipeline(
  proofread(),
  summarize({ style: "brief" }),
  translate({ to: "ja" })
);`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`// Proofread -> Summarize -> Translate
let pipeline = model.pipeline {
    Proofread()
    Summarize(style: .brief)
    Translate(to: "ja")
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Proofread -> Summarize -> Translate
val pipeline = model.pipeline {
    proofread()
    summarize(style = SummarizeStyle.BRIEF)
    translate(to = "ja")
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis/chain">Chain</Link>,{" "}
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/chain", label: "Chain" }}
        next={{ to: "/docs/apis/memory", label: "Memory" }}
      />
    </div>
  );
}

export default PipelineAPI;
