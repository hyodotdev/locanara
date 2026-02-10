# Apple Package (iOS SDK)

## Overview

Location: `packages/apple/`

The Apple SDK provides the Locanara on-device AI framework for iOS and macOS using Apple Intelligence (Foundation Models). It includes composable chains, memory, guardrails, pipeline DSL, and 7 built-in chains.

## Requirements

- Xcode 15+
- iOS 15+ / macOS 14+
- Swift 6.0+ (language mode v5)

## Build Commands

```bash
cd packages/apple

# Build
swift build

# Test
swift test

# Generate types from GQL
./scripts/generate-types.sh
```

## Project Structure

```text
packages/apple/
├── Sources/
│   ├── Core/           # LocanaraModel, PromptTemplate, OutputParser, Schema
│   ├── Composable/     # Chain, Tool, Memory, Guardrail
│   ├── BuiltIn/        # SummarizeChain, ClassifyChain, etc. (7 chains)
│   ├── DSL/            # Pipeline, PipelineStep, ModelExtensions
│   ├── Runtime/        # Agent, Session, ChainExecutor
│   ├── Platform/       # FoundationLanguageModel
│   ├── Features/       # Legacy feature executors
│   ├── Locanara.swift  # Main SDK entry point
│   ├── Types.swift     # Generated types from GQL
│   └── Errors.swift    # LocanaraError definitions
├── Tests/
│   └── FrameworkTests.swift  # Framework unit tests (42 tests)
├── Example/             # Sample app
│   ├── LocanaraExample.xcodeproj/
│   └── LocanaraExample/
├── Package.swift        # SPM configuration
└── scripts/
    └── generate-types.sh
```

## Example App

The Example app demonstrates SDK features and is used for testing.

```bash
# Open in Xcode
open packages/apple/Example/LocanaraExample.xcodeproj

# Or use VSCode launch.json
# Select "🍎 Open Apple (iOS) in Xcode"
```

### Example App Structure

```text
packages/apple/Example/
├── LocanaraExample.xcodeproj/
├── LocanaraExample/
│   ├── LocanaraExampleApp.swift
│   ├── ContentView.swift
│   └── components/
│       ├── navigation/     # MainTabNavigation
│       ├── pages/          # Feature demos, FrameworkShowcase
│       └── shared/         # Reusable UI components
```

## Integration

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara", from: "0.1.0")
]
```

## Key Files

- `Sources/Types.swift` - Generated types from GQL (do not edit)
- `Sources/Locanara.swift` - Main SDK entry point
- `Sources/Core/Model.swift` - LocanaraModel protocol
- `Sources/Composable/Chain.swift` - Chain protocol + SequentialChain
- `Sources/BuiltIn/` - 7 built-in chain implementations
- `Sources/DSL/Pipeline.swift` - Pipeline DSL with compile-time type safety
- `Sources/DSL/ModelExtensions.swift` - Convenience methods (model.summarize(), etc.)
- `Sources/Runtime/` - Agent, Session, ChainExecutor
- `Sources/Features/` - Legacy feature executors

## Framework Architecture

The SDK is a layered framework:

1. **Core** - `LocanaraModel`, `PromptTemplate`, `OutputParser`, `ChainInput/ChainOutput`
2. **Composable** - `Chain`, `Memory`, `Guardrail`, `Tool`
3. **Built-in** - `SummarizeChain`, `ClassifyChain`, `ExtractChain`, `ChatChain`, `TranslateChain`, `RewriteChain`, `ProofreadChain`
4. **DSL** - Pipeline composition, Model extensions
5. **Runtime** - `Agent`, `Session`, `ChainExecutor`

### Three Levels of API

```swift
// 1. Simple - one-liner
let result = try await model.summarize("text")

// 2. Chain - configurable (model defaults to LocanaraDefaults.model)
let result = try await SummarizeChain(bulletCount: 3).run("text")

// 3. Pipeline - composition
let result = try await model.pipeline {
    Proofread()
    Translate(to: "ko")
}.run("text")
```

### Custom Chain Pattern

```swift
struct MyChain: Chain {
    let name = "MyChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let prompt = PromptTemplate.from("...{text}...").format(["text": input.text])
        let response = try await model.generate(prompt: prompt, config: .structured)
        let result = MyResult(...)
        return ChainOutput(value: result, text: response.text)
    }
}
```

## Notes

- Generated type files are synced from `packages/gql`
- Always run `bun run generate` from root after schema changes
