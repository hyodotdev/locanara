import { Link } from "react-router-dom";
import AnchorLink from "../../../components/AnchorLink";
import CodeBlock from "../../../components/CodeBlock";
import LanguageTabs from "../../../components/LanguageTabs";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";
import TLDRBox from "../../../components/TLDRBox";

function GuardrailAPI() {
  return (
    <div className="doc-page">
      <SEO
        title="Guardrail API"
        description="Guardrail — input/output validation for production AI features."
        path="/docs/apis/guardrail"
      />
      <h1>Guardrail</h1>
      <p>
        Guardrails validate input before and output after AI processing,
        ensuring safety and correctness in production AI features.
      </p>

      <TLDRBox>
        <ul>
          <li>
            Guardrails validate input before and output after chain execution
          </li>
          <li>
            <strong>Built-in</strong>: <code>InputLengthGuardrail</code>,{" "}
            <code>ContentFilterGuardrail</code>
          </li>
          <li>
            Use <code>GuardedChain</code> to wrap any chain with guardrails
          </li>
        </ul>
      </TLDRBox>

      <section>
        <AnchorLink id="protocol" level="h2">
          Guardrail Protocol
        </AnchorLink>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`interface Guardrail {
  name: string;
  checkInput(text: string): Promise<GuardrailResult>;
  checkOutput(text: string): Promise<GuardrailResult>;
}

type GuardrailResult =
  | { type: "passed" }
  | { type: "blocked"; reason: string }
  | { type: "modified"; newText: string; reason: string };`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`public protocol Guardrail: Sendable {
    var name: String { get }
    func checkInput(_ text: String) async throws -> GuardrailResult
    func checkOutput(_ text: String) async throws -> GuardrailResult
}

public enum GuardrailResult: Sendable {
    case passed
    case blocked(reason: String)
    case modified(newText: String, reason: String)
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`interface Guardrail {
    val name: String
    suspend fun checkInput(text: String): GuardrailResult
    suspend fun checkOutput(text: String): GuardrailResult
}

sealed class GuardrailResult {
    object Passed : GuardrailResult()
    data class Blocked(val reason: String) : GuardrailResult()
    data class Modified(val newText: String, val reason: String) : GuardrailResult()
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="input-length" level="h2">
          InputLengthGuardrail
        </AnchorLink>
        <p>
          Validates that input text does not exceed a maximum character count.
          Optionally truncates instead of blocking.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const guard = new InputLengthGuardrail({ maxCharacters: 500, truncate: false });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let guard = InputLengthGuardrail(maxCharacters: 500, truncate: false)`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val guard = InputLengthGuardrail(maxCharacters = 500, truncate = false)`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="content-filter" level="h2">
          ContentFilterGuardrail
        </AnchorLink>
        <p>
          Blocks input or output that matches any of the specified patterns.
          Useful for preventing sensitive data from being processed.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const filter = new ContentFilterGuardrail({ blockedPatterns: ["password", "SSN"] });`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let filter = ContentFilterGuardrail(blockedPatterns: ["password", "SSN"])`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val filter = ContentFilterGuardrail(blockedPatterns = listOf("password", "SSN"))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="guarded-chain" level="h2">
          GuardedChain
        </AnchorLink>
        <p>
          Wraps any chain with one or more guardrails. Input guardrails run
          before chain execution, output guardrails run after.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`const guarded = new GuardedChain({
  chain: new SummarizeChain({ model }),
  guardrails: [
    new InputLengthGuardrail({ maxCharacters: 1000 }),
    new ContentFilterGuardrail({ blockedPatterns: ["secret"] }),
  ],
});

const result = await guarded.invoke(new ChainInput({ text: input }));`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`let guarded = GuardedChain(
    chain: SummarizeChain(model: model),
    guardrails: [
        InputLengthGuardrail(maxCharacters: 1000),
        ContentFilterGuardrail(blockedPatterns: ["secret"])
    ]
)

let result = try await guarded.invoke(ChainInput(text: input))`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`val guarded = GuardedChain(
    chain = SummarizeChain(model = model),
    guardrails = listOf(
        InputLengthGuardrail(maxCharacters = 1000),
        ContentFilterGuardrail(blockedPatterns = listOf("secret"))
    )
)

val result = guarded.invoke(ChainInput(text = input))`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <section>
        <AnchorLink id="errors" level="h2">
          Error Handling
        </AnchorLink>
        <p>
          When a guardrail blocks input or output, it throws a{" "}
          <code>LocanaraError.invalidInput(reason:)</code>. Use a try/catch
          block to handle blocked content gracefully.
        </p>
        <LanguageTabs>
          {{
            typescript: (
              <CodeBlock language="typescript">{`try {
  const result = await guarded.invoke(new ChainInput({ text: input }));
  console.log(result.text);
} catch (error) {
  if (error instanceof LocanaraError && error.type === "invalidInput") {
    console.log(\`Guardrail blocked: \${error.reason}\`);
  } else {
    console.log(\`Unexpected error: \${error.message}\`);
  }
}`}</CodeBlock>
            ),
            swift: (
              <CodeBlock language="swift">{`do {
    let result = try await guarded.invoke(ChainInput(text: input))
    print(result.text)
} catch LocanaraError.invalidInput(let reason) {
    print("Guardrail blocked: \\(reason)")
} catch {
    print("Unexpected error: \\(error)")
}`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`try {
    val result = guarded.invoke(ChainInput(text = input))
    println(result.text)
} catch (e: LocanaraError.InvalidInput) {
    println("Guardrail blocked: \${e.reason}")
} catch (e: Exception) {
    println("Unexpected error: \${e.message}")
}`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
      </section>

      <p className="type-link">
        See: <Link to="/docs/apis">All APIs</Link>
      </p>

      <PageNavigation
        prev={{ to: "/docs/apis/memory", label: "Memory" }}
        next={{ to: "/docs/apis/session", label: "Session" }}
      />
    </div>
  );
}

export default GuardrailAPI;
