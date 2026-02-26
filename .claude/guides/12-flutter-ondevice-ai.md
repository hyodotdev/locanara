# flutter_ondevice_ai (Flutter Library)

## Overview

Location: `libraries/flutter_ondevice_ai/`

Flutter plugin wrapping the Locanara native SDKs using **MethodChannel** + **EventChannel** pattern (same as `flutter_inapp_purchase`). Supports iOS, Android, and Web (Chrome Built-in AI).

## Requirements

- Flutter SDK 3.3.0+
- Dart SDK 3.3.0+
- iOS 17+ (for llama.cpp engine)
- Android API 24+ (library minSdk), API 34+ (example app, Gemini Nano requirement)
- Web: Chrome 138+ (Chrome Built-in AI)

## Build Commands

```bash
cd libraries/flutter_ondevice_ai

flutter pub get       # Install dependencies
flutter analyze       # Static analysis
flutter test          # Run tests

# Example app
cd example
flutter run           # Run on connected device
flutter build ios     # Build iOS
```

## Project Structure

```text
libraries/flutter_ondevice_ai/
├── lib/
│   ├── flutter_ondevice_ai.dart               # Barrel export
│   └── src/
│       ├── flutter_ondevice_ai_plugin.dart     # Main Dart API (singleton, MethodChannel)
│       ├── flutter_ondevice_ai_web.dart        # Web implementation (dart:js_interop)
│       ├── types.dart                          # All Dart types (enums, options, results)
│       └── errors.dart                         # OndeviceAiException
├── ios/
│   ├── flutter_ondevice_ai.podspec             # CocoaPods spec (depends on Locanara)
│   └── Classes/
│       ├── FlutterOndeviceAiPlugin.swift       # FlutterPlugin (MethodCall dispatch)
│       ├── FlutterOndeviceAiHelper.swift       # Options decoding, PrefilledMemory adapter
│       └── FlutterOndeviceAiSerialization.swift # Chain result → Flutter dictionary
├── android/
│   ├── build.gradle
│   └── src/main/kotlin/dev/hyodot/flutter_ondevice_ai/
│       ├── FlutterOndeviceAiPlugin.kt          # FlutterPlugin (MethodChannel + EventChannel)
│       ├── FlutterOndeviceAiHelper.kt          # Options decoding
│       └── FlutterOndeviceAiSerialization.kt   # Result serialization
├── test/
│   ├── flutter_ondevice_ai_test.dart           # MethodChannel mock tests
│   └── types_test.dart                         # Type serialization tests
└── example/
    ├── lib/
    │   ├── main.dart                           # App entry point
    │   ├── app_state.dart                      # Provider state management
    │   └── widgets/
    │       ├── pages/                          # Feature demos, Device, Settings
    │       └── shared/                         # ModelSelectionSheet, FeatureRow, etc.
    └── ios/
        ├── Podfile                             # CocoaPods config with bridge + SPM embedding
        └── LocanaraLlamaBridge/                # Bridge pod (C++ interop isolation)
            ├── LocanaraLlamaBridge.podspec
            └── Sources/LlamaCppBridgeEngine.swift
```

## How It Works

### Dart → Native Chain Mapping

Same chain mapping as all other libraries:

| Dart API                    | iOS Chain                                  | Android              | Web (Chrome Built-in AI)          |
| --------------------------- | ------------------------------------------ | -------------------- | --------------------------------- |
| `summarize(text, opts)`     | `SummarizeChain(bulletCount:).run(text)`   | ML Kit Summarization | `Summarizer` API                  |
| `classify(text, opts)`      | `ClassifyChain(categories:).run(text)`     | Prompt API           | `LanguageModel` API               |
| `chat(message, opts)`       | `ChatChain(memory:).run(message)`          | Prompt API           | `LanguageModel` API               |
| `chatStream(message, opts)` | `ChatChain(memory:).streamRun(message)`    | Prompt API           | `LanguageModel.promptStreaming()` |
| `translate(text, opts)`     | `TranslateChain(source:target:).run(text)` | Prompt API           | `Translator` API                  |
| `rewrite(text, opts)`       | `RewriteChain(style:).run(text)`           | ML Kit Rewriting     | `Rewriter` API                    |
| `proofread(text, opts)`     | `ProofreadChain().run(text)`               | ML Kit Proofreading  | `LanguageModel` API               |

### MethodChannel / EventChannel

- **MethodChannel** `'flutter_ondevice_ai'` — request/response calls (all 20 API methods)
- **EventChannel** `'flutter_ondevice_ai/chat_stream'` — streaming chat chunks
- **EventChannel** `'flutter_ondevice_ai/model_download_progress'` — download progress

### Web Implementation

`flutter_ondevice_ai_web.dart` uses `dart:js_interop` + `package:web` for Chrome Built-in AI APIs (Summarizer, Translator, Rewriter, Writer, LanguageModel). Registered via `pubspec.yaml` platform plugin entry.

## iOS llama.cpp Bridge (CRITICAL)

Flutter's iOS integration requires special handling compared to Expo/React Native due to **framework linking differences**.

### Why Flutter Is Different

| Aspect                    | Expo                              | React Native (bare)            | Flutter                                                |
| ------------------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------ |
| `use_frameworks!`         | Not used by default (static libs) | Not used by default            | **Required** (dynamic or static)                       |
| CocoaPods linkage         | Static libraries (.a)             | Static libraries (.a)          | Static frameworks (`:linkage => :static`)              |
| SPM framework type        | Static (linked into binary)       | Static (linked into binary)    | **Dynamic** (SPM decides independently)                |
| llama.framework embedding | Not needed (statically linked)    | Not needed (statically linked) | **Required** (dynamic framework must be in app bundle) |

