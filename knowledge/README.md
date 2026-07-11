# Locanara Shared Knowledge Base

This directory supplements agent policy; it is not the sole source of truth.

## Authority Order

1. `AGENTS.md` — repository policy and safety boundaries
2. Current GraphQL schema, manifests, implementation, and tests
3. `knowledge/internal/` — detailed project conventions
4. Timestamped `knowledge/external/` references (optional, never embedded by default)
5. Generated context under `knowledge/_claude-context/`

Generated or external content must never override `AGENTS.md` or live code. If
two sources disagree, stop treating the lower source as authoritative and fix
the source/generator rather than adding another duplicate rule.

## Structure

```text
knowledge/
├── README.md
├── internal/          # maintained project conventions
├── external/          # reviewable, potentially stale upstream references
└── _claude-context/   # generated; never edit by hand
    └── context.md
```

## External Reference Rules

- The compiler lists external file paths but does not embed their bodies in the
  default agent context.
- Date snapshots and link official primary sources.
- Do not add cloud SDKs or server inference to an on-device integration note.
- Verify dependency versions from current manifests at execution time.
- Mark uncertain or unverified APIs instead of inventing sample code.
- Recheck every external claim before using it for an implementation change.

## Regeneration

After changing `AGENTS.md`, an allowlisted `knowledge/internal/` source, the
external reference inventory, or the compiler:

```bash
cd scripts/agent
bun run typecheck
bun test
bun run lint:markdown
bun run compile
bun run check
```

Review the generated diff. The compiler must be deterministic for a supplied
input and must not publish, deploy, or mutate package versions. Machine-local
`claude-mem-context` blocks are intentionally excluded from tracked generated
context. Root/site version-map drift is surfaced in the generated reference and
compiler log; it is never silently treated as synchronized.
