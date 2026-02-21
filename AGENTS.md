# Locanara - AI Agent Guidelines

> **Repository: hyodotdev/locanara**
>
> This is the open-source SDK for on-device AI.

## Project Overview

Locanara is an on-device AI **framework** for iOS, Android, and Web, inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using platform-native models.

### Core Principles

- **On-Device Only**: All AI processing happens locally. No cloud fallback.
- **Privacy First**: User data never leaves the device.
- **Framework, Not Just API**: Composable chains, memory, guardrails, and pipeline DSL.
- **Unified API**: Same concepts and structure across all platforms.

### Supported Platforms

- **iOS/macOS**: Apple Intelligence (Foundation Models) - iOS 18.1+, macOS 15.1+ (iOS 26+, macOS 26+ recommended)
- **Android**: Gemini Nano (ML Kit GenAI) - Android 14+
- **Web**: Chrome Built-in AI (Gemini Nano) - Chrome 138+

### Distribution

| Platform | Installation                                                     |
| -------- | ---------------------------------------------------------------- |
| iOS      | `https://github.com/hyodotdev/locanara` (SPM) or CocoaPods       |
| Android  | Maven Central: `implementation("com.locanara:locanara:VERSION")` |
| Web      | npm: `npm install locanara`                                      |

## Project Structure

```text
locanara-community/
├── packages/
│   ├── apple/          # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/
│   │   │   ├── Core/            # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │   │   ├── Composable/      # Chain, Tool, Memory, Guardrail
│   │   │   ├── BuiltIn/         # SummarizeChain, ClassifyChain, etc.
│   │   │   ├── DSL/             # Pipeline, PipelineStep, ModelExtensions
│   │   │   ├── Runtime/         # Agent, Session, ChainExecutor
│   │   │   ├── Platform/        # FoundationLanguageModel
│   │   │   ├── Engine/          # InferenceRouter, LlamaCppEngine
│   │   │   ├── ModelManager/    # ModelManager, ModelDownloader
│   │   │   ├── RAG/             # VectorStore, DocumentChunker
│   │   │   ├── Personalization/ # PersonalizationManager, FeedbackCollector
│   │   │   └── Features/        # Legacy feature executors
│   │   ├── Tests/
│   │   └── Example/    # Example app
│   ├── android/        # Kotlin SDK (Maven Central)
│   │   ├── locanara/
│   │   │   └── src/main/kotlin/com/locanara/
│   │   │       ├── core/            # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │   │       ├── composable/      # Chain, Tool, Memory, Guardrail
│   │   │       ├── builtin/         # SummarizeChain, ClassifyChain, etc.
│   │   │       ├── dsl/             # Pipeline, ModelExtensions
│   │   │       ├── runtime/         # Agent, Session, ChainExecutor
│   │   │       ├── platform/        # PromptApiModel
│   │   │       ├── engine/          # InferenceEngine, ExecuTorchEngine
│   │   │       ├── rag/             # VectorStore, RAGManager
│   │   │       └── personalization/ # PersonalizationManager
│   │   └── example/    # Example app
│   ├── gql/            # GraphQL schema definitions
│   └── site/           # Website (landing + docs + community)
├── libraries/          # Third-party framework integrations
│   ├── expo-ondevice-ai/       # Expo module
│   └── react-native-ondevice-ai/ # React Native Nitro module
└── .claude/
    ├── commands/       # Slash commands
    └── guides/         # Project guides
```

## Skills (Slash Commands)

- `/gql` - GraphQL schema architect
- `/apple` - Apple Intelligence SDK development
- `/android` - Android/Gemini Nano SDK development
- `/test` - Test engineer
- `/docs` - Documentation manager
- `/commit` - Git commit and PR workflow
- `/audit-code` - Code audit against project rules

## Commit Conventions

### Format

