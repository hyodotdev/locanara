import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {proofread, translate} from 'expo-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

const LANGUAGES = [{code: 'ko', label: 'Korean'}, {code: 'ja', label: 'Japanese'}, {code: 'es', label: 'Spanish'}, {code: 'fr', label: 'French'}];

export function PipelineDemo() {
  const [input, setInput] = useState('Ths is a mesage with typos and grammer erors.');
  const [targetLang, setTargetLang] = useState('ko');
  const [steps, setSteps] = useState<{label: string; result: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true); setSteps([]); setProcessingTime(null);
    const start = Date.now();
    try {
      console.log('[DEBUG] pipeline step1 (proofread) request:', JSON.stringify({inputLength: input.length}));
      const p = await proofread(input);
      console.log('[DEBUG] pipeline step1 (proofread) response:', JSON.stringify(p));
      setSteps(prev => [...prev, {label: 'Step 1: Proofread', result: p.correctedText}]);
      const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label;
      console.log('[DEBUG] pipeline step2 (translate) request:', JSON.stringify({targetLang}));
      const t = await translate(p.correctedText, {targetLanguage: targetLang});
      console.log('[DEBUG] pipeline step2 (translate) response:', JSON.stringify(t));
      setSteps(prev => [...prev, {label: `Step 2: Translate → ${langLabel}`, result: t.translatedText}]);
      setProcessingTime(Date.now() - start);
    } catch (e: any) { setSteps(prev => [...prev, {label: 'Error', result: e.message}]); }
    finally { setIsProcessing(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={`// Swift Pipeline DSL\nlet result = try await model\n  .pipeline {\n    Proofread()\n    Translate(to: "ko")\n  }\n  .run("Text with typos")`} />
      <Text style={styles.sectionTitle}>Target Language</Text>
      <View style={styles.row}>
        {LANGUAGES.map(l => (
          <TouchableOpacity key={l.code} style={[styles.btn, targetLang === l.code && styles.btnSel]} onPress={() => setTargetLang(l.code)}>
            <Text style={[styles.btnText, targetLang === l.code && styles.btnTextSel]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} value={input} onChangeText={setInput} multiline placeholder="Enter text with typos..." placeholderTextColor="#999" />
      <TouchableOpacity style={[styles.runBtn, isProcessing && styles.runBtnDis]} onPress={handleRun} disabled={isProcessing}>
        {isProcessing ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.runBtnText}>Run Pipeline</Text>}
      </TouchableOpacity>
      {steps.length > 0 && (
        <View style={styles.resultCard}>
          {processingTime !== null && <View style={styles.badgeRow}><StatBadge label="Time" value={`${processingTime}ms`} /><StatBadge label="Steps" value={`${steps.length}`} /></View>}
          {steps.map((s, i) => (
            <View key={i} style={[styles.stepBlock, i > 0 && styles.stepSep]}>
              <Text style={styles.stepLabel}>{s.label}</Text>
              <Text style={styles.stepResult}>{s.result}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'}, content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  row: {flexDirection: 'row', gap: 8, marginBottom: 16},
  btn: {flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: 'white', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA'},
  btnSel: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  btnText: {fontSize: 13, fontWeight: '600', color: '#333'}, btnTextSel: {color: 'white'},
  input: {backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 12, color: '#000'},
  runBtn: {backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16},
  runBtnDis: {opacity: 0.6}, runBtnText: {color: 'white', fontSize: 17, fontWeight: '600'},
  resultCard: {backgroundColor: 'white', borderRadius: 10, padding: 16},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  stepBlock: {paddingVertical: 4},
  stepSep: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', marginTop: 8, paddingTop: 12},
  stepLabel: {fontSize: 13, fontWeight: '600', color: '#007AFF', marginBottom: 4},
  stepResult: {fontSize: 15, color: '#333', lineHeight: 22},
});
