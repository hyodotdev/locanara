# Locanara

![Locanara](logo.png)

On-Device AI Framework for iOS and Android

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

Locanara is an on-device AI framework inspired by LangChain, purpose-built for mobile. Build, compose, and extend AI features using platform-native models - all processing happens locally on the device.

- **iOS/macOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano (ML Kit GenAI)

No cloud. No data leaves. Privacy by design.

**Documentation**: [locanara.dev](https://locanara.dev)

---

## Why Locanara?

Most on-device AI SDKs give you raw model access. Locanara gives you a **framework** - composable chains, memory management, guardrails, and a pipeline DSL - so you can build production AI features, not just call a model.

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
│  Platform Layer                             │
│  Apple Intelligence │ Gemini Nano           │
└─────────────────────────────────────────────┘
```

---

## Quick Start

### Installation

**iOS (Swift Package Manager)**

```swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara", from: "1.0.0")
]
```

**Android (Gradle)**

```kotlin
dependencies {
    implementation("com.locanara:locanara:1.0.0")
}
```

### Simple Usage

One-liner convenience methods for common tasks:

```swift
// iOS
let model = FoundationLanguageModel()

let summary = try await model.summarize("Long article text...")
print(summary.summary)

let translated = try await model.translate("Hello", to: "ko")
print(translated.translatedText)  // "안녕하세요"
```

```kotlin
// Android
val model = PromptApiModel(context)

val summary = model.summarize("Long article text...")
println(summary.summary)

val translated = model.translate("Hello", to = "ko")
println(translated.translatedText)  // "안녕하세요"
```

### Chain Composition

Chain multiple AI operations with compile-time type safety:

```swift
// iOS - Pipeline DSL
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("Ths is a tset sentece")
// result: TranslateResult (proofread text translated to Korean)
```

```kotlin
// Android - Fluent Builder
val result = model.pipeline()
    .proofread()
    .translate(to = "ko")
    .run("Ths is a tset sentece")
// result: TranslateResult
```

### Build Your Own Chain

Implement the `Chain` protocol to create custom AI features:

```swift
// iOS
struct SentimentChain: Chain {
    let name = "SentimentChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = PromptTemplate.from(
            "Classify sentiment as positive, negative, or neutral: {text}"
        ).format(["text": input.text])

        let response = try await model.generate(prompt: prompt, config: .structured)
        let result = SentimentResult(sentiment: response.text.trimmed())
        return ChainOutput(value: result, text: response.text)
    }
}

// Use it
let result = try await SentimentChain(model: model).run("I love this!")
```

```kotlin
// Android
class SentimentChain(private val model: LocanaraModel) : Chain {
    override val name = "SentimentChain"

    override suspend fun invoke(input: ChainInput): ChainOutput {
        val prompt = PromptTemplate.from(
            "Classify sentiment as positive, negative, or neutral: {text}"
        ).format(mapOf("text" to input.text))

        val response = model.generate(prompt, GenerationConfig.STRUCTURED)
        val result = SentimentResult(sentiment = response.text.trim())
        return ChainOutput(value = result, text = response.text)
    }
}
```

---

## Framework Features

### Core Layer

- `LocanaraModel` - Unified model protocol for on-device AI backends
- `PromptTemplate` - Type-safe prompt composition with `{variable}` placeholders
- `OutputParser` - Text, JSON, and List output parsing
- `ChainInput/Output` - Type-safe data flow between chains

### Composable Layer

- `Chain` - Composable unit of AI logic
- `SequentialChain` - Run chains in sequence, passing output to next input
- `Memory` - `BufferMemory` (last N turns) and `SummaryMemory` (compressed history)
- `Guardrail` - Input/output validation and filtering
- `Tool` - External capability integration

### Built-in Chains

7 ready-to-use chains with typed results:

- `SummarizeChain` → `SummarizeResult` - Text summarization
- `ClassifyChain` → `ClassifyResult` - Text classification
- `ExtractChain` → `ExtractResult` - Entity extraction
- `ChatChain` → `ChatResult` - Conversational AI with memory
- `TranslateChain` → `TranslateResult` - Language translation
- `RewriteChain` → `RewriteResult` - Text rewriting by style
- `ProofreadChain` → `ProofreadResult` - Grammar correction

### Runtime Layer

- `ChainExecutor` - Instrumented execution with retry and history
- `Session` - Stateful conversation management
- `Agent` - ReAct-lite autonomous agent with tools

### Pipeline DSL

Compose chains with compile-time type safety:

```swift
// The return type is inferred from the last step
let result: TranslateResult = try await model.pipeline {
    Summarize(bulletCount: 3)
    Translate(to: "ja")
}.run("Long English article...")
```

---

## Packages

- [**android**](packages/android) - Android SDK
  [![Maven Central](https://img.shields.io/maven-central/v/com.locanara/locanara?label=Maven%20Central)](https://central.sonatype.com/artifact/com.locanara/locanara)
  [![CI Android](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml)

- [**apple**](packages/apple) - iOS/macOS SDK
  [![GitHub Release](https://img.shields.io/github/v/release/hyodotdev/locanara?filter=apple-*&label=SPM)](https://github.com/hyodotdev/locanara/releases?q=apple&expanded=true)
  [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?label=CocoaPods)](https://cocoapods.org/pods/Locanara)
  [![CI iOS](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml)

- [**docs**](packages/docs) - Documentation → [locanara.dev](https://locanara.dev)

---

## Requirements

### iOS/macOS

- iOS 26+ / macOS 26+
- Device with Apple Intelligence support

### Android

- Android 14+ (API 34+)
- Device with Gemini Nano support

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Built with conviction that AI should run where your data lives - on your device.*
