import { Link } from "react-router-dom";
import { SEO } from "../../components/SEO";
import PageNavigation from "../../components/docs/PageNavigation";
import CodeBlock from "../../components/docs/CodeBlock";

function WhyLocanara() {
  return (
    <div className="doc-page">
      <SEO
        title="Why Locanara?"
        description="Learn why Locanara is a framework for building on-device AI features — like LangChain, but for mobile. Composable chains, memory, guardrails, pipeline DSL."
        path="/docs/why-locanara"
      />
      <h1>Why Locanara?</h1>
      <p
        style={{
          fontSize: "1.1rem",
          color: "var(--text-secondary)",
          marginBottom: "2rem",
        }}
      >
        An on-device AI framework with composable chains — not another LLM
        wrapper.
      </p>

      <section>
        <h2 id="the-problem">The Problem</h2>
        <p>
          On-device AI capabilities are fragmented across platforms. iOS has
          Apple Intelligence with Foundation Models, and Android has Gemini Nano
          with ML Kit GenAI. Each platform has its own APIs, patterns, and
          limitations.
        </p>
        <p>
          Most existing solutions focus on giving you raw LLM access —{" "}
          <code>generateText()</code>, <code>streamText()</code> — and leave it
          to you to craft prompts, parse outputs, and handle edge cases.
          Locanara provides a <strong>framework</strong> with composable chains,
          memory management, guardrails, and a pipeline DSL so you can build
          production AI features — not just call a model.
        </p>
      </section>

      <section>
        <h2 id="our-approach">Framework, Not Just API</h2>
        <p>
          Like LangChain for cloud LLMs, Locanara gives you composable
          primitives — <strong>Chain, Memory, Guardrail, Pipeline</strong> — to
          build <em>your own</em> on-device AI features. You implement the{" "}
          <code>Chain</code> protocol, define your result type, and the
          framework handles prompt management, output parsing, composition, and
          execution.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Without a framework
            </p>
            <CodeBlock language="swift">{`// Manually craft prompts, parse output,
// handle errors, manage memory...
let prompt = "Analyze this food label..."
let raw = try await model.generate(prompt)
let json = try JSONDecoder().decode(...)
// No composition, no guardrails,
// no memory, no reuse`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              With Locanara
            </p>
            <CodeBlock language="swift">{`// Define your own Chain — like LangChain
struct FoodLabelChain: Chain {
  func invoke(_ input: ChainInput) async
    throws -> ChainOutput { ... }
}

// Compose, guard, execute
let result = try await model.pipeline {
    FoodLabel()
    Translate(to: "es")
}.run("Nutrition Facts: ...")`}</CodeBlock>
          </div>
        </div>

        <p>
          The key difference: Locanara is a{" "}
          <strong>framework for building AI features</strong>, not a wrapper
          around a model API. You define the AI logic, the framework provides
          the architecture.
        </p>
      </section>

      <section>
        <h2 id="built-in-chains">Built-in Chains (Samples & Utilities)</h2>
        <p>
          Locanara ships with <strong>7 built-in chains</strong> that serve two
          purposes: they're ready-to-use utilities for common tasks,{" "}
          <em>and</em> reference implementations showing how to build your own
          chains.
        </p>
        <ul>
          <li>
            <strong>SummarizeChain</strong> — Condense text into bullet points
          </li>
          <li>
            <strong>ClassifyChain</strong> — Categorize text with confidence
            scores
          </li>
          <li>
            <strong>ExtractChain</strong> — Pull entities with type, value,
            position
          </li>
          <li>
            <strong>ChatChain</strong> — Conversational AI with Memory support
          </li>
          <li>
            <strong>TranslateChain</strong> / <strong>RewriteChain</strong> /{" "}
            <strong>ProofreadChain</strong>
          </li>
        </ul>
        <p>
          These are just starting points. The real power is implementing the{" "}
          <code>Chain</code> protocol to create AI features specific to your app
          — content moderation, food label analysis, medical triage, or anything
          else.
        </p>
      </section>

      <section>
        <h2 id="built-for-constraints">Built for On-Device Constraints</h2>
        <p>
          On-device models operate under constraints that cloud models don't
          have. Locanara's framework layer is specifically designed to handle
          these.
        </p>

        <h3>Memory: Automatic Context Management</h3>
        <p>
          On-device models typically have a{" "}
          <strong>~4K token context window</strong> — roughly 50x smaller than
          cloud models like GPT-4. Without memory management, conversations
          break after just 5 turns because the full history won't fit in the
          prompt.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Without Memory
            </p>
            <CodeBlock language="swift">{`// Manual token management
var history: [String] = []
history.append(input)
history.append(response)

// Exceeds context window? Just truncate.
while estimateTokens(history) > 2000 {
    history.removeFirst() // Context lost
}`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              With SummaryMemory
            </p>
            <CodeBlock language="swift">{`// Older turns are auto-summarized,
// not just dropped
let memory = SummaryMemory(recentWindowSize: 4)

// Turn 1-6: full detail kept
// Turn 7+: older turns compressed
// "Previous summary: User asked about
//  travel plans to Tokyo..."
// [Turn 6 full] [Turn 7 full]`}</CodeBlock>
          </div>
        </div>
        <p>
          <code>SummaryMemory</code> uses the on-device model itself to compress
          older conversation turns into a summary, preserving context while
          staying within the token budget. This is unnecessary for 128K-token
          cloud models, but{" "}
          <strong>essential for 4K-token on-device models</strong>.
        </p>

        <h3>Guardrails: Input/Output Safety</h3>
        <p>
          On-device models have <strong>weaker built-in safety filters</strong>{" "}
          than cloud models. They also have strict input length limits. Without
          guardrails, you end up copy-pasting validation code across every AI
          feature.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Without Guardrails
            </p>
            <CodeBlock language="swift">{`// Repeated in every AI feature
if input.count > 4000 {
    input = String(input.prefix(4000))
}
if input.contains("password") {
    throw BlockedError()
}
let result = try await model.generate(input)
if result.contains("sensitive") {
    throw BlockedError()
}
// × 10 features = boilerplate hell`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              With GuardedChain
            </p>
            <CodeBlock language="swift">{`// Define once, apply to any chain
let safe = GuardedChain(
    chain: myFeatureChain,
    guardrails: [
        InputLengthGuardrail(maxCharacters: 4000),
        ContentFilterGuardrail(
            blockedPatterns: ["password", "SSN"]
        )
    ]
)
// ✓ Auto-truncates long input
// ✓ Blocks sensitive input & output
// ✓ Reusable across all features`}</CodeBlock>
          </div>
        </div>
        <p>
          Guardrails wrap any chain with automatic{" "}
          <strong>pre-execution</strong> (input validation, truncation) and{" "}
          <strong>post-execution</strong> (output filtering) checks — defined
          once, applied everywhere.
        </p>
      </section>

      <section>
        <h2 id="schema-driven">Schema-Driven Cross-Platform Types</h2>
        <p>
          Locanara uses a{" "}
          <strong>GraphQL schema as the single source of truth</strong> for all
          types across iOS (Swift), Android (Kotlin), and TypeScript. This
          means:
        </p>
        <ul>
          <li>
            Every platform gets the exact same type definitions — not
            hand-written copies that drift apart
          </li>
          <li>
            Adding a new field to a result type updates all platforms at once
          </li>
          <li>
            IDE autocompletion works identically whether you're writing Swift,
            Kotlin, or TypeScript
          </li>
        </ul>
        <p>
          Most cross-platform SDKs maintain separate type definitions per
          platform. Locanara generates them from a shared schema, guaranteeing
          consistency.
        </p>
      </section>

      <section>
        <h2 id="before-after">Before & After: Real Code</h2>
        <p>
          Here's what summarization looks like with raw platform APIs vs.
          Locanara:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Raw Foundation Models (iOS)
            </p>
            <CodeBlock language="swift">{`import FoundationModels

let session = LanguageModelSession()
let prompt = """
Summarize this text in 3 bullet points.
Return JSON: {"summary": "..."}
Text: \\(userText)
"""
let response = try await session
  .respond(to: prompt)
let raw = response.content
// Now manually parse the JSON...
// Handle malformed output...
// No composition, no memory...`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              Locanara
            </p>
            <CodeBlock language="swift">{`import Locanara

let result = try await SummarizeChain(
    bulletCount: 3
).run(userText)

print(result.summary)
// Typed result — no parsing needed
// Composable with Pipeline & Guardrails
// Works identically on Android`}</CodeBlock>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "1.5rem 0",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Raw ML Kit GenAI (Android)
            </p>
            <CodeBlock language="kotlin">{`import com.google.mlkit.genai.summarization

val summarizer = Summarization.getClient(
    SummarizationRequest.builder()
        .setInputType(InputType.ARTICLE)
        .setOutputType(OutputType.BULLETS)
        .setLength(Length.SHORT)
        .build()
)
summarizer.check().addOnSuccessListener {
    if (it.isAvailable) {
        summarizer.run("text")
            .addOnSuccessListener { r ->
                // Callback-based, no coroutines
                // Platform-specific API surface
            }
    }
}`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              Locanara
            </p>
            <CodeBlock language="kotlin">{`import com.locanara.builtin.SummarizeChain

val result = SummarizeChain(
    bulletCount = 3
).run(userText)

println(result.summary)
// suspend function — native coroutines
// Same API shape as iOS
// Compose with Pipeline & Guardrails`}</CodeBlock>
          </div>
        </div>
      </section>

      <section>
        <h2 id="how-we-compare">How We Compare</h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--border-color)",
                  textAlign: "left",
                }}
              >
                <th scope="col" style={{ padding: "0.75rem 1rem" }}>
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" style={{ padding: "0.75rem 1rem" }}>
                  Locanara
                </th>
                <th scope="col" style={{ padding: "0.75rem 1rem" }}>
                  Generic LLM SDKs
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Architecture",
                  "Layered framework (Chain, Memory, Guardrail, Pipeline)",
                  "Flat API wrapper",
                ],
                [
                  "API style",
                  "Composable chains + Pipeline DSL + convenience methods",
                  "Generic (generateText, streamText)",
                ],
                [
                  "Output format",
                  "Compile-time typed results (your custom types)",
                  "Raw text / unstructured JSON",
                ],
                [
                  "Extensibility",
                  "Implement Chain protocol for custom features",
                  "Limited to model API surface",
                ],
                [
                  "Composition",
                  "Pipeline DSL, SequentialChain, GuardedChain",
                  "Manual chaining",
                ],
                [
                  "Memory",
                  "BufferMemory, SummaryMemory (built-in)",
                  "Not included",
                ],
                [
                  "Backend",
                  "OS-native AI (Apple Intelligence, Gemini Nano)",
                  "Downloaded models (GGUF, ONNX, etc.) or OS AI",
                ],
              ].map(([aspect, locanara, others], i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontWeight: 600,
                    }}
                  >
                    {aspect}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{locanara}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="when-to-use">When to Use Locanara</h2>
        <p>
          <strong>Locanara is the right choice when:</strong>
        </p>
        <ul>
          <li>
            You want to build custom on-device AI features with a structured
            framework (chains, memory, guardrails, pipelines)
          </li>
          <li>
            Privacy matters — all data stays on-device, no cloud dependency
          </li>
          <li>
            You're building for both iOS and Android and want consistent
            architecture
          </li>
          <li>
            You want composable, reusable AI logic — not scattered prompts
          </li>
        </ul>
        <p>
          <strong>Consider other solutions when:</strong>
        </p>
        <ul>
          <li>
            You need cloud-hosted models or GPU clusters — Locanara runs
            on-device only
          </li>
          <li>You need raw text generation with full prompt control</li>
          <li>
            You're already using Vercel AI SDK and want drop-in on-device
            support
          </li>
        </ul>
      </section>

      <section>
        <h2 id="platform-support">Platform Support</h2>
        <ul>
          <li>
            <strong>iOS:</strong> Apple Intelligence (iOS 26+) + llama.cpp with
            GGUF models (iOS 17+)
          </li>
          <li>
            <strong>Android:</strong> Gemini Nano with ML Kit GenAI (Android
            14+, API 34+)
          </li>
        </ul>
      </section>

      <section>
        <h2 id="zero-cost">Zero Cost, No Lock-In</h2>
        <p>
          Locanara is completely free and open source. No API keys, no usage
          fees, no vendor lock-in. Because it uses OS-native AI capabilities,
          there are no ongoing costs — the AI runtime is already on your users'
          devices.
        </p>
      </section>

      <section>
        <h2 id="built-by-experts">Built by Open Source Maintainers</h2>
        <p>
          Locanara is built by maintainers of{" "}
          <a
            href="https://github.com/hyodotdev/openiap"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenIAP
          </a>
          , an open source in-app purchase framework funded by{" "}
          <a href="https://meta.com" target="_blank" rel="noopener noreferrer">
            Meta
          </a>
          . OpenIAP powers libraries like{" "}
          <a
            href="https://github.com/hyochan/react-native-iap"
            target="_blank"
            rel="noopener noreferrer"
          >
            react-native-iap
          </a>
          ,{" "}
          <a
            href="https://github.com/hyochan/flutter_inapp_purchase"
            target="_blank"
            rel="noopener noreferrer"
          >
            flutter_inapp_purchase
          </a>
          , and{" "}
          <a
            href="https://github.com/hyochan/expo-iap"
            target="_blank"
            rel="noopener noreferrer"
          >
            expo-iap
          </a>
          . We've learned a lot from bridging fragmented platform APIs into
          consistent interfaces, and Locanara applies those lessons to on-device
          AI.
        </p>
      </section>

      <section>
        <h2 id="getting-started">Getting Started</h2>
        <p>
          Ready to add on-device AI to your app? Set up the SDK and explore the
          feature tutorials:
        </p>
        <ul style={{ marginTop: "1rem" }}>
          <li>
            <Link to="/docs/ios-setup">iOS Setup Guide</Link>
          </li>
          <li>
            <Link to="/docs/android-setup">Android Setup Guide</Link>
          </li>
          <li>
            <Link to="/docs/tutorials">Feature Tutorials</Link>
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/introduction", label: "Introduction" }}
        next={{ to: "/docs/types", label: "Types" }}
      />
    </div>
  );
}

export default WhyLocanara;
