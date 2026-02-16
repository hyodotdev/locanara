# Project Overview

## What is Locanara?

Locanara is an on-device AI **framework** for mobile apps, inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using platform-native models and downloadable GGUF models:

- **iOS**: Apple Intelligence (Foundation Models) + llama.cpp (GGUF models via LocalLLMClient)
- **Android**: Gemini Nano (ML Kit GenAI + Prompt API)

## Framework Architecture

```text
┌─────────────────────────────────────────────────────┐
│  Runtime Layer                                      │
│  Agent · Session · ChainExecutor                    │
├─────────────────────────────────────────────────────┤
│  Built-in Chains (reference implementations)        │
│  Summarize · Classify · Chat · Translate ·          │
│  Extract · Rewrite · Proofread                      │
├─────────────────────────────────────────────────────┤
│  Composable Layer                                   │
│  Chain · Tool · Memory · Guardrail                  │
├─────────────────────────────────────────────────────┤
│  Core Layer                                         │
│  LocanaraModel · PromptTemplate ·                   │
│  OutputParser · Schema                              │
├─────────────────────────────────────────────────────┤
│  DSL Layer                                          │
│  Pipeline · PipelineStep · ModelExtensions           │
├─────────────────────────────────────────────────────┤
│  Platform Layer                                     │
│  FoundationLanguageModel (iOS) ·                    │
│  PromptApiModel (Android)                           │
├─────────────────────────────────────────────────────┤
│  Engine Layer                                       │
│  InferenceRouter · InferenceEngine ·                │
│  LlamaCppEngine (iOS) · ExecuTorchEngine (Android)  │
├─────────────────────────────────────────────────────┤
│  ModelManager Layer                                 │
│  ModelManager · ModelDownloader ·                   │
│  ModelRegistry · ModelStorage                       │
├─────────────────────────────────────────────────────┤
│  RAG Layer                                          │
│  VectorStore · DocumentChunker ·                    │
│  EmbeddingEngine · RAGQueryEngine                   │
├─────────────────────────────────────────────────────┤
│  Personalization Layer                              │
│  PersonalizationManager · FeedbackCollector ·       │
│  PreferenceAnalyzer · PromptOptimizer               │
└─────────────────────────────────────────────────────┘
```

### Core Layer

- `LocanaraModel` - Unified model protocol abstracting platform-specific AI backends
- `PromptTemplate` - Type-safe prompt composition with `{variable}` placeholders
- `OutputParser` - Text, JSON, and List output parsing
- `ChainInput/ChainOutput` - Type-safe data flow between chains

### Composable Layer

- `Chain` - Protocol for composable AI logic units
- `SequentialChain` - Run chains in sequence
- `Memory` - `BufferMemory` (last N turns) and `SummaryMemory` (compressed history)
- `Guardrail` - Input/output validation and filtering
- `Tool` - External capability integration

### Built-in Chains

7 ready-to-use chains that serve as both utilities and reference implementations:

- `SummarizeChain` → `SummarizeResult`
- `ClassifyChain` → `ClassifyResult`
- `ExtractChain` → `ExtractResult`
- `ChatChain` → `ChatResult` (with Memory support)
- `TranslateChain` → `TranslateResult`
- `RewriteChain` → `RewriteResult`
- `ProofreadChain` → `ProofreadResult`

### DSL Layer

- Pipeline DSL for chain composition with compile-time type safety
- Model convenience extensions (`model.summarize()`, `model.translate()`, etc.)

### Runtime Layer

- `ChainExecutor` - Instrumented execution with retry and history
- `Session` - Stateful conversation management
- `Agent` - ReAct-lite autonomous agent with tools

### Platform Layer

- `FoundationLanguageModel` - Apple Intelligence (Foundation Models) wrapper (iOS)
- `PromptApiModel` - Gemini Nano (ML Kit Prompt API) wrapper (Android)

### Engine Layer

Manages inference engine selection and routing for external GGUF models:

- `InferenceRouter` - Routes inference to the active engine
- `InferenceEngine` - Unified engine protocol for all backends
- **iOS**: `LlamaCppEngine` - llama.cpp engine using LocalLLMClient (C++ interop, iOS 17+)
- **iOS**: `LlamaCppBridge` - Runtime discovery of bridge providers via `NSClassFromString` (for CocoaPods/Expo isolation)
- **iOS**: `DeviceCapabilityDetector` - Detects device hardware, Neural Engine, memory
- **Android**: `ExecuTorchEngine` - ExecuTorch engine for GGUF models (Android API 26+)

### ModelManager Layer

Manages downloadable GGUF model lifecycle on both platforms:

- `ModelManager` - Download, load, unload, delete models
- `ModelDownloader` - HTTP download with progress and checksum verification
- `ModelRegistry` - Available model catalog (Gemma 3 4B, etc.)
- `ModelStorage` - On-disk model file management

### RAG Layer

Retrieval-Augmented Generation for on-device knowledge on both platforms:

- `VectorStore` - In-memory vector storage with cosine similarity search
- `DocumentChunker` - Text splitting strategies (fixed-size, sentence, paragraph)
- `EmbeddingEngine` - Text embedding generation
- `RAGManager` / `RAGCollectionManager` - Collection management
- `RAGQueryEngine` - Query pipeline combining retrieval and generation

### Personalization Layer

