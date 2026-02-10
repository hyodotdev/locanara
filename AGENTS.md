# Locanara Community - AI Agent Guidelines

> **Repository: hyodotdev/locanara**
>
> This is the open-source Community SDK for on-device AI.

## Project Overview

Locanara Community is an on-device AI **framework** for iOS and Android, inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using platform-native models.

### Core Principles

- **On-Device Only**: All AI processing happens locally. No cloud fallback.
- **Privacy First**: User data never leaves the device.
- **Framework, Not Just API**: Composable chains, memory, guardrails, and pipeline DSL.
- **Unified API**: Same concepts and structure across all platforms.

### Supported Platforms

- **iOS/macOS**: Apple Intelligence (Foundation Models) - iOS 26+, macOS 26+
- **Android**: Gemini Nano (ML Kit GenAI) - Android 14+

### Community Edition

This is the Community (open-source) edition of Locanara SDK.

- Uses OS-level AI capabilities only
- Requires NPU-enabled devices (Apple Silicon, Gemini Nano supported devices)
- Lightweight: < 5MB added to app size

### Distribution

| Platform | Installation                                                     |
| -------- | ---------------------------------------------------------------- |
| iOS      | `https://github.com/hyodotdev/locanara` (SPM) or CocoaPods       |
| Android  | Maven Central: `implementation("com.locanara:locanara:VERSION")` |

## Project Structure

```text
locanara-community/
├── packages/
│   ├── apple/          # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/
│   │   │   ├── Core/           # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │   │   ├── Composable/     # Chain, Tool, Memory, Guardrail
│   │   │   ├── BuiltIn/        # SummarizeChain, ClassifyChain, etc.
│   │   │   ├── DSL/            # Pipeline, PipelineStep, ModelExtensions
│   │   │   ├── Runtime/        # Agent, Session, ChainExecutor
│   │   │   ├── Platform/       # FoundationLanguageModel
│   │   │   └── Features/       # Legacy feature executors
│   │   ├── Tests/
│   │   └── Example/    # Example app
│   ├── android/        # Kotlin SDK (Maven Central)
│   │   ├── locanara/
│   │   │   └── src/main/kotlin/com/locanara/
│   │   │       ├── core/       # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │   │       ├── composable/ # Chain, Tool, Memory, Guardrail
│   │   │       ├── builtin/    # SummarizeChain, ClassifyChain, etc.
│   │   │       ├── dsl/        # Pipeline, ModelExtensions
│   │   │       ├── runtime/    # Agent, Session, ChainExecutor
│   │   │       └── platform/   # PromptApiModel
│   │   └── example/    # Example app
│   ├── gql/            # GraphQL schema definitions
│   └── docs/           # Documentation website
├── libraries/          # Third-party framework integrations
│   ├── expo-ondevice-ai/       # Expo module
│   └── react-native-ondevice-ai/ # React Native module (planned)
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

### TypeScript (Docs)

- Use strict mode
- Prefer functional components with hooks
- Use CSS modules or CSS-in-JS

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
  "version": "1.0.0",
  "types": "1.0.0",
  "apple": "1.0.0",
  "android": "1.0.0"
}
```

## Development Commands

### Docs

```bash
cd packages/docs
bun install
bun dev        # Start dev server
bun build      # Build for production
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

| Library                    | Status      | Description                          |
| -------------------------- | ----------- | ------------------------------------ |
| `expo-ondevice-ai`         | In Progress | Expo module for on-device AI         |
| `react-native-ondevice-ai` | Planned     | React Native module for on-device AI |

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
