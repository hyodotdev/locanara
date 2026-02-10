# /apple

Performs all tasks related to the Apple Intelligence SDK (iOS). The SDK is a layered on-device AI framework with composable chains, memory, guardrails, and pipeline DSL.

## Usage

```text
/apple <request in natural language>
```

## Examples

```text
/apple check for new features and add them
/apple verify existing code has no issues
/apple check if iOS implementation is correct
/apple implement VoiceRecognition feature
/apple review summarize feature code
/apple add ExecuteFeatureOptionsIOS type
```

## Instructions

When this command is executed, perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Add Feature**: Check GraphQL schema and implement features not yet in iOS
- **Add Chain**: Create a new built-in Chain (in BuiltIn/) with typed result and run() method
- **Validate Code**: Review existing Swift code and identify issues
- **Add Type**: Implement GraphQL type as Swift struct/class
- **Implement API**: Implement GraphQL API operation as Swift async function
- **Refactoring**: Improve code quality

### 2. Check GraphQL Schema

Always check the GraphQL schema first:

```text
# Check iOS-related schemas
- packages/gql/src/type-ios.graphql
- packages/gql/src/utils-ios.graphql
- packages/gql/src/type.graphql (shared)
- packages/gql/src/utils.graphql (shared)
```

### 3. Check Existing Implementation

```text
# Check Swift source code (framework layers)
- packages/apple/Sources/Core/          # LocanaraModel, PromptTemplate, OutputParser, Schema
- packages/apple/Sources/Composable/    # Chain, Tool, Memory, Guardrail
- packages/apple/Sources/BuiltIn/       # SummarizeChain, ClassifyChain, etc.
- packages/apple/Sources/DSL/           # Pipeline, PipelineStep, ModelExtensions
- packages/apple/Sources/Runtime/       # Agent, Session, ChainExecutor
- packages/apple/Sources/Platform/      # FoundationLanguageModel
- packages/apple/Sources/Features/      # Legacy feature executors
```

### 4. Perform Task

#### 4.1 When Adding Feature

1. Check iOS-specific or shared feature types in GraphQL schema
2. Check `packages/apple/Sources/Features/`
3. Find unimplemented features
4. Implement Feature in Swift:
   - Define struct/class types (Types.swift)
   - Implement Feature executor (Features/FeatureName.swift)
   - Integrate Apple Intelligence API
   - Use async/await for async processing
   - Handle errors
   - ARC memory management

#### 4.2 When Validating Code

1. Check Swift coding convention compliance:
   - Naming conventions (PascalCase, camelCase)
   - Correct use of async/await
   - Error handling (throws)
   - Access control (public, internal, private)
   - Documentation comments (///)

2. Check alignment with GraphQL schema:
   - Type names are accurate
   - All fields are implemented
   - Optional matches

3. Performance and optimization:
   - Neural Engine utilization
   - Low Power Mode support
   - Memory management (weak, unowned)

4. Auto-fix when issues are found

#### 4.3 When Adding Type

Convert GraphQL type to Swift:

```swift
// GraphQL: type DeviceInfoIOS
public struct DeviceInfoIOS: Codable {
    public let modelIdentifier: String
    public let osVersion: String
    public let supportsAppleIntelligence: Bool
    public let systemLanguages: [String]
    public let hasNeuralEngine: Bool
}
```

#### 4.4 When Implementing API

Implement GraphQL Mutation/Query as Swift async function:

```swift
// GraphQL: executeFeatureIOS
public func executeFeatureIOS(
    _ input: ExecuteFeatureInput,
    options: ExecuteFeatureOptionsIOS?
) async throws -> ExecutionResult {
    // Implementation
}
```

### 5. Follow Coding Rules

**Always follow Apple Intelligence SDK's SKILL.md rules:**

- Swift 6.0+ coding conventions (language mode v5)
- Async processing with async/await
- Error handling with LocanaraError
- Type definition with struct/class
- Codable protocol
- Documentation comments (///)
- ARC memory management
- Neural Engine optimization

### 6. Reference Documents

Always reference when performing tasks:

- `.claude/guides/04-apple-package.md` - Apple SDK guide
- `packages/gql/src/` - GraphQL schema
- `packages/apple/` - Existing Swift code

### 7. Example Project Build Verification

**After all tasks, always verify example project build:**

1. Swift package build:

   ```bash
   cd packages/apple && swift build
   ```

2. Example app build (repeat until no errors):

   ```bash
   xcodebuild -project Example/LocanaraExample.xcodeproj \
     -scheme LocanaraExample \
     -destination 'platform=iOS Simulator,name=iPhone 17' \
     build 2>&1 | grep -E "(error:|BUILD SUCCEEDED|BUILD FAILED)"
   ```

3. When build errors occur:
   - Analyze error messages
   - Auto-fix (switch exhaustive, missing cases, etc.)
   - Repeat until build succeeds

### 8. Automatic Workflow

When user requests:

1. **Analyze**: Understand the request
2. **Explore**: Check GraphQL schema + existing code
3. **Execute**:
   - New feature found → Implement
   - Issue found → Fix
   - Type/API requested → Generate
4. **Validate**: Check coding rule compliance
5. **Build Check**: Verify example project has no build errors and fix
6. **Report**: Summarize completed work

## After Completion

Automatically suggest:

- [ ] If tests needed: Recommend `/test` command
- [ ] If docs update needed: Recommend `/docs` command
- [ ] If same work needed for Android: Recommend `/android` command

## Key Principles

1. **GraphQL is Truth**: Always check and follow GraphQL schema first
2. **Auto-detect**: Find and perform necessary work even without user specifying details
3. **Quality First**: Correct implementation over fast implementation
4. **Naming Convention**: Platform suffix is always last (e.g., `OptionsIOS`)
5. **Error Handling**: All public APIs must have proper error handling

## Example Execution Scenarios

### Scenario 1: Check and Add New Feature

```markdown
User: /apple check for new features and add them

Agent:
1. Read GraphQL schema (type.graphql, type-ios.graphql)
2. Check enum FeatureType → SUMMARIZE, CLASSIFY, EXTRACT, CHAT, TRANSLATE, REWRITE
3. Check packages/apple/Sources/Features/
4. Find unimplemented feature (e.g., Translate.swift missing)
5. Create and implement Translate.swift
6. Add TranslateResult to Types.swift
7. Report to user: "Added Translate feature."
```

### Scenario 2: Code Validation

```markdown
User: /apple check existing code for issues

Agent:
1. Read all Swift files
2. Compare with GraphQL schema
3. Issues found:
   - ExecuteFeatureIOSOptions → ExecuteFeatureOptionsIOS (naming violation)
   - Some fields missing
4. Auto-fix
5. Report to user: "Fixed 2 naming violations, added 3 missing fields"
```

### Scenario 3: Specific Task

```markdown
User: /apple implement VoiceRecognition feature

Agent:
1. Search for VoiceRecognition related types in GraphQL schema
2. If not found, notify user: "VoiceRecognition is not in GraphQL schema. Please define it first with /gql."
3. If found, generate Swift implementation
4. Report to user: "VoiceRecognition.swift creation complete"
```
