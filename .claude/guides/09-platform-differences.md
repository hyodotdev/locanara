# Platform Feature Differences

This guide documents feature availability and implementation differences across iOS and Android platforms.

## Feature Availability Matrix

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| **Core Framework** | ✅ | ✅ | Identical API across platforms |
| Chains (7 built-in) | ✅ | ✅ | Same chain implementations |
| Pipeline DSL | ✅ | ✅ | Identical syntax |
| Memory (Buffer/Summary) | ✅ | ✅ | Same memory implementations |
| Guardrails | ✅ | ✅ | Same guardrail implementations |
| Tools | ✅ | ✅ | Same tool protocol |
| Agent (ReAct-lite) | ✅ | ✅ | Same agent implementation |
| Session Management | ✅ | ✅ | Same session API |
| **On-Device AI Backends** | | | |
| Apple Intelligence | ✅ | ❌ | iOS 26+, macOS 26+ only |
| Gemini Nano | ❌ | ✅ | Android 14+ only |
| **External Model Support** | | | |
| llama.cpp (GGUF) | ✅ | ❌ | iOS 17+ via LocalLLMClient |
| ExecuTorch (GGUF) | ❌ | ✅ | Android API 26+ |
| **Engine System** | ✅ | ✅ | Both platforms support external models |
| InferenceRouter | ✅ | ✅ | Auto-routing to active engine |
| ModelManager | ✅ | ✅ | Download/load/unload GGUF models |
| ModelRegistry | ✅ | ✅ | Available model catalog |
| DeviceCapabilityDetector | ✅ | ❌ | iOS-only hardware detection |
| **RAG** | ✅ | ✅ | Both platforms |
| VectorStore | ✅ | ✅ | In-memory vector storage |
| DocumentChunker | ✅ | ✅ | Multiple chunking strategies |
| EmbeddingEngine | ✅ | ✅ | Text embedding generation |
| RAGManager | ✅ | ✅ | Collection management |
| RAGQueryEngine | ✅ | ✅ | Query pipeline |
| **Personalization** | ✅ | ✅ | Both platforms |
| PersonalizationManager | ✅ | ✅ | Feedback orchestration |
| FeedbackCollector | ✅ | ✅ | User feedback collection |
| PreferenceAnalyzer | ✅ | ✅ | Pattern analysis |
| PromptOptimizer | ✅ | ✅ | Adaptive prompts |

## Platform-Specific APIs

### iOS-Only Features

#### Apple Intelligence (Foundation Models)

```swift
import FoundationModels

let model = FoundationLanguageModel(instructions: "You are a helpful assistant.")
await model.prewarm()  // Reduce first-request latency

// Structured output via @Generable
struct Recipe: Generable {
    var name: String
    var ingredients: [String]
}
let recipe = try await model.generateStructured(prompt: "...", type: Recipe.self)
```

**Available:** iOS 26+, macOS 26+

#### llama.cpp via LocalLLMClient

```swift
// Load GGUF model
try await LocanaraClient.shared.loadModel("gemma-3-4b-it-q4")

// All chains automatically use llama.cpp
let result = try await SummarizeChain().run("text")
```

**Available:** iOS 17+, macOS 14+ (requires C++ interop)

#### RouterModel (iOS)

```swift
// Auto-routes to active engine
LocanaraDefaults.model  // RouterModel instance

// Switch engines dynamically
try await LocanaraClient.shared.switchToDeviceAI()         // → Foundation Models
try await LocanaraClient.shared.switchToExternalModel("gemma-3-4b-it-q4")  // → llama.cpp
```

#### LlamaCppBridge (iOS)

Runtime discovery pattern for CocoaPods/Expo isolation where C++ interop cannot be enabled on React Native pods:

```swift
// Bridge provider discovered via NSClassFromString
let bridgeClass = NSClassFromString("LocanaraLlamaBridge.LlamaCppBridgeProvider") as? any LlamaCppBridgeProvider.Type
```

### Android-Only Features

#### Gemini Nano (ML Kit GenAI)

```kotlin
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.Generation

val model = PromptApiModel(context)

// Check availability
val isReady = model.isReady  // true if Gemini Nano available

// Multimodal: text + image (nano-v2+ / Pixel 9+)
val result = model.generateWithImage("Describe this", bitmap)
```

**Available:** Android 14+ (Prompt API), Android 8+ (ML Kit GenAI APIs)

