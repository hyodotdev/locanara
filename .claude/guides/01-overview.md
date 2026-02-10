# Project Overview

## What is Locanara?

Locanara is an on-device AI **framework** for mobile apps, inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using system-provided models:

- **iOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano

## Framework Architecture

```text
┌─────────────────────────────────────────────┐
│  Runtime Layer                              │
│  Agent · Session · ChainExecutor            │
├─────────────────────────────────────────────┤
│  Built-in Chains (reference implementations)│
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

## Project Structure

```text
locanara/
├── packages/
│   ├── gql/          # GraphQL schema & type generation (source of truth)
│   ├── apple/        # iOS SDK (Swift) - Apple Intelligence
│   │   └── Sources/
│   │       ├── Core/       # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │       ├── Composable/ # Chain, Tool, Memory, Guardrail
│   │       ├── BuiltIn/    # SummarizeChain, ClassifyChain, etc.
│   │       ├── DSL/        # Pipeline, PipelineStep, ModelExtensions
│   │       ├── Runtime/    # Agent, Session, ChainExecutor
│   │       └── Platform/   # FoundationLanguageModel
│   ├── android/      # Android SDK (Kotlin) - Gemini Nano
│   │   └── locanara/src/main/kotlin/com/locanara/
│   │       ├── core/       # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │       ├── composable/ # Chain, Tool, Memory, Guardrail
│   │       ├── builtin/    # SummarizeChain, ClassifyChain, etc.
│   │       ├── dsl/        # Pipeline, ModelExtensions
│   │       ├── runtime/    # Agent, Session, ChainExecutor
│   │       └── platform/   # PromptApiModel
│   └── docs/         # Documentation site
├── libraries/
│   └── expo-ondevice-ai/  # Expo module wrapping native SDKs
│       ├── src/           # TypeScript API (summarize, chat, etc.)
│       ├── ios/           # Swift native module (uses chains internally)
│       ├── android/       # Kotlin native module (uses chains internally)
│       ├── plugin/        # Expo config plugin
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
