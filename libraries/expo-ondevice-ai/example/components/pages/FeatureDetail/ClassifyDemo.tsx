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
  classify,
  type ClassifyResult,
  ExpoOndeviceAiLog,
} from 'expo-ondevice-ai';
import {useAppState} from '../../AppState';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';
import {DebugLogPanel, type DebugLog} from '../../shared/DebugLogPanel';

const DEFAULT_INPUT =
  'The new iPhone features an incredible camera system with advanced computational photography.';
const DEFAULT_CATEGORIES = [
  'Technology',
  'Sports',
  'Entertainment',
  'Business',
  'Health',
];

export function ClassifyDemo() {
  const {isModelReady} = useAppState();
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    ...DEFAULT_CATEGORIES,
  ]);
  const [customCategory, setCustomCategory] = useState('');
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed || selectedCategories.includes(trimmed)) return;
    setSelectedCategories((prev) => [...prev, trimmed]);
    setCustomCategory('');
  };

  const executeClassify = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    const start = Date.now();

    try {
      const options = {categories: selectedCategories};
      console.log('[DEBUG] classify request:', JSON.stringify(options));
      const classifyResult = await classify(inputText, options);
      console.log('[DEBUG] classify response:', JSON.stringify(classifyResult));
      setResult(classifyResult);
      setDebugLog({
        api: 'classify',
        request: {text: inputText.substring(0, 100) + '...', options},
        response: classifyResult,
        timing: Date.now() - start,
      });
    } catch (error: any) {
      setDebugLog({
        api: 'classify',
        request: {text: inputText.substring(0, 100) + '...'},
        response: {error: error.message},
        timing: Date.now() - start,
      });
      setErrorMessage(error.message || 'Failed to classify');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isModelReady && <AIModelRequiredBanner />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.chipContainer}>
            {DEFAULT_CATEGORIES.map((category) => {
              const selected = selectedCategories.includes(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleCategory(category)}
                >
                  {selected && <Text style={styles.chipCheck}>✓ </Text>}
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Add custom category..."
              onSubmitEditing={addCustomCategory}
              returnKeyType="done"
            />
            {customCategory.trim() ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomCategory}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedCategories.length > 0 && (
            <Text style={styles.selectedText}>
              Selected: {selectedCategories.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Classify</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholder="Enter text to classify..."
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading ||
              !inputText.trim() ||
              !isModelReady ||
              selectedCategories.length === 0) &&
              styles.buttonDisabled,
          ]}
          onPress={executeClassify}
          disabled={
            isLoading ||
            !inputText.trim() ||
            !isModelReady ||
            selectedCategories.length === 0
          }
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : null}
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Classify'}
          </Text>
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Classifications</Text>
            {result.classifications.map((classification, index) => {
              const isTop =
                classification.label === result.topClassification.label;
              return (
                <View
                  key={index}
                  style={[
                    styles.classificationRow,
                    index > 0 && styles.classificationRowMargin,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      isTop && styles.categoryLabelTop,
                    ]}
                  >
                    {classification.label}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <View style={styles.confidenceBarContainer}>
                      <View
                        style={[
                          styles.confidenceBar,
                          {width: `${classification.score * 100}%`},
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceText}>
                      {Math.round(classification.score * 100)}%
                    </Text>
                  </View>
                </View>
              );
            })}
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  chipCheck: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#000',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectedText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
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
  classificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  classificationRowMargin: {
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
    flex: 1,
  },
  categoryLabelTop: {
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBarContainer: {
    width: 100,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 13,
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
});
