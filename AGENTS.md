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

- **iOS/macOS**: Foundation Models on iOS 26+/macOS 26+; local fallback engines support iOS 17+/macOS 14+
- **Android**: Gemini Nano (ML Kit GenAI Prompt API) on supported Android 14+ devices; ExecuTorch supports API 31+
- **Web**: Chrome Built-in AI. Treat browser/API availability as runtime capability, not a static browser-version guarantee.

### Distribution

| Platform | Installation                                                     |
| -------- | ---------------------------------------------------------------- |
| iOS      | `https://github.com/hyodotdev/locanara` (SPM) or CocoaPods       |
| Android  | Maven Central: `implementation("com.locanara:locanara:VERSION")` |
| Web      | npm: `npm install locanara`                                      |

## Project Structure

```text
locanara/
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
│   ├── gql/            # GraphQL schema definitions and type generators
│   ├── web/            # Browser SDK for Chrome Built-in AI
│   └── site/           # Website (landing + docs + community)
├── libraries/          # Third-party framework integrations
│   ├── expo-ondevice-ai/         # Expo module
│   ├── react-native-ondevice-ai/ # React Native Nitro module
│   └── flutter_ondevice_ai/      # Flutter plugin
└── .claude/
    ├── commands/       # Slash commands
    └── guides/         # Project guides
```

## Skills and Slash Commands

- `$locanara-workflows` - Natural-language router for repository workflows
- `$locanara-docs` - Implementation-backed documentation authoring
- `$rebase-main` - Safe main update and work-branch rebase
- `$review-pr` - PR feedback, CI, and five-minute monitoring loop
- `$review-self` - Self-review and five-minute stabilization loop
- `/locanara` - Project-wide routing and source-of-truth map
- `/gql` - GraphQL schema and generated-type workflow
- `/apple` - Apple SDK development
- `/android` - Android SDK development
- `/test` - Cross-platform test workflow
- `/docs` - Documentation workflow
- `/audit-code` - Code audit against project rules
- `/verify-all` - Changed-path or full repository verification
- `/resolve-issue` - Evidence-backed GitHub issue workflow
- `/review-pr` - Detailed pull request feedback command
- `/knowledge-compile` - Upstream technology research and impact notes
- `/commit` - Local commit and PR workflow

### AI Assistant Compatibility

`AGENTS.md` is the root policy source shared by the `CLAUDE.md` and `GEMINI.md`
symlinks. Slash-command workflows live in `.claude/commands/`. Canonical
cross-agent skill procedures live in `.codex/skills/`, while matching
`.claude/skills/` files are thin Claude Code discovery adapters.

Install only the globally unique Locanara skills into the local Codex home when
needed:

```bash
./.codex/scripts/install-skills.sh
```

Keep `$review-pr`, `$review-self`, and `$rebase-main` repository-local because
other projects provide project-specific workflows with the same names. When
changing a canonical skill, update its Claude adapter, `SKILLS_INDEX.md`, tests,
and generated agent context as applicable.

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

The complete `ModelManager`/downloader/storage lifecycle is currently an Apple
layer. Android has an ExecuTorch engine and model registry, not the same full
lifecycle implementation.

- **Chain**: Composable unit of AI logic. Implement the `Chain` protocol to create custom features.
- **Built-in Chains**: 7 ready-to-use chains (`SummarizeChain`, `ClassifyChain`, etc.) that serve as both utilities and reference implementations.
- **Pipeline DSL**: Compose native chains while tracking the last step's result type. The current builders do not prove every adjacent step compatible at compile time.
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

- Use the Swift 6 toolchain. Some targets still compile in Swift 5 language mode; treat concurrency warnings as migration defects.
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

Shared feature concepts use the same canonical method names. Platform-only
features must be capability-gated, and wrapper APIs must return an explicit
unsupported result rather than simulate success:

- `getDeviceCapability()` - Check device AI support
- `summarize()` - Text summarization
- `classify()` - Text classification
- `extract()` - Entity extraction
- `chat()` - Conversational AI
- `translate()` - Language translation
- `rewrite()` - Text rewriting
- `proofread()` - Grammar correction

## Versioning

`locanara-versions.json` is the only source of truth. Package versions are intentionally allowed to differ, so never copy example version numbers from documentation or infer one package's version from another. Read the file at execution time:

```bash
jq . locanara-versions.json
```

`packages/site/locanara-versions.json` and package manifests are synchronized copies. A mismatch is a defect; do not silently choose one of the copies.

## Development Commands

### Site

```bash
cd packages/site
bun install
bun run dev                 # Start Vite and Convex together
bun run build               # Build for production
```

### Apple

