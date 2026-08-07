import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (path: string) => readFileSync(resolve(__dirname, path), "utf-8");

describe("Pipeline documentation contract", () => {
  const apiPage = read("pages/docs/apis/pipeline.tsx");
  const tutorial = read("pages/docs/tutorials/pipeline.tsx");
  const readme = read("../../../README.md");
  const appleDemo = read(
    "../../apple/Example/LocanaraExample/components/pages/FrameworkShowcase/PipelineDemo.swift"
  );
  const androidDemo = read(
    "../../android/example/src/main/kotlin/com/locanara/example/components/pages/framework/PipelineDemo.kt"
  );

  it("documents native builders without inventing a Web Pipeline API", () => {
    expect(apiPage).toMatch(/currently have no\s+Pipeline builder/);
    expect(apiPage).not.toContain("const pipeline = model.pipeline");
    expect(apiPage).not.toContain("interface Pipeline<Output>");
    expect(apiPage).toContain("translateStreaming");
  });

  it("states the actual final-output type guarantee", () => {
    expect(apiPage).toContain("final result type");
    expect(apiPage).toContain("cannot prove");
    expect(tutorial).toContain("Final-output tracking, not typed edges");
  });

  it("keeps real examples for all three README API levels", () => {
    expect(readme).toContain("### Three Levels of API");
    expect(readme).toContain("let summary = try await model.summarize");
    expect(readme).toContain("let chain = SummarizeChain");
    expect(readme).toContain("struct TrimChain: Chain");
    expect(readme).toContain("class TrimChain : Chain");
  });

  it("runs the Pipeline DSL in both native example screens", () => {
    expect(appleDemo).toContain("model.pipeline {");
    expect(appleDemo).not.toContain("model.proofread(inputText)");
    expect(androidDemo).toContain(".pipeline()");
    expect(androidDemo).not.toContain("model.proofread(inputText)");
  });
});
