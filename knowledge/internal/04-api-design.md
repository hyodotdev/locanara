# Locanara API Design

## Principles

1. Prompt inference remains on device.
2. Shared capabilities use consistent names and result concepts.
3. Platform differences are explicit; unsupported behavior must fail honestly.
4. Async operations expose cancellation/error behavior and streaming where
   implemented.
5. Options are validated before reaching an engine.

## Parity

Parity means equivalent real behavior, not merely matching method names. When
adding or changing a wrapper API, update its public types, bridge spec/native
implementations, tests, and docs together. A method that returns simulated
success violates parity.

## Generated Contracts

GraphQL is the source of truth for shared generated Apple/Android types. Nitro's
`.nitro.ts` spec is the source of truth for its bridge. Never hand-edit their
generated outputs.

## Streaming

Use the established API for each surface: native streams/flows and wrapper
listener lifecycles. Ensure listeners are removed on success and failure.
Non-streaming chat remains valid where the current public contract exposes it;
do not rewrite docs to claim chat is always streaming.

## Pipeline

Apple and Android have Pipeline builders. The current builders track the last
step's result type; documentation must not claim compile-time validation of
every adjacent step unless the implementation adds that constraint. Web has no
Pipeline builder and composes feature calls manually.

## Errors and No-Ops

- Use Locanara-prefixed errors/exceptions with actionable context.
- Do not return success from an unimplemented cancellation, preload, unload,
  download, or load operation.
- Do not expose placeholder engines as available.
- Preserve the typed result contract when guardrails modify output and continue
  applying all configured guardrails.
