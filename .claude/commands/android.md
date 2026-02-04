# /android

Performs all tasks related to the Android SDK (Gemini Nano).

## Usage

```text
/android <request in natural language>
```

## Examples

```text
/android check for new features and add them
/android verify existing code has no issues
/android check if implementation is correct
/android implement VoiceRecognition feature
/android review summarize feature code
/android add ExecuteFeatureOptionsAndroid type
```

## Instructions

When this command is executed, perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Add Feature**: Check GraphQL schema and implement features not yet in Android
- **Validate Code**: Review existing Kotlin code and identify issues
- **Add Type**: Implement GraphQL type as Kotlin data class
- **Implement API**: Implement GraphQL API operation as Kotlin suspend function
- **Refactoring**: Improve code quality

### 2. Check GraphQL Schema

Always check the GraphQL schema first:

```text
# Check Android-related schemas
- packages/gql/src/type-android.graphql
- packages/gql/src/api-android.graphql
- packages/gql/src/type.graphql (shared)
- packages/gql/src/api.graphql (shared)
```

### 3. Check Existing Implementation

```text
# Check Kotlin source code
- packages/android/locanara/src/main/kotlin/dev/hyo/locanara/
```

### 4. Perform Task

#### 4.1 When Adding Feature

1. Check Android-specific or shared feature types in GraphQL schema
2. Check `packages/android/locanara/src/main/kotlin/dev/hyo/locanara/features/`
3. Find unimplemented features
4. Implement Feature in Kotlin:
   - Define data class types (Types.kt)
   - Implement Feature executor (features/FeatureName.kt)
   - Integrate Gemini Nano API
   - Use Coroutines for async processing
   - Ensure Null safety
   - Handle errors

#### 4.2 When Validating Code

1. Check Kotlin coding convention compliance:
   - Naming conventions (PascalCase, camelCase)
   - Correct use of Coroutines
   - Null safety
   - Error handling with sealed class
   - KDoc comments

2. Check alignment with GraphQL schema:
   - Type names are accurate
   - All fields are implemented
   - Nullable matches

3. Performance and optimization:
   - Use GPU acceleration options
   - Appropriate thread count
   - Memory management

4. Auto-fix when issues are found

#### 4.3 When Adding Type

Convert GraphQL type to Kotlin:

```kotlin
// GraphQL: type DeviceInfoAndroid
data class DeviceInfoAndroid(
    val manufacturer: String,
    val model: String,
    val apiLevel: Int,
    val androidVersion: String,
    val supportsGeminiNano: Boolean,
    val systemLanguages: List<String>,
    val gpuInfo: String?,
    val totalRAMMB: Int
)
```

#### 4.4 When Implementing API

Implement GraphQL Mutation/Query as Kotlin suspend function:

```kotlin
// GraphQL: executeFeatureAndroid
suspend fun executeFeatureAndroid(
    input: ExecuteFeatureInput,
    options: ExecuteFeatureOptionsAndroid?
): ExecutionResult = withContext(Dispatchers.Default) {
    // Implementation
}
```

### 5. Follow Coding Rules

**Always follow Android SDK's SKILL.md rules:**

- Kotlin 1.9+ coding conventions
- Async processing with Coroutines
- Error handling with sealed class
- Type definition with data class
- Null safety
- KDoc comments
- Consider GPU acceleration
- Multi-thread optimization

### 6. Reference Documents

Always reference when performing tasks:

- `skills/3-android-sdk/SKILL.md` - Android SDK skill guide
- `packages/gql/src/` - GraphQL schema
- `packages/android/` - Existing Kotlin code

### 7. Automatic Workflow

When user requests:

1. **Analyze**: Understand the request
2. **Explore**: Check GraphQL schema + existing code
3. **Execute**:
   - New feature found → Implement
   - Issue found → Fix
   - Type/API requested → Generate
4. **Validate**: Check coding rule compliance
5. **Report**: Summarize completed work

## After Completion

Automatically suggest:

- [ ] If tests needed: Recommend `/test` command
- [ ] If docs update needed: Recommend `/docs` command
- [ ] If same work needed for iOS: Recommend `/apple` command

## Key Principles

1. **GraphQL is Truth**: Always check and follow GraphQL schema first
2. **Auto-detect**: Find and perform necessary work even without user specifying details
3. **Quality First**: Correct implementation over fast implementation
4. **Naming Convention**: Platform suffix is always last (e.g., `OptionsAndroid`)
5. **Error Handling**: All public APIs must have proper error handling

## Example Execution Scenarios

### Scenario 1: Check and Add New Feature

```markdown
User: /android check for new features and add them

Agent:
1. Read GraphQL schema (type.graphql, type-android.graphql)
2. Check enum FeatureType → SUMMARIZE, CLASSIFY, EXTRACT, CHAT, TRANSLATE, REWRITE
3. Check packages/android/.../features/
4. Find unimplemented feature (e.g., Translate.kt missing)
5. Create and implement Translate.kt
6. Add TranslateResult to Types.kt
7. Report to user: "Added Translate feature."
```

### Scenario 2: Code Validation

```markdown
User: /android check existing code for issues

Agent:
1. Read all Kotlin files
2. Compare with GraphQL schema
3. Issues found:
   - ExecuteFeatureAndroidOptions → ExecuteFeatureOptionsAndroid (naming violation)
   - Some fields missing
4. Auto-fix
5. Report to user: "Fixed 2 naming violations, added 3 missing fields"
```

### Scenario 3: Specific Task

```markdown
User: /android implement VoiceRecognition feature

Agent:
1. Search for VoiceRecognition related types in GraphQL schema
2. If not found, notify user: "VoiceRecognition is not in GraphQL schema. Please define it first with /gql."
3. If found, generate Kotlin implementation
4. Report to user: "VoiceRecognition.kt creation complete"
```
