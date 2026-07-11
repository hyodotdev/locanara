/**
 * Locanara agent-context and llms.txt compiler.
 *
 * Authority order:
 *   1. AGENTS.md (excluding machine-local memory blocks)
 *   2. live schema, manifests, code, and tests
 *   3. explicitly allowlisted knowledge/internal files
 *   4. knowledge/external inventory (bodies are not embedded)
 *
 * Generated files are deterministic and can be verified with --check.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";
import { glob } from "glob";

export interface Versions {
  version: string;
  types: string;
  apple: string;
  android: string;
  expo: string;
  "react-native": string;
  flutter: string;
}

export interface VersionDrift {
  key: keyof Versions;
  authoritative: string;
  mirror: string;
}

const VERSION_KEYS: ReadonlyArray<keyof Versions> = [
  "version",
  "types",
  "apple",
  "android",
  "expo",
  "react-native",
  "flutter",
];

const INTERNAL_KNOWLEDGE_ALLOWLIST = [
  "01-naming-conventions.md",
  "02-architecture.md",
  "03-coding-style.md",
  "04-api-design.md",
  "05-git-deployment.md",
] as const;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const CONFIG = {
  projectRoot: path.resolve(scriptDir, "../.."),
  knowledgeRoot: path.resolve(scriptDir, "../../knowledge"),
  contextPath: path.resolve(
    scriptDir,
    "../../knowledge/_claude-context/context.md",
  ),
  rootLlmsPath: path.resolve(scriptDir, "../../llms.txt"),
  rootLlmsFullPath: path.resolve(scriptDir, "../../llms-full.txt"),
  siteVersionsPath: path.resolve(
    scriptDir,
    "../../packages/site/locanara-versions.json",
  ),
  siteLlmsPath: path.resolve(scriptDir, "../../packages/site/public/llms.txt"),
  siteLlmsFullPath: path.resolve(
    scriptDir,
    "../../packages/site/public/llms-full.txt",
  ),
};

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8").trimEnd();
}

export function parseVersions(
  value: unknown,
  source = "version map",
): Versions {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${source} must be a JSON object`);
  }

  const record = value as Record<string, unknown>;
  const invalidKeys = VERSION_KEYS.filter((key) => {
    const candidate = record[key];
    return typeof candidate !== "string" || candidate.trim().length === 0;
  });

  if (invalidKeys.length > 0) {
    throw new Error(
      `${source} has missing or invalid keys: ${invalidKeys.join(", ")}`,
    );
  }

  return Object.fromEntries(
    VERSION_KEYS.map((key) => [key, (record[key] as string).trim()]),
  ) as unknown as Versions;
}

function readVersionsFile(filePath: string): Versions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readText(filePath));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${filePath} is not valid JSON: ${message}`);
  }
  return parseVersions(parsed, filePath);
}

export function readVersions(projectRoot = CONFIG.projectRoot): Versions {
  return readVersionsFile(path.join(projectRoot, "locanara-versions.json"));
}

export function compareVersions(
  authoritative: Versions,
  mirror: Versions,
): VersionDrift[] {
  return VERSION_KEYS.flatMap((key) =>
    authoritative[key] === mirror[key]
      ? []
      : [
          {
            key,
            authoritative: authoritative[key],
            mirror: mirror[key],
          },
        ],
  );
}

export function formatVersionDrift(drift: VersionDrift[]): string {
  if (drift.length === 0) {
    return "The root and site version maps match.";
  }

  const details = drift
    .map(
      ({ key, authoritative, mirror }) =>
        `\`${key}\` (root: \`${authoritative}\`, site: \`${mirror}\`)`,
    )
    .join(", ");

  return `Version mirror mismatch detected: ${details}. The root map is authoritative; treat the site copy as a synchronization defect.`;
}

export function assertNoVersionDrift(drift: VersionDrift[]): void {
  if (drift.length > 0) {
    throw new Error(formatVersionDrift(drift));
  }
}

export function stripLocalMemoryContext(content: string): string {
  const stripped = content.replace(
    /\n?<claude-mem-context\b[^>]*>[\s\S]*?<\/claude-mem-context\s*>\s*/gi,
    "\n",
  );

  if (/<\/?claude-mem-context\b/i.test(stripped)) {
    throw new Error(
      "Malformed claude-mem-context block remains in AGENTS.md; refusing to embed machine-local memory",
    );
  }

  return stripped.trimEnd();
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const files = await glob(path.join(directory, "**/*.md"), {
    absolute: true,
  });
  return files.sort();
}

