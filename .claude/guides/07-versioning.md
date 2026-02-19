# Versioning

## Version Management

All packages share synchronized versions managed from `locanara-versions.json` as the **single source of truth**.

## Commands

```bash
# Sync versions across all packages (manual)
bun run version:sync

# Bump version (interactive)
bun run version:bump
```

## Automatic Sync in CI

All release workflows automatically sync package.json versions:

- `release-types.yml` - Syncs after bumping types version
- `release-android.yml` - Syncs after bumping android version
- `release-apple.yml` - Syncs after bumping apple version
- `release-expo.yml` - Syncs after bumping expo version

See [docs/VERSION_SYNC.md](../../docs/VERSION_SYNC.md) for details.

## Version Files

- `locanara-versions.json` - **Source of truth** for all versions
- `package.json` - Root version (auto-synced)
- `packages/gql/package.json` - Types package version (auto-synced)
- `packages/android/package.json` - Android package version (auto-synced)
- `libraries/expo-ondevice-ai/package.json` - Expo module version (auto-synced)
- `packages/site/locanara-versions.json` - Site version display (copied from root)

## Release Checklist

1. Update version: `bun run version:bump`
2. Sync versions: `bun run version:sync`
3. Generate types: `bun run generate`
4. Build all packages: `bun run build`
5. Run tests: `bun run test`
6. Commit and tag
7. Publish packages

## Current Version

Check `locanara-versions.json` for the current version. Versions may differ per platform (e.g., apple: `1.0.1`, android: `1.0.2`).
