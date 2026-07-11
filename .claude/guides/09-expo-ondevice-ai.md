# expo-ondevice-ai

Location: `libraries/expo-ondevice-ai/`

Expo module for the Locanara Apple/Android SDKs with a separate browser
implementation.

## Authority

- Public API: `src/index.ts`, `src/types.ts`, and
  `src/ExpoOndeviceAiModule.ts`.
- Native implementations: `ios/` and `android/`.
- Browser implementation: `src/ExpoOndeviceAiModule.web.ts`.
- Config plugin: `plugin/src/withOndeviceAi.ts`.
- Actual requirements: package manifests, Podspec, Gradle, and example config.

Do not copy fixed Expo, Android, or Chrome versions from old docs. The module's
Gradle fallback and the underlying Android SDK minimum currently differ; the
effective host requirement must satisfy the Locanara dependency and example
build.

## Read-Only Verification

```bash
cd libraries/expo-ondevice-ai
bun install --frozen-lockfile --ignore-scripts
bun run lint:tsc
bun run lint
bun run test -- --runInBand
bun run build
```

Do not use `lint:ci` as a read-only command: its current sub-scripts run ESLint
fixes, Prettier writes, and optional ktlint formatting.

Build generated native examples when native code or the config plugin changes.
Inspect the working tree before and after Expo prebuild because it is
intentionally mutating.

## Structure

```text
src/          public TypeScript facade, types, Web implementation, tests
ios/          Swift Expo module and serializers
android/      Kotlin Expo module and serializers
plugin/       Expo config plugin
example/      Expo Router app, native projects, feature/framework demos
```

The current example includes Features, Device, Framework, and Settings routes;
do not enforce an old three-tab template.

## Platform Rules

- Apple feature calls should use real Locanara chains/client behavior.
- Android feature calls must reflect live ML Kit/engine status.
- Web must capability-check each Chrome Built-in AI surface at runtime; a
  browser version string is not a sufficient check.
- Streaming listeners must be removed on success, failure, and cancellation.
- Model-management results must represent native state. The current Android
  download/load/delete path uses in-memory placeholder state and remains a
  defect; do not document it as a real download implementation.
- Some Web model operations currently resolve as no-op success. Treat that as a
  contract defect, not support; converge on explicit unsupported behavior and
  document browser-managed lifecycle honestly.

## Config Plugin Safety

The local-development plugin path can rewrite native projects and populate a
local Maven repository. AI agents must not run local Maven publication or the
plugin path that performs that installation. Inspect and edit the plugin when
authorized, then hand the mutating prebuild/local-install step to the
maintainer.

iOS llama.cpp support may require a generated bridge target to isolate C++
interop. Verify the current plugin output, Podfile, resolved package revision,
and build phases instead of reproducing a stale bridge recipe from this guide.

## Parity Checklist

For an API change, update the TypeScript facade/types, native module contracts,
both native implementations, Web implementation where supported, tests, mocks,
example, and the React Native/Flutter wrappers. Unsupported capability must be
explicit; parity is not simulated success.
