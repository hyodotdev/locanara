# Locanara Project Context

> **Auto-generated for Claude Code**
> Last updated: 2026-02-04T13:41:29.100Z
>
> Usage: `claude --context knowledge/_claude-context/context.md`

---

# 🚨 INTERNAL RULES (MANDATORY)

These rules define Locanara's development philosophy.
**You MUST follow these rules EXACTLY. No exceptions.**

---

<!-- Source: internal/01-naming-conventions.md -->

# Locanara Naming Conventions

> **Priority: MANDATORY**
> These rules MUST be followed without exception.

## API Method Naming

All platforms use **identical method names** for cross-platform consistency:

```
getDeviceCapability() - Check device AI support
summarize()           - Text summarization
classify()            - Text classification
extract()             - Entity extraction
translate()           - Language translation
rewrite()             - Text rewriting
proofread()           - Grammar correction
chat()                - Conversational AI (streaming)
describeImage()       - Image description
```

### Action Prefix Rules

| Prefix | When to Use | Examples |
|--------|-------------|----------|
| `get` | Synchronous data retrieval | `getDeviceCapability`, `getActiveEngine` |
| `list` | Return array of items | `listDownloadedModels`, `listSupportedFeatures` |
| `download` | Async fetch from network | `downloadModel` |
| `delete` | Remove data | `deleteModel` |
| `set` | Configure settings | `setPreferredEngine` |
| `is/has` | Boolean checks | `isLoaded`, `hasActiveModel` |
| `detect` | Capability detection | `detectCapability` |

## Swift Naming (iOS/macOS)

### Class/Struct Naming

```swift
// CORRECT - PascalCase
Locanara
LocanaraPro
DeviceCapability
ModelManager
InferenceEngine

// INCORRECT
locanara        // No lowercase
LOCANARA        // No all caps
Device_Capability  // No underscores
```

### Protocol Naming

```swift
// CORRECT - End with -able, -ible, or descriptive noun
InferenceEngine      // Describes capability
LlamaCppEngineProtocol
Sendable
Codable

// INCORRECT
IEngine             // No I- prefix
EngineInterface     // Avoid -Interface suffix
```

### Error Naming

All errors MUST use `Locanara` prefix:

```swift
// CORRECT
LocanaraError.notAvailable
LocanaraError.modelNotDownloaded
LocanaraError.insufficientMemory
LocanaraError.executionFailed

// INCORRECT
AIError.notAvailable    // Missing Locanara prefix
Error.modelNotFound     // Missing Locanara prefix
```

### Acronym Rules

- **Acronyms 2 letters: ALL CAPS** (AI, UI, ID)
- **Acronyms 3+ letters: PascalCase** (Llm, Mlx, Api)

```swift
// CORRECT
AICapability      // AI = 2 letters, ALL CAPS
LlmEngine         // Llm = 3 letters, PascalCase
ModelID           // ID = 2 letters, ALL CAPS
ApiResponse       // Api = 3 letters, PascalCase

// INCORRECT
AiCapability      // AI should be ALL CAPS
LLMEngine         // LLM should be Llm
ModelId           // ID should be ALL CAPS
APIResponse       // API should be Api
```

## Kotlin Naming (Android)

### Class Naming

```kotlin
// CORRECT - PascalCase
Locanara
DeviceCapability
ModelManager

// INCORRECT
locanara
LOCANARA
```

### Package Naming

```kotlin
// CORRECT - all lowercase, dot-separated
com.locanara
com.locanara.types
com.locanara.features

// INCORRECT
com.Locanara
com.locanara.Types
```

## File Naming

### Swift Files

- Use `PascalCase`: `Locanara.swift`, `ModelManager.swift`
- Group by feature in directories: `Features/`, `Engine/`, `Types/`

### Kotlin Files

- Use `PascalCase`: `Locanara.kt`, `ModelManager.kt`
- Match class name to file name

### TypeScript/JavaScript

