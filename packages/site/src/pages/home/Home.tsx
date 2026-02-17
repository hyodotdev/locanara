import { Link } from "react-router-dom";
import { SEO } from "../../components/SEO";
import { motion } from "framer-motion";
import { Button } from "../../components/uis/Button";
import { Card } from "../../components/uis/Card";
import { CodeBlock } from "../../components/uis/CodeBlock";
import {
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  Github,
  ChevronDown,
  Database,
  Sparkles,
  Lock,
  Link as LinkIcon,
  Brain,
  ShieldCheck,
  Layers,
  Bot,
  Workflow,
} from "lucide-react";
import { useState } from "react";

const faqData = [
  {
    question: "What is Locanara?",
    answer:
      "Locanara is an on-device AI framework for iOS and Android, inspired by LangChain. It provides composable chains, memory management, guardrails, pipeline DSL, and an autonomous agent — all running entirely on-device using Apple Intelligence and Gemini Nano.",
  },
  {
    question: "How is Locanara different from LangChain?",
    answer:
      "LangChain is designed for cloud LLMs (OpenAI, Anthropic, etc.) while Locanara is purpose-built for on-device AI. Locanara uses the same composable concepts (chains, memory, tools, agents) but targets platform-native models like Apple Intelligence and Gemini Nano — no cloud, no API keys, complete privacy.",
  },
  {
    question: "Does Locanara send data to the cloud?",
    answer:
      "No. Locanara is designed with privacy-first principles. All AI processing happens entirely on the user's device. There is no cloud fallback, and no user data ever leaves the device.",
  },
  {
    question: "Which platforms does Locanara support?",
    answer:
      "Locanara supports iOS (Apple Intelligence on iOS 26+ and llama.cpp with downloadable GGUF models on iOS 17+) and Android (Gemini Nano & ML Kit GenAI on Android 14+). The SDK provides a unified API across both platforms.",
  },
  {
    question: "What are the device requirements?",
    answer:
      "For iOS, Locanara supports iOS 17+ with downloadable GGUF models (llama.cpp engine) and iOS 26+ with Apple Intelligence. The RouterModel auto-selects the best available engine. For Android, it requires Android 14+ with Gemini Nano support.",
  },
  {
    question: "Does Locanara work offline?",
    answer:
      "Yes. Since all AI processing happens on-device, Locanara works completely offline without any internet connection.",
  },
  {
    question: "How much does Locanara cost?",
    answer:
      "Locanara is completely free and open-source under the AGPL-3.0 license. There are no paid tiers, no per-API-call fees, and no usage limits.",
  },
  {
    question: "Can I build custom AI features with Locanara?",
    answer:
      "Yes. Locanara is a framework, not just a set of utility functions. You can implement the Chain protocol to build any custom AI feature, compose chains with the Pipeline DSL, add memory for multi-turn conversations, and use guardrails for input/output validation.",
  },
  {
    question: "Can I use Locanara in production apps?",
    answer:
      "Yes. Locanara is designed for production use. The SDK is free and open-source under the AGPL-3.0 license.",
  },
  {
    question: "Is Locanara GDPR and CCPA compliant?",
    answer:
      "Yes. Since Locanara processes all data on-device and never transmits user data to external servers, it is compliant with GDPR, CCPA, and other privacy regulations by design.",
  },
];

