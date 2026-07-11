# Example App Structure

Example apps are executable contract tests and product demonstrations. Their
current implementation is authoritative; this guide does not impose a fixed
tab count, file tree, color palette, or framework.

## Current Surfaces

- Apple: `packages/apple/Example/`
- Android: `packages/android/example/`
- Expo: `libraries/expo-ondevice-ai/example/`
- React Native: `libraries/react-native-ondevice-ai/example/`
- Flutter: `libraries/flutter_ondevice_ai/example/`
- Web: `packages/web/example/`

Several current examples expose Features, Device, Framework, and Settings
areas. Preserve each platform's navigation conventions while keeping the
demonstrated SDK concepts aligned.

## Required Behavior

- Initialize the real SDK and display runtime capability/status.
- Disable or explain unsupported features; never show a fabricated ready state.
- Provide focused input/options/result/error states for implemented features.
- Clean up streaming/progress subscriptions and support cancellation where the
  public API does.
- Do not print prompts, outputs, images, RAG content, or entities to production
  logs/debug panels.
- Model download/load/delete UI must reflect confirmed native state.
- Framework demos must execute the API they teach. A Pipeline demo must call the
  Pipeline DSL rather than manually chaining unrelated convenience methods.
- Keep code snippets synchronized with current public signatures.

## Change Workflow

1. Read the platform SDK/wrapper implementation and existing example first.
2. Reuse current shared components and design tokens instead of copying an old
   example tree.
3. Update every example affected by a cross-platform public contract.
4. Add unit/widget tests where practical.
5. Build each affected native/Web example and report real-device-only rows.

## Review Checklist

- Navigation reaches every intended demo.
- Capability state matches the engine the call actually uses.
- Empty, invalid, loading, success, error, cancellation, and retry states are
  represented where relevant.
- Accessibility, dark mode, localization, and responsive layout follow the host
  framework's current conventions.
- Pipeline, streaming, model management, and unsupported-platform notes match
  implementation rather than issue descriptions or old screenshots.
