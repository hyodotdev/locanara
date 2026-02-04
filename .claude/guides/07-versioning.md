# Versioning

## Version Management

All packages share synchronized versions managed from the root.

## Commands

```bash
# Sync versions across all packages
bun run version:sync

# Bump version (interactive)
bun run version:bump
```

## Version Files

- `package.json` - Root version
- `packages/*/package.json` - Package versions
- `locanara-versions.json` - Version metadata
- `locanara.podspec` - CocoaPods version

## Release Checklist

1. Update version: `bun run version:bump`
2. Sync versions: `bun run version:sync`
3. Generate types: `bun run generate`
4. Build all packages: `bun run build`
5. Run tests: `bun run test`
6. Commit and tag
7. Publish packages

## Current Version

Check `package.json` for the current version (currently `0.1.0`).
