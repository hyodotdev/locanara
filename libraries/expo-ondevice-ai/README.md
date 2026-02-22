# expo-ondevice-ai

[![npm version](https://img.shields.io/npm/v/expo-ondevice-ai.svg)](https://www.npmjs.com/package/expo-ondevice-ai) [![license](https://img.shields.io/npm/l/expo-ondevice-ai.svg)](https://github.com/hyodotdev/locanara/blob/main/LICENSE)

Expo module for on-device AI using [Locanara SDK](https://github.com/hyodotdev/locanara).

All AI processing happens **locally on-device** - no data leaves the user's device.

> **Not using Expo?** Use [`react-native-ondevice-ai`](../react-native-ondevice-ai/) for bare React Native apps via Nitro Modules.

## Installation

```bash
npx expo install expo-ondevice-ai
```

## Requirements

- Expo SDK 52+
- iOS 26+ (Apple Intelligence)
- Android 14+ (Gemini Nano)
- Web: Chrome 138+ (Chrome Built-in AI / Gemini Nano)

## Usage

```typescript
import {
  initialize,
  getDeviceCapability,
  summarize,
  classify,
  chat,
  translate,
  rewrite,
  proofread,
} from 'expo-ondevice-ai';

// Initialize the SDK
await initialize();

// Check device capability
const capability = await getDeviceCapability();

// Summarize text
const summary = await summarize('Long article text...', {
  inputType: 'ARTICLE',
  outputType: 'THREE_BULLETS',
});

// Classify text
const result = await classify('Great product!', {
  categories: ['positive', 'negative', 'neutral'],
});

// Translate
const translated = await translate('Hello', {
  targetLanguage: 'ko',
});
```

## Features

| Feature | Options | Description |
| --- | --- | --- |
| `summarize(text, options?)` | `inputType?`, `outputType?` | Text summarization |
| `classify(text, options?)` | `categories?`, `maxResults?` | Text classification |
| `extract(text, options?)` | `entityTypes?` | Entity extraction |
| `chat(message, options?)` | `systemPrompt?`, `history?` | Conversational AI |
| `chatStream(message, options?)` | `onChunk?`, `systemPrompt?` | Streaming chat |
| `translate(text, options)` | `targetLanguage`, `sourceLanguage?` | Language translation |
| `rewrite(text, options)` | `outputType` | Text rewriting |
| `proofread(text)` | - | Grammar correction |

## Documentation

Full API documentation and guides are available at **[locanara.com/docs/libraries/expo](https://locanara.com/docs/libraries/expo)**.

## License

AGPL-3.0
