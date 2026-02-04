# Locanara API Design

> **Priority: MANDATORY**
> All API design MUST follow these principles.

## Core Principles

### 1. On-Device Only

**Never** add cloud fallback. All AI processing must happen locally.

```swift
// CORRECT - Fails if on-device AI not available
public func summarize(_ text: String) async throws -> String {
    guard await isAvailable() else {
        throw LocanaraError.notAvailable
    }
    // Process locally
}

// INCORRECT - Cloud fallback
public func summarize(_ text: String) async throws -> String {
    if await isAvailable() {
        return try await localSummarize(text)
    } else {
        return try await cloudSummarize(text)  // NEVER DO THIS
    }
}
```

### 2. Cross-Platform Consistency

Same method names and signatures across all platforms:

```
Platform   │ Method
───────────┼────────────────────────────
iOS/macOS  │ Locanara.summarize(text:)
Android    │ Locanara.summarize(text)
Web        │ locanara.summarize(text)
```

### 3. Async by Default

All AI operations are async:

```swift
// iOS/macOS
let result = try await Locanara.summarize(text)

// Android
val result = Locanara.summarize(text)  // suspend function

// Web
const result = await locanara.summarize(text);
```

### 4. Streaming for Chat

Chat always returns a stream:

```swift
// iOS/macOS
for try await chunk in Locanara.chat(messages: messages) {
    print(chunk, terminator: "")
}

// Android
Locanara.chat(messages).collect { chunk ->
    print(chunk)
}
```

## API Reference

### Device Capability

```swift
// Returns device AI capability information
public static func getDeviceCapability() async -> DeviceCapability

struct DeviceCapability {
    let tier: Tier                    // .community or .pro
    let isAppleIntelligenceAvailable: Bool
    let isFoundationModelsAvailable: Bool
    let isProModelDownloaded: Bool
    let supportedFeatures: [Feature]
    let memoryLimitMB: Int
    let recommendedContextSize: Int
}
```

### Text Features

```swift
// Summarization
public static func summarize(
    _ text: String,
    options: SummarizeOptions? = nil
) async throws -> String

struct SummarizeOptions {
    let maxLength: Int?
    let style: SummarizeStyle?  // .brief, .detailed, .bullets
}

// Classification
public static func classify(
    _ text: String,
    categories: [String]
) async throws -> String

// Extraction
public static func extract(
    _ text: String,
    schema: String  // JSON schema
) async throws -> String  // Returns JSON

// Translation
public static func translate(
    _ text: String,
    to targetLanguage: String
) async throws -> String

// Rewriting
public static func rewrite(
    _ text: String,
    options: RewriteOptions
) async throws -> String

struct RewriteOptions {
    let tone: RewriteTone  // .formal, .casual, .professional
    let preserveLength: Bool
}

// Proofreading
public static func proofread(
    _ text: String
) async throws -> String
```

### Chat

```swift
// Streaming chat
public static func chat(
    messages: [ChatMessage]
) -> AsyncThrowingStream<String, Error>

struct ChatMessage {
    let role: Role  // .user, .assistant, .system
    let content: String
}
```

### Image Description

```swift
// Describe image content
public static func describeImage(
    _ imageData: Data
) async throws -> String
```

## Pro Tier API

Pro tier extends Community with model management:

### Model Management

```swift
// Download model
public func downloadModel(
    modelId: String,
    progress: ((Double) -> Void)? = nil
) async throws

// List downloaded models
public func listDownloadedModels() -> [ModelInfo]

// Delete model
public func deleteModel(modelId: String) async throws

// Get model info
public func getModelInfo(modelId: String) -> ModelInfo?

struct ModelInfo {
    let id: String
    let name: String
    let sizeBytes: Int64
    let downloadedAt: Date
    let path: URL
}
```

### Capability Detection

```swift
// Detect Pro capabilities
public func detectCapability() async -> ProCapability

struct ProCapability {
    let availableMemoryMB: Int
    let isMetalSupported: Bool
    let recommendedModel: String
    let maxContextSize: Int
    let canRunPro: Bool
}
```

### Engine Management

```swift
// Get active engine
public func getActiveEngine() -> InferenceEngineType

// Set preferred engine
public func setPreferredEngine(_ engine: InferenceEngineType)

enum InferenceEngineType {
    case foundationModels  // Apple Intelligence
    case llamaCpp          // llama.cpp via LocalLLMClient
    case mlx               // MLX (future)
    case coreML            // CoreML (future)
}
```

## Error Design

All errors MUST be:

1. **Typed** - Use `LocanaraError` enum
2. **Descriptive** - Include context information
3. **Actionable** - Caller can determine recovery action

```swift
public enum LocanaraError: Error {
    /// AI not available on this device
    case notAvailable

    /// Model needs to be downloaded first
    case modelNotDownloaded(String)

    /// Failed to load model into memory
    case modelLoadFailed(String)

    /// Not enough memory for operation
    case insufficientMemory(required: Int, available: Int)

    /// AI execution failed
    case executionFailed(String)

    /// Invalid input provided
    case invalidInput(String)

    /// Feature not supported on this tier/device
    case featureNotAvailable

    /// Network error during download
    case networkError(String)

    /// Operation was cancelled
    case cancelled

    /// Generic error with code
    case custom(ErrorCode, String)
}

// Recovery example
do {
    let result = try await Locanara.summarize(text)
} catch LocanaraError.notAvailable {
    // Show "AI not available" UI
} catch LocanaraError.modelNotDownloaded(let modelId) {
    // Prompt user to download model
    try await ModelManager.shared.downloadModel(modelId: modelId)
} catch LocanaraError.insufficientMemory(let required, let available) {
    // Show "Close other apps" message
}
```

## Options Pattern

Use optional options structs for configurable operations:

```swift
// CORRECT - Options are optional with sensible defaults
public static func summarize(
    _ text: String,
    options: SummarizeOptions? = nil
) async throws -> String

// Usage
let summary1 = try await Locanara.summarize(text)  // Use defaults
let summary2 = try await Locanara.summarize(text, options: .init(maxLength: 100))

// INCORRECT - Too many parameters
public static func summarize(
    _ text: String,
    maxLength: Int? = nil,
    style: SummarizeStyle? = nil,
    format: OutputFormat? = nil
) async throws -> String
```

## Platform-Specific APIs

When adding platform-specific functionality:

```swift
// iOS-specific: Use IOS suffix
public func getStorefrontIOS() async -> String?

// Android-specific: Use Android suffix in cross-platform package
// In Android-only package, no suffix needed
public fun getPackageName(): String

// Cross-platform: No suffix
public func getDeviceCapability() async -> DeviceCapability
```
