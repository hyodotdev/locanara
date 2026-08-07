---
name: review-pr
description: Inspect and finish Locanara pull requests, fix validated review or CI findings, and recheck the exact head every five minutes until clean or genuinely blocked.
---

# Review PR (Claude Code)

Read and follow `.codex/skills/review-pr/SKILL.md` completely together with
`.claude/commands/review-pr.md`. The canonical skill owns polling, head-specific
fallback coverage, authorized fix batches, thread replies, and resolution.

Use the Claude `review-self` adapter for exactly one fallback round when a
reviewer is unavailable. Do not create a nested polling loop. If no real Claude
wake-up mechanism is available, complete the current round and report that
automatic re-entry could not be scheduled; never emulate it with shell sleep or
a background process.
