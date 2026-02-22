# expo-ondevice-ai (Expo Library)

## Overview

Location: `libraries/expo-ondevice-ai/`

Expo module wrapping the Locanara native SDKs for React Native/Expo apps. Provides TypeScript API for all 7 AI features plus model management, with native modules bridging to Locanara chains on iOS, Android, and web (Chrome Built-in AI).

## Requirements

- Expo SDK 52+
- Bun 1.1+
- iOS 17+ (for llama.cpp engine)
- Android API 26+ (for ML Kit GenAI)
- Web: Chrome 138+ (Chrome Built-in AI / Gemini Nano)

## Build Commands

```bash
cd libraries/expo-ondevice-ai

bun install       # Install dependencies
bun run build     # Build TypeScript + plugin
bun run lint:ci   # Run all linters
bun test          # Run tests
```

## Project Structure

```text
libraries/expo-ondevice-ai/
├── src/
│   ├── index.ts                      # Public API exports
│   ├── ExpoOndeviceAiModule.ts       # Native module bridge
│   ├── ExpoOndeviceAiModule.web.ts   # Web implementation (Chrome Built-in AI)
│   ├── types.ts                      # TypeScript type definitions
│   ├── log.ts                        # Logging utilities
│   └── __tests__/                    # Unit tests
├── ios/
│   ├── ExpoOndeviceAiModule.swift    # iOS native module (uses Locanara chains)
│   ├── ExpoOndeviceAiHelper.swift    # Option extractors, PrefilledMemory adapter
│   ├── ExpoOndeviceAiSerialization.swift # Chain result → JS dictionary
│   └── ExpoOndeviceAiLog.swift       # Logging wrapper
├── android/
│   └── src/main/java/expo/modules/ondeviceai/
│       ├── ExpoOndeviceAiModule.kt           # Android native module
│       ├── ExpoOndeviceAiHelper.kt           # Option extractors
│       └── ExpoOndeviceAiSerialization.kt    # Chain result → JS map
├── plugin/
│   └── src/
│       └── withOndeviceAi.ts         # Expo config plugin
├── example/                          # Example Expo app
│   ├── app/                          # Expo Router pages
│   │   ├── (tabs)/                   # Tab navigation (Features, Device, Settings)
│   │   └── feature/[id].tsx          # Feature detail/demo screen
│   ├── components/
│   │   ├── AppState.tsx              # React Context for SDK state
│   │   ├── pages/FeatureDetail/      # Feature demo components
│   │   └── shared/                   # AIStatusBanner, ModelSelectionSheet, etc.
│   └── ios/
│       ├── LocanaraLlamaBridge/      # Generated bridge pod (C++ interop isolation)
│       └── Podfile                   # CocoaPods config with bridge helper
├── expo-module.config.json
└── package.json
```

## How It Works

### TypeScript → Native Chain Mapping

Each TypeScript function maps to a built-in Locanara chain:

| TypeScript API              | iOS Chain                                  | Android              | Web (Chrome Built-in AI)              |
| --------------------------- | ------------------------------------------ | -------------------- | ------------------------------------- |
| `summarize(text, opts)`     | `SummarizeChain(bulletCount:).run(text)`   | ML Kit Summarization | `Summarizer` API (key-points)         |
| `classify(text, opts)`      | `ClassifyChain(categories:).run(text)`     | Prompt API           | `LanguageModel` API                   |
| `extract(text, opts)`       | `ExtractChain(entityTypes:).run(text)`     | Prompt API           | `LanguageModel` API                   |
| `chat(message, opts)`       | `ChatChain(memory:).run(message)`          | Prompt API           | `LanguageModel` API                   |
| `chatStream(message, opts)` | `ChatChain(memory:).streamRun(message)`    | Prompt API           | `LanguageModel.promptStreaming()`     |
| `translate(text, opts)`     | `TranslateChain(source:target:).run(text)` | Prompt API           | `Translator` API                      |
| `rewrite(text, opts)`       | `RewriteChain(style:).run(text)`           | ML Kit Rewriting     | `Rewriter` API                        |
| `proofread(text, opts)`     | `ProofreadChain().run(text)`               | ML Kit Proofreading  | `LanguageModel` API (structured JSON) |

### Model Management API (iOS)

| TypeScript API          | Native call                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `getAvailableModels()`  | `LocanaraClient.shared.getAvailableModels()`                 |
| `getDownloadedModels()` | `LocanaraClient.shared.getDownloadedModels()`                |
| `downloadModel(id)`     | `LocanaraClient.shared.downloadModelWithProgress(id)`        |
| `loadModel(id)`         | `LocanaraClient.shared.loadModel(id)` → auto-switches engine |
| `deleteModel(id)`       | `LocanaraClient.shared.deleteModel(id)`                      |
| `getLoadedModel()`      | `LocanaraClient.shared.getLoadedModel()`                     |
| `getCurrentEngine()`    | `LocanaraClient.shared.getCurrentEngine()`                   |

### Native Module Architecture

- `LocanaraClient` is only used for `initialize()`, `getDeviceCapability()`, and model management
- All AI features use built-in chains directly (not `LocanaraClient.executeFeature()`)
- `PrefilledMemory` adapts JS chat history `[{role, content}]` to the `Memory` protocol

### Web Implementation (`ExpoOndeviceAiModule.web.ts`)

Metro auto-resolves `.web.ts` over `.ts` for the web platform. The web module uses Chrome Built-in AI APIs (Gemini Nano) directly — no native bridge needed.

**Chrome APIs used:**

