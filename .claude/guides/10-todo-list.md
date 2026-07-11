# Roadmap Constraints and Technical Backlog

This guide is for agent orientation, not product commitments. Confirm every
item against current issues, code, and maintainer direction before implementing
it.

## Permanent Non-Goals

- Cloud AI inference or server fallback
- Hybrid routing that sends prompts off device
- Prompt, response, RAG-document, or user-content telemetry
- Provider API keys or hosted OpenAI, Anthropic, or Gemini integrations
- Silent degradation from local inference to a remote service

These are incompatible with Locanara's on-device-only and privacy-first product
contract. Do not reintroduce previously proposed cloud-console or server-mode
designs.

## Current Quality Backlog

### Capability Accuracy

- [ ] Base Android feature reporting on live ML Kit `FeatureStatus`, not API
      level alone.
- [ ] Align Apple recommended fallback models with `ModelRegistry` IDs and
      memory requirements.
- [ ] Do not expose placeholder MLX/CoreML engines as available.
- [ ] Ensure wrapper capability results describe the engine actually used.

### Model Management

- [ ] Route Expo and React Native Android model download/load/delete operations
      through the real SDK instead of in-memory success state.
- [ ] Require immutable model URLs and real checksums before loading external
      assets.
- [ ] Complete or explicitly reject public preload, unload, and cancellation
      APIs; never return success from a no-op.

### Privacy

- [ ] Remove prompt, response, entity, and RAG-content logging from production
      Apple and Android SDK paths.
- [ ] Add tests or static checks that prevent sensitive logging from returning.

### Contract and Generator Integrity

- [ ] Verify GraphQL generation against tracked Apple and Android type outputs.
- [ ] Keep Expo, React Native, Flutter, and Web public behavior in parity where
      the platform supports it.
- [ ] Add a version-consistency check covering `locanara-versions.json`, site
      copies, runtime constants, package manifests, and wrapper fallbacks.
- [ ] Verify Nitro output drift after spec changes.

### Pipeline Documentation

- [ ] Describe only the last-output type guarantee the current builders
      implement; do not claim adjacent-step compile-time validation.
- [ ] Show the real Kotlin fluent `pipeline()` API.
- [ ] State that Web has no Pipeline builder and link to its streaming APIs.
- [ ] Make both native example screens execute the Pipeline DSL they teach.

### CI Coverage

- [ ] Build the Apple example in iOS CI.
- [ ] Run Site lint and tests in Site CI.
- [ ] Verify tracked GraphQL outputs in GQL CI.
- [ ] Build representative native Flutter example targets.
- [ ] Detect version and generated-context drift before release workflows.

## Research Backlog

Upstream versions and device matrices change quickly. Use
`/knowledge-compile`, cite official sources, date the snapshot, and keep
unverified research below live manifests and implementation in authority.