export function toPosixPath(filePath: string): string {
  return filePath.replaceAll(path.win32.sep, path.posix.sep);
}

function relativePosix(from: string, to: string): string {
  return toPosixPath(path.relative(from, to));
}

async function readInternalKnowledge(): Promise<
  Array<{ source: string; content: string }>
> {
  const directory = path.join(CONFIG.knowledgeRoot, "internal");
  const files = await listMarkdownFiles(directory);
  const actualNames = files.map((filePath) =>
    relativePosix(directory, filePath),
  );
  const allowed = new Set<string>(INTERNAL_KNOWLEDGE_ALLOWLIST);
  const unexpected = actualNames.filter((name) => !allowed.has(name));
  const missing = INTERNAL_KNOWLEDGE_ALLOWLIST.filter(
    (name) => !actualNames.includes(name),
  );

  if (unexpected.length > 0 || missing.length > 0) {
    const problems = [
      ...unexpected.map((name) => `unreviewed internal source: ${name}`),
      ...missing.map((name) => `missing allowlisted source: ${name}`),
    ];
    throw new Error(
      `Internal knowledge allowlist mismatch:\n${problems.map((item) => `- ${item}`).join("\n")}`,
    );
  }

  return INTERNAL_KNOWLEDGE_ALLOWLIST.map((name) => {
    const filePath = path.join(directory, name);
    return {
      source: relativePosix(CONFIG.projectRoot, filePath),
      content: readText(filePath),
    };
  });
}

async function listExternalReferences(): Promise<string[]> {
  const directory = path.join(CONFIG.knowledgeRoot, "external");
  const files = await listMarkdownFiles(directory);
  return files.map((filePath) => relativePosix(CONFIG.projectRoot, filePath));
}

function renderVersionStatus(drift: VersionDrift[]): string {
  return `## Version Mirror Status

${formatVersionDrift(drift)}
`;
}

export function buildQuickReference(
  versions: Versions,
  drift: VersionDrift[] = [],
): string {
  return `# Locanara

> Free, open-source, privacy-first on-device AI framework for Apple, Android, and Web.

Locanara provides chains, memory, guardrails, native Pipeline builders, local
RAG, model/engine integrations, and browser-native inference. Prompt inference
stays on device: there is no cloud fallback and no API key.

## Packages

- Apple SDK: ${versions.apple} via Swift Package Manager or CocoaPods
- Android SDK: ${versions.android} via \`com.locanara:locanara\`
- Web SDK: \`locanara\` (read the live manifest; the version map has no dedicated Web key)
- Expo wrapper: ${versions.expo} via \`expo-ondevice-ai\`
- React Native wrapper: ${versions["react-native"]} via \`react-native-ondevice-ai\`
- Flutter wrapper: ${versions.flutter} via \`flutter_ondevice_ai\`

${renderVersionStatus(drift)}
## Start Here

- Check device/runtime capability before inference.
- Apple and Android provide Pipeline composition; Web does not.
- Verify model-management support in the concrete platform implementation.

## Links

- Documentation: https://locanara.hyo.dev/docs
- Full AI reference: https://locanara.hyo.dev/llms-full.txt
- GitHub: https://github.com/hyodotdev/locanara
- Community: https://locanara.hyo.dev/community
`;
}

