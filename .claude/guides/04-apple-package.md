# Apple Package (iOS SDK)

## Overview

Location: `packages/apple/`

The Apple SDK provides Locanara functionality for iOS and macOS using Apple Intelligence (Foundation Models).

## Requirements

- Xcode 15+
- iOS 15+ / macOS 12+
- Swift 5.9+

## Build Commands

```bash
cd packages/apple

# Build
swift build

# Test
swift test

# Generate types from GQL
./scripts/generate-types.sh
```

## Project Structure

```text
packages/apple/
├── Sources/
│   └── Locanara/       # Main SDK source
├── Tests/
│   └── LocanaraTests/  # Unit tests
├── Example/             # Sample app
│   ├── Locanara.xcodeproj/
│   └── LocanaraExample/
├── Package.swift        # SPM configuration
└── scripts/
    └── generate-types.sh
```

## Example App

The Example app demonstrates SDK features and is used for testing.

```bash
# Open in Xcode
open packages/apple/Example/Locanara.xcodeproj

# Or use VSCode launch.json
# Select "🍎 Open Apple (iOS) in Xcode"
```

### Example App Structure

```text
packages/apple/Example/
├── Locanara.xcodeproj/
├── LocanaraExample/
│   ├── LocanaraExampleApp.swift
│   ├── ContentView.swift
│   ├── Screens/
│   │   └── uis/
│   ├── ViewModels/
│   └── Models/
```

## Integration

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/hyodotdev/locanara", from: "0.1.0")
]
```

## Key Files

- `Sources/Locanara/Types/` - Generated types from GQL (do not edit)
- `Sources/Locanara/Client/` - Main client implementation
- `Sources/Locanara/Features/` - Feature API implementations

## Notes

- Generated type files are synced from `packages/gql`
- Always run `bun run generate` from root after schema changes
