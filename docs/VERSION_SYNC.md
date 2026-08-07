# Version Synchronization

Locanara uses `locanara-versions.json` as the **single source of truth** for all
package versions. Package versions are intentionally independent.

## Overview

```text
locanara-versions.json
       |
       +-- package manifests and wrapper fallback versions
       +-- Apple runtime version
       +-- README installation example
       `-- packages/site/locanara-versions.json
```

## Source of Truth

File: `locanara-versions.json`

```json
{
  "version": "<web-sdk-semver>",
  "types": "<generated-types-semver>",
  "apple": "<apple-sdk-semver>",
  "android": "<android-sdk-semver>",
  "expo": "<expo-wrapper-semver>",
  "react-native": "<react-native-wrapper-semver>",
  "flutter": "<flutter-wrapper-semver>"
}
```

## Manual Sync

After editing the canonical map, synchronize all tracked consumers:

```bash
bun run version:sync
```

Use read-only mode in CI or before a commit:

```bash
bun run version:check
```

The synchronizer validates every required key as semantic versioning, updates
JSON manifests with stable formatting, and fails when a text consumer pattern
is missing or ambiguous.

## Release Workflow Contract

Release workflows never edit versions or commit to `main`. The maintainer must:

1. Update `locanara-versions.json` on a branch.
2. Run `bun run version:sync` and review every changed consumer.
3. Run `bun run version:check` and the affected package verification.
4. Merge the version preparation through a pull request.
5. Manually dispatch the matching release workflow from `main` and confirm the
   already committed version.

Each release workflow checks the committed version map, rejects an existing tag
or registry version, and requires the protected `release` environment before it
publishes.

## Version Mapping

| Key            | Primary synchronized consumers                         |
| -------------- | ------------------------------------------------------ |
| `version`      | Root and Web SDK package manifests                     |
| `types`        | GraphQL types package manifest                         |
| `apple`        | Apple runtime version and version test                 |
| `android`      | Android manifest plus Expo, RN, and Flutter fallbacks  |
| `expo`         | Expo package manifest and Android package metadata     |
| `react-native` | React Native package manifest                          |
| `flutter`      | Flutter manifest, Android metadata, and CocoaPods spec |

## Notes

- The Apple podspec and Android core build read `locanara-versions.json`
  directly.
- The site reads its synchronized mirror at build time.
- Do not infer one package version from another or copy a documentation example
  without checking the canonical map.
