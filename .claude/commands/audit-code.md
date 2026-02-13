# Audit Code

Audit code against Locanara project rules and conventions.

## Overview

This command audits code files against the project rules:

1. **Naming Conventions** - Check function/class naming
2. **Architecture** - Verify on-device only approach
3. **Coding Style** - Swift/Kotlin style compliance
4. **API Design** - Cross-platform consistency
5. **Error Handling** - LocanaraError usage

## Usage

When asked to audit code, perform these checks:

### 1. Naming Convention Audit

```text
✓ API methods use correct names (summarize, classify, etc.)
✓ Swift acronyms follow rules (AI uppercase)
✓ Error types use Locanara prefix
✓ iOS-specific functions end with IOS suffix
✓ Android-specific functions end with Android suffix
```

### 2. Architecture Audit

```text
✓ No external AI dependencies (on-device only)
✓ No cloud fallback code exists
✓ Uses Apple Intelligence (iOS) or Gemini Nano (Android)
✓ Privacy-first approach maintained
```

### 2.1 Platform-Specific API Naming Audit

Check naming conventions for platform-specific features:

```text
✓ Android-only features use 'Android' suffix (e.g., describeImageAndroid)
✓ iOS-only features use 'IOS' suffix in GraphQL (e.g., GENERATE_IMAGE_IOS)
✓ iOS-only features use 'Ios' camelCase in Swift (e.g., generateImageIos)
```

> **Note on IOS vs Ios**: GraphQL enums use SCREAMING_SNAKE_CASE (`GENERATE_IMAGE_IOS`),
> while Swift follows API Design Guidelines where 3+ letter acronyms use title case (`generateImageIos`).
> This is intentional - see [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/).

### 3. Coding Style Audit

```text
✓ Swift uses async/await for AI operations
✓ Kotlin uses suspend functions
✓ Logging uses os.log (Swift) or Log (Kotlin)
✓ Thread safety with proper synchronization
```

### 3.1 Swift Specific Checks

```text
✓ Use Logger from os.log (NOT print statements)
✓ Logger subsystem: "com.locanara"
✓ Logger category matches class name
✓ Use #if canImport for conditional imports
✓ Use @available for version-gated APIs
```

### 3.2 Kotlin Specific Checks

```text
✓ Use smart casts instead of !! non-null assertions
✓ Use when expressions with proper null checks
✓ Prefer early return with null checks over !!
✓ Use withContext for coroutine dispatching
```

**Example - Smart Cast Pattern (Preferred)**

```kotlin
// Good: Smart cast
when {
    parameters.imageBase64 != null -> process(parameters.imageBase64)
    parameters.imagePath != null -> process(parameters.imagePath)
    else -> throw Exception("...")
}

// Bad: Non-null assertion
process(parameters.imageBase64!!)
```

### 4. API Design Audit

```text
✓ Same method names across platforms
✓ Streaming for chat operations
✓ Options pattern for configurable operations
✓ Proper error types with context
```

## Example Audit Output

```markdown
# Code Audit Report

## File: Summarize.swift

### Naming Conventions
✓ Class name follows PascalCase
✓ Methods use correct prefixes (get, is, etc.)

### Architecture
✓ Uses Foundation Models (Apple Intelligence)
✓ No cloud dependencies
✗ Missing @available annotation on line 15

### Coding Style
✓ Uses async/await
✓ Has MARK comments for organization
✗ Missing documentation on public method (line 42)

### Recommendations
1. Add @available(iOS 26.0, macOS 26.0, *) to class
2. Add documentation to summarize() method
```

## Automated Checks

For automated auditing, use these grep patterns:

```bash
# Check for cloud fallback (should return empty)
grep -r "cloud\|api\.anthropic\|api\.openai" packages/apple/Sources/ packages/android/locanara/

# Check for incorrect error naming
grep -r "Error\." --include="*.swift" | grep -v "LocanaraError\."

# Check for print statements (should use os.log Logger)
grep -r "print(" packages/apple/Sources/ --include="*.swift"

# Check for Kotlin !! non-null assertions (should use smart casts)
grep -r "!!" --include="*.kt" packages/android/locanara/

# Check platform-specific feature naming in GraphQL
grep -E "(DESCRIBE_IMAGE|GENERATE_IMAGE)" packages/gql/src/*.graphql
```
