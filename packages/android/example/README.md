# Locanara Android Example App

This is an Android example app demonstrating all features of the Locanara SDK with Gemini Nano.

## Requirements

- Android 12+ (API 31+)
- Android Studio Hedgehog or later
- Device with Gemini Nano support (Pixel 8+ or later)
- Gradle 8.0+

## Setup

```bash
cd packages/android

# Build the SDK first
./gradlew :locanara:build

# Build and install example app
./gradlew :example:assembleDebug
./gradlew :example:installDebug
```

Or open the project in Android Studio and run the `example` configuration.

## Features Demonstrated

### AI Availability Check

- Automatic detection of Gemini Nano support
- Guided setup for enabling Gemini Nano via ML Kit
- Fallback information for unsupported devices

### SDK Lifecycle

- Proper initialization flow
- State management with Jetpack Compose
- Error handling and recovery

### Feature Demos

1. **Summarize** - Condense long text into concise summaries
   - Multiple formats: paragraph, bullet points
   - Confidence scores

2. **Classify** - Categorize content into predefined labels
   - Custom categories
   - Multi-class classification with scores

3. **Extract** - Extract entities and key information
   - Named entity recognition (person, email, phone, date, location)
   - Structured output

4. **Chat** - Conversational AI interactions
   - Conversation history
   - System prompts
   - Context preservation

5. **Translate** - Text translation between languages
   - Support for multiple languages
   - Auto language detection
   - Confidence scores

6. **Rewrite** - Rewrite text in different styles
   - Multiple styles: formal, casual, professional, friendly, concise
   - Style preservation

7. **Proofread** - Grammar and spelling correction
   - Error detection and correction
   - Improvement suggestions

## App Flow

```text
App Launch
    │
    ▼
Initialize SDK
    │
    ▼
Check AI Availability
    │
    ├── Available → Main Screen
    │                   ├── Features List
    │                   ├── Device Info
    │                   └── Settings
    │
    ├── Not Enabled → Setup Guide
    │                   └── Enable Gemini Nano Button
    │
    └── Not Supported → Requirements Info
                        └── Device Compatibility Info
```

## Code Structure

```text
example/
├── build.gradle.kts           # App build configuration
├── proguard-rules.pro         # ProGuard rules
└── src/
    └── main/
        ├── AndroidManifest.xml
        └── kotlin/
            └── com/locanara/example/
                ├── MainActivity.kt       # Main activity, SDK init
                ├── MainScreen.kt         # Feature list UI
                └── FeatureDetailScreen.kt # Individual feature demos
```

## Permissions

The app requires internet permission for initial Gemini Nano download (if not already installed):

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

All AI processing is done on-device after initial setup. No data is sent to external servers.

## Building Release

```bash
# Build release APK
./gradlew :example:assembleRelease

# Output: example/build/outputs/apk/release/example-release-unsigned.apk
```

## Privacy

All processing is done on-device using Gemini Nano via ML Kit. No user data is sent to external servers.

## License

AGPL-3.0 License - see main project LICENSE file.