- `Summarizer` — text summarization (key-points mode, post-processed to match bullet count)
- `LanguageModel` — classify, extract, chat, chatStream, proofread (via structured JSON prompts)
- `Translator` — language translation
- `Rewriter` — text rewriting (tone/length mapping)
- `Writer` — fallback for proofread if LanguageModel unavailable

**Key implementation details:**

- **Availability detection**: Lenient checks with 3s timeout; accepts `readily`, `available`, `downloadable`, `after-download` statuses; falls back to API object existence
- **Streaming**: Uses `LanguageModel.promptStreaming()` with auto-detection of cumulative vs delta chunk format (varies by Chrome version)
- **Event emitter**: Web polyfill for Expo's native `addListener`/`removeListeners` pattern using a `Map<string, Set<Function>>`
- **Instance caching**: Summarizer, LanguageModel, Translator, Rewriter, Writer instances are cached and reused
- **Model management**: No-op on web (Chrome manages models automatically)

## Config Plugin (`withOndeviceAi.ts`)

The Expo config plugin automates native setup at prebuild time.

### Plugin Options

```typescript
{
  enableLocalDev?: boolean;   // Use local Locanara SDK (default: false)
  localPath?: string;         // Path to local packages/apple
  enableLlamaCpp?: boolean;   // Enable llama.cpp bridge (default: same as enableLocalDev)
}
```

### What the Plugin Does

#### iOS

1. **Info.plist** - Adds logging config
2. **Xcode Project** (when `enableLlamaCpp`):
   - Adds `LocalLLMClient` SPM package reference to main project
   - Adds "Embed llama.framework" shell script build phase (copies + codesigns dynamic framework)
3. **Dangerous Mod** (when `enableLocalDev`):
   - Generates `LocanaraLlamaBridge/` pod directory with:
     - `LocanaraLlamaBridge.podspec` - CocoaPods spec with C++ interop settings
     - `Sources/LlamaCppBridgeEngine.swift` - Bridge engine implementation
   - Modifies `Podfile`:
     - Adds `pod 'Locanara'` pointing to local SDK path
     - Adds `pod 'LocanaraLlamaBridge'` pointing to generated bridge
     - Appends Ruby helper for post_install (SPM deps, C++ interop, deployment target)

#### Android

- Builds local Locanara SDK AAR and installs to mavenLocal
- Configures Gradle to resolve from mavenLocal

### LlamaCppBridge Isolation Architecture

C++ interop is **viral** in Swift — any module importing a C++ interop module must also enable C++ interop. React Native's `ExpoModulesCore-Swift.h` has a `GenericTypedArray` class that collides with llama.cpp's types, making it impossible to enable C++ interop on any pod that touches React Native.

**Solution**: Isolated bridge pod

```text
┌─────────────────────────────┐     ┌──────────────────────────┐
│  ExpoOndeviceAi pod         │     │  LocanaraLlamaBridge pod │
│  (NO C++ interop)           │     │  (C++ interop enabled)   │
│                             │     │                          │
│  imports:                   │     │  imports:                │
│  - ExpoModulesCore          │     │  - Locanara              │
│  - Locanara                 │     │  - LocalLLMClient        │
│  - React Native             │     │  - LocalLLMClientLlama   │
│                             │     │                          │
│  uses LocanaraClient for    │     │  implements:             │
│  chains (via RouterModel)   │     │  - LlamaCppBridgeProvider│
│                             │     │  - InferenceEngine       │
└─────────────────────────────┘     └──────────────────────────┘
         │                                    │
         │  discovered at runtime via         │
         │  NSClassFromString                 │
         └────────────────────────────────────┘
```

The bridge is discovered at runtime by `LlamaCppBridge.findBridge()` using `NSClassFromString("LocanaraLlamaBridge.LlamaCppBridgeEngine")`.

### Key Build Settings

Bridge pod (`pod_target_xcconfig`):

- `SWIFT_INCLUDE_PATHS` / `FRAMEWORK_SEARCH_PATHS` → `$(PODS_CONFIGURATION_BUILD_DIR)` (for SPM modules)
- `IPHONEOS_DEPLOYMENT_TARGET` → `17.0` (LocalLLMClient requirement)
- `OTHER_SWIFT_FLAGS` → `-cxx-interoperability-mode=default -Xcc -std=c++20`

App target (`user_target_xcconfig`):

- `OTHER_LDFLAGS` → `-framework "llama"` (link dynamic framework)
- `FRAMEWORK_SEARCH_PATHS` → `$(PODS_CONFIGURATION_BUILD_DIR)` (find llama.framework)

Embed phase:

- Copies `llama.framework` from `PackageFrameworks/` to app's `Frameworks/`
- Re-signs with `EXPANDED_CODE_SIGN_IDENTITY`

## Example App

### Running

```bash
cd libraries/expo-ondevice-ai/example

# Prebuild (generates native projects)
bunx expo prebuild --clean

# Run on iOS device
bun ios --device

# Run on Android
bun android

# Run on Web (Chrome 138+ required for AI features)
bun web
```

### App Structure

- 3-tab navigation: Features, Device, Settings
- Feature list → tappable demo screens for each AI feature
- AI Status Banner → opens Model Selection Sheet for engine/model management
- Model Selection Sheet: download, load, delete GGUF models; switch engines

## Notes

- `enableLocalDev` requires `localPath` pointing to the monorepo root
- The bridge pod is auto-generated at prebuild time — do not edit `example/ios/LocanaraLlamaBridge/` directly
- llama.cpp models are stored in the app's Documents directory
- The `RouterModel` ensures chains automatically use whichever engine is active
