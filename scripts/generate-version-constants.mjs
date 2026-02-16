#!/usr/bin/env node

/**
 * Generate version constants from locanara-versions.json
 * This ensures version strings in code are always in sync with SSOT
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Read versions from SSOT
const versionsPath = resolve(rootDir, 'locanara-versions.json');
const versions = JSON.parse(readFileSync(versionsPath, 'utf-8'));

// Generate Swift version file
const swiftVersion = versions.apple;
const swiftContent = `import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "SDK")

// MARK: - Locanara Namespace

/// Locanara SDK namespace for static properties
/// Note: Named LocanaraSDK to avoid conflict with module name 'Locanara'
/// Package source type
public enum PackageSource: String, Sendable {
    /// Compiled from local source code
    case localSource = "local_source"
    /// Loaded from released xcframework binary
    case releasedPackage = "released_package"

    /// Human-readable display name
    public var displayName: String {
        switch self {
        case .localSource: return "Local Source"
        case .releasedPackage: return "Released Package"
        }
    }
}

public enum LocanaraSDK {
    /// SDK version (auto-generated from locanara-versions.json)
    /// DO NOT EDIT: Run 'bun run generate:version' to update
    public static let version = "${swiftVersion}"
`;

// Read rest of Locanara.swift after version line
const swiftPath = resolve(rootDir, 'packages/apple/Sources/Locanara.swift');
const swiftOriginal = readFileSync(swiftPath, 'utf-8');
const swiftLines = swiftOriginal.split('\n');

// Find the line after version declaration
let afterVersionIndex = -1;
for (let i = 0; i < swiftLines.length; i++) {
  if (swiftLines[i].includes('public static let version')) {
    afterVersionIndex = i + 1;
    break;
  }
}

if (afterVersionIndex > 0) {
  const restOfSwift = swiftLines.slice(afterVersionIndex).join('\n');
  writeFileSync(swiftPath, swiftContent + '\n' + restOfSwift, 'utf-8');
  console.log(`✅ Updated Swift version to ${swiftVersion}`);
}

// Generate Kotlin version constant
const kotlinVersion = versions.android;
const kotlinPath = resolve(rootDir, 'packages/android/locanara/src/main/kotlin/com/locanara/Locanara.kt');
const kotlinOriginal = readFileSync(kotlinPath, 'utf-8');

// Replace version strings in Kotlin
const kotlinUpdated = kotlinOriginal
  .replace(/version\s*=\s*"[\d.]+"/g, `version = "${kotlinVersion}"`)
  .replace(/(\/\/ DO NOT EDIT[\s\S]*?version = )"[\d.]+"/g, `$1"${kotlinVersion}"`);

if (kotlinUpdated !== kotlinOriginal) {
  writeFileSync(kotlinPath, kotlinUpdated, 'utf-8');
  console.log(`✅ Updated Kotlin version to ${kotlinVersion}`);
} else {
  console.log(`✅ Kotlin version already up to date (${kotlinVersion})`);
}

console.log('\n✅ Version constants generated successfully!');
