# Locanara Shared Knowledge Base

This is the **Single Source of Truth (SSOT)** for all AI agents working on this project.

## Architecture: "Shared Brain, Dual Body"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED KNOWLEDGE BASE                               │
│                           /knowledge/                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /internal/              /external/              /_claude-context/          │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │ Project     │        │ Apple       │        │ context.md  │             │
│  │ Philosophy  │        │ Intelligence│        │ (compiled)  │             │
│  │ Conventions │        │ LocalLLM    │        │             │             │
│  └─────────────┘        └─────────────┘        └─────────────┘             │
│         │                      │                      │                     │
└─────────┼──────────────────────┼──────────────────────┼─────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
    ┌─────────────────────────────────┐    ┌─────────────────────────┐
    │        LOCAL RAG AGENT          │    │      CLAUDE CODE        │
    │  ┌─────────────────────────┐    │    │                         │
    │  │       LanceDB           │    │    │  claude --context       │
    │  │  • internal_rule        │    │    │  context.md             │
    │  │  • external_api         │    │    │                         │
    │  │  • code_map             │    │    │                         │
    │  └─────────────────────────┘    │    │                         │
    │              │                   │    │                         │
    │              ▼                   │    │                         │
    │      _generated/                │    │     (direct edit)       │
    └─────────────────────────────────┘    └─────────────────────────┘
                   │                                  │
                   └──────────── COMPARE ────────────┘
```

## Folder Structure

```
knowledge/
├── README.md                        # This file
├── internal/                        # MANDATORY - Project philosophy
│   ├── 01-naming-conventions.md    # Function/file naming rules
│   ├── 02-architecture.md          # SDK structure, tier patterns
│   ├── 03-coding-style.md          # Swift/Kotlin style rules
│   ├── 04-api-design.md            # API design principles
│   └── 05-git-deployment.md        # Git conventions, deployment
├── external/                        # REFERENCE - External APIs
│   ├── foundation-models-api.md    # Apple Foundation Models reference
│   ├── localllmclient-api.md       # LocalLLMClient library reference
│   └── gemini-nano-api.md          # Google Gemini Nano reference
└── _claude-context/                 # COMPILED - For Claude Code CLI
    └── context.md                   # Auto-generated combined context
```

## Usage

### Compile Both (Recommended)

```bash
cd scripts/agent

# Compile for both Claude Code + Local RAG
bun run compile
```

### For Claude Code Only

```bash
cd scripts/agent

# Compile context.md for Claude Code
bun run compile:ai

# Use with Claude Code
claude --context knowledge/_claude-context/context.md

# Or in an existing session
/context add knowledge/_claude-context/context.md
```

### For Local RAG Agent

```bash
cd scripts/agent

# Index knowledge + Code Map to LanceDB
bun run compile:local

# Run agent
bun run agent --prompt "Add streaming support to summarize"

# Output goes to: _generated/
```

## Knowledge Priority

| Priority | Type | Source | Purpose |
|----------|------|--------|---------|
| 1 (Highest) | `internal_rule` | `/internal/` | MUST follow exactly |
| 2 | `code_map` | Project scan | Code structure reference |
| 3 | `external_api` | `/external/` | API reference (adapt to internal rules) |

## Regenerating Context

After modifying any files in `internal/` or `external/`:

```bash
cd scripts/agent

# Regenerate for both targets
bun run compile

# Or individually:
bun run compile:ai    # Claude Code context.md
bun run compile:local # Local RAG LanceDB index
```
