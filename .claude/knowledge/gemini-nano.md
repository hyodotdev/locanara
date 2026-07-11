# Gemini Nano / ML Kit GenAI - Knowledge Update

> Last updated: 2026-02-16
>
> **Historical research snapshot, not implementation guidance.** Dependency,
> device, language, and API status claims require current official ML Kit
> verification. The current Locanara Android package minimum is API 31, and
> runtime readiness must come from live feature/Prompt API status.
>
> Repository implementation reconciled: 2026-07-11.

## Current Status

- **SDK**: ML Kit GenAI (replaces deprecated Google AI Edge SDK)
- **Model**: Gemini Nano (nano-v2, nano-v3)
- **Historical upstream claim**: API/device requirements below were captured in
  February 2026; Locanara itself currently has API 31 as the package minimum
- **Status**: Beta (no SLA or deprecation policy)
- **Locanara integration**: `PromptApiModel` + `MLKitClients` + `MLKitPromptClient`

## Breaking: Google AI Edge SDK Deprecated

The experimental Google AI Edge SDK (`com.google.ai.edge.localagent`) is **deprecated** as of Feb 2026. Google recommends migrating to **ML Kit Prompt API** for custom prompts.

| Old (deprecated)                | New (current)                   |
| ------------------------------- | ------------------------------- |
| `com.google.ai.edge.localagent` | `com.google.mlkit.genai.prompt` |
| Google AI Edge SDK              | ML Kit GenAI APIs               |

## ML Kit GenAI Features

| Feature                | Maven Dependency                                   | Languages                  |
| ---------------------- | -------------------------------------------------- | -------------------------- |
| **Summarization**      | `com.google.mlkit:genai-summarization:1.0.0-beta1` | en, ja, ko                 |
| **Proofreading**       | `com.google.mlkit:genai-proofreading:*`            | en, ja, ko, fr, de, it, es |
| **Rewriting**          | `com.google.mlkit:genai-rewriting:*`               | en, ja, ko, fr, de, it, es |
| **Image Description**  | `com.google.mlkit:genai-image-description:*`       | en                         |
| **Speech Recognition** | `com.google.mlkit:genai-speechrecognition:*`       | -                          |
| **Prompt API**         | `com.google.mlkit:genai-prompt:*`                  | en, ko                     |

## API Architecture

### Feature-Specific APIs (High-Level)

Pre-tuned for specific tasks, minimal prompt engineering required:

**Summarizer**:

- `SummarizerOptions.builder(context)` → `.setInputType()`, `.setOutputType()`, `.setLanguage()`, `.setLongInputAutoTruncationEnabled()`
- `InputType`: ARTICLE, CONVERSATION
- `OutputType`: ONE_BULLET, TWO_BULLET, THREE_BULLET
- `SummarizationRequest.builder(text).build()`
- `checkFeatureStatus()` → FeatureStatus (UNAVAILABLE, DOWNLOADABLE, DOWNLOADING, AVAILABLE)
- `downloadFeature(DownloadCallback)` / `runInference(request)` / `close()`

**Proofreader**: `ProofreaderOptions.builder(context)` → `.setInputType()` (KEYBOARD, VOICE), `.setLanguage()`

**Rewriter**: `RewriterOptions.builder(context)` → `.setOutputType()` (ELABORATE, EMOJIFY, SHORTEN, FRIENDLY, PROFESSIONAL, REPHRASE)

**ImageDescriber**: `ImageDescriberOptions.builder(context)`, accepts `Bitmap` input

### Prompt API (Low-Level)

Custom prompt engineering for flexible text generation:

```kotlin
val model = Generation.getClient()
val request = generateContentRequest(TextPart("prompt")) {
    temperature = 0.7f
    topK = 40
    candidateCount = 1
}
val response = model.generateContent(request)       // non-streaming
model.generateContentStream(request).collect { }     // streaming
model.checkStatus()                                  // FeatureStatus
model.download()                                     // Flow<DownloadStatus>
```