- Use `kebab-case` for file names: `device-capability.ts`
- Use `PascalCase` for single class files: `DeviceCapability.ts`

## Variable Naming

```swift
// CORRECT - camelCase for variables
let modelPath: URL
let isLoaded: Bool
let contextSize: Int
var availableMemory: Int

// INCORRECT
let ModelPath: URL      // No PascalCase
let is_loaded: Bool     // No snake_case
let CONTEXT_SIZE: Int   // No ALL_CAPS (unless constant)
```

## Constants

```swift
// CORRECT - static let with descriptive name
static let defaultContextSize = 4096
static let minimumMemoryMB = 500

// INCORRECT
static let DEFAULT_CONTEXT_SIZE = 4096  // No ALL_CAPS
static let k = 4096                      // Too short
```

## Pro Tier Specific

Pro tier classes use `Pro` suffix or `Pro` in name:

```swift
// CORRECT
LocanaraPro           // Main Pro module
ProCapabilityDetector // Pro-specific capability
ModelManager          // Shared (no suffix needed)

// INCORRECT
LocanaraProTier       // Too verbose
ProLocanara           // Pro should be suffix
```


---

<!-- Source: internal/02-architecture.md -->

# Locanara Architecture

> **Priority: MANDATORY**
> Understand and follow this architecture exactly.

## Core Principle: On-Device Only

**All AI processing happens locally. No cloud fallback. Privacy first.**

- User data NEVER leaves the device
- No network calls for AI inference
- No telemetry or analytics on user content

## Product Tiers

### Community Tier

```
┌─────────────────────────────────────────────┐
│              COMMUNITY TIER                 │
├─────────────────────────────────────────────┤
│  Engine: Foundation Models (Apple)          │
│  Requirements: iOS 26+ / macOS 26+          │
│  NPU: Required (Apple Intelligence)         │
│  Device Coverage: ~20% (flagships only)     │
│  App Size Impact: < 5MB                     │
│  External Dependencies: None                │
└─────────────────────────────────────────────┘
```

**Use Case**: Apps that only need to support latest devices with Apple Intelligence.

### Pro Tier

```
┌─────────────────────────────────────────────┐
│                PRO TIER                     │
├─────────────────────────────────────────────┤
│  Engine: llama.cpp (via LocalLLMClient)     │
│  Fallback: Foundation Models (if available) │
│  Requirements: iOS 17+ / macOS 14+          │
│  NPU: Not required (CPU/GPU inference)      │
│  Device Coverage: ~99% (universal)          │
│  App Size Impact: +50MB~                    │
│  External Dependencies: LocalLLMClient      │
└─────────────────────────────────────────────┘
```

**Use Case**: Apps needing universal device support with offline AI.

## Package Structure

```
locanara/locanara/
├── Package.swift              # Swift Package definition
├── SourcesCommunity/          # Community tier (no dependencies)
│   ├── Locanara.swift         # Main entry point
│   ├── Types.swift            # Shared types
│   ├── Errors.swift           # LocanaraError definitions
│   ├── Extensions.swift       # Swift extensions
│   ├── Tier.swift             # Tier enum
│   └── Features/              # Feature implementations
│       ├── Summarize.swift
│       ├── Classify.swift
│       ├── Extract.swift
│       ├── Translate.swift
│       ├── Rewrite.swift
│       ├── Proofread.swift
│       ├── Chat.swift
│       └── DescribeImage.swift
│
├── SourcesPro/                # Pro tier (depends on Community + LocalLLMClient)
│   ├── LocanaraPro.swift      # Pro entry point
│   ├── ProTypes.swift         # Pro-specific types
│   ├── ProCapabilityDetector.swift
│   ├── InferenceRouter.swift  # Routes to best available engine
│   ├── Engine/                # Inference engines
│   │   ├── InferenceEngine.swift      # Protocol
│   │   ├── LlamaCppEngine.swift       # llama.cpp implementation
│   │   ├── MLXEngine.swift            # MLX (placeholder)
│   │   ├── CoreMLEngine.swift         # CoreML (placeholder)
│   │   ├── MemoryManager.swift        # Memory management
│   │   └── StreamingGenerator.swift   # Streaming support
│   └── ModelManager/          # Model download/storage
│       ├── ModelManager.swift
│       ├── ModelDownloader.swift
│       ├── ModelStorage.swift
│       └── ModelRegistry.swift
│
├── Tests/                     # Unit tests
├── knowledge/                 # Knowledge base (this)
└── scripts/agent/             # RAG agent scripts
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ Locanara │    │Locanara  │    │   Both   │
       │(Community)│   │   Pro    │    │          │
       └──────────┘    └──────────┘    └──────────┘
              │               │               │
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │Foundation│    │LocalLLM  │    │Foundation│
       │ Models   │    │ Client   │    │+ LocalLLM│
       │  (OS)    │    │(llama.cpp│    │          │
       └──────────┘    └──────────┘    └──────────┘
```

