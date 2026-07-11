# flutter_ondevice_ai

Location: `libraries/flutter_ondevice_ai/`

Flutter wrapper using MethodChannel/EventChannel on Apple and Android plus a
separate `dart:js_interop` Web implementation.

## Authority

- Dart facade/types: `lib/src/`.
- Apple plugin: `ios/Classes/` and the current Podspec.
- Android plugin: `android/src/main/` and `android/build.gradle`.
- Web: `lib/src/flutter_ondevice_ai_web.dart` and `pubspec.yaml`.
- Examples/tests: `example/` and `test/`.

The Android library currently declares API 31 and the example declares a newer
minimum. Read the manifests at execution time. Do not use the old API 24 claim
or a fixed Chrome version as a support guarantee.

## Verification

```bash
cd libraries/flutter_ondevice_ai
flutter pub get
flutter analyze
flutter test
```

Run native example builds when Swift/Kotlin, Podfile, Gradle, or bridge code
changes. Run Web only in a browser that reports the required APIs. Real-device
inference/downloads are separate from analyzer and unit-test results.

## Channel Contract

- MethodChannel request names, arguments, serialized results, and Dart public
  types must agree.
- EventChannel subscriptions for chat and model progress must be cancelled on
  completion/error/dispose.
- Apple and Android implementations must call real Locanara/engine behavior.
- Web must report unsupported browser-managed model operations honestly. Any
  current null/no-op success is a contract defect, not implemented support.
- Keep the public surface aligned with Expo and React Native; update tests for
  unsupported capability behavior as well as success.

## Model and Bridge Notes

The current Android plugin implements its own download/storage path around the
ExecuTorch engine. Treat this as behavior to verify against the Android SDK
source of truth, including immutable URLs, checksums, tokenizer state,
cancellation, and cleanup.

The iOS example has a checked-in C++ isolation bridge and custom Podfile build
logic. Inspect those current files and the resolved package graph before editing
linkage or framework embedding. Do not preserve an old hard-coded package
version or build-phase recipe merely because it appears in historical guidance.

Production logs must never include prompts, output, entities, RAG content,
images, or sensitive model URLs/tokens.
