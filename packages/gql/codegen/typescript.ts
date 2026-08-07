import { codegen } from "@graphql-codegen/core";
import * as typescriptPlugin from "@graphql-codegen/typescript";
import { concatAST, parse } from "graphql";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = join(packageRoot, "src");
const outputDirectory = join(schemaDirectory, "generated");
const outputPath = join(outputDirectory, "types.ts");

async function findSchemaFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) return findSchemaFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".graphql")
        ? [entryPath]
        : [];
    }),
  );
  return files.flat();
}

const schemaFiles = (await findSchemaFiles(schemaDirectory)).sort();

const schemaDocuments = await Promise.all(
  schemaFiles.map(async (filePath) => parse(await readFile(filePath, "utf8"))),
);

const output = await codegen({
  filename: outputPath,
  schema: concatAST(schemaDocuments),
  documents: [],
  config: {
    skipTypename: false,
    enumsAsTypes: true,
    scalars: {
      ID: "string",
      Float: "number",
    },
  },
  plugins: [{ typescript: {} }],
  pluginMap: {
    typescript: typescriptPlugin,
  },
});

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, output, "utf8");
console.log(`Generated ${outputPath}`);
