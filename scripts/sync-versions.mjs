#!/usr/bin/env node

/**
 * Synchronize package manifests and wrapper fallback versions from
 * locanara-versions.json.
 *
 * Usage:
 *   bun scripts/sync-versions.mjs
 *   bun scripts/sync-versions.mjs --check
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

const REQUIRED_VERSION_KEYS = [
  "version",
  "types",
  "apple",
  "android",
  "expo",
  "react-native",
  "flutter",
];

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const JSON_VERSION_TARGETS = [
  ["package.json", "version"],
  ["packages/web/package.json", "version"],
  ["packages/gql/package.json", "types"],
  ["packages/android/package.json", "android"],
  ["libraries/expo-ondevice-ai/package.json", "expo"],
  ["libraries/react-native-ondevice-ai/package.json", "react-native"],
];

const TEXT_VERSION_TARGETS = [
  {
    path: "README.md",
    replacements: [
      [
        /implementation\("com\.locanara:locanara:[^"]+"\)/,
        (versions) =>
          `implementation("com.locanara:locanara:${versions.android}")`,
      ],
    ],
  },
  {
    path: "packages/apple/Sources/Locanara.swift",
    replacements: [
      [
        /^    public static let version = "[^"]+"$/m,
        (versions) => `    public static let version = "${versions.apple}"`,
      ],
    ],
  },
  {
    path: "packages/apple/Tests/LocanaraTests.swift",
    replacements: [
      [
        /XCTAssertEqual\(LocanaraClient\.version, "[^"]+"\)/,
        (versions) =>
          `XCTAssertEqual(LocanaraClient.version, "${versions.apple}")`,
      ],
    ],
  },
  {
    path: "libraries/expo-ondevice-ai/android/build.gradle",
    replacements: [
      [/^version = '[^']+'$/m, (versions) => `version = '${versions.expo}'`],
      [
        /^    versionName "[^"]+"$/m,
        (versions) => `    versionName "${versions.expo}"`,
      ],
      [/^  return "[^"]+"$/m, (versions) => `  return "${versions.android}"`],
    ],
  },
  {
    path: "libraries/react-native-ondevice-ai/android/build.gradle",
    replacements: [
      [
        /implementation "com\.locanara:locanara:[^"]+"/,
        (versions) =>
          `implementation "com.locanara:locanara:${versions.android}"`,
      ],
    ],
  },
  {
    path: "libraries/flutter_ondevice_ai/pubspec.yaml",
    replacements: [
      [/^version: \S+$/m, (versions) => `version: ${versions.flutter}`],
    ],
  },
  {
    path: "libraries/flutter_ondevice_ai/ios/flutter_ondevice_ai.podspec",
    replacements: [
      [
        /^  s\.version\s+=\s+'[^']+'$/m,
        (versions) => `  s.version          = '${versions.flutter}'`,
      ],
    ],
  },
  {
    path: "libraries/flutter_ondevice_ai/android/build.gradle",
    replacements: [
      [/^version '[^']+'$/m, (versions) => `version '${versions.flutter}'`],
      [
        /^        versionName "[^"]+"$/m,
        (versions) => `        versionName "${versions.flutter}"`,
      ],
      [
        /^    return "[^"]+"$/m,
        (versions) => `    return "${versions.android}"`,
      ],
    ],
  },
];

export function parseVersions(value, source = "locanara-versions.json") {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${source} must contain a JSON object`);
  }

  for (const key of REQUIRED_VERSION_KEYS) {
    if (typeof value[key] !== "string" || value[key].trim() === "") {
      throw new Error(`${source} must contain a non-empty "${key}" version`);
    }
    if (!SEMVER_PATTERN.test(value[key])) {
      throw new Error(`${source} contains an invalid "${key}" semver`);
    }
  }

  return value;
}

export function replaceExactlyOnce(content, pattern, replacement, description) {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const matches = [...content.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) {
    throw new Error(
      `${description} expected exactly one match, found ${matches.length}`,
    );
  }
  return content.replace(pattern, replacement);
}

function readVersions(rootDirectory) {
  const versionsPath = resolve(rootDirectory, "locanara-versions.json");
  return parseVersions(
    JSON.parse(readFileSync(versionsPath, "utf8")),
    versionsPath,
  );
}

function expectedFiles(rootDirectory, versions) {
  const files = new Map();

  files.set(
    "packages/site/locanara-versions.json",
    `${JSON.stringify(versions, null, 2)}\n`,
  );

  for (const [relativePath, versionKey] of JSON_VERSION_TARGETS) {
    const absolutePath = resolve(rootDirectory, relativePath);
    const manifest = JSON.parse(readFileSync(absolutePath, "utf8"));
    manifest.version = versions[versionKey];
    files.set(relativePath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  for (const target of TEXT_VERSION_TARGETS) {
    const absolutePath = resolve(rootDirectory, target.path);
    let content = readFileSync(absolutePath, "utf8");
    for (const [pattern, replacement] of target.replacements) {
      content = replaceExactlyOnce(
        content,
        pattern,
        replacement(versions),
        `${target.path}: ${pattern}`,
      );
    }
    files.set(target.path, content);
  }

  return files;
}

export function synchronizeVersions({
  rootDirectory = repositoryRoot,
  check = false,
} = {}) {
  const versions = readVersions(rootDirectory);
  const files = expectedFiles(rootDirectory, versions);
  const drifted = [];

  for (const [relativePath, expected] of files) {
    const absolutePath = resolve(rootDirectory, relativePath);
    const current = readFileSync(absolutePath, "utf8");
    if (current === expected) continue;

    drifted.push(relativePath);
    if (!check) writeFileSync(absolutePath, expected, "utf8");
  }

  return drifted;
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--check")) {
    throw new Error("Usage: bun scripts/sync-versions.mjs [--check]");
  }

  const check = args.includes("--check");
  const drifted = synchronizeVersions({ check });

  if (drifted.length === 0) {
    console.log("All version consumers are synchronized.");
    return;
  }

  for (const relativePath of drifted) {
    console.log(`${check ? "DRIFT" : "UPDATED"} ${relativePath}`);
  }

  if (check) {
    console.error("Run `bun run version:sync` and review the resulting diff.");
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  main();
}