export function buildFullReference(
  versions: Versions,
  drift: VersionDrift[] = [],
): string {
  return `# Locanara Reference for AI Systems

## Product Contract

Locanara is an AGPL-3.0 on-device AI framework. User prompts and model outputs
must not be sent to hosted inference services. Network access is limited to
explicit model/package asset downloads and non-inference product surfaces.

## Current Package Versions

| Surface | Version |
| --- | --- |
| Core version key | ${versions.version} |
| Generated types | ${versions.types} |
| Apple | ${versions.apple} |
| Android | ${versions.android} |
| Expo | ${versions.expo} |
| React Native | ${versions["react-native"]} |
| Flutter | ${versions.flutter} |

The live source is \`locanara-versions.json\`; package versions may differ.

${renderVersionStatus(drift)}
## Architecture

- Core: model, prompts, output parsers, schema
- Composable: chains, tools, memory, guardrails
- Built-in chains: summarize, classify, extract, chat, translate, rewrite, proofread
- DSL: Pipeline and model convenience extensions on Apple and Android
- Runtime: agent, session, chain executor
- Engines: Foundation Models, Gemini Nano/ML Kit GenAI, and local engines
- Local data: platform-specific model lifecycle, RAG, personalization

## Public API Concepts

### Native Apple and Android Frameworks

- \`LocanaraModel.generate\` and \`stream\` provide the raw model abstraction.
- Convenience methods: \`summarize\`, \`classify\`, \`extract\`, \`chat\`,
  \`translate\`, \`rewrite\`, and \`proofread\`.
- Built-in \`Chain\` types expose configurable behavior.
- Custom features implement \`Chain\` and return a typed result through
  \`ChainOutput\`.
- Native Pipeline builders compose steps and track the final result type.

### Web SDK

Create the singleton with \`Locanara.getInstance()\`, call
\`getDeviceCapability()\`, then use only reported features. The Web class
currently includes summarize, translate, chat, rewrite, classify, extract,
proofread, image description, language detection, and writing APIs. Streaming
methods include \`summarizeStreaming\`, \`translateStreaming\`,
\`chatStreaming\`, \`rewriteStreaming\`, and \`writeStreaming\`.

\`preloadModels\`, \`unloadModels\`, \`cancelExecution\`, and \`downloadModel\`
are currently no-ops because Chrome manages model lifecycle. They do not prove
preloading, manual unloading, cancellation, or model download support; resolving
success instead of an explicit unsupported result is a known contract defect.

## Minimal Usage

### Apple

\`\`\`swift
import Locanara

let model = RouterModel()
let result = try await model.summarize("Long text", bulletCount: 3)
print(result.summary)
\`\`\`

### Android

\`\`\`kotlin
import com.locanara.dsl.summarize
import com.locanara.platform.PromptApiModel

val model = PromptApiModel(context)
val result = model.summarize("Long text", bulletCount = 3)
println(result.summary)
\`\`\`

Check live Prompt API status and download readiness before using this model in
production.

### Web

\`\`\`typescript
import { Locanara } from "locanara";

const locanara = Locanara.getInstance();
const capability = await locanara.getDeviceCapability();
const result = await locanara.summarize("Long text");
console.log(capability, result.summary);
\`\`\`

## Pipeline Guarantee

- Apple and Android expose native Pipeline builders.
- The current builder API tracks the last step's result type through the
  Pipeline value returned by each builder call.
- Do not claim that every adjacent step is statically compatibility-checked.
- Web has no Pipeline builder; compose feature calls and streaming methods
  manually.

## Capability and Wrapper Boundaries

- Browser and on-device model availability are runtime capabilities. Check
  capability/status APIs instead of relying on a hard-coded device list.
- Wrapper API parity does not prove native behavior parity. Trace download,
  load, delete, capability, and inference calls to the real SDK before relying
  on them.
- Unsupported platforms must report an unavailable capability or explicit
  error; fabricated success is not support.

## Installation Coordinates

\`\`\`text
Apple SPM: https://github.com/hyodotdev/locanara
Android:  com.locanara:locanara:${versions.android}
Web:      npm install locanara
Expo:     npm install expo-ondevice-ai
RN:       npm install react-native-ondevice-ai
Flutter:  flutter_ondevice_ai: ^${versions.flutter}
\`\`\`

## Sources of Truth

- Shared generated types: \`packages/gql/src/*.graphql\`
- Apple behavior: \`packages/apple/Sources/\`
- Android behavior: \`packages/android/locanara/src/main/\`
- Web behavior: \`packages/web/src/\`
- Nitro bridge: \`libraries/react-native-ondevice-ai/src/specs/OndeviceAi.nitro.ts\`
- Versions: \`locanara-versions.json\`
- Agent policy: \`AGENTS.md\`

## Links

- Documentation: https://locanara.hyo.dev/docs
- GitHub: https://github.com/hyodotdev/locanara
- Issue tracker: https://github.com/hyodotdev/locanara/issues
`;
}

