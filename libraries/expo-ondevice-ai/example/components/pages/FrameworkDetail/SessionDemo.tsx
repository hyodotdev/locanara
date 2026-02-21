import React, {useState, useRef} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator} from 'react-native';
import {chatStream} from 'expo-ondevice-ai';
import type {ChatMessage} from 'expo-ondevice-ai';
import {Ionicons} from '@expo/vector-icons';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

interface DisplayMessage { role: 'user' | 'assistant'; content: string; }

export function SessionDemo() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const maxMem = 6;
  const history: ChatMessage[] = messages.map(m => ({role: m.role, content: m.content}));
  const ctx = history.slice(-maxMem);
  const tokens = ctx.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const msg = input.trim(); setInput(''); setIsProcessing(true);
    setMessages(prev => [...prev, {role: 'user', content: msg}]);
    try {
      let acc = '';
      setMessages(prev => [...prev, {role: 'assistant', content: '...'}]);
      console.log('[DEBUG] session chatStream request:', JSON.stringify({message: msg, historyLength: ctx.length}));
      await chatStream(msg, {
        systemPrompt: 'You are a helpful assistant. Keep responses concise.',
        history: ctx,
        onChunk: (c) => { acc = c.accumulated; setMessages(prev => { const u = [...prev]; u[u.length - 1] = {role: 'assistant', content: acc}; return u; }); },
      });
    } catch (e: any) { setMessages(prev => { const u = [...prev]; u[u.length - 1] = {role: 'assistant', content: `Error: ${e.message}`}; return u; }); }
    finally { setIsProcessing(false); setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100); }
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}>
        <CodePatternCard title="Native Code Pattern" code={`// Stateful Session\nlet session = Session(\n  model: model,\n  memory: BufferMemory(maxEntries: 6),\n  systemPrompt: "You are helpful."\n)\nlet r1 = try await session.send("Hello!")\nlet r2 = try await session.send("Follow up")`} />
        <TouchableOpacity style={styles.memToggle} onPress={() => setShowMemory(!showMemory)}>
          <Ionicons name="bulb" size={18} color="#007AFF" />
          <Text style={styles.memToggleText}>Memory Inspector</Text>
          <View style={styles.badgeRow}><StatBadge label="Entries" value={`${ctx.length}`} /><StatBadge label="Tokens" value={`~${tokens}`} /></View>
          <Ionicons name={showMemory ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
        </TouchableOpacity>
        {showMemory && ctx.length > 0 && (
          <View style={styles.memEntries}>
            {ctx.map((e, i) => (
              <View key={i} style={styles.memEntry}>
                <View style={[styles.memBadge, e.role === 'user' ? styles.memBadgeU : styles.memBadgeA]}><Text style={styles.memBadgeText}>{e.role === 'user' ? 'U' : 'A'}</Text></View>
                <Text style={styles.memText} numberOfLines={2}>{e.content}</Text>
              </View>
            ))}
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
            <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputBar}>
        {messages.length > 0 && <TouchableOpacity onPress={() => { setMessages([]); setInput(''); }} style={styles.resetBtn}><Ionicons name="trash" size={20} color="#FF3B30" /></TouchableOpacity>}
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message..." placeholderTextColor="#999" returnKeyType="send" onSubmitEditing={handleSend} />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || isProcessing) && styles.sendDis]} onPress={handleSend} disabled={!input.trim() || isProcessing}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  scroll: {flex: 1}, scrollContent: {padding: 16, paddingBottom: 8},
  memToggle: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8},
  memToggleText: {fontSize: 14, fontWeight: '600', color: '#333', marginRight: 'auto'},
  badgeRow: {flexDirection: 'row', gap: 4},
  memEntries: {backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12},
  memEntry: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4},
  memBadge: {width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center'},
  memBadgeU: {backgroundColor: '#007AFF'}, memBadgeA: {backgroundColor: '#34C759'},
  memBadgeText: {fontSize: 11, fontWeight: '700', color: 'white'},
  memText: {flex: 1, fontSize: 13, color: '#666', lineHeight: 18},
  bubble: {maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8},
  bubbleUser: {alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4},
  bubbleAI: {alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 4},
  bubbleText: {fontSize: 15, color: '#333', lineHeight: 22}, bubbleTextUser: {color: 'white'},
  inputBar: {flexDirection: 'row', padding: 12, gap: 8, backgroundColor: 'white', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA'},
  resetBtn: {justifyContent: 'center', paddingHorizontal: 4},
  input: {flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#000'},
  sendBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center'},
  sendDis: {opacity: 0.4},
});
