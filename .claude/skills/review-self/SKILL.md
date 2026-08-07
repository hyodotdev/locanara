---
name: review-self
description: Independently review and improve the current Locanara implementation, working-tree changes, or pull request, then recheck it at five-minute intervals until stable or genuinely blocked.
---

# Review Self (Claude Code)

Read and follow `.codex/skills/review-self/SKILL.md` completely. Its scope,
review-round, fallback, five-minute confirmation, and stopping rules are the
canonical procedure for every agent.

## Claude Code Notes

- Use `.claude/skills/locanara-workflows/SKILL.md` or the matching
  `.claude/commands/*.md` file for routed workflows.
- When invoked by `review-pr`, run exactly one round. Do not request reviewers,
  re-enter `review-pr`, or schedule the five-minute loop.
- For normal five-minute confirmation, use a real Claude wake-up mechanism. If
  unavailable, complete the current round and report that automatic re-entry
  could not be scheduled; never emulate it with a shell sleep or background
  loop.