### Flutter-Specific Setup (3 pieces)

Flutter needs **all three** of these that Expo/RN don't:

#### 1. Static CocoaPods Linkage

```ruby
# Podfile
use_frameworks! :linkage => :static   # NOT just use_frameworks!
```

Without `:linkage => :static`, you get `Undefined symbol: _ggml_*` linker errors.

#### 2. SPM Framework Embedding Script

SPM builds `llama.framework` as a **dynamic** framework regardless of CocoaPods linkage settings. Flutter's build system doesn't embed SPM-produced frameworks. A custom build phase copies them:

```ruby
# Podfile — embed_spm_frameworks function
# Copies llama.framework from BUILT_PRODUCTS_DIR to Runner.app/Frameworks/
# MUST run BEFORE Flutter's "Thin Binary" phase (embed_and_thin)
```

Without this, you get `dyld: Library not loaded: @rpath/llama.framework/llama` crash at launch.

#### 3. Bridge Podspec with Linker Flags

```ruby
# LocanaraLlamaBridge.podspec
s.static_framework = true      # Flutter-specific
s.user_target_xcconfig = {
  'OTHER_LDFLAGS' => '$(inherited) -framework "llama"',  # REQUIRED for linking
  'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
}
```

Without `-framework "llama"`, the linker can't find ggml symbols.

### Complete Podfile Structure

The Flutter example Podfile has these components:

1. **`configure_llama_bridge(installer)`** — Adds SPM package reference for LocalLLMClient to Pods project, adds SPM dependencies to bridge target, enables C++ interop (same as Expo)

2. **`embed_spm_frameworks`** — **Flutter-only**. Opens `Runner.xcodeproj`, adds "Embed SPM Frameworks" shell script build phase that copies `llama.framework` into `Runner.app/Frameworks/` and re-signs it. Inserts the phase BEFORE Flutter's "Thin Binary" phase.

3. **Pod declarations**: `pod 'Locanara'` (local), `pod 'LocanaraLlamaBridge'` (local bridge)

4. **`post_install`**: Runs `configure_llama_bridge`, `embed_spm_frameworks`, then `flutter_additional_ios_build_settings`

### Build Phase Order (Must Be Correct)

```text
0: [CP] Check Pods Manifest.lock
1: Run Script (Flutter build)
2: Sources
3: Frameworks
4: Resources
5: Embed Frameworks (CocoaPods frameworks)
6: Embed SPM Frameworks ← copies llama.framework HERE
7: Thin Binary ← Flutter finalizes app HERE
```

If "Embed SPM Frameworks" runs AFTER "Thin Binary", it's too late and `llama.framework` won't be in the app bundle.

### Common Build Errors

| Error                                                    | Cause                                                | Fix                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `Undefined symbol: _ggml_abort, _ggml_add`               | Missing `-framework "llama"` in linker flags         | Add `user_target_xcconfig` with `OTHER_LDFLAGS` to bridge podspec          |
| `dyld: Library not loaded: @rpath/llama.framework/llama` | SPM dynamic framework not embedded in app            | Add `embed_spm_frameworks` to Podfile, ensure it runs before "Thin Binary" |
| `Cannot find type 'Memory' in scope` (20+ errors)        | Using Locanara from CocoaPods trunk (outdated 1.0.1) | Use `pod 'Locanara', :path => '../../../../packages/apple'` for local SDK  |
| `LocalLLMClient is not configured`                       | No LocanaraLlamaBridge pod                           | Add bridge pod + `configure_llama_bridge` to Podfile                       |

## LlamaCppBridge Isolation Architecture

Same as Expo — C++ interop is viral in Swift. The bridge pod is compiled in isolation:

```text
┌──────────────────────────────┐     ┌──────────────────────────┐
│  flutter_ondevice_ai pod     │     │  LocanaraLlamaBridge pod │
│  (NO C++ interop)            │     │  (C++ interop enabled)   │
│                              │     │                          │
│  depends on:                 │     │  depends on:             │
│  - Flutter                   │     │  - Locanara (engine)     │
│  - Locanara (chains)         │     │  - LocalLLMClient        │
│                              │     │  - LocalLLMClientLlama   │
│  uses LocanaraClient for     │     │                          │
│  chains (via RouterModel)    │     │  implements:             │
│                              │     │  - LlamaCppBridgeProvider│
│                              │     │  - InferenceEngine       │
└──────────────────────────────┘     └──────────────────────────┘
         │                                    │
         │  discovered at runtime via         │
         │  NSClassFromString                 │
         └────────────────────────────────────┘
```

## Example App

```bash
cd libraries/flutter_ondevice_ai/example

# iOS device
flutter run

# Android device
flutter run -d <android-device>

# Web (Chrome 138+)
flutter run -d chrome
```

### App Features

- Multi-tab navigation: Device, Features, Framework, Settings
- Feature list → demo screens for all 7 AI features + chat
- AI Status Banner → Model Selection Sheet
- Model Selection Sheet: download, load, delete GGUF models; **switch back to Apple Intelligence**
- `switchToDeviceAI()` — reverts from llama.cpp engine to platform-native AI

## API Parity

The `flutter_ondevice_ai` public API follows the same contract as `expo-ondevice-ai` and `react-native-ondevice-ai`.

## Notes

- The bridge pod in `example/ios/LocanaraLlamaBridge/` is NOT auto-generated (unlike Expo's config plugin); it's checked into the repo
- Flutter requires `:linkage => :static` — do NOT use bare `use_frameworks!`
- The `embed_spm_frameworks` post_install hook modifies `Runner.xcodeproj` — this is expected
- Metal shader warnings from ggml during model loading are harmless
- Test on real devices for on-device AI features
