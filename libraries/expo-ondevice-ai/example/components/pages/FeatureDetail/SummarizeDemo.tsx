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
  summarize,
  type SummarizeResult,
  type SummarizeOutputType,
  type SummarizeInputType,
  ExpoOndeviceAiLog,
} from 'expo-ondevice-ai';
import {useAppState} from '../../AppState';
import {StatBadge} from '../../shared/StatBadge';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';

const DEFAULT_INPUT = `Apple Intelligence is the personal intelligence system that puts powerful generative models right at the core of iPhone, iPad, and Mac. It powers incredible new features that help you write, express yourself, and get things done effortlessly. The best part? It's deeply integrated into iOS 18, iPadOS 18, and macOS Sequoia, harnessing the power of Apple silicon to understand and create language and images, take action across apps, and draw from your personal context to simplify and accelerate everyday tasks. All while protecting your privacy.`;

export function SummarizeDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedInputType, setSelectedInputType] = useState<SummarizeInputType>('ARTICLE');
  const [selectedOutputType, setSelectedOutputType] = useState<SummarizeOutputType>('ONE_BULLET');

  const executeSummarize = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      ExpoOndeviceAiLog.d('[SummarizeDemo] Starting summarize');
      ExpoOndeviceAiLog.d('[SummarizeDemo] Input length:', inputText.length);
      ExpoOndeviceAiLog.d('[SummarizeDemo] inputType:', selectedInputType);
      ExpoOndeviceAiLog.d('[SummarizeDemo] outputType:', selectedOutputType);

      const summarizeResult = await summarize(inputText, {
        inputType: selectedInputType,
        outputType: selectedOutputType,
      });

      ExpoOndeviceAiLog.d('[SummarizeDemo] Result received');
      ExpoOndeviceAiLog.json('[SummarizeDemo] SummarizeResult', summarizeResult);
      setResult(summarizeResult);
    } catch (error: any) {
      ExpoOndeviceAiLog.error('[SummarizeDemo] Error: ' + (error.message || 'Unknown error'));
      setErrorMessage(error.message || 'Failed to summarize');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Text</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to summarize..."
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedInputType === 'ARTICLE' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedInputType('ARTICLE')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedInputType === 'ARTICLE' && styles.segmentTextActive,
                ]}
              >
                Article
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedInputType === 'CONVERSATION' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedInputType('CONVERSATION')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedInputType === 'CONVERSATION' && styles.segmentTextActive,
                ]}
              >
                Conversation
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedOutputType === 'ONE_BULLET' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedOutputType('ONE_BULLET')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedOutputType === 'ONE_BULLET' && styles.segmentTextActive,
                ]}
              >
                1 Bullet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedOutputType === 'TWO_BULLETS' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedOutputType('TWO_BULLETS')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedOutputType === 'TWO_BULLETS' && styles.segmentTextActive,
                ]}
              >
                2 Bullets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedOutputType === 'THREE_BULLETS' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedOutputType('THREE_BULLETS')}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedOutputType === 'THREE_BULLETS' && styles.segmentTextActive,
                ]}
              >
                3 Bullets
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
          onPress={executeSummarize}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Summarize'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Result</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result.summary}</Text>
            </View>
            <View style={styles.statsRow}>
              <StatBadge label="Original" value={`${result.originalLength} chars`} />
              <StatBadge
                label="Summary"
                value={`${result.summaryLength} chars`}
              />
            </View>
          </View>
        )}
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
    minHeight: 150,
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
