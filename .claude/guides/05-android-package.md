# Android Package (Android SDK)

## Overview

Location: `packages/android/`

The Android SDK provides Locanara functionality for Android using on-device AI via ML Kit GenAI and Gemini Nano.

## Requirements

- Android Studio (latest stable)
- Android SDK API 26+ (ML Kit GenAI)
- Android SDK API 34+ (Prompt API / Gemini Nano)
- Kotlin 2.0+
- Gradle 8+

## Build Commands

```bash
cd packages/android

# Build
./gradlew build

# Test
./gradlew test

# Build example app (Pro variant)
./gradlew :example:assembleProDebug

# Install example app
adb install -r example/build/outputs/apk/pro/debug/example-pro-debug.apk

# Generate types from GQL
./scripts/generate-types.sh
```

## Project Structure

```text
packages/android/
├── locanara/
│   └── src/main/kotlin/com/locanara/
│       ├── Locanara.kt           # Main SDK entry point
│       ├── mlkit/
│       │   ├── MLKitClients.kt   # ML Kit GenAI clients (Summarize, Proofread, Rewrite, DescribeImage)
│       │   └── MLKitPromptClient.kt  # Prompt API client (Chat, Classify, Extract, Translate)
│       └── types/                # Generated types from GQL
├── example/                      # Sample app
│   └── src/main/kotlin/com/locanara/example/
│       ├── MainActivity.kt
│       ├── components/pages/     # Feature screens
│       └── viewmodel/            # ViewModel
├── build.gradle.kts
└── scripts/
```

## On-Device AI Architecture

### ML Kit GenAI APIs (Android 8+)

Uses dedicated ML Kit GenAI APIs for specific tasks:

| Feature       | API                                        | Min API Level |
| ------------- | ------------------------------------------ | ------------- |
| Summarize     | `com.google.mlkit:genai-summarization`     | 26            |
| Proofread     | `com.google.mlkit:genai-proofreading`      | 26            |
| Rewrite       | `com.google.mlkit:genai-rewriting`         | 26            |
| DescribeImage | `com.google.mlkit:genai-image-description` | 26            |

### ML Kit Prompt API (Android 14+)

Uses the Prompt API for flexible text generation with Gemini Nano:

| Feature   | API                             | Min API Level |
| --------- | ------------------------------- | ------------- |
| Chat      | `com.google.mlkit:genai-prompt` | 34            |
| Classify  | `com.google.mlkit:genai-prompt` | 34            |
| Extract   | `com.google.mlkit:genai-prompt` | 34            |
| Translate | `com.google.mlkit:genai-prompt` | 34            |

## CRITICAL: Prompt API Implementation Notes

### DO NOT use Google AI Edge SDK

```kotlin
// WRONG - This SDK is for SYSTEM APPS ONLY (Recorder, Gboard, etc.)
// Third-party apps will get "Required LLM feature not found" error
implementation("com.google.ai.edge.aicore:aicore:0.0.1-exp02")
```

### USE ML Kit Prompt API instead

```kotlin
// CORRECT - This works for third-party apps
implementation("com.google.mlkit:genai-prompt:1.0.0-alpha1")
```

### Status Check Behavior

The Prompt API `checkStatus()` may return `DOWNLOADABLE` even when Gemini Nano is already installed and working on the device (e.g., Recorder app works):

```kotlin
val model = Generation.getClient()
val status = model.checkStatus()  // Returns FeatureStatus.DOWNLOADABLE

// BUT the API works without calling download()!
val response = model.generateContent(request)  // Works fine!
```

**Key insight**: Treat `DOWNLOADABLE` as equivalent to `AVAILABLE`. Do NOT require users to download - the features work without explicit download.

### Correct Implementation Pattern

