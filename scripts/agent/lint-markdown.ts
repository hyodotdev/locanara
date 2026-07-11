#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { CONFIG, stripLocalMemoryContext } from "./compile-context";

const MAINTAINED_GLOBS = [
  "SKILLS_INDEX.md",
  ".claude/commands/*.md",
  ".claude/guides/*.md",
  ".claude/knowledge/*.md",
  ".codex/skills/**/*.md",
  "knowledge/README.md",
  "knowledge/internal/*.md",
  "knowledge/external/*.md",
];

function runMarkdownlint(args: string[], stdin?: string): number {
  const result = Bun.spawnSync(["bunx", "markdownlint-cli2", ...args], {
    cwd: CONFIG.projectRoot,
    stdin: stdin === undefined ? undefined : Buffer.from(stdin),
    stdout: "inherit",
    stderr: "inherit",
  });
  return result.exitCode;
}

const maintainedExit = runMarkdownlint(MAINTAINED_GLOBS);
if (maintainedExit !== 0) {
  process.exit(maintainedExit);
}

const policy = stripLocalMemoryContext(
  fs.readFileSync(path.join(CONFIG.projectRoot, "AGENTS.md"), "utf-8"),
);
process.exit(runMarkdownlint(["-"], `${policy}\n`));
