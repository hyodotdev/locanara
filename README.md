# Locanara

![Locanara](logo.png)

On-Device AI Framework for iOS and Android

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

Locanara is an on-device AI framework inspired by LangChain, purpose-built for mobile. Build, compose, and extend AI features using platform-native models — all processing happens locally on the device.

No cloud. No data leaves. Privacy by design.

**Documentation**: [locanara.dev](https://locanara.dev)

---

## Supported Platforms

### iOS / macOS

| Engine | Description | Requirements |
|--------|-------------|--------------|
| Apple Intelligence | OS-level Foundation Models | iOS 26+ / macOS 26+, Apple Silicon |
| llama.cpp | GGUF models with Metal GPU acceleration | iOS 17+ / macOS 14+, Apple Silicon |
| CoreML | Neural Engine accelerated inference | iOS 17+ / macOS 14+, Apple Silicon |
| MLX | Apple Silicon optimized inference | macOS 14+, Apple Silicon |

### Android

| Engine | Description | Requirements |
|--------|-------------|--------------|
| Gemini Nano | ML Kit GenAI (Prompt API) | Android 14+ (API 34+) |
| ExecuTorch | Meta's on-device inference runtime | Android 12+ (API 31+) |

> Locanara automatically detects device capabilities and routes inference to the best available engine.

---

## Why Locanara?

Most on-device AI SDKs give you raw model access. Locanara gives you a **framework** — composable chains, memory management, guardrails, and a pipeline DSL — so you can build production AI features, not just call a model.

### Three Levels of API

1. **Simple** — One-liner convenience methods for common tasks
2. **Chain** — Configurable built-in chains with typed results
3. **Custom** — Implement the Chain protocol for app-specific AI features

### Architecture

```text
┌─────────────────────────────────────────────┐
│  Runtime Layer                              │
│  Agent · Session · ChainExecutor            │
├─────────────────────────────────────────────┤
│  Built-in Chains                            │
│  Summarize · Classify · Chat · Translate ·  │
│  Extract · Rewrite · Proofread              │
├─────────────────────────────────────────────┤
│  Composable Layer                           │
│  Chain · Tool · Memory · Guardrail          │
├─────────────────────────────────────────────┤
│  Core Layer                                 │
│  LocanaraModel · PromptTemplate ·           │
│  OutputParser · Schema                      │
├─────────────────────────────────────────────┤
│  Engine Layer                               │
│  InferenceRouter · DeviceCapabilityDetector │
├─────────────────────────────────────────────┤
│  Platform Layer                             │
│  Apple Intelligence · llama.cpp · CoreML ·  │
│  MLX · Gemini Nano · ExecuTorch             │
└─────────────────────────────────────────────┘
```

---

## Installation

**iOS (Swift Package Manager)**

```text
https://github.com/hyodotdev/locanara
```

**Android (Gradle)**

```groovy
implementation("com.locanara:locanara:1.0.0")
```

---

## Key Features

### Framework Layer

- **Chain** — Composable unit of AI logic with typed input/output
- **Pipeline DSL** — Compose chains with compile-time type safety
- **Memory** — BufferMemory (last N turns) and SummaryMemory (compressed history)
- **Guardrail** — Input/output validation and content filtering
- **Tool** — External capability integration for agents

### Built-in Chains

7 ready-to-use chains, each returning typed results:

| Chain | Result Type | Description |
|-------|-------------|-------------|
| SummarizeChain | SummarizeResult | Text summarization |
| ClassifyChain | ClassifyResult | Text classification |
| ExtractChain | ExtractResult | Entity extraction |
| ChatChain | ChatResult | Conversational AI with memory |
| TranslateChain | TranslateResult | Language translation |
| RewriteChain | RewriteResult | Text rewriting by style |
| ProofreadChain | ProofreadResult | Grammar correction |

### Engine System

- **InferenceEngine** — Unified protocol for all inference backends
- **InferenceRouter** — Automatic engine selection based on device capabilities
- **DeviceCapabilityDetector** — Hardware detection (NPU, memory, chipset)
- **MemoryManager** — Intelligent memory allocation for model loading

### Model Management

- **ModelManager** — Download, load, and manage on-device models
- **ModelRegistry** — Available model catalog with metadata
- **ModelDownloader** — Background download with progress tracking
- **ModelStorage** — Local storage and cache management

### RAG (Retrieval-Augmented Generation)

- **VectorStore** — Local vector storage for embeddings
- **DocumentChunker** — Text splitting with configurable strategies
- **EmbeddingEngine** — On-device embedding generation
- **RAGQueryEngine** — Similarity search and context retrieval

### Personalization

- **FeedbackCollector** — Collect user feedback on AI outputs
- **PreferenceAnalyzer** — Learn user preferences over time
- **PromptOptimizer** — Adapt prompts based on user behavior

### Runtime Layer

- **ChainExecutor** — Instrumented execution with retry and history
- **Session** — Stateful conversation management
- **Agent** — ReAct-lite autonomous agent with tools

---

## Packages

- [**apple**](packages/apple) — iOS/macOS SDK
  [![GitHub Release](https://img.shields.io/github/v/release/hyodotdev/locanara?filter=apple-*&label=SPM)](https://github.com/hyodotdev/locanara/releases?q=apple&expanded=true)
  [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?label=CocoaPods)](https://cocoapods.org/pods/Locanara)
  [![CI iOS](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml)

- [**android**](packages/android) — Android SDK
  [![Maven Central](https://img.shields.io/maven-central/v/com.locanara/locanara?label=Maven%20Central)](https://central.sonatype.com/artifact/com.locanara/locanara)
  [![CI Android](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml)

- [**docs**](packages/docs) — Documentation site → [locanara.dev](https://locanara.dev)

---

## Requirements

**iOS / macOS**

- **Minimum**: iOS 17+ / macOS 14+ (llama.cpp, CoreML engines)
- **Full**: iOS 26+ / macOS 26+ (adds Apple Intelligence engine)
- Apple Silicon device (A14+ for iPhone, M1+ for Mac)

**Android**

- **Minimum**: Android 12+ (API 31+) for ExecuTorch engine
- **Full**: Android 14+ (API 34+) for Gemini Nano engine
- Device with NPU support recommended

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with conviction that AI should run where your data lives — on your device.*
