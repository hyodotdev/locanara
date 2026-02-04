/**
 * GraphQL Schema Parser
 *
 * Parses GraphQL schema files and returns the AST.
 * Uses graphql-js for robust schema parsing.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse, DocumentNode } from 'graphql'

export interface ParsedFile {
  /** File name */
  filename: string
  /** Parsed AST */
  ast: DocumentNode
  /** Platform derived from filename */
  platform: 'Android' | 'iOS' | null
}

export interface ParserOptions {
  /** Directory containing .graphql files */
  schemaDir: string
  /** File extensions to include */
  extensions?: string[]
  /** File patterns to exclude */
  excludePatterns?: string[]
}

/**
 * Determine platform from filename
 */
function getPlatformFromFilename(filename: string): 'Android' | 'iOS' | null {
  if (filename.includes('-android')) return 'Android'
  if (filename.includes('-ios')) return 'iOS'
  return null
}

/**
 * Check if file should be excluded based on patterns
 * Matches against filename stem (without extension) to avoid false positives
 * e.g., pattern '-web' matches 'schema-web.graphql' but not 'my-webview.graphql'
 */
function shouldExclude(filename: string, patterns: string[]): boolean {
  const stem = filename.replace(/\.graphql$/, '')
  return patterns.some((pattern) => stem.endsWith(pattern))
}

/**
 * Parse all GraphQL files in a directory
 */
export function parseGraphQLFiles(options: ParserOptions): ParsedFile[] {
  const { schemaDir, extensions = ['.graphql'], excludePatterns = [] } = options

  const files = readdirSync(schemaDir).filter((f) => {
    const hasValidExtension = extensions.some((ext) => f.endsWith(ext))
    const isExcluded = shouldExclude(f, excludePatterns)
    return hasValidExtension && !isExcluded
  })

  const parsedFiles: ParsedFile[] = []

  for (const filename of files) {
    const filepath = join(schemaDir, filename)
    const content = readFileSync(filepath, 'utf-8')

    try {
      const ast = parse(content)
      parsedFiles.push({
        filename,
        ast,
        platform: getPlatformFromFilename(filename),
      })
    } catch (error) {
      console.error(`Error parsing ${filename}:`, error)
      throw error
    }
  }

  return parsedFiles
}

/**
 * Parse a single GraphQL string
 */
export function parseGraphQLString(content: string): DocumentNode {
  return parse(content)
}
