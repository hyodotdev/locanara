# API Naming & Code Conventions

## Language-Specific Conventions

### Swift (Apple SDK)

- **Types**: PascalCase (`LocanaraClient`, `FeatureRequest`)
- **Properties/Methods**: camelCase (`summarize()`, `isAvailable`)
- **Constants**: camelCase or UPPER_SNAKE_CASE for global constants

### Kotlin (Gemini SDK)

- **Types**: PascalCase (`LocanaraClient`, `FeatureRequest`)
- **Properties/Methods**: camelCase (`summarize()`, `isAvailable`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TOKEN_COUNT`)

### TypeScript (GQL Package)

- ESM modules (`import`/`export`)
- Strict mode enabled
- Interface names without `I` prefix

## Feature API Naming

The SDK exposes consistent high-level functions across platforms:

| Function      | Purpose                       |
| ------------- | ----------------------------- |
| `summarize()` | Text summarization            |
| `classify()`  | Text classification           |
| `extract()`   | Entity/information extraction |
| `chat()`      | Conversational AI             |

## Type Naming

Types generated from GraphQL follow these patterns:

- Input types: `{Name}Input` (e.g., `SummarizeInput`)
- Response types: `{Name}Response` (e.g., `SummarizeResponse`)
- Enums: PascalCase singular (e.g., `ModelCapability`)
