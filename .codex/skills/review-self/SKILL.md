---
name: review-self
description: Independently review and improve Codex's current Locanara implementation, working-tree changes, or pull request; fix actionable in-scope gaps; rerun relevant verification; and recheck at five-minute intervals until the work is stable or genuinely blocked. Use when the user says "review-self", asks Codex to review its own changes, requests a self-review loop, or wants current work monitored for new issues after implementation.
---

# Review Self

Review the current work immediately, fix validated gaps, and use five-minute
confirmation rounds until the result is stable.

## Preserve Authority And Scope

- Treat invocation as authorization to inspect the current work, make local
  in-scope fixes, and run relevant verification.
- Preserve the authority of the original request. Do not commit, push, create or
  edit a PR, post comments, merge, publish, deploy, release, or change live
  external state unless the user already authorized that action. Locanara's
  repository-wide publishing and deployment prohibitions still apply.
- Keep fixes tied to the original goal. Do not turn self-review into a broad
  audit, speculative refactor, dependency upgrade, or unrelated cleanup.
- Preserve pre-existing user changes. Record the initial working-tree state and
  never sweep-stage or discard files that are outside the current fix batch.
- Stop and ask for direction when a valid fix requires a material product choice,
  new authority, an irreversible action, or a meaningful expansion of scope.

## Establish The Review Target

1. Reconstruct the requested outcome and its acceptance criteria from the active
   conversation and repository evidence.
2. Use an explicitly supplied PR, branch, commit range, or path as the target.
   Otherwise, review the current branch plus its staged, unstaged, and untracked
   changes.
3. For a PR, derive the actual base and head from PR metadata. Without a PR, use
   the configured upstream and merge base; do not assume a base branch when it is
   ambiguous.
4. Read `AGENTS.md`, the nearest package guides, and every knowledge or convention
   file that applies to the changed paths before editing them.
5. Stop immediately with a concise report only when there is no reviewable diff,
   no explicitly named implementation, issue, or project-health scope, and no
   asynchronous PR state to monitor.

## Run One Review Round

1. Resnapshot the target from disk. Include the full base-to-head diff, staged
   and unstaged overlays, and an inventory of relevant untracked files. Respect
   ignore rules; screen untracked paths for secrets, binary data, and excessive
   size before reading; and prefer metadata or hashes when contents are not
   necessary. Read only relevant text sources. Do not review only the latest
   commit or trust a snapshot from a previous round.
2. Read surrounding implementation, tests, documentation, issue or PR
   requirements, and current CI or review feedback needed to understand the
   change.
3. Review for evidence-backed, actionable gaps:
   - requirement completeness and end-to-end wiring;
   - correctness, error paths, edge cases, state transitions, concurrency,
     idempotency, data safety, privacy, and security;
   - public contracts, naming, compatibility, generated-file rules, and Apple,
     Android, Web, or wrapper parity;
   - missing or weak tests, documentation, examples, regeneration, and
     operational safeguards required by the change.
4. Use independent read-only subagents for separate review lenses when the diff
   is large or cross-cutting. Give them the raw target and request, not suspected
   findings or an expected answer.
5. Validate every finding against the current code and applicable instructions.
   Reject pure taste, cosmetic churn, duplicate findings, and unrelated
   nice-to-have work.
6. Fix all validated in-scope findings in one coherent batch. Regenerate generated
   files only through their documented generator and preserve unrelated edits.
7. Re-read the resulting diff, then run the changed-path lint, typecheck, tests,
   builds, generator checks, audits, and `git diff --check` required by the
   repository. Do not rerun an expensive unchanged check fingerprint unless new
   state can affect it.
8. If the target has a PR, inspect new failed checks and unresolved feedback as
   additional evidence. Reuse `.claude/commands/review-pr.md` for one
   thread-handling pass only when the corresponding code and GitHub writes are
   authorized. Keep `review-self` as the only polling-loop owner and never
   retrigger review bots on a no-op poll.
9. Commit or push only when already authorized. Stage only files owned by the
   current round, follow `.claude/commands/commit.md`, and prepare one verified
   fix batch rather than one commit per finding.

## Use Related Locanara Workflows

Load only the command needed by the current finding; do not run every workflow by
default. The repository-local command catalog is in `.claude/commands/`:

