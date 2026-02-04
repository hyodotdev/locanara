/**
 * Kotlin Code Generator Plugin
 *
 * Generates Kotlin data classes, enums, sealed interfaces from GraphQL schema IR.
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
  OperationDef,
  FieldDef,
} from '../types'
import {
  defaultTypeMappings,
  mapType,
  filterByPlatform,
  sectionHeader,
} from '../utils'

export interface KotlinPluginConfig extends PluginConfig {
  packageName: string
  generateResolvers?: boolean
}

/**
 * Convert GraphQL type to Kotlin type
 */
function toKotlinType(
  typeInfo: TypeInfo,
  mapping: Record<string, string>,
  aliases?: Record<string, string>
): string {
  const baseType = mapType(typeInfo.name, mapping, aliases)
  let result = baseType

  if (typeInfo.isList) {
    const itemType = typeInfo.itemNullable ? `${baseType}?` : baseType
    result = `List<${itemType}>`
  }

  if (typeInfo.nullable) {
    result += '?'
  }

  return result
}

/**
 * Generate Kotlin enum
 */
function generateEnum(enumDef: EnumDef): string {
  const lines: string[] = []
  lines.push('@Serializable')
  lines.push(`enum class ${enumDef.name} {`)
  enumDef.values.forEach((value, i) => {
    const comma = i < enumDef.values.length - 1 ? ',' : ''
    lines.push(`    ${value}${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate Kotlin data class for type
 */
function generateDataClass(
  typeDef: ObjectTypeDef,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>
): string {
  if (typeDef.fields.length === 0) return ''

  const lines: string[] = []
  const implementsClause =
    typeDef.implementsUnions.length > 0 ? ` : ${typeDef.implementsUnions.join(', ')}` : ''

  lines.push('@Serializable')
  lines.push(`data class ${typeDef.name}(`)
  typeDef.fields.forEach((field, i) => {
    const kotlinType = toKotlinType(field.type, typeMapping, typeAliases)
    const defaultValue = field.type.nullable ? ' = null' : ''
    const comma = i < typeDef.fields.length - 1 ? ',' : ''
    lines.push(`    val ${field.name}: ${kotlinType}${defaultValue}${comma}`)
  })
  lines.push(`)${implementsClause}`)
  return lines.join('\n')
}

/**
 * Generate Kotlin data class for input type
 */
function generateInputClass(
  inputDef: InputTypeDef,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>
): string {
  if (inputDef.fields.length === 0) return ''

  const lines: string[] = []
  lines.push('@Serializable')
  lines.push(`data class ${inputDef.name}(`)
  inputDef.fields.forEach((field, i) => {
    const kotlinType = toKotlinType(field.type, typeMapping, typeAliases)
    const defaultValue = field.type.nullable ? ' = null' : ''
    const comma = i < inputDef.fields.length - 1 ? ',' : ''
    lines.push(`    val ${field.name}: ${kotlinType}${defaultValue}${comma}`)
  })
  lines.push(')')
  return lines.join('\n')
}

/**
 * Generate sealed interface for union type
 */
function generateUnion(unionDef: UnionDef): string {
  const lines: string[] = []
  lines.push('@Serializable')
  lines.push(`sealed interface ${unionDef.name}`)
  return lines.join('\n')
}

/**
 * Generate resolver interface signatures
 */
function generateResolverSignatures(
  operations: OperationDef[],
  prefix: string,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>
): string[] {
  const lines: string[] = []
  for (const op of operations) {
    const params = op.args
      .map((arg) => `${arg.name}: ${toKotlinType(arg.type, typeMapping, typeAliases)}`)
      .join(', ')
    const returnType = toKotlinType(op.returnType, typeMapping, typeAliases)

    if (op.description) {
      lines.push(`    /** ${op.description} */`)
    }
    lines.push(`    ${prefix} ${op.name}(${params}): ${returnType}`)
    lines.push('')
  }
  return lines
}

/**
 * Generate resolver interfaces
 */
function generateResolvers(
  schema: SchemaIR,
  typeMapping: Record<string, string>,
  typeAliases?: Record<string, string>
): string {
  const lines: string[] = []

  const commonQueries = schema.queries.filter((q) => q.platform === null)
  const androidQueries = schema.queries.filter((q) => q.platform === 'Android')
  const commonMutations = schema.mutations.filter((m) => m.platform === null)
  const androidMutations = schema.mutations.filter((m) => m.platform === 'Android')

  // QueryResolver (common)
  lines.push(sectionHeader('QUERY RESOLVER (Common)'))
  lines.push('')
  lines.push('interface QueryResolver {')
  lines.push(...generateResolverSignatures(commonQueries, 'suspend fun', typeMapping, typeAliases))
  lines.push('}')
  lines.push('')

  // QueryResolverAndroid
  if (androidQueries.length > 0) {
    lines.push(sectionHeader('QUERY RESOLVER (Android)'))
    lines.push('')
    lines.push('interface QueryResolverAndroid : QueryResolver {')
    lines.push(
      ...generateResolverSignatures(androidQueries, 'suspend fun', typeMapping, typeAliases)
    )
    lines.push('}')
    lines.push('')
  }

  // MutationResolver (common)
  lines.push(sectionHeader('MUTATION RESOLVER (Common)'))
  lines.push('')
  lines.push('interface MutationResolver {')
  lines.push(
    ...generateResolverSignatures(commonMutations, 'suspend fun', typeMapping, typeAliases)
  )
  lines.push('}')
  lines.push('')

  // MutationResolverAndroid
  if (androidMutations.length > 0) {
    lines.push(sectionHeader('MUTATION RESOLVER (Android)'))
    lines.push('')
    lines.push('interface MutationResolverAndroid : MutationResolver {')
    lines.push(
      ...generateResolverSignatures(androidMutations, 'suspend fun', typeMapping, typeAliases)
    )
    lines.push('}')
    lines.push('')
  }

  // SubscriptionResolver
  if (schema.subscriptions.length > 0) {
    lines.push(sectionHeader('SUBSCRIPTION RESOLVER'))
    lines.push('')
    lines.push('interface SubscriptionResolver {')
    for (const sub of schema.subscriptions) {
      const params = sub.args
        .map((arg) => `${arg.name}: ${toKotlinType(arg.type, typeMapping, typeAliases)}`)
        .join(', ')
      const returnType = toKotlinType(sub.returnType, typeMapping, typeAliases)
      lines.push(`    fun ${sub.name}(${params}): Flow<${returnType}>`)
      lines.push('')
    }
    lines.push('}')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Kotlin Code Generator Plugin
 */
export const kotlinPlugin: CodegenPlugin = {
  name: 'kotlin',
  language: 'kotlin',

  generate(schema: SchemaIR, config: PluginConfig): string {
    const kotlinConfig = config as KotlinPluginConfig
    const typeMapping = { ...defaultTypeMappings.kotlin, ...config.typeMapping }
    const typeAliases = config.typeAliases || { OnDeviceAIEvent: 'LocanaraEvent' }

    // Include all types (iOS-specific types are needed for common types that reference them)
    // Platform filtering should be done at the file level (in CLI), not at type level
    const enums = schema.enums
    const types = schema.types
    const inputs = schema.inputs
    const unions = schema.unions

    const lines: string[] = []

    // Header
    lines.push('// AUTO-GENERATED FILE - DO NOT EDIT')
    lines.push('// Generated from GraphQL schema')
    lines.push('')
    lines.push(`package ${kotlinConfig.packageName}`)
    lines.push('')
    lines.push('import kotlinx.coroutines.flow.Flow')
    lines.push('import kotlinx.serialization.Serializable')
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
      const code = generateDataClass(typeDef, typeMapping, typeAliases)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Input types
    lines.push(sectionHeader('INPUT TYPES'))
    lines.push('')
    for (const inputDef of inputs) {
      const code = generateInputClass(inputDef, typeMapping, typeAliases)
      if (code) {
        lines.push(code)
        lines.push('')
      }
    }

    // Union types (sealed interfaces)
    lines.push(sectionHeader('UNION TYPES (Sealed Interfaces)'))
    lines.push('')
    for (const unionDef of unions) {
      lines.push(generateUnion(unionDef))
      lines.push('')
    }

    // Resolver interfaces
    if (kotlinConfig.generateResolvers !== false) {
      lines.push(generateResolvers(schema, typeMapping, typeAliases))
    }

    return lines.join('\n')
  },
}

export default kotlinPlugin
