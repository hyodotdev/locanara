# Platform Differences

This guide records durable architectural differences. Runtime availability and
upstream support change, so capability APIs, current manifests, implementation,
and official primary documentation outrank copied device/browser tables.

## Framework Surface

| Capability | Apple | Android | Web |
| --- | --- | --- | --- |
| Seven built-in chains | Native framework | Native framework | No chain layer |
| Memory, guardrails, tools, runtime | Native framework | Native framework | No equivalent framework layer |
| Pipeline builder | Yes | Yes | No |
| Feature facade | Yes | Yes | Yes, through Chrome Built-in AI APIs |
| Raw model streaming | `AsyncThrowingStream` | `Flow` | Async generators where implemented |

Feature facade availability is conditional. A check mark in documentation is
not permission to return success when the platform reports unavailable.

## Engine and Model Differences

### Apple

- Foundation Models is gated by framework/OS/device readiness.
- The local fallback engine uses llama.cpp/GGUF through LocalLLMClient.
- `ModelManager`, downloader, registry, storage, and engine routing live in the
  Apple SDK.
- CocoaPods/React Native integrations may isolate C++ interop in a separate
  bridge target; inspect the current Podfile/config plugin before changing it.

### Android

- Task-specific ML Kit GenAI and the Prompt API use live status values such as
  available, downloadable, downloading, or unavailable.
- The local engine is ExecuTorch and consumes `.pte` model assets plus a
  tokenizer. Do not describe it as a GGUF engine.
- The package currently has an engine registry but not the same complete
  `ModelManager`/storage stack as Apple.
- Package minimum SDK is read from
  `packages/android/locanara/build.gradle.kts`; readiness still requires
  runtime checks.

### Web

- The SDK wraps browser-provided Summarizer, Translator, LanguageModel,
  Rewriter, Writer, and related APIs when present.
- There is no Pipeline builder or downloadable external-engine layer.
- Browser/API availability is a runtime property. Do not hard-code a Chrome
  version or flags as a permanent guarantee.
- Some browser-managed model methods are currently no-op successes. That is a
  contract defect, not support; inspect each implementation and converge on an
  explicit unsupported result/error.

## Common Feature Names

Apple, Android, Web, and wrappers share concepts such as summarize, classify,
extract, chat, translate, rewrite, and proofread. Matching names do not prove
matching options, result fields, streaming semantics, or native readiness.

When a wrapper exposes a capability its platform lacks, it must return an
explicit unavailable/unsupported result rather than fabricate success.

## Pipeline Type Guarantee

Apple and Android Pipeline builders track the result type of the last step.
They currently pass the previous step's text into the next chain and do not
encode every adjacent input/output relationship in the type system. Web users
compose calls manually.

## Verification

- Build/test Apple and Android SDKs and their examples.
- Run Web lint, tests, and build.
- Test actual inference and model downloads on supported real devices.
- Treat simulator/emulator results as build verification only.
- Re-check wrapper parity from its public API through the native implementation,
  not from a feature matrix.
