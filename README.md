# Locanara

![Locanara](logo.png)

Unified On-Device AI SDK for iOS and Android

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

Locanara provides a unified API for on-device AI across platforms:

- **iOS/macOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano (ML Kit GenAI)

All AI processing happens locally on the device. No cloud. No data leaves.

**Documentation**: [locanara.dev](https://locanara.dev)

---

## Packages

- [**android**](packages/android) - Android SDK
  [![Maven Central](https://img.shields.io/maven-central/v/com.locanara/locanara?label=Maven%20Central)](https://central.sonatype.com/artifact/com.locanara/locanara)
  [![CI Android](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-android.yml)

- [**apple**](packages/apple) - iOS/macOS SDK
  [![GitHub Release](https://img.shields.io/github/v/release/hyodotdev/locanara?filter=apple-*&label=SPM)](https://github.com/hyodotdev/locanara/releases?q=apple&expanded=true)
  [![CocoaPods](https://img.shields.io/cocoapods/v/Locanara?label=CocoaPods)](https://cocoapods.org/pods/Locanara)
  [![CI iOS](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml/badge.svg)](https://github.com/hyodotdev/locanara/actions/workflows/ci-ios.yml)

- [**docs**](packages/docs) - Documentation → [locanara.dev](https://locanara.dev)

---

## Features

Summarize, Classify, Extract, Chat, Translate, Rewrite, Proofread

- **iOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano (preloaded on-device AI model)

---

## Requirements

### iOS/macOS

- iOS 26+ / macOS 26+
- Device with Apple Intelligence support

### Android

- Android 14+ (API 34+)
- Device with Gemini Nano support

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Built with conviction that AI should run where your data lives - on your device.*