```kotlin
// MLKitPromptClient.kt
class MLKitPromptClient(private val context: Context) {
    private var generativeModel: GenerativeModel? = null

    private fun getModel(): GenerativeModel {
        return generativeModel ?: Generation.getClient().also { generativeModel = it }
    }

    suspend fun checkStatus(): PromptApiStatus = withContext(Dispatchers.IO) {
        val model = getModel()
        val status = model.checkStatus()  // Synchronous call, NOT .await()

        when (status) {
            FeatureStatus.AVAILABLE -> PromptApiStatus.Available
            FeatureStatus.DOWNLOADABLE -> PromptApiStatus.Downloadable  // Treat as usable
            FeatureStatus.DOWNLOADING -> PromptApiStatus.Downloading
            FeatureStatus.UNAVAILABLE -> PromptApiStatus.NotAvailable("...")
            else -> PromptApiStatus.NotAvailable("Unknown status")
        }
    }

    suspend fun chat(message: String): ChatResult = withContext(Dispatchers.IO) {
        val model = getModel()
        val request = generateContentRequest(TextPart(prompt)) {
            temperature = 0.7f
            topK = 40
            candidateCount = 1
        }
        val response = model.generateContent(request)
        val text = response.candidates.firstOrNull()?.text ?: ""
        // ...
    }
}
```

### Device Capability Check

When checking if device supports Gemini Nano:

```kotlin
// Both Available AND Downloadable mean the device supports it
val supportsGeminiNano = when (promptApiStatus) {
    is PromptApiStatus.Available -> true
    is PromptApiStatus.Downloadable -> true  // IMPORTANT: Include this!
    is PromptApiStatus.Downloading -> true
    is PromptApiStatus.NotAvailable -> false
}
```

## Dependencies

```kotlin
// build.gradle.kts
dependencies {
    // ML Kit GenAI APIs (works on most Android 8+ devices)
    implementation("com.google.mlkit:genai-summarization:1.0.0-beta1")
    implementation("com.google.mlkit:genai-proofreading:1.0.0-beta1")
    implementation("com.google.mlkit:genai-rewriting:1.0.0-beta1")
    implementation("com.google.mlkit:genai-image-description:1.0.0-beta1")

    // ML Kit Prompt API (requires Gemini Nano capable device)
    implementation("com.google.mlkit:genai-prompt:1.0.0-alpha1")

    // Required for await() on ListenableFuture
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.8.1")
}
```

## Example App

The Example app demonstrates SDK features and is used for testing.

```bash
# Build variants
./gradlew :example:assembleProDebug      # Pro variant (with bundled models)
./gradlew :example:assembleCommunityDebug # Community variant (OS-level AI only)

# Install and launch
adb install -r example/build/outputs/apk/pro/debug/example-pro-debug.apk
adb shell monkey -p com.locanara.example.pro -c android.intent.category.LAUNCHER 1

# Check logs
adb logcat -s "Locanara" "MLKitPromptClient"
```

## Integration

### Gradle (Kotlin DSL)

```kotlin
dependencies {
    implementation("com.locanara:locanara-android:1.0.0")
}
```

## Key Files

- `locanara/src/main/kotlin/com/locanara/Locanara.kt` - Main SDK entry point
- `locanara/src/main/kotlin/com/locanara/mlkit/MLKitClients.kt` - ML Kit GenAI clients
- `locanara/src/main/kotlin/com/locanara/mlkit/MLKitPromptClient.kt` - Prompt API client
- `locanara/src/main/kotlin/com/locanara/types/` - Generated types from GQL

## Troubleshooting

### "Required LLM feature not found" error

You're using the wrong SDK. Switch from `com.google.ai.edge.aicore` to `com.google.mlkit:genai-prompt`.

### Prompt API returns DOWNLOADABLE but Recorder works

This is expected behavior. The Prompt API works without explicit download - just use it directly.

### Features show "Gemini Nano Not Available"

Check if you're treating `DOWNLOADABLE` status as "not available". It should be treated as available.

## Notes

- Generated type files are synced from `packages/gql`
- Always run `bun run generate` from root after schema changes
- Test on real devices - emulators don't support Gemini Nano
