# /android

Implement, review, or verify the Android SDK under `packages/android/`.

## Usage

```text
/android review capability reporting
/android implement a built-in chain
/android verify the SDK and example app
```

## Request Boundary

- Review, audit, and status requests are read-only.
- Modify code only when the user asks for a change.
- Do not infer schema, wrapper, version, publishing, or deployment changes from
  an Android-only request.

## Source Routing

| Concern | Read first |
| --- | --- |
| Shared generated type | `packages/gql/src/*.graphql` |
| Public SDK behavior | `packages/android/locanara/src/main/kotlin/com/locanara/` |
| ML Kit status and tasks | `mlkit/MLKitPromptClient.kt` and `mlkit/MLKitClients.kt` |
| Model adapter/engine | `platform/PromptApiModel.kt` and `engine/` |
| Dependencies and SDK levels | `packages/android/locanara/build.gradle.kts` |
| Tests | `packages/android/locanara/src/test/kotlin/com/locanara/` |

GraphQL controls shared generated types, not runtime behavior. Never hand-edit
`packages/android/locanara/src/main/kotlin/com/locanara/Types.kt`; change the
schema and run `/gql`.

## Workflow

1. Read `AGENTS.md`, the Android package guide, status, and existing diffs.
2. Trace the public call through capability reporting, the selected model or
   task client, and the underlying on-device engine.
3. For a shared contract change, update GraphQL first and inspect generated
   Kotlin and Swift output. For Android-only behavior, keep the change local.
4. Add focused coroutine tests for success, invalid input, boundaries, upstream
   failures, cancellation, and Flow cleanup when relevant.
5. Run SDK tests/build and assemble the example app.
6. Report exact commands, warnings, skipped real-device behavior, and remaining
   cross-platform work.

## Implementation Rules

- Use Kotlin 2.x conventions, `suspend` functions, structured concurrency, and
  `Flow` for streaming.
- Map public failures to `LocanaraException`; validate inputs instead of using
  `!!` or unchecked casts at public boundaries.
- Never log prompts, model output, extracted entities, RAG content, or images.
- Use only on-device dependencies declared by the current Gradle manifest. Do
  not add the cloud Gemini client, API keys, remote inference, or a server
  fallback.
- Capability results must reflect live ML Kit/engine status and the engine the
  call will actually use; API level alone is not proof of readiness.
- Wrapper model-management methods must call real SDK behavior. In-memory state
  and fabricated download/load success are not valid implementations.
- The Pipeline fluent API tracks the final result type. Do not claim it proves
  compatibility between every adjacent step.

## Verification

```bash
cd packages/android
./gradlew :locanara:test :locanara:build :example:assembleDebug
```

JVM tests and emulator builds do not prove Gemini Nano or downloadable-engine
availability. Report real-device checks separately.

## References

- `.claude/guides/05-android-package.md`
- `.claude/commands/gql.md`
- `.claude/commands/test.md`
