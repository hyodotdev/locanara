# Version Synchronization

Locanara uses `locanara-versions.json` as the **single source of truth** for all package versions.

## Overview

```
locanara-versions.json
       ↓
  [Auto-sync]
       ↓
┌──────┴──────┬─────────────┬─────────────┬─────────────┐
│             │             │             │             │
package.json  gql/          android/      expo/         site/
              package.json  package.json  package.json  locanara-versions.json
```

## Source of Truth

**File**: `locanara-versions.json`

```json
{
  "version": "1.0.1", // Root package version
  "types": "1.0.1", // GraphQL types version
  "apple": "1.0.1", // iOS/macOS SDK version
  "android": "1.0.2", // Android SDK version
  "expo": "0.1.0" // Expo module version
}
```

## Manual Sync

Run the sync script anytime to synchronize all package.json versions:

```bash
bun run version:sync
```

This script:

- Reads versions from `locanara-versions.json`
- Updates `package.json` (root)
- Updates `packages/gql/package.json`
- Updates `packages/android/package.json`
- Updates `libraries/expo-ondevice-ai/package.json`
- Preserves formatting (2-space indent + trailing newline)

## Automatic Sync (CI)

All release workflows automatically sync versions before deployment:

### Release Types Workflow

```yaml
- Update locanara-versions.json (types field)
- Run: bun run version:sync
- Commit all updated files
- Generate and release types
```

### Release Android Workflow

```yaml
- Update locanara-versions.json (android field)
- Run: bun run version:sync
- Commit all updated files
- Build and publish to Maven Central
```

### Release Apple Workflow

```yaml
- Update locanara-versions.json (apple field)
- Run: bun run version:sync
- Commit all updated files
- Publish to CocoaPods and create GitHub release
```

### Release Expo Workflow

```yaml
- Update locanara-versions.json (expo field)
- Run: bun run version:sync
- Commit all updated files
- Publish to npm with OIDC trusted publishing
```

## Version Bump Process

1. **Trigger Release Workflow**
   - Choose: `current` (re-release) or `patch`/`minor`/`major`
   - GitHub Actions updates `locanara-versions.json`

2. **Auto-Sync**
   - CI runs `bun run version:sync`
   - All package.json files updated

3. **Commit & Push**
   - CI commits all version changes
   - Pushes to main branch

4. **Build & Publish**
   - Build artifacts
   - Publish to registries

## Version Mapping

| locanara-versions.json | Target File                               | Field   |
| ---------------------- | ----------------------------------------- | ------- |
| `version`              | `package.json`                            | version |
| `types`                | `packages/gql/package.json`               | version |
| `android`              | `packages/android/package.json`           | version |
| `expo`                 | `libraries/expo-ondevice-ai/package.json` | version |

## Notes

- **Apple SDK**: Version stored in locanara-versions.json, used in podspec
- **Expo module**: Published to npm with OIDC trusted publishing (no token secret needed)
- **Manual updates**: Always run `bun run version:sync` after editing locanara-versions.json
