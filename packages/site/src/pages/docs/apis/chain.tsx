import { Link } from "react-router-dom";
import AnchorLink from "../../../components/docs/AnchorLink";
import CodeBlock from "../../../components/docs/CodeBlock";
import LanguageTabs from "../../../components/docs/LanguageTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import TLDRBox from "../../../components/docs/TLDRBox";

function ChainAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Chain API"
        description="Chain protocol — the core composable building block for on-device AI features."
        path="/docs/apis/chain"
      />
      <h1>Chain</h1>
      <p>
        The core composable building block for on-device AI features. Every AI
        operation in Locanara is a Chain — from simple model calls to complex
        multi-step workflows.
      </p>

      <TLDRBox>
        <ul>
          <li>
            <strong>Chain</strong> is the core abstraction. Implement{" "}
            <code>invoke()</code> to create custom AI steps.
          </li>
          <li>
            <strong>Built-in</strong>: ModelChain, SequentialChain,
            ParallelChain, ConditionalChain.
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="protocol" level="h2">
          Chain Protocol
        </AnchorLink>
        <p>
          The <code>Chain</code> protocol defines a single <code>invoke()</code>{" "}
          method that takes a <code>ChainInput</code> and returns a{" "}
          <code>ChainOutput</code>.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface Chain {
  name: string;
  invoke(input: ChainInput): Promise<ChainOutput>;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public protocol Chain: Sendable {
    var name: String { get }
    func invoke(_ input: ChainInput) async throws -> ChainOutput
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`interface Chain {
    val name: String
    suspend fun invoke(input: ChainInput): ChainOutput
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="schema" level="h2">
          ChainInput / ChainOutput
        </AnchorLink>
        <p>
          <code>ChainInput</code> carries the text and optional metadata into a
          chain. <code>ChainOutput</code> holds the result along with processing
          metadata.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface ChainInput {
  text: string;
  metadata: Record<string, string>;
}

interface ChainOutput {
  value: unknown;
  text: string;
  metadata: Record<string, string>;
  processingTimeMs?: number;
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public struct ChainInput: Sendable {
    public let text: String
    public var metadata: [String: String]
    public init(text: String, metadata: [String: String] = [:])
}

public struct ChainOutput: Sendable {
    public let value: Any  // type-erased result
    public let text: String
    public var metadata: [String: String]
    public let processingTimeMs: Int?
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`data class ChainInput(
    val text: String,
    val metadata: MutableMap<String, String> = mutableMapOf()
)

data class ChainOutput(
    val value: Any,
    val text: String,
    val metadata: MutableMap<String, String> = mutableMapOf(),
    val processingTimeMs: Long? = null
) {
    inline fun <reified T> typed(): T  // type-safe casting
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="model-chain" level="h2">
          ModelChain
        </AnchorLink>
        <p>
          Wraps a model with an optional <code>PromptTemplate</code>. This is
          the most common chain type — it sends a formatted prompt to the
          on-device model and returns the response.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const chain = new ModelChain({
  model,
  promptTemplate: template,
  config: GenerationConfig.structured,
});`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let chain = ModelChain(
    model: model,
    promptTemplate: template,
    config: .structured
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val chain = ModelChain(
    model,
    promptTemplate = template,
    config = GenerationConfig.STRUCTURED
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="sequential" level="h2">
          SequentialChain
        </AnchorLink>
        <p>
          Runs chains in order, passing each chain's output as the next chain's
          input. Useful for multi-step processing like proofreading then
          translating.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const chain = new SequentialChain({ chains: [proofread, translate] });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let chain = SequentialChain(chains: [proofread, translate])`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val chain = SequentialChain(listOf(proofread, translate))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="parallel" level="h2">
          ParallelChain
        </AnchorLink>
        <p>
          Runs chains concurrently and collects all results. Ideal when you need
          multiple independent analyses of the same input.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const chain = new ParallelChain({ chains: [sentiment, summarize] });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let chain = ParallelChain(chains: [sentiment, summarize])`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val chain = ParallelChain(listOf(sentiment, summarize))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="conditional" level="h2">
          ConditionalChain
        </AnchorLink>
        <p>
          Routes input to different chains based on a condition. The condition
          function evaluates the input and returns a branch key.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const chain = new ConditionalChain({
  condition: (input) => input.text.length > 500,
  branches: { true: summarize, false: rewrite },
});`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let chain = ConditionalChain(
    condition: { $0.text.count > 500 },
    branches: ["true": summarize, "false": rewrite]
)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val chain = ConditionalChain(
    condition = { it.text.length > 500 },
    branches = mapOf("true" to summarize, "false" to rewrite)
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="custom" level="h2">
          Building a Custom Chain
        </AnchorLink>
        <p>
          This is the core value of Locanara — building AI features specific to
          your app. Built-in chains like <code>SummarizeChain</code> are just
          samples. Follow this pattern to create your own.
        </p>

        <h3 id="step-1">Step 1: Define your result type</h3>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// What your chain returns — fully typed, no JSON parsing
struct FoodLabelResult: Sendable {
    let calories: Int
    let allergens: [String]
    let healthScore: Double      // 0.0 - 1.0
    let recommendation: String
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// What your chain returns — fully typed, no JSON parsing
data class FoodLabelResult(
    val calories: Int,
    val allergens: List<String>,
    val healthScore: Double,     // 0.0 - 1.0
    val recommendation: String
)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>

        <h3 id="step-2">Step 2: Implement the Chain protocol</h3>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`struct FoodLabelChain: Chain {
    let name = "FoodLabelChain"

    private let model: any LocanaraModel

    init(model: (any LocanaraModel)? = nil) {
        self.model = model ?? LocanaraDefaults.model
    }

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        // 1. Build the prompt
        let template = PromptTemplate.from("""
        Analyze this food label. Return JSON:
        {"calories": <int>, "allergens": [<strings>],
         "healthScore": <0.0-1.0>, "recommendation": "<text>"}

        Food label: {text}
        """)
        let prompt = try template.format(["text": input.text])

        // 2. Call the on-device model
        let response = try await model.generate(
            prompt: prompt, config: .structured
        )

        // 3. Parse into your typed result
        let result = try parseFoodLabel(response.text)

        // 4. Return as ChainOutput
        return ChainOutput(
            value: result,
            text: result.recommendation,
            metadata: input.metadata,
            processingTimeMs: response.processingTimeMs
        )
    }

    // Type-safe convenience method
    func run(_ text: String) async throws -> FoodLabelResult {
        let output = try await invoke(ChainInput(text: text))
        guard let result = output.typed(FoodLabelResult.self) else {
            throw LocanaraError.executionFailed(
                "Unexpected output type from FoodLabelChain"
            )
        }
        return result
    }

    private func parseFoodLabel(_ text: String) throws -> FoodLabelResult {
        // Parse model response into your typed result
        // (Use JSONDecoder, regex, or string parsing)
        ...
    }
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`class FoodLabelChain(
    private val model: LocanaraModel = LocanaraDefaults.model
) : Chain {
    override val name = "FoodLabelChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        // 1. Build the prompt
        val template = PromptTemplate.from("""
            Analyze this food label. Return JSON:
            {"calories": <int>, "allergens": [<strings>],
             "healthScore": <0.0-1.0>, "recommendation": "<text>"}

            Food label: {text}
        """.trimIndent())
        val prompt = template.format(mapOf("text" to input.text))

        // 2. Call the on-device model
        val response = model.generate(prompt, GenerationConfig.STRUCTURED)

        // 3. Parse into your typed result
        val result = parseFoodLabel(response.text)

        // 4. Return as ChainOutput
        return ChainOutput(
            value = result,
            text = result.recommendation,
            metadata = input.metadata,
            processingTimeMs = response.processingTimeMs
        )
    }

    // Type-safe convenience method
    suspend fun run(text: String): FoodLabelResult {
        val output = invoke(ChainInput(text = text))
        return output.typed<FoodLabelResult>()
            ?: throw IllegalStateException(
                "Unexpected output type from FoodLabelChain"
            )
    }

    private fun parseFoodLabel(text: String): FoodLabelResult {
        // Parse model response into your typed result
        // (Use Gson, kotlinx.serialization, or string parsing)
        ...
    }
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>

        <h3 id="step-3">Step 3: Use it</h3>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`// Standalone
let result = try await FoodLabelChain().run("Calories: 250, Fat: 12g...")
print(result.healthScore)     // 0.65
print(result.allergens)       // ["nuts", "soy"]

// In a SequentialChain — analyze then translate the recommendation
let pipeline = SequentialChain(chains: [
    FoodLabelChain(),
    TranslateChain(targetLanguage: "ko")
])
let output = try await pipeline.invoke(ChainInput(text: labelText))

// With guardrails — validate input length
let guarded = GuardedChain(
    chain: FoodLabelChain(),
    guardrails: [InputLengthGuardrail(maxCharacters: 2000)]
)
let output = try await guarded.invoke(ChainInput(text: labelText))`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`// Standalone
val result = FoodLabelChain().run("Calories: 250, Fat: 12g...")
println(result.healthScore)     // 0.65
println(result.allergens)       // [nuts, soy]

// In a SequentialChain — analyze then translate the recommendation
val pipeline = SequentialChain(chains = listOf(
    FoodLabelChain(),
    TranslateChain(targetLanguage = "ko")
))
val output = pipeline.invoke(ChainInput(text = labelText))

// With guardrails — validate input length
val guarded = GuardedChain(
    chain = FoodLabelChain(),
    guardrails = listOf(InputLengthGuardrail(maxCharacters = 2000))
)
val output = guarded.invoke(ChainInput(text = labelText))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>

        <div className="alert-card alert-card--info">
          <p>
            <strong>Pattern summary:</strong> Define a result type → Implement{" "}
            <code>invoke()</code> with prompt + model + parse → Add typed{" "}
            <code>run()</code> → Compose with SequentialChain, GuardedChain, or
            Pipeline. See{" "}
            <Link to="/docs/utils/summarize">SummarizeChain source</Link> for a
            complete reference implementation.
          </p>
        </div>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis/pipeline">Pipeline</Link>,{" "}
        <Link to="/docs/apis/guardrail">Guardrail</Link>,{" "}
        <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{
          to: "/docs/apis/get-device-capability",
          label: "getDeviceCapability",
        }}
        next={{ to: "/docs/apis/pipeline", label: "Pipeline" }}
      />
    </div>
  );
}

export default ChainAPI;