- Accepts text-only or image+text input
- Token limit: ~4000 tokens (~3000 English words)

## Device Support

### Feature-Specific APIs (Summarization, Proofreading, Rewriting, Image Description)

- Pixel 9 / Pixel 10 series
- Samsung Galaxy S25 series
- OnePlus 13
- Honor, iQOO, Motorola, OPPO, realme, vivo, Xiaomi (select models)

### Prompt API

- **nano-v2**: Pixel 9 and compatible devices
- **nano-v3**: Pixel 10 and newer equivalents

### Speech Recognition

- **Basic mode**: Android API 31+
- **Advanced mode**: Pixel 10 only

## Operational Constraints

- **Foreground-only**: Background usage → `ErrorCode.BACKGROUND_USE_BLOCKED`
- **Quota enforcement**: Per-app throttling → `ErrorCode.BUSY` (use exponential backoff)
- **Shared model**: All apps share a single device-wide Gemini Nano model
- **On-device only**: Input/inference/output processed locally, works offline
- **AICore**: Android system service via Private Compute Core (no data retention)

## Locanara Files

- `packages/android/locanara/src/main/kotlin/com/locanara/platform/PromptApiModel.kt` — LocanaraModel implementation using Prompt API
- `packages/android/locanara/src/main/kotlin/com/locanara/mlkit/MLKitClients.kt` — Feature-specific API wrappers (Summarize, Proofread, Rewrite, ImageDescribe)
- `packages/android/locanara/src/main/kotlin/com/locanara/mlkit/MLKitPromptClient.kt` — Prompt API wrappers (Chat, Classify, Extract, Translate)

## Impact on Locanara

### Current Integration Status

Locanara already has comprehensive ML Kit GenAI integration:

- `PromptApiModel` uses `GenerativeModel`, `Generation.getClient()`, `generateContentRequest`, streaming
- `MLKitClients` wraps all 4 feature-specific APIs with Locanara's type system
- `MLKitPromptClient` implements Chat, Classify, Extract, Translate via Prompt API
- Feature status detection and model download handling implemented

### Verified in the Current Repository

- **AI Edge SDK removed**: No `com.google.ai.edge.localagent` dependency or
  source reference remains.
- **Image + text multimodal implemented**: `PromptApiModel.generateWithImage()`
  and `streamWithImage()` build requests with `ImagePart` and `TextPart`.
- **Busy/background errors implemented**: `mapGenAiException()` maps ML Kit
  conditions to `ModelBusy` and `BackgroundUseBlocked`, backed by public error
  codes and tests.

### Remaining Audits

1. **Speech Recognition**: Decide whether ML Kit Speech Recognition belongs in
   Locanara's product scope; it is not currently exposed.
2. **nano-v2 vs nano-v3**: Verify whether reliable runtime model-version
   detection exists before adding it to `getDeviceCapability()`.
3. **Language expansion**: Re-verify current official language support, then
   compare it with Locanara enum and wrapper coverage.

### Already Correct

- `FeatureStatus` enum matches ML Kit's values (UNAVAILABLE=0, DOWNLOADABLE=1, DOWNLOADING=2, AVAILABLE=3)
- Download progress callback pattern matches ML Kit's `DownloadCallback` interface
- Token limit (4096 in `maxContextTokens`) aligns with ML Kit's ~4000 token limit
- Streaming via `Flow<String>` in `PromptApiModel.stream()` correctly uses `generateContentStream`

## Sources

- [ML Kit GenAI APIs Overview](https://developer.android.com/ai/gemini-nano/ml-kit-genai)
- [ML Kit GenAI Documentation](https://developers.google.com/ml-kit/genai)
- [Prompt API](https://developers.google.com/ml-kit/genai/prompt/android)
- [Summarization API](https://developers.google.com/ml-kit/genai/summarization/android)
- [Google AI Edge SDK (deprecated)](https://developer.android.com/ai/gemini-nano/ai-edge-sdk)
- [ML Kit GenAI Samples](https://github.com/googlesamples/mlkit/tree/master/android/genai)
