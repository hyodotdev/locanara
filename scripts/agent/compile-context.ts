/**
 * Claude Code Context Compiler
 *
 * This script compiles all knowledge files into context files
 * that can be used with Claude Code's --context flag.
 *
 * Usage:
 *   bun run compile
 *
 * Output:
 *   knowledge/_claude-context/context.md
 *   llms.txt
 *   llms-full.txt
 *
 * Then use with Claude Code:
 *   claude --context knowledge/_claude-context/context.md
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import chalk from "chalk";

// ============================================================================
// Configuration
// ============================================================================

import { fileURLToPath } from "url";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  projectRoot: path.resolve(scriptDir, "../.."),
  knowledgeRoot: path.resolve(scriptDir, "../../knowledge"),
  outputDir: path.resolve(scriptDir, "../../knowledge/_claude-context"),
  outputFile: "context.md",
  llmsOutputDir: path.resolve(scriptDir, "../.."),
};

// ============================================================================
// LLMs.txt Generator
// ============================================================================

async function generateLlmsTxt(): Promise<{ quick: number; full: number }> {
  console.log(chalk.blue("\n🤖 Generating llms.txt files...\n"));

  // Read all internal docs for full reference
  const internalFiles = await glob(
    path.join(CONFIG.knowledgeRoot, "internal/**/*.md"),
    { absolute: true }
  );

  // Read all external docs
  const externalFiles = await glob(
    path.join(CONFIG.knowledgeRoot, "external/**/*.md"),
    { absolute: true }
  );

  // Generate llms-full.txt (comprehensive)
  let fullContent = `# Locanara Community SDK Complete Reference

> Locanara: Unified on-device AI SDK for iOS/macOS and Android
> Documentation: https://locanara.com
> Quick Reference: https://locanara.com/llms.txt
> Generated: ${new Date().toISOString()}

## Table of Contents

1. Overview
2. Installation
3. API Reference
4. iOS/macOS (Swift)
5. Android (Kotlin)
6. Internal Guidelines

---

`;

  // Add internal rules
  fullContent += `# Internal Guidelines (MANDATORY)\n\n`;
  fullContent += `These rules define Locanara's development philosophy.\n`;
  fullContent += `**You MUST follow these rules EXACTLY. No exceptions.**\n\n---\n\n`;

  for (const filePath of internalFiles.sort()) {
    const content = fs.readFileSync(filePath, "utf-8");
    const filename = path.basename(filePath, ".md");
    console.log(chalk.magenta(`  📜 Adding ${filename} to llms-full.txt`));
    fullContent += content;
    fullContent += "\n\n---\n\n";
  }

  // Add external docs
  fullContent += `# External API Reference\n\n`;
  fullContent += `Use this documentation for API details.\n\n---\n\n`;

  for (const filePath of externalFiles.sort()) {
    const content = fs.readFileSync(filePath, "utf-8");
    const filename = path.basename(filePath, ".md");
    console.log(chalk.cyan(`  📖 Adding ${filename} to llms-full.txt`));
    fullContent += content;
    fullContent += "\n\n---\n\n";
  }

  // Add links
  fullContent += `## Links & Resources

- Documentation: https://locanara.com
- GitHub: https://github.com/hyodotdev/locanara
- Types Reference: https://locanara.com/docs/types
- APIs Reference: https://locanara.com/docs/apis
`;

  // Generate llms.txt (quick reference)
  const quickContent = `# Locanara Community SDK Quick Reference

> Locanara: On-device AI SDK for iOS/macOS and Android
> Documentation: https://locanara.com
> Full Reference: https://locanara.com/llms-full.txt
> Generated: ${new Date().toISOString()}

## Overview

Locanara provides unified on-device AI capabilities. Privacy-first, no cloud.

## Installation

### iOS (Swift Package Manager)
\`\`\`
https://github.com/hyodotdev/locanara
\`\`\`
Requires: iOS 26+ / macOS 26+

### iOS (CocoaPods)
\`\`\`ruby
pod 'Locanara', '~> 1.0'
\`\`\`

### Android (Gradle)
\`\`\`kotlin
implementation("com.locanara:locanara:1.0.0")
\`\`\`
Requires: Android 14+ (API 34+)

## API (All Platforms)

\`\`\`
getDeviceCapability() -> DeviceCapability
summarize(text, options?) -> String
classify(text, categories) -> String
extract(text, schema) -> String
translate(text, targetLanguage) -> String
rewrite(text, tone) -> String
proofread(text) -> String
chat(messages) -> AsyncStream<String>
describeImage(imageData) -> String
\`\`\`

## iOS Usage

\`\`\`swift
import Locanara

// Check capability
let capability = await Locanara.getDeviceCapability()

// Summarize
let summary = try await Locanara.summarize("Long text...")

// Chat (streaming)
for try await chunk in Locanara.chat(messages: [...]) {
    print(chunk)
}
\`\`\`

## Android Usage

\`\`\`kotlin
import com.locanara.Locanara

// Check capability
val capability = Locanara.getDeviceCapability()

// Summarize
val summary = Locanara.summarize(text = "Long text...")

// Chat (streaming)
Locanara.chat(messages = listOf(...)).collect { chunk ->
    print(chunk)
}
\`\`\`

## Core Types

### DeviceCapability
\`\`\`swift
struct DeviceCapability {
    let tier: Tier                    // .community
    let isAppleIntelligenceAvailable: Bool
    let isFoundationModelsAvailable: Bool
    let supportedFeatures: [Feature]
}
\`\`\`

### Error Handling
\`\`\`swift
enum LocanaraError: Error {
    case notAvailable              // AI not available
    case executionFailed(String)
}
\`\`\`

## Naming Conventions

- Cross-platform: No suffix (\`summarize\`, \`classify\`)
- iOS-only: \`IOS\` suffix (\`getStorefrontIOS\`)
- Android-only: \`Android\` suffix (in cross-platform package)
- Errors: \`Locanara\` prefix (\`LocanaraError\`)

## Links

- Docs: https://locanara.com
- GitHub: https://github.com/hyodotdev/locanara
`;

  // Write files
  const llmsPath = path.join(CONFIG.llmsOutputDir, "llms.txt");
  const llmsFullPath = path.join(CONFIG.llmsOutputDir, "llms-full.txt");

  fs.writeFileSync(llmsPath, quickContent);
  fs.writeFileSync(llmsFullPath, fullContent);

  console.log(chalk.green(`  ✓ llms.txt: ${(quickContent.length / 1024).toFixed(1)} KB`));
  console.log(chalk.green(`  ✓ llms-full.txt: ${(fullContent.length / 1024).toFixed(1)} KB`));

  return { quick: quickContent.length, full: fullContent.length };
}

