import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { parseGraphQLFiles } from './parser'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('parseGraphQLFiles', () => {
  test('returns schema files in deterministic filename order', () => {
    const schemaDirectory = mkdtempSync(join(tmpdir(), 'locanara-gql-parser-'))
    temporaryDirectories.push(schemaDirectory)

    writeFileSync(join(schemaDirectory, 'zeta.graphql'), 'type Zeta { value: String! }')
    writeFileSync(join(schemaDirectory, 'alpha.graphql'), 'type Alpha { value: String! }')
    writeFileSync(join(schemaDirectory, 'ignored.txt'), 'not GraphQL')

    const filenames = parseGraphQLFiles({ schemaDir: schemaDirectory }).map(
      ({ filename }) => filename
    )

    expect(filenames).toEqual(['alpha.graphql', 'zeta.graphql'])
  })
})