- Use `locanara.md` as the source-of-truth router and `skills-index.md` only to
  present or confirm the command catalog.
- Use `gql.md` for shared schemas and generated types; use `apple.md` or
  `android.md` for their platform SDKs. Route Web and Expo, React Native, or
  Flutter wrapper work through `locanara.md` and the affected checks in `test.md`.
- Use `docs.md` for the site, documentation, and examples; use
  `knowledge-compile.md` for official upstream technology research and compiled
  knowledge updates.
- Use `test.md` for affected test selection, `verify-all.md` for a requested full
  health check or risky cross-platform change, and `audit-code.md` only for a
  requested broad rules or API audit.
- Use `resolve-issue.md` for a GitHub issue target and `review-pr.md` for one pass
  of PR feedback. Preserve their edit and external-write authorization gates.
- Use `commit.md` only for an authorized local commit, push, or PR. It does not
  permit direct pushes to `main`, publishing, deployment, tagging, or release
  actions.

## Recheck Every Five Minutes

- Run the first round immediately; never wait before the initial review.
- If the user explicitly requests one pass, finish after that round and do not
  schedule a confirmation.
- Use the product's real recurring-monitor or wake-up mechanism to schedule the
  next round for 300 seconds after the current round. Make the scheduled prompt
  explicitly invoke `$review-self`; re-enter this skill rather than trying to
  perform semantic review inside a shell loop.
- Prefer a heartbeat attached to the current thread for this sub-hour review
  cycle so every wake-up retains the active conversation and authority. Do not
  replace it with a standalone cron job unless the user explicitly requests one.
- Keep at most one outstanding wake-up for the same target. Cancel or supersede
  stale duplicate wake-ups when the mechanism supports it.
- Carry a compact state capsule in the scheduled prompt or monitor state. Include
  the original goal and acceptance criteria, target and base, head or tree and
  working-tree fingerprints, seen feedback and check IDs, poll count, clean
  count, start time, finding fingerprints with fix attempts, and the existing
  commit, push, and external-write authority.
- Keep loop state out of tracked repository files. Revalidate it against disk and
  remote state on every wake-up.
- Increment the clean count only after a complete round has no actionable
  findings, all requested verification passes, required checks are terminal and
  successful or explicitly allowed to skip, no actionable feedback remains, and
  the final diff has been reread. Reset it when any material state or finding
  changes, then allow the fully clean post-change result to start a new count.
- Finish successfully after two consecutive clean snapshots separated by a
  five-minute interval. Continue without a fixed round cap while new findings or
  state changes lead to meaningful progress.
- Treat pending CI or review automation as neither clean nor failed. Poll it every
  five minutes without repeating expensive local checks on an unchanged
  fingerprint.
- If no recurring mechanism is available, complete the current round and report
  that automatic re-entry could not be scheduled. Do not emulate it with
  `sleep 300`, `while true`, `nohup`, or an abandoned background process, and
  never claim a future pass was scheduled unless the mechanism actually accepted
  it.

## Stop Safely

Stop the loop and report the exact state when any of these conditions holds:

- two clean confirmation snapshots establish stability;
- the user stops, replaces, or materially redirects the task;
- the target PR is merged or closed, the target branch disappears, or the target
  changes incompatibly with the active worktree;
- a finding needs authority or a decision that is not already available;
- the same root finding remains after two fix attempts;
- the same authentication, rate-limit, tool, or environment failure blocks three
  consecutive rounds;
- only unchanged pending external state remains after 12 polls (about one hour).

Do not call a blocked or interrupted result clean. Do not stop merely because one
poll is a no-op while asynchronous state is still pending.

On every terminal condition, cancel, disable, or delete the outstanding heartbeat
and verify that the recurring mechanism accepted the change. If cleanup fails,
report the still-active monitor and its identifier instead of implying that the
loop stopped.

## Communicate Each Round

- At startup, state the target, base, review scope, and whether commit, push, or
  external writes are authorized.
- Report material findings, fixes, validation failures, pushes, and
  external-state transitions promptly. Keep no-op updates brief.
- On success or stop, provide a self-contained summary of findings fixed, files
  changed, checks run, commits or pushes made, clean-count evidence, and any
  unresolved blocker.