// ============================================================================
// Main Function
// ============================================================================

async function compileContext(): Promise<void> {
  console.log(chalk.bold.cyan("\n" + "═".repeat(60)));
  console.log(chalk.bold.cyan("📝 Locanara Knowledge Base Compiler"));
  console.log(chalk.bold.cyan("═".repeat(60)));
  console.log(chalk.gray(`\nKnowledge Root: ${CONFIG.knowledgeRoot}`));

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  let output = `# Locanara Project Context

> **Auto-generated for Claude Code**
> Last updated: ${new Date().toISOString()}
>
> Usage: \`claude --context knowledge/_claude-context/context.md\`

---

`;

  // =========================================================================
  // INTERNAL RULES (HIGHEST PRIORITY)
  // =========================================================================

  console.log(chalk.blue("\n📚 Processing Internal Rules...\n"));

  output += `# 🚨 INTERNAL RULES (MANDATORY)

These rules define Locanara's development philosophy.
**You MUST follow these rules EXACTLY. No exceptions.**

---

`;

  const internalFiles = await glob(
    path.join(CONFIG.knowledgeRoot, "internal/**/*.md"),
    { absolute: true }
  );

  for (const filePath of internalFiles.sort()) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(CONFIG.knowledgeRoot, filePath);

    console.log(chalk.magenta(`  📜 ${relativePath}`));

    output += `<!-- Source: ${relativePath} -->\n\n`;
    output += content;
    output += "\n\n---\n\n";
  }

  console.log(chalk.green(`  ✓ ${internalFiles.length} internal files processed`));

  // =========================================================================
  // EXTERNAL API DOCS (REFERENCE)
  // =========================================================================

  console.log(chalk.blue("\n📖 Processing External Docs...\n"));

  output += `# 📚 EXTERNAL API REFERENCE

Use this documentation for API details, but **ALWAYS adapt patterns to match Internal Rules above**.

---

`;

  const externalFiles = await glob(
    path.join(CONFIG.knowledgeRoot, "external/**/*.md"),
    { absolute: true }
  );

  for (const filePath of externalFiles.sort()) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(CONFIG.knowledgeRoot, filePath);

    console.log(chalk.cyan(`  📖 ${relativePath}`));

    output += `<!-- Source: ${relativePath} -->\n\n`;
    output += content;
    output += "\n\n---\n\n";
  }

  console.log(chalk.green(`  ✓ ${externalFiles.length} external files processed`));

  // =========================================================================
  // PROJECT STRUCTURE
  // =========================================================================

  output += `# 📁 PROJECT STRUCTURE

\`\`\`
locanara/
├── packages/
│   ├── apple/              # Swift SDK (SPM + CocoaPods)
│   │   ├── Sources/        # SDK source
│   │   │   ├── Locanara.swift
│   │   │   ├── Types.swift
│   │   │   ├── Errors.swift
│   │   │   └── Features/   # Feature implementations
│   │   ├── Tests/
│   │   └── Example/        # Example app
│   │
│   ├── android/            # Kotlin SDK (Maven Central)
│   │   ├── locanara/       # SDK
│   │   └── example/        # Example app
│   │
│   ├── gql/                # GraphQL schema definitions
│   │   ├── src/            # Schema files
│   │   └── codegen/        # Code generators
│   │
│   └── docs/               # Documentation website
│
├── knowledge/              # Shared knowledge base
│   ├── internal/           # Project philosophy (MANDATORY)
│   └── external/           # External API reference
│
├── scripts/agent/          # RAG agent scripts
│
└── .claude/
    ├── commands/           # Slash commands
    └── guides/             # Project guides
\`\`\`

## Key Reminders

- **packages/apple**: Swift SDK using Foundation Models (iOS 26+/macOS 26+)
- **packages/android**: Kotlin SDK using Gemini Nano (Android 14+)
- **All errors**: Use \`LocanaraError\` prefix
- **Cross-platform functions**: NO platform suffix
- **iOS-specific functions**: MUST end with \`IOS\` suffix

`;

  // =========================================================================
  // Write Output
  // =========================================================================

  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
  fs.writeFileSync(outputPath, output);

  // =========================================================================
  // Generate LLMs.txt Files
  // =========================================================================

  const llmsStats = await generateLlmsTxt();

  // =========================================================================
  // Summary
  // =========================================================================

  console.log(chalk.bold.cyan("\n" + "═".repeat(60)));
  console.log(chalk.bold.cyan("📊 Compilation Summary"));
  console.log(chalk.bold.cyan("═".repeat(60)));
  console.log(chalk.magenta(`  Internal Rules: ${internalFiles.length} files`));
  console.log(chalk.cyan(`  External Docs:  ${externalFiles.length} files`));
  console.log(chalk.white(`  context.md:     ${(output.length / 1024).toFixed(1)} KB`));
  console.log(chalk.white(`  llms.txt:       ${(llmsStats.quick / 1024).toFixed(1)} KB`));
  console.log(chalk.white(`  llms-full.txt:  ${(llmsStats.full / 1024).toFixed(1)} KB`));
  console.log(chalk.green(`\n  ✓ Output: ${outputPath}`));
  console.log(chalk.green(`  ✓ Output: ${path.join(CONFIG.llmsOutputDir, "llms.txt")}`));
  console.log(chalk.green(`  ✓ Output: ${path.join(CONFIG.llmsOutputDir, "llms-full.txt")}`));

  console.log(chalk.bold.green("\n✅ Context compilation complete!\n"));
  console.log(chalk.white("Usage with Claude Code:"));
  console.log(chalk.gray(`  claude --context ${path.relative(CONFIG.projectRoot, outputPath)}\n`));
  console.log(chalk.white("Or in an existing session:"));
  console.log(chalk.gray(`  /context add ${path.relative(CONFIG.projectRoot, outputPath)}\n`));
}

// ============================================================================
// Entry Point
// ============================================================================

compileContext().catch((error) => {
  console.error(chalk.red("\n❌ Compilation failed:"), error);
  process.exit(1);
});
