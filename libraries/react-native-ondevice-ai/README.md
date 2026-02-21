# react-native-ondevice-ai

React Native bindings for [Locanara](https://github.com/hyodotdev/locanara) on-device AI SDK, powered by [Nitro Modules](https://github.com/margelo/nitro).

> **Using Expo?** Use [`expo-ondevice-ai`](../expo-ondevice-ai/) instead for native Expo Modules integration.

## Installation

```bash
yarn add react-native-ondevice-ai react-native-nitro-modules
```

### iOS

```bash
cd ios && pod install
```

### Android

No additional setup required. The Locanara SDK is included via Maven Central.

## Requirements

- React Native 0.70+
- react-native-nitro-modules ^0.31.1
- iOS 15+ / macOS 14+ (Apple Intelligence)
- Android API 23+ (Gemini Nano)

## Usage

```typescript
import {
  initialize,
  getDeviceCapability,
  summarize,
  classify,
  extract,
  chat,
  chatStream,
  translate,
  rewrite,
  proofread,
} from "react-native-ondevice-ai";

// Initialize the SDK
await initialize();

// Check device capability
const capability = await getDeviceCapability();
console.log("AI supported:", capability.isSupported);

// Summarize text
const summary = await summarize("Long article text here...");
console.log(summary.summary);

// Summarize a conversation
const conversationSummary = await summarize(transcript, {
  inputType: "CONVERSATION",
  outputType: "THREE_BULLETS",
});

// Classify text
const classification = await classify("I love this product!", {
  categories: ["positive", "negative", "neutral"],
});
console.log(classification.topClassification.label);

// Chat with streaming
const result = await chatStream("Hello!", {
  systemPrompt: "You are a helpful assistant.",
  onChunk: (chunk) => {
    console.log("Streaming:", chunk.accumulated);
  },
});
console.log("Final:", result.message);

// Translate
const translated = await translate("Hello world", {
  targetLanguage: "ko",
});
console.log(translated.translatedText);
```

## API

### Initialization

| Function                | Description                               |
| ----------------------- | ----------------------------------------- |
| `initialize()`          | Initialize the SDK. Must be called first. |
| `getDeviceCapability()` | Get device AI support info.               |

### AI Features

| Function                        | Description                        |
| ------------------------------- | ---------------------------------- |
| `summarize(text, options?)`     | Summarize text into bullet points. |
| `classify(text, options?)`      | Classify text into categories.     |
| `extract(text, options?)`       | Extract entities from text.        |
| `chat(message, options?)`       | Chat with on-device AI.            |
| `chatStream(message, options?)` | Chat with streaming response.      |
| `translate(text, options)`      | Translate text between languages.  |
| `rewrite(text, options)`        | Rewrite text in a different style. |
| `proofread(text)`               | Proofread and correct grammar.     |

### Options Reference

**`summarize`**

- `inputType?`: `'ARTICLE'` or `'CONVERSATION'` (default: `'ARTICLE'`)
- `outputType?`: `'ONE_BULLET'`, `'TWO_BULLETS'`, or `'THREE_BULLETS'` (default: `'ONE_BULLET'`)

**`classify`**

- `categories?`: `string[]` (default: `['positive', 'negative', 'neutral']`)
- `maxResults?`: `number` (default: `3`)

**`extract`**

- `entityTypes?`: `string[]` (default: `['person', 'location', 'date', 'organization']`)

**`chat` / `chatStream`**

- `systemPrompt?`: `string`
- `history?`: `ChatMessage[]` (prior conversation context)
- `onChunk?`: `(chunk: ChatStreamChunk) => void` (streaming only)

**`translate`**

- `sourceLanguage?`: `string` (default: `'en'`)
- `targetLanguage`: `string` (required)

**`rewrite`**

- `outputType`: `'ELABORATE'`, `'EMOJIFY'`, `'SHORTEN'`, `'FRIENDLY'`, `'PROFESSIONAL'`, or `'REPHRASE'` (required)

### Model Management

| Function                              | Description                       |
| ------------------------------------- | --------------------------------- |
| `getAvailableModels()`                | List downloadable models (iOS).   |
| `downloadModel(modelId, onProgress?)` | Download a model (iOS).           |
| `loadModel(modelId)`                  | Load a model into memory (iOS).   |
| `deleteModel(modelId)`                | Delete a downloaded model (iOS).  |
| `getCurrentEngine()`                  | Get the active inference engine.  |
| `getPromptApiStatus()`                | Get Gemini Nano status (Android). |
| `downloadPromptApiModel(onProgress?)` | Download Gemini Nano (Android).   |

## Platform Support

| Feature                | iOS | Android |
| ---------------------- | --- | ------- |
| Apple Intelligence     | Yes | -       |
| Gemini Nano            | -   | Yes     |
| Custom model downloads | Yes | -       |
| Chat streaming         | Yes | Yes     |
| All 7 AI features      | Yes | Yes     |

## License

MIT
