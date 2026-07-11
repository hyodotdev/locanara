# Android Package

Location: `packages/android/`

## Authority

Read `packages/android/locanara/build.gradle.kts` and current implementation for
SDK levels, dependencies, and behavior. ML Kit APIs and device support change;
do not treat copied versions or device lists as permanent facts.

## Build and Test

```bash
cd packages/android
./gradlew :locanara:test :locanara:build :example:assembleDebug
```

The library currently uses API 31 as its package minimum and checks newer AI
features at runtime. JDK 17 is required by the build configuration.

Generate shared types from the GraphQL package, not an Android-local script:

```bash
cd packages/gql
bun run generate
git diff -- \
  ../apple/Sources/Types.swift \
  ../android/locanara/src/main/kotlin/com/locanara/Types.kt
```

Review expected generated changes during development; add `--exit-code` only
for a clean-baseline drift check.

## Structure

```text
packages/android/
├── locanara/src/main/kotlin/com/locanara/
│   ├── Locanara.kt
│   ├── Types.kt              # generated; do not edit
│   ├── core/
│   ├── composable/
│   ├── builtin/
│   ├── dsl/
│   ├── runtime/
│   ├── platform/
│   ├── mlkit/
│   ├── engine/
│   ├── rag/
│   └── personalization/
├── locanara/src/test/kotlin/com/locanara/
│   ├── CoreTests.kt
│   ├── ChainsTests.kt
│   ├── DSLTests.kt
│   ├── ComposableTests.kt
│   ├── ErrorHandlingTests.kt
│   ├── RAGTests.kt
│   └── TestHelpers.kt
└── example/
```

Do not recreate the removed monolithic `FrameworkTest.kt`.

## On-Device Engines

- Task-specific ML Kit GenAI clients live in `mlkit/MLKitClients.kt`.
- Prompt API status/download behavior lives in `mlkit/MLKitPromptClient.kt`.
- `platform/PromptApiModel.kt` adapts the Prompt API to `LocanaraModel`.
- `engine/ExecuTorchEngine.kt` is the local downloadable-engine path.

Prompt status includes available, downloadable, downloading, and unavailable.
Capability reporting and the model used by a wrapper call must agree. Do not
infer readiness from API level alone and do not force every chain through Prompt
API when a task-specific client is the advertised path.

## Dependencies

Only use the on-device dependencies declared in `locanara/build.gradle.kts`.
Never add cloud Gemini clients, provider API keys, or a server fallback. Update
dependency versions only after checking official ML Kit documentation and
building the SDK/example.

## Public Contract

- Kotlin async operations use `suspend`; streams use `Flow`.
- Upstream failures map to `LocanaraException`.
- Avoid `!!`; validate public option boundaries.
- Never log prompts, model output, extracted entities, RAG content, or images.
- Maven coordinate: `com.locanara:locanara:<android version>`.

## Wrapper Rule

Expo, React Native, and Flutter Android implementations must call real SDK
behavior. In-memory sets are not valid substitutes for model download/load or
engine state, and success must not be returned until the SDK confirms it.
