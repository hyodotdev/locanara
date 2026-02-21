import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {chatStream} from 'react-native-ondevice-ai';
import type {ChatMessage} from 'react-native-ondevice-ai';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function SessionDemo() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const maxMemoryEntries = 6;
  const history: ChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const contextHistory = history.slice(-maxMemoryEntries);
  const tokenEstimate = contextHistory.reduce(
    (sum, m) => sum + Math.ceil(m.content.length / 4),
    0,
  );

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Build history from current messages before state updates
    const currentHistory: ChatMessage[] = [
      ...messages.map((m) => ({role: m.role, content: m.content})),
      {role: 'user' as const, content: userMessage},
    ].slice(-maxMemoryEntries);

    setMessages((prev) => [...prev, {role: 'user', content: userMessage}]);

    try {
      let accumulated = '';
      setMessages((prev) => [...prev, {role: 'assistant', content: '...'}]);

      console.log('[DEBUG] session chatStream request:', JSON.stringify({message: userMessage, historyLength: currentHistory.length}));
      await chatStream(userMessage, {
        systemPrompt: 'You are a helpful assistant. Keep responses concise.',
        history: currentHistory,
        onChunk: (chunk) => {
          accumulated = chunk.accumulated;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {role: 'assistant', content: accumulated};
            return updated;
          });
        },
      });
    } catch (e: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${e.message}`,
        };
        return updated;
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}>
        <CodePatternCard
          title="Native Code Pattern"
          code={`// Swift - Stateful Session
let session = Session(
  model: model,
  memory: BufferMemory(maxEntries: 6),
  systemPrompt: "You are helpful."
)

// Each call auto-manages memory
let r1 = try await session.send("Hello!")
let r2 = try await session.send("Follow up")

// Inspect memory state
session.memory.entries  // [user, assistant, ...]
session.memory.estimatedTokenCount`}
        />

        {/* Memory Inspector */}
        <TouchableOpacity
          style={styles.memoryToggle}
          onPress={() => setShowMemory(!showMemory)}>
          <Ionicons name="bulb" size={18} color="#007AFF" />
          <Text style={styles.memoryToggleText}>Memory Inspector</Text>
          <View style={styles.badgeRow}>
            <StatBadge label="Entries" value={`${contextHistory.length}`} />
            <StatBadge label="Tokens" value={`~${tokenEstimate}`} />
          </View>
          <Ionicons
            name={showMemory ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#8E8E93"
          />
        </TouchableOpacity>

        {showMemory && contextHistory.length > 0 && (
          <View style={styles.memoryEntries}>
            {contextHistory.map((entry, i) => (
              <View key={i} style={styles.memoryEntry}>
                <View
                  style={[
                    styles.memBadge,
                    entry.role === 'user' ? styles.memBadgeUser : styles.memBadgeAI,
                  ]}>
                  <Text style={styles.memBadgeText}>
                    {entry.role === 'user' ? 'U' : 'A'}
                  </Text>
                </View>
                <Text style={styles.memEntryText} numberOfLines={2}>
                  {entry.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
            ]}>
            <Text
              style={[
                styles.bubbleText,
                msg.role === 'user' && styles.bubbleTextUser,
              ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isProcessing && messages[messages.length - 1]?.content === '...' && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
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
          style={[styles.sendButton, (!input.trim() || isProcessing) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isProcessing}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  scrollArea: {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 8},
  memoryToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8,
  },
  memoryToggleText: {fontSize: 14, fontWeight: '600', color: '#333', marginRight: 'auto'},
  badgeRow: {flexDirection: 'row', gap: 4},
  memoryEntries: {
    backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  memoryEntry: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4},
  memBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  memBadgeUser: {backgroundColor: '#007AFF'},
  memBadgeAI: {backgroundColor: '#34C759'},
  memBadgeText: {fontSize: 11, fontWeight: '700', color: 'white'},
  memEntryText: {flex: 1, fontSize: 13, color: '#666', lineHeight: 18},
  bubble: {
    maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, marginBottom: 8,
  },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    alignSelf: 'flex-start', backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {fontSize: 15, color: '#333', lineHeight: 22},
  bubbleTextUser: {color: 'white'},
  typingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4},
  typingText: {fontSize: 13, color: '#999'},
  inputBar: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA',
  },
  resetButton: {justifyContent: 'center', paddingHorizontal: 4},
  input: {
    flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#000',
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: {opacity: 0.4},
});