## Inference Flow

### Community Tier Flow

```
User Request
     │
     ▼
┌─────────────────┐
│ Check Device    │
│ Capability      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No    ┌─────────────────┐
│ Foundation      │──────────▶│ Return Error    │
│ Models Ready?   │           │ .notAvailable   │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Execute via     │
│ Foundation      │
│ Models API      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Result   │
└─────────────────┘
```

### Pro Tier Flow

```
User Request
     │
     ▼
┌─────────────────┐
│ InferenceRouter │
│ .route()        │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│ Foundation      │              │ LlamaCpp        │
│ Models Ready?   │              │ Model Ready?    │
└────────┬────────┘              └────────┬────────┘
         │ Yes                            │ Yes
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│ Use Foundation  │              │ Use LlamaCpp    │
│ Models          │              │ Engine          │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └──────────────┬─────────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Return Result   │
               └─────────────────┘
```

## Memory Management

### Memory Thresholds

| Device RAM | Recommended Action |
|------------|--------------------|
| < 4GB      | Use Community tier only |
| 4-6GB      | Pro tier with lowMemory config |
| 6-8GB      | Pro tier with default config |
| > 8GB      | Pro tier with high context |

### LlamaCpp Configuration Profiles

```swift
// Default (6GB+ devices)
Configuration.default = Configuration(
    numThreads: ProcessorCount - 2,
    contextSize: 4096,
    batchSize: 512,
    useMetal: true,
    gpuLayers: 99
)

// Low Memory (4GB devices)
Configuration.lowMemory = Configuration(
    numThreads: 2,
    contextSize: 512,
    batchSize: 128,
    useMetal: true,
    gpuLayers: 20
)
```

## Model Storage

Models are stored in the app's Documents directory for better mmap support:

```
Documents/
└── Locanara/
    └── models/
        └── gemma-2-2b-it-q4/
            └── model.gguf
```

**Why Documents?**
- Better mmap support on iOS devices
- User can manage storage in Files app
- Survives app updates

## Error Handling Strategy

```swift
// All errors use LocanaraError enum
enum LocanaraError: Error {
    case notAvailable              // AI not available
    case modelNotDownloaded(String) // Model ID not downloaded
    case modelLoadFailed(String)   // Failed to load
    case insufficientMemory(required: Int, available: Int)
    case executionFailed(String)   // Inference failed
    case invalidInput(String)      // Bad input
    case featureNotAvailable       // Feature not supported
    case networkError(String)      // Download failed
    case cancelled                 // User cancelled
    case custom(ErrorCode, String) // Generic with code
}
```


---

<!-- Source: internal/03-coding-style.md -->

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
/// This method uses Foundation Models (Community tier) or llama.cpp (Pro tier)
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


---

<!-- Source: internal/04-api-design.md -->

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


---

<!-- Source: internal/05-git-deployment.md -->

# Locanara Git & Deployment

> **Priority: MANDATORY**
> Follow these conventions for all git operations and deployments.

