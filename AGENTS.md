# Locanara Community - AI Agent Guidelines

> **Repository: hyodotdev/locanara**
>
> This is the open-source Community SDK for on-device AI.

## Project Overview

Locanara Community is an on-device AI SDK for iOS and Android. It provides a common API layer for developers to integrate on-device AI features using platform-native capabilities.

### Core Principles

- **On-Device Only**: All AI processing happens locally. No cloud fallback.
- **Privacy First**: User data never leaves the device.
- **Unified API**: Same concepts and structure across all platforms.

### Supported Platforms

- **iOS/macOS**: Apple Intelligence (Foundation Models) - iOS 26+, macOS 26+
- **Android**: Gemini Nano (ML Kit GenAI) - Android 14+

### Community Edition

This is the Community (open-source) edition of Locanara SDK.

- Uses OS-level AI capabilities only
- Requires NPU-enabled devices (Apple Silicon, Gemini Nano supported devices)
- Lightweight: < 5MB added to app size

### Distribution

| Platform | Installation                                                     |
|----------|------------------------------------------------------------------|
| iOS      | `https://github.com/hyodotdev/locanara` (SPM) or CocoaPods       |
| Android  | Maven Central: `implementation("com.locanara:locanara:VERSION")` |

## Project Structure

```text
locanara-community/
├── packages/
│   ├── apple/          # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/    # SDK source
│   │   ├── Tests/
│   │   └── Example/    # Example app
│   ├── android/        # Kotlin SDK (Maven Central)
│   │   ├── locanara/   # SDK
│   │   └── example/    # Example app
│   ├── gql/            # GraphQL schema definitions
│   └── docs/           # Documentation website
└── .claude/
    ├── commands/       # Slash commands
    └── guides/         # Project guides
```

## Skills (Slash Commands)

- `/gql` - GraphQL schema architect
- `/apple` - Apple Intelligence SDK development
- `/android` - Android/Gemini Nano SDK development
- `/test` - Test engineer
- `/docs` - Documentation manager
- `/commit` - Git commit and PR workflow
- `/audit-code` - Code audit against project rules

## Commit Conventions

### Format

```text
<type>: <description>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Rules

- Write commit messages in English
- Use lowercase for type
- Keep description concise (under 72 characters)
- **NEVER add Co-Authored-By or any co-author attribution**

### Examples

```sh
feat: add summarize API for iOS
fix: resolve MLKit initialization error
docs: update API documentation
refactor: simplify Foundation Models client
```

## Coding Conventions

### Swift (Apple SDK)

- Use Swift 6.0+ with strict concurrency
- Follow Apple's Swift API Design Guidelines
- Use `async/await` for all AI operations
- Prefix errors with `Locanara` (e.g., `LocanaraError`)

### Kotlin (Android SDK)

- Target Kotlin 2.0+
- Use `suspend` functions for AI operations
- Follow Kotlin coding conventions
- Package: `com.locanara`

### TypeScript (Docs)

- Use strict mode
- Prefer functional components with hooks
- Use CSS modules or CSS-in-JS

## API Naming Conventions

All platforms use identical method names:

- `getDeviceCapability()` - Check device AI support
- `summarize()` - Text summarization
- `classify()` - Text classification
- `extract()` - Entity extraction
- `chat()` - Conversational AI
- `translate()` - Language translation
- `rewrite()` - Text rewriting
- `proofread()` - Grammar correction

## Versioning

All packages share the same version number defined in `locanara-versions.json`:

```json
{
  "version": "1.0.0",
  "types": "1.0.0",
  "apple": "1.0.0",
  "android": "1.0.0"
}
```

## Development Commands

### Docs

```bash
cd packages/docs
bun install
bun dev        # Start dev server
bun build      # Build for production
```

### Apple

```bash
cd packages/apple
swift build
swift test

# Example app
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' build
```

### Android

```bash
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
./gradlew test
```

## Build Verification (Required After Code Changes)

**CRITICAL**: After modifying SDK or example app code, verify builds before committing.

### Quick Build Commands

```bash
# iOS (from packages/apple)
cd packages/apple
swift build

# Example app (from packages/apple/Example)
cd Example
xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' build
```

```bash
# Android (from packages/android)
cd packages/android
./gradlew :locanara:build
./gradlew :example:assembleDebug
```

### When to Verify

| Changed Files | Required Builds |
| ------------- | --------------- |
| `packages/apple/Sources/**` | iOS SDK + Example App |
| `packages/apple/Example/**` | iOS Example App |
| `packages/android/locanara/src/**` | Android SDK + Example App |
| `packages/android/example/**` | Android Example App |

## Important Notes

- Do NOT add cloud AI fallback - this is intentionally on-device only
- Keep API surface identical across platforms
- GraphQL schema is the source of truth for types
- Test on real devices (simulators may not support on-device AI)
