export type VersionMap = Record<string, string>;

export function parseVersions(value: unknown, source?: string): VersionMap;

export function replaceExactlyOnce(
  content: string,
  pattern: RegExp,
  replacement: string,
  description: string,
): string;

export function synchronizeVersions(options?: {
  rootDirectory?: string;
  check?: boolean;
}): string[];