export function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <>
      <SEO path="/" faq={faqData} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background-secondary/50 to-transparent dark:from-background-dark-secondary/50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              On-Device AI <span className="text-accent">Framework</span> for
              Mobile
            </h1>
            <p className="mt-6 text-lg text-text-secondary dark:text-text-dark-secondary text-balance">
              LangChain-style composable chains, memory, guardrails, and
              pipeline DSL — all running on-device. Free and open-source.
            </p>

            {/* CTA Section */}
            <div className="mt-10 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://github.com/hyodotdev/locanara"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg">
                    <Github className="w-4 h-4 mr-2" />
                    Star on GitHub
                  </Button>
                </a>
                <Link to="/docs">
                  <Button size="lg" variant="outline">
                    Read Docs
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Free and open-source under AGPL-3.0
              </p>
            </div>

            {/* Tagline */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
              <span>Open source</span>
              <span className="text-primary/30 dark:text-white/30">•</span>
              <span>Privacy-first</span>
              <span className="text-primary/30 dark:text-white/30">•</span>
              <span>On-device</span>
              <span className="text-primary/30 dark:text-white/30">•</span>
              <span>Cross-platform</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Framework Architecture Section */}
      <section className="py-20 bg-background-secondary dark:bg-background-dark-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Composable AI Framework
            </h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              Build production AI features with composable building blocks, not
              just utility functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: LinkIcon,
                title: "Chain",
                description:
                  "Composable units of AI logic. Implement the Chain protocol to build any custom feature, or use 7 built-in chains out of the box.",
                href: "/docs/apis/chain",
              },
              {
                icon: Workflow,
                title: "Pipeline DSL",
                description:
                  "Compose chains with compile-time type safety. Chain operations together in a fluent, declarative syntax.",
                href: "/docs/apis/pipeline",
              },
              {
                icon: Brain,
                title: "Memory",
                description:
                  "BufferMemory (last N turns) and SummaryMemory (compressed history) for multi-turn conversation context.",
                href: "/docs/apis/memory",
              },
              {
                icon: ShieldCheck,
                title: "Guardrail",
                description:
                  "Input/output validation and content filtering. Enforce length limits, block harmful content, and sanitize outputs.",
                href: "/docs/apis/guardrail",
              },
              {
                icon: Bot,
                title: "Agent",
                description:
                  "ReAct-lite autonomous agent with tool use. The agent reasons about tasks and calls tools to accomplish goals.",
                href: "/docs/apis/agent",
              },
              {
                icon: Layers,
                title: "Session",
                description:
                  "Stateful conversation management with automatic memory, history tracking, and context window management.",
                href: "/docs/apis/session",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Link to={item.href} className="block h-full">
                  <Card className="p-6 h-full hover:border-accent/50 transition-colors">
                    <item.icon className="w-8 h-8 text-accent mb-3" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                      {item.description}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Levels of API Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Three Levels of API
            </h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              From one-liners to fully custom AI features — choose the level of
              control you need.
            </p>
          </div>

          <div className="space-y-8">
            {/* Level 1: Simple */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  1
                </span>
                <div>
                  <h3 className="font-semibold">
                    Simple — One-liner convenience
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Model extensions for quick integration
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CodeBlock
                  title="Swift"
                  language="swift"
                  code={`let summary = try await model.summarize("Long article text...")
let translated = try await model.translate("Hello", to: "ko")`}
                />
                <CodeBlock
                  title="Kotlin"
                  language="kotlin"
                  code={`val summary = model.summarize("Long article text...")
val translated = model.translate("Hello", to = "ko")`}
                />
              </div>
            </motion.div>

            {/* Level 2: Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  2
                </span>
                <div>
                  <h3 className="font-semibold">
                    Chain — Configurable built-in chains
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    7 ready-to-use chains with full configuration
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CodeBlock
                  title="Swift"
                  language="swift"
                  code={`let chain = SummarizeChain(model: model, bulletCount: 3)
let result = try await chain.run("Long article text...")
print(result.summary)

// Pipeline: compose chains together
let pipeline = model.pipeline {
    ProofreadChain()
    TranslateChain(to: "ko")
}
let output = try await pipeline.run("Text with typos")`}
                />
                <CodeBlock
                  title="Kotlin"
                  language="kotlin"
                  code={`val chain = SummarizeChain(model = model, bulletCount = 3)
val result = chain.run("Long article text...")
println(result.summary)

// Chat with memory
val memory = BufferMemory()
val chat = ChatChain(model = model, memory = memory)
val r1 = chat.run("What is Kotlin?")
val r2 = chat.run("Compare it to Swift?")`}
                />
              </div>
            </motion.div>

            {/* Level 3: Custom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  3
                </span>
                <div>
                  <h3 className="font-semibold">
                    Custom — Build your own chains
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Implement the Chain protocol for app-specific AI features
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CodeBlock
                  title="Swift"
                  language="swift"
                  code={`struct SentimentChain: Chain {
    let model: LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = PromptTemplate("Analyze sentiment: {text}")
        let response = try await model.generate(
            prompt.format(["text": input.text])
        )
        return ChainOutput(["sentiment": response])
    }
}

// Use it like any built-in chain
let result = try await SentimentChain(model: model)
    .run("I love this product!")`}
                />
                <CodeBlock
                  title="Kotlin"
                  language="kotlin"
                  code={`class SentimentChain(
    val model: LocanaraModel
) : Chain {
    override suspend fun invoke(
        input: ChainInput
    ): ChainOutput {
        val prompt = PromptTemplate("Analyze sentiment: {text}")
        val response = model.generate(
            prompt.format(mapOf("text" to input.text))
        )
        return ChainOutput(mapOf("sentiment" to response))
    }
}

// Use it like any built-in chain
val result = SentimentChain(model = model)
    .run("I love this product!")`}
                />
              </div>
            </motion.div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              Read the full documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Built-in Chains Section */}
      <section className="py-20 bg-background-secondary dark:bg-background-dark-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              7 Built-in Chains
            </h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              Ready-to-use chains that also serve as reference implementations
              for building your own.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                title: "SummarizeChain",
                desc: "Text summarization",
                href: "/docs/utils/summarize",
              },
              {
                title: "ClassifyChain",
                desc: "Text classification",
                href: "/docs/utils/classify",
              },
              {
                title: "ExtractChain",
                desc: "Entity extraction",
                href: "/docs/utils/extract",
              },
              {
                title: "ChatChain",
                desc: "Conversational AI",
                href: "/docs/utils/chat",
              },
              {
                title: "TranslateChain",
                desc: "Multi-language translation",
                href: "/docs/utils/translate",
              },
              {
                title: "RewriteChain",
                desc: "Text rewriting",
                href: "/docs/utils/rewrite",
              },
              {
                title: "ProofreadChain",
                desc: "Grammar correction",
                href: "/docs/utils/proofread",
              },
            ].map((chain, index) => (
              <motion.div
                key={chain.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link to={chain.href} className="block">
                  <Card className="p-4 h-full hover:border-accent/50 transition-colors">
                    <h3 className="font-mono font-semibold text-sm text-accent mb-1">
                      {chain.title}
                    </h3>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                      {chain.desc}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Locanara Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Why Locanara?</h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              The only composable AI framework designed for on-device inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Smartphone,
                title: "On-Device Only",
                description:
                  "All AI processing happens locally. No cloud fallback, no data leaves the device.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description:
                  "GDPR and CCPA compliant by design. Zero data collection, zero network calls.",
              },
              {
                icon: Zap,
                title: "Native Performance",
                description:
                  "Apple Intelligence and Gemini Nano — hardware-accelerated AI built into the OS.",
              },
              {
                icon: Github,
                title: "Open Source",
                description:
                  "Free under AGPL-3.0. No API keys, no usage limits, no vendor lock-in.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full">
                  <feature.icon className="w-8 h-8 text-accent mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 bg-background-secondary dark:bg-background-dark-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Advanced Capabilities
            </h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              Beyond chains — enterprise-grade features included for free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full border-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Database className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Private RAG</h3>
                  </div>
                </div>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                  Build document-based AI answers entirely on-device. Index user
                  documents, search with semantic similarity, and generate
                  context-aware responses.
                </p>
                <ul className="space-y-2 text-sm text-text-secondary dark:text-text-dark-secondary">
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    100% on-device — documents never leave
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    SQLite vector store (~100KB per 1000 chunks)
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    Multilingual embedding support
                  </li>
                </ul>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full border-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Personalization</h3>
                  </div>
                </div>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                  AI that adapts to individual user preferences through
                  automatic prompt tuning. Learn from feedback to optimize
                  response style, length, and format.
                </p>
                <ul className="space-y-2 text-sm text-text-secondary dark:text-text-dark-secondary">
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    Feedback-based learning (thumbs up/down)
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    Lightweight storage (&lt;100KB)
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    Per-user preference profiles
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform SDKs Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Platform SDKs</h2>
            <p className="mt-3 text-text-secondary dark:text-text-dark-secondary">
              Same framework architecture, native platform implementations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.a
              href="https://github.com/hyodotdev/locanara/tree/main/packages/apple"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full hover:border-accent/50 transition-colors">
                <h3 className="font-semibold mb-1">iOS / macOS</h3>
                <p className="text-xs font-mono text-accent mb-2">
                  packages/apple
                </p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Apple Intelligence & Foundation Models + llama.cpp (GGUF)
                </p>
              </Card>
            </motion.a>

            <motion.a
              href="https://github.com/hyodotdev/locanara/tree/main/packages/android"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full hover:border-accent/50 transition-colors">
                <h3 className="font-semibold mb-1">Android</h3>
                <p className="text-xs font-mono text-accent mb-2">
                  packages/android
                </p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Gemini Nano & ML Kit GenAI
                </p>
              </Card>
            </motion.a>

            <motion.a
              href="https://github.com/hyodotdev/locanara/tree/main/packages/web"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full hover:border-accent/50 transition-colors">
                <h3 className="font-semibold mb-1">Web</h3>
                <p className="text-xs font-mono text-accent mb-2">
                  packages/web
                </p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Chrome Built-in AI (Gemini Nano)
                </p>
              </Card>
            </motion.a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background-secondary dark:bg-background-dark-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-text-secondary dark:text-text-dark-secondary flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary dark:bg-background-dark-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-text-dark-primary">
            Ready to build with on-device AI?
          </h2>
          <p className="mt-4 text-white/70 dark:text-text-dark-secondary">
            Get started with Locanara — free and open-source, forever.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com/hyodotdev/locanara"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                <Github className="w-5 h-5 mr-2" />
                Star on GitHub
              </Button>
            </a>
            <Link to="/docs">
              <Button variant="secondary" size="lg">
                Start Building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
