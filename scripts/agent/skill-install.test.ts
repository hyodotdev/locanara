import { afterEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "../..");
const installer = path.join(
  repositoryRoot,
  ".codex/scripts/install-skills.sh",
);
const temporaryHomes: string[] = [];

function createTemporaryHome(): string {
  const temporaryHome = fs.mkdtempSync(
    path.join(os.tmpdir(), "locanara-skill-install-"),
  );
  temporaryHomes.push(temporaryHome);
  return temporaryHome;
}

function runInstaller(codexHome: string) {
  return Bun.spawnSync([installer], {
    cwd: repositoryRoot,
    env: { ...process.env, CODEX_HOME: codexHome },
  });
}

afterEach(() => {
  for (const temporaryHome of temporaryHomes.splice(0)) {
    fs.rmSync(temporaryHome, { recursive: true, force: true });
  }
});

describe("Codex skill installer", () => {
  test("links only the globally unique Locanara skills", () => {
    const codexHome = createTemporaryHome();
    const result = runInstaller(codexHome);

    expect(result.exitCode).toBe(0);
    for (const skillName of ["locanara-workflows", "locanara-docs"]) {
      const installed = path.join(codexHome, "skills", skillName);
      expect(fs.lstatSync(installed).isSymbolicLink()).toBe(true);
      expect(fs.realpathSync(installed)).toBe(
        path.join(repositoryRoot, ".codex/skills", skillName),
      );
    }
    expect(fs.existsSync(path.join(codexHome, "skills", "review-self"))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(codexHome, "skills", "rebase-main"))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(codexHome, "skills", "review-pr"))).toBe(
      false,
    );
  });

  test("fails instead of nesting a link inside an existing directory", () => {
    const codexHome = createTemporaryHome();
    const collision = path.join(
      codexHome,
      "skills",
      "locanara-workflows",
    );
    fs.mkdirSync(collision, { recursive: true });

    const result = runInstaller(codexHome);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("exists and is not a symlink");
    expect(fs.readdirSync(collision)).toEqual([]);
  });
});
