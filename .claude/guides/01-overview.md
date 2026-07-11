# Project Overview

Locanara is an on-device AI framework for Apple, Android, and Web. It combines
platform-native inference with composable chains, memory, guardrails, runtime
components, and native Pipeline builders. Prompt inference must stay on device.

## Platform Reality

| Surface | Primary runtime | Important constraint |
| --- | --- | --- |
| Apple | Foundation Models or local llama.cpp | Package targets and Foundation Models OS availability differ |
| Android | ML Kit GenAI/Gemini Nano or ExecuTorch | Capability must use live runtime status; ExecuTorch consumes `.pte` assets |
| Web | Chrome Built-in AI APIs | Availability is a runtime capability; there is no Pipeline builder |

Do not encode a permanent browser/device list in implementation guidance. Read
the current manifests and official primary documentation when upstream status
matters.

## Framework Layers

```text
Runtime          Agent · Session · ChainExecutor
Built-in         Summarize · Classify · Extract · Chat · Translate · Rewrite · Proofread
Composable       Chain · Tool · Memory · Guardrail
Core             LocanaraModel · PromptTemplate · OutputParser · Schema
DSL              Pipeline · PipelineStep · ModelExtensions (Apple/Android)
Platform         FoundationLanguageModel · PromptApiModel
Engine           Apple llama.cpp · Android ExecuTorch
Local data       RAG · personalization · platform-specific model lifecycle
```

These layers are conceptual parity, not proof that every implementation has the
same storage or model-management classes. In particular, Apple owns the full
`ModelManager`/downloader/storage stack, while Android currently has an
ExecuTorch engine and registry rather than the same lifecycle layer.

## Core Contracts

- `LocanaraModel` abstracts local generation and streaming.
- `PromptTemplate` validates missing placeholders at runtime; it is not a
  compile-time prompt type system.
- `ChainOutput` carries typed values that are checked/cast at runtime.
- Built-in chains are both public utilities and custom-chain references.
- Native Pipeline builders track the final result type. They do not prove every
  adjacent step compatible at compile time.
- Web composes feature calls directly and exposes supported streaming methods.

## Source-of-Truth Map

| Concern | Source |
| --- | --- |
| Shared generated types | `packages/gql/src/*.graphql` |
| Apple behavior | `packages/apple/Sources/` |
| Android behavior | `packages/android/locanara/src/main/` |
| Web behavior | `packages/web/src/` |
| Nitro bridge | `libraries/react-native-ondevice-ai/src/specs/OndeviceAi.nitro.ts` |
| Versions | `locanara-versions.json` |
| Agent policy | `AGENTS.md` |

GraphQL is not the source of truth for runtime behavior. Generated files and
copied docs are not authority over their schemas, generators, manifests, or
implementation.

## Three API Levels

1. Convenience: `model.summarize(...)`.
2. Configurable chain: construct and run a built-in `Chain`.
3. Custom: implement the `Chain` protocol/interface for app-specific behavior.

Pipeline composition is an additional native API for chaining those steps.

## Repository Map

```text
packages/gql/       schemas and type generators
packages/apple/     Swift SDK and example
packages/android/   Kotlin SDK and example
packages/web/       browser SDK
packages/site/      site and documentation
libraries/          Expo, React Native, and Flutter wrappers
knowledge/          maintained internal guidance and reference snapshots
scripts/agent/      deterministic AI-context compiler
```

## Non-Negotiable Invariants

- No hosted inference, provider API keys, or cloud fallback.
- No prompts, outputs, entities, images, or RAG content in production logs.
- Capability and model-management APIs must report real SDK state, never
  fabricated success.
- Generated outputs are changed through their source generator.
- Versions are read from `locanara-versions.json` and changed only with explicit
  authorization.
- Publishing, deployment, tagging, and release workflows are maintainer-only.
