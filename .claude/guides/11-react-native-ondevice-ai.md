# react-native-ondevice-ai (React Native Library)

## Overview

Location: `libraries/react-native-ondevice-ai/`

React Native module using **Nitro Modules** for bare React Native apps. Wraps the Locanara native SDKs with auto-generated JNI/C++ bridges. Expo users should use `expo-ondevice-ai` instead.

**Does NOT support web** — Nitro is native-only.

## Requirements

- React Native 0.76+
- Nitro Modules 0.22+
- iOS 17+ / Android API 26+
- Bun 1.1+

## Build Commands

```bash
cd libraries/react-native-ondevice-ai

bun install          # Install dependencies
bun run nitrogen     # Generate Nitro bridge code
bun run lint:tsc     # TypeScript type check
bun run test         # Run tests
```

## Project Structure

```text
libraries/react-native-ondevice-ai/
├── src/
│   ├── index.ts                      # Public API wrapper (type conversion, listener mgmt)
│   ├── types.ts                      # Public TypeScript type definitions
│   ├── specs/
│   │   └── OndeviceAi.nitro.ts       # Nitro spec (SOURCE OF TRUTH for bridge codegen)
│   └── __tests__/                    # Unit tests
│       └── __mocks__/                # Nitro module mocks
├── ios/
│   ├── HybridOndeviceAi.swift        # iOS native implementation (uses Locanara chains)
│   ├── OndeviceAiHelper.swift        # Option extractors, PrefilledMemory adapter
│   └── OndeviceAiSerialization.swift # Chain result conversion
├── android/
│   └── src/main/java/com/margelo/nitro/ondeviceai/
│       ├── HybridOndeviceAi.kt       # Android native implementation
│       ├── OndeviceAiHelper.kt       # Option extractors
│       └── OndeviceAiSerialization.kt
├── nitrogen/generated/               # Auto-generated bridge code (DO NOT EDIT)
├── NitroOndeviceAi.podspec           # CocoaPods spec (depends on Locanara)
├── nitro.json                        # Nitro module configuration
├── example/                          # Example React Native app
│   ├── src/screens/                  # Feature/Device/Settings screens
│   ├── src/components/               # Feature demos, shared components
│   └── ios/
│       ├── LocanaraLlamaBridge/      # Bridge pod (C++ interop isolation)
│       └── Podfile
└── package.json
```

## How It Works

### Nitro Module Architecture

The library uses Nitro Modules for a **spec-first** native bridge:

```text
OndeviceAi.nitro.ts (Spec — source of truth)
    ↓ npx nitrogen
nitrogen/generated/ (C++ / JNI bridge code)
    ↓
HybridOndeviceAi.swift (iOS)      HybridOndeviceAi.kt (Android)
    ↓                                  ↓
src/index.ts (JS wrapper — converts types, manages listeners)
```

### TypeScript → Native Chain Mapping

Same mapping as `expo-ondevice-ai`:

| TypeScript API              | iOS Chain                                  | Android              |
| --------------------------- | ------------------------------------------ | -------------------- |
| `summarize(text, opts)`     | `SummarizeChain(bulletCount:).run(text)`   | ML Kit Summarization |
| `classify(text, opts)`      | `ClassifyChain(categories:).run(text)`     | Prompt API           |
| `extract(text, opts)`       | `ExtractChain(entityTypes:).run(text)`     | Prompt API           |
| `chat(message, opts)`       | `ChatChain(memory:).run(message)`          | Prompt API           |
| `chatStream(message, opts)` | `ChatChain(memory:).streamRun(message)`    | Prompt API           |
| `translate(text, opts)`     | `TranslateChain(source:target:).run(text)` | Prompt API           |
| `rewrite(text, opts)`       | `RewriteChain(style:).run(text)`           | ML Kit Rewriting     |
| `proofread(text, opts)`     | `ProofreadChain().run(text)`               | ML Kit Proofreading  |

### Streaming (Listener Pattern)

Nitro uses explicit listener add/remove instead of EventEmitter:

```typescript
// JS wrapper manages listener lifecycle
if (onChunk) {
  listener = (chunk) => onChunk(convertChunk(chunk));
  AI.instance.addChatStreamListener(listener);
}
try {
  /* call stream API */
} finally {
  AI.instance.removeChatStreamListener(listener);
}
```

### Nitro Constraints

- **Union types**: Must have 2+ values (single-value union = codegen error)
- **No `Record<K,V>`**: Use flat fields, convert in JS layer
- **All types in spec file**: Nitro codegen only reads the `.nitro.ts` file
- **Optional fields**: Use `field?: Type | null` pattern

## iOS llama.cpp Bridge

Same `LocanaraLlamaBridge` pattern as `expo-ondevice-ai` — see the **Cross-Library iOS llama.cpp Bridge** section in `09-expo-ondevice-ai.md`.

**Key difference**: React Native (without Expo) does NOT use `use_frameworks!` by default, so static linking works naturally. The bridge pod and SPM integration follow the same `configure_llama_bridge` post_install pattern.

### CocoaPods Configuration

```ruby
# NitroOndeviceAi.podspec
s.dependency 'React-Core'
s.dependency 'React-jsi'
s.dependency 'React-callinvoker'
s.dependency 'Locanara'
```

## Spec-First Development Workflow

**When adding or modifying an API, follow this exact order:**

1. **Update Nitro spec** (`src/specs/OndeviceAi.nitro.ts`)
2. **Run nitrogen**: `npx nitrogen`
3. **Update native implementations** (iOS + Android)
4. **Update JS wrapper** (`src/index.ts`)
5. **Update public types** (`src/types.ts`)
6. **Update tests** + mocks
7. **Verify**: `npx nitrogen && npx tsc --noEmit && bun run test`

## Example App

```bash
cd libraries/react-native-ondevice-ai/example

# iOS
bun ios --device

# Android
bun android
```

### App Structure

- 3-tab navigation: Features, Device, Settings
- Feature list → tappable demo screens for each AI feature
- AI Status Banner → Model Selection Sheet for engine/model management

## API Parity

The `react-native-ondevice-ai` public API **MUST** be identical to `expo-ondevice-ai`. When modifying either library, update both.

## Notes

- Nitro-generated files in `nitrogen/generated/` must NEVER be edited manually
- The bridge pod is set up in the example app's `ios/LocanaraLlamaBridge/`
- No web support — Nitro is native-only
- Test on real devices (simulators have limited AI support)
