# Deployment

## Overview

Distribution is via public package registries.

## Package Distribution

| Platform | Package                 | Registry        |
| -------- | ----------------------- | --------------- |
| Apple    | `Locanara`              | SPM + CocoaPods |
| Android  | `com.locanara:locanara` | Maven Central   |
| Expo     | `expo-ondevice-ai`      | npm             |

## Release Workflows

Located in `.github/workflows/`:

| Workflow              | Purpose                     |
| --------------------- | --------------------------- |
| `release-apple.yml`   | Apple SDK → SPM + CocoaPods |
| `release-android.yml` | Android SDK → Maven Central |
| `release-expo.yml`    | Expo module → npm           |
| `deploy-site.yml`     | Site → Firebase Hosting     |

### Workflow Inputs

Each workflow has one input:

- **version**: Version bump type (`current`, `patch`, `minor`, `major`)

### Required Secrets

| Secret                       | Purpose                  |
| ---------------------------- | ------------------------ |
| `COCOAPODS_TRUNK_TOKEN`      | CocoaPods publishing     |
| `MAVEN_CENTRAL_USERNAME`     | Maven Central username   |
| `MAVEN_CENTRAL_PASSWORD`     | Maven Central password   |
| `SIGNING_KEY`                | Android signing key      |
| `SIGNING_KEY_PASSWORD`       | Android signing password |
| `FIREBASE_SERVICE_ACCOUNT_*` | Firebase deployment      |

> npm (expo-ondevice-ai) uses OIDC trusted publishing — no token secret needed.

## Versioning

Versions are tracked in `locanara-versions.json` (single source of truth):

```json
{
  "version": "1.0.0", // Root package
  "types": "1.0.0", // GraphQL types
  "apple": "1.0.0", // iOS/macOS SDK
  "android": "1.0.0", // Android SDK
  "expo": "0.1.0" // Expo module (npm)
}
```

### Automatic Version Sync

All release workflows automatically sync package.json versions using `bun run version:sync`:

1. Workflow updates `locanara-versions.json`
2. Runs `bun run version:sync`
3. Commits synced package.json files
4. Builds and publishes

See [docs/VERSION_SYNC.md](../../docs/VERSION_SYNC.md) for implementation details.

## CI/CD

This repository uses **standard GitHub-hosted runners**.

- iOS: `macos-latest`
- Android/Docs: `ubuntu-latest`

## Platform Requirements

### iOS

- SPM minimum deployment target: iOS 17 (Package.swift)
- Foundation Models (Apple Intelligence):
  - **Minimum**: iOS 18.1+ (iPhone 15 Pro or later)
  - **Recommended**: iOS 26+ for full feature support
  - **Storage**: 7GB+ free space required
- llama.cpp engine: iOS 17+ with Apple Silicon
- Devices without Apple Intelligence can use llama.cpp with downloaded GGUF models

### Android

- Minimum SDK: API 31
- Requires Gemini Nano support