```bash
cd packages/apple
swift build
swift test

# Example app
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' -skipMacroValidation build
```

Use `-skipMacroValidation` for headless verification only after reviewing the
resolved macro dependency revision.

### Android

```bash
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
./gradlew test
```

### Web

```bash
cd packages/web
bun run lint
bun run test
bun run build
```

### GraphQL Types

```bash
cd packages/gql
bun run generate
git diff -- ../apple/Sources/Types.swift ../android/locanara/src/main/kotlin/com/locanara/Types.kt
```

Review expected generated changes during development. Use
`git diff --exit-code` only as a clean-baseline drift check in CI or after
confirming no generated change is expected.

### AI Context

```bash
cd scripts/agent
bun run typecheck
bun test
bun run lint:markdown
bun run compile             # Regenerate after source changes
bun run check               # Read-only generated-output verification
bun run check:versions      # Version work only; fails on root/site drift
```

For complete package-manifest and wrapper fallback validation, run
`bun run version:check` from the repository root. Use `bun run version:sync`
only during explicitly authorized version preparation or to repair an already
identified synchronization defect.

## Build Verification (Required After Code Changes)

**CRITICAL**: After modifying SDK or example app code, verify builds before committing.

### Quick Build Commands

```bash
# iOS (from packages/apple)
cd packages/apple
swift build

# Example app (from packages/apple/Example)
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' -skipMacroValidation build
```

```bash
# Android (from packages/android)
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
```

### When to Verify

