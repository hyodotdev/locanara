# /commit

Prepare an intentional commit and, only when explicitly requested, push it or
open a pull request.

## Usage

```text
/commit                 # verify and create a local commit
/commit --push          # local commit, then push the current non-main branch
/commit --pr            # branch, commit, push, and open a PR
```

Do not infer `--push` or `--pr` from an ordinary implementation request.

## Workflow

1. Read `AGENTS.md`, `git status --short --branch`, and all relevant diffs.
2. Separate task files from pre-existing or unrelated user changes.
3. Run the verification required for the files being committed.
4. Stage only explicit paths with `git add -- <paths>`; never use `git add -A`.
5. Inspect `git diff --cached --check` and `git diff --cached`.
6. Create a local commit using `<type>: <description>` with an English subject
   under 72 characters and no co-author attribution.
7. Stop after the commit unless push or PR creation was explicitly requested.

## Push and PR Rules

- Never push directly to `main`.
- Create a focused `feat/`, `fix/`, `docs/`, `test/`, `ci/`, `refactor/`, or
  `chore/` branch for a PR.
- Before pushing, confirm the branch, commit list, remote, and verification
  result.
- A PR body must include Summary, Test plan, and any skipped/device-only rows.
- Internal AI-workflow-only changes stay local unless the user explicitly asks
  to push them or open a pull request.

## Forbidden

- Staging unrelated files or secrets.
- Amending, rebasing, force-pushing, or rewriting user commits without explicit
  authorization.
- Publishing packages, deploying the site, tagging releases, creating GitHub
  releases, or triggering release workflows.