```text
<type>: <description>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Rules

- Write commit messages in English
- Use lowercase for type
- Keep description concise (under 72 characters)
- **NEVER add Co-Authored-By or any co-author attribution**

### Examples

```sh
feat: add summarize API for iOS
fix: resolve MLKit initialization error
docs: update API documentation
refactor: simplify Foundation Models client
```

## Framework Architecture

Locanara is structured as a layered framework (similar to LangChain for on-device AI):

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
│  Pipeline · PipelineStep · ModelExtensions          │
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

### Key Concepts

- **Chain**: Composable unit of AI logic. Implement the `Chain` protocol to create custom features.
- **Built-in Chains**: 7 ready-to-use chains (`SummarizeChain`, `ClassifyChain`, etc.) that serve as both utilities and reference implementations.
- **Pipeline DSL**: Compose chains with compile-time type safety (`model.pipeline { Proofread(); Translate(to: "ko") }.run("text")`).
- **Memory**: `BufferMemory` (last N turns) and `SummaryMemory` (compressed history) for conversation context.
- **Guardrail**: Input/output validation (`InputLengthGuardrail`, `ContentFilterGuardrail`).
- **Model Extensions**: One-liner convenience methods (`model.summarize()`, `model.translate()`).

### Three Levels of API

1. **Simple**: `model.summarize("text")` - one-liner convenience methods
2. **Chain**: `SummarizeChain(model: model, bulletCount: 3).run("text")` - configurable chains
3. **Custom**: Implement `Chain` protocol for app-specific AI features

### Custom Chain Pattern

Developers build their own AI features by:

1. Defining a result type (Swift `Sendable` / Kotlin `data class`)
2. Implementing the `Chain` protocol with `invoke()` method
3. Adding a typed `run()` convenience method

## Coding Conventions

### Swift (Apple SDK)

- Use Swift 6.0+ with strict concurrency
- Follow Apple's Swift API Design Guidelines
- Use `async/await` for all AI operations
- Prefix errors with `Locanara` (e.g., `LocanaraError`)

### Kotlin (Android SDK)

- Target Kotlin 2.0+
- Use `suspend` functions for AI operations
- Follow Kotlin coding conventions
- Package: `com.locanara`

### TypeScript (Site)

- Use strict mode
- Prefer functional components with hooks
- Use Tailwind CSS for styling

## API Naming Conventions

All platforms use identical method names:

- `getDeviceCapability()` - Check device AI support
- `summarize()` - Text summarization
- `classify()` - Text classification
- `extract()` - Entity extraction
- `chat()` - Conversational AI
- `translate()` - Language translation
- `rewrite()` - Text rewriting
- `proofread()` - Grammar correction

## Versioning

All packages share the same version number defined in `locanara-versions.json`:

```json
{
  "version": "1.0.1",
  "types": "1.0.1",
  "apple": "1.0.1",
  "android": "1.0.2"
}
```

## Development Commands

### Site

```bash
cd packages/site
bun install
bunx convex dev & bun dev   # Start dev server with Convex
bun build                   # Build for production
```

### Apple

```bash
cd packages/apple
swift build
swift test

# Example app
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' build
```

### Android

```bash
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
./gradlew test
```

## Build Verification (Required After Code Changes)

**CRITICAL**: After modifying SDK or example app code, verify builds before committing.

### Quick Build Commands

```bash
# iOS (from packages/apple)
cd packages/apple
swift build

