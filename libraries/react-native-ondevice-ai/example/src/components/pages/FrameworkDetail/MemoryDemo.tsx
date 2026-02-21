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
import {chat} from 'react-native-ondevice-ai';
import type {ChatMessage} from 'react-native-ondevice-ai';
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

    const userMessage = input.trim();
    setInput('');

    const newHistory: ChatMessage[] = [
      ...history,
      {role: 'user' as const, content: userMessage},
    ];

    // For buffer memory, keep only last N entries
    const contextHistory =
      memoryType === 'buffer' ? newHistory.slice(-maxEntries) : newHistory;

    try {
      console.log('[DEBUG] memory chat request:', JSON.stringify({message: userMessage, memoryType, historyLength: contextHistory.length}));
      const result = await chat(userMessage, {
        systemPrompt: 'You are a helpful assistant. Keep responses short.',
        history: contextHistory,
      });
      console.log('[DEBUG] memory chat response:', JSON.stringify(result));

      const updatedHistory: ChatMessage[] = [
        ...newHistory,
        {role: 'assistant' as const, content: result.message},
      ];
      setHistory(updatedHistory);
    } catch (e: any) {
      const updatedHistory: ChatMessage[] = [
        ...newHistory,
        {role: 'assistant' as const, content: `Error: ${e.message}`},
      ];
      setHistory(updatedHistory);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setHistory([]);
    setInput('');
  };

  const displayHistory =
    memoryType === 'buffer' ? history.slice(-maxEntries) : history;
  const tokenEstimate = history.reduce(
    (sum, m) => sum + Math.ceil(m.content.length / 4),
    0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard
        title="Native Code Pattern"
        code={`// Swift - BufferMemory
let memory = BufferMemory(
  maxEntries: 4,
  maxTokens: 500
)

// Swift - SummaryMemory
let memory = SummaryMemory(
  model: model,
  keepRecentTurns: 2
)

// Use with ChatChain
let chain = ChatChain(
  model: model,
  memory: memory
)
let result = try await chain.run("Hello!")`}
      />

      <Text style={styles.sectionTitle}>Memory Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.typeButton, memoryType === 'buffer' && styles.typeSelected]}
          onPress={() => {
            setMemoryType('buffer');
            handleClear();
          }}>
          <Text style={[styles.typeText, memoryType === 'buffer' && styles.typeTextSelected]}>
            Buffer
          </Text>
          <Text style={[styles.typeDesc, memoryType === 'buffer' && styles.typeDescSelected]}>
            Last {maxEntries} entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, memoryType === 'summary' && styles.typeSelected]}
          onPress={() => {
            setMemoryType('summary');
            handleClear();
          }}>
          <Text style={[styles.typeText, memoryType === 'summary' && styles.typeTextSelected]}>
            Summary
          </Text>
          <Text style={[styles.typeDesc, memoryType === 'summary' && styles.typeDescSelected]}>
            Compressed history
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        <StatBadge label="Entries" value={`${history.length}`} />
        <StatBadge label="In Context" value={`${displayHistory.length}`} />
        <StatBadge label="Tokens" value={`~${tokenEstimate}`} />
      </View>

      {/* Memory entries */}
      <View style={styles.memoryCard}>
        <View style={styles.memoryHeader}>
          <Text style={styles.memoryTitle}>Memory Entries</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {displayHistory.length === 0 ? (
          <Text style={styles.emptyText}>No entries yet. Start a conversation.</Text>
        ) : (
          displayHistory.map((entry, i) => (
            <View key={i} style={styles.entryRow}>
              <View
                style={[
                  styles.roleBadge,
                  entry.role === 'user' ? styles.userBadge : styles.assistantBadge,
                ]}>
                <Text style={styles.roleBadgeText}>
                  {entry.role === 'user' ? 'U' : 'A'}
                </Text>
              </View>
              <Text style={styles.entryContent} numberOfLines={3}>
                {entry.content}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, isProcessing && styles.sendDisabled]}
          onPress={handleSend}
          disabled={isProcessing || !input.trim()}>
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  row: {flexDirection: 'row', gap: 8, marginBottom: 12},
  typeButton: {
    flex: 1, padding: 12, borderRadius: 10,
    backgroundColor: 'white', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E5EA',
  },
  typeSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  typeText: {fontSize: 15, fontWeight: '600', color: '#333'},
  typeTextSelected: {color: 'white'},
  typeDesc: {fontSize: 12, color: '#999', marginTop: 2},
  typeDescSelected: {color: 'rgba(255,255,255,0.8)'},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap'},
  memoryCard: {backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12},
  memoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  memoryTitle: {fontSize: 15, fontWeight: '600', color: '#333'},
  clearText: {fontSize: 14, color: '#FF3B30', fontWeight: '500'},
  emptyText: {fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 12},
  entryRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, gap: 8},
  roleBadge: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  userBadge: {backgroundColor: '#007AFF'},
  assistantBadge: {backgroundColor: '#34C759'},
  roleBadgeText: {fontSize: 12, fontWeight: '700', color: 'white'},
  entryContent: {flex: 1, fontSize: 14, color: '#333', lineHeight: 20},
  inputRow: {flexDirection: 'row', gap: 8},
  input: {
    flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 12,
    fontSize: 15, color: '#000',
  },
  sendButton: {
    backgroundColor: '#007AFF', paddingHorizontal: 20,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: {opacity: 0.6},
  sendText: {color: 'white', fontSize: 15, fontWeight: '600'},
});
