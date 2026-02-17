# Chrome Built-in AI - Knowledge Update

> Last updated: 2026-02-16

## Current Status
- **Locanara integration**: `@locanara/web` package (Web SDK)
- **Model**: Gemini Nano (auto-downloaded, ~1-2 GB)
- **Mobile**: NOT supported (Chrome Android/iOS)

## API Status

| API | Status | Chrome Version | Global Object |
|-----|--------|---------------|--------------|
| Prompt API | Origin Trial | Chrome 138+ | `LanguageModel` |
| Summarizer API | **Stable** | Chrome 138+ | `Summarizer` |
| Writer API | Origin Trial | Chrome 137-148 | `Writer` |
| Rewriter API | Origin Trial | Chrome 137-148 | `Rewriter` |
| Translator API | Flags | Chrome 131+ | `Translator` |
| Language Detector | Flags | Chrome 131+ | `LanguageDetector` |
| Proofreader API | Listed | Unknown | Unknown |

## Breaking: Namespace Migration

| Old (deprecated) | New (current) |
|---|---|
| `window.ai.languageModel` | `LanguageModel` (global) |
| `window.ai.summarizer` | `Summarizer` (global) |
| `window.ai.writer` | `Writer` (global) |
| `window.ai.rewriter` | `Rewriter` (global) |

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

```
chrome://flags/#optimization-guide-on-device-model          -> Enabled BypassPerfRequirement
chrome://flags/#prompt-api-for-gemini-nano                  -> Enabled
chrome://flags/#prompt-api-for-gemini-nano-multimodal-input -> Enabled (NEW)
chrome://flags/#summarization-api-for-gemini-nano           -> Enabled
chrome://flags/#rewriter-api-for-gemini-nano                -> Enabled
chrome://flags/#writer-api-for-gemini-nano                  -> Enabled
```

## Impact on Locanara

### Required Updates
1. **Chrome minimum version**: Standardize to Chrome 138+ (Prompt API minimum)
2. **Structured output**: Use `responseConstraint` for classify/extract instead of prompt-based parsing
3. **Multimodal**: Enable `describeImage` with native image input
4. **Writer/Proofreader APIs**: Connect to native Chrome APIs (already in GQL schema)

## Cross-Browser

| Browser | Support |
|---------|---------|
| Chrome 138+ | Stable (Summarizer), Origin Trial (others) |
| Edge | Behind flags (Summarizer only) |
| Firefox | Not supported |
| Safari | Not supported |

## Sources
- [Chrome Built-in AI Overview](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Writer API](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
