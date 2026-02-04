# Project Overview

## What is Locanara?

Locanara is an on-device intelligence SDK for mobile apps. It provides a unified, cross-platform API for integrating local AI capabilities using system-provided models:

- **iOS**: Apple Intelligence (Foundation Models)
- **Android**: Gemini Nano

## Project Structure

```text
locanara/
├── packages/
│   ├── gql/          # GraphQL schema & type generation (source of truth)
│   ├── apple/        # iOS SDK (Swift) - Apple Intelligence
│   ├── android/      # Android SDK (Kotlin) - Gemini Nano
│   ├── web/          # Web SDK (TypeScript) - Chrome Built-in AI
│   ├── react-native/ # React Native SDK (@locanara/sdk) - Wraps native SDKs
│   └── docs/         # Documentation site
├── Package.swift     # Swift Package Manager configuration
└── package.json      # Bun monorepo configuration
```

## Package Manager

This project uses **Bun** (v1.1.0+) as the package manager and script runner.

```bash
bun install        # Install dependencies
bun run build      # Build all packages
bun run generate   # Generate types from GraphQL schemas
```

## Architecture

### Schema-First Development

The `packages/gql` package is the **single source of truth** for types:

1. Define types in GraphQL schema
2. Run `bun run generate` to generate TypeScript, Swift, and Kotlin types
3. Types are synced to `packages/apple` and `packages/android`

### Core Components

- **Feature API**: High-level AI functions (`summarize`, `classify`, `extract`, `chat`)
- **Context Manager**: App state and user data management
- **Capability Router**: Device capability detection
- **Policy Engine**: Offline/privacy/performance decisions
