import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  extract,
  type ExtractResult,
  type Entity,
} from 'react-native-ondevice-ai';
import {useAppState} from '../../AppState';
import {DebugLogPanel, type DebugLog} from '../../shared/DebugLogPanel';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';

const DEFAULT_INPUT = `Contact John Smith at john@example.com or call 555-123-4567. Meeting scheduled for January 15, 2025 at Apple Park, Cupertino.`;

const ENTITY_COLORS: Record<string, string> = {
  person: '#007AFF',
  email: '#FF9500',
  phone: '#34C759',
  date: '#AF52DE',
  location: '#FF3B30',
};

export function ExtractDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);

  const executeExtract = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    const start = Date.now();

    try {
      const options = {entityTypes: ['person', 'email', 'phone', 'date', 'location']};
      console.log('[DEBUG] extract request:', JSON.stringify(options));
      const extractResult = await extract(inputText, options);
      console.log('[DEBUG] extract response:', JSON.stringify(extractResult));
      setResult(extractResult);
      setDebugLog({api: 'extract', request: {text: inputText.substring(0, 100) + '...', options}, response: extractResult, timing: Date.now() - start});
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to extract entities');
      setDebugLog({api: 'extract', request: {text: inputText.substring(0, 100) + '...'}, response: {error: error.message}, timing: Date.now() - start});
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityColor = (type: string): string => {
    return ENTITY_COLORS[type.toLowerCase()] || '#666';
  };

  const renderEntity = (entity: Entity, index: number) => (
    <View key={index} style={styles.entityRow}>
      <View
        style={[
          styles.entityType,
          {backgroundColor: getEntityColor(entity.type)},
        ]}
      >
        <Text style={styles.entityTypeText}>{entity.type}</Text>
      </View>
      <Text style={styles.entityValue}>{entity.value}</Text>
      {entity.confidence !== undefined && (
        <Text style={styles.confidenceText}>
          {Math.round(entity.confidence * 100)}%
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Extract From</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to extract entities from..."
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !inputText.trim() || !isModelReady) &&
              styles.buttonDisabled,
          ]}
          onPress={executeExtract}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Extract Entities'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Extracted Entities</Text>
            {result.entities.length > 0 ? (
              result.entities.map(renderEntity)
            ) : (
              <Text style={styles.noEntitiesText}>No entities found</Text>
            )}
          </View>
        )}
        <DebugLogPanel log={debugLog} />
      </View>
    </ScrollView>
  );
}

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
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    color: '#000',
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
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 12,
  },
  resultSection: {
    marginTop: 24,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  entityType: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  entityTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  entityValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  confidenceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  noEntitiesText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
