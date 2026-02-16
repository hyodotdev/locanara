#!/usr/bin/env node

/**
 * Sync all package.json versions from locanara-versions.json
 *
 * Usage:
 *   bun scripts/sync-versions.mjs
 *   node scripts/sync-versions.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Define all package.json files to sync
const PACKAGES = [
  {
    path: 'package.json',
    versionKey: 'version',
    description: 'Root package.json'
  },
  {
    path: 'packages/gql/package.json',
    versionKey: 'types',
    description: 'GQL package'
  },
  {
    path: 'packages/android/package.json',
    versionKey: 'android',
    description: 'Android package'
  }
];

function main() {
  console.log('🔄 Syncing package versions from locanara-versions.json...\n');

  // Read source of truth
  const versionsPath = resolve(rootDir, 'locanara-versions.json');
  const versionsContent = readFileSync(versionsPath, 'utf-8');
  const versions = JSON.parse(versionsContent);

  let updatedCount = 0;
  let unchangedCount = 0;

  // Update each package
  for (const pkg of PACKAGES) {
    const pkgPath = resolve(rootDir, pkg.path);
    const pkgContent = readFileSync(pkgPath, 'utf-8');
    const pkgJson = JSON.parse(pkgContent);

    const targetVersion = versions[pkg.versionKey];
    const currentVersion = pkgJson.version;

    if (currentVersion === targetVersion) {
      console.log(`✓ ${pkg.description}: ${currentVersion} (unchanged)`);
      unchangedCount++;
    } else {
      console.log(`📝 ${pkg.description}: ${currentVersion} → ${targetVersion}`);
      pkgJson.version = targetVersion;

      // Write with proper formatting (2 space indent + trailing newline)
      const updatedContent = JSON.stringify(pkgJson, null, 2) + '\n';
      writeFileSync(pkgPath, updatedContent, 'utf-8');
      updatedCount++;
    }
  }

  console.log(`\n✅ Done! Updated: ${updatedCount}, Unchanged: ${unchangedCount}`);

  if (updatedCount > 0) {
    console.log('\n⚠️  Remember to commit the updated package.json files');
  }
}

main();
