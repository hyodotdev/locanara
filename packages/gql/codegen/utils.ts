/**
 * Shared Utilities for GraphQL Code Generation
 */

import type { TypeInfo } from './types'

// ============================================
// String Utilities
// ============================================

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

/**
 * Convert string to SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
  return toSnakeCase(str).toUpperCase()
}

// ============================================
// Code Generation Utilities
// ============================================

/**
 * Indent lines by a specified number of spaces
 */
export function indent(text: string, spaces: number = 4): string {
  const indentStr = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.trim() ? indentStr + line : line))
    .join('\n')
}

/**
 * Join lines with proper spacing
 */
export function joinLines(lines: string[], separator: string = '\n'): string {
  return lines.filter((line) => line !== null && line !== undefined).join(separator)
}

/**
 * Create a section header comment
 */
export function sectionHeader(title: string, char: string = '='): string {
  const line = char.repeat(44)
  return `// ${line}\n// ${title}\n// ${line}`
}

/**
 * Wrap text in a doc comment
 */
export function docComment(text: string, style: 'jsdoc' | 'swift' | 'kotlin' = 'jsdoc'): string {
  if (!text) return ''

  const lines = text.split('\n')

  switch (style) {
    case 'swift':
      return lines.map((line) => `/// ${line}`).join('\n')
    case 'kotlin':
      if (lines.length === 1) {
        return `/** ${lines[0]} */`
      }
      return `/**\n${lines.map((line) => ` * ${line}`).join('\n')}\n */`
    case 'jsdoc':
    default:
      if (lines.length === 1) {
        return `/** ${lines[0]} */`
      }
      return `/**\n${lines.map((line) => ` * ${line}`).join('\n')}\n */`
  }
}

// ============================================
// Type Utilities
// ============================================

/**
 * Default GraphQL to language type mappings
 */
export const defaultTypeMappings = {
  kotlin: {
    String: 'String',
    Int: 'Int',
    Float: 'Double',
    Boolean: 'Boolean',
    ID: 'String',
  } as Record<string, string>,

  swift: {
    String: 'String',
    Int: 'Int',
    Float: 'Double',
    Boolean: 'Bool',
    ID: 'String',
  } as Record<string, string>,

  dart: {
    String: 'String',
    Int: 'int',
    Float: 'double',
    Boolean: 'bool',
    ID: 'String',
  } as Record<string, string>,

  typescript: {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    ID: 'string',
  } as Record<string, string>,
}

/**
 * Map a GraphQL type to a target language type
 */
export function mapType(
  graphqlType: string,
  mapping: Record<string, string>,
  aliases?: Record<string, string>
): string {
  // Check aliases first
  if (aliases && aliases[graphqlType]) {
    graphqlType = aliases[graphqlType]
  }
  // Then check mapping
  return mapping[graphqlType] || graphqlType
}

// ============================================
// Platform Utilities
// ============================================

/**
 * Check if an item should be included for a target platform
 */
export function shouldIncludeForPlatform(
  itemPlatform: 'Android' | 'iOS' | null | undefined,
  targetPlatform: 'Android' | 'iOS' | null | undefined
): boolean {
  // If no target platform specified, include everything
  if (!targetPlatform) return true
  // If item has no platform, include it (common)
  if (!itemPlatform) return true
  // Otherwise, platforms must match
  return itemPlatform === targetPlatform
}

/**
 * Filter items by platform
 */
export function filterByPlatform<T extends { platform?: 'Android' | 'iOS' | null }>(
  items: T[],
  targetPlatform: 'Android' | 'iOS' | null | undefined
): T[] {
  return items.filter((item) => shouldIncludeForPlatform(item.platform, targetPlatform))
}
