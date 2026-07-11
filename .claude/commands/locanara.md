# /locanara

Project-wide router for Locanara work.

## Start Here

1. Read `AGENTS.md` and `git status --short --branch`.
2. Inspect existing diffs before making changes.
3. Select the source of truth and the smallest matching workflow.
4. Use changed-path verification unless a full audit is requested.

## Source-of-Truth Routing

| Request | Read first | Workflow |
| --- | --- | --- |
| Shared type or API contract | `packages/gql/src/*.graphql` | `/gql` |
| Apple behavior | `packages/apple/Sources/` and guide 04 | `/apple` |
| Android behavior | `packages/android/locanara/src/main/` and guide 05 | `/android` |
| Browser behavior | `packages/web/src/` | Implement in Web; verify with `/test` Web checks |
| Wrapper API | platform SDK, spec/public facade, then matching guide | Implement in wrapper; verify with `/test` library checks |
| Docs or examples | implementation, schema, then site page | `/docs` |
| Repository health | manifests, CI, code, tests | `/audit-code` or `/verify-all` |
| GitHub issue | issue criteria and current default branch | `/resolve-issue` |
| Upstream technology status | official sources plus current code | `/knowledge-compile` |

## Repository Map

```text
locanara/
├── packages/
│   ├── gql/       # shared schemas and generators
│   ├── apple/     # Swift SDK and example
│   ├── android/   # Kotlin SDK and example
│   ├── web/       # Chrome Built-in AI SDK
│   └── site/      # website and documentation
├── libraries/
│   ├── expo-ondevice-ai/
│   ├── react-native-ondevice-ai/
│   └── flutter_ondevice_ai/
├── knowledge/     # internal rules and timestamped external references
└── scripts/agent/ # AI context compiler
```

## Cross-Platform Change Order

1. Change the schema when a shared generated contract changes.
2. Regenerate tracked platform outputs; never hand-edit generated files.
3. Implement Apple, Android, and Web behavior where applicable.
4. Update Expo, React Native, and Flutter wrappers from their own specs.
5. Update docs and examples with code copied from the verified implementation.
6. Run the complete affected verification matrix.

## Guardrails

- On-device inference only. Cloud inference, server fallback, and prompt
  telemetry are outside project scope.
- Audit/review requests are read-only unless the user also asks for fixes.
- Never publish, deploy, tag, or trigger release workflows.
- Never close an issue based on age or commit wording alone.
- Report skipped or device-only verification explicitly.