## Branch Strategy

```
main                    # Production-ready code
  │
  ├── feat/xxx          # New features
  ├── fix/xxx           # Bug fixes
  ├── docs/xxx          # Documentation
  ├── refactor/xxx      # Code refactoring
  └── chore/xxx         # Maintenance tasks
```

## Commit Message Format

```
<type>: <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Rules

1. **Use lowercase** for type
2. **Keep description under 72 characters**
3. **Use imperative mood** ("add" not "added")
4. **NEVER add Co-Authored-By** or any co-author attribution

### Examples

```bash
# CORRECT
feat: add streaming support for chat API
fix: resolve memory leak in LlamaCppEngine
docs: update API documentation for Pro tier
refactor: simplify model loading logic
test: add unit tests for ModelManager
chore: update dependencies

# INCORRECT
Feat: Add streaming support          # Wrong case
feat: Added streaming support        # Past tense
feat: add streaming support for chat API with better performance and error handling  # Too long
feat: add streaming
Co-Authored-By: Someone              # Never add co-author
```

## Pull Request Guidelines

### Title Format

Same as commit message:

```
feat: add model download progress UI
```

### PR Body Template

```markdown
## Summary
<1-3 bullet points describing the change>

## Test plan
- [ ] Unit tests pass
- [ ] Manual testing on iOS device
- [ ] Manual testing on macOS
- [ ] Memory usage verified

## Screenshots (if UI changes)
[Attach screenshots or screen recordings]
```

### Review Checklist

- [ ] Code follows naming conventions
- [ ] Error handling is complete
- [ ] No cloud fallbacks added
- [ ] Tests added/updated
- [ ] Documentation updated

## Versioning

All packages share the same version in `locanara-versions.json`:

```json
{
  "version": "1.0.0",
  "apple": "1.0.0",
  "android": "1.0.0"
}
```

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking API changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

### Version Bump Script

```bash
# Bump patch version
bun run scripts/bump-version.mjs patch

# Bump minor version
bun run scripts/bump-version.mjs minor

# Bump major version
bun run scripts/bump-version.mjs major
```

## Release Process

### 1. Pre-Release Checks

```bash
# Run tests
swift test

# Build all targets
swift build -c release

# Check for warnings
swift build 2>&1 | grep warning
```

### 2. Create Release

```bash
# 1. Update version
bun run scripts/bump-version.mjs minor

# 2. Update CHANGELOG.md
# Add release notes under new version header

# 3. Commit version bump
git add .
git commit -m "chore: bump version to 1.1.0"

# 4. Create tag
git tag -a v1.1.0 -m "Release 1.1.0"

# 5. Push
git push origin main --tags
```

### 3. Post-Release

- Create GitHub Release with release notes
- Update documentation site
- Notify users via appropriate channels

## Distribution

### Swift Package Manager

Packages are distributed via GitHub:

```swift
// Package.swift in consumer app
dependencies: [
    .package(url: "https://github.com/locanara/locanara", from: "1.0.0")
]
```

### Binary XCFramework

For Pro tier, pre-built XCFramework is provided via SPM binary target:

```swift
// Binary target in root Package.swift (locanara/locanara repo)
.binaryTarget(
    name: "Locanara",
    url: "https://r2-url/Locanara.xcframework.zip",
    checksum: "..."
)
```

## CI/CD

### GitHub Actions Workflows

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: swift build
      - name: Test
        run: swift test
```

### Required Checks

- Build succeeds
- Tests pass
- No new warnings
- Code coverage maintained

## Hotfix Process

For critical production issues:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b fix/critical-issue

# 2. Fix the issue
# Make minimal, targeted changes

# 3. Test thoroughly
swift test

# 4. Create PR with urgency label
# PR title: fix: critical issue description

