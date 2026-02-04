# /gql

Performs all tasks related to GraphQL schema.

## Usage

```text
/gql <request in natural language>
```

## Examples

```text
/gql validate schema
/gql check for naming convention violations
/gql add VoiceRecognition type
/gql check if iOS and Android schemas match
/gql check for new APIs to add
/gql sync platform schemas
```

## Instructions

When this command is executed, automatically perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Schema Validation**: Check naming conventions, consistency
- **Add Type**: Create new GraphQL type
- **Add API**: Add Query/Mutation/Subscription
- **Schema Sync**: Check platform schema alignment
- **Implementation Check**: Find types/APIs not implemented in SDK

### 2. Check GraphQL Schema

Always check all schema files:

```text
packages/gql/src/
├── schema.graphql         # Root
├── type.graphql          # Shared types
├── type-ios.graphql      # iOS specific
├── type-android.graphql  # Android specific
├── api.graphql           # Shared API
├── api-ios.graphql       # iOS API
└── api-android.graphql   # Android API
```

### 3. Automatic Validation Items

#### 3.1 Naming Convention Validation

**Important Principle: Platform suffix is always last!**

```graphql
# Correct examples
type FoundationModelInfoIOS
type DeviceInfoIOS
input ExecuteFeatureOptionsIOS        # Platform suffix last!

type GeminiNanoInfoAndroid
type DeviceInfoAndroid
input ExecuteFeatureOptionsAndroid    # Platform suffix last!

# Incorrect examples
type FoundationModelInfo              # Missing IOS suffix
type DeviceInfoIos                    # Lowercase
input ExecuteFeatureIOSOptions        # Platform suffix in middle!
input ExecuteFeatureAndroidOptions    # Platform suffix in middle!
```

Auto-validate and fix when found:

- iOS types: Check `*IOS` (all uppercase)
- Android types: Check `*Android` (PascalCase)
- Platform suffix position check (always last)

#### 3.2 Type Consistency Validation

- [ ] All fields have description comments
- [ ] Required/optional fields are clear (`!` usage)
- [ ] Type references are valid (only reference existing types)
- [ ] Enum values are SCREAMING_SNAKE_CASE
- [ ] Platform-specific types are in correct files

#### 3.3 API Operation Validation

- [ ] Query/Mutation/Subscription are in correct files
- [ ] Platform-specific operations have suffix
- [ ] Parameter types are correct
- [ ] Return types are correct
- [ ] Description comments exist

#### 3.4 Cross-Platform Consistency

Check if shared types are properly used across platforms:

```graphql
# type.graphql (shared)
type ModelInfo {
  name: String!
  version: String
  foundationModelIOS: FoundationModelInfoIOS      # iOS field
  geminiNanoAndroid: GeminiNanoInfoAndroid        # Android field
}
```

### 4. Auto-Fix Tasks

Auto-fix discovered issues:

#### 4.1 Naming Convention Violations

```markdown
Found: input ExecuteFeatureIOSOptions
Fixed: input ExecuteFeatureOptionsIOS

Found: input ExecuteFeatureAndroidOptions
Fixed: input ExecuteFeatureOptionsAndroid

Found: type DeviceInfoIos
Fixed: type DeviceInfoIOS
```

#### 4.2 Missing Comments

```graphql
# Field without comment found
type DeviceCapability {
  platform: Platform!
}

# Auto-add
type DeviceCapability {
  """
  Target platform (iOS or Android)
  """
  platform: Platform!
}
```

#### 4.3 Type Reference Errors

```markdown
Found: field: NonExistentType
→ Type is not defined
→ Warn user or suggest type creation
```

### 5. Implementation Check

Find types/APIs not implemented in SDK:

```markdown
1. Extract all types from GraphQL schema
2. Check iOS implementation (packages/apple/Sources/Types.swift)
3. Check Android implementation (packages/android/.../Types.kt)
4. Find unimplemented types
5. Report to user: "VoiceRecognitionResult type is not implemented in iOS/Android."
```

### 6. Add Type/API

When user requests:

#### 6.1 Add Type

```markdown
User: /gql add VoiceRecognition type

Agent:
1. Check platform (shared/iOS/Android?)
2. Select appropriate file
3. Generate type definition
4. Generate related Input types (if needed)
5. Add comments
6. Suggest SDK implementation request
```

#### 6.2 Add API

