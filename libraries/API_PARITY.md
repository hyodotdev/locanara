# API Parity Reference

Cross-platform availability matrix for Locanara wrapper libraries.

## Core AI Features

| API | expo-ondevice-ai | react-native-ondevice-ai | flutter_ondevice_ai | Notes |
| --- | :---: | :---: | :---: | --- |
| `initialize()` | ✅ | ✅ | ✅ | |
| `getDeviceCapability()` | ✅ | ✅ | ✅ | |
| `summarize(text, options?)` | ✅ | ✅ | ✅ | |
| `classify(text, options?)` | ✅ | ✅ | ✅ | |
| `extract(text, options?)` | ✅ | ✅ | ✅ | |
| `chat(message, options?)` | ✅ | ✅ | ✅ | |
| `chatStream(message, options?)` | ✅ | ✅ | ✅ | Streaming via `onChunk` callback |
| `translate(text, options)` | ✅ | ✅ | ✅ | |
| `rewrite(text, options)` | ✅ | ✅ | ✅ | |
| `proofread(text, options?)` | ✅ | ✅ | ✅ | |

## Streaming Variants

Streaming is supported for all text-generation features via callback-based APIs. Each
streaming function accepts an `onChunk` callback that delivers tokens progressively.

| API | expo-ondevice-ai | react-native-ondevice-ai | flutter_ondevice_ai | Notes |
| --- | :---: | :---: | :---: | --- |
| `summarizeStreaming(text, options?)` | ✅ | ✅ | 🚧 | `onChunk` callback |
| `translateStreaming(text, options)` | ✅ | ✅ | 🚧 | `onChunk` callback |
| `rewriteStreaming(text, options)` | ✅ | ✅ | 🚧 | `onChunk` callback |
| `chatStream(message, options?)` | ✅ | ✅ | ✅ | Already supported |

## Image Features

| API | expo-ondevice-ai | react-native-ondevice-ai | flutter_ondevice_ai | Notes |
| --- | :---: | :---: | :---: | --- |
| `describeImage(imageUri, options?)` | ✅ | ✅ | 🚧 | iOS (Foundation Models Vision) + Android (describeImageAndroid) |
| `describeImageStreaming(imageUri, options?)` | 🚧 | 🚧 | 🚧 | Planned |

## Chrome-Only Features

These APIs are available exclusively in the **Web SDK** (`@locanara/web`) because they
rely on Chrome's Built-in AI APIs. They are **not available** in Expo, React Native, or
Flutter wrapper libraries.

| API | Web SDK | Wrappers | Reason |
| --- | :---: | :---: | --- |
| `detectLanguage(text)` | ✅ | ❌ | Chrome Language Detection API only |
| `write(prompt, options?)` | ✅ | ❌ | Chrome Writer API only |
| `writeStreaming(prompt, options?)` | ✅ | ❌ | Chrome Writer API only |

If you need language detection on mobile, consider using a third-party library like
`react-native-mlkit` or the device's built-in locale detection.

## Model Management

| API | expo-ondevice-ai | react-native-ondevice-ai | flutter_ondevice_ai | Notes |
| --- | :---: | :---: | :---: | --- |
| `getAvailableModels()` | ✅ | ✅ | ✅ | iOS only — returns `[]` on Android |
| `getDownloadedModels()` | ✅ | ✅ | ✅ | iOS only — returns `[]` on Android |
| `getLoadedModel()` | ✅ | ✅ | ✅ | |
| `getCurrentEngine()` | ✅ | ✅ | ✅ | |
| `downloadModel(id, onProgress?)` | ✅ | ✅ | ✅ | iOS only |
| `loadModel(id)` | ✅ | ✅ | ✅ | iOS only |
| `deleteModel(id)` | ✅ | ✅ | ✅ | iOS only |

## Android-Only Features

| API | expo-ondevice-ai | react-native-ondevice-ai | flutter_ondevice_ai | Notes |
| --- | :---: | :---: | :---: | --- |
| `getPromptApiStatus()` | ✅ | ✅ | ✅ | Android only — Gemini Nano Prompt API status |
| `downloadPromptApiModel(onProgress?)` | ✅ | ✅ | ✅ | Android only — download Gemini Nano |

## Legend

| Symbol | Meaning |
| --- | --- |
| ✅ | Available |
| 🚧 | Planned / In Progress |
| ❌ | Not available on this platform |
