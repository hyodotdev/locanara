# LocalLLMClient API Reference

> **Source**: https://github.com/tattn/LocalLLMClient
> **Supports**: llama.cpp, MLX, FoundationModels backends

## Overview

LocalLLMClient is a Swift library that provides a unified interface for running local LLMs. It supports multiple backends including llama.cpp (GGUF models), MLX, and Apple's Foundation Models.

## Installation

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/tattn/LocalLLMClient.git", branch: "main")
]

// Targets
.target(
    name: "YourTarget",
    dependencies: [
        .product(name: "LocalLLMClient", package: "LocalLLMClient"),
        .product(name: "LocalLLMClientLlama", package: "LocalLLMClient"),  // For llama.cpp
        // .product(name: "LocalLLMClientMLX", package: "LocalLLMClient"),  // For MLX
    ],
    swiftSettings: [
        .interoperabilityMode(.Cxx)  // Required for llama.cpp
    ]
)
```

## LLMSession - High-Level API

### Local Model (GGUF)

```swift
import LocalLLMClient
import LocalLLMClientLlama

// Create session with local GGUF model
let localModel = LLMSession.LocalModel.llama(
    url: modelPath,
    parameter: LlamaClient.Parameter(
        context: 4096,
        numberOfThreads: 8,
        batch: 512
    )
)

let session = LLMSession(model: localModel)

// Prewarm (load model into memory)
try await session.prewarm()
```

### Download Model

```swift
// Download from HuggingFace
let downloadModel = LLMSession.DownloadModel.llama(
    id: "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
    filename: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
)

let session = LLMSession(model: downloadModel)

// Download with progress
for try await progress in session.downloadProgress() {
    print("Download: \(Int(progress * 100))%")
}

// Model is ready after download completes
```

### Generate Response

```swift
// Single response
let response = try await session.respond(to: "Hello, how are you?")
print(response)

// Streaming response
for try await chunk in session.streamResponse(to: "Tell me a story") {
    print(chunk, terminator: "")
}
```

## LlamaClient - Low-Level API

### Configuration

```swift
import LocalLLMClientLlama

let parameter = LlamaClient.Parameter(
    context: 4096,          // Context window size
    numberOfThreads: 8,     // CPU threads
    batch: 512,             // Batch size
    options: LlamaClient.Options(
        verbose: true,      // Enable logging
        useMmap: true,      // Memory-mapped file loading
        useMlock: false     // Lock memory (requires entitlement)
    )
)
```

### Direct Usage

```swift
let client = try await LlamaClient(
    url: modelPath,
    parameter: parameter
)

// Generate
let response = try await client.generate(prompt: prompt)

// Stream
for try await token in client.stream(prompt: prompt) {
    print(token, terminator: "")
}
```

## MLX Backend (macOS Only)

```swift
import LocalLLMClientMLX

// Load MLX model
let mlxModel = LLMSession.LocalModel.mlx(
    url: mlxModelPath,
    parameter: MLXClient.Parameter()
)

let session = LLMSession(model: mlxModel)
```

## Foundation Models Backend

```swift
import LocalLLMClientFoundation

// Use Apple's Foundation Models
let fmModel = LLMSession.LocalModel.foundationModels()
let session = LLMSession(model: fmModel)
```

## Error Handling

```swift
do {
    try await session.prewarm()
} catch LLMSessionError.modelNotFound {
    // Model file doesn't exist
} catch LLMSessionError.loadFailed(let message) {
    // Failed to load model
} catch LLMSessionError.generationFailed(let message) {
    // Inference error
}
```

## Memory Management

### Context Size

```swift
// Larger context = more memory
// 4096 tokens ≈ 500MB-1GB depending on model

// For low memory devices
let lowMemoryParam = LlamaClient.Parameter(
    context: 512,
    numberOfThreads: 2,
    batch: 128
)

// For high memory devices
let highMemoryParam = LlamaClient.Parameter(
    context: 8192,
    numberOfThreads: 12,
    batch: 1024
)
```

### GPU Acceleration

```swift
let options = LlamaClient.Options(
    gpuLayers: 99  // Offload all layers to GPU (Metal)
)

// For limited GPU memory
let limitedGpuOptions = LlamaClient.Options(
    gpuLayers: 20  // Only offload 20 layers
)
```

## Supported Model Formats

### GGUF (llama.cpp)

- TinyLlama (1.1B)
- Phi-2 (2.7B)
- Mistral (7B)
- Llama 2/3 (7B, 13B)
- Qwen (1.5B, 7B)

Quantization formats:
- Q4_K_M (recommended balance)
- Q5_K_M (better quality)
- Q8_0 (highest quality, largest)

### MLX

- Requires Apple Silicon Mac
- Native MLX model format
- HuggingFace MLX models

## Best Practices

### 1. Model Storage

```swift
// Use Documents directory for better mmap support
let documentsURL = FileManager.default.urls(
    for: .documentDirectory,
    in: .userDomainMask
).first!
let modelPath = documentsURL.appendingPathComponent("models/model.gguf")
```

### 2. Memory Check Before Loading

```swift
let availableMemory = ProcessInfo.processInfo.physicalMemory
let requiredMemory: UInt64 = 2_000_000_000  // 2GB

guard availableMemory > requiredMemory else {
    throw LocanaraError.insufficientMemory(
        required: Int(requiredMemory / 1_000_000),
        available: Int(availableMemory / 1_000_000)
    )
}
```

### 3. Cancellation Support

```swift
let task = Task {
    for try await chunk in session.streamResponse(to: prompt) {
        if Task.isCancelled { break }
        process(chunk)
    }
}

// Cancel when needed
task.cancel()
```

## Integration with Locanara

Locanara Pro uses LocalLLMClient for llama.cpp integration:

```swift
// LlamaCppEngine wraps LocalLLMClient
let localModel = LLMSession.LocalModel.llama(
    url: modelPath,
    parameter: LlamaClient.Parameter(
        context: config.contextSize,
        numberOfThreads: config.numThreads,
        batch: config.batchSize,
        options: LlamaClient.Options(verbose: true)
    )
)

llmSession = LLMSession(model: localModel)
try await llmSession?.prewarm()
```
