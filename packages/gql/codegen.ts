import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/**/*.graphql',
  generates: {
    'src/generated/types.ts': {
      plugins: ['typescript'],
      config: {
        skipTypename: false,
        enumsAsTypes: true,
        scalars: {
          ID: 'string',
          Float: 'number',
        },
      },
    },
  },
}

export default config
