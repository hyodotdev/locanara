import { Link } from "react-router-dom";
import { Apple, Smartphone, Globe } from "lucide-react";
import { SEO } from "../../components/SEO";
import CodeBlock from "../../components/docs/CodeBlock";
import LanguageTabs from "../../components/docs/LanguageTabs";
import PageNavigation from "../../components/docs/PageNavigation";

function Introduction() {
  return (
    <div className="doc-page">
      <SEO
        title="Introduction"
        description="Locanara - An on-device AI framework inspired by LangChain. Build custom AI features with composable chains, memory, guardrails, and pipeline DSL."
        path="/docs/introduction"
        keywords="Locanara, on-device AI, Apple Intelligence, Gemini Nano, Chrome Built-in AI"
      />
      <h1>Introduction</h1>
      <p>
        Locanara is an on-device AI framework inspired by LangChain, built for
        iOS and Android. It provides composable chains, memory management,
        guardrails, and a pipeline DSL for building production AI features using
        platform-native models. All processing happens locally on-device.
      </p>

      <section>
        <h2 id="core-principles">Core Principles</h2>
        <ul>
          <li>
            <strong>On-Device Only</strong> - All AI processing happens locally.
            No cloud fallback.
          </li>
          <li>
            <strong>Privacy First</strong> - User data never leaves the device.
          </li>
          <li>
            <strong>Framework, Not Just API</strong> - Composable chains,
            memory, guardrails, and pipeline DSL for building custom AI
            features.
          </li>
        </ul>
      </section>

      <section>
        <h2 id="quick-start">Quick Start</h2>
        <p>
          Copy-paste and run — no configuration needed on iOS, one line of setup
          on Android:
        </p>
        <LanguageTabs>
          {{
            swift: (
              <CodeBlock language="swift">{`import Locanara

// Summarize — one line
let result = try await SummarizeChain().run("Your long article text here...")
print(result.summary)

// Translate — one line
let translated = try await TranslateChain(targetLanguage: "ko").run("Hello, world!")
print(translated.translatedText)

// Pipeline — chain multiple operations
let result = try await FoundationLanguageModel().pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ther are erors in this sentance.")`}</CodeBlock>
            ),
            kotlin: (
              <CodeBlock language="kotlin">{`import com.locanara.*

// One-time setup (in Application.onCreate or similar)
LocanaraDefaults.model = PromptApiModel(context)

// Summarize — one line
val result = SummarizeChain().run("Your long article text here...")
println(result.summary)

// Translate — one line
val translated = TranslateChain(targetLanguage = "ko").run("Hello, world!")
println(translated.translatedText)

// Pipeline — chain multiple operations
val result = LocanaraDefaults.model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ther are erors in this sentance.")`}</CodeBlock>
            ),
          }}
        </LanguageTabs>
        <p
          style={{
            marginTop: "1rem",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
          }}
        >
          That's it. No API keys, no cloud calls. All processing happens
          on-device. On iOS 26+, Apple Intelligence works instantly. On older
          devices, download a GGUF model via the ModelManager.
        </p>
      </section>

      <section>
        <h2 id="supported-platforms">Supported Platforms</h2>
        <div className="api-cards-grid three-columns">
          <Link to="/docs/ios-setup" className="api-card">
            <div className="api-card-icon">
              <Apple className="w-6 h-6" />
            </div>
            <h3>iOS / macOS</h3>
            <p>
              Apple Intelligence + llama.cpp (GGUF)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                iOS 17+ / macOS 15+
              </span>
            </p>
          </Link>

          <Link to="/docs/android-setup" className="api-card">
            <div className="api-card-icon">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3>Android</h3>
            <p>
              Gemini Nano (ML Kit GenAI)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Android 14+ (API 34+)
              </span>
            </p>
          </Link>

          <Link to="/docs/web-setup" className="api-card">
            <div className="api-card-icon">
              <Globe className="w-6 h-6" />
            </div>
            <h3>Web</h3>
            <p>
              Chrome Built-in AI (Gemini Nano)
              <br />
              <span
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Chrome 128+
              </span>
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 id="features">Built-in Chains (Samples)</h2>

        <p className="feature-subtitle">
          7 built-in chains ship as utilities and reference implementations.
          Build your own by implementing the Chain protocol.
        </p>
        <table>
          <thead>
            <tr>
              <th>Built-in Chain</th>
              <th className="text-center">iOS</th>
              <th className="text-center">Android</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "SummarizeChain", ios: true, android: true },
              { name: "ClassifyChain", ios: true, android: true },
              { name: "ExtractChain", ios: true, android: true },
              { name: "ChatChain", ios: true, android: true },
              { name: "TranslateChain", ios: true, android: true },
              { name: "RewriteChain", ios: true, android: true },
              { name: "ProofreadChain", ios: true, android: true },
            ].map((feature) => (
              <tr key={feature.name}>
                <td>{feature.name}</td>
                <td className="text-center">{feature.ios ? "✓" : "—"}</td>
                <td className="text-center">{feature.android ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 id="get-started">Get Started</h2>
        <p>Choose your platform to begin:</p>
        <ul>
          <li>
            <Link to="/docs/ios-setup">
              <strong>iOS Setup Guide</strong>
            </Link>{" "}
            - Apple Intelligence + llama.cpp
          </li>
          <li>
            <Link to="/docs/android-setup">
              <strong>Android Setup Guide</strong>
            </Link>{" "}
            - Gemini Nano with ML Kit
          </li>
          <li>
            <Link to="/docs/tutorials">
              <strong>Feature Tutorials</strong>
            </Link>{" "}
            - Summarize, Classify, Chat, and more
          </li>
        </ul>
      </section>

      <PageNavigation next={{ to: "/docs/ios-setup", label: "iOS Setup" }} />
    </div>
  );
}

export default Introduction;
