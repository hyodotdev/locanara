# Locanara Architecture

## Product Boundary

All prompt inference is on-device. There is no cloud inference, server
fallback, provider API key, or user-content telemetry. Network access may be
used for explicit model/package asset downloads and non-inference site
features, never as an inference fallback.

## Repository Surfaces

```text
packages/gql      shared schemas and generators
packages/apple    Swift SDK and example
packages/android  Kotlin SDK and example
packages/web      browser SDK
packages/site     website and documentation
libraries/*       Expo, React Native, and Flutter wrappers
```

## Framework Layers

Core model abstractions feed composable chains, built-in chains, the Pipeline
DSL, runtime/session/agent utilities, platform adapters, inference engines,
model management, local RAG, and personalization. Platform availability and
download state are runtime concerns.

## Source-of-Truth Flow

```text
GraphQL schema -> generated shared platform types
Platform SDK implementation -> real behavior
Wrapper spec/public API -> native bridge behavior
Implementation + tests -> docs and examples
locanara-versions.json -> version copies and runtime constants
```

Wrappers are thin adapters. They must not simulate download, load, capability,
or inference success with local in-memory state when the SDK did not perform
the operation.

## Capability Routing

Check the actual engine/feature status. OS version, device name, or available
class alone is insufficient. A capability response must match the engine the
subsequent API call will use.

When no on-device engine is ready, return a Locanara availability error. Never
route the prompt to a remote service.
