# GraphQL Schema and Generated Types

Location: `packages/gql/`

GraphQL is the source of truth for shared generated Apple/Android types. It is
not a substitute for platform behavior, wrapper specs, or runtime tests.

## Commands

```bash
cd packages/gql
bun run generate          # all generators plus sync
bun run generate:ts       # GraphQL TypeScript output
bun run codegen:swift     # custom Swift generator
bun run codegen:kotlin    # custom Kotlin generator
bun run codegen:dart      # custom Dart generator
bun run sync              # copy current tracked platform outputs
```

## Workflow

1. Edit the relevant `packages/gql/src/*.graphql` files.
2. Run `bun run generate`.
3. Inspect intermediate output in `packages/gql/src/generated/`.
4. Inspect tracked outputs:
   - `packages/apple/Sources/Types.swift`
   - `packages/android/locanara/src/main/kotlin/com/locanara/Types.kt`
5. Build/test every affected SDK and wrapper.

Never hand-edit generated outputs. The intermediate generated directory is
gitignored, so checking only `git status packages/gql/src/generated` cannot
detect drift. CI must diff the tracked destination files after generation.

The current sync script does not establish automatic Web/Expo/React
Native/Flutter parity; verify those public contracts separately.
