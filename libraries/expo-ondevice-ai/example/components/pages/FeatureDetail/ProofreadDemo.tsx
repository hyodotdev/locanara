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
import {Ionicons} from '@expo/vector-icons';
import {
  proofread,
  type ProofreadResult,
  type ProofreadCorrection,
  type ProofreadInputType,
  ExpoOndeviceAiLog,
} from 'expo-ondevice-ai';
import {useAppState} from '../../AppState';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';
import {DebugLogPanel, type DebugLog} from '../../shared/DebugLogPanel';

const DEFAULT_INPUT = `I recieve your message and will definately respond untill tommorow. Thier was a wierd occurence.`;

const CORRECTION_TYPE_COLORS: Record<string, string> = {
  grammar: '#007AFF',
  spelling: '#FF9500',
  punctuation: '#AF52DE',
  style: '#34C759',
};

export function ProofreadDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [selectedInputType, setSelectedInputType] =
    useState<ProofreadInputType>('KEYBOARD');
  const [result, setResult] = useState<ProofreadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);

  const executeProofread = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    const start = Date.now();

    try {
      const options = {inputType: selectedInputType};
      console.log('[DEBUG] proofread request:', JSON.stringify(options));
      const proofreadResult = await proofread(inputText, options);
      console.log('[DEBUG] proofread response:', JSON.stringify(proofreadResult));
      setResult(proofreadResult);
      setDebugLog({api: 'proofread', request: {text: inputText.substring(0, 100) + '...', options}, response: proofreadResult, timing: Date.now() - start});
    } catch (error: any) {
      setDebugLog({api: 'proofread', request: {text: inputText.substring(0, 100) + '...'}, response: {error: error.message}, timing: Date.now() - start});
      setErrorMessage(error.message || 'Failed to proofread');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCorrection = (correction: ProofreadCorrection, index: number) => (
    <View key={index} style={styles.correctionRow}>
      <View style={styles.correctionContent}>
        <Text style={styles.originalText}>{correction.original}</Text>
        <Ionicons name="arrow-forward" size={16} color="#666" />
        <Text style={styles.correctedText}>{correction.corrected}</Text>
      </View>
      {correction.type && (
        <View
          style={[
            styles.correctionType,
            {
              backgroundColor:
                CORRECTION_TYPE_COLORS[correction.type] || '#666',
            },
          ]}
        >
          <Text style={styles.correctionTypeText}>{correction.type}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Proofread</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to proofread..."
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedInputType === 'KEYBOARD' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedInputType('KEYBOARD')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedInputType === 'KEYBOARD' && styles.segmentTextActive,
                ]}
              >
                Keyboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedInputType === 'VOICE' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedInputType('VOICE')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedInputType === 'VOICE' && styles.segmentTextActive,
                ]}
              >
                Voice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !inputText.trim() || !isModelReady) &&
              styles.buttonDisabled,
          ]}
          onPress={executeProofread}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Proofread'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Corrected Text</Text>
              <Text
                style={[
                  styles.correctionCount,
                  {color: result.hasCorrections ? '#FF9500' : '#34C759'},
                ]}
              >
                {result.hasCorrections
                  ? `${result.corrections.length} corrections`
                  : 'No corrections'}
              </Text>
            </View>

            {result.correctedText && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{result.correctedText}</Text>
              </View>
            )}

            {result.hasCorrections && (
              <View style={styles.correctionsSection}>
                <Text style={styles.correctionsTitle}>Corrections Made</Text>
                {result.corrections.map(renderCorrection)}
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  correctionCount: {
    fontSize: 13,
    fontWeight: '500',
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
  correctionsSection: {
    marginTop: 20,
  },
  correctionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  correctionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  originalText: {
    fontSize: 14,
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },
  correctedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  correctionType: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  correctionTypeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
});
