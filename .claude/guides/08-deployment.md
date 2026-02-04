# Deployment (Community)

## Overview

This is the **Community** repository. Distribution is via public package registries.

## Package Distribution

| Platform | Package                 | Registry        |
| -------- | ----------------------- | --------------- |
| Apple    | `Locanara`              | SPM + CocoaPods |
| Android  | `com.locanara:locanara` | Maven Central   |

## Release Workflows

Located in `.github/workflows/`:

| Workflow              | Purpose                     |
| --------------------- | --------------------------- |
| `release-apple.yml`   | Apple SDK → SPM + CocoaPods |
| `release-android.yml` | Android SDK → Maven Central |
| `deploy-docs.yml`     | Docs → Firebase Hosting     |

### Workflow Inputs

Each workflow has one input:

- **version**: Version bump type (`current`, `patch`, `minor`, `major`)

### Required Secrets

| Secret                         | Purpose                    |
| ------------------------------ | -------------------------- |
| `COCOAPODS_TRUNK_TOKEN`        | CocoaPods publishing       |
| `MAVEN_CENTRAL_USERNAME`       | Maven Central username     |
| `MAVEN_CENTRAL_PASSWORD`       | Maven Central password     |
| `SIGNING_KEY`                  | Android signing key        |
| `SIGNING_KEY_PASSWORD`         | Android signing password   |
| `FIREBASE_SERVICE_ACCOUNT_*`   | Firebase deployment        |

## Versioning

Versions are tracked in `locanara-versions.json`:

```json
{
  "version": "1.0.0",
  "types": "1.0.0",
  "apple": "1.0.0",
  "android": "1.0.0"
}
```

## CI/CD

This repository uses **standard GitHub-hosted runners**.

- iOS: `macos-latest`
- Android/Docs: `ubuntu-latest`

## Platform Requirements

### iOS

- Minimum deployment target: iOS 26
- Requires Apple Intelligence (Apple Silicon)

### Android

- Minimum SDK: API 31
- Requires Gemini Nano support
