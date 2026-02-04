# Locanara

![Locanara](logo.png)

Unified On-Device AI SDK for iOS and Android

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI iOS](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml)
[![CI Android](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml)

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
| [**apple**](packages/apple) | iOS/macOS SDK | [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?style=flat-square&label=pod)](https://cocoapods.org/pods/Locanara) |
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

---

## Quick Start

### iOS/macOS (Swift Package Manager)

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara", from: "1.0.0")
]
```

```swift
import Locanara

// Check device capability
let capability = await Locanara.getDeviceCapability()

// Summarize text
let result = await Locanara.summarize(text: "Your text here...")
```

### iOS/macOS (CocoaPods)

```ruby
pod 'Locanara', '~> 1.0'
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

## Requirements

### iOS/macOS

- iOS 26+ / macOS 26+
- Device with Apple Intelligence support

### Android

- Android 14+ (API 34+)
- Device with Gemini Nano support

---

## Documentation

Full documentation is available at [locanara.com](https://locanara.com).

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Built with conviction that AI should run where your data lives - on your device.*
