# Locanara Coding Style

> **Priority: MANDATORY**
> Follow these style guidelines for all code contributions.

## Swift Style Guide

### General Principles

1. **Prefer `async/await`** for all AI operations
2. **Use strict concurrency** (Swift 6.0 ready)
3. **Mark types as `Sendable`** where appropriate
4. **Avoid force unwrapping** - handle optionals safely

### Imports

```swift
// CORRECT - System frameworks first, then external
import Foundation
import os.log

import LocalLLMClient
import LocalLLMClientLlama

// INCORRECT - Mixed order
import LocalLLMClient
import Foundation
```

### Class/Struct Declarations

```swift
// CORRECT - Clear, documented, concurrency-safe
/// On-device LLM inference engine using llama.cpp
///
/// Provides real on-device LLM inference using GGUF format models.
@available(iOS 17.0, macOS 14.0, *)
public final class LlamaCppEngine: @unchecked Sendable, InferenceEngine {

    // MARK: - Properties

    public private(set) var isLoaded: Bool = false
    private let modelPath: URL
    private let config: Configuration

    // MARK: - Initialization

    private init(modelPath: URL, config: Configuration) {
        self.modelPath = modelPath
        self.config = config
    }
}

// INCORRECT - Missing documentation, access control
class LlamaCppEngine {
    var isLoaded = false
    var modelPath: URL
}
```

### MARK Comments

Use `MARK` comments to organize code:

```swift
// MARK: - Properties

// MARK: - Initialization

// MARK: - Public Methods

// MARK: - Private Methods

// MARK: - Protocol Conformance
```

### Error Handling

```swift
// CORRECT - Descriptive error with context
guard FileManager.default.fileExists(atPath: modelPath.path) else {
    throw LocanaraError.modelNotDownloaded(modelPath.lastPathComponent)
}

// CORRECT - Multiple validation with early return
func loadModel() async throws {
    guard !isLoaded else { return }

    guard FileManager.default.fileExists(atPath: path) else {
        throw LocanaraError.modelNotDownloaded(name)
    }

    guard availableMemory > requiredMemory else {
        throw LocanaraError.insufficientMemory(
            required: requiredMemory,
            available: availableMemory
        )
    }

    // Load model...
}

// INCORRECT - Generic error
throw NSError(domain: "Error", code: -1)
```

### Async/Await Patterns

```swift
// CORRECT - Factory pattern with async initialization
public static func create(
    modelPath: URL,
    config: Configuration = .default
) async throws -> LlamaCppEngine {
    let engine = LlamaCppEngine(modelPath: modelPath, config: config)
    try await engine.loadModel()
    return engine
}

// CORRECT - Streaming with AsyncThrowingStream
public func generateStreaming(
    prompt: String,
    config: InferenceConfig
) -> AsyncThrowingStream<String, Error> {
    AsyncThrowingStream { continuation in
        Task { [weak self] in
            guard let self = self else {
                continuation.finish(throwing: LocanaraError.custom(.modelNotLoaded, "Engine deallocated"))
                return
            }

            do {
                for try await text in session.streamResponse(to: prompt) {
                    continuation.yield(text)
                }
                continuation.finish()
            } catch {
                continuation.finish(throwing: error)
            }
        }
    }
}
```

### Logging

Use `os.log` for structured logging:

```swift
import os.log

private let logger = Logger(subsystem: "com.locanara.pro", category: "LlamaCppEngine")

// CORRECT - Appropriate log levels
logger.debug("Processing request...")
logger.info("Model loaded successfully: \(modelName)")
logger.warning("Low memory condition: \(availableMemory)MB")
logger.error("Failed to load model: \(error.localizedDescription)")

// INCORRECT - Using print
print("Model loaded")
```

### Access Control

```swift
// CORRECT - Explicit access control
public final class ModelManager {
    public static let shared = ModelManager()

    public private(set) var downloadedModels: [ModelInfo] = []

    private let storage: ModelStorage
    private let downloader: ModelDownloader

    private init() {
        self.storage = ModelStorage()
        self.downloader = ModelDownloader()
    }

    public func downloadModel(id: String) async throws { }

    private func validateModel(_ path: URL) -> Bool { }
}

// INCORRECT - Missing access control
class ModelManager {
    static let shared = ModelManager()
    var models: [ModelInfo] = []
}
```

### Thread Safety

```swift
// CORRECT - Using locks for mutable state
public final class LlamaCppEngine: @unchecked Sendable {
    private var isCancelled: Bool = false
    private let lock = NSLock()

    public func cancel() -> Bool {
        lock.lock()
        defer { lock.unlock() }

        if !isCancelled {
            isCancelled = true
            return true
        }
        return false
    }

    // Or use lock.withLock
    func checkCancelled() -> Bool {
        lock.withLock { isCancelled }
    }
}

// INCORRECT - No synchronization
public func cancel() {
    isCancelled = true  // Data race!
}
```

## Kotlin Style Guide

### General Principles

1. **Use `suspend` functions** for AI operations
2. **Use `Flow`** for streaming responses
3. **Avoid nullable types** where possible
4. **Use data classes** for simple DTOs

### Class Declarations

```kotlin
// CORRECT - Clear, documented
/**
 * Device capability information for on-device AI
 */
data class DeviceCapability(
    val tier: Tier,
    val isGeminiNanoAvailable: Boolean,
    val supportedFeatures: List<Feature>,
    val memoryLimitMB: Int
)

// CORRECT - Sealed class for errors
sealed class LocanaraError : Exception() {
    object NotAvailable : LocanaraError()
    data class ModelNotDownloaded(val modelId: String) : LocanaraError()
    data class InsufficientMemory(val required: Int, val available: Int) : LocanaraError()
}
```

### Coroutines

```kotlin
// CORRECT - Suspend function for async operations
suspend fun summarize(text: String, options: SummarizeOptions? = null): String {
    return withContext(Dispatchers.Default) {
        // Implementation
    }
}

// CORRECT - Flow for streaming
fun chat(messages: List<ChatMessage>): Flow<String> = flow {
    for (chunk in generateResponse(messages)) {
        emit(chunk)
    }
}.flowOn(Dispatchers.Default)
```

## Documentation

### Swift DocC

```swift
/// Summarizes the given text using on-device AI.
///
/// This method uses the platform's on-device AI model
/// to generate a concise summary of the input text.
///
/// - Parameters:
///   - text: The text to summarize. Must not be empty.
///   - options: Optional summarization settings.
///
/// - Returns: A summarized version of the input text.
///
/// - Throws: `LocanaraError.notAvailable` if AI is not available.
/// - Throws: `LocanaraError.invalidInput` if text is empty.
///
/// - Example:
///   ```swift
///   let summary = try await Locanara.summarize("Long article text...")
///   print(summary)
///   ```
public func summarize(_ text: String, options: SummarizeOptions? = nil) async throws -> String
```

### Kotlin KDoc

```kotlin
/**
 * Summarizes the given text using on-device AI.
 *
 * @param text The text to summarize. Must not be empty.
 * @param options Optional summarization settings.
 * @return A summarized version of the input text.
 * @throws LocanaraError.NotAvailable if AI is not available.
 * @throws LocanaraError.InvalidInput if text is empty.
 *
 * @sample
 * ```kotlin
 * val summary = Locanara.summarize("Long article text...")
 * println(summary)
 * ```
 */
suspend fun summarize(text: String, options: SummarizeOptions? = null): String
```
