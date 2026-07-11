# /apple

Implement, review, or verify the Apple SDK under `packages/apple/`.

## Usage

```text
/apple review model routing
/apple implement a built-in chain
/apple verify the SDK and example app
```

## Request Boundary

- Review, audit, and status requests are read-only.
- Modify code only when the user asks for a change.
- Do not infer schema, wrapper, version, publishing, or deployment changes from
  an Apple-only request.

## Source Routing

| Concern | Read first |
| --- | --- |
| Shared generated type | `packages/gql/src/*.graphql` |
| Model and chain behavior | `packages/apple/Sources/` |
| Package targets/dependencies | `packages/apple/Package.swift` and root `Package.swift` |
| Public example behavior | `packages/apple/Example/` |
| Tests | `packages/apple/Tests/` |

GraphQL controls shared generated types, not runtime behavior. Never hand-edit
`packages/apple/Sources/Types.swift`; change the schema and run `/gql`.

## Workflow

1. Read `AGENTS.md`, the Apple package guide, status, and existing diffs.
2. Locate the current implementation and its tests before proposing a change.
3. For a shared contract change, update GraphQL first and inspect generated
   Swift and Kotlin output. For Apple-only behavior, keep the change local.
4. Add focused tests for success, invalid input, boundaries, error propagation,
   and cancellation or stream cleanup when relevant.
5. Build and test the SDK, then build the example app.
6. Report exact commands, warnings, skipped real-device behavior, and remaining
   cross-platform work.

## Implementation Rules

- Use the Swift 6 toolchain and honor each target's configured language mode.
- Use `async`/`await`, `Sendable`, and explicit actor/thread-safety boundaries.
- Map public failures to `LocanaraError` with useful non-sensitive context.
- Gate newer frameworks with `#if canImport` and `@available`.
- Never log prompts, model output, extracted entities, RAG content, or images.
- Keep inference on device; package/model asset downloads are not cloud
  inference.
- `LocanaraDefaults.model` currently routes through `RouterModel`; verify the
  active engine rather than assuming Foundation Models is ready.
- The Pipeline builder tracks the final result type. Do not claim it proves
  compatibility between every adjacent step.
- Keep root and package `Package.swift` files synchronized when the manifest
  changes. Treat moving branch dependencies as a supply-chain finding.

## Verification

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

Use `-skipMacroValidation` for headless verification only after reviewing the
resolved macro package and revision. Simulator builds do not prove on-device
model availability; report real-device checks separately.

## References

- `.claude/guides/04-apple-package.md`
- `.claude/commands/gql.md`
- `.claude/commands/test.md`
