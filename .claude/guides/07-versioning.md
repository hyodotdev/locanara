# Versioning

## Authority

`locanara-versions.json` is the version source of truth. Versions are keyed by
surface and may differ; "all packages share one version" is incorrect.

Synchronized consumers include package manifests, the site's version copy,
runtime version constants, wrapper fallback dependencies, lockfiles, and
release workflow metadata. The current sync script may not cover every one of
these, so always verify rather than assuming synchronization succeeded.

## Rules

- Read current values at execution time with `jq . locanara-versions.json`.
- Do not copy versions from README snippets, guides, tags for another surface,
  or adjacent release blocks.
- Do not modify versions unless the user explicitly asks for version
  preparation.
- Never tag, publish, create a GitHub release, or trigger a release workflow.
- A missing bump/generation script is a defect, not permission to edit versions
  manually across many files.

## Consistency Check

Compare at least:

- `locanara-versions.json`
- `packages/site/locanara-versions.json`
- root and package `package.json` versions
- Apple runtime version constants and package/podspec metadata
- Android SDK coordinates and wrapper fallback dependencies
- Expo, React Native, and Flutter manifests
- tracked lockfiles where workspace versions are encoded

A mismatch fails verification. Report every differing path/value and fix the
sync generator/workflow when authorized rather than repeatedly patching copies.
Use `cd scripts/agent && bun run check:versions` for this fail-closed check.
The normal AI context `bun run check` reports drift but does not mutate or select
version values, so it is not a substitute for version-work verification.

## Maintainer Handoff

For requested release preparation, provide the proposed version map, files that
would change, verification results, and known CI gaps. Stop before publication.
