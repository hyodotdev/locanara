/**
 * AST to IR Transformer
 *
 * Transforms GraphQL AST into our intermediate representation (IR).
 * The IR is language-agnostic and can be consumed by any plugin.
 */

import {
  visit,
  Kind,
  TypeNode,
  DocumentNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql'
import type { ParsedFile } from './parser'
import type {
  SchemaIR,
  TypeInfo,
  FieldDef,
  ArgumentDef,
  EnumDef,
  ObjectTypeDef,
  InputTypeDef,
  UnionDef,
  OperationDef,
} from './types'

/**
 * Parse a GraphQL type node to extract type information
 *
 * Handles nullability correctly:
 * - [String!]  -> nullable list of non-null strings
 * - [String!]! -> non-null list of non-null strings
 * - [String]!  -> non-null list of nullable strings
 * - [String]   -> nullable list of nullable strings
 */
function parseTypeNode(typeNode: TypeNode): TypeInfo {
  let nullable = true
  let itemNullable = true
  let isList = false
  let typeName = ''

  function traverse(node: TypeNode, insideList: boolean = false): void {
    switch (node.kind) {
      case Kind.NON_NULL_TYPE:
        if (insideList) {
          itemNullable = false
        } else {
          nullable = false
        }
        traverse(node.type, insideList)
        break
      case Kind.LIST_TYPE:
        isList = true
        traverse(node.type, true)
        break
      case Kind.NAMED_TYPE:
        typeName = node.name.value
        break
    }
  }

  traverse(typeNode)

  return {
    name: typeName,
    nullable,
    isList,
    itemNullable,
  }
}

/**
 * Transform parsed GraphQL files into a unified Schema IR
 */
export function transformToIR(parsedFiles: ParsedFile[]): SchemaIR {
  const schema: SchemaIR = {
    enums: [],
    types: [],
    inputs: [],
    unions: [],
    queries: [],
    mutations: [],
    subscriptions: [],
  }

  // First pass: collect all definitions
  for (const file of parsedFiles) {
    extractDefinitions(file.ast, schema, file.platform)
  }

  // Second pass: build union membership map and update types
  const typeToUnions = new Map<string, string[]>()
  for (const union of schema.unions) {
    for (const memberType of union.members) {
      if (!typeToUnions.has(memberType)) {
        typeToUnions.set(memberType, [])
      }
      typeToUnions.get(memberType)!.push(union.name)
    }
  }

  // Update types with their union memberships
  for (const type of schema.types) {
    type.implementsUnions = typeToUnions.get(type.name) || []
  }

  return schema
}

/**
 * Extract definitions from a GraphQL AST
 */
function extractDefinitions(
  ast: DocumentNode,
  schema: SchemaIR,
  platform: 'Android' | 'iOS' | null
): void {
  visit(ast, {
    EnumTypeDefinition(node) {
      schema.enums.push({
        name: node.name.value,
        values: node.values?.map((v) => v.name.value) || [],
        description: node.description?.value,
        platform,
      })
    },

    ObjectTypeDefinition(node) {
      const name = node.name.value
      // Skip root types - they're handled separately
      if (['Query', 'Mutation', 'Subscription'].includes(name)) return

      schema.types.push({
        name,
        fields: extractFields(node.fields),
        description: node.description?.value,
        implementsUnions: [], // Will be populated in second pass
        platform,
      })
    },

    InputObjectTypeDefinition(node) {
      schema.inputs.push({
        name: node.name.value,
        fields: extractFields(node.fields),
        description: node.description?.value,
        platform,
      })
    },

    UnionTypeDefinition(node) {
      schema.unions.push({
        name: node.name.value,
        members: node.types?.map((t) => t.name.value) || [],
        description: node.description?.value,
        platform,
      })
    },

    ObjectTypeExtension(node) {
      const name = node.name.value
      if (name === 'Query') {
        extractOperations(node.fields, schema.queries, platform)
      } else if (name === 'Mutation') {
        extractOperations(node.fields, schema.mutations, platform)
      } else if (name === 'Subscription') {
        extractOperations(node.fields, schema.subscriptions, platform)
      }
    },
  })
}

/**
 * Extract fields from field definitions
 */
function extractFields(
  fieldDefs: readonly (FieldDefinitionNode | InputValueDefinitionNode)[] | undefined
): FieldDef[] {
  if (!fieldDefs) return []

  return fieldDefs.map((field) => {
    const typeInfo = parseTypeNode(field.type)
    return {
      name: field.name.value,
      type: typeInfo,
      description: field.description?.value,
    }
  })
}

/**
 * Extract operations (queries/mutations/subscriptions)
 */
function extractOperations(
  fieldDefs: readonly FieldDefinitionNode[] | undefined,
  target: OperationDef[],
  platform: 'Android' | 'iOS' | null
): void {
  if (!fieldDefs) return

  for (const field of fieldDefs) {
    const returnType = parseTypeNode(field.type)

    const args: ArgumentDef[] = (field.arguments || []).map((arg: InputValueDefinitionNode) => {
      const typeInfo = parseTypeNode(arg.type)
      return {
        name: arg.name.value,
        type: typeInfo,
        description: arg.description?.value,
      }
    })

    target.push({
      name: field.name.value,
      args,
      returnType,
      description: field.description?.value,
      platform,
    })
  }
}
