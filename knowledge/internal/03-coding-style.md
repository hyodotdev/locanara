# Locanara Coding Style

## General

- Preserve public contracts and generated-source boundaries.
- Prefer clear, testable code and explicit error propagation.
- Validate public options at the boundary, including zero/negative counts.
- Never log prompts, responses, extracted entities, RAG queries/documents, or
  image content.

## Swift

- Use the repository's Swift 6 toolchain settings. The package currently uses
  Swift 5 language mode in places, so treat concurrency warnings as migration
  defects rather than claiming strict-concurrency completion.
- Use `async`/`await` and `AsyncThrowingStream` for asynchronous/streaming work.
- Make shared state actor-isolated or otherwise synchronization-safe.
- Avoid force unwraps and unsafe captured mutable variables in `@Sendable`
  closures.
- Use `Logger(subsystem: "com.locanara", category: ...)` only for
  non-sensitive metadata; do not use `print` in SDK production paths.
- Use availability and conditional imports for platform APIs.

## Kotlin

- Use `suspend` functions and `Flow` for asynchronous/streaming work.
- Prefer early returns and smart casts over `!!`.
- Use appropriate dispatchers/`withContext` for blocking or CPU work.
- Map upstream exceptions to `LocanaraException`.
- Use Android `Log` only for non-sensitive status/error metadata; do not use
  `println` in SDK production paths.

## TypeScript and Dart

- Keep strict type checking enabled.
- Clean up stream listeners on success, error, and cancellation.
- Do not report native operations as successful until the native SDK confirms
  them.
- Verification/lint commands must not silently rewrite files.

## Tests

Cover success, invalid input, boundary values, error propagation, cancellation,
listener cleanup, guardrail composition, capability/engine agreement, and
wrapper parity. Real-device-only behavior must be reported as such.
