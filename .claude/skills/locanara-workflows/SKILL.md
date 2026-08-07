---
name: locanara-workflows
description: Route natural-language Locanara repository work through the project's slash-command workflows, source-of-truth rules, package guides, verification matrix, and GitHub safeguards.
---

# Locanara Workflows (Claude Code)

Read and follow `.codex/skills/locanara-workflows/SKILL.md` completely. The
canonical workflow is agent-neutral; this file only adapts discovery for Claude
Code.

Use the matching `.claude/commands/*.md` slash command directly when available.
Where the canonical workflow mentions `$review-pr`, `$review-self`,
`$locanara-docs`, or `$rebase-main`, use the matching skill under
`.claude/skills/`.

For a `review-pr` fallback, use the Claude `review-self` adapter for exactly one
round and leave reviewer requests, thread handling, and polling ownership with
`review-pr`.
