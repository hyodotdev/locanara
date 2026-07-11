# /test

Write or run tests for the affected Locanara surfaces.

## Operating Rules

- A request to inspect or report is read-only. Add or fix tests only when the
  user asks for a change.
- Read implementation before tests and preserve existing working-tree changes.
- Prefer deterministic unit tests. Mark real-device-only behavior explicitly.
- Run each independent platform separately so one failure does not hide later
  results.

## Test Locations

| Surface | Tests |
| --- | --- |
| Apple SDK | `packages/apple/Tests/` |
| Android SDK | `packages/android/locanara/src/test/kotlin/com/locanara/` |
| Web SDK | `packages/web/tests/` |
| Site | colocated `*.test.ts(x)` and `packages/site/convex/**/*.test.ts` |
| Expo | `libraries/expo-ondevice-ai/src/__tests__/` |
| React Native | `libraries/react-native-ondevice-ai/src/__tests__/` |
| Flutter | `libraries/flutter_ondevice_ai/test/` |
| Agent compiler | `scripts/agent/**/*.test.ts` |

Never recreate the deleted Android `FrameworkTest.kt`; use the focused test
suites such as `ChainsTests.kt`, `DSLTests.kt`, and `RAGTests.kt`.

## Verification Matrix

```bash
# Apple
cd packages/apple
swift build
swift test
cd Example
xcodebuild -scheme LocanaraExample \
  -destination 'generic/platform=iOS Simulator' \
  -skipMacroValidation \
  CODE_SIGNING_ALLOWED=NO build
```

Use `-skipMacroValidation` in headless verification only after reviewing the
resolved macro package/revision. A moving branch dependency is a supply-chain
finding, not a reason to trust changed macro code automatically.

```bash
# Android
cd packages/android
./gradlew :locanara:test :locanara:build :example:assembleDebug
```

```bash
# Web
cd packages/web
bun run lint
bun run test
bun run build
```

```bash
# Site
cd packages/site
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
```

```bash
# Expo
cd libraries/expo-ondevice-ai
bun run lint:tsc
bun run lint
bun run test -- --runInBand
bun run build
```

Do not use Expo's formatting/fix scripts as read-only verification. Inspect the
package scripts before running any command named `lint:ci`.

```bash
# React Native
cd libraries/react-native-ondevice-ai
bun run nitrogen
git diff -- nitrogen/generated
bun run lint:tsc
bun run test -- --runInBand
npx bob build
```

Run nitrogen only when the spec or generated bridge is in scope; review the
generated diff instead of editing it. On a clean baseline or in CI, use
`git diff --exit-code -- nitrogen/generated` as the drift check.

```bash
# Flutter
cd libraries/flutter_ondevice_ai
flutter analyze
flutter test
```

## Required Coverage

For public APIs, cover success, invalid input, boundaries, error propagation,
and cancellation/stream cleanup where relevant. Cross-platform contracts need
parity tests for every wrapper, not just matching method names.

For agent-context or guidance changes:

```bash
cd scripts/agent
bun run typecheck
bun test
bun run lint:markdown
bun run check
```

## Reporting

Report the exact command, pass/fail result, test count when available, warnings,
and every skipped or device-only row. Do not summarize a lint failure as a
successful build merely because another command passed.
