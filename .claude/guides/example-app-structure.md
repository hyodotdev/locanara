# Example App Structure Guide

This guide documents the standard structure for library example apps in the Locanara ecosystem. All library example apps should follow this pattern to maintain consistency with the native iOS/Android example apps.

## Navigation Structure

### Tab Navigation (3 tabs)

The app uses a tab-based navigation with expo-router:

```
app/
├── _layout.tsx              # Root layout with AppStateProvider
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator layout
│   ├── index.tsx            # Features tab (default)
│   ├── device.tsx           # Device info tab
│   └── settings.tsx         # Settings tab
└── feature/
    └── [id].tsx             # Dynamic feature detail screen
```

### Tab Configuration

| Tab | Icon | Label | Description |
|-----|------|-------|-------------|
| Features | `list` | Features | List of available AI features |
| Device | `hardware-chip` | Device | Device and AI capability info |
| Settings | `settings` | Settings | App settings and links |

## Component Structure

### Directory Layout

```
components/
├── AppState.tsx                     # Context provider for app state
├── pages/
│   └── FeatureDetail/               # Feature demo components
│       ├── index.ts                 # Barrel export
│       ├── AIModelRequiredBanner.tsx
│       ├── SummarizeDemo.tsx
│       ├── ClassifyDemo.tsx
│       ├── ExtractDemo.tsx
│       ├── TranslateDemo.tsx
│       ├── RewriteDemo.tsx
│       ├── ProofreadDemo.tsx
│       └── ChatDemo/
│           ├── index.tsx            # Main chat component
│           ├── ChatBubble.tsx       # Chat message bubble
│           └── TypingIndicator.tsx  # Loading indicator
└── shared/
    ├── FeatureRow.tsx               # Feature list item
    ├── AIStatusBanner.tsx           # AI status indicator
    ├── InfoRow.tsx                  # Key-value info row
    └── StatBadge.tsx                # Statistics badge
```

## AppState Context

The `AppState.tsx` provides a React Context for managing SDK state:

### State Types

```typescript
type SDKState = 'notInitialized' | 'initializing' | 'initialized' | 'error';

interface AppStateContextType {
  sdkState: SDKState;
  errorMessage: string | null;
  deviceInfo: DeviceInfoDisplay | null;
  capability: DeviceCapability | null;
  availableFeatures: FeatureInfo[];
  isModelReady: boolean;
  initializeSDK: () => Promise<void>;
}
```

### Feature Definition Pattern

```typescript
const FEATURE_DEFINITIONS: Omit<FeatureInfo, 'isAvailable'>[] = [
  {
    id: 'summarize',
    type: 'summarize',
    name: 'Summarize',
    description: 'Condense long text into concise summaries',
    icon: 'document-text',
  },
  // ... other features
];
```

## Shared Components

### FeatureRow

Displays a single feature in the list with icon, name, description, and availability status.

Props:
- `feature: FeatureInfo` - Feature info object

### AIStatusBanner

Shows the current on-device AI status (ready or not available).

Uses `useAppState()` hook to access `isModelReady` and `capability`.

### InfoRow

Displays a label-value pair in a row format (used in Device tab).

Props:
- `label: string` - Left-aligned label
- `value: string` - Right-aligned value
- `valueColor?: string` - Optional color for value text

### StatBadge

Displays a small statistics badge (used in demo result sections).

Props:
- `label: string` - Badge label
- `value: string` - Badge value

## Feature Demo Pattern

Each feature demo component follows this pattern:

```typescript
export function FeatureDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<ResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeFeature = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const featureResult = await featureApi(inputText, options);
      setResult(featureResult);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to execute');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input</Text>
          <TextInput ... />
        </View>

        {/* Options Section (if applicable) */}

        {/* Execute Button */}
        <TouchableOpacity
          style={[styles.button, (isLoading || !inputText.trim() || !isModelReady) && styles.buttonDisabled]}
          onPress={executeFeature}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading && <ActivityIndicator color="white" />}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Execute'}
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {/* Result Section */}
        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Result</Text>
            {/* Display result */}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

## Styling Guidelines

### Colors

| Purpose | Color |
|---------|-------|
| Background | `#F2F2F7` |
| Primary (button) | `#007AFF` |
| Success | `#34C759` |
| Warning | `#FF9500` |
| Error | `#FF3B30` |
| Text Primary | `#000` |
| Text Secondary | `#666` |
| Separator | `#C6C6C8` |

### Common Styles

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
```

## iOS Native Parity

The example app should match the iOS native app in:

1. **Navigation structure** - Same 3-tab layout
2. **Feature list** - Same features with same descriptions
3. **Demo UI** - Similar input/output layout
4. **Colors** - iOS system colors
5. **Typography** - Similar font sizes and weights
6. **Animations** - Loading indicators, transitions

Reference: `packages/apple/Example/LocanaraExample/`

## Native Module Architecture (expo-ondevice-ai)

The native modules bridge the TypeScript API to Locanara SDK chains:

### iOS (`ios/`)
- `ExpoOndeviceAiModule.swift` - Expo module exposing async functions
- `ExpoOndeviceAiHelper.swift` - Option extractors for chain constructors + `PrefilledMemory` adapter
- `ExpoOndeviceAiSerialization.swift` - Converts chain results to JS-compatible dictionaries

### Android (`android/`)
- `ExpoOndeviceAiModule.kt` - Expo module exposing async functions
- `ExpoOndeviceAiHelper.kt` - Option extractors + `PrefilledMemory` adapter
- `ExpoOndeviceAiSerialization.kt` - Converts chain results to JS-compatible maps

### How it works

Each TypeScript function maps to a built-in chain:
- `summarize(text, options)` → `SummarizeChain(bulletCount: n).run(text)`
- `classify(text, options)` → `ClassifyChain(labels: [...]).run(text)`
- `chat(message, options)` → `ChatChain(memory: PrefilledMemory(history)).run(message)`
- `chatStream(message, options)` → `ChatChain(...).streamRun(message)` (returns chunks)

`PrefilledMemory` adapts the JS chat history array `[{role, content}]` to the `Memory` protocol used by `ChatChain`.

`LocanaraClient`/`Locanara` is only used for `initialize()` and `getDeviceCapability()` (no chain equivalents).

## Checklist for New Libraries

When creating a new library example app:

1. [ ] Create app directory structure with expo-router
2. [ ] Set up tab navigation with 3 tabs
3. [ ] Create AppState context with SDK initialization
4. [ ] Create shared components (FeatureRow, InfoRow, etc.)
5. [ ] Create feature demo components
6. [ ] Match iOS native app navigation and UI
7. [ ] Test on both iOS and Android simulators
8. [ ] Add default input text for each demo