# Example app (from packages/apple/Example)
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' build
```

```bash
# Android (from packages/android)
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
```

### When to Verify

| Changed Files                      | Required Builds           |
| ---------------------------------- | ------------------------- |
| `packages/apple/Sources/**`        | iOS SDK + Example App     |
| `packages/apple/Example/**`        | iOS Example App           |
| `packages/android/locanara/src/**` | Android SDK + Example App |
| `packages/android/example/**`      | Android Example App       |

## Libraries

Third-party framework integrations that use Locanara SDK.

### Available Libraries

| Library                    | Status      | Description                                |
| -------------------------- | ----------- | ------------------------------------------ |
| `expo-ondevice-ai`         | In Progress | Expo module for on-device AI               |
| `react-native-ondevice-ai` | In Progress | React Native Nitro module for on-device AI |

### expo-ondevice-ai

Expo module wrapping Locanara SDK for React Native/Expo apps.

```bash
cd libraries/expo-ondevice-ai
bun install
bun run build     # Build TypeScript
bun run lint:ci   # Run all linters
bun run test      # Run tests
```

**Structure follows expo-iap pattern:**

- `src/` - TypeScript source
- `android/` - Kotlin native module
- `ios/` - Swift native module
- `plugin/` - Expo config plugin
- `example/` - Example Expo app

### react-native-ondevice-ai

React Native module using Nitro Modules for bare React Native apps. Expo users should use `expo-ondevice-ai` instead.

```bash
cd libraries/react-native-ondevice-ai
bun install
bun run nitrogen    # Generate Nitro bridge code
bun run lint:tsc    # TypeScript type check
bun run test        # Run tests
```

**Structure follows react-native-iap Nitro pattern:**

- `src/` - TypeScript source (specs, types, public API)
- `src/specs/` - Nitro HybridObject interface (`OndeviceAi.nitro.ts`)
- `android/` - Kotlin native module + CMake/C++ adapter
- `ios/` - Swift native module
- `nitrogen/generated/` - Auto-generated bridge code (do not edit)
- `nitro.json` - Nitro module configuration

## Nitro Module Development (react-native-ondevice-ai)

### CRITICAL: Spec-First Development

The Nitro Module uses **code generation** from a single spec file. **All changes MUST start from the spec file** — otherwise native implementations will be out of sync.

**Source of truth**: `libraries/react-native-ondevice-ai/src/specs/OndeviceAi.nitro.ts`

### When Adding or Modifying an API

Follow this exact order — **never skip a step**:

1. **Update the Nitro spec** (`src/specs/OndeviceAi.nitro.ts`)
   - Add/modify interfaces and the `OndeviceAi` HybridObject method signature
   - All types used in the HybridObject must be defined in this file
   - Union types must have 2+ values (Nitro constraint)
   - No `Record<K,V>` — use flat fields and convert in JS layer

2. **Run nitrogen** to regenerate bridge code:

   ```bash
   cd libraries/react-native-ondevice-ai && npx nitrogen
   ```

3. **Update native implementations** — both platforms must match the spec:
   - iOS: `ios/HybridOndeviceAi.swift` (+ `ios/OndeviceAiHelper.swift` if options parsing needed)
   - Android: `android/.../HybridOndeviceAi.kt` (+ `android/.../OndeviceAiHelper.kt`)

4. **Update the JS public API** (`src/index.ts`)
   - Convert Nitro types → public types (e.g., flat booleans → `features` Record)
   - Manage listener lifecycle for streaming/progress patterns

5. **Update public types** (`src/types.ts`) if new types are exposed

6. **Update tests** (`src/__tests__/index.test.ts`)
   - Update mock (`src/__mocks__/react-native-nitro-modules.js`) with new methods/return values
   - Add test cases for new functionality

7. **Verify**:
   ```bash
   npx nitrogen && npx tsc --noEmit && bun run test
   ```

### Files That Must Stay in Sync

| Spec field                   | iOS implementation                | Android implementation         | JS wrapper                 | Test mock                               |
| ---------------------------- | --------------------------------- | ------------------------------ | -------------------------- | --------------------------------------- |
| `OndeviceAi.nitro.ts` method | `HybridOndeviceAi.swift` override | `HybridOndeviceAi.kt` override | `src/index.ts` function    | Mock in `react-native-nitro-modules.js` |
| Nitro struct/enum            | Auto-generated (nitrogen)         | Auto-generated (nitrogen)      | `src/types.ts` public type | Mock return value                       |

### Nitro Constraints Reference

- **Union types**: Must have 2+ values (single-value union = codegen error)
- **No `Record<K,V>`**: Use flat fields, convert in JS layer
- **Optional fields**: Use `field?: Type | null` pattern
- **Streaming**: Listener pattern (`addXxxListener`/`removeXxxListener`), not EventEmitter
- **All types in spec file**: Nitro codegen only reads the `.nitro.ts` file

### API Parity Checklist

The `react-native-ondevice-ai` public API **MUST** be identical to `expo-ondevice-ai`. When modifying either library, update both:

| Function                              | Both libraries must expose                    |
| ------------------------------------- | --------------------------------------------- |
| `initialize()`                        | `Promise<InitializeResult>`                   |
| `getDeviceCapability()`               | `Promise<DeviceCapability>`                   |
| `summarize(text, options?)`           | `Promise<SummarizeResult>`                    |
| `classify(text, options?)`            | `Promise<ClassifyResult>`                     |
| `extract(text, options?)`             | `Promise<ExtractResult>`                      |
| `chat(message, options?)`             | `Promise<ChatResult>`                         |
| `chatStream(message, options?)`       | `Promise<ChatResult>` with `onChunk` callback |
| `translate(text, options)`            | `Promise<TranslateResult>`                    |
| `rewrite(text, options)`              | `Promise<RewriteResult>`                      |
| `proofread(text, options?)`           | `Promise<ProofreadResult>`                    |
| `getAvailableModels()`                | `Promise<DownloadableModelInfo[]>`            |
| `getDownloadedModels()`               | `Promise<string[]>`                           |
| `getLoadedModel()`                    | `Promise<string \| null>`                     |
| `getCurrentEngine()`                  | `Promise<InferenceEngine>`                    |
| `downloadModel(id, onProgress?)`      | `Promise<boolean>`                            |
| `loadModel(id)`                       | `Promise<void>`                               |
| `deleteModel(id)`                     | `Promise<void>`                               |
| `getPromptApiStatus()`                | `Promise<string>`                             |
| `downloadPromptApiModel(onProgress?)` | `Promise<boolean>`                            |

## Publishing & Deployment (STRICTLY FORBIDDEN)

**CRITICAL: AI agents must NEVER publish, deploy, or release any package.**

The following actions are **absolutely prohibited** for AI agents:

- **NEVER** run `publishToMavenCentral`, `publishToMavenLocal`, `publish`, or any Gradle publish task
- **NEVER** run `pod trunk push` or any CocoaPods publishing command
- **NEVER** run `npm publish`, `yarn publish`, or any npm registry publishing command
- **NEVER** create GitHub releases or tags for release purposes
- **NEVER** trigger CI/CD release workflows
- **NEVER** modify version numbers in `locanara-versions.json` unless explicitly instructed
- **NEVER** run any command that uploads artifacts to external registries (Maven Central, CocoaPods, npm, GitHub Packages, etc.)

All publishing and deployment is handled exclusively by the maintainer through CI pipelines. If a task appears to require publishing, **ask the user** instead of proceeding.

## Important Notes

- Do NOT add cloud AI fallback - this is intentionally on-device only
- Keep API surface identical across platforms
- GraphQL schema is the source of truth for types
- Test on real devices (simulators may not support on-device AI)