User preference learning and prompt optimization on both platforms:

- `PersonalizationManager` - Orchestrates feedback collection and preference learning
- `FeedbackCollector` - Collects user feedback on AI outputs
- `PreferenceAnalyzer` - Analyzes feedback to learn user preferences
- `PromptOptimizer` - Adapts prompts based on learned preferences

## Project Structure

```text
locanara/
├── packages/
│   ├── gql/          # GraphQL schema & type generation (source of truth)
│   ├── apple/        # iOS SDK (Swift)
│   │   └── Sources/
│   │       ├── Core/            # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │       ├── Composable/      # Chain, Tool, Memory, Guardrail
│   │       ├── BuiltIn/         # SummarizeChain, ClassifyChain, etc.
│   │       ├── DSL/             # Pipeline, PipelineStep, ModelExtensions
│   │       ├── Runtime/         # Agent, Session, ChainExecutor
│   │       ├── Platform/        # RouterModel, FoundationLanguageModel
│   │       ├── Engine/          # InferenceRouter, InferenceEngine, LlamaCppBridge, etc.
│   │       ├── ModelManager/    # ModelManager, ModelDownloader, ModelRegistry, ModelStorage
│   │       ├── RAG/             # VectorStore, DocumentChunker, EmbeddingEngine, RAGQueryEngine
│   │       ├── Personalization/ # PersonalizationManager, FeedbackCollector, etc.
│   │       ├── Features/        # Legacy feature executors
│   │       ├── Locanara.swift              # Main SDK entry point (LocanaraClient)
│   │       ├── LocanaraClient+Engine.swift # Engine management extensions
│   │       ├── LocanaraClient+RAG.swift    # RAG extensions
│   │       ├── LocanaraClient+Personalization.swift # Personalization extensions
│   │       ├── InferenceProvider.swift     # Custom inference provider protocol
│   │       ├── Types.swift                 # Generated types from GQL
│   │       └── Errors.swift                # LocanaraError definitions
│   │   └── Tests/
│   │       ├── FrameworkTests.swift         # Framework unit tests
│   │       ├── LocanaraTests.swift          # Legacy SDK tests
│   │       ├── RAGTests.swift               # RAG layer tests
│   │       └── EngineIntegrationTests.swift # Engine integration tests
│   ├── android/      # Android SDK (Kotlin) - Gemini Nano
│   │   └── locanara/src/main/kotlin/com/locanara/
│   │       ├── core/            # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │       ├── composable/      # Chain, Tool, Memory, Guardrail
│   │       ├── builtin/         # SummarizeChain, ClassifyChain, etc.
│   │       ├── dsl/             # Pipeline, ModelExtensions
│   │       ├── runtime/         # Agent, Session, ChainExecutor
│   │       ├── platform/        # PromptApiModel
│   │       ├── engine/          # InferenceEngine, ExecuTorchEngine, ModelRegistry
│   │       ├── rag/             # VectorStore, DocumentChunker, RAGManager, RAGQueryEngine
│   │       ├── personalization/ # PersonalizationManager, FeedbackCollector, etc.
│   │       └── mlkit/           # MLKitClients, MLKitPromptClient
│   └── site/         # Website (landing + docs + community)
├── libraries/
│   └── expo-ondevice-ai/  # Expo module wrapping native SDKs
│       ├── src/           # TypeScript API (summarize, chat, model management, etc.)
│       ├── ios/           # Swift native module (uses chains internally)
│       ├── android/       # Kotlin native module (uses chains internally)
│       ├── plugin/        # Expo config plugin (LocanaraLlamaBridge, SPM integration)
│       └── example/       # Expo example app
├── Package.swift     # Swift Package Manager configuration
└── package.json      # Bun monorepo configuration
```

## Package Manager

This project uses **Bun** (v1.1.0+) as the package manager and script runner.

```bash
bun install        # Install dependencies
bun run build      # Build all packages
bun run generate   # Generate types from GraphQL schemas
```

## Key Design Decisions

### Schema-First Development

The `packages/gql` package is the **single source of truth** for types:

1. Define types in GraphQL schema
2. Run `bun run generate` to generate TypeScript, Swift, and Kotlin types
3. Types are synced to `packages/apple` and `packages/android`

### Three Levels of API

1. **Simple**: `model.summarize("text")` - one-liner convenience
2. **Chain**: `SummarizeChain(model: model, bulletCount: 3).run("text")` - configurable
3. **Custom**: Implement `Chain` protocol for app-specific AI features

### Custom Chain Pattern

Developers build their own AI features by:

1. Defining a result type (Swift `Sendable` / Kotlin `data class`)
2. Implementing the `Chain` protocol/interface
3. Adding a typed `run()` convenience method

### Built-in Chains as Reference

The built-in chains (Summarize, Translate, etc.) serve dual purposes:

- Ready-to-use AI features that work out of the box
- Reference implementations showing how to build custom chains

### RouterModel as Default

`LocanaraDefaults.model` is a `RouterModel` that automatically routes inference to the currently active engine:

- When `engineSelectionMode == .externalModel` → uses InferenceRouter (llama.cpp)
- When `engineSelectionMode == .deviceAI` → uses FoundationLanguageModel
- When `engineSelectionMode == .auto` → prioritizes Foundation Models if available, else llama.cpp

This means all built-in chains automatically respect engine selection without any code changes.
