# Knowledge Digest

> Last compiled: 2026-02-16
>
> **Historical snapshot:** upstream status may have changed. Verify official
> sources before implementation. Current repository code and manifests take
> precedence over this digest.

## Summary

| Technology         | Latest Version                  | Impact           | Key Change                                                                       |
| ------------------ | ------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| llama.cpp          | b8062 (Feb 15, 2026)            | 🟡 Action Needed | API renames (`llama_vocab`), `logits_all` removed, sampling refactor             |
| Apple Intelligence | iOS 26+ (Foundation Models)     | 🟢 Implemented   | Tool protocol bridge, GenerationOptions, session.prewarm(), instructions         |
| Gemini Nano        | ML Kit GenAI Beta (Android 14+) | 🟢 Implemented   | ImagePart multimodal, BUSY/BACKGROUND error handling, AI Edge SDK clean          |
| Chrome Built-in AI | Historical Chrome 138+ snapshot | 🟢 Implemented   | `packages/web` provides the browser SDK; verify live API availability at runtime |

## Action Items

### 🔴 Breaking Changes (Upstream Dependencies)

- **llama.cpp API renames**: `llama_n_vocab()` → `llama_vocab_n_tokens()`, `llama_load_model_from_file()` → `llama_model_load_from_file()`, tokenization now uses `llama_vocab` handle. LocalLLMClient wrapper needs update.
- **llama.cpp `logits_all` removed**: Must use per-token `llama_batch::logits` instead.
- **llama.cpp `llama_batch` fields removed**: `all_pos_0`, `all_pos_1`, `all_seq_id` gone.

### ✅ Completed (Apple Intelligence)

- **Tool protocol bridge**: `FoundationModelToolBridge` bridges Locanara `Tool` → Apple's `FoundationModels.Tool` protocol with `@Generable Arguments` and JSON argument parsing.
- **GenerationOptions**: `GenerationConfig` now maps to Apple's `GenerationOptions` — temperature → `GenerationOptions(temperature:)`, zero temp → `GenerationOptions(sampling: .greedy)`.
- **session.prewarm()**: `FoundationLanguageModel.prewarm()` public method added for first-request latency reduction.
- **Session instructions**: `FoundationLanguageModel(instructions:)` passes system instructions to `LanguageModelSession`.

### ✅ Completed (Gemini Nano)

- **AI Edge SDK removed**: Already clean — no `com.google.ai.edge.localagent` references found.
- **ImagePart multimodal**: `PromptApiModel.generateWithImage()` and `streamWithImage()` accept `Bitmap` + text prompts.
- **Error handling**: `ErrorCode.MODEL_BUSY` and `BACKGROUND_USE_BLOCKED` added to enum. `LocanaraException.ModelBusy` and `BackgroundUseBlocked` exception types. `mapGenAiException()` utility maps ML Kit errors in PromptApiModel, MLKitPromptClient (chat, classify, extract, translate).

### 🟡 Remaining

- **Chrome Built-in AI**: The Web SDK now exists in `packages/web`. Audit its current API against official browser documentation before changing namespace, structured-output, or multimodal behavior.
- **Apple tool session wiring**: `FoundationModelToolBridge` exists, but verify
  end-to-end tool injection before claiming `FoundationLanguageModel` performs
  native autonomous tool calls.
- **Apple PartiallyGenerated streaming**: Not exposed by the current
  implementation; re-verify the active Swift/Xcode toolchain before enabling the
  source placeholder.
- **nano-v2 vs nano-v3 detection**: Verify that reliable runtime detection exists
  before adding model-version claims to `getDeviceCapability()`.
- **Speech Recognition API**: Decide whether ML Kit Speech Recognition belongs in
  Locanara's product scope; it is not currently exposed.
- **Apple @Generable enums**: Support for enums with associated values (already partially available via existing @Generable structs).

### 🟢 Notable Updates

- **llama.cpp Metal**: 1-11% speedup from concurrency improvements and adaptive CPU/GPU interleave.
- **llama.cpp new models**: Gemma3n, Qwen3.5, Kimi-K2.5, Step3.5-Flash, MiniCPM-o 4.5.
- **llama.cpp self-speculative decoding**: 1.8-2.5x speedup without draft model.
- **llama.cpp V-less KV cache**: 50% memory reduction for MLA models (DeepSeek, GLM).
- **Apple Intelligence custom adapters**: Train specialized adapters (e.g., `.contentTagging`).
- **Chrome Writer/Rewriter APIs**: Origin Trial (Chrome 137-148).
- **Chrome Proofreader API**: Listed in Chrome docs (maps to Locanara's proofread chain).
- **Gemini Nano device expansion**: Now supports Pixel 9/10, Samsung S25, OnePlus 13, Honor, iQOO, Motorola, OPPO, realme, vivo, Xiaomi.
- **Gemini Nano languages**: Proofreading/Rewriting expanded to French, German, Italian, Spanish (beyond en/ja/ko).

## Details

- [llama.cpp details](./llama-cpp.md)
- [Apple Intelligence details](./apple-intelligence.md)
- [Gemini Nano details](./gemini-nano.md)
- [Chrome Built-in AI details](./chrome-built-in-ai.md)
