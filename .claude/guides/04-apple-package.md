# Apple Package (iOS SDK)

## Overview

Location: `packages/apple/`

The Apple SDK provides the Locanara on-device AI framework for iOS and macOS. It supports both Apple Intelligence (Foundation Models, iOS 26+) and llama.cpp (GGUF models via LocalLLMClient, iOS 17+). Includes composable chains, memory, guardrails, pipeline DSL, 7 built-in chains, engine routing, model management, RAG, and personalization.

## Requirements

- Xcode 16+
- iOS 17+ / macOS 14+ (SPM minimum)
- iOS 26+ for Apple Intelligence (Foundation Models)
- Swift 6.0+ (language mode v5, C++ interop enabled for llama.cpp)

## Build Commands

```bash
cd packages/apple

# Build
swift build

# Test
swift test

# Generate types from GQL
./scripts/generate-types.sh
```

## Project Structure

```text
packages/apple/
├── Sources/
│   ├── Core/              # LocanaraModel, PromptTemplate, OutputParser, Schema
│   ├── Composable/        # Chain, Tool, Memory, Guardrail
│   ├── BuiltIn/           # SummarizeChain, ClassifyChain, etc. (7 chains)
│   ├── DSL/               # Pipeline, PipelineStep, ModelExtensions
│   ├── Runtime/           # Agent, Session, ChainExecutor
│   ├── Platform/          # RouterModel, FoundationLanguageModel
│   ├── Engine/            # InferenceRouter, InferenceEngine, LlamaCppEngine, LlamaCppBridge,
│   │                      #   DeviceCapabilityDetector, LocalModelInferenceProvider, etc.
│   ├── ModelManager/      # ModelManager, ModelDownloader, ModelRegistry, ModelStorage
│   ├── RAG/               # VectorStore, DocumentChunker, EmbeddingEngine,
│   │                      #   RAGCollectionManager, RAGQueryEngine
│   ├── Personalization/   # PersonalizationManager, FeedbackCollector,
│   │                      #   PreferenceAnalyzer, PromptOptimizer
│   ├── Features/          # Legacy feature executors
│   ├── Locanara.swift                     # Main SDK entry point (LocanaraClient)
│   ├── LocanaraClient+Engine.swift        # Engine/model management extensions
│   ├── LocanaraClient+RAG.swift           # RAG extensions
│   ├── LocanaraClient+Personalization.swift # Personalization extensions
│   ├── InferenceProvider.swift            # Custom inference provider protocol
│   ├── Types.swift                        # Generated types from GQL (do not edit)
│   ├── Errors.swift                       # LocanaraError definitions
│   ├── Extensions.swift                   # Utility extensions
│   └── Tier.swift                         # SDK tier configuration
├── Tests/
│   ├── FrameworkTests.swift          # Framework unit tests (chains, pipeline, etc.)
│   ├── LocanaraTests.swift           # Legacy SDK tests
│   ├── RAGTests.swift                # RAG layer tests
│   └── EngineIntegrationTests.swift  # Engine integration tests
├── Example/               # Sample app
│   ├── LocanaraExample.xcodeproj/
│   └── LocanaraExample/
├── Package.swift          # SPM configuration (depends on LocalLLMClient)
└── scripts/
    └── generate-types.sh
```

## Example App

The Example app demonstrates SDK features and is used for testing.

```bash
# Open in Xcode
open packages/apple/Example/LocanaraExample.xcodeproj

# Or use VSCode launch.json
# Select "Open Apple (iOS) in Xcode"
```

### Example App Structure

```text
packages/apple/Example/
├── LocanaraExample.xcodeproj/
├── LocanaraExample/
│   ├── LocanaraExampleApp.swift
│   ├── ContentView.swift
│   └── components/
│       ├── navigation/     # MainTabNavigation
│       ├── pages/          # Feature demos, FrameworkShowcase
│       └── shared/         # Reusable UI components
```

