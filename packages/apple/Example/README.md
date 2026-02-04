# Locanara Example App

This is a SwiftUI example app demonstrating all features of the Locanara SDK.

## Requirements

- iOS 18.0+ / macOS 15.0+
- Xcode 16.0+
- Device with Apple Intelligence support (iPhone 15 Pro or later, iOS 26.0+)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) for project generation

## Setup

### Using XcodeGen (Recommended)

```bash
cd packages/apple/Example

# For local development (uses source from ../):
xcodegen

# For testing released package (uses SPM from locanara-swift):
xcodegen --spec project-release.yml
```

Then open `LocanaraExample.xcodeproj` in Xcode.

### Available Schemes

- **LocanaraExample** - iOS (Foundation Models)
- **LocanaraExampleMac** - macOS (Foundation Models)

## Features Demonstrated

### AI Availability Check

- Automatic detection of Apple Intelligence support
- Guided setup for enabling Apple Intelligence
- Fallback information for unsupported devices

### SDK Lifecycle

- Proper initialization flow
- State management with SwiftUI
- Error handling and recovery

### Feature Demos

1. **Summarize** - Condense long text into concise summaries
   - Multiple styles: brief, detailed, bullet points
   - Confidence scores

2. **Classify** - Categorize content into predefined labels
   - Custom categories
   - Multi-class classification with scores

3. **Extract** - Extract entities and key information
   - Named entity recognition (person, email, phone, date, location)
   - Color-coded entity types

4. **Chat** - Conversational AI interactions
   - Conversation history
   - Typing indicators
   - System prompts

5. **Translate** - Text translation between languages
   - Support for multiple languages
   - Auto language detection
   - Confidence scores

6. **Rewrite** - Rewrite text in different styles
   - Multiple styles: formal, casual, professional, friendly, concise
   - Style preservation

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
    ├── Available → Main Tab View
    │                   ├── Features List
    │                   ├── Device Info
    │                   └── Settings
    │
    ├── Not Enabled → Setup Guide
    │                   └── Open Settings Button
    │
    └── Not Supported → Requirements Info
                        └── Alternative (Gemini) Info
```

## Code Structure

```text
LocanaraExample/
├── LocanaraExampleApp.swift  # App entry point, AppState
├── ContentView.swift          # Main content with AI check flow
├── MainTabView.swift          # Tab navigation, feature list
└── FeatureDetailView.swift    # Individual feature demos
```

## Privacy

All processing is done on-device using Apple Intelligence. No data is sent to external servers.

## License

MIT License - see main project LICENSE file.
