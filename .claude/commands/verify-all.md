# /verify-all

Run repository health verification without publishing or deploying.

## Modes

- Default: inspect the diff and run only affected rows.
- `full`: run every locally available row below.
- Report device-only, credential-dependent, or unavailable rows as skipped; do
  not turn them into false passes.

## Matrix

| Surface | Commands |
| --- | --- |
| GraphQL types | `cd packages/gql && bun run generate`, then from the repository root require no tracked Swift/Kotlin type drift on a clean baseline |
| Apple SDK | `cd packages/apple && swift build && swift test` |
| Apple example | Review resolved macro revisions, then `cd packages/apple/Example && xcodebuild -scheme LocanaraExample -destination 'generic/platform=iOS Simulator' -skipMacroValidation CODE_SIGNING_ALLOWED=NO build` |
| Android | `cd packages/android && ./gradlew :locanara:test :locanara:build :example:assembleDebug` |
| Web | `cd packages/web && bun run lint && bun run test && bun run build` |
| Site | run typecheck, lint, format check, test, and build as independent results |
| Expo | TypeScript check, non-mutating lint, tests, build |
| React Native | nitrogen drift check when relevant, TypeScript check, tests, Bob build |
| Flutter | `flutter analyze` and `flutter test` as independent results |
| Agent context | `cd scripts/agent && bun run typecheck && bun test && bun run lint:markdown && bun run check` |

## Generator Checks

For GraphQL changes, run `bun run generate` in `packages/gql` and inspect the
tracked Apple and Android `Types` outputs. The ignored
`packages/gql/src/generated/` directory cannot prove synchronization.

For Nitro spec changes, run nitrogen and inspect `nitrogen/generated/`; never
hand-edit generated bridge files.

## Safety

- Inspect `git status` before and after commands. Dependency tools may rewrite
  lockfiles; revert only changes created by this verification.
- Do not run formatting commands that write in a read-only verification pass.
- Never invoke publish tasks, release workflows, tags, Firebase deploy, Maven
  publication, CocoaPods push, npm publish, or pub publish.

## Report

List each row as pass, fail, skipped, or blocked with its exact command. Preserve
warnings separately from failures, and call out CI gaps when local required
checks are not represented in GitHub Actions.
