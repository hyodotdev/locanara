# Locanara

<p align="center">
  <img src="logo.png" alt="Locanara" width="120" height="120" />
</p>

<p align="center">
  <strong>Unified On-Device AI SDK for iOS and Android</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
</p>

<p align="center">
  <img src="https://github.com/hyodotdev/locanara-community/actions/workflows/ci-ios.yml/badge.svg" alt="CI iOS" />
  <img src="https://github.com/hyodotdev/locanara-community/actions/workflows/ci-android.yml/badge.svg" alt="CI Android" />
</p>

---

## Overview

Locanara provides a unified API for on-device AI across platforms:

- **iOS/macOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano (ML Kit GenAI)

All AI processing happens locally on the device. No cloud. No data leaves.

---

## Packages

| Package | Description | Version |
| ------- | ----------- | ------- |
| [**apple**](packages/apple) | iOS/macOS SDK | [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?style=flat-square&label=pod)](https://cocoapods.org/pods/Locanara) [![SPM](https://img.shields.io/github/v/tag/hyodotdev/locanara-swift?style=flat-square&logo=swift&label=spm)](https://github.com/hyodotdev/locanara-swift) |
| [**android**](packages/android) | Android SDK | [![Maven Central](https://img.shields.io/maven-central/v/com.locanara/locanara?style=flat-square&label=maven)](https://central.sonatype.com/artifact/com.locanara/locanara) |
| [**docs**](packages/docs) | Documentation | [locanara.com](https://locanara.com) |

---

## Features

| Feature | iOS | Android |
| ------- | --- | ------- |
| Summarize | Apple Intelligence | Gemini Nano |
| Classify | Apple Intelligence | Gemini Nano |
| Extract | Apple Intelligence | Gemini Nano |
| Chat | Apple Intelligence | Gemini Nano |
| Translate | Apple Intelligence | Gemini Nano |
| Rewrite | Apple Intelligence | Gemini Nano |
| Proofread | Apple Intelligence | Gemini Nano |

> **Looking for more?** [Locanara PRO](https://locanara.com/pro) adds llama.cpp fallback for universal device coverage, RAG pipelines, and personalization features.

---

## Quick Start

### iOS/macOS (Swift Package Manager)

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara-swift.git", from: "1.0.0")
]
```

```swift
import Locanara

// Check device capability
let capability = await Locanara.getDeviceCapability()

// Summarize text
let result = await Locanara.summarize(text: "Your text here...")
```

### Android (Gradle)

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.locanara:locanara:1.0.0")
}
```

```kotlin
import com.locanara.Locanara

// Check device capability
val capability = Locanara.getDeviceCapability()

// Summarize text
val result = Locanara.summarize(text = "Your text here...")
```

---

## Documentation

Full documentation is available at [locanara.com](https://locanara.com).

---

## Community vs PRO

| Feature | Community | PRO |
| ------- | --------- | --- |
| OS-level AI (Apple Intelligence, Gemini Nano) | Yes | Yes |
| Fallback Engine (llama.cpp for unsupported devices) | - | Yes |
| Local RAG Pipeline | - | Yes |
| Personalization & Memory | - | Yes |
| Model Manager | - | Yes |

[Learn more about PRO](https://locanara.com/pro)

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <sub>Built with conviction that AI should run where your data lives - on your device.</sub>
</p>
