import { describe, expect, it } from "bun:test";

import {
  assertNoVersionDrift,
  buildAgentContext,
  buildFullReference,
  buildQuickReference,
  compareVersions,
  formatVersionDrift,
  parseRunMode,
  parseVersions,
  stripLocalMemoryContext,
  type Versions,
} from "./compile-context";

const versions: Versions = {
  version: "9.0.1",
  types: "9.0.2",
  apple: "9.1.0",
  android: "9.2.0",
  expo: "0.9.1",
  "react-native": "0.9.2",
  flutter: "0.9.3",
};

describe("AI context compiler", () => {
  it("renders package versions from the supplied version map", () => {
    const quick = buildQuickReference(versions);

    expect(quick).toContain("Apple SDK: 9.1.0");
    expect(quick).toContain("Android SDK: 9.2.0");
    expect(quick).toContain("Flutter wrapper: 0.9.3");
    expect(quick).not.toContain("com.locanara:locanara:1.0.0");
  });

  it("documents verified API concepts and the actual Pipeline guarantee", () => {
    const full = buildFullReference(versions);

    expect(full).toContain("tracks the last step's result type");
    expect(full).toContain("Web has no Pipeline builder");
    expect(full).toContain("chatStreaming");
    expect(full).toContain("Locanara.getInstance()");
    expect(full).not.toContain("compiler rejects pipelines");
  });

  it("embeds allowlisted policy before an external file-only inventory", async () => {
    const context = await buildAgentContext(versions);
    const policyIndex = context.indexOf(
      "# Repository Policy (Highest Priority)",
    );
    const externalIndex = context.indexOf(
      "# External Reference Inventory (Bodies Not Embedded)",
    );

    expect(policyIndex).toBeGreaterThan(-1);
    expect(externalIndex).toBeGreaterThan(policyIndex);
    expect(context).toContain("AI agents must NEVER publish");
    expect(context).toContain("knowledge/external/foundation-models-api.md");
    expect(context).not.toContain("# Apple Foundation Models API Reference");
    expect(context).not.toContain("<claude-mem-context>");
  });

  it("produces deterministic agent context", async () => {
    const first = await buildAgentContext(versions);
    const second = await buildAgentContext(versions);

    expect(second).toBe(first);
  });

  it("validates every required version key", () => {
    expect(parseVersions(versions)).toEqual(versions);
    expect(() => parseVersions({ ...versions, apple: "" })).toThrow(
      "missing or invalid keys: apple",
    );
    expect(() => parseVersions({ version: "1.0.0" })).toThrow(
      "types, apple, android, expo, react-native, flutter",
    );
    expect(() => parseVersions([])).toThrow("must be a JSON object");
  });

  it("detects and reports version mirror drift", () => {
    const mirror = { ...versions, apple: "9.0.9" };
    const drift = compareVersions(versions, mirror);

    expect(drift).toEqual([
      { key: "apple", authoritative: "9.1.0", mirror: "9.0.9" },
    ]);
    expect(formatVersionDrift(drift)).toContain(
      "`apple` (root: `9.1.0`, site: `9.0.9`)",
    );
    expect(() => assertNoVersionDrift(drift)).toThrow(
      "Version mirror mismatch detected",
    );
    expect(() => assertNoVersionDrift([])).not.toThrow();
  });

  it("removes machine-local memory blocks without changing policy text", () => {
    const content = `# Policy\n\nKeep this.\n<claude-mem-context>\n# Local\nsecret\n</claude-mem-context>\n`;

    expect(stripLocalMemoryContext(content)).toBe("# Policy\n\nKeep this.");
    expect(
      stripLocalMemoryContext(
        '# Policy\n<CLAUDE-MEM-CONTEXT source="local">private</CLAUDE-MEM-CONTEXT>',
      ),
    ).toBe("# Policy");
    expect(() =>
      stripLocalMemoryContext(
        "# Policy\n<claude-mem-context>unterminated private data",
      ),
    ).toThrow("Malformed claude-mem-context block");
  });

  it("accepts only the supported write and read-only modes", () => {
    expect(parseRunMode([])).toBe("write");
    expect(parseRunMode(["--check"])).toBe("check");
    expect(parseRunMode(["--check-versions"])).toBe("check-versions");
    expect(() => parseRunMode(["--unknown"])).toThrow("Unknown arguments");
    expect(() => parseRunMode(["--check", "--unknown"])).toThrow(
      "Unknown arguments",
    );
  });
});
