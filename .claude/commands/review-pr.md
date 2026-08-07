# /review-pr

Reviews PR comments and applies feedback.

Reading and classifying review feedback is always allowed. Editing code requires
the user's request to address the feedback. Committing, pushing, replying, and
resolving threads are separate external write actions and must be explicitly
requested; never infer them from a review-only request.

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
# Normalize a number or PR URL once for later REST/GraphQL calls
PR_NUMBER=$(gh pr view "$ARGUMENTS" --json number --jq '.number')

# Get PR details
gh pr view "$PR_NUMBER" --json number,title,body,state,headRefName,baseRefName

# Get review comments
gh pr view "$PR_NUMBER" --json reviews,comments

# Get reviewer requests, latest decisions, and check state for polling
gh pr view "$PR_NUMBER" \
  --json headRefOid,reviewDecision,reviewRequests,latestReviews,statusCheckRollup,updatedAt

# Get list of changed files
gh pr diff "$PR_NUMBER" --name-only

# Get diff content
gh pr diff "$PR_NUMBER"
```

### 2. Analyze Comments

Analyze review comments and classify them as:

- **Code Change Request**: Code that needs modification
- **Question**: Content that needs an answer
- **Suggestion**: Optional improvements
- **Approval**: No changes needed

### Automated Reviewer Fallback

Automated reviewers are useful evidence, not a completion dependency. If a
configured reviewer cannot review the current head, replace the missing coverage
with one complete `$review-self` round.

Treat a reviewer as unavailable only when it reports a terminal quota, billing,
size, authentication, permission, shutdown, or service failure, or when two
consecutive polling rounds produce neither review output nor an in-progress or
requested state. Do not classify a queued or running review as unavailable.

When fallback is required:

1. Record the reviewer, terminal reason, base, and current head SHA.
2. Run the current surface's `review-self` skill for exactly one complete round
   with the PR requirements and changed-path rules. Codex uses
   `.codex/skills/review-self/SKILL.md`; Claude Code uses
   `.claude/skills/review-self/SKILL.md`.
3. Do not let the fallback re-enter `review-pr`, request reviewers, reply to or
   resolve threads, or schedule its five-minute loop. This workflow owns those
   actions.
4. Fix and verify validated findings only when the user's request authorizes
   edits. Preserve the existing commit, push, reply, and resolution gates.
5. Cache clean fallback coverage by reviewer failure set and head SHA. Any head
   change invalidates the result.

Reviewer unavailability alone is neither a blocker nor a clean result. A PR is
clean only when required checks succeed, actionable feedback is resolved, and
unavailable reviewers have clean fallback coverage for the current head.

### Bounded Reviewer Polling

Poll only reviewers or checks that are already requested, configured, or
running. Requesting a reviewer, posting a trigger comment, or rerunning a check
is a separate GitHub write and still requires explicit authorization.

When reviewer or check state is pending:

1. Record the current head SHA, reviewer requests, latest reviews, check state,
   poll count, and fallback coverage.
2. Use the product's real wake-up mechanism to re-enter `/review-pr $PR_NUMBER`
   after five minutes. Keep at most one outstanding wake-up for the same PR and
   head.
3. On re-entry, fetch `reviewRequests`, `latestReviews`, `reviewDecision`, and
   `statusCheckRollup` again before deciding whether the state changed.
4. If a reviewer disappears from requested or running state without producing
   review output for two consecutive polls, classify it as unavailable and use
   the fallback above.
5. If state remains explicitly queued, requested, or running, keep it pending;
   do not misclassify it as unavailable. Stop after 12 unchanged polls (about
   one hour) and report the exact pending state instead of claiming success.
6. Cancel the outstanding wake-up when the PR becomes clean, closes, merges,
   changes head incompatibly, or reaches a stopping condition.

If no wake-up mechanism is available, perform the current inspection and report
pending state. Never emulate polling with `sleep`, a shell loop, `nohup`, or an
abandoned background process.

### 3. Changed-Path Verification

Use `/verify-all` in changed-path mode rather than maintaining a partial command
list here. For GraphQL changes, run `bun run generate`, review the tracked Swift
and Kotlin output diff, and use `git diff --exit-code` only on a clean CI/drift
baseline.

### 4. Check Project Conventions

Check the following project-specific rules during review:

- **GraphQL platform APIs/types**: use the repository's terminal `IOS` or
  `Android` suffix rules; verify generated/public language names before renaming
- **Generated files**: Do not directly modify `packages/apple/Sources/Types.swift`, `packages/android/locanara/src/main/kotlin/com/locanara/Types.kt`

See [CLAUDE.md](../../CLAUDE.md) for detailed conventions.

### 5. Perform Code Modifications

For each comment:

1. Understand the request
2. Read related code
3. Perform modification
4. Sync related files (Example app, docs, etc.)

### 6. Verify and Prepare

1. Run build/test for changed packages
2. Confirm all verification passes
3. Report the proposed commit scope
4. Commit only when explicitly requested, following `/commit`

### 7. Reply to PR Comments and Resolve Threads

After completing modifications, reply and resolve only when the user explicitly
requested GitHub updates and the fix is pushed. A local edit is not sufficient.

#### 7.1 Get Inline Review Comments

```bash
# Get inline review comments with their IDs
gh api "repos/hyodotdev/locanara/pulls/$PR_NUMBER/comments" \
  --paginate \
  --jq '.[] | {id: .id, path: .path, line: .line, body: .body[:100]}'
```

#### 7.2 Reply to Comments

Use the GitHub API to reply to each fixed comment:

```bash
# Reply to a specific comment
gh api "repos/hyodotdev/locanara/pulls/$PR_NUMBER/comments/$COMMENT_ID/replies" \
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
gh api graphql \
  --paginate \
  -F number="$PR_NUMBER" \
  -f query='
query($number: Int!, $endCursor: String) {
  repository(owner: "hyodotdev", name: "locanara") {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $endCursor) {
        nodes {
          id
          isResolved
          path
          comments(first: 1) {
            nodes { databaseId }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}'

# Resolve a specific thread
gh api graphql \
  -F threadId="$THREAD_ID" \
  -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { id isResolved }
  }
}'
```

**Thread Resolution Rules:**

- Only resolve threads where code changes have been made and pushed
- Do not resolve threads that are just suggestions for future improvement
- Do not resolve threads awaiting user clarification

## Workflow

When user runs `/review-pr 123`:

1. **Gather**: Get all review comments for PR #123
2. **Analyze**: Understand and classify comment content
3. **Execute**:
   - Code change request → Modify only when the user requested feedback fixes
   - Question → Ask user for clarification
4. **Verify**: Build/test changed packages
5. **Report**: Summarize modifications and verification
6. **Commit/Push**: Only if explicitly requested
7. **Reply/Resolve**: Only if explicitly requested and the pushed fix or concrete evidence is available

## Notes

1. **Do not modify generated files**
   - Do not directly modify Types files generated from GraphQL
   - Change schema with `/gql` command then regenerate

2. **Build verification required before commit**
   - Run build command for changed packages
   - If build fails, fix and retry

3. **Preserve scope**
   - Never stage unrelated user changes
   - Never push directly to `main`

4. **Follow conventions**
   - Check naming rules
   - Follow commit message format

## Reference Documents

Reference when working:

- `CLAUDE.md` - Project conventions
- `.claude/guides/` - Package-specific guides