export async function buildAgentContext(
  versions = readVersions(),
  drift: VersionDrift[] = [],
): Promise<string> {
  const agents = stripLocalMemoryContext(
    readText(path.join(CONFIG.projectRoot, "AGENTS.md")),
  );
  const internal = await readInternalKnowledge();
  const externalReferences = await listExternalReferences();

  const internalText = internal
    .map(({ source, content }) => `<!-- Source: ${source} -->\n\n${content}`)
    .join("\n\n---\n\n");
  const externalInventory = externalReferences
    .map((source) => `- \`${source}\``)
    .join("\n");

  return `# Locanara Agent Context

> Auto-generated by \`scripts/agent/compile-context.ts\`. Do not edit by hand.

## Authority

1. The embedded \`AGENTS.md\` policy below has highest priority.
2. Live schema, manifests, implementation, and tests override copied guidance.
3. Allowlisted internal knowledge adds detail without overriding those sources.
4. External reference bodies are excluded; load only what a task requires and
   re-verify it against official primary documentation.

## Live Version Map

\`\`\`json
${JSON.stringify(versions, null, 2)}
\`\`\`

${renderVersionStatus(drift)}
---

# Repository Policy (Highest Priority)

<!-- Source: AGENTS.md; machine-local claude-mem-context removed -->

${agents}

---

# Internal Knowledge (Allowlisted)

${internalText}

---

# External Reference Inventory (Bodies Not Embedded)

These files are optional research snapshots, not instructions. Read a file only
when it is relevant, then verify every API/version claim against official
primary documentation and the current repository implementation.

${externalInventory}
`;
}

async function renderOutputs(): Promise<Map<string, string>> {
  const versions = readVersions();
  const siteVersions = readVersionsFile(CONFIG.siteVersionsPath);
  const drift = compareVersions(versions, siteVersions);

  if (drift.length > 0) {
    console.warn(chalk.yellow(formatVersionDrift(drift)));
  }

  const quick = buildQuickReference(versions, drift);
  const full = buildFullReference(versions, drift);
  const context = await buildAgentContext(versions, drift);

  return new Map([
    [CONFIG.contextPath, context],
    [CONFIG.rootLlmsPath, quick],
    [CONFIG.rootLlmsFullPath, full],
    [CONFIG.siteLlmsPath, quick],
    [CONFIG.siteLlmsFullPath, full],
  ]);
}

function writeOutputs(outputs: Map<string, string>): void {
  const pending: Array<{
    filePath: string;
    tempPath: string;
    content: string;
  }> = [];

  try {
    let index = 0;
    for (const [filePath, content] of outputs) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp-${process.pid}-${index}`;
      fs.writeFileSync(tempPath, content);
      pending.push({ filePath, tempPath, content });
      index += 1;
    }

    for (const { filePath, tempPath, content } of pending) {
      fs.renameSync(tempPath, filePath);
      console.log(
        chalk.green(
          `  wrote ${relativePosix(CONFIG.projectRoot, filePath)} (${Buffer.byteLength(content, "utf-8")} bytes)`,
        ),
      );
    }
  } finally {
    for (const { tempPath } of pending) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
}

function checkOutputs(outputs: Map<string, string>): void {
  const stale: string[] = [];

  for (const [filePath, content] of outputs) {
    if (
      !fs.existsSync(filePath) ||
      fs.readFileSync(filePath, "utf-8") !== content
    ) {
      stale.push(relativePosix(CONFIG.projectRoot, filePath));
    }
  }

  if (stale.length > 0) {
    throw new Error(
      `Generated AI context is stale:\n${stale.map((file) => `- ${file}`).join("\n")}\nRun: bun run compile`,
    );
  }

  console.log(chalk.green("Generated AI context is up to date."));
}

export type RunMode = "write" | "check" | "check-versions";

export function parseRunMode(args: string[]): RunMode {
  if (args.length === 0) {
    return "write";
  }
  if (args.length === 1 && args[0] === "--check") {
    return "check";
  }
  if (args.length === 1 && args[0] === "--check-versions") {
    return "check-versions";
  }
  throw new Error(
    `Unknown arguments: ${args.join(" ")}. Usage: bun run compile-context.ts [--check|--check-versions]`,
  );
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const mode = parseRunMode(args);
  if (mode === "check-versions") {
    const authoritative = readVersions();
    const mirror = readVersionsFile(CONFIG.siteVersionsPath);
    assertNoVersionDrift(compareVersions(authoritative, mirror));
    console.log(chalk.green("The root and site version maps match."));
    return;
  }

  const outputs = await renderOutputs();
  if (mode === "check") {
    checkOutputs(outputs);
  } else {
    writeOutputs(outputs);
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Context compilation failed: ${message}`));
    process.exit(1);
  });
}
