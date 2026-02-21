import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import {chat, chatStream} from 'expo-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

type Preset = 'structured' | 'creative' | 'conversational';
const PRESETS: {key: Preset; label: string; prompt: string}[] = [
  {key: 'structured', label: 'Structured', prompt: 'You are a precise assistant. Answer concisely with structured data.'},
  {key: 'creative', label: 'Creative', prompt: 'You are a creative writer. Be imaginative and expressive.'},
  {key: 'conversational', label: 'Conversational', prompt: 'You are a friendly, casual assistant. Be warm and natural.'},
];

export function ModelDemo() {
  const [input, setInput] = useState('Explain what on-device AI means in 2 sentences.');
  const [selectedPreset, setSelectedPreset] = useState<Preset>('structured');
  const [useStreaming, setUseStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true); setOutput(''); setProcessingTime(null);
    const preset = PRESETS.find((p) => p.key === selectedPreset)!;
    const start = Date.now();
    try {
      console.log('[DEBUG] model request:', JSON.stringify({input: input.substring(0, 100), preset: preset.key, streaming: useStreaming}));
      if (useStreaming) {
        await chatStream(input, {systemPrompt: preset.prompt, onChunk: (c) => setOutput(c.accumulated)});
        console.log('[DEBUG] model response (stream): completed');
      } else {
        const result = await chat(input, {systemPrompt: preset.prompt});
        console.log('[DEBUG] model response:', JSON.stringify(result));
        setOutput(result.message);
      }
      setProcessingTime(Date.now() - start);
    } catch (e: any) { setOutput(`Error: ${e.message}`); }
    finally { setIsProcessing(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={`// Swift (iOS)\nlet model = FoundationLanguageModel()\nlet result = try await model.generate("prompt", config: .structured)\n\n// Kotlin (Android)\nval model = PromptApiModel(context)\nval result = model.generate("prompt", config = GenerationConfig.structured)`} />
      <Text style={styles.sectionTitle}>Preset Configuration</Text>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p.key} style={[styles.btn, selectedPreset === p.key && styles.btnSel]} onPress={() => setSelectedPreset(p.key)}>
            <Text style={[styles.btnText, selectedPreset === p.key && styles.btnTextSel]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.toggleRow} onPress={() => setUseStreaming(!useStreaming)}>
        <Text style={styles.toggleLabel}>Streaming</Text>
        <View style={[styles.toggle, useStreaming && styles.toggleOn]}>
          <View style={[styles.toggleThumb, useStreaming && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>
      <TextInput style={styles.input} value={input} onChangeText={setInput} multiline placeholder="Enter your prompt..." placeholderTextColor="#999" />
      <TouchableOpacity style={[styles.runBtn, isProcessing && styles.runBtnDisabled]} onPress={handleRun} disabled={isProcessing}>
        {isProcessing ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.runBtnText}>Generate</Text>}
      </TouchableOpacity>
      {(output || processingTime !== null) && (
        <View style={styles.resultCard}>
          {processingTime !== null && <View style={styles.badgeRow}><StatBadge label="Time" value={`${processingTime}ms`} /><StatBadge label="Config" value={selectedPreset} /><StatBadge label="Mode" value={useStreaming ? 'Stream' : 'Batch'} /></View>}
          {output ? <Text style={styles.resultText}>{output}</Text> : null}
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
  btnText: {fontSize: 14, fontWeight: '600', color: '#333'}, btnTextSel: {color: 'white'},
  toggleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 12},
  toggleLabel: {fontSize: 15, color: '#333'},
  toggle: {width: 50, height: 30, borderRadius: 15, backgroundColor: '#E5E5EA', justifyContent: 'center', padding: 2},
  toggleOn: {backgroundColor: '#34C759'},
  toggleThumb: {width: 26, height: 26, borderRadius: 13, backgroundColor: 'white'}, toggleThumbOn: {alignSelf: 'flex-end'},
  input: {backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 12, color: '#000'},
  runBtn: {backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16},
  runBtnDisabled: {opacity: 0.6}, runBtnText: {color: 'white', fontSize: 17, fontWeight: '600'},
  resultCard: {backgroundColor: 'white', borderRadius: 10, padding: 16},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap'},
  resultText: {fontSize: 15, color: '#333', lineHeight: 22},
});
