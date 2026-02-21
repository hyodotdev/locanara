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
  rewrite,
  type RewriteResult,
  type RewriteOutputType,
  ExpoOndeviceAiLog,
} from 'expo-ondevice-ai';
import {useAppState} from '../../AppState';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';
import {DebugLogPanel, type DebugLog} from '../../shared/DebugLogPanel';

const DEFAULT_INPUT =
  'i think this product is really good and everyone should buy it';

const ROW1_STYLES: {value: RewriteOutputType; label: string}[] = [
  {value: 'ELABORATE', label: 'Elaborate'},
  {value: 'EMOJIFY', label: 'Emojify'},
  {value: 'SHORTEN', label: 'Shorten'},
];

const ROW2_STYLES: {value: RewriteOutputType; label: string}[] = [
  {value: 'FRIENDLY', label: 'Friendly'},
  {value: 'PROFESSIONAL', label: 'Professional'},
  {value: 'REPHRASE', label: 'Rephrase'},
];

export function RewriteDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [selectedStyle, setSelectedStyle] =
    useState<RewriteOutputType>('ELABORATE');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);

  const executeRewrite = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    const start = Date.now();

    try {
      const options = {outputType: selectedStyle};
      console.log('[DEBUG] rewrite request:', JSON.stringify(options));
      const rewriteResult = await rewrite(inputText, options);
      console.log('[DEBUG] rewrite response:', JSON.stringify(rewriteResult));
      setResult(rewriteResult);
      setDebugLog({api: 'rewrite', request: {text: inputText.substring(0, 100) + '...', options}, response: rewriteResult, timing: Date.now() - start});
    } catch (error: any) {
      setDebugLog({api: 'rewrite', request: {text: inputText.substring(0, 100) + '...'}, response: {error: error.message}, timing: Date.now() - start});
      setErrorMessage(error.message || 'Failed to rewrite');
    } finally {
      setIsLoading(false);
    }
  };

  const formatStyleLabel = (style: string): string => {
    return style.charAt(0).toUpperCase() + style.slice(1).toLowerCase();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Rewrite</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to rewrite..."
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output Type</Text>
          <View style={styles.segmentedControl}>
            {ROW1_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.segmentButton,
                  selectedStyle === style.value && styles.segmentButtonActive,
                ]}
                onPress={() => setSelectedStyle(style.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selectedStyle === style.value && styles.segmentTextActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View
            style={[styles.segmentedControl, styles.segmentedControlMargin]}
          >
            {ROW2_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.segmentButton,
                  selectedStyle === style.value && styles.segmentButtonActive,
                ]}
                onPress={() => setSelectedStyle(style.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selectedStyle === style.value && styles.segmentTextActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !inputText.trim() || !isModelReady) &&
              styles.buttonDisabled,
          ]}
          onPress={executeRewrite}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Rewrite'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Rewritten Text</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result.rewrittenText}</Text>
            </View>
            <Text style={styles.styleLabel}>
              Style: {formatStyleLabel(selectedStyle)}
            </Text>

            {result.alternatives && result.alternatives.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.alternativesTitle}>Alternatives</Text>
                {result.alternatives.map((alt, index) => (
                  <View key={index} style={styles.alternativeBox}>
                    <Text style={styles.alternativeText}>{alt}</Text>
                  </View>
                ))}
              </View>
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 2,
  },
  segmentedControlMargin: {
    marginTop: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
  },
  segmentTextActive: {
    color: '#007AFF',
    fontWeight: '500',
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
  resultBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  styleLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  alternativesSection: {
    marginTop: 16,
  },
  alternativesTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  alternativeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
  },
});
