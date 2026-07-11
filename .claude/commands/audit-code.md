# Audit Code

Audit code against Locanara project rules and conventions.

## Overview

This command audits code files against the project rules:

1. **Naming Conventions** - Check function/class naming
2. **Architecture** - Verify on-device only approach
3. **Coding Style** - Swift/Kotlin style compliance
4. **API Design** - Cross-platform consistency
5. **Error Handling** - LocanaraError usage
6. **Privacy Boundaries** - No prompt, output, RAG content, or entity logging
7. **Contract Integrity** - SDK/wrapper behavior, generated types, and versions agree

## Usage

When asked to audit code, perform these checks:

### 1. Naming Convention Audit

```text
✓ API methods use correct names (summarize, classify, etc.)
✓ Swift acronyms follow rules (AI uppercase)
✓ Error types use Locanara prefix
✓ GraphQL platform-specific operations/types use the repository's IOS/Android suffix rules
✓ Generated language names match the generator output; implementation names match the live public API
```

### 2. Architecture Audit

```text
✓ No hosted/cloud inference dependencies; local runtime dependencies are allowed
✓ No cloud fallback code exists
✓ Uses an implemented on-device engine (Foundation Models, Gemini Nano/ML Kit, or a verified local engine)
✓ Privacy-first approach maintained
```

### 2.1 Platform-Specific API Naming Audit

Check naming conventions for platform-specific features:

```text
✓ GraphQL Android-only operations/types use the `Android` suffix
✓ GraphQL iOS-only operations/types use the `IOS` suffix
✓ Generated Swift enum cases follow the generator's acronym conversion (for example, `generateImageIos`)
```

Do not mechanically rename public implementation methods from a suffix grep.
Verify the schema, generated output, and current public declarations together.

### 3. Coding Style Audit

```text
✓ Swift uses async/await for AI operations
✓ Kotlin uses suspend functions
✓ Logging uses os.log (Swift) or Log (Kotlin)
✓ Thread safety with proper synchronization
✓ Production logs contain no user input or model output
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

For automated auditing, use `rg` and inspect every match; comments and examples
are not automatically violations:

```bash
# Check for cloud fallback (should return empty)
rg -n -i "cloud fallback|api\.anthropic|api\.openai" packages libraries

# Check for incorrect error naming
rg -n "throw .*Error" packages/apple/Sources --glob '*.swift'

# Check for print statements (should use os.log Logger)
rg -n "\\bprint\\(" packages/apple/Sources --glob '*.swift'

# Check for Kotlin !! non-null assertions (should use smart casts)
rg -n "!!" packages/android/locanara/src/main --glob '*.kt'

# Check platform-specific feature naming in GraphQL
rg -n "DESCRIBE_IMAGE|GENERATE_IMAGE" packages/gql/src --glob '*.graphql'

# Check sensitive logging across SDK sources
rg -n "print\\(|println\\(|Log\\.[dviwe]\\(|logger\\." \
  packages/apple/Sources packages/android/locanara/src/main

# Check version copies and wrapper fallbacks against the source of truth
jq . locanara-versions.json
rg -n "com\.locanara:locanara:|SDK_VERSION|version" \
  packages libraries --glob '*.{gradle,kts,swift,json,yaml}'
```
