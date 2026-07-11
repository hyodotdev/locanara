# react-native-ondevice-ai

Location: `libraries/react-native-ondevice-ai/`

Bare React Native wrapper built with Nitro Modules. It has no Web target; Expo
apps should use `expo-ondevice-ai`.

## Sources of Truth

1. `src/specs/OndeviceAi.nitro.ts` for generated bridge signatures.
2. `ios/HybridOndeviceAi.swift` and `android/.../HybridOndeviceAi.kt` for native
   behavior.
3. `src/index.ts` and `src/types.ts` for the public JavaScript API.
4. Tests/mocks and the example for observable behavior.

Read package, Podspec, Gradle, and example manifests for requirements. The
wrapper's Android fallback minimum is lower than the current Locanara SDK and
the example; do not advertise the lower number as a working SDK contract.

## Public Bridge Contract Change Order

For a public bridge signature or type change:

1. Update `src/specs/OndeviceAi.nitro.ts`.
2. Run nitrogen and inspect `nitrogen/generated/`; never edit it by hand.
3. Update Swift and Kotlin HybridObject implementations.
4. Update the JS facade and public types.
5. Update mocks/tests and both native examples.
6. Verify wrapper parity with Expo and Flutter.

Native bug fixes, tests, and internal refactors that keep the bridge contract
unchanged start in their owning implementation and do not require nitrogen.

Nitro types used by the HybridObject must live in the spec. Avoid `Record`, use
unions with at least two values, and use explicit add/remove listener methods
for streaming/progress callbacks.

## Verification

```bash
cd libraries/react-native-ondevice-ai
bun install --frozen-lockfile --ignore-scripts
bun run nitrogen
git diff -- nitrogen/generated
bun run lint:tsc
bun run test -- --runInBand
npx bob build
```

Run nitrogen only when spec/codegen is in scope. During active development,
review the expected generated diff; on a clean CI baseline, use
`git diff --exit-code -- nitrogen/generated` to detect drift.

Build the Android and iOS examples for native changes. Simulator/emulator builds
do not prove model availability.

## Behavior Boundaries

- Listener cleanup must run on success, error, and cancellation.
- Native failures must cross the bridge as explicit public errors.
- Do not log prompt or model content on either native side.
- Android model download/load/delete currently uses simulated in-memory success
  and must not be treated as implemented native model management.
- The Android Locanara dependency fallback is version-drift-prone; read
  `locanara-versions.json` and fix the synchronization mechanism when
  authorized rather than copying a number into this guide.
- iOS C++ bridge details come from the current Podfile/Podspec and resolved SPM
  graph, not an old integration recipe.
