/**
 * Locanara GraphQL Code Generator
 *
 * Main entry point for generating type-safe code from GraphQL schema.
 * Uses a modular plugin architecture for multi-language support.
 */

// Core types
export type {
  SchemaIR,
  TypeInfo,
  FieldDef,
  ArgumentDef,
  EnumDef,
  ObjectTypeDef,
  InputTypeDef,
  UnionDef,
  OperationDef,
  PluginConfig,
  CodegenPlugin,
} from './types'

// Parser
export { parseGraphQLFiles, parseGraphQLString, type ParsedFile, type ParserOptions } from './parser'

// Transformer
export { transformToIR } from './transformer'

// Utilities
export {
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  toScreamingSnakeCase,
  indent,
  joinLines,
  sectionHeader,
  docComment,
  defaultTypeMappings,
  mapType,
  shouldIncludeForPlatform,
  filterByPlatform,
} from './utils'

// Plugins
export { kotlinPlugin, type KotlinPluginConfig } from './plugins/kotlin'
export { swiftPlugin, type SwiftPluginConfig } from './plugins/swift'
export { dartPlugin, type DartPluginConfig } from './plugins/dart'

import { parseGraphQLFiles, type ParserOptions } from './parser'
import { transformToIR } from './transformer'
import type { SchemaIR, PluginConfig, CodegenPlugin } from './types'
import { kotlinPlugin } from './plugins/kotlin'
import { swiftPlugin } from './plugins/swift'
import { dartPlugin } from './plugins/dart'

/**
 * Available built-in plugins
 */
export const plugins: Record<string, CodegenPlugin> = {
  kotlin: kotlinPlugin,
  swift: swiftPlugin,
  dart: dartPlugin,
}

/**
 * Generate code configuration
 */
export interface GenerateConfig {
  /** Directory containing GraphQL schema files */
  schemaDir: string
  /** File extensions to include */
  extensions?: string[]
  /** File patterns to exclude */
  excludePatterns?: string[]
  /** Plugins to run */
  plugins: Array<{
    /** Plugin name or instance */
    plugin: string | CodegenPlugin
    /** Plugin configuration */
    config: PluginConfig
  }>
}

/**
 * Generate code result
 */
export interface GenerateResult {
  /** Plugin name */
  plugin: string
  /** Output path */
  outputPath: string
  /** Generated code */
  code: string
}

/**
 * Generate code from GraphQL schema
 */
export function generate(config: GenerateConfig): GenerateResult[] {
  // Parse GraphQL files
  const parserOptions: ParserOptions = {
    schemaDir: config.schemaDir,
    extensions: config.extensions,
    excludePatterns: config.excludePatterns,
  }
  const parsedFiles = parseGraphQLFiles(parserOptions)

  // Transform to IR
  const schema = transformToIR(parsedFiles)

  // Run plugins
  const results: GenerateResult[] = []
  for (const pluginConfig of config.plugins) {
    const plugin =
      typeof pluginConfig.plugin === 'string'
        ? plugins[pluginConfig.plugin]
        : pluginConfig.plugin

    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginConfig.plugin}`)
    }

    const code = plugin.generate(schema, pluginConfig.config)
    results.push({
      plugin: plugin.name,
      outputPath: pluginConfig.config.outputPath,
      code,
    })
  }

  return results
}

/**
 * Generate code from schema IR directly
 */
export function generateFromIR(
  schema: SchemaIR,
  pluginConfigs: Array<{
    plugin: string | CodegenPlugin
    config: PluginConfig
  }>
): GenerateResult[] {
  const results: GenerateResult[] = []
  for (const pluginConfig of pluginConfigs) {
    const plugin =
      typeof pluginConfig.plugin === 'string'
        ? plugins[pluginConfig.plugin]
        : pluginConfig.plugin

    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginConfig.plugin}`)
    }

    const code = plugin.generate(schema, pluginConfig.config)
    results.push({
      plugin: plugin.name,
      outputPath: pluginConfig.config.outputPath,
      code,
    })
  }

  return results
}
