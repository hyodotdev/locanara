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
