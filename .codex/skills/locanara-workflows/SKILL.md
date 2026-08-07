---
name: locanara-workflows
description: Route Locanara repository work through its source-of-truth and slash-command workflows, including GraphQL generation, Apple and Android SDK changes, Web and wrapper parity, documentation, audits, verification, knowledge compilation, GitHub issues and PRs, rebasing, and commit preparation. Use for natural-language Locanara implementation, review, troubleshooting, or repository-health requests.
---

# Locanara Workflows

Use the repository's existing command definitions instead of duplicating their
package-specific details.

## Start With Authority And State

1. Read `AGENTS.md` and `git status --short --branch`.
2. Inspect existing diffs and preserve user-owned changes.
3. Distinguish read-only review or diagnosis from authorized implementation and
   from separately authorized GitHub writes.
4. Read the nearest guide under `.claude/guides/` and the applicable
   `knowledge/internal/` files before editing a package or library.

## Route The Request

Read the matching file under `.claude/commands/` completely:

- Project-wide source routing: `locanara.md`
- Shared GraphQL contracts and generated types: `gql.md`
- Apple SDK or example: `apple.md`
- Android SDK or example: `android.md`
- Changed-path or cross-platform verification: `test.md`
- Documentation and examples: `docs.md`; use `$locanara-docs` for the reusable
  documentation-authoring procedure
- Broad project audit: `audit-code.md`
- Full or risky repository health check: `verify-all.md`
- Official upstream research and compiled context: `knowledge-compile.md`
- GitHub issue resolution: `resolve-issue.md`
- PR feedback and monitoring: use `$review-pr` with `review-pr.md`; if automated
  review is unavailable, run the single-round `$review-self` fallback defined
  by that workflow
- Commit, push, or PR preparation: `commit.md`
- Main update and branch rebase: use `$rebase-main`

For a concrete task, load only the smallest matching workflow. Do not run every
command by default.

## Preserve Source-Of-Truth Order

- Shared generated types: `packages/gql/src/*.graphql`
- Apple behavior: `packages/apple/Sources/`
- Android behavior: `packages/android/locanara/src/main/`
- Web behavior: `packages/web/src/`
- React Native bridge signatures: the Nitro spec before generated/native code
- Wrapper behavior: platform SDK, wrapper spec or public facade, then adapters
- Versions: root `locanara-versions.json`; a mirror mismatch is a defect
- Agent policy: `AGENTS.md`

Never hand-edit generated GraphQL or Nitro output. Regenerate from the owning
schema or spec and review the complete tracked diff.

## Apply Locanara Guardrails

- Keep inference on device. Do not add a cloud client, server fallback, prompt
  telemetry, or fabricated success for an unsupported capability.
- Keep Apple, Android, Web, Expo, React Native, and Flutter public wrapper
  surfaces aligned; represent platform gaps explicitly.
- Treat prompts, user input, model output, images, RAG content, and extracted
  entities as sensitive log data.
- Do not modify versions unless explicitly requested.
- Never publish, deploy, release, tag, or trigger a release/deploy workflow.
- Do not push directly to `main`.

## Verify And Report

Use changed-path verification by default and the full matrix for cross-platform
contracts, generators, or an explicitly requested health check. Run
`git diff --check`, reread the final diff, and report exact pass, fail, skipped,
and real-device-only results.

Internal workflow-only changes stay local unless the user explicitly asks for a
commit, push, or PR. These include `.claude/`, `.codex/skills/`,
`.codex/scripts/`, `AGENTS.md`, `SKILLS_INDEX.md`, and agent-context tooling.

For PR review threads, resolve only feedback that is fixed in a pushed commit or
is demonstrably outdated. Do not call a PR clean merely because an automated
reviewer failed; use the head-specific fallback in `review-pr.md`.
