# @locanara/web

Locanara SDK for Chrome Built-in AI (Gemini Nano)

## Requirements

- **Chrome 138+** with Built-in AI enabled
- Chrome Canary or Dev channel recommended for testing

## Setup

### 1. Enable Chrome Built-in AI

1. Open Chrome (Canary or Dev channel)
2. Go to `chrome://flags`
3. Enable the following flags:
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#summarization-api-for-gemini-nano` → **Enabled**
   - `#translation-api` → **Enabled**
   - `#rewriter-api-for-gemini-nano` → **Enabled**
   - `#writer-api-for-gemini-nano` → **Enabled**
   - `#language-detection-api` → **Enabled**
4. Restart Chrome

### 2. Download the Model

After enabling the flags, the Gemini Nano model needs to be downloaded:

1. Go to `chrome://components`
2. Find **Optimization Guide On Device Model**
3. Click **Check for update** to download the model
4. Wait for the download to complete (may take several minutes)

### 3. Verify Installation

Open the browser console and run:

```javascript
// Check if Prompt API is available
await window.LanguageModel?.availability(); // Should return 'readily'

// Check if Summarizer is available
await window.Summarizer?.availability(); // Should return 'available'
```

## Installation

### GitHub Packages (Pro)

Create `.npmrc` file in your project root:

```bash
@locanara:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Install the package:

```bash
npm install @locanara/web
# or
bun add @locanara/web
```

> **Note**: You need a GitHub token with `read:packages` scope. [Generate token here](https://github.com/settings/tokens)

## Quick Start

```typescript
import { Locanara } from "@locanara/web";

// Get singleton instance
const locanara = Locanara.getInstance();

// Check device capabilities
const capability = await locanara.getDeviceCapability();
console.log(capability.availableFeatures);

// Summarize text
const summary = await locanara.summarize("Long article text here...");
console.log(summary.summary);

// Translate text
const translation = await locanara.translate("Hello!", {
  sourceLanguage: "en",
  targetLanguage: "ko",
});
console.log(translation.translatedText);

// Chat with AI
const response = await locanara.chat("What is machine learning?");
console.log(response.response);
```

## Features

### Summarize

```typescript
import { SummarizeType, SummarizeLength } from "@locanara/web";

const result = await locanara.summarize(text, {
  type: SummarizeType.KEY_POINTS, // KEY_POINTS | TLDR | TEASER | HEADLINE
  length: SummarizeLength.MEDIUM, // SHORT | MEDIUM | LONG
});
```

### Translate

```typescript
const result = await locanara.translate(text, {
  sourceLanguage: "en",
  targetLanguage: "ko",
});
```

Supported languages: `en`, `es`, `fr`, `de`, `ja`, `ko`, `zh`, and more.

### Chat

```typescript
const result = await locanara.chat(message, {
  systemPrompt: "You are a helpful assistant.",
  temperature: 0.7,
  topK: 3,
});

// Reset chat session
await locanara.resetChat();
```

### Rewrite

```typescript
import { RewriteTone, RewriteLength } from "@locanara/web";

const result = await locanara.rewrite(text, {
  tone: RewriteTone.MORE_FORMAL, // AS_IS | MORE_FORMAL | MORE_CASUAL
  length: RewriteLength.AS_IS, // SHORTER | AS_IS | LONGER
});
```

### Classify

```typescript
const result = await locanara.classify(text, {
  categories: ["Technology", "Sports", "Politics"],
});
console.log(result.category); // 'Technology'
console.log(result.confidence); // 0.95
```

### Detect Language

```typescript
const results = await locanara.detectLanguage("Bonjour!");
console.log(results[0].detectedLanguage); // 'fr'
console.log(results[0].confidence); // 0.95
```

## Streaming

Most features support streaming:

```typescript
// Streaming summarize
for await (const chunk of locanara.summarizeStreaming(text)) {
  console.log(chunk);
}

// Streaming chat
for await (const chunk of locanara.chatStreaming(message)) {
  process.stdout.write(chunk);
}

// Streaming translate
for await (const chunk of locanara.translateStreaming(text, options)) {
  console.log(chunk);
}
```

## Download Progress

Monitor model download progress:

```typescript
const locanara = Locanara.getInstance({
  onDownloadProgress: (progress) => {
    console.log(
      `Downloaded: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`,
    );
  },
});
```

## Error Handling

```typescript
import { LocanaraError, LocanaraErrorCode } from "@locanara/web";

try {
  const result = await locanara.summarize(text);
} catch (error) {
  if (error instanceof LocanaraError) {
    switch (error.code) {
      case LocanaraErrorCode.NOT_SUPPORTED:
        console.log("Feature not supported on this device");
        break;
      case LocanaraErrorCode.EXECUTION_FAILED:
        console.log("Execution failed:", error.message);
        break;
    }
  }
}
```

## Development

### Run Example

```bash
cd packages/web
bun install
bun run dev
```

Open http://localhost:5173 in Chrome with Built-in AI enabled.

### Run Tests

```bash
bun run test
```

### Build

```bash
bun run build
```

## API Reference

### Locanara

| Method                               | Description              |
| ------------------------------------ | ------------------------ |
| `getInstance(options?)`              | Get singleton instance   |
| `getDeviceCapability()`              | Check available features |
| `summarize(text, options?)`          | Summarize text           |
| `summarizeStreaming(text, options?)` | Summarize with streaming |
| `translate(text, options)`           | Translate text           |
| `translateStreaming(text, options)`  | Translate with streaming |
| `chat(message, options?)`            | Chat with AI             |
| `chatStreaming(message, options?)`   | Chat with streaming      |
| `rewrite(text, options?)`            | Rewrite text             |
| `rewriteStreaming(text, options?)`   | Rewrite with streaming   |
| `classify(text, options)`            | Classify text            |
| `extract(text, options)`             | Extract information      |
| `proofread(text)`                    | Proofread text           |
| `detectLanguage(text)`               | Detect language          |
| `resetChat()`                        | Reset chat session       |
| `destroy()`                          | Cleanup resources        |

## Browser Support

| Browser        | Support       |
| -------------- | ------------- |
| Chrome 138+    | Full support  |
| Chrome Canary  | Full support  |
| Chrome Dev     | Full support  |
| Other browsers | Not supported |

## License

MIT
