# Locanara Git & Deployment

> **Priority: MANDATORY**
> Follow these conventions for all git operations and deployments.

## Branch Strategy

```
main                    # Production-ready code
  │
  ├── feat/xxx          # New features
  ├── fix/xxx           # Bug fixes
  ├── docs/xxx          # Documentation
  ├── refactor/xxx      # Code refactoring
  └── chore/xxx         # Maintenance tasks
```

## Commit Message Format

```
<type>: <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Rules

1. **Use lowercase** for type
2. **Keep description under 72 characters**
3. **Use imperative mood** ("add" not "added")
4. **NEVER add Co-Authored-By** or any co-author attribution

### Examples

```bash
# CORRECT
feat: add streaming support for chat API
fix: resolve memory leak in LlamaCppEngine
docs: update API documentation for Pro tier
refactor: simplify model loading logic
test: add unit tests for ModelManager
chore: update dependencies

# INCORRECT
Feat: Add streaming support          # Wrong case
feat: Added streaming support        # Past tense
feat: add streaming support for chat API with better performance and error handling  # Too long
feat: add streaming
Co-Authored-By: Someone              # Never add co-author
```

## Pull Request Guidelines

### Title Format

Same as commit message:

```
feat: add model download progress UI
```

### PR Body Template

```markdown
## Summary
<1-3 bullet points describing the change>

## Test plan
- [ ] Unit tests pass
- [ ] Manual testing on iOS device
- [ ] Manual testing on macOS
- [ ] Memory usage verified

## Screenshots (if UI changes)
[Attach screenshots or screen recordings]
```

### Review Checklist

- [ ] Code follows naming conventions
- [ ] Error handling is complete
- [ ] No cloud fallbacks added
- [ ] Tests added/updated
- [ ] Documentation updated

## Versioning

All packages share the same version in `locanara-versions.json`:

```json
{
  "version": "1.0.0",
  "apple": "1.0.0",
  "android": "1.0.0"
}
```

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking API changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

### Version Bump Script

```bash
# Bump patch version
bun run scripts/bump-version.mjs patch

# Bump minor version
bun run scripts/bump-version.mjs minor

# Bump major version
bun run scripts/bump-version.mjs major
```

## Release Process

### 1. Pre-Release Checks

```bash
# Run tests
swift test

# Build all targets
swift build -c release

# Check for warnings
swift build 2>&1 | grep warning
```

### 2. Create Release

```bash
# 1. Update version
bun run scripts/bump-version.mjs minor

# 2. Update CHANGELOG.md
# Add release notes under new version header

# 3. Commit version bump
git add .
git commit -m "chore: bump version to 1.1.0"

# 4. Create tag
git tag -a v1.1.0 -m "Release 1.1.0"

# 5. Push
git push origin main --tags
```

### 3. Post-Release

- Create GitHub Release with release notes
- Update documentation site
- Notify users via appropriate channels

## Distribution

### Swift Package Manager

Packages are distributed via GitHub:

```swift
// Package.swift in consumer app
dependencies: [
    .package(url: "https://github.com/locanara/locanara", from: "1.0.0")
]
```

### Binary XCFramework

For Pro tier, pre-built XCFramework is provided via SPM binary target:

```swift
// Binary target in root Package.swift (locanara/locanara repo)
.binaryTarget(
    name: "Locanara",
    url: "https://r2-url/Locanara.xcframework.zip",
    checksum: "..."
)
```

## CI/CD

### GitHub Actions Workflows

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: swift build
      - name: Test
        run: swift test
```

### Required Checks

- Build succeeds
- Tests pass
- No new warnings
- Code coverage maintained

## Hotfix Process

For critical production issues:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b fix/critical-issue

# 2. Fix the issue
# Make minimal, targeted changes

# 3. Test thoroughly
swift test

# 4. Create PR with urgency label
# PR title: fix: critical issue description

# 5. After merge, create patch release
bun run scripts/bump-version.mjs patch
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git push origin main --tags
```
