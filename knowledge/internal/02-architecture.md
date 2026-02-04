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
