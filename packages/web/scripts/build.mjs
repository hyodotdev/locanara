#!/usr/bin/env node

import { execSync } from "child_process";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { minify } from "terser";

console.log("Building Locanara Web SDK...");

// Step 1: Compile TypeScript (for type declarations)
console.log("Compiling TypeScript...");
execSync("npx tsc", { stdio: "inherit" });

// Step 2: Bundle with esbuild
console.log("Bundling...");
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  platform: "browser",
  target: "es2020",
  keepNames: true,
});

// Step 3: Minify with Terser
console.log("Minifying...");
const code = fs.readFileSync("dist/index.js", "utf8");
const result = await minify(code, {
  compress: true,
  mangle: {
    properties: {
      regex: /^_/, // Only mangle private properties
    },
    keep_classnames: true,
    keep_fnames: true,
  },
  format: {
    comments: false,
  },
});

fs.writeFileSync("dist/index.js", result.code);

console.log("Build complete!");
