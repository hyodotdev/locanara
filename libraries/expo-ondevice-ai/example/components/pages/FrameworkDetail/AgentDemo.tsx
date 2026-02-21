import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {chat, summarize} from 'expo-ondevice-ai';
import {Ionicons} from '@expo/vector-icons';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

interface ReasoningStep { step: number; thought: string; action: string; observation: string; }

const LOCAL_DOCS = [
  {id: 'doc1', title: 'On-Device AI Overview', content: 'On-device AI processes data locally on the user\'s device without sending it to cloud servers. This ensures privacy and enables offline functionality. Apple Intelligence uses Foundation Models, while Android uses Gemini Nano via ML Kit.'},
  {id: 'doc2', title: 'Privacy & Security', content: 'On-device AI keeps all user data on the device. No data is transmitted to external servers. This makes it ideal for sensitive applications like health data, financial information, and personal communications.'},
  {id: 'doc3', title: 'Neural Processing Units', content: 'Modern devices include dedicated NPUs (Neural Processing Units) optimized for AI inference. Apple\'s Neural Engine can perform 35 trillion operations per second. Google\'s Tensor chips include a dedicated TPU for on-device ML.'},
  {id: 'doc4', title: 'Locanara Framework', content: 'Locanara is an open-source on-device AI framework inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using platform-native models.'},
];

const SUGGESTIONS = ['What privacy benefits does on-device AI provide?', 'Summarize what NPUs can do', 'What is the Locanara framework?'];

