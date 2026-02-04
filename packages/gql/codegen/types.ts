/**
 * Intermediate Representation (IR) Types for GraphQL Code Generation
 *
 * These types represent the parsed and transformed GraphQL schema
 * in a language-agnostic format that plugins can consume.
 */

// ============================================
// Type Information
// ============================================

export interface TypeInfo {
  /** The base type name (e.g., "String", "Int", "CustomType") */
  name: string
  /** Whether the type/list is nullable */
  nullable: boolean
  /** Whether this is a list type */
  isList: boolean
  /** Whether list items are nullable (only relevant if isList is true) */
  itemNullable: boolean
}

// ============================================
// Field Definitions
// ============================================

export interface FieldDef {
  /** Field name */
  name: string
  /** Type information */
  type: TypeInfo
  /** Optional description from GraphQL comments */
  description?: string
  /** Default value if specified */
  defaultValue?: string
}

export interface ArgumentDef {
  /** Argument name */
  name: string
  /** Type information */
  type: TypeInfo
  /** Optional description */
  description?: string
  /** Default value if specified */
  defaultValue?: string
}

// ============================================
// Type Definitions
// ============================================

export interface EnumDef {
  /** Enum name */
  name: string
  /** Enum values */
  values: string[]
  /** Optional description */
  description?: string
  /** Platform filter (null = all platforms) */
  platform?: 'Android' | 'iOS' | null
}

export interface ObjectTypeDef {
  /** Type name */
  name: string
  /** Fields */
  fields: FieldDef[]
  /** Optional description */
  description?: string
  /** Union types this type belongs to */
  implementsUnions: string[]
  /** Platform filter */
  platform?: 'Android' | 'iOS' | null
}

export interface InputTypeDef {
  /** Input type name */
  name: string
  /** Fields */
  fields: FieldDef[]
  /** Optional description */
  description?: string
  /** Platform filter */
  platform?: 'Android' | 'iOS' | null
}

export interface UnionDef {
  /** Union name */
  name: string
  /** Member type names */
  members: string[]
  /** Optional description */
  description?: string
  /** Platform filter */
  platform?: 'Android' | 'iOS' | null
}

// ============================================
// Operation Definitions
// ============================================

export interface OperationDef {
  /** Operation name */
  name: string
  /** Arguments/parameters */
  args: ArgumentDef[]
  /** Return type */
  returnType: TypeInfo
  /** Optional description */
  description?: string
  /** Platform filter */
  platform?: 'Android' | 'iOS' | null
}

// ============================================
// Schema IR
// ============================================

export interface SchemaIR {
  /** Enum definitions */
  enums: EnumDef[]
  /** Object type definitions */
  types: ObjectTypeDef[]
  /** Input type definitions */
  inputs: InputTypeDef[]
  /** Union type definitions */
  unions: UnionDef[]
  /** Query operations */
  queries: OperationDef[]
  /** Mutation operations */
  mutations: OperationDef[]
  /** Subscription operations */
  subscriptions: OperationDef[]
}

// ============================================
// Plugin Configuration
// ============================================

export interface PluginConfig {
  /** Output file path */
  outputPath: string
  /** Package/module name */
  packageName?: string
  /** Additional type mappings */
  typeMapping?: Record<string, string>
  /** Type aliases for undefined types */
  typeAliases?: Record<string, string>
  /** Whether to generate resolver interfaces */
  generateResolvers?: boolean
  /** Platform to filter for (null = all) */
  platform?: 'Android' | 'iOS' | null
}

// ============================================
// Plugin Interface
// ============================================

export interface CodegenPlugin {
  /** Plugin name */
  name: string
  /** Target language */
  language: string
  /** Generate code from schema IR */
  generate(schema: SchemaIR, config: PluginConfig): string
}
