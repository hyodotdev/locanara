import versionsFile from "../../locanara-versions.json?raw";

type VersionKey = "types" | "apple" | "android";

type VersionRecord = Record<VersionKey, string>;

const REQUIRED_KEYS: readonly VersionKey[] = [
  "types",
  "apple",
  "android",
] as const;

function parseVersions(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error(
      "locanara-versions.json contains invalid JSON. Check the file for syntax errors.",
    );
  }
}

function ensureVersions(data: Record<string, unknown>): VersionRecord {
  return REQUIRED_KEYS.reduce<Partial<VersionRecord>>((accumulator, key) => {
    const value = data[key];

    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`locanara-versions.json missing "${key}" version string`);
    }

    accumulator[key] = value;
    return accumulator;
  }, {}) as VersionRecord;
}

const parsedVersions = parseVersions(versionsFile);

export const LOCANARA_VERSIONS = Object.freeze(ensureVersions(parsedVersions));

export const TYPES_RELEASE = Object.freeze({
  tag: LOCANARA_VERSIONS.types,
  pageUrl: `https://github.com/locanara/releases/tag/${LOCANARA_VERSIONS.types}`,
  downloadPrefix: `https://github.com/locanara/releases/download/${LOCANARA_VERSIONS.types}/`,
});
