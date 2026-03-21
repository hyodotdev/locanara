# Locanara

![Locanara](logo.png)

On-Device AI Framework for iOS and Android

[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## Overview

Locanara is an on-device AI framework inspired by LangChain, purpose-built for mobile. Build, compose, and extend AI features using platform-native models — all processing happens locally on the device.

No cloud. No data leaves. Privacy by design.

**Documentation**: [locanara.com](https://locanara.com) | **Blog**: [LangChain for Mobile, Entirely On-Device — Meet Locanara](https://medium.com/dooboolab/langchain-for-mobile-entirely-on-device-meet-locanara-33112ade3b0e)

---

## Supported Platforms

### iOS / macOS

| Engine             | Description                             | Requirements                                                                              |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Apple Intelligence | OS-level Foundation Models              | iOS 18.1+ / macOS 15.1+ (iOS 26+ / macOS 26+ recommended), Apple Silicon, 7GB+ free space |
| llama.cpp          | GGUF models with Metal GPU acceleration | iOS 17+ / macOS 14+, Apple Silicon                                                        |
| CoreML             | Neural Engine accelerated inference     | iOS 17+ / macOS 14+, Apple Silicon                                                        |
| MLX                | Apple Silicon optimized inference       | macOS 14+, Apple Silicon                                                                  |

### Android

| Engine      | Description                        | Requirements          |
| ----------- | ---------------------------------- | --------------------- |
| Gemini Nano | ML Kit GenAI (Prompt API)          | Android 14+ (API 34+) |
| ExecuTorch  | Meta's on-device inference runtime | Android 12+ (API 31+) |

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
│  DSL Layer                                  │
│  Pipeline · PipelineStep · ModelExtensions  │
├─────────────────────────────────────────────┤
│  Platform Layer                             │
│  FoundationLanguageModel · PromptApiModel   │
├─────────────────────────────────────────────┤
│  Engine Layer                               │
│  InferenceRouter · LlamaCppEngine ·         │
│  ExecuTorchEngine · DeviceCapabilityDetector│
├─────────────────────────────────────────────┤
│  ModelManager Layer                         │
│  ModelManager · ModelDownloader ·           │
│  ModelRegistry · ModelStorage               │
├─────────────────────────────────────────────┤
│  RAG Layer                                  │
│  VectorStore · DocumentChunker ·            │
│  EmbeddingEngine · RAGQueryEngine           │
├─────────────────────────────────────────────┤
│  Personalization Layer                      │
│  PersonalizationManager · FeedbackCollector │
│  PreferenceAnalyzer · PromptOptimizer       │
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

| Chain          | Result Type     | Description                   |
| -------------- | --------------- | ----------------------------- |
| SummarizeChain | SummarizeResult | Text summarization            |
| ClassifyChain  | ClassifyResult  | Text classification           |
| ExtractChain   | ExtractResult   | Entity extraction             |
| ChatChain      | ChatResult      | Conversational AI with memory |
| TranslateChain | TranslateResult | Language translation          |
| RewriteChain   | RewriteResult   | Text rewriting by style       |
| ProofreadChain | ProofreadResult | Grammar correction            |

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

## Pipeline DSL

Compose multiple AI steps into a single type-safe workflow. Each step's output becomes the next step's input, and the return type is determined by the last step.

### Basic Pipeline (two steps)

**Swift**

```swift
import Locanara

let model = FoundationLanguageModel()

// Step 1: fix typos
let proofread = try await model.proofread(
    "Ths is a tset of on-devce AI."
)

// Step 2: translate the corrected text
let translated = try await model.translate(
    proofread.correctedText, to: "ko"
)
print(translated.translatedText)
```

**Kotlin**

```kotlin
import com.locanara.platform.PromptApiModel

val model = PromptApiModel(context)

// Step 1: fix typos
val proofread = model.proofread(
    "Ths is a tset of on-devce AI."
)

// Step 2: translate the corrected text
val translated = model.translate(
    proofread.correctedText, to = "ko"
)
println(translated.translatedText)
```

### Declarative Pipeline Builder (Swift)

Swift's `@PipelineBuilder` result builder enforces return types at compile time. The compiler rejects pipelines with incompatible step types, making multi-step workflows safe to refactor.

```swift
import Locanara

let model = FoundationLanguageModel()

// Two-step: proofread → translate
// Return type is TranslateResult — compiler enforced
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece about on-devce AI.")

print(result.translatedText)   // "이것은 온디바이스 AI에 관한 테스트 문장입니다."
print(result.targetLanguage)   // "ko"

// Three-step: summarize → proofread → translate
let threeStep = try await model.pipeline {
    Summarize(bulletCount: 3)
    Proofread()
    Translate(to: "ja")
}.run(longArticle)
// Returns TranslateResult (last step determines the type)
```

### Kotlin Pipeline DSL

```kotlin
import com.locanara.dsl.pipeline
import com.locanara.dsl.proofread
import com.locanara.dsl.summarize
import com.locanara.dsl.translate

val model = PromptApiModel(context)

// Fluent pipeline API
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece about on-devce AI.")

// result is TranslateResult (last step determines type)
println(result.translatedText)

// Three-step pipeline
val threeStep = model.pipeline()
    .summarize(bulletCount = 3)
    .proofread()
    .translate(to = "ja")
    .run(longArticle)
```

### Available Pipeline Steps

| Step           | Swift                    | Kotlin                           | Output           |
| -------------- | ------------------------ | -------------------------------- | ---------------- |
| Summarize      | `Summarize(bulletCount:)`| `.summarize(bulletCount:)`       | `SummarizeResult`|
| Classify       | `Classify(categories:)` | `.classify(categories:)`         | `ClassifyResult` |
| Translate      | `Translate(to:)`        | `.translate(to:)`                | `TranslateResult`|
| Proofread      | `Proofread()`           | `.proofread()`                   | `ProofreadResult`|
| Rewrite        | `Rewrite(style:)`       | `.rewrite(style:)`               | `RewriteResult`  |
| Extract        | `Extract(entityTypes:)` | `.extract(entityTypes:)`         | `ExtractResult`  |

> **Full tutorial**: [locanara.com/docs/tutorials/pipeline](https://locanara.com/docs/tutorials/pipeline)

---

## Packages

- [**apple**](packages/apple) — iOS/macOS SDK
  [![GitHub Release](https://img.shields.io/github/v/release/hyodotdev/locanara?filter=apple-*&label=SPM)](https://github.com/hyodotdev/locanara/releases?q=apple&expanded=true)
  [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?label=CocoaPods)](https://cocoapods.org/pods/Locanara)
  [![CI iOS](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml)

- [**android**](packages/android) — Android SDK
  [![Maven Central](https://img.shields.io/maven-central/v/com.locanara/locanara?label=Maven%20Central)](https://central.sonatype.com/artifact/com.locanara/locanara)
  [![CI Android](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml)

- [**site**](packages/site) — Website + Documentation → [locanara.com](https://locanara.com)

## Libraries

- [**expo-ondevice-ai**](libraries/expo-ondevice-ai) — Expo module
  [![npm](https://img.shields.io/npm/v/expo-ondevice-ai?label=npm)](https://www.npmjs.com/package/expo-ondevice-ai)

- [**flutter_ondevice_ai**](libraries/flutter_ondevice_ai) — Flutter plugin
  [![pub](https://img.shields.io/pub/v/flutter_ondevice_ai?label=pub.dev)](https://pub.dev/packages/flutter_ondevice_ai)

---

## Requirements

**iOS / macOS**

- **Minimum**: iOS 17+ / macOS 14+ (llama.cpp, CoreML engines)
- **Apple Intelligence**: iOS 18.1+ / macOS 15.1+ (iOS 26+ / macOS 26+ recommended)
  - Requires Apple Silicon (A17 Pro+ for iPhone, M1+ for Mac)
  - Requires 7GB+ free storage space
- Apple Silicon device required for all engines

**Android**

- **Minimum**: Android 12+ (API 31+) for ExecuTorch engine
- **Full**: Android 14+ (API 34+) for Gemini Nano engine
- Device with NPU support recommended

---

## License

AGPL-3.0 License — see [LICENSE](./LICENSE) for details.

---

_Built with conviction that AI should run where your data lives — on your device._
