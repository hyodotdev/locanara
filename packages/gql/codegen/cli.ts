#!/usr/bin/env npx tsx
/**
 * GraphQL Code Generator CLI
 *
 * Usage:
 *   npx tsx codegen/cli.ts [options]
 *
 * Options:
 *   --kotlin   Generate Kotlin types
 *   --swift    Generate Swift types
 *   --dart     Generate Dart types
 *   --all      Generate all types (default)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { parseGraphQLFiles } from './parser'
import { transformToIR } from './transformer'
import { kotlinPlugin } from './plugins/kotlin'
import { swiftPlugin } from './plugins/swift'
import { dartPlugin } from './plugins/dart'
import type { KotlinPluginConfig } from './plugins/kotlin'
import type { SwiftPluginConfig } from './plugins/swift'
import type { DartPluginConfig } from './plugins/dart'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const srcDir = join(__dirname, '..', 'src')
const outputDir = join(__dirname, '..', 'src', 'generated')

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

// Parse command line arguments
const args = process.argv.slice(2)
const generateKotlin = args.includes('--kotlin') || args.includes('--all') || args.length === 0
const generateSwift = args.includes('--swift') || args.includes('--all') || args.length === 0
const generateDart = args.includes('--dart') || args.includes('--all') || args.length === 0

console.log('Parsing GraphQL schema files...')

// Parse all GraphQL files once (optimization: avoid re-parsing for each language)
const allParsedFiles = parseGraphQLFiles({
  schemaDir: srcDir,
  extensions: ['.graphql'],
  excludePatterns: [],
})

console.log(`Parsed ${allParsedFiles.length} GraphQL files`)

// Helper to filter parsed files by exclude patterns
function filterByPatterns(files: typeof allParsedFiles, excludePatterns: string[]) {
  if (excludePatterns.length === 0) return files
  return files.filter(
    (f) => !excludePatterns.some((p) => f.filename.replace(/\.graphql$/, '').endsWith(p))
  )
}

// Generate Kotlin (exclude web-specific files)
if (generateKotlin) {
  console.log('\nGenerating Kotlin types...')

  const kotlinFiles = filterByPatterns(allParsedFiles, ['-web'])
  const kotlinSchema = transformToIR(kotlinFiles)

  console.log(`  Schema: ${kotlinSchema.enums.length} enums, ${kotlinSchema.types.length} types`)

  const kotlinConfig: KotlinPluginConfig = {
    outputPath: join(outputDir, 'Types.kt'),
    packageName: 'com.locanara',
    generateResolvers: true,
    typeAliases: { OnDeviceAIEvent: 'LocanaraEvent' },
  }
  const kotlinCode = kotlinPlugin.generate(kotlinSchema, kotlinConfig)
  writeFileSync(kotlinConfig.outputPath, kotlinCode)
  console.log(`  Generated: ${kotlinConfig.outputPath}`)
}

// Generate Swift (exclude Android/web-specific files)
if (generateSwift) {
  console.log('\nGenerating Swift types...')

  const swiftFiles = filterByPatterns(allParsedFiles, ['-android', '-web'])
  const swiftSchema = transformToIR(swiftFiles)

  console.log(`  Schema: ${swiftSchema.enums.length} enums, ${swiftSchema.types.length} types`)

  const swiftConfig: SwiftPluginConfig = {
    outputPath: join(outputDir, 'Types.swift'),
    generateInitializers: true,
  }
  const swiftCode = swiftPlugin.generate(swiftSchema, swiftConfig)
  writeFileSync(swiftConfig.outputPath, swiftCode)
  console.log(`  Generated: ${swiftConfig.outputPath}`)
}

// Generate Dart (exclude web-specific files)
if (generateDart) {
  console.log('\nGenerating Dart types...')

  const dartFiles = filterByPatterns(allParsedFiles, ['-web'])
  const dartSchema = transformToIR(dartFiles)

  console.log(`  Schema: ${dartSchema.enums.length} enums, ${dartSchema.types.length} types`)

  const dartConfig: DartPluginConfig = {
    outputPath: join(outputDir, 'types.dart'),
    useJsonSerializable: true,
  }
  const dartCode = dartPlugin.generate(dartSchema, dartConfig)
  writeFileSync(dartConfig.outputPath, dartCode)
  console.log(`  Generated: ${dartConfig.outputPath}`)
}

console.log('\nDone!')
