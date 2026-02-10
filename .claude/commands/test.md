# /test

Writes and runs tests for all platforms (iOS, Android).

## Usage

```text
/test <request in natural language>
```

## Examples

```text
/test write tests for all platforms
/test test both apple and android
/test add Summarize feature tests
/test run existing tests and report results
/test check test coverage
/test write iOS tests only
/test add Android integration tests
```

## Instructions

When this command is executed, perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Write Tests**: Generate tests for existing implementation files
- **Run Tests**: Execute written tests and report results
- **Check Coverage**: Measure and report test coverage
- **Validate Tests**: Check existing test code quality
- **Integration Tests**: Generate end-to-end scenario tests

### 2. Check Implementation Code

Always check implemented code first:

```text
# iOS implementation
- packages/apple/Sources/

# Android implementation
- packages/android/locanara/src/main/kotlin/
```

### 3. Perform Task

#### 3.1 When Writing Tests

**iOS (Swift + XCTest)**:

1. Find implementation file (e.g., `Sources/BuiltIn/SummarizeChain.swift`)
2. Create/update test file (`Tests/FrameworkTests.swift`)
3. Write test cases:
   - Happy path
   - Invalid input
   - Boundary conditions
   - Error handling
   - Edge cases
4. Create mock objects (if needed)

**Android (Kotlin + JUnit + MockK)**:

1. Find implementation file (e.g., `builtin/SummarizeChain.kt`)
2. Create/update test file (`src/test/kotlin/com/locanara/FrameworkTest.kt`)
3. Write test cases:
   - Happy path
   - Invalid input
   - Boundary conditions
   - Error handling
   - Edge cases
4. Create mock objects (if needed, using MockK)

#### 3.2 When Running Tests

**iOS**:

```bash
swift test
# Or specific test only
swift test --filter SummarizeTests
```

**Android**:

```bash
cd packages/android
./gradlew :locanara:test
# Or specific test only
./gradlew :locanara:test --tests "com.locanara.FrameworkTest"
```

Parse results and report to user

#### 3.3 When Checking Coverage

**iOS**:

```bash
swift test --enable-code-coverage
```

**Android**:

```bash
cd packages/android
./gradlew jacocoTestReport
```

Analyze and report coverage results

#### 3.4 Auto Test Generation Logic

Process both platforms automatically without distinction:

```markdown
1. Check packages/apple/Sources/
   → Find file without test
   → Generate Swift test

2. Check packages/android/.../src/main/kotlin/
   → Find file without test
   → Generate Kotlin test

3. Report to user:
   "iOS: 3 test files created
    Android: 3 test files created"
```

### 4. Test Writing Rules

**Always follow Test Engineer's SKILL.md rules:**

**Swift (XCTest)**:

- Naming: `testMethodName_WithCondition_ExpectedResult()`
- Given-When-Then structure
- async/await tests
- Use XCTAssert family
- Use mock objects

**Kotlin (JUnit + MockK)**:

- Naming: `execute with valid input returns result` (backtick)
- Given-When-Then structure
- `runTest` for coroutines
- `assertThat` or `assertEquals`
- Mocking with MockK

### 5. Required Test Cases

All public APIs must test:

- [ ] Happy path (normal operation)
- [ ] Invalid input
- [ ] Boundary conditions
- [ ] Error handling
- [ ] Edge cases
- [ ] Low Power Mode / Battery Saver
- [ ] Insufficient memory

### 6. Integration Test Generation

End-to-end scenarios:

```swift
// iOS
func testEndToEndWorkflow() async throws {
    try await LocanaraClient.shared.initialize()
    let capability = try LocanaraClient.shared.getDeviceCapability()
    let context = try await LocanaraClient.shared.createContext(...)
    let result = try await LocanaraClient.shared.executeFeature(...)
    // Assertions
}
```

```kotlin
// Android
@Test
fun `end to end workflow succeeds`() = runTest {
    val locanara = Locanara.getInstance(context)
    locanara.initialize()
    val capability = locanara.getDeviceCapability()
    val result = locanara.executeFeature(...)
    // Assertions
}
```

### 7. Automatic Workflow

When user requests:

1. **Analyze**: Understand request (which platform? what task?)
2. **Explore**:
   - Find implementation files
   - Check existing tests
3. **Execute**:
   - iOS test creation/execution
   - Android test creation/execution
   - (or both)
4. **Validate**: Check test code quality
5. **Report**: Summarize work and results

## After Completion

Automatically suggest:

- [ ] If test fails: Implementation fix needed (`/apple` or `/android`)
- [ ] If coverage low: Suggest additional test cases
- [ ] If docs update needed: Recommend `/docs` command

## Key Principles

1. **Both Platforms**: Test both iOS and Android unless specified
2. **Auto-detect**: Automatically find files that need tests and create them
3. **Quality First**: Target 80%+ coverage
4. **Actual Execution**: Run tests and report results when possible
5. **Use Mocks**: Handle external dependencies with mocks

## Example Execution Scenarios

### Scenario 1: All Platform Tests

```markdown
User: /test write tests for all platforms

Agent:
1. Scan packages/apple/Sources/
   - Summarize.swift → has tests
   - Classify.swift → no tests ← needs creation
   - Extract.swift → no tests ← needs creation

2. Scan packages/android/.../kotlin/
   - Summarize.kt → has tests
   - Classify.kt → no tests ← needs creation
   - Extract.kt → no tests ← needs creation

3. Create iOS tests:
   - Create ClassifyTests.swift
   - Create ExtractTests.swift

4. Create Android tests:
   - Create ClassifyTest.kt
   - Create ExtractTest.kt

5. Report to user:
   "iOS: 2 test files created (Classify, Extract)
    Android: 2 test files created (Classify, Extract)"
```

### Scenario 2: Run Tests

```markdown
User: /test run existing tests and report results

Agent:
1. Run iOS tests:
   swift test

2. Run Android tests:
   cd packages/android && ./gradlew test

3. Parse results:
   - iOS: 25 tests, 24 passed, 1 failed
   - Android: 20 tests, all passed

4. Report to user:
   "iOS: 24/25 passed (SummarizeTests.testWithEmptyInput failed)
    Android: 20/20 passed"
```

### Scenario 3: Specific Feature Test

```markdown
User: /test add Summarize feature tests

Agent:
1. Find Features/Summarize.swift
2. Check Tests/Features/SummarizeTests.swift
3. Find missing test cases
4. Add tests (e.g., boundary condition tests)
5. Find features/Summarize.kt
6. Check and update SummarizeTest.kt
7. Report to user:
   "iOS: 3 tests added to SummarizeTests
    Android: 3 tests added to SummarizeTest"
```

### Scenario 4: Platform-Specific Tests

```markdown
User: /test write iOS tests only

Agent:
1. Check packages/apple/Sources/ only
2. Find files without tests
3. Generate Swift tests
4. Report to user:
   "iOS: 3 test files created"
```

## Reference Documents

- `CLAUDE.md` - Project conventions
- `packages/apple/Tests/` - iOS tests
- `packages/android/.../src/test/` - Android tests