```markdown
User: /gql add recognizeVoice API

Agent:
1. Check operation type (Query/Mutation/Subscription?)
2. Check platform (shared/iOS/Android?)
3. Select appropriate file
4. Generate API operation definition
5. Define parameters/return types
6. Add comments
7. Suggest SDK implementation request
```

### 7. Schema Sync

Check and sync cross-platform consistency:

```markdown
1. Check shared types (type.graphql)
2. Check iOS types (type-ios.graphql)
3. Check Android types (type-android.graphql)
4. Cross-reference validation
5. Suggest fixes when inconsistencies found
```

### 8. Automatic Workflow

When user requests:

1. **Analyze**: Understand the request
2. **Scan**: Read all GraphQL schema files
3. **Validate**:
   - Naming conventions
   - Type consistency
   - API operation accuracy
   - Cross-platform sync
4. **Fix**: Auto-fix discovered issues
5. **Report**: Summarize completed work

## After Completion

Automatically suggest:

- [ ] When new type added: Request implementation with `/apple`, `/android`
- [ ] When new API added: Request implementation with `/apple`, `/android`
- [ ] When schema changed: Update docs with `/docs`
- [ ] When breaking change: Update CHANGELOG with `/docs`

## Key Principles

1. **Single Source of Truth**: GraphQL schema is the standard for all platforms
2. **Strict Naming**: Platform suffix is always last (OptionsIOS, OptionsAndroid)
3. **Auto-detect**: Find all issues even without user specifying details
4. **Immediate Fix**: Fix discovered issues right away
5. **Consistency First**: All platforms provide the same API

## Example Execution Scenarios

### Scenario 1: Schema Validation

```markdown
User: /gql validate schema

Agent:
1. Read all .graphql files
2. Naming convention validation:
   - Found: ExecuteFeatureIOSOptions (violation)
   - Fixed: ExecuteFeatureOptionsIOS
   - Found: ExecuteFeatureAndroidOptions (violation)
   - Fixed: ExecuteFeatureOptionsAndroid
3. Type consistency validation:
   - DeviceCapability.platform comment missing → Added
4. API operation validation:
   - All OK
5. Report to user:
   "Fixed 2 naming violations
    Added 1 missing comment
    Validation complete: 25 types, 23 APIs"
```

### Scenario 2: Implementation Check

```markdown
User: /gql check for new APIs to add

Agent:
1. Check GraphQL schema
   - FeatureType enum: SUMMARIZE, CLASSIFY, EXTRACT, CHAT, TRANSLATE, REWRITE

2. Check iOS implementation
   - Features/Summarize.swift ✓
   - Features/Classify.swift ✓
   - Features/Extract.swift ✗
   - Features/Chat.swift ✗
   - Features/Translate.swift ✗
   - Features/Rewrite.swift ✗

3. Check Android implementation
   - features/Summarize.kt ✓
   - features/Classify.kt ✓
   - features/Extract.kt ✗
   - features/Chat.kt ✗
   - features/Translate.kt ✗
   - features/Rewrite.kt ✗

4. Report to user:
   "Features defined in GraphQL but not implemented:
    - Extract
    - Chat
    - Translate
    - Rewrite

    Suggestion: Implement with /apple and /android."
```

### Scenario 3: Add Type

```markdown
User: /gql add VoiceRecognitionResult type

Agent:
1. Check platform (ask user or add as shared)
2. Add to type.graphql:

type VoiceRecognitionResult {
  """
  Recognized text from voice input
  """
  text: String!

  """
  Confidence score (0.0 - 1.0)
  """
  confidence: Float!

  """
  Detected language code
  """
  language: String!
}

3. Add related Input type (if needed)
4. Report to user:
   "VoiceRecognitionResult type added
    Suggestion: Implement Swift/Kotlin types with /apple and /android."
```

### Scenario 4: Sync

```markdown
User: /gql check if iOS and Android schemas match

Agent:
1. Check shared API (api.graphql)
2. Check iOS API (api-ios.graphql)
3. Check Android API (api-android.graphql)
4. Alignment status:
   - Shared API: 10 ✓
   - iOS specific: 5 ✓
   - Android specific: 5 ✓
5. Report to user:
   "Schema sync status: OK
    Shared API 10, iOS specific 5, Android specific 5"
```

## Reference Documents

- `skills/1-graphql-architect/SKILL.md` - GraphQL Architect skill guide
- `packages/gql/src/` - GraphQL schema
- `.claude/guides/02-api-naming.md` - API naming guide
