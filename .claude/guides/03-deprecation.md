# Deprecation Policy

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Deprecation Process

1. **Mark as Deprecated**: Add deprecation annotation with migration guide
2. **Document**: Update changelog with deprecation notice
3. **Grace Period**: Maintain deprecated APIs for at least one minor version
4. **Remove**: Remove in next major version

## Platform-Specific Annotations

### Swift

```swift
@available(*, deprecated, message: "Use newMethod() instead")
func oldMethod() { }
```

### Kotlin

```kotlin
@Deprecated("Use newMethod() instead", ReplaceWith("newMethod()"))
fun oldMethod() { }
```

## Current Deprecations

No public deprecations were found in the current SDK scan. Apple
`InferenceRouter` has a private deprecated `buildPrompt` helper retained for
internal migration context. Re-run an annotation search before making release
or compatibility claims; this section is not a permanent registry.
