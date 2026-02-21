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
import {chat, chatStream} from 'react-native-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

type Preset = 'structured' | 'creative' | 'conversational';

const PRESETS: {key: Preset; label: string; prompt: string}[] = [
  {
    key: 'structured',
    label: 'Structured',
    prompt: 'You are a precise assistant. Answer concisely with structured data.',
  },
  {
    key: 'creative',
    label: 'Creative',
    prompt: 'You are a creative writer. Be imaginative and expressive.',
  },
  {
    key: 'conversational',
    label: 'Conversational',
    prompt: 'You are a friendly, casual assistant. Be warm and natural.',
  },
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
    setIsProcessing(true);
    setOutput('');
    setProcessingTime(null);

    const preset = PRESETS.find((p) => p.key === selectedPreset)!;
    const start = Date.now();

    try {
      console.log('[DEBUG] model request:', JSON.stringify({input: input.substring(0, 100), preset: preset.key, streaming: useStreaming}));
      if (useStreaming) {
        await chatStream(input, {
          systemPrompt: preset.prompt,
          onChunk: (chunk) => setOutput(chunk.accumulated),
        });
        console.log('[DEBUG] model response (stream): completed');
      } else {
        const result = await chat(input, {systemPrompt: preset.prompt});
        console.log('[DEBUG] model response:', JSON.stringify(result));
        setOutput(result.message);
      }
      setProcessingTime(Date.now() - start);
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard
        title="Native Code Pattern"
        code={`// Swift (iOS)
let model = FoundationLanguageModel()
let config = GenerationConfig.structured
let result = try await model.generate(
  "Your prompt here",
  config: config
)

// Kotlin (Android)
val model = PromptApiModel(context)
val result = model.generate(
  "Your prompt here",
  config = GenerationConfig.structured
)`}
      />

      <Text style={styles.sectionTitle}>Preset Configuration</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.presetButton,
              selectedPreset === p.key && styles.presetSelected,
            ]}
            onPress={() => setSelectedPreset(p.key)}>
            <Text
              style={[
                styles.presetText,
                selectedPreset === p.key && styles.presetTextSelected,
              ]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setUseStreaming(!useStreaming)}>
        <Text style={styles.toggleLabel}>Streaming</Text>
        <View style={[styles.toggle, useStreaming && styles.toggleOn]}>
          <View style={[styles.toggleThumb, useStreaming && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        multiline
        placeholder="Enter your prompt..."
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.runButton, isProcessing && styles.runButtonDisabled]}
        onPress={handleRun}
        disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.runButtonText}>Generate</Text>
        )}
      </TouchableOpacity>

      {(output || processingTime !== null) && (
        <View style={styles.resultCard}>
          {processingTime !== null && (
            <View style={styles.badgeRow}>
              <StatBadge label="Time" value={`${processingTime}ms`} />
              <StatBadge label="Config" value={selectedPreset} />
              <StatBadge label="Mode" value={useStreaming ? 'Stream' : 'Batch'} />
            </View>
          )}
          {output ? <Text style={styles.resultText}>{output}</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  presetRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  presetButton: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: 'white', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E5EA',
  },
  presetSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  presetText: {fontSize: 14, fontWeight: '600', color: '#333'},
  presetTextSelected: {color: 'white'},
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 12,
  },
  toggleLabel: {fontSize: 15, color: '#333'},
  toggle: {
    width: 50, height: 30, borderRadius: 15, backgroundColor: '#E5E5EA',
    justifyContent: 'center', padding: 2,
  },
  toggleOn: {backgroundColor: '#34C759'},
  toggleThumb: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'white',
  },
  toggleThumbOn: {alignSelf: 'flex-end'},
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
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap'},
  resultText: {fontSize: 15, color: '#333', lineHeight: 22},
});
