# /review-pr

Reviews PR comments and applies feedback.

## Usage

```text
/review-pr <PR_NUMBER_OR_URL>
```

## Examples

```text
/review-pr 65
/review-pr https://github.com/hyodotdev/locanara/pull/65
```

## Arguments

- `$ARGUMENTS` - PR number (e.g., `65`) or PR URL

## Instructions

When this command is executed, perform the following:

### 1. Gather PR Information

```bash
# Get PR details
gh pr view $ARGUMENTS --json number,title,body,state,headRefName,baseRefName

# Get review comments
gh pr view $ARGUMENTS --json reviews,comments

# Get list of changed files
gh pr diff $ARGUMENTS --name-only

# Get diff content
gh pr diff $ARGUMENTS
```

### 2. Analyze Comments

Analyze review comments and classify them as:

- **Code Change Request**: Code that needs modification
- **Question**: Content that needs an answer
- **Suggestion**: Optional improvements
- **Approval**: No changes needed

### 3. Package-specific Build Commands

Run the following validation before commit based on changed files:

| Package             | Command                                                 |
| ------------------- | ------------------------------------------------------- |
| `packages/gql/`     | `cd packages/gql && bun run lint && bun run typecheck`  |
| `packages/docs/`    | `cd packages/docs && bun run lint && bun run typecheck` |
| `packages/apple/`   | `cd packages/apple && swift build`                      |
| `packages/android/` | `cd packages/android && ./gradlew build`                |

### 4. Check Project Conventions

Check the following project-specific rules during review:

- **iOS functions**: `IOS` suffix required (e.g., `executeFeatureIOS`, `DeviceInfoIOS`)
- **Android functions**: `Android` suffix for platform-specific APIs (e.g., `executeFeatureAndroid`, `DeviceInfoAndroid`)
- **Generated files**: Do not directly modify `packages/apple/Sources/Models/Types.swift`, `packages/android/locanara/src/main/Types.kt`

See [CLAUDE.md](../../CLAUDE.md) for detailed conventions.

### 5. Perform Code Modifications

For each comment:

1. Understand the request
2. Read related code
3. Perform modification
4. Sync related files (Example app, docs, etc.)

### 6. Verify and Commit

1. Run build/test for changed packages
2. Confirm all verification passes
3. Commit in meaningful units
4. Follow commit message format

### 7. Reply to PR Comments and Resolve Threads

After completing modifications, automatically reply to each comment and resolve threads.

#### 7.1 Get Inline Review Comments

```bash
# Get inline review comments with their IDs
gh api repos/hyodotdev/locanara/pulls/$PR_NUMBER/comments \
  --jq '.[] | {id: .id, path: .path, line: .line, body: .body[:100]}'
```

#### 7.2 Reply to Comments

Use the GitHub API to reply to each fixed comment:

```bash
# Reply to a specific comment
gh api repos/hyodotdev/locanara/pulls/$PR_NUMBER/comments/$COMMENT_ID/replies \
  -X POST -f body="Fixed in $COMMIT_HASH. $DESCRIPTION"
```

**Reply Format Rules:**

- **Commit hash reference**: Write in plain text without code blocks
  - Correct: `Fixed in f3b5fec.`
  - Wrong: `` Fixed in `f3b5fec`. ``
  - GitHub automatically creates commit links

**Reply Examples:**

```text
Fixed in abc1234. Updated the function name to follow iOS naming convention.
```

```text
Good catch! Fixed in def5678. Added null check as suggested.
```

```text
Could you clarify what you mean here? Should I add retry logic or improve the error message?
```

#### 7.3 Resolve Threads

After replying, resolve the thread using GraphQL:

```bash
# Get unresolved thread IDs
gh api graphql -f query='
query {
  repository(owner: "locanara", name: "locanara") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          path
          comments(first: 1) {
            nodes { databaseId }
          }
        }
      }
    }
  }
}'

# Resolve a specific thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "$THREAD_ID"}) {
    thread { id isResolved }
  }
}'
```

**Thread Resolution Rules:**

- Only resolve threads where code changes have been made and pushed
- Do not resolve threads that are just suggestions for future improvement
- Do not resolve threads awaiting user clarification

## Auto Workflow

When user runs `/review-pr 123`:

1. **Gather**: Get all review comments for PR #123
2. **Analyze**: Understand and classify comment content
3. **Execute**:
   - Code change request → Perform modification
   - Question → Ask user for clarification
4. **Verify**: Build/test changed packages
5. **Commit**: Commit modifications
6. **Push**: Push commits to remote
7. **Reply**: Reply to each fixed comment via GitHub API
8. **Resolve**: Resolve threads for fixed issues via GraphQL
9. **Report**: Summarize completed work

## Notes

1. **Do not modify generated files**
   - Do not directly modify Types files generated from GraphQL
   - Change schema with `/gql` command then regenerate

2. **Build verification required before commit**
   - Run build command for changed packages
   - If build fails, fix and retry

3. **Follow conventions**
   - Check naming rules
   - Follow commit message format

## Reference Documents

Reference when working:

- `skills/7-review-pr/SKILL.md` - Review PR skill guide
- `CLAUDE.md` - Project conventions
- Each package's SKILL.md - Package-specific guides
