# /locanara

Main entry point for the Locanara project.

## Description

Locanara is a cross-platform on-device AI SDK based on Apple Intelligence and Gemini Nano.
This command provides the main interface for project-wide tasks.

## Available Skills

The Locanara project consists of the following specialized skills:

1. **GraphQL Architect** (`/gql` command)

   - GraphQL schema design and management
   - Common and platform-specific type definitions
   - API operation design

2. **Apple Intelligence SDK** (`/apple` command)

   - iOS Swift SDK implementation
   - Apple Intelligence API integration
   - Foundation Models processing

3. **Android SDK** (`/android` command)

   - Android Kotlin SDK implementation
   - Gemini Nano API integration
   - Android-specific features

4. **Test Engineer** (`/test` command)

   - Unit and integration test writing
   - Test coverage management

5. **Documentation Manager** (`/docs` command)

   - Project documentation management
   - Automatic API documentation generation

## Quick Start

To see all available skills:

```text
/skills-index
```

For detailed skill information, refer to each skill's SKILL.md file:

- `skills/1-graphql-architect/SKILL.md`
- `skills/2-apple-intelligence/SKILL.md`
- `skills/3-android-sdk/SKILL.md`
- `skills/4-test-engineer/SKILL.md`
- `skills/5-docs-manager/SKILL.md`

## Project Structure

```text
locanara/
├── packages/
│   ├── gql/          # GraphQL schema and type generation
│   ├── apple/        # iOS SDK (Swift) - Apple Intelligence
│   └── android/      # Android SDK (Kotlin) - Gemini Nano
├── skills/           # Claude skill definitions
└── .claude/          # Claude settings and commands
```

## Workflow Example

Adding a new AI Feature:

1. Define schema with GraphQL Architect
2. Implement on each platform with Apple/Android SDK
3. Write tests with Test Engineer
4. Update documentation with Docs Manager
