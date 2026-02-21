import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {summarize} from 'expo-ondevice-ai';
import {Ionicons} from '@expo/vector-icons';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

export function GuardrailDemo() {
  const [input, setInput] = useState('Artificial intelligence is transforming how we build software. On-device AI keeps data private.');
  const [maxLength, setMaxLength] = useState(500);
  const [blockedPatterns, setBlockedPatterns] = useState('password, SSN, credit card');
  const [result, setResult] = useState<{type: 'success' | 'blocked'; message: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const isOverLimit = input.length > maxLength;
  const patterns = blockedPatterns.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
  const hasBlocked = patterns.some(p => input.toLowerCase().includes(p));

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true); setResult(null); setProcessingTime(null);
    const start = Date.now();
    if (isOverLimit) {
      setResult({type: 'blocked', message: `Blocked by InputLengthGuardrail: Text is ${input.length} characters (max: ${maxLength})`});
      setProcessingTime(Date.now() - start); setIsProcessing(false); return;
    }
    if (hasBlocked) {
      const found = patterns.find(p => input.toLowerCase().includes(p));
      setResult({type: 'blocked', message: `Blocked by ContentFilterGuardrail: Contains prohibited pattern "${found}"`});
      setProcessingTime(Date.now() - start); setIsProcessing(false); return;
    }
    try {
      console.log('[DEBUG] guardrail summarize request:', JSON.stringify({inputLength: input.length}));
      const r = await summarize(input);
      console.log('[DEBUG] guardrail summarize response:', JSON.stringify(r));
      setResult({type: 'success', message: r.summary});
      setProcessingTime(Date.now() - start);
    } catch (e: any) { setResult({type: 'blocked', message: `Error: ${e.message}`}); }
    finally { setIsProcessing(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={`// Guardrail-wrapped chain\nlet guardrails: [any Guardrail] = [\n  InputLengthGuardrail(maxLength: 500),\n  ContentFilterGuardrail(\n    blockedPatterns: ["password", "SSN"]\n  ),\n]\nlet chain = SummarizeChain(model: model)\n  .withGuardrails(guardrails)`} />
      <Text style={styles.sectionTitle}>Max Character Limit</Text>
      <View style={styles.sliderRow}>
        <TouchableOpacity onPress={() => setMaxLength(Math.max(50, maxLength - 50))}><Ionicons name="remove-circle" size={28} color="#007AFF" /></TouchableOpacity>
        <Text style={styles.sliderValue}>{maxLength}</Text>
        <TouchableOpacity onPress={() => setMaxLength(Math.min(2000, maxLength + 50))}><Ionicons name="add-circle" size={28} color="#007AFF" /></TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Blocked Patterns (comma-separated)</Text>
      <TextInput style={styles.patternInput} value={blockedPatterns} onChangeText={setBlockedPatterns} placeholder="e.g. password, SSN" placeholderTextColor="#999" />
      <TextInput style={[styles.input, isOverLimit && styles.inputError]} value={input} onChangeText={setInput} multiline placeholder="Enter text..." placeholderTextColor="#999" />
      <Text style={[styles.charCount, isOverLimit && styles.charCountErr]}>{input.length} / {maxLength}</Text>
      <TouchableOpacity style={[styles.runBtn, isProcessing && styles.runBtnDis]} onPress={handleRun} disabled={isProcessing}>
        {isProcessing ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.runBtnText}>Run with Guardrails</Text>}
      </TouchableOpacity>
      {result && (
        <View style={[styles.resultCard, result.type === 'blocked' && styles.resultBlocked]}>
          {processingTime !== null && <View style={styles.badgeRow}><StatBadge label="Time" value={`${processingTime}ms`} /><StatBadge label="Status" value={result.type === 'success' ? 'Passed' : 'Blocked'} /></View>}
          <View style={styles.resultHeader}>
            <Ionicons name={result.type === 'success' ? 'checkmark-circle' : 'shield'} size={20} color={result.type === 'success' ? '#34C759' : '#FF3B30'} />
            <Text style={[styles.resultTitle, result.type === 'blocked' && styles.resultTitleBlocked]}>{result.type === 'success' ? 'Guardrails Passed' : 'Blocked by Guardrail'}</Text>
          </View>
          <Text style={styles.resultText}>{result.message}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'}, content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  sliderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12},
  sliderValue: {fontSize: 20, fontWeight: '700', color: '#333', minWidth: 50, textAlign: 'center'},
  patternInput: {backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#000'},
  input: {backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top', color: '#000'},
  inputError: {borderWidth: 1, borderColor: '#FF3B30'},
  charCount: {fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4, marginBottom: 12}, charCountErr: {color: '#FF3B30'},
  runBtn: {backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16},
  runBtnDis: {opacity: 0.6}, runBtnText: {color: 'white', fontSize: 17, fontWeight: '600'},
  resultCard: {backgroundColor: 'white', borderRadius: 10, padding: 16}, resultBlocked: {backgroundColor: '#FFF5F5'},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  resultHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  resultTitle: {fontSize: 15, fontWeight: '600', color: '#34C759'}, resultTitleBlocked: {color: '#FF3B30'},
  resultText: {fontSize: 15, color: '#333', lineHeight: 22},
});
