import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "../..");

function readRepositoryFile(relativePath: string): string {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("review workflow fallback contract", () => {
  test("review-pr replaces unavailable automated review coverage", () => {
    const reviewPr = normalizeWhitespace(
      readRepositoryFile(".claude/commands/review-pr.md"),
    );

    expect(reviewPr).toContain("### Automated Reviewer Fallback");
    expect(reviewPr).toContain("one complete `$review-self` round");
    expect(reviewPr).toContain(
      "Reviewer unavailability alone is neither a blocker nor a clean result",
    );
    expect(reviewPr).toContain(
      "Cache clean fallback coverage by reviewer failure set and head SHA",
    );
    expect(reviewPr).toContain("### Bounded Reviewer Polling");
    expect(reviewPr).toContain(
      "headRefOid,reviewDecision,reviewRequests,latestReviews,statusCheckRollup,updatedAt",
    );
    expect(reviewPr).toContain(
      "Use the product's real wake-up mechanism to re-enter",
    );
    expect(reviewPr).toContain("Stop after 12 unchanged polls");
  });

  test("review-pr skill owns exact-head five-minute monitoring", () => {
    const reviewPrSkill = normalizeWhitespace(
      readRepositoryFile(".codex/skills/review-pr/SKILL.md"),
    );

    expect(reviewPrSkill).toContain("## Recheck Every Five Minutes");
    expect(reviewPrSkill).toContain("Finish after two complete clean snapshots");
    expect(reviewPrSkill).toContain("head SHA");
    expect(reviewPrSkill).toContain("invoke `$review-self`");
  });

  test("review-self provides a non-recursive single-round fallback", () => {
    const reviewSelf = normalizeWhitespace(
      readRepositoryFile(".codex/skills/review-self/SKILL.md"),
    );

    expect(reviewSelf).toContain("## Act As A Review-PR Fallback");
    expect(reviewSelf).toContain("Run exactly one complete review round");
    expect(reviewSelf).toContain("Do not re-enter `review-pr`");
    expect(reviewSelf).toContain(
      "`review-pr` remains the sole thread-handling and polling owner",
    );
  });

  test("Codex and Claude expose the same Locanara workflow surface", () => {
    const codexRouter = readRepositoryFile(
      ".codex/skills/locanara-workflows/SKILL.md",
    );
    const claudeRouter = readRepositoryFile(
      ".claude/skills/locanara-workflows/SKILL.md",
    );
    const claudeReviewSelf = readRepositoryFile(
      ".claude/skills/review-self/SKILL.md",
    );
    const claudeReviewPr = readRepositoryFile(
      ".claude/skills/review-pr/SKILL.md",
    );

    expect(codexRouter).toContain("single-round `$review-self` fallback");
    expect(claudeRouter).toContain(
      ".codex/skills/locanara-workflows/SKILL.md",
    );
    expect(claudeReviewSelf).toContain(
      ".codex/skills/review-self/SKILL.md",
    );
    expect(claudeReviewPr).toContain(".codex/skills/review-pr/SKILL.md");
  });
});
