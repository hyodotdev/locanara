# Locanara Git and Release Safety

> Priority: mandatory. `AGENTS.md` is the higher-level authority.

## Working-Tree Safety

1. Inspect `git status --short --branch` and all relevant diffs first.
2. Preserve pre-existing user changes and unrelated untracked files.
3. Stage only explicit task paths; never use `git add -A` in an agent workflow.
4. Never rewrite history, discard changes, force-push, or amend user commits
   without explicit authorization.

## Branches and Commits

Use focused branches such as `feat/`, `fix/`, `docs/`, `test/`, `ci/`,
`refactor/`, or `chore/`. Never push directly to `main`.

Commit format:

```text
<type>: <description>
```

Use an English imperative subject under 72 characters. Supported types are
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, and `ci`. Never add
`Co-Authored-By` or other co-author attribution.

Before committing:

- Run the affected verification matrix.
- Inspect `git diff --cached --check` and the complete staged diff.
- Confirm no credentials, generated build artifacts, dependency caches, or
  unrelated files are staged.

## Pull Requests

PR titles follow the commit format. Bodies include:

- Summary
- Test plan with exact commands and results
- Skipped or real-device-only verification
- Screenshots/video when the user-visible surface changed

Creating a branch, commit, push, PR, review reply, or thread resolution is an
external write. Perform only the actions explicitly requested by the user.

## Version Authority

`locanara-versions.json` is the only version source of truth. Platform and
wrapper versions may differ. Never copy static example versions or infer one
package's version from another.

When version work is explicitly requested, first check every synchronized copy
and runtime constant. A mismatch must fail verification; do not silently pick a
winner. Generated version constants must come from the repository generator.
Run `cd scripts/agent && bun run check:versions` to fail on root/site map drift;
AI context generation only reports that drift and never chooses or rewrites a
version.

## Release and Deployment Boundary

AI agents must never:

- publish to Maven Central, CocoaPods, npm, pub.dev, GitHub Packages, or another
  registry;
- deploy the site or a preview;
- create or move release tags;
- create GitHub releases;
- trigger release or deployment workflows;
- delete or replace an existing release/tag;
- modify versions unless the user explicitly requested version preparation.

Maintainers own publication through CI. Agents may inspect release workflows,
prepare local changes when explicitly requested, and report the exact commands
a maintainer should run, but must stop before external publication.

## Hotfixes

Hotfixes use the normal branch, review, verification, and maintainer-release
flow. Urgency does not relax tests, privacy rules, generated-source checks, or
the no-direct-main/no-publish boundary.
