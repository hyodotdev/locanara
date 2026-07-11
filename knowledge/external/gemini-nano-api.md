# Gemini Nano / ML Kit GenAI Integration Notes

> Scope: repository-backed guidance for Locanara's Android implementation.
> External APIs change frequently. Verify Google's official ML Kit GenAI docs
> and the current Gradle manifest before changing dependencies or signatures.

## Non-Negotiable Boundary

Locanara uses Gemini Nano through on-device ML Kit GenAI APIs only. Never add
the cloud Gemini client (`com.google.ai.client.generativeai`), API keys, remote
model endpoints, or a server fallback. Model asset downloads are allowed;
prompt inference must remain local.

## Repository Sources of Truth

- Dependencies and minimum SDK: `packages/android/locanara/build.gradle.kts`
- Prompt model adapter: `packages/android/locanara/src/main/kotlin/com/locanara/platform/PromptApiModel.kt`
- Prompt availability/download client: `packages/android/locanara/src/main/kotlin/com/locanara/mlkit/MLKitPromptClient.kt`
- Task-specific ML Kit clients: `packages/android/locanara/src/main/kotlin/com/locanara/mlkit/MLKitClients.kt`
- Public capability routing: `packages/android/locanara/src/main/kotlin/com/locanara/Locanara.kt`

Do not copy dependency versions from this note. Read the current Gradle file.

## Current Architecture

```text
Application
  -> Locanara.getDeviceCapability()
  -> PromptApiStatus / FeatureStatus
  -> PromptApiModel or task-specific ML Kit client
  -> Gemini Nano on device
```

`PromptApiModel` wraps `com.google.mlkit.genai.prompt.Generation.getClient()`.
Requests are built with `generateContentRequest`, `TextPart`, and optionally
`ImagePart`. Both single-response and `Flow<String>` streaming paths map ML Kit
errors through `mapGenAiException`.

## Availability and Download

Availability is a runtime device/model property. Do not infer it solely from
the Android API level or device marketing name.

The Prompt API client maps ML Kit status to:

- `PromptApiStatus.Available`
- `PromptApiStatus.Downloadable`
- `PromptApiStatus.Downloading`
- `PromptApiStatus.NotAvailable(reason)`

Use `checkStatus()` before inference and `downloadModel(onProgress)` only for a
downloadable on-device model. Task-specific clients have their own
`checkFeatureStatus()` and download flows; capability reporting must reflect
those live statuses.

## Implementation Pattern

```kotlin
val model = PromptApiModel(context)

val response = model.generate(
    prompt = "Summarize this text",
    config = GenerationConfig.CONVERSATIONAL,
)

model.stream("Continue the answer").collect { delta ->
    // Render delta without logging user/model content.
}
```

For multimodal Prompt API support, use the implementation's `ImagePart` path
only after runtime capability confirms support.

## Error and Privacy Rules

- Map upstream failures to `LocanaraException`; do not leak raw provider
  exceptions as the public contract.
- Never log prompts, model responses, extracted entities, RAG queries, or image
  content. Logs may contain non-sensitive status and error codes.
- Do not report a feature as ready until its own ML Kit status is available.
- Preserve coroutine cancellation and use `Flow` for streaming.

## Updating This Integration

1. Verify the official ML Kit documentation and release notes.
2. Compare the documented API with the dependency versions in Gradle.
3. Update the SDK implementation first.
4. Update capability detection and error mapping.
5. Run Android SDK tests/build and assemble the example app.
6. Update every wrapper only after the SDK behavior is real; wrappers must not
   simulate downloads or model loading with in-memory state.
