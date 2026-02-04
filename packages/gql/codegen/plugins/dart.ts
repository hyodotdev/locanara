/**
 * Dart Code Generator Plugin
 *
 * Generates Dart classes and enums from GraphQL schema IR.
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
import { defaultTypeMappings, mapType, sectionHeader } from '../utils'

export interface DartPluginConfig extends PluginConfig {
  useJsonSerializable?: boolean
}

/**
 * Convert SCREAMING_SNAKE_CASE to camelCase for Dart enum values
 */
function toDartCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert GraphQL type to Dart type
 */
function toDartType(
  typeInfo: TypeInfo,
  mapping: Record<string, string>,
  aliases?: Record<string, string>
): string {
  const baseType = mapType(typeInfo.name, mapping, aliases)
  let result = baseType

  if (typeInfo.isList) {
    result = `List<${baseType}>`
  }

  if (typeInfo.nullable) {
    result += '?'
  }

  return result
}

/**
 * Generate Dart enum
 */
function generateEnum(enumDef: EnumDef): string {
  const lines: string[] = []
  lines.push(`enum ${enumDef.name} {`)
  for (let i = 0; i < enumDef.values.length; i++) {
    const value = enumDef.values[i]
    const dartCase = toDartCase(value)
    const comma = i < enumDef.values.length - 1 ? ',' : ';'
    lines.push(`  @JsonValue('${value}')`)
    lines.push(`  ${dartCase}${comma}`)
  }
  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate Dart class for type
 */
function generateClass(
  typeDef: ObjectTypeDef,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>
): string {
  if (typeDef.fields.length === 0) return ''

  const lines: string[] = []
  lines.push(`@JsonSerializable()`)
  lines.push(`class ${typeDef.name} {`)

  // Fields
  for (const field of typeDef.fields) {
    const dartType = toDartType(field.type, typeMapping, typeAliases)
    lines.push(`  final ${dartType} ${field.name};`)
  }
  lines.push('')

  // Constructor
  lines.push(`  ${typeDef.name}({`)
  for (const field of typeDef.fields) {
    const required = field.type.nullable ? '' : 'required '
    lines.push(`    ${required}this.${field.name},`)
  }
  lines.push(`  });`)
  lines.push('')

  // fromJson/toJson
  lines.push(`  factory ${typeDef.name}.fromJson(Map<String, dynamic> json) =>`)
  lines.push(`      _$${typeDef.name}FromJson(json);`)
  lines.push('')
  lines.push(`  Map<String, dynamic> toJson() => _$${typeDef.name}ToJson(this);`)
  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate sealed class for union type
 */
function generateUnion(unionDef: UnionDef): string {
  const lines: string[] = []
  lines.push(`sealed class ${unionDef.name} {}`)
  return lines.join('\n')
}

/**
 * Dart Code Generator Plugin
 */
export const dartPlugin: CodegenPlugin = {
  name: 'dart',
  language: 'dart',

  generate(schema: SchemaIR, config: PluginConfig): string {
    const typeMapping = { ...defaultTypeMappings.dart, ...config.typeMapping }

    // Include all types (platform filtering is done at file level in CLI)
    const enums = schema.enums
    const types = schema.types
    const inputs = schema.inputs
    const unions = schema.unions

    const lines: string[] = []

    // Header
    lines.push('// AUTO-GENERATED FILE - DO NOT EDIT')
    lines.push('// Generated from GraphQL schema')
    lines.push('')
    lines.push("import 'package:json_annotation/json_annotation.dart';")
    lines.push('')
    lines.push("part 'types.g.dart';")
    lines.push('')

    // Enums
    lines.push(sectionHeader('ENUMS'))
    lines.push('')
    for (const enumDef of enums) {
      lines.push(generateEnum(enumDef))
      lines.push('')
    }

    // Types
    lines.push(sectionHeader('TYPES'))
    lines.push('')
    for (const typeDef of types) {
      const code = generateClass(typeDef, typeMapping, config.typeAliases)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Input types
    lines.push(sectionHeader('INPUT TYPES'))
    lines.push('')
    for (const inputDef of inputs) {
      const classType: ObjectTypeDef = {
        name: inputDef.name,
        fields: inputDef.fields,
        implementsUnions: [],
        platform: inputDef.platform,
      }
      const code = generateClass(classType, typeMapping, config.typeAliases)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Union types
    if (unions.length > 0) {
      lines.push(sectionHeader('UNION TYPES'))
      lines.push('')
      for (const unionDef of unions) {
        lines.push(generateUnion(unionDef))
        lines.push('')
      }
    }

    return lines.join('\n')
  },
}

export default dartPlugin