**Device Support:** Pixel 9/10, Samsung S25, OnePlus 13, Honor, iQOO, Motorola, OPPO, realme, vivo, Xiaomi

#### ExecuTorch Engine (Android)

```kotlin
// Load GGUF model via ExecuTorch
val engine = ExecuTorchEngine()
engine.loadModel("gemma-3-4b-it-q4.gguf")

val model = EngineModel(engine)
val result = SummarizeChain(model).run("text")
```

**Available:** Android API 26+

## Implementation Differences

### Error Handling

Both platforms use identical error types but platform-specific error codes:

```swift
// iOS
throw LocanaraError.featureNotAvailable(.chat)
throw LocanaraError.modelBusy  // Apple Intelligence busy
```

```kotlin
// Android
throw LocanaraException.FeatureNotAvailable(FeatureType.CHAT)
throw LocanaraException.ModelBusy  // Gemini Nano busy
throw LocanaraException.BackgroundUseBlocked  // Android-specific: app in background
```

### Async/Concurrency

```swift
// iOS - async/await
let result = try await model.generate(prompt: "...", config: .conversational)
```

```kotlin
// Android - coroutines
val result = model.generate("...", GenerationConfig.CONVERSATIONAL)
```

### Streaming

```swift
// iOS - AsyncThrowingStream
for try await delta in model.stream(prompt: "...", config: nil) {
    print(delta)
}
```

```kotlin
// Android - Flow
model.stream("...", null).collect { delta ->
    println(delta)
}
```

## API Naming Conventions

### Platform-Agnostic Features

All shared features use **identical names** across platforms:

```swift
// iOS
model.summarize("text")
SummarizeChain(bulletCount: 3).run("text")
```

```kotlin
// Android
model.summarize("text")
SummarizeChain(bulletCount = 3).run("text")
```

### Platform-Specific Feature Naming

When a feature is only available on one platform, use suffixes:

- **Android-only:** Use `Android` suffix (e.g., `describeImageAndroid`)
- **iOS-only:** Use `Ios` suffix in Swift (e.g., `generateImageIos`), `IOS` in GraphQL enums (e.g., `GENERATE_IMAGE_IOS`)

> **Note:** GraphQL enums use SCREAMING_SNAKE_CASE (`GENERATE_IMAGE_IOS`), while Swift follows API Design Guidelines where 3+ letter acronyms use title case (`generateImageIos`).

## Minimum Requirements

### iOS

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| iOS Version | 17.0 | 26.0 (for Apple Intelligence) |
| macOS Version | 14.0 | 26.0 (for Apple Intelligence) |
| Xcode | 16.0 | 16.0+ |
| Swift | 6.0 | 6.0+ |

### Android

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Android API | 26 | 34 (for Prompt API) |
| Kotlin | 2.0 | 2.0+ |
| Android Studio | 2024.1.1 | Latest |
| Gradle | 8.0 | 8.0+ |

## Testing Platform-Specific Features

### iOS

```bash
# Test on real device (simulators have limited AI support)
cd packages/apple
swift test

# Example app
open Example/LocanaraExample.xcodeproj
```

### Android

```bash
# Test on real device (emulators don't support Gemini Nano)
cd packages/android
./gradlew :locanara:test
./gradlew :example:assembleDebug
adb install -r example/build/outputs/apk/debug/example-debug.apk
```

## Migration Guide

### From iOS to Android

1. Replace `FoundationLanguageModel` → `PromptApiModel(context)`
2. Replace `try await` → `suspend` functions
3. Replace `AsyncThrowingStream` → `Flow`
4. Add `@Composable` for UI components if using Jetpack Compose

### From Android to iOS

1. Replace `PromptApiModel` → `FoundationLanguageModel()`
2. Replace `suspend` functions → `async throws`
3. Replace `Flow` → `AsyncThrowingStream`
4. Add `@available` annotations for iOS 26+ APIs

## Summary

- **Core framework** is identical across platforms (Chains, Pipeline, Memory, Guardrails, Tools, Agent, Session)
- **Engine, RAG, Personalization** layers available on both platforms
- **On-device AI backends** differ by platform (Apple Intelligence vs Gemini Nano)
- **External models** supported on both (llama.cpp on iOS, ExecuTorch on Android)
- **API naming** is identical for shared features, suffixed for platform-specific features
- Always test on **real devices** for accurate on-device AI behavior
