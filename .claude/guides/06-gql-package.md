# GQL Package (Schema & Types)

## Overview

Location: `packages/gql/`

The GQL package is the **single source of truth** for all types in Locanara. It defines the GraphQL schema and generates type definitions for TypeScript, Swift, and Kotlin.

## Type Generation

```bash
cd packages/gql

# Generate all types
bun run generate

# Generate individually
bun run generate:ts      # TypeScript types
bun run generate:swift   # Swift types
bun run generate:kotlin  # Kotlin types

# Sync to platform packages
bun run sync
```

Or from project root:

```bash
bun run generate
```

## Project Structure

```text
packages/gql/
├── src/
│   ├── schemas/         # GraphQL schema definitions
│   └── generated/       # Generated types (do not edit)
│       ├── types.ts     # TypeScript
│       ├── Types.swift  # Swift
│       └── Types.kt     # Kotlin
├── scripts/
│   ├── generate-swift-types.mjs
│   ├── generate-kotlin-types.mjs
│   └── sync-to-platforms.mjs
└── codegen.ts           # GraphQL Codegen config
```

## Dependencies

- `graphql` - GraphQL parser
- `@graphql-codegen/cli` - Code generation
- `@graphql-codegen/typescript` - TypeScript output

## Workflow

1. Edit schema in `src/schemas/*.graphql`
2. Run `bun run generate`
3. Types are generated to `src/generated/`
4. Types are synced to `packages/apple` and `packages/android`

## Important

- **Never edit files in `src/generated/`** - they are overwritten on generation
- Always commit generated files after schema changes
- Run generation before platform builds