export function AgentDemo() {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const handleRun = async () => {
    const query = input.trim();
    if (!query || isProcessing) return;
    setIsProcessing(true); setSteps([]); setFinalAnswer(''); setProcessingTime(null);
    const start = Date.now();
    try {
      const keywords = query.toLowerCase().split(/\s+/);
      const relevant = LOCAL_DOCS.filter(d => keywords.some(kw => kw.length > 3 && (d.content.toLowerCase().includes(kw) || d.title.toLowerCase().includes(kw))));
      const s1: ReasoningStep = {step: 1, thought: `I need to find information about "${query}" in local documents.`, action: 'LocalSearchTool', observation: relevant.length > 0 ? `Found ${relevant.length} relevant document(s): ${relevant.map(d => d.title).join(', ')}` : 'No matching documents found.'};
      setSteps([s1]);

      const context = relevant.map(d => d.content).join('\n\n');
      const s2: ReasoningStep = {step: 2, thought: relevant.length > 0 ? 'I have relevant context. Let me answer using this information.' : 'No documents found. Let me try general knowledge.', action: 'ChatChain', observation: ''};
      setSteps(prev => [...prev, s2]);

      console.log('[DEBUG] agent chat request:', JSON.stringify({query: query.substring(0, 100), contextLength: context.length}));
      const result = await chat(query, {systemPrompt: `You are a helpful assistant. Answer based on this context:\n\n${context}\n\nKeep your answer concise (2-3 sentences).`});
      console.log('[DEBUG] agent chat response:', JSON.stringify(result));
      s2.observation = result.message;
      setSteps(prev => { const u = [...prev]; u[u.length - 1] = s2; return u; });

      if (result.message.length > 200) {
        const s3: ReasoningStep = {step: 3, thought: 'The response is long. Let me summarize.', action: 'SummarizeChain', observation: ''};
        setSteps(prev => [...prev, s3]);
        const sr = await summarize(result.message);
        s3.observation = sr.summary;
        setSteps(prev => { const u = [...prev]; u[u.length - 1] = s3; return u; });
        setFinalAnswer(sr.summary);
      } else { setFinalAnswer(result.message); }
      setProcessingTime(Date.now() - start);
    } catch (e: any) { setFinalAnswer(`Error: ${e.message}`); }
    finally { setIsProcessing(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={`// ReAct-lite Agent\nlet agent = Agent(\n  model: model,\n  tools: [\n    LocalSearchTool(documents: docs),\n    FunctionTool("currentDate") { Date() }\n  ],\n  chains: [SummarizeChain(model: model)],\n  maxSteps: 3\n)\nlet result = try await agent.run("query")`} />
      <TouchableOpacity style={styles.docsToggle} onPress={() => setShowDocs(!showDocs)}>
        <Ionicons name="documents" size={18} color="#007AFF" />
        <Text style={styles.docsText}>Local Documents ({LOCAL_DOCS.length})</Text>
        <Ionicons name={showDocs ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
      </TouchableOpacity>
      {showDocs && <View style={styles.docsCard}>{LOCAL_DOCS.map(d => <View key={d.id} style={styles.docItem}><Text style={styles.docTitle}>{d.title}</Text><Text style={styles.docContent} numberOfLines={2}>{d.content}</Text></View>)}</View>}
      <Text style={styles.sectionTitle}>Suggested Queries</Text>
      <View style={styles.suggestions}>{SUGGESTIONS.map((s, i) => <TouchableOpacity key={i} style={styles.chip} onPress={() => setInput(s)}><Text style={styles.chipText}>{s}</Text></TouchableOpacity>)}</View>
      <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask a question..." placeholderTextColor="#999" />
      <TouchableOpacity style={[styles.runBtn, isProcessing && styles.runBtnDis]} onPress={handleRun} disabled={isProcessing}>
        {isProcessing ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.runBtnText}>Run Agent</Text>}
      </TouchableOpacity>
      {steps.length > 0 && (
        <View style={styles.traceCard}>
          <Text style={styles.traceTitle}>Reasoning Trace</Text>
          {processingTime !== null && <View style={styles.badgeRow}><StatBadge label="Time" value={`${processingTime}ms`} /><StatBadge label="Steps" value={`${steps.length}`} /></View>}
          {steps.map((s, i) => (
            <View key={i} style={[styles.stepBlock, i > 0 && styles.stepSep]}>
              <Text style={styles.stepHeader}>Step {s.step}</Text>
              <View style={styles.traceRow}><Ionicons name="bulb" size={14} color="#FF9500" /><Text style={styles.traceLabel}>Thought: </Text><Text style={styles.traceText}>{s.thought}</Text></View>
              <View style={styles.traceRow}><Ionicons name="play" size={14} color="#007AFF" /><Text style={styles.traceLabel}>Action: </Text><Text style={styles.traceText}>{s.action}</Text></View>
              {s.observation ? <View style={styles.traceRow}><Ionicons name="eye" size={14} color="#34C759" /><Text style={styles.traceLabel}>Observation: </Text><Text style={styles.traceText}>{s.observation}</Text></View> : null}
            </View>
          ))}
        </View>
      )}
      {finalAnswer ? <View style={styles.answerCard}><Text style={styles.answerTitle}>Final Answer</Text><Text style={styles.answerText}>{finalAnswer}</Text></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'}, content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  docsToggle: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8},
  docsText: {flex: 1, fontSize: 14, fontWeight: '600', color: '#333'},
  docsCard: {backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12},
  docItem: {paddingVertical: 6}, docTitle: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2}, docContent: {fontSize: 13, color: '#666', lineHeight: 18},
  suggestions: {gap: 8, marginBottom: 12},
  chip: {backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5EA'},
  chipText: {fontSize: 14, color: '#007AFF'},
  input: {backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#000'},
  runBtn: {backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16},
  runBtnDis: {opacity: 0.6}, runBtnText: {color: 'white', fontSize: 17, fontWeight: '600'},
  traceCard: {backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12},
  traceTitle: {fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  stepBlock: {paddingVertical: 4},
  stepSep: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', marginTop: 8, paddingTop: 12},
  stepHeader: {fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6},
  traceRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 2},
  traceLabel: {fontSize: 13, fontWeight: '600', color: '#666'}, traceText: {flex: 1, fontSize: 13, color: '#333', lineHeight: 18},
  answerCard: {backgroundColor: '#E8F5E9', borderRadius: 10, padding: 16, borderLeftWidth: 4, borderLeftColor: '#34C759'},
  answerTitle: {fontSize: 15, fontWeight: '600', color: '#2E7D32', marginBottom: 8}, answerText: {fontSize: 15, color: '#333', lineHeight: 22},
});