| Changed Files                                                                    | Required Verification                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/gql/**`                                                                | Generate types; diff tracked Swift/Kotlin outputs; affected SDK tests     |
| `packages/apple/Sources/**`                                                      | `swift build`, `swift test`, iOS Example build                            |
| `packages/apple/Example/**`                                                      | iOS Example build                                                         |
| `packages/android/locanara/src/**`                                               | `:locanara:test`, `:locanara:build`, `:example:assembleDebug`             |
| `packages/android/example/**`                                                    | `:example:assembleDebug`                                                  |
| `packages/web/**`                                                                | lint, test, build                                                         |
| `packages/site/**`                                                               | typecheck, lint, format check, test, build                                |
| `libraries/expo-ondevice-ai/**`                                                  | TypeScript check, tests, build                                            |
| `libraries/react-native-ondevice-ai/**`                                          | TypeScript check, tests, build; run nitrogen for spec/codegen changes     |
| `libraries/flutter_ondevice_ai/**`                                               | `flutter analyze`, `flutter test`                                         |
| `AGENTS.md`, `SKILLS_INDEX.md`, `.claude/**`, `.codex/**`, `knowledge/**`        | agent typecheck, tests, Markdown lint, regenerate if needed, then `check` |
| `scripts/agent/**`, root/site `llms*.txt`, agent CI workflow                     | agent typecheck, tests, Markdown lint, regenerate if needed, then `check` |

## Agent Working Agreement

1. Start with `git status --short --branch`, inspect existing diffs, and preserve user-owned changes.
2. Read the nearest package guide before editing. Verify claims against implementation and manifests; generated docs and old knowledge snapshots are not authority.
3. Keep source-of-truth order explicit: GraphQL schema for shared generated types, platform SDKs for behavior, wrapper specs/public APIs for bridges, and `locanara-versions.json` for versions.
4. Never hand-edit generated GraphQL or Nitro output. Run the generator from its source and review the diff.
5. Use changed-path verification by default. Run the full matrix for cross-platform contracts, generator changes, releases, or when explicitly requested.
6. Treat logs as a privacy boundary: SDK production code must not print prompts, user input, model output, or extracted entities. Use structured platform logging only for non-sensitive metadata.
7. Do not describe a feature as compile-time safe, available, or supported unless the implementation and tests establish that exact guarantee.

## Issue Resolution Rules

- Age alone is never a reason to close an issue.
- Reproduce or compare every acceptance criterion against the current default branch.
- Check whether a linked PR actually changed all requested surfaces; a `Closes #N` message is not proof of completion.
- Close as `completed` only when the requested outcome exists and is verified. Use `not planned` only for a deliberate scope decision and explain why.
- Before a close, leave a concise evidence comment with the relevant files, tests, or superseding issue/PR.
- If any substantive criterion remains, keep the issue open and report the smallest remaining scope.

## Libraries

Third-party framework integrations that wrap the Locanara SDK (`packages/`).

### Source of Truth

**`packages/` is the behavioral source of truth.** Libraries are adapters and
may contain bridge, browser, serialization, or platform glue; do not assume
every current path merely forwards. Change core AI behavior in
`packages/apple/`, `packages/android/`, or `packages/web/` first, then keep each
wrapper honest and aligned.

### Available Libraries

| Library                    | Status      | Description                                |
| -------------------------- | ----------- | ------------------------------------------ |
| `expo-ondevice-ai`         | In Progress | Expo module for on-device AI               |
| `react-native-ondevice-ai` | In Progress | React Native Nitro module for on-device AI |
| `flutter_ondevice_ai`      | In Progress | Flutter plugin for on-device AI            |

### Local Development Workflow

Libraries depend on the SDK via package managers. During local development:

- **Android**: Libraries use `mavenLocal()` → user runs `publishToMavenLocal` when SDK changes
- **iOS**: Libraries reference local pod/SPM path
- **Web**: Libraries use local npm link

**When SDK changes are needed:**

1. Modify code in `packages/apple/`, `packages/android/`, or `packages/web/`
2. Rebuild the affected wrapper examples against the local SDK
3. Change `locanara-versions.json` only when the user explicitly requests version preparation
4. User handles local publishing (mavenLocal, etc.) — **AI agents must NEVER publish**

### API Parity Across Libraries

All three libraries **MUST** keep the same public wrapper API surface. When an
underlying platform lacks a capability, expose that fact through capability
data or an explicit unsupported error; never return a fabricated success. When
modifying one library, update the others:

| Function                              | All libraries must expose           |
| ------------------------------------- | ----------------------------------- |
| `initialize()`                        | Initialization result               |
| `getDeviceCapability()`               | Device capability info              |
| `summarize(text, options?)`           | Summarize result                    |
| `classify(text, options?)`            | Classify result                     |
| `extract(text, options?)`             | Extract result                      |
| `chat(message, options?)`             | Chat result                         |
| `chatStream(message, options?)`       | Chat result with streaming callback |
| `summarizeStreaming(text, options?)`  | Summarize with streaming callback   |
| `translateStreaming(text, options)`   | Translate with streaming callback   |
| `rewriteStreaming(text, options?)`    | Rewrite with streaming callback     |
| `translate(text, options)`            | Translate result                    |
| `rewrite(text, options)`              | Rewrite result                      |
| `proofread(text, options?)`           | Proofread result                    |
| `describeImage(image, options?)`      | Image description where supported   |
| `getAvailableModels()`                | List of downloadable models         |
| `getDownloadedModels()`               | List of downloaded model IDs        |
| `getLoadedModel()`                    | Currently loaded model ID or null   |
| `getCurrentEngine()`                  | Active inference engine             |
| `downloadModel(id, onProgress?)`      | Download result with progress       |
| `loadModel(id)`                       | Load result                         |
| `deleteModel(id)`                     | Delete result                       |
| `getPromptApiStatus()`                | Prompt API status string            |
| `downloadPromptApiModel(onProgress?)` | Download result with progress       |

### expo-ondevice-ai

Expo module wrapping Locanara SDK for React Native/Expo apps.

```bash
cd libraries/expo-ondevice-ai
bun install --frozen-lockfile --ignore-scripts
bun run lint:tsc  # Read-only TypeScript check
bun run lint      # Read-only ESLint check
bun run test      # Run tests
bun run build     # Build TypeScript
```

Do not use `lint:ci` as a read-only check: it currently runs formatting/fix
commands that can modify the working tree.

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
bun install --frozen-lockfile --ignore-scripts
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

### flutter_ondevice_ai

Flutter plugin wrapping Locanara SDK. Supports iOS, Android, and Web.

```bash
cd libraries/flutter_ondevice_ai
flutter pub get
flutter analyze
flutter test
```

**Structure follows flutter_inapp_purchase pattern:**

- `lib/src/` - Dart source (plugin, types, web implementation)
- `android/` - Kotlin MethodChannel + EventChannel plugin
- `ios/` - Swift FlutterPlugin
- `example/` - Example Flutter app

## Nitro Module Development (react-native-ondevice-ai)

### CRITICAL: Spec-First Development

The Nitro Module uses code generation from a single bridge spec. Every public
bridge signature or type change **MUST** start from the spec. Native bug fixes,
tests, or internal refactors that do not change the bridge contract start in
their owning implementation and must not create needless generated churn.

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

All three libraries (`expo-ondevice-ai`, `react-native-ondevice-ai`, `flutter_ondevice_ai`) **MUST** expose identical APIs. See the **Libraries > API Parity Across Libraries** section for the full table.

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
- Keep wrapper API surfaces aligned and represent unsupported capabilities honestly
- GraphQL schema is the source of truth for shared generated Apple/Android types
- Test on real devices (simulators may not support on-device AI)
