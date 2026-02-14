# Locanara Architecture

> **Priority: MANDATORY**
> Understand and follow this architecture exactly.

## Core Principle: On-Device Only

**All AI processing happens locally. No cloud fallback. Privacy first.**

- User data NEVER leaves the device
- No network calls for AI inference
- No telemetry or analytics on user content

## Platform Support

```
┌─────────────────────────────────────────────┐
│              LOCANARA SDK                   │
├─────────────────────────────────────────────┤
│  iOS/macOS: Foundation Models (Apple)       │
│  Android: Gemini Nano (ML Kit GenAI)        │
│  Requirements: iOS 26+ / macOS 26+          │
│               Android 14+                   │
│  NPU: Required                              │
│  App Size Impact: < 5MB                     │
│  External Dependencies: None                │
└─────────────────────────────────────────────┘
```

## Package Structure

```
locanara/
├── packages/
│   ├── apple/              # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/        # SDK source
│   │   │   ├── Core/       # LocanaraModel, PromptTemplate, OutputParser, Schema
│   │   │   ├── Composable/ # Chain, Tool, Memory, Guardrail
│   │   │   ├── BuiltIn/    # SummarizeChain, ClassifyChain, etc.
│   │   │   ├── DSL/        # Pipeline, PipelineStep, ModelExtensions
│   │   │   ├── Runtime/    # Agent, Session, ChainExecutor
│   │   │   ├── Platform/   # FoundationLanguageModel
│   │   │   └── Features/   # Legacy feature executors
│   │   ├── Tests/
│   │   └── Example/        # Example app
│   │
│   ├── android/            # Kotlin SDK (Maven Central)
│   │   ├── locanara/       # SDK
│   │   └── example/        # Example app
│   │
│   ├── gql/                # GraphQL schema definitions
│   └── docs/               # Documentation website
│
├── knowledge/              # Shared knowledge base
└── .claude/
    ├── commands/           # Slash commands
    └── guides/             # Project guides
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
       ┌──────────────┐              ┌──────────────┐
       │   Locanara   │              │   Locanara   │
       │  (Apple SDK) │              │ (Android SDK)│
       └──────────────┘              └──────────────┘
              │                               │
              ▼                               ▼
       ┌──────────────┐              ┌──────────────┐
       │  Foundation   │              │  ML Kit      │
       │  Models (OS)  │              │  GenAI (OS)  │
       └──────────────┘              └──────────────┘
```

## Inference Flow

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
│ Platform Model  │──────────▶│ Return Error    │
│ Ready?          │           │ .notAvailable   │
└────────┬────────┘           └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Execute via     │
│ Platform AI API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Result   │
└─────────────────┘
```

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
