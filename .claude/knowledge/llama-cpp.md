# llama.cpp - Knowledge Update

> Last updated: 2026-02-16

## Current Status
- **Version**: b8062 (February 15, 2026)
- **Release cadence**: Multiple builds per day (continuous micro-releases)
- **Locanara integration**: iOS Engine Layer — LlamaCppEngine via LocalLLMClient

## Breaking Changes

### API Renames (Jan 2025)
- `llama_n_vocab()` → `llama_vocab_n_tokens()`
- `llama_n_ctx_train()` → `llama_model_n_ctx_train()`
- `llama_load_model_from_file()` → `llama_model_load_from_file()`
- `llama_free_model()` → `llama_model_free()`
- `llama_new_context_with_model()` → `llama_init_from_model()`
- Tokenization now requires `llama_model_get_vocab(model)` handle
- `struct llama_lora_adapter` → `struct llama_adapter_lora`

### logits_all Removal (May 2025)
- `logits_all` parameter removed from `llama_context_params`
- Use per-token `llama_batch::logits` instead

### Batch Simplification (Oct 2024)
- `all_pos_0`, `all_pos_1`, `all_seq_id` removed from `llama_batch`

### Sampling Refactor (Sep 2024)
- New `llama_sampler_chain_init()` chain-based sampling API

### Session State (Jan 2026)
- Output IDs/logits/embeddings no longer saved in session files
- Must re-decode last token after loading state

## Metal / iOS Performance

| Change | Date | Impact |
|--------|------|--------|
| Metal concurrency improvements | Feb 13, 2026 | 1-11% speedup |
| Adaptive CPU/GPU interleave | Feb 5, 2026 | 1-6% speedup (MoE) |
| Flash Attention for MLA heads | Jan 20, 2026 | DeepSeek models |
| iOS < 16.0 API availability fix | Jan 25, 2026 | Clean builds for older iOS |
| BF16 x F16 kernels removed | Dec 31, 2025 | Build change |

## New Features
- Backend sampling (GPU-side, avoiding CPU roundtrips)
- Multi-Token Prediction (MTP)
- Self-speculative decoding (1.8-2.5x speedup)
- V-less KV cache (50% memory reduction for MLA models)

## New Quantization
- Q2_0C (INT2, block size 512)
- TQ2_0 sparse-ternary optimization (2.3x speedup)
- Automatic optimal quant type selection per layer

## New Model Support (Late 2025 - Feb 2026)
Gemma3n, Qwen3.5, Kimi-K2.5, Step3.5-Flash, MiniCPM-o 4.5, Nemotron Nano 12B v2 VL, GLM MoE DSA

## Impact on Locanara
- **Affected files**: `packages/apple/Sources/Engine/LlamaCppEngine.swift`, `LlamaCppBridge.swift`
- **Dependencies**: LocalLLMClient (wraps llama.cpp C API)
- **Action**: Verify LocalLLMClient version is compatible with latest llama.cpp API renames

## Sources
- [Releases](https://github.com/ggml-org/llama.cpp/releases)
- [API Header](https://github.com/ggml-org/llama.cpp/blob/master/include/llama.h)
- [Breaking Changes](https://github.com/ggml-org/llama.cpp/pulls?q=is%3Apr+is%3Amerged+label%3A%22breaking+change%22)
