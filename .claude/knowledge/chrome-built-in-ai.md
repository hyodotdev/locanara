# Chrome Built-in AI - Knowledge Update

> Last updated: 2026-02-16
>
> **Historical research snapshot, not a support matrix.** Browser API status,
> versions, flags, globals, and device requirements change. Use runtime
> capability checks and current official Chrome documentation before acting.
>
> Repository implementation reconciled: 2026-07-11.

## Current Status

- **Locanara integration**: `packages/web` package named `locanara`
- **Model**: Gemini Nano (auto-downloaded, ~1-2 GB)
- **Mobile**: NOT supported (Chrome Android/iOS)

## API Status

| API               | Status       | Chrome Version | Global Object      |
| ----------------- | ------------ | -------------- | ------------------ |
| Prompt API        | Origin Trial | Chrome 138+    | `LanguageModel`    |
| Summarizer API    | **Stable**   | Chrome 138+    | `Summarizer`       |
| Writer API        | Origin Trial | Chrome 137-148 | `Writer`           |
| Rewriter API      | Origin Trial | Chrome 137-148 | `Rewriter`         |
| Translator API    | Flags        | Chrome 131+    | `Translator`       |
| Language Detector | Flags        | Chrome 131+    | `LanguageDetector` |
| Proofreader API   | Listed       | Unknown        | Unknown            |

## Breaking: Namespace Migration

| Old (deprecated)          | New (current)            |
| ------------------------- | ------------------------ |
| `window.ai.languageModel` | `LanguageModel` (global) |
| `window.ai.summarizer`    | `Summarizer` (global)    |
| `window.ai.writer`        | `Writer` (global)        |
| `window.ai.rewriter`      | `Rewriter` (global)      |

Feature detection: `if ('LanguageModel' in self) { ... }`

## New Capabilities

### Prompt API

- **Multimodal input**: text, audio, images
- **Structured output**: `responseConstraint` with JSON Schema
- **Session management**: `session.append()`, `session.clone()`, `session.measureInputUsage()`
- **Response prefix**: `prefix: true` on assistant messages
- **Permission policy**: `allow="language-model"` for iframes

### Summarizer API (Stable)

- Types: `key-points`, `tldr`, `teaser`, `headline`
- Formats: `markdown`, `plain-text`
- Lengths: `short`, `medium`, `long`

### Writer API (Origin Trial)

- Tones: `formal`, `neutral`, `casual`
- Formats: `markdown`, `plain-text`

### Rewriter API (Origin Trial)

- Tones: `more-formal`, `as-is`, `more-casual`
- Lengths: `shorter`, `as-is`, `longer`

## Chrome Flags Reference

```text
chrome://flags/#optimization-guide-on-device-model          -> Enabled BypassPerfRequirement
chrome://flags/#prompt-api-for-gemini-nano                  -> Enabled
chrome://flags/#prompt-api-for-gemini-nano-multimodal-input -> Enabled (NEW)
chrome://flags/#summarization-api-for-gemini-nano           -> Enabled
chrome://flags/#rewriter-api-for-gemini-nano                -> Enabled
chrome://flags/#writer-api-for-gemini-nano                  -> Enabled
```

## Impact on Locanara

### Repository Rules and Candidate Audits

1. **Runtime capability, not a static minimum**: Never standardize Locanara
   support on a copied Chrome version. Detect each API/global at runtime and
   report actual availability.
2. **Structured output**: Re-verify `responseConstraint` in current official
   documentation, then evaluate it for classify/extract with fallback behavior
   covered by tests.
3. **Multimodal**: Audit current browser support and the existing public contract
   before exposing native image input for `describeImage`.
4. **Writer/Proofreader APIs**: Connect native browser APIs only when runtime
   capability checks, types, and cross-platform semantics are defined.

## Cross-Browser

This table is a February 2026 research snapshot, not Locanara's support policy.

| Browser     | Historical snapshot                        |
| ----------- | ------------------------------------------ |
| Chrome 138+ | Stable (Summarizer), Origin Trial (others) |
| Edge        | Behind flags (Summarizer only)             |
| Firefox     | Not supported                              |
| Safari      | Not supported                              |

## Sources

- [Chrome Built-in AI Overview](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Writer API](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