# 5. After merge, create patch release
bun run scripts/bump-version.mjs patch
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git push origin main --tags
```


---

# 📚 EXTERNAL API REFERENCE

Use this documentation for API details, but **ALWAYS adapt patterns to match Internal Rules above**.

---

<!-- Source: external/foundation-models-api.md -->

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


---

<!-- Source: external/gemini-nano-api.md -->

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


---

<!-- Source: external/localllmclient-api.md -->

# LocalLLMClient API Reference

> **Source**: https://github.com/tattn/LocalLLMClient
> **Supports**: llama.cpp, MLX, FoundationModels backends

## Overview

LocalLLMClient is a Swift library that provides a unified interface for running local LLMs. It supports multiple backends including llama.cpp (GGUF models), MLX, and Apple's Foundation Models.

## Installation

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/tattn/LocalLLMClient.git", branch: "main")
]

// Targets
.target(
    name: "YourTarget",
    dependencies: [
        .product(name: "LocalLLMClient", package: "LocalLLMClient"),
        .product(name: "LocalLLMClientLlama", package: "LocalLLMClient"),  // For llama.cpp
        // .product(name: "LocalLLMClientMLX", package: "LocalLLMClient"),  // For MLX
    ],
    swiftSettings: [
        .interoperabilityMode(.Cxx)  // Required for llama.cpp
    ]
)
```

## LLMSession - High-Level API

### Local Model (GGUF)

```swift
import LocalLLMClient
import LocalLLMClientLlama

// Create session with local GGUF model
let localModel = LLMSession.LocalModel.llama(
    url: modelPath,
    parameter: LlamaClient.Parameter(
        context: 4096,
        numberOfThreads: 8,
        batch: 512
    )
)

let session = LLMSession(model: localModel)

// Prewarm (load model into memory)
try await session.prewarm()
```

### Download Model

```swift
// Download from HuggingFace
let downloadModel = LLMSession.DownloadModel.llama(
    id: "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
    filename: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
)

let session = LLMSession(model: downloadModel)

// Download with progress
for try await progress in session.downloadProgress() {
    print("Download: \(Int(progress * 100))%")
}

// Model is ready after download completes
```

### Generate Response

```swift
// Single response
let response = try await session.respond(to: "Hello, how are you?")
print(response)

// Streaming response
for try await chunk in session.streamResponse(to: "Tell me a story") {
    print(chunk, terminator: "")
}
```

## LlamaClient - Low-Level API

### Configuration

```swift
import LocalLLMClientLlama

let parameter = LlamaClient.Parameter(
    context: 4096,          // Context window size
    numberOfThreads: 8,     // CPU threads
    batch: 512,             // Batch size
    options: LlamaClient.Options(
        verbose: true,      // Enable logging
        useMmap: true,      // Memory-mapped file loading
        useMlock: false     // Lock memory (requires entitlement)
    )
)
```

### Direct Usage

```swift
let client = try await LlamaClient(
    url: modelPath,
    parameter: parameter
)

// Generate
let response = try await client.generate(prompt: prompt)

// Stream
for try await token in client.stream(prompt: prompt) {
    print(token, terminator: "")
}
```

## MLX Backend (macOS Only)

```swift
import LocalLLMClientMLX

// Load MLX model
let mlxModel = LLMSession.LocalModel.mlx(
    url: mlxModelPath,
    parameter: MLXClient.Parameter()
)

let session = LLMSession(model: mlxModel)
```

## Foundation Models Backend

```swift
import LocalLLMClientFoundation

// Use Apple's Foundation Models
let fmModel = LLMSession.LocalModel.foundationModels()
let session = LLMSession(model: fmModel)
```

## Error Handling

```swift
do {
    try await session.prewarm()
} catch LLMSessionError.modelNotFound {
    // Model file doesn't exist
} catch LLMSessionError.loadFailed(let message) {
    // Failed to load model
} catch LLMSessionError.generationFailed(let message) {
    // Inference error
}
```

## Memory Management

### Context Size

