# expo-ondevice-ai

[![npm version](https://img.shields.io/npm/v/expo-ondevice-ai.svg)](https://www.npmjs.com/package/expo-ondevice-ai) [![license](https://img.shields.io/npm/l/expo-ondevice-ai.svg)](https://github.com/hyodotdev/locanara/blob/main/LICENSE)

Expo module for on-device AI using [Locanara SDK](https://github.com/hyodotdev/locanara).

All AI processing happens **locally on-device** - no data leaves the user's device.

## Installation

```bash
npx expo install expo-ondevice-ai
```

## Requirements

- Expo SDK 52+
- iOS 26+ (Apple Intelligence)
- Android 14+ (Gemini Nano)

## Features

| Feature                 | Description             |
| ----------------------- | ----------------------- |
| `getDeviceCapability()` | Check device AI support |
| `summarize()`           | Text summarization      |
| `classify()`            | Text classification     |
| `extract()`             | Entity extraction       |
| `chat()`                | Conversational AI       |
| `translate()`           | Language translation    |
| `rewrite()`             | Text rewriting          |
| `proofread()`           | Grammar correction      |

## Documentation

Full API documentation and guides are available at **[locanara.com/docs/libraries/expo](https://locanara.com/docs/libraries/expo)**.

## License

AGPL-3.0
