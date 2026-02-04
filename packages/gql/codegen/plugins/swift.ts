/**
 * Swift Code Generator Plugin
 *
 * Generates Swift structs, enums from GraphQL schema IR.
 */

import type {
  SchemaIR,
  PluginConfig,
  CodegenPlugin,
  TypeInfo,
  EnumDef,
  ObjectTypeDef,
  InputTypeDef,
  UnionDef,
  FieldDef,
} from '../types'
import { defaultTypeMappings, mapType, toCamelCase } from '../utils'

export interface SwiftPluginConfig extends PluginConfig {
  generateInitializers?: boolean
}

/**
 * Convert SCREAMING_SNAKE_CASE to camelCase for Swift enum cases
 */
function toSwiftCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Check if a type name is Android-specific (should be excluded from Swift)
 */
function isAndroidType(typeName: string): boolean {
  return typeName.endsWith('Android') || typeName.startsWith('Android')
}

/**
 * Convert GraphQL type to Swift type
 */
function toSwiftType(
  typeInfo: TypeInfo,
  mapping: Record<string, string>,
  aliases?: Record<string, string>
): string {
  const baseType = mapType(typeInfo.name, mapping, aliases)
  let result = baseType

  if (typeInfo.isList) {
    result = `[${baseType}]`
  }

  if (typeInfo.nullable) {
    result += '?'
  }

  return result
}

/**
 * Generate Swift enum
 */
function generateEnum(enumDef: EnumDef): string {
  const lines: string[] = []
  lines.push(
    `public enum ${enumDef.name}: String, Codable, CaseIterable, Sendable {`
  )
  for (const value of enumDef.values) {
    const swiftCase = toSwiftCase(value)
    lines.push(`    case ${swiftCase} = "${value}"`)
  }
  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate Swift struct for type
 */
function generateStruct(
  typeDef: ObjectTypeDef,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>,
  generateInitializer: boolean = true
): string {
  // Filter out Android-specific fields
  const fields = typeDef.fields.filter((f) => !isAndroidType(f.type.name))
  if (fields.length === 0) return ''

  const lines: string[] = []
  lines.push(`public struct ${typeDef.name}: Codable, Sendable {`)

  // Properties
  for (const field of fields) {
    const swiftType = toSwiftType(field.type, typeMapping, typeAliases)
    lines.push(`    public var ${field.name}: ${swiftType}`)
  }
  lines.push('')

  // Initializer
  if (generateInitializer) {
    lines.push(`    public init(`)
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const swiftType = toSwiftType(field.type, typeMapping, typeAliases)
      const defaultValue = field.type.nullable ? ' = nil' : ''
      const comma = i < fields.length - 1 ? ',' : ''
      lines.push(`        ${field.name}: ${swiftType}${defaultValue}${comma}`)
    }
    lines.push(`    ) {`)
    for (const field of fields) {
      lines.push(`        self.${field.name} = ${field.name}`)
    }
    lines.push(`    }`)
  }

  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate Swift enum for union type (with associated values)
 */
function generateUnion(unionDef: UnionDef): string {
  // Filter out Android-specific types from union
  const types = unionDef.members.filter((t) => !isAndroidType(t))
  if (types.length === 0) return ''

  const lines: string[] = []
  lines.push(`public enum ${unionDef.name}: Sendable {`)
  for (const typeName of types) {
    // Create camelCase case name by removing "Result" suffix for cleaner API
    // Examples: SummarizeResult -> summarize, ClassifyResult -> classify
    // Events keep their suffix: CapabilityChangedEvent -> capabilityChangedEvent
    let caseName = typeName.replace(/Result$/, '')
    caseName = caseName.charAt(0).toLowerCase() + caseName.slice(1)
    lines.push(`    case ${caseName}(${typeName})`)
  }
  lines.push('}')
  return lines.join('\n')
}

/**
 * Swift Code Generator Plugin
 */
export const swiftPlugin: CodegenPlugin = {
  name: 'swift',
  language: 'swift',

  generate(schema: SchemaIR, config: PluginConfig): string {
    const swiftConfig = config as SwiftPluginConfig
    const typeMapping = { ...defaultTypeMappings.swift, ...config.typeMapping }
    const generateInitializer = swiftConfig.generateInitializers !== false

    // Filter by platform (exclude Android-specific, include iOS and common)
    const enums = schema.enums.filter(
      (e) => e.platform === null || e.platform === 'iOS'
    )
    const types = schema.types.filter((t) => {
      if (t.platform === 'Android') return false
      if (isAndroidType(t.name)) return false
      return true
    })
    const inputs = schema.inputs.filter((i) => {
      if (i.platform === 'Android') return false
      if (isAndroidType(i.name)) return false
      return true
    })
    const unions = schema.unions.filter(
      (u) => u.platform === null || u.platform === 'iOS'
    )

    const lines: string[] = []

    // Header
    lines.push('// AUTO-GENERATED FILE - DO NOT EDIT')
    lines.push('// Generated from GraphQL schema')
    lines.push('')
    lines.push('import Foundation')
    lines.push('')

    // Enums
    lines.push('// MARK: - Enums')
    lines.push('')
    for (const enumDef of enums) {
      lines.push(generateEnum(enumDef))
      lines.push('')
    }

    // Types
    lines.push('// MARK: - Types')
    lines.push('')
    for (const typeDef of types) {
      const code = generateStruct(typeDef, typeMapping, config.typeAliases, generateInitializer)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Input types
    lines.push('// MARK: - Input Types')
    lines.push('')
    for (const inputDef of inputs) {
      const struct: ObjectTypeDef = {
        name: inputDef.name,
        fields: inputDef.fields,
        implementsUnions: [],
        platform: inputDef.platform,
      }
      const code = generateStruct(struct, typeMapping, config.typeAliases, generateInitializer)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Union types
    if (unions.length > 0) {
      lines.push('// MARK: - Union Types')
      lines.push('')
      for (const unionDef of unions) {
        const code = generateUnion(unionDef)
        if (code) {
          lines.push(code)
          lines.push('')
        }
      }
    }

    return lines.join('\n')
  },
}

export default swiftPlugin
