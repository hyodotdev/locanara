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
import {translate, type TranslateResult, ExpoOndeviceAiLog} from 'expo-ondevice-ai';
import {useAppState} from '../../AppState';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';

const DEFAULT_INPUT = 'Hello, how are you today?';

const LANGUAGES = [
  {code: 'en', name: 'English'},
  {code: 'ko', name: 'Korean'},
  {code: 'ja', name: 'Japanese'},
  {code: 'zh', name: 'Chinese'},
  {code: 'es', name: 'Spanish'},
  {code: 'fr', name: 'French'},
  {code: 'de', name: 'German'},
];

export function TranslateDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeTranslate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      ExpoOndeviceAiLog.d('[TranslateDemo] Starting translate');
      ExpoOndeviceAiLog.d('[TranslateDemo] Input:', inputText);
      ExpoOndeviceAiLog.d('[TranslateDemo] Target language:', targetLanguage);

      const translateResult = await translate(inputText, {
        targetLanguage,
      });

      ExpoOndeviceAiLog.d('[TranslateDemo] Result received');
      ExpoOndeviceAiLog.json('[TranslateDemo] TranslateResult', translateResult);
      setResult(translateResult);
    } catch (error: any) {
      ExpoOndeviceAiLog.error('[TranslateDemo] Error: ' + (error.message || 'Unknown error'));
      setErrorMessage(error.message || 'Failed to translate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Translate</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to translate..."
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageList}
          >
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageChip,
                  targetLanguage === lang.code && styles.languageChipActive,
                ]}
                onPress={() => setTargetLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    targetLanguage === lang.code && styles.languageChipTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !inputText.trim() || !isModelReady) &&
              styles.buttonDisabled,
          ]}
          onPress={executeTranslate}
          disabled={isLoading || !inputText.trim() || !isModelReady}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Translate'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Translation</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result.translatedText}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {result.sourceLanguage || 'auto'} → {result.targetLanguage}
              </Text>
              {result.confidence !== undefined && (
                <Text style={styles.confidenceText}>
                  {Math.round(result.confidence * 100)}%
                </Text>
              )}
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
    minHeight: 100,
    color: '#000',
  },
  languageList: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  languageChipActive: {
    backgroundColor: '#007AFF',
  },
  languageChipText: {
    fontSize: 14,
    color: '#666',
  },
  languageChipTextActive: {
    color: 'white',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  confidenceText: {
    fontSize: 13,
    color: '#666',
  },
});
