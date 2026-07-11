# Locanara Workflow Index

Slash-command workflows are defined in `.claude/commands/`, and Codex skills are
defined in `.codex/skills/`. `AGENTS.md` is the cross-tool policy source and is
shared through the `CLAUDE.md` and `GEMINI.md` symlinks.

## Core Workflows

| Command              | Scope                                             | Required outcome                                                        |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `/locanara`          | Project-wide routing                              | Select the correct source of truth and package workflow                 |
| `/gql`               | GraphQL schema and generated types                | Regenerate and verify tracked platform outputs                          |
| `/apple`             | Swift SDK and Apple example                       | Build/test affected Swift targets and the example app                   |
| `/android`           | Kotlin SDK and Android example                    | Test/build the SDK and assemble the example app                         |
| `/test`              | Cross-platform verification                       | Run changed-path checks and report skipped/blocked rows                 |
| `/docs`              | Site, README, and API docs                        | Validate examples against implementation; never deploy                  |
| `/audit-code`        | Architecture and quality audit                    | Prioritized, evidence-backed findings                                   |
| `/verify-all`        | Repository health check                           | Full or changed-path matrix with exact command results                  |
| `/resolve-issue`     | GitHub issue workflow                             | Verify every criterion before commenting or closing                     |
| `/review-pr`         | Pull request feedback                             | Inspect by default; fix/reply/resolve only when authorized and verified |
| `$review-self`       | Current implementation, diff, or PR stabilization | Fix verified gaps and confirm stability in five-minute review rounds    |
| `/knowledge-compile` | Upstream research                                 | Date-stamped notes with official sources and code impact                |
| `/commit`            | Commit and PR preparation                         | Intentional scope, verification, no publishing                          |

## Source-of-Truth Map

| Concern                      | Source of truth                                                    |
| ---------------------------- | ------------------------------------------------------------------ |
| Shared generated types       | `packages/gql/src/*.graphql`                                       |
| Apple behavior               | `packages/apple/Sources/`                                          |
| Android behavior             | `packages/android/locanara/src/main/`                              |
| Browser behavior             | `packages/web/src/`                                                |
| Nitro bridge signatures      | `libraries/react-native-ondevice-ai/src/specs/OndeviceAi.nitro.ts` |
| Package versions             | `locanara-versions.json`                                           |
| Agent policy                 | `AGENTS.md`                                                        |
| Maintained internal guidance | `knowledge/internal/`                                              |
| Optional upstream snapshots  | `knowledge/external/` (reference only; re-verify before use)       |

## Guardrails

- On-device inference only; no cloud inference or fallback.
- Preserve existing working-tree changes.
- Never hand-edit generated GraphQL or Nitro output.
- Never publish, deploy, tag a release, or trigger a release workflow.
- Do not close issues because they are old or because a commit message says
  `Closes`; verify the current default branch and every acceptance criterion.
- Use current manifests and implementation instead of copied version numbers or
  undated knowledge snippets.

For details, read the matching definition under `.claude/commands/` or
`.codex/skills/` and the relevant package guide under `.claude/guides/`.
