import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {chat} from 'expo-ondevice-ai';
import type {ChatMessage} from 'expo-ondevice-ai';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

type MemoryType = 'buffer' | 'summary';

export function MemoryDemo() {
  const [memoryType, setMemoryType] = useState<MemoryType>('buffer');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const maxEntries = memoryType === 'buffer' ? 4 : 10;

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    const userMsg = input.trim(); setInput('');
    const newHist: ChatMessage[] = [...history, {role: 'user' as const, content: userMsg}];
    const ctx = memoryType === 'buffer' ? newHist.slice(-maxEntries) : newHist;
    try {
      console.log('[DEBUG] memory chat request:', JSON.stringify({message: userMsg, memoryType, historyLength: ctx.length}));
      const r = await chat(userMsg, {systemPrompt: 'You are a helpful assistant. Keep responses short.', history: ctx});
      console.log('[DEBUG] memory chat response:', JSON.stringify(r));
      setHistory([...newHist, {role: 'assistant' as const, content: r.message}]);
    } catch (e: any) { setHistory([...newHist, {role: 'assistant' as const, content: `Error: ${e.message}`}]); }
    finally { setIsProcessing(false); }
  };

  const handleClear = () => { setHistory([]); setInput(''); };
  const display = memoryType === 'buffer' ? history.slice(-maxEntries) : history;
  const tokens = history.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard title="Native Code Pattern" code={`// BufferMemory — keeps last N entries\nlet memory = BufferMemory(maxEntries: 4, maxTokens: 500)\n\n// SummaryMemory — compresses older entries\nlet memory = SummaryMemory(model: model, keepRecentTurns: 2)\n\nlet chain = ChatChain(model: model, memory: memory)\nlet result = try await chain.run("Hello!")`} />
      <Text style={styles.sectionTitle}>Memory Type</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.typeBtn, memoryType === 'buffer' && styles.typeSel]} onPress={() => { setMemoryType('buffer'); handleClear(); }}>
          <Text style={[styles.typeText, memoryType === 'buffer' && styles.typeTextSel]}>Buffer</Text>
          <Text style={[styles.typeDesc, memoryType === 'buffer' && styles.typeDescSel]}>Last {maxEntries} entries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, memoryType === 'summary' && styles.typeSel]} onPress={() => { setMemoryType('summary'); handleClear(); }}>
          <Text style={[styles.typeText, memoryType === 'summary' && styles.typeTextSel]}>Summary</Text>
          <Text style={[styles.typeDesc, memoryType === 'summary' && styles.typeDescSel]}>Compressed history</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.badgeRow}><StatBadge label="Entries" value={`${history.length}`} /><StatBadge label="In Context" value={`${display.length}`} /><StatBadge label="Tokens" value={`~${tokens}`} /></View>
      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Memory Entries</Text>{history.length > 0 && <TouchableOpacity onPress={handleClear}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>}</View>
        {display.length === 0 ? <Text style={styles.emptyText}>No entries yet. Start a conversation.</Text> : display.map((e, i) => (
          <View key={i} style={styles.entryRow}>
            <View style={[styles.badge, e.role === 'user' ? styles.badgeUser : styles.badgeAI]}><Text style={styles.badgeText}>{e.role === 'user' ? 'U' : 'A'}</Text></View>
            <Text style={styles.entryText} numberOfLines={3}>{e.content}</Text>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message..." placeholderTextColor="#999" returnKeyType="send" onSubmitEditing={handleSend} />
        <TouchableOpacity style={[styles.sendBtn, isProcessing && styles.sendDis]} onPress={handleSend} disabled={isProcessing || !input.trim()}>
          {isProcessing ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'}, content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  row: {flexDirection: 'row', gap: 8, marginBottom: 12},
  typeBtn: {flex: 1, padding: 12, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA'},
  typeSel: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  typeText: {fontSize: 15, fontWeight: '600', color: '#333'}, typeTextSel: {color: 'white'},
  typeDesc: {fontSize: 12, color: '#999', marginTop: 2}, typeDescSel: {color: 'rgba(255,255,255,0.8)'},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap'},
  card: {backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  cardTitle: {fontSize: 15, fontWeight: '600', color: '#333'},
  clearText: {fontSize: 14, color: '#FF3B30', fontWeight: '500'},
  emptyText: {fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 12},
  entryRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, gap: 8},
  badge: {width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
  badgeUser: {backgroundColor: '#007AFF'}, badgeAI: {backgroundColor: '#34C759'},
  badgeText: {fontSize: 12, fontWeight: '700', color: 'white'},
  entryText: {flex: 1, fontSize: 14, color: '#333', lineHeight: 20},
  inputRow: {flexDirection: 'row', gap: 8},
  input: {flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 15, color: '#000'},
  sendBtn: {backgroundColor: '#007AFF', paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},
  sendDis: {opacity: 0.6}, sendText: {color: 'white', fontSize: 15, fontWeight: '600'},
});
