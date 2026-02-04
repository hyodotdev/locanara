# Google Gemini Nano API Reference

> **Source**: Google ML Kit GenAI SDK
> **Requires**: Android 14+ (API 34+) with Gemini Nano support

## Overview

Gemini Nano is Google's on-device language model available through ML Kit GenAI SDK. It enables text generation, summarization, and other NLP tasks directly on Android devices without cloud connectivity.

## Availability

Gemini Nano is currently available on:
- Google Pixel 8 and newer
- Samsung Galaxy S24 and newer
- Select flagship devices with NPU support

## Installation

### Gradle

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
    implementation("com.google.mlkit:genai:0.1.0")
}
```

### Manifest

```xml
<uses-feature
    android:name="android.hardware.npu"
    android:required="false" />
```

## Availability Check

```kotlin
import com.google.mlkit.genai.GenerativeModel

// Check if Gemini Nano is available
suspend fun checkAvailability(): Boolean {
    return try {
        val model = GenerativeModel.getOnDeviceModel()
        model != null
    } catch (e: Exception) {
        false
    }
}
```

## Text Generation

### Basic Generation

```kotlin
import com.google.mlkit.genai.GenerativeModel

val model = GenerativeModel.getOnDeviceModel()

val response = model.generateContent("Summarize: $text")
println(response.text)
```

### Streaming Generation

```kotlin
model.generateContentStream("Tell me a story").collect { chunk ->
    print(chunk.text)
}
```

## Chat Session

```kotlin
val chat = model.startChat()

// Single response
val response1 = chat.sendMessage("Hello!")
println(response1.text)

// Streaming
chat.sendMessageStream("Tell me more").collect { chunk ->
    print(chunk.text)
}
```

## Configuration

### Generation Config

```kotlin
val config = GenerationConfig(
    maxOutputTokens = 500,
    temperature = 0.7f,
    topP = 0.9f,
    topK = 40
)

val model = GenerativeModel.getOnDeviceModel(
    generationConfig = config
)
```

### Safety Settings

```kotlin
val safetySettings = listOf(
    SafetySetting(HarmCategory.HARASSMENT, BlockThreshold.MEDIUM_AND_ABOVE),
    SafetySetting(HarmCategory.HATE_SPEECH, BlockThreshold.MEDIUM_AND_ABOVE)
)

val model = GenerativeModel.getOnDeviceModel(
    safetySettings = safetySettings
)
```

## Error Handling

```kotlin
try {
    val response = model.generateContent(prompt)
} catch (e: GeminiNanoNotAvailableException) {
    // Device doesn't support Gemini Nano
} catch (e: ModelNotReadyException) {
    // Model is downloading or not ready
} catch (e: GenerationException) {
    // Generation failed
} catch (e: ContentBlockedException) {
    // Content safety triggered
}
```

## Feature Detection

```kotlin
// Check specific features
val capabilities = model.capabilities

if (capabilities.supportsStreaming) {
    // Use streaming
}

if (capabilities.maxContextLength >= 4096) {
    // Can handle longer prompts
}
```

## Best Practices

### 1. Check Availability First

```kotlin
suspend fun initializeAI(): Result<GenerativeModel> {
    return try {
        val model = GenerativeModel.getOnDeviceModel()
        if (model != null) {
            Result.success(model)
        } else {
            Result.failure(GeminiNanoNotAvailableException())
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### 2. Handle Model Download

```kotlin
// Some devices may need to download the model first
model.ensureModelDownloaded().addOnSuccessListener {
    // Model ready
}.addOnFailureListener { e ->
    // Download failed
}
```

### 3. Optimize for Battery

```kotlin
// Use batch processing for multiple requests
val prompts = listOf("prompt1", "prompt2", "prompt3")
val responses = model.batchGenerateContent(prompts)

// Avoid rapid successive calls
```

### 4. Context Management

```kotlin
// Keep context manageable
val chat = model.startChat(
    history = listOf(
        Content.text("System: You are a helpful assistant."),
        Content.text("User: Hello"),
        Content.text("Model: Hello! How can I help?")
    )
)

// Clear old context when switching topics
chat.clearHistory()
```

## Limitations

- Available on select devices only
- Smaller context window than cloud models
- No custom model loading
- Rate limits may apply
- Content safety filters active

## Comparison with Foundation Models

| Feature | Gemini Nano | Foundation Models |
|---------|-------------|-------------------|
| Platform | Android 14+ | iOS 26+ / macOS 26+ |
| Device Support | Select flagships | Apple Intelligence devices |
| Context Size | ~4K tokens | ~4K tokens |
| Custom Models | No | No |
| Streaming | Yes | Yes |
| Offline | Yes | Yes |

## Integration with Locanara

Locanara's Android SDK wraps Gemini Nano:

```kotlin
// Locanara abstracts Gemini Nano
val result = Locanara.summarize(text)

// Equivalent to:
val model = GenerativeModel.getOnDeviceModel()
val response = model.generateContent("Summarize: $text")
```
