# Apple Foundation Models API Reference

> **Source**: Apple Developer Documentation
> **Requires**: iOS 26+ / macOS 26+ with Apple Intelligence

## Overview

Foundation Models framework provides on-device language model capabilities through Apple Intelligence. The framework enables text generation, summarization, and other NLP tasks without sending data to external servers.

## Availability Check

```swift
import FoundationModels

// Check if Foundation Models is available
if FoundationModels.isAvailable {
    // Use Foundation Models
}

// Check specific capabilities
let capability = await FoundationModels.currentCapability()
```

## Text Generation

### Basic Generation

```swift
import FoundationModels

let model = SystemLanguageModel.default

let response = try await model.generate(
    prompt: "Summarize the following text: \(text)"
)
print(response.text)
```

### Streaming Generation

```swift
let stream = model.generateStream(prompt: prompt)

for try await chunk in stream {
    print(chunk.text, terminator: "")
}
```

## Session-Based Chat

```swift
let session = LanguageModelSession()

// Add system instruction
session.systemInstruction = "You are a helpful assistant."

// Send messages
let response1 = try await session.respond(to: "Hello!")
let response2 = try await session.respond(to: "Tell me a joke")

// Streaming
for try await chunk in session.streamResponse(to: "Explain quantum physics") {
    print(chunk.text, terminator: "")
}
```

## Guided Generation

### JSON Output

```swift
@Generable
struct MovieReview {
    let title: String
    let rating: Int
    let summary: String
}

let review = try await model.generate(
    MovieReview.self,
    prompt: "Review the movie Inception"
)
print(review.title)  // "Inception"
print(review.rating) // 9
```

### Enum Classification

```swift
@Generable
enum Sentiment: String {
    case positive
    case negative
    case neutral
}

let sentiment = try await model.generate(
    Sentiment.self,
    prompt: "Classify: I love this product!"
)
// Returns: .positive
```

## Tool Calling

```swift
@Tool
struct WeatherTool {
    @Parameter(description: "City name")
    var city: String

    func call() async throws -> String {
        // Fetch weather for city
        return "Sunny, 72°F"
    }
}

let response = try await model.generate(
    prompt: "What's the weather in Tokyo?",
    tools: [WeatherTool.self]
)
```

## Configuration

### Generation Parameters

```swift
let config = GenerationConfiguration(
    maxTokens: 500,
    temperature: 0.7,
    topP: 0.9
)

let response = try await model.generate(
    prompt: prompt,
    configuration: config
)
```

### Safety Settings

```swift
let config = GenerationConfiguration(
    safetySettings: .strict
)
```

## Error Handling

```swift
do {
    let response = try await model.generate(prompt: prompt)
} catch FoundationModelsError.notAvailable {
    // Apple Intelligence not enabled
} catch FoundationModelsError.quotaExceeded {
    // Rate limited
} catch FoundationModelsError.contentBlocked {
    // Content safety triggered
} catch {
    // Other error
}
```

## Best Practices

### 1. Check Availability First

```swift
guard FoundationModels.isAvailable else {
    // Fallback or show error
    return
}
```

### 2. Handle Streaming Cancellation

```swift
let task = Task {
    for try await chunk in stream {
        if Task.isCancelled { break }
        process(chunk)
    }
}

// Later
task.cancel()
```

### 3. Optimize Prompts

```swift
// Good - Clear instruction
let prompt = """
Summarize the following article in 2-3 sentences:

\(articleText)
"""

// Bad - Vague instruction
let prompt = "Summarize: \(articleText)"
```

## Limitations

- Requires Apple Intelligence enabled device
- iOS 26+ / macOS 26+ only
- No custom model loading
- Rate limits apply
- Content safety filters active

## Integration with Locanara

Locanara's Community tier wraps Foundation Models:

```swift
// Locanara abstracts Foundation Models
let result = try await Locanara.summarize(text)

// Equivalent to:
let model = SystemLanguageModel.default
let response = try await model.generate(
    prompt: "Summarize: \(text)"
)
```
