import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (path: string) => readFileSync(resolve(__dirname, path), "utf-8");

describe("Pipeline documentation contract", () => {
  const apiPage = read("pages/docs/apis/pipeline.tsx");
  const tutorial = read("pages/docs/tutorials/pipeline.tsx");
  const home = read("pages/home/Home.tsx");
  const readme = read("../../../README.md");
  const appleDemo = read(
    "../../apple/Example/LocanaraExample/components/pages/FrameworkShowcase/PipelineDemo.swift"
  );
  const androidDemo = read(
    "../../android/example/src/main/kotlin/com/locanara/example/components/pages/framework/PipelineDemo.kt"
  );

  it("documents native builders without inventing a Web Pipeline API", () => {
    expect(apiPage).toContain('AnchorLink id="web"');
    expect(apiPage).toContain('label: "Web"');
    expect(apiPage).not.toMatch(
      /language:\s*"typescript"[\s\S]*?code:\s*`[^`]*\.pipeline\s*\(/
    );
    expect(apiPage).not.toContain("interface Pipeline<Output>");
    expect(apiPage).toContain("translateStreaming");
  });

  it("states the actual final-output type guarantee", () => {
    expect(apiPage).toContain('AnchorLink id="type-tracking"');
    expect(apiPage).toContain('title="Adjacent steps are runtime composition"');
    expect(tutorial).toContain(
      'title="Final-output tracking, not typed edges"'
    );
  });

  it("keeps real examples for all three README API levels", () => {
    expect(readme).toContain("### Three Levels of API");
    expect(readme).toContain("let summary = try await model.summarize");
    expect(readme).toContain("let chain = SummarizeChain");
    expect(readme).toContain("suspend fun threeLevelsExample()");
    expect(readme).toContain("struct TrimChain: Chain");
    expect(readme).toContain("class TrimChain : Chain");
  });

  it("runs the Pipeline DSL in both native example screens", () => {
    expect(appleDemo).toContain("model.pipeline {");
    expect(appleDemo).not.toMatch(/\.proofread\s*\(\s*[^)\s]/);
    expect(androidDemo).toContain(".pipeline()");
    expect(androidDemo).not.toMatch(/\.proofread\s*\(\s*[^)\s]/);
    expect(home).toContain("model.pipeline {");
    expect(home).not.toContain("ProofreadChain()");
  });
});