```swift
// Larger context = more memory
// 4096 tokens ≈ 500MB-1GB depending on model

// For low memory devices
let lowMemoryParam = LlamaClient.Parameter(
    context: 512,
    numberOfThreads: 2,
    batch: 128
)

// For high memory devices
let highMemoryParam = LlamaClient.Parameter(
    context: 8192,
    numberOfThreads: 12,
    batch: 1024
)
```

### GPU Acceleration

```swift
let options = LlamaClient.Options(
    gpuLayers: 99  // Offload all layers to GPU (Metal)
)

// For limited GPU memory
let limitedGpuOptions = LlamaClient.Options(
    gpuLayers: 20  // Only offload 20 layers
)
```

## Supported Model Formats

### GGUF (llama.cpp)

- TinyLlama (1.1B)
- Phi-2 (2.7B)
- Mistral (7B)
- Llama 2/3 (7B, 13B)
- Qwen (1.5B, 7B)

Quantization formats:
- Q4_K_M (recommended balance)
- Q5_K_M (better quality)
- Q8_0 (highest quality, largest)

### MLX

- Requires Apple Silicon Mac
- Native MLX model format
- HuggingFace MLX models

## Best Practices

### 1. Model Storage

```swift
// Use Documents directory for better mmap support
let documentsURL = FileManager.default.urls(
    for: .documentDirectory,
    in: .userDomainMask
).first!
let modelPath = documentsURL.appendingPathComponent("models/model.gguf")
```

### 2. Memory Check Before Loading

```swift
let availableMemory = ProcessInfo.processInfo.physicalMemory
let requiredMemory: UInt64 = 2_000_000_000  // 2GB

guard availableMemory > requiredMemory else {
    throw LocanaraError.insufficientMemory(
        required: Int(requiredMemory / 1_000_000),
        available: Int(availableMemory / 1_000_000)
    )
}
```

### 3. Cancellation Support

```swift
let task = Task {
    for try await chunk in session.streamResponse(to: prompt) {
        if Task.isCancelled { break }
        process(chunk)
    }
}

// Cancel when needed
task.cancel()
```

## Integration with Locanara

Locanara Pro uses LocalLLMClient for llama.cpp integration:

```swift
// LlamaCppEngine wraps LocalLLMClient
let localModel = LLMSession.LocalModel.llama(
    url: modelPath,
    parameter: LlamaClient.Parameter(
        context: config.contextSize,
        numberOfThreads: config.numThreads,
        batch: config.batchSize,
        options: LlamaClient.Options(verbose: true)
    )
)

llmSession = LLMSession(model: localModel)
try await llmSession?.prewarm()
```


---

# 📁 PROJECT STRUCTURE

```
locanara/
├── packages/
│   ├── apple/              # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/        # SDK source
│   │   │   ├── Locanara.swift
│   │   │   ├── Types.swift
│   │   │   ├── Errors.swift
│   │   │   └── Features/   # Feature implementations
│   │   ├── Tests/
│   │   └── Example/        # Example app
│   │
│   ├── android/            # Kotlin SDK (Maven Central)
│   │   ├── locanara/       # SDK
│   │   └── example/        # Example app
│   │
│   ├── gql/                # GraphQL schema definitions
│   │   ├── src/            # Schema files
│   │   └── codegen/        # Code generators
│   │
│   └── docs/               # Documentation website
│
├── knowledge/              # Shared knowledge base
│   ├── internal/           # Project philosophy (MANDATORY)
│   └── external/           # External API reference
│
├── scripts/agent/          # RAG agent scripts
│
└── .claude/
    ├── commands/           # Slash commands
    └── guides/             # Project guides
```

## Key Reminders

- **packages/apple**: Swift SDK using Foundation Models (iOS 26+/macOS 26+)
- **packages/android**: Kotlin SDK using Gemini Nano (Android 14+)
- **All errors**: Use `LocanaraError` prefix
- **Cross-platform functions**: NO platform suffix
- **iOS-specific functions**: MUST end with `IOS` suffix

