import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {proofread, translate} from 'react-native-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

const LANGUAGES = [
  {code: 'ko', label: 'Korean'},
  {code: 'ja', label: 'Japanese'},
  {code: 'es', label: 'Spanish'},
  {code: 'fr', label: 'French'},
];

export function PipelineDemo() {
  const [input, setInput] = useState('Ths is a mesage with typos and grammer erors.');
  const [targetLang, setTargetLang] = useState('ko');
  const [steps, setSteps] = useState<{label: string; result: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setSteps([]);
    setProcessingTime(null);

    const start = Date.now();
    try {
      // Step 1: Proofread
      console.log('[DEBUG] pipeline step1 (proofread) request:', JSON.stringify({inputLength: input.length}));
      const proofResult = await proofread(input);
      console.log('[DEBUG] pipeline step1 (proofread) response:', JSON.stringify(proofResult));
      setSteps((prev) => [
        ...prev,
        {label: 'Step 1: Proofread', result: proofResult.correctedText},
      ]);

      // Step 2: Translate
      const langLabel = LANGUAGES.find((l) => l.code === targetLang)?.label;
      console.log('[DEBUG] pipeline step2 (translate) request:', JSON.stringify({targetLang}));
      const transResult = await translate(proofResult.correctedText, {
        targetLanguage: targetLang,
      });
      console.log('[DEBUG] pipeline step2 (translate) response:', JSON.stringify(transResult));
      setSteps((prev) => [
        ...prev,
        {
          label: `Step 2: Translate → ${langLabel}`,
          result: transResult.translatedText,
        },
      ]);

      setProcessingTime(Date.now() - start);
    } catch (e: any) {
      setSteps((prev) => [...prev, {label: 'Error', result: e.message}]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard
        title="Native Code Pattern"
        code={`// Swift Pipeline DSL
let result = try await model
  .pipeline {
    Proofread()
    Translate(to: "ko")
  }
  .run("Text with typos")

// Kotlin Pipeline DSL
val result = model
  .pipeline {
    proofread()
    translate(to = "ko")
  }
  .run("Text with typos")`}
      />

      <Text style={styles.sectionTitle}>Target Language</Text>
      <View style={styles.langRow}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langButton, targetLang === lang.code && styles.langSelected]}
            onPress={() => setTargetLang(lang.code)}>
            <Text
              style={[
                styles.langText,
                targetLang === lang.code && styles.langTextSelected,
              ]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        multiline
        placeholder="Enter text with typos..."
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.runButton, isProcessing && styles.runButtonDisabled]}
        onPress={handleRun}
        disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.runButtonText}>Run Pipeline</Text>
        )}
      </TouchableOpacity>

      {steps.length > 0 && (
        <View style={styles.resultCard}>
          {processingTime !== null && (
            <View style={styles.badgeRow}>
              <StatBadge label="Time" value={`${processingTime}ms`} />
              <StatBadge label="Steps" value={`${steps.length}`} />
            </View>
          )}
          {steps.map((step, i) => (
            <View key={i} style={[styles.stepBlock, i > 0 && styles.stepSeparator]}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepResult}>{step.result}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  langRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  langButton: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'white', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E5EA',
  },
  langSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  langText: {fontSize: 13, fontWeight: '600', color: '#333'},
  langTextSelected: {color: 'white'},
  input: {
    backgroundColor: 'white', borderRadius: 10, padding: 12,
    fontSize: 15, minHeight: 80, textAlignVertical: 'top',
    marginBottom: 12, color: '#000',
  },
  runButton: {
    backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 16,
  },
  runButtonDisabled: {opacity: 0.6},
  runButtonText: {color: 'white', fontSize: 17, fontWeight: '600'},
  resultCard: {backgroundColor: 'white', borderRadius: 10, padding: 16},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  stepBlock: {paddingVertical: 4},
  stepSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 12,
  },
  stepLabel: {fontSize: 13, fontWeight: '600', color: '#007AFF', marginBottom: 4},
  stepResult: {fontSize: 15, color: '#333', lineHeight: 22},
});