## Integration

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara", from: "1.0.0")
]
```

## Key Files

### Entry Points & Configuration

- `Sources/Locanara.swift` - Main SDK entry point (`LocanaraClient.shared`)
- `Sources/LocanaraClient+Engine.swift` - Engine management: `loadModel()`, `getCurrentEngine()`, `switchToExternalModel()`, `switchToDeviceAI()`
- `Sources/LocanaraClient+RAG.swift` - RAG: `initializeRAG()`, `addDocuments()`, `query()`
- `Sources/LocanaraClient+Personalization.swift` - Personalization: `initializePersonalization()`, `submitFeedback()`
- `Sources/Types.swift` - Generated types from GQL (do not edit)
- `Sources/Errors.swift` - `LocanaraError` definitions

### Core & Composable

- `Sources/Core/Model.swift` - `LocanaraModel` protocol, `LocanaraDefaults.model` (defaults to `RouterModel`)
- `Sources/Composable/Chain.swift` - `Chain` protocol + `SequentialChain`
- `Sources/Composable/Memory.swift` - `BufferMemory`, `SummaryMemory`
- `Sources/BuiltIn/` - 7 built-in chain implementations

### Platform & Engine

- `Sources/Platform/RouterModel.swift` - Auto-routes to active engine (Foundation Models or llama.cpp)
- `Sources/Platform/FoundationLanguageModel.swift` - Apple Intelligence wrapper
- `Sources/Engine/InferenceRouter.swift` - Engine selection and routing singleton
- `Sources/Engine/InferenceEngine.swift` - Unified engine protocol + factory
- `Sources/Engine/LlamaCppEngine.swift` - llama.cpp engine (direct, uses LocalLLMClient with C++ interop)
- `Sources/Engine/LlamaCppBridge.swift` - Bridge discovery via `NSClassFromString` (for CocoaPods/Expo isolation)
- `Sources/Engine/DeviceCapabilityDetector.swift` - Hardware detection and engine recommendation
- `Sources/Engine/EngineTypes.swift` - `InferenceConfig`, `DownloadableModelInfo`, `ModelDownloadProgress`, etc.

### ModelManager

- `Sources/ModelManager/ModelManager.swift` - Model lifecycle (download, load, unload, delete)
- `Sources/ModelManager/ModelDownloader.swift` - HTTP download with progress
- `Sources/ModelManager/ModelRegistry.swift` - Available model catalog
- `Sources/ModelManager/ModelStorage.swift` - On-disk file management

### DSL & Runtime

- `Sources/DSL/Pipeline.swift` - Pipeline DSL with compile-time type safety
- `Sources/DSL/ModelExtensions.swift` - Convenience methods (`model.summarize()`, etc.)
- `Sources/Runtime/Agent.swift` - ReAct-lite autonomous agent
- `Sources/Runtime/Session.swift` - Stateful conversation management
- `Sources/Runtime/ChainExecutor.swift` - Instrumented chain execution

## Framework Architecture

The SDK is a layered framework:

1. **Core** - `LocanaraModel`, `PromptTemplate`, `OutputParser`, `ChainInput/ChainOutput`
2. **Composable** - `Chain`, `Memory`, `Guardrail`, `Tool`
3. **Built-in** - `SummarizeChain`, `ClassifyChain`, `ExtractChain`, `ChatChain`, `TranslateChain`, `RewriteChain`, `ProofreadChain`
4. **DSL** - Pipeline composition, Model extensions
5. **Runtime** - `Agent`, `Session`, `ChainExecutor`
6. **Platform** - `RouterModel` (default), `FoundationLanguageModel`
7. **Engine** - `InferenceRouter`, `InferenceEngine`, `LlamaCppEngine`, `LlamaCppBridge`, `DeviceCapabilityDetector`
8. **ModelManager** - `ModelManager`, `ModelDownloader`, `ModelRegistry`, `ModelStorage`
9. **RAG** - `VectorStore`, `DocumentChunker`, `EmbeddingEngine`, `RAGQueryEngine`
10. **Personalization** - `PersonalizationManager`, `FeedbackCollector`, `PreferenceAnalyzer`, `PromptOptimizer`

### Three Levels of API

```swift
// 1. Simple - one-liner
let result = try await model.summarize("text")

// 2. Chain - configurable (model defaults to LocanaraDefaults.model = RouterModel)
let result = try await SummarizeChain(bulletCount: 3).run("text")

// 3. Pipeline - composition
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("text")
```

### Engine Selection & RouterModel

`LocanaraDefaults.model` is a `RouterModel` that auto-routes inference:

- `.externalModel(modelId)` → InferenceRouter → llama.cpp active engine
- `.deviceAI` → FoundationLanguageModel (Apple Intelligence)
- `.auto` → Foundation Models if available, else llama.cpp

```swift
// Load a llama.cpp model — chains automatically switch to it
try await LocanaraClient.shared.loadModel("gemma-3-4b-it-q4")
// Now SummarizeChain().run("text") uses llama.cpp

// Switch back to Apple Intelligence
try await LocanaraClient.shared.switchToDeviceAI()
// Now SummarizeChain().run("text") uses Foundation Models
```

### LlamaCppBridge (CocoaPods/Expo isolation)

When using CocoaPods (e.g., Expo), C++ interop cannot be enabled on pods that import React Native headers (viral `GenericTypedArray` collision). The solution:

1. A separate `LocanaraLlamaBridge` pod is compiled with C++ interop in isolation
2. It implements `LlamaCppBridgeProvider` (discovered via `NSClassFromString`)
3. At runtime, `ModelManager` finds the bridge and uses it for model loading
4. The bridge registers its engine with `InferenceRouter` for inference routing

### Custom Chain Pattern

```swift
struct MyChain: Chain {
    let name = "MyChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = PromptTemplate.from("...{text}...").format(["text": input.text])
        let response = try await model.generate(prompt: prompt, config: .structured)
        let result = MyResult(...)
        return ChainOutput(value: result, text: response.text)
    }
}
```

## Notes

- Generated type files are synced from `packages/gql`
- Always run `bun run generate` from root after schema changes
- SPM depends on `LocalLLMClient` (llama.cpp wrapper) — requires C++ interop
- Test on real devices for on-device AI features (simulators have limited support)
