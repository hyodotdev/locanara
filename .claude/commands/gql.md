# /gql

Review or change shared GraphQL schemas and generated platform types.

## Usage

```text
/gql validate the schemas
/gql add a shared result type
/gql regenerate and review platform outputs
```

## Authority and Scope

GraphQL is authoritative for shared generated types. It is not authoritative
for platform runtime behavior, wrapper bridge signatures, model availability,
or package versions.

Review/validation requests are read-only. Edit schemas and regenerate output
only when the user asks for a change.

## Schema Map

```text
packages/gql/src/
├── schema.graphql
├── type.graphql
├── type-ios.graphql
├── type-android.graphql
├── type-web.graphql
├── utils.graphql
├── utils-ios.graphql
├── utils-android.graphql
├── utils-web.graphql
├── error.graphql
└── event.graphql
```

## Workflow

1. Read `AGENTS.md`, the GQL guide, status, and existing diffs.
2. Determine whether the contract is shared or genuinely platform-specific.
3. Validate names, references, nullability, enums, descriptions, and operation
   input/output types across all schema files.
4. For an authorized change, edit only schema/generator sources, then run the
   generator. Never hand-edit generated Swift, Kotlin, Dart, TypeScript, or
   Nitro output.
5. Inspect tracked destinations and build/test each affected consumer.
6. Report schema changes, generated diffs, affected platforms, and any parity
   work that is not automatically generated.

## Naming Rules

- Shared types have no platform suffix.
- iOS GraphQL types/operations use the `IOS` suffix; Android uses `Android`.
- Put the platform suffix at the end, such as `ExecuteFeatureOptionsIOS`.
- Enum values use `SCREAMING_SNAKE_CASE`.
- Do not mechanically rename generated Swift acronym casing; inspect generator
  output and public declarations.

## Generation and Verification

```bash
cd packages/gql
bun install --frozen-lockfile
bun run generate

# Review expected active-development output
git diff -- \
  ../apple/Sources/Types.swift \
  ../android/locanara/src/main/kotlin/com/locanara/Types.kt
```

On a clean baseline or in CI, regenerate and then require no drift:

```bash
cd packages/gql
bun run generate
cd ../..
git diff --exit-code -- \
  packages/apple/Sources/Types.swift \
  packages/android/locanara/src/main/kotlin/com/locanara/Types.kt
```

The intermediate `packages/gql/src/generated/` directory is gitignored and
cannot by itself prove synchronization. The current sync step tracks Apple and
Android destinations; verify Web and all three wrappers separately when the
public contract changes.

## Consumer Checks

- Apple: `swift build`, `swift test`, and example build.
- Android: `:locanara:test`, `:locanara:build`, and example assemble.
- Web/wrappers: compare the live public APIs and run their affected tests/builds.
- Docs: validate examples against implementation, not schema names alone.

## References

- `.claude/guides/06-gql-package.md`
- `.claude/guides/02-api-naming.md`
- `.claude/commands/verify-all.md`
