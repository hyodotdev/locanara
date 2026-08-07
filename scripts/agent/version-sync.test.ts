import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { parseVersions, replaceExactlyOnce } from "../sync-versions.mjs";

describe("version synchronization", () => {
  test("requires every canonical version key", () => {
    expect(() => parseVersions({ version: "1.0.0" })).toThrow(
      'must contain a non-empty "types" version',
    );
  });

  test("rejects invalid semantic versions", () => {
    expect(() =>
      parseVersions({
        version: "1.0.0",
        types: "1.0.0",
        apple: "1.0.0",
        android: "1.0.0",
        expo: "1.0.0",
        "react-native": "1.0.0",
        flutter: "not-a-version",
      }),
    ).toThrow('contains an invalid "flutter" semver');
  });

  test("fails closed when a consumer pattern is ambiguous", () => {
    expect(() =>
      replaceExactlyOnce(
        "version 1\nversion 2\n",
        /version \d/,
        "version 3",
        "fixture",
      ),
    ).toThrow("expected exactly one match, found 2");
  });

  test("repository consumers match the canonical version map", () => {
    const projectRoot = resolve(import.meta.dir, "../..");
    const result = Bun.spawnSync({
      cmd: ["bun", "run", "scripts/sync-versions.mjs", "--check"],
      cwd: projectRoot,
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(new TextDecoder().decode(result.stderr)).toBe("");
    expect(new TextDecoder().decode(result.stdout)).toContain(
      "All version consumers are synchronized.",
    );
    expect(result.exitCode).toBe(0);
  });
});
