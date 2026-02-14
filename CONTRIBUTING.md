# Contributing to Locanara

## Development Setup

### Prerequisites

- Xcode 16.0+
- Android Studio (for Android development)
- [Bun](https://bun.sh) (for docs/web packages)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for iOS Example app)

### Clone the Repository

```bash
git clone https://github.com/hyodotdev/locanara.git
cd locanara
```

## Package Development

### Apple SDK

```bash
cd packages/apple

# Build
swift build

# Test
swift test

# Open Example app
cd Example
make local && make open
```

### Android SDK

```bash
cd packages/android

# Build
./gradlew build

# Test
./gradlew test
```

### Documentation

```bash
cd packages/docs
bun install
bun dev
```

## Testing Local vs Released Packages

When developing the SDK, you can switch between local source and released packages for testing.

### iOS Example App

```bash
cd packages/apple/Example

# Development mode - uses local source (../)
make local
make open

# Release testing - uses published SPM package
make release
make open
```

| Mode    | Command        | Package Source                    |
| ------- | -------------- | --------------------------------- |
| Local   | `make local`   | `path: ../` (local source)        |
| Release | `make release` | `url: locanara-swift` (published) |

### Workflow

1. **During development**: Use `make local` to test changes immediately
2. **After release**: Use `make release` to verify the published package works correctly
3. Always close Xcode before switching modes

## Commit Guidelines

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

### Examples

```text
feat: add summarize API for iOS
fix: resolve dark mode code block styling
docs: update API documentation
refactor: simplify MLKit client initialization
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests locally
4. Submit a PR with a clear description

## Release Process

Releases are automated via GitHub Actions:

- **Apple SDK**: `release-apple.yml` workflow
- **Android SDK**: `release-android.yml` workflow

Packages are distributed via:

- Swift Package Manager (locanara-swift repo)
- CocoaPods
- Maven Central

## Code Style

### Swift

- Swift 6.0+ with strict concurrency
- Follow Apple's Swift API Design Guidelines
- Use `async/await` for AI operations

### Kotlin

- Kotlin 2.0+
- Use `suspend` functions for AI operations
- Follow Kotlin coding conventions

## Questions?

Open an issue on GitHub for questions or discussions.
