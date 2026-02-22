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
import {summarize, classify} from 'expo-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

type ChainType = 'sequential' | 'parallel' | 'conditional';
const CHAIN_TYPES: {key: ChainType; label: string}[] = [
  {key: 'sequential', label: 'Sequential'},
  {key: 'parallel', label: 'Parallel'},
  {key: 'conditional', label: 'Conditional'},
];
const SAMPLE =
  'Artificial intelligence is rapidly transforming healthcare, enabling early disease detection and personalized treatment plans. Machine learning models can now analyze medical images with accuracy comparable to specialists. This technological advancement promises to make quality healthcare more accessible and affordable worldwide.';

export function ChainDemo() {
  const [input, setInput] = useState(SAMPLE);
  const [chainType, setChainType] = useState<ChainType>('sequential');
  const [results, setResults] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setResults([]);
    setProcessingTime(null);
    const start = Date.now();
    try {
      console.log(
        '[DEBUG] chain request:',
        JSON.stringify({chainType, inputLength: input.length}),
      );
      if (chainType === 'sequential') {
        const s1 = await summarize(input);
        console.log('[DEBUG] chain step1 (summarize):', JSON.stringify(s1));
        setResults((prev) => [...prev, `Step 1 (Summarize): ${s1.summary}`]);
        const s2 = await classify(s1.summary);
        console.log('[DEBUG] chain step2 (classify):', JSON.stringify(s2));
        setResults((prev) => [
          ...prev,
          `Step 2 (Classify): ${s2.topClassification.label} (${(s2.topClassification.score * 100).toFixed(0)}%)`,
        ]);
      } else if (chainType === 'parallel') {
        const [s, c] = await Promise.all([summarize(input), classify(input)]);
        setResults([
          `Summarize: ${s.summary}`,
          `Classify: ${c.topClassification.label} (${(c.topClassification.score * 100).toFixed(0)}%)`,
        ]);
      } else {
        if (input.length > 200) {
          const r = await summarize(input);
          setResults([
            `Condition: Text is long (${input.length} chars) → Summarize`,
            `Result: ${r.summary}`,
          ]);
        } else {
          const r = await classify(input);
          setResults([
            `Condition: Text is short (${input.length} chars) → Classify`,
            `Result: ${r.topClassification.label} (${(r.topClassification.score * 100).toFixed(0)}%)`,
          ]);
        }
      }
      setProcessingTime(Date.now() - start);
    } catch (e: any) {
      setResults([`Error: ${e.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const codes: Record<ChainType, string> = {
    sequential: `// SequentialChain: output feeds into next\nlet chain = SequentialChain(chains: [\n  SummarizeChain(model: model),\n  ClassifyChain(model: model),\n])\nlet result = try await chain.run("input")`,
    parallel: `// ParallelChain: run concurrently\nlet chain = ParallelChain(chains: [\n  SummarizeChain(model: model),\n  ClassifyChain(model: model),\n])\nlet results = try await chain.run("input")`,
    conditional: `// ConditionalChain: route by condition\nlet chain = ConditionalChain(\n  condition: { input in input.count > 200 },\n  ifTrue: SummarizeChain(model: model),\n  ifFalse: ClassifyChain(model: model)\n)`,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={codes[chainType]} />
      <Text style={styles.sectionTitle}>Chain Type</Text>
      <View style={styles.row}>
        {CHAIN_TYPES.map((ct) => (
          <TouchableOpacity
            key={ct.key}
            style={[styles.btn, chainType === ct.key && styles.btnSel]}
            onPress={() => setChainType(ct.key)}
          >
            <Text
              style={[
                styles.btnText,
                chainType === ct.key && styles.btnTextSel,
              ]}
            >
              {ct.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        multiline
        placeholder="Enter text..."
        placeholderTextColor="#999"
      />
      <TouchableOpacity
        style={[styles.runBtn, isProcessing && styles.runBtnDis]}
        onPress={handleRun}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.runBtnText}>Run Chain</Text>
        )}
      </TouchableOpacity>
      {results.length > 0 && (
        <View style={styles.resultCard}>
          {processingTime !== null && (
            <View style={styles.badgeRow}>
              <StatBadge label="Time" value={`${processingTime}ms`} />
              <StatBadge label="Chain" value={chainType} />
            </View>
          )}
          {results.map((r, i) => (
            <View key={i} style={[styles.stepRow, i > 0 && styles.stepSep]}>
              <Text style={styles.resultText}>{r}</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  row: {flexDirection: 'row', gap: 8, marginBottom: 16},
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  btnSel: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  btnText: {fontSize: 14, fontWeight: '600', color: '#333'},
  btnTextSel: {color: 'white'},
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    color: '#000',
  },
  runBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  runBtnDis: {opacity: 0.6},
  runBtnText: {color: 'white', fontSize: 17, fontWeight: '600'},
  resultCard: {backgroundColor: 'white', borderRadius: 10, padding: 16},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  stepRow: {paddingVertical: 4},
  stepSep: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 12,
  },
  resultText: {fontSize: 15, color: '#333', lineHeight: 22},
});
