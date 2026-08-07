---
name: locanara-docs
description: Create, update, audit, and verify Locanara documentation, examples, API references, tutorials, setup guides, and site navigation from the current GraphQL schema and platform implementations. Use for documentation work in packages/site, README files, examples, version displays, or documentation issues without deploying the site.
---

# Locanara Docs

Derive documentation from live contracts and behavior, then verify the complete
site surface without publishing it.

## Read Before Editing

1. Read `AGENTS.md`, `.claude/commands/docs.md`, and the existing diff.
2. Read the implementation or schema that owns every documented claim.
3. Read the surrounding page, `packages/site/src/pages/docs/index.tsx`, and the
   shared docs components before adding content or navigation.
4. Read the matching package guide under `.claude/guides/` for platform or
   wrapper examples.

Validation and status requests are read-only. Edit documentation only when the
user asks for a change or fix.

## Use The Correct Source

- Shared types and operation names: `packages/gql/src/*.graphql`
- Apple behavior and availability: `packages/apple/Sources/`
- Android behavior and availability: `packages/android/locanara/src/main/`
- Browser behavior: `packages/web/src/`
- Expo, React Native, and Flutter examples: each wrapper's public facade and
  native implementation
- Versions: root `locanara-versions.json`

Do not infer behavior from generated docs, old knowledge snapshots, neighboring
package versions, or another platform's implementation. If root and site
version maps differ, report the defect; do not silently synchronize or bump a
version without explicit version-preparation authority.

## Author The Documentation

1. Trace the public call end to end, including errors and unsupported results.
2. Document only platforms and guarantees established by implementation and
   tests. Keep capability checks explicit for runtime-dependent APIs.
3. Distinguish native feature support from wrapper or Web alternatives. For
   example, Apple and Android own native Pipeline builders; Web and current
   wrappers may show manual composition, but must not be labeled as Pipeline DSL
   parity.
4. Reuse existing components, styles, terminology, and code-sample patterns.
5. For a new site page, add its route, sidebar or navigation entry, page
   navigation, and search-visible title where the current structure requires
   them.
6. Include error behavior, availability constraints, and real-device caveats.
7. Update relevant examples or README surfaces when the same public contract is
   shown there.

Do not claim that Pipeline builders prove every adjacent step compatible at
compile time. Do not describe unavailable model management or inference as a
successful no-op.

## Verify

Run each site check independently so one failure does not hide another:

```bash
cd packages/site
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
```

Also run affected SDK or wrapper checks when documentation examples expose a
changed public contract. Finish with `git diff --check` and inspect the rendered
page when layout or navigation changed.

Site checks treat embedded Swift, Kotlin, TypeScript, and Dart snippets as text;
they do not prove those snippets compile. Prefer examples copied from a compiled
test or example target, and run the smallest owning platform check whenever a
code block changes.

Never run `firebase deploy`, publish a preview, trigger deployment, or change a
package version as part of documentation generation.
