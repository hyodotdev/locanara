---
name: review-pr
description: Inspect and finish Locanara pull requests by classifying review threads and CI failures, fixing validated findings, verifying changed paths, committing and pushing authorized fixes, replying and resolving fixed threads, and rechecking the exact head every five minutes until clean or genuinely blocked. Use for PR review, reviewer feedback, CI failures, review monitoring, or requests to keep reviewing until no actionable feedback remains.
---

# Review PR

Finish the current Locanara pull request without weakening repository safety or
claiming that unavailable automation is clean.

## Preserve Authority

- Treat invocation as authorization to inspect PR metadata, diffs, checks,
  reviews, comments, and threads.
- Fix code only when the user requested feedback resolution or implementation.
- Commit, push, post replies, resolve threads, request reviewers, rerun checks,
  or add trigger comments only when the original request authorized the
  corresponding GitHub writes. PR creation plus a request to finish reviews
  authorizes commits, pushes, replies, and resolution for validated in-scope
  findings on that PR; it does not authorize merging, releasing, or deployment.
- Never publish, deploy, tag, create a release, trigger a release workflow, or
  push directly to `main`.
- Preserve unrelated user changes and stage only explicit paths.

## Establish The Exact Target

1. Read `AGENTS.md`, `git status --short --branch`, the full base-to-head diff,
   and the nearest guides for every changed surface.
2. Read `.claude/commands/review-pr.md` completely for repository-specific API
   queries, thread handling, reviewer fallback, and polling details.
3. Normalize a supplied number or URL with `gh pr view`; otherwise resolve the
   PR for the current branch. Record the PR number, base, head branch, head SHA,
   state, review decision, requested reviewers, latest reviews, and check rollup.
4. Stop if the PR is closed or merged, the local branch cannot be matched to the
   PR head safely, or GitHub authentication is unavailable after three rounds.

## Run One Review Round

1. Re-fetch the current head SHA before relying on cached results.
2. Gather the complete PR diff, issue comments, reviews, inline comments,
   unresolved review threads including `isOutdated`, and all status checks.
3. Classify each item as an actionable correctness or operational finding,
   question, optional suggestion, approval, bot command noise, terminal reviewer
   failure, or pending state.
4. Validate findings against current code, tests, requirements, and Locanara's
   source-of-truth order. Reject stale, duplicate, incorrect, purely cosmetic,
   or unrelated suggestions with concrete repository evidence.
5. Resolve outdated threads only when GitHub marks them outdated and the finding
   no longer applies. Never equate an author reply with reviewer confirmation.
6. Fix every validated in-scope finding in one coherent batch. Do not defer a
   real PR correctness gap merely because it expands the original estimate.
   Stop for a material product decision or new authority that the user has not
   supplied.
7. Run changed-path verification through `.claude/commands/verify-all.md`, plus
   `git diff --check`. Use generators for generated files and inspect their
   complete output diffs.
8. If commit and push are authorized, follow `.claude/commands/commit.md`, stage
   explicit files, push the non-main branch, reply to each fixed inline comment
   with the plain commit hash, and resolve only the threads whose fix is pushed
   or whose outdated status is proven.

## Cover Unavailable Reviewers

- Treat explicit quota, billing, size, authentication, permission, shutdown, or
  service failure as terminal for that reviewer and head.
- Treat a reviewer that disappears without output or a pending/requested state
  as unavailable only after two consecutive polls.
- Keep queued, requested, or running reviewers pending.
- For unavailable reviewers, invoke `$review-self` for exactly one complete
  fallback round against the PR's actual base and head. Pass the requirements,
  changed-path rules, and existing write authority.
- Do not let fallback re-enter `$review-pr`, request reviewers, handle threads,
  or schedule a loop. Cache clean fallback coverage only for the exact reviewer
  failure set and head SHA; any head change invalidates it.

## Recheck Every Five Minutes

1. Run the first review round immediately.
2. When feedback or checks remain pending, or only one clean snapshot exists,
   use the product's real wake-up or recurring-monitor mechanism to re-enter
   `$review-pr` after 300 seconds. Keep at most one wake-up per PR and head.
3. Carry a compact state capsule: PR/base/head, head SHA, poll count, clean
   count, check and review states, unresolved thread IDs, fallback coverage,
   finding fingerprints and fix attempts, and existing write authority.
4. On re-entry, fetch remote state again before deciding that it is unchanged.
   Do not rerun expensive local verification for an unchanged fingerprint.
5. Reset the clean count after any head, feedback, check, or fallback change.
   Finish after two complete clean snapshots separated by five minutes.
6. A clean snapshot requires a current open PR, terminal successful required
   checks, no actionable unresolved feedback, no pending required reviewer, and
   clean head-specific fallback coverage for every unavailable reviewer.
7. Stop after 12 unchanged pending polls, after the same finding survives two
   fix attempts, or after the same environment/tool failure blocks three rounds.
   Report the exact pending or disputed state; never call it clean.

If no real wake-up mechanism exists, complete the current round and report that
automatic re-entry could not be scheduled. Never emulate monitoring with shell
`sleep`, a background loop, `nohup`, or a tracked state file.

## Report Each Round

Report material findings, fixes, verification failures, commits, pushes, thread
updates, and external-state transitions promptly. On completion, include the PR
URL, final head SHA, commits pushed, checks run, two clean snapshot timestamps,
fallback coverage, and any device-only or unavailable validation.
