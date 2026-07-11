# Apple Package

Location: `packages/apple/`

## Authority

Read `packages/apple/Package.swift`, root `Package.swift`, and the current
implementation for deployment targets, dependencies, and behavior. The package
target and Foundation Models runtime availability are separate constraints.

The manifests currently use the Swift 6 toolchain, Swift 5 language mode, C++
interop, iOS 17+, and macOS 14+. Foundation Models code is runtime-gated to the
newer Apple OS APIs; local engines cover the older package targets.

## Build and Test

```bash
cd packages/apple
swift build
swift test

cd Example
xcodebuild \
  -scheme LocanaraExample \
  -destination 'generic/platform=iOS Simulator' \
  -skipMacroValidation \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Review the resolved macro package/revision before using
`-skipMacroValidation`. Real-device inference remains a separate verification
row.

Generate shared types from the GraphQL package:

```bash
cd packages/gql
bun run generate
git diff -- \
  ../apple/Sources/Types.swift \
  ../android/locanara/src/main/kotlin/com/locanara/Types.kt
```

Review expected generated changes during development; add `--exit-code` only
for a clean-baseline drift check.

## Structure

```text
packages/apple/
├── Sources/
│   ├── Core/
│   ├── Composable/
│   ├── BuiltIn/
│   ├── DSL/
│   ├── Runtime/
│   ├── Platform/
│   ├── Engine/
│   ├── ModelManager/
│   ├── RAG/
│   ├── Personalization/
│   ├── Features/             # legacy feature executors
│   ├── Locanara.swift
│   ├── LocanaraClient+Engine.swift
│   └── Types.swift           # generated; do not edit
├── Tests/
├── Example/
└── Package.swift
```

The root `Package.swift` is the SPM consumer entry point and maps these sources
from the repository root. Keep both manifests synchronized when targets,
platforms, dependencies, or compiler settings change.

## Model and Engine Routing

- `Core/Model.swift` defines `LocanaraModel` and `LocanaraDefaults`.
- `Platform/RouterModel.swift` routes chains through the active engine.
- `Platform/FoundationLanguageModel.swift` wraps Foundation Models.
- `Engine/` contains inference routing and the local llama.cpp path.
- `ModelManager/` owns model catalog, download, storage, and lifecycle state.

Do not infer that Foundation Models or a local model is ready from OS version
alone. Capability, selected engine, registry IDs, storage, checksum, and memory
requirements must agree. A dependency pinned to a moving branch is not an
immutable release input and should be reported during audits.

## Framework Contract

- Built-in chains: summarize, classify, extract, chat, translate, rewrite, and
  proofread.
- `DSL/ModelExtensions.swift` provides one-line convenience calls.
- `DSL/Pipeline.swift` tracks the last step's result type; it does not constrain
  every adjacent step's input/output compatibility.
- Custom chains implement `Chain.invoke(_:)` and return `ChainOutput`.
- Public errors use `LocanaraError` and must not expose prompt/model contents.
- Production logging must not include prompts, responses, entities, RAG data,
  images, or other user content.

## CocoaPods and Wrapper Isolation

Expo/React Native integrations may isolate C++ interop in a bridge target to
avoid importing React Native headers into the llama.cpp target. Verify the
actual Podfile/config-plugin output before changing that bridge; do not copy an
old generated example as authority.

## Version and Distribution Rules

Read the Apple version from `locanara-versions.json`. Do not embed sample
versions in guidance, modify versions without explicit authorization, create
tags, push pods, publish packages, or trigger release workflows.
