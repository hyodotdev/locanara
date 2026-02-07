import { Link } from "react-router-dom";
import SEO from "../../components/SEO";
import PageNavigation from "../../components/PageNavigation";
import CodeBlock from "../../components/CodeBlock";

function WhyLocanara() {
  return (
    <div className="doc-page">
      <SEO
        title="Why Locanara?"
        description="Learn why Locanara takes a task-specific approach to on-device AI instead of generic LLM wrappers. Structured outputs, cross-platform type safety, and zero cloud dependency."
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
        On-device AI features your app can use directly — not another LLM
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
          to you to craft prompts, parse outputs, and handle edge cases. This
          means every app reinvents the same patterns: writing prompt templates,
          validating JSON responses, normalizing confidence scores across
          platforms.
        </p>
      </section>

      <section>
        <h2 id="our-approach">Task-Specific, Not Generic</h2>
        <p>
          Locanara takes a fundamentally different approach. Instead of exposing
          a generic LLM interface, we provide{" "}
          <strong>task-specific APIs with structured outputs</strong>.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
              Generic LLM approach
            </p>
            <CodeBlock language="typescript">{`const result = await generateText({
  prompt: "Classify this text into
    one of: spam, ham, promo.
    Return JSON with label
    and confidence..."
});
// result.text = '{"label":"spam"...}'
// Hope it's valid JSON...
const parsed = JSON.parse(result.text);`}</CodeBlock>
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              Locanara approach
            </p>
            <CodeBlock language="typescript">{`const result = await classify(text, {
  categories: ["spam", "ham", "promo"],
});
// result.label = "spam"
// result.score = 0.94
// Always typed, always structured`}</CodeBlock>
          </div>
        </div>

        <p>
          Every Locanara API returns <strong>structured, typed results</strong>{" "}
          — confidence scores, position tracking, correction details — not raw
          text you need to parse yourself.
        </p>
      </section>

      <section>
        <h2 id="structured-outputs">Structured Outputs You Can Use</h2>
        <p>
          Each feature returns data your app can use directly, without
          post-processing:
        </p>
        <ul>
          <li>
            <strong>classify()</strong> — Returns <code>label</code> and{" "}
            <code>score</code> (0–1 normalized confidence)
          </li>
          <li>
            <strong>extract()</strong> — Returns entities with <code>type</code>
            , <code>value</code>, and <code>position</code> in the original text
          </li>
          <li>
            <strong>proofread()</strong> — Returns an array of{" "}
            <code>corrections</code> with original text, corrected text,
            correction type, and position
          </li>
          <li>
            <strong>summarize()</strong> — Returns structured bullet points, not
            a blob of text
          </li>
          <li>
            <strong>chat()</strong> — Returns response with{" "}
            <code>suggestedPrompts</code> for follow-up conversations
          </li>
        </ul>
        <p>
          This matters because real apps need structured data to render UI — a
          spellchecker needs positions to underline errors, a classifier needs
          scores to set thresholds, an extractor needs entity types to display
          badges.
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
                <th style={{ padding: "0.75rem 1rem" }}></th>
                <th style={{ padding: "0.75rem 1rem" }}>Locanara</th>
                <th style={{ padding: "0.75rem 1rem" }}>Generic LLM SDKs</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "API style",
                  "Task-specific (summarize, classify, extract…)",
                  "Generic (generateText, streamText)",
                ],
                [
                  "Output format",
                  "Structured types with scores, positions",
                  "Raw text / unstructured JSON",
                ],
                [
                  "Type system",
                  "GraphQL schema → Swift, Kotlin, TS",
                  "Per-platform type definitions",
                ],
                [
                  "Backend",
                  "OS-native AI (Apple Intelligence, Gemini Nano)",
                  "Downloaded models (GGUF, ONNX, etc.) or OS AI",
                ],
                [
                  "App size impact",
                  "< 5 MB (no bundled models)",
                  "Varies (model download required separately)",
                ],
                [
                  "Custom models",
                  "No (OS models only)",
                  "Yes (download and customize your own model)",
                ],
                [
                  "Execution tracking",
                  "Built-in history, context, state events",
                  "Usually not included",
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
            You want to add AI features (summarization, classification,
            extraction) to your app without managing prompts and parsing
          </li>
          <li>
            Privacy matters — all data stays on-device, no cloud dependency
          </li>
          <li>
            You're building for both iOS and Android and want consistent
            behavior
          </li>
          <li>
            You want minimal app size impact — no separate model downloads
          </li>
        </ul>
        <p>
          <strong>Consider other solutions when:</strong>
        </p>
        <ul>
          <li>
            You need to run custom fine-tuned models — Locanara uses OS-provided
            models only
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
            <strong>iOS:</strong> Apple Intelligence with Foundation Models (iOS
            26+)
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
          Ready to add on-device AI to your app? Check out our platform-specific
          tutorials:
        </p>
        <ul style={{ marginTop: "1rem" }}>
          <li>
            <Link to="/docs/tutorials/ios">iOS SDK Tutorial</Link>
          </li>
          <li>
            <Link to="/docs/tutorials/android">Android SDK Tutorial</Link>
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
