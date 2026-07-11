# Apple Intelligence / Foundation Models - Knowledge Update

> Last updated: 2026-02-16
>
> **Historical research snapshot, not implementation guidance.** Re-verify OS,
> Xcode, API, and deadline claims with current official Apple documentation and
> compare them with `packages/apple/` before acting.
>
> Repository implementation reconciled: 2026-07-11.

## Current Status

- **Framework**: `import FoundationModels` (introduced WWDC 2025)
- **OS**: iOS 26+, iPadOS 26+, macOS Tahoe 26+, visionOS 26+
- **Model**: ~3B parameter LLM, 2-bit quantized, on-device
- **Xcode**: 26.3 (current), apps must use iOS 26 SDK after April 28, 2026
- **Locanara integration**: `FoundationLanguageModel` in Platform layer

## Key APIs

### SystemLanguageModel

- `SystemLanguageModel.default` - general-purpose model
- `SystemLanguageModel(useCase: .contentTagging)` - specialized adapters
- `.availability` returns `.available` or `.unavailable(reason:)` (.notEligible / .notOptedIn / .notReady)

### LanguageModelSession

- `respond(to:)` - single response
- `respond(to:, generating: T.self)` - structured output
- `streamResponse(to:, generating: T.self)` - streaming with PartiallyGenerated<T>
- `session.transcript` - full conversation history
- `session.prewarm()` - **NEW**: preload model for lower latency
- `session.append()` - add context after creation

### GenerationOptions (NEW)

- `GenerationOptions(sampling: .greedy)` - deterministic output
- `GenerationOptions(temperature: 0.5)` - temperature control
- `.init(includeSchemaInPrompt: false)` - optimization for subsequent requests

### @Generable / @Guide

- @Generable supports: String, Int, Double, Float, Decimal, Bool, arrays, nested types
- **NEW**: @Generable enums with associated values
- **NEW**: Regex-based @Guide constraints
- **NEW**: `PartiallyGenerated<T>` for structured streaming (properties fill in declaration order)
- **NEW**: Dynamic schemas via `DynamicGenerationSchema`

### Tool Protocol (NEW)

```swift
struct MyTool: Tool {
    let name = "toolName"
    let description = "What it does"
    @Generable struct Arguments { var param: String }
    func call(arguments: Arguments) async throws -> ToolOutput { ... }
}
let session = LanguageModelSession(tools: [MyTool()], instructions: "...")
```

- Model decides when to call tools autonomously
- Tools can execute in parallel and be called multiple times
- Dynamic tools supported via runtime schemas

### Instructions Builder (NEW)

```swift
LanguageModelSession(instructions: {
    "Your job is..."
    Itinerary(title: "Example", ...) // in-context examples
})
```

## Safety Architecture

1. Built-in guardrails (Apple-trained)
2. Safety instructions (developer-provided, override user prompts)
3. User input handling (direct / combined / curated)
4. App-level mitigations

Error types: `.guardrailViolation`, `.unsupportedLanguageOrLocale`, `.exceededContextWindowSize`

## Impact on Locanara

### Current SDK Usage

- `FoundationLanguageModel.swift` uses `SystemLanguageModel.default`,
  `LanguageModelSession`, `respond(to:)`, structured generation, and string
  streaming.
- `FoundationModelToolBridge` adapts a Locanara `Tool` to Apple's
  `FoundationModels.Tool` protocol.
- Optional session instructions, `prewarm()`, and `GenerationConfig` to
  `GenerationOptions` temperature/greedy mapping are implemented.

### Remaining Audits

1. **Tool session wiring**: The bridge type exists; verify end-to-end injection
   into the Foundation Models session before claiming model-native autonomous
   tool execution through `FoundationLanguageModel`.
2. **PartiallyGenerated streaming**: Structured streaming is not currently
   exposed; re-check the active Swift/Xcode toolchain before implementing it.
3. **Generation errors**: Audit whether specific Foundation Models errors need
   stable Locanara error mappings instead of raw propagation.
4. **Specialized adapters**: Evaluate `.contentTagging` for classification and
   extraction only after behavior and availability tests justify it.
5. **Generable enums**: Consider them for classify output only if doing so keeps
   the public cross-platform contract aligned.

## Sources

- [Meet the Foundation Models framework (WWDC25/286)](https://developer.apple.com/videos/play/wwdc2025/286/)
- [Deep dive into Foundation Models (WWDC25/301)](https://developer.apple.com/videos/play/wwdc2025/301/)
- [Explore prompt design & safety (WWDC25/248)](https://developer.apple.com/videos/play/wwdc2025/248/)
- [Foundation Models docs](https://developer.apple.com/documentation/foundationmodels)
