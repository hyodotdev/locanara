import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {
  chat,
  chatStream,
  type ChatMessage as ChatMessageType,
  ExpoOndeviceAiLog,
} from 'expo-ondevice-ai';
import {useAppState} from '../../../AppState';
import {AIModelRequiredBanner} from '../AIModelRequiredBanner';
import {ChatBubble} from './ChatBubble';
import {TypingIndicator} from './TypingIndicator';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatDemo() {
  const {isModelReady} = useAppState();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const sendMessageNonStreaming = useCallback(
    async (userMessage: string, history: ChatMessageType[]) => {
      ExpoOndeviceAiLog.d('[ChatDemo] Sending non-streaming message');

      const chatResult = await chat(userMessage, {history});

      ExpoOndeviceAiLog.d('[ChatDemo] Result received');
      ExpoOndeviceAiLog.json('[ChatDemo] ChatResult', chatResult);

      const assistantMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatResult.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    },
    [],
  );

  const sendMessageStreaming = useCallback(
    async (
      userMessage: string,
      history: ChatMessageType[],
      assistantId: string,
    ) => {
      ExpoOndeviceAiLog.d('[ChatDemo] Sending streaming message');

      // Add empty assistant bubble immediately
      setMessages((prev) => [
        ...prev,
        {id: assistantId, role: 'assistant', content: ''},
      ]);

      await chatStream(userMessage, {
        history,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? {...m, content: chunk.accumulated} : m,
            ),
          );
        },
      });

      ExpoOndeviceAiLog.d('[ChatDemo] Stream completed');
    },
    [],
  );

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !isModelReady) return;

    const userMessage = inputText.trim();
    setInputText('');

    const userDisplayMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    setMessages((prev) => [...prev, userDisplayMessage]);
    setIsLoading(true);

    try {
      const history: ChatMessageType[] = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      ExpoOndeviceAiLog.d('[ChatDemo] Sending message:', userMessage);
      ExpoOndeviceAiLog.d(
        '[ChatDemo] Mode:',
        useStreaming ? 'streaming' : 'non-streaming',
      );

      if (useStreaming) {
        const assistantId = (Date.now() + 1).toString();
        await sendMessageStreaming(userMessage, history, assistantId);
      } else {
        await sendMessageNonStreaming(userMessage, history);
      }
    } catch (error: any) {
      ExpoOndeviceAiLog.error(
        '[ChatDemo] Error: ' + (error.message || 'Unknown error'),
      );
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({item}: {item: DisplayMessage}) => (
    <ChatBubble role={item.role} content={item.content} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 88 + insets.bottom}
    >
      {!isModelReady && (
        <View style={styles.bannerContainer}>
          <AIModelRequiredBanner />
        </View>
      )}

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, !useStreaming && styles.toggleActive]}
          onPress={() => setUseStreaming(false)}
        >
          <Ionicons
            name="chatbox-outline"
            size={14}
            color={!useStreaming ? '#fff' : '#666'}
          />
          <Text
            style={[styles.toggleText, !useStreaming && styles.toggleTextActive]}
          >
            Standard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, useStreaming && styles.toggleActive]}
          onPress={() => setUseStreaming(true)}
        >
          <Ionicons
            name="flash-outline"
            size={14}
            color={useStreaming ? '#fff' : '#666'}
          />
          <Text
            style={[styles.toggleText, useStreaming && styles.toggleTextActive]}
          >
            Stream
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        ListFooterComponent={
          isLoading && !useStreaming ? (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          ) : null
        }
      />

      <View
        style={[
          styles.inputContainer,
          {paddingBottom: Math.max(insets.bottom, 12)},
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message"
          placeholderTextColor="#999"
          editable={!isLoading}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading || !isModelReady) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || !isModelReady}
        >
          <Ionicons
            name="arrow-up-circle-sharp"
            size={32}
            color={
              !inputText.trim() || isLoading || !isModelReady
                ? '#C7C7CC'
                : '#007AFF'
            }
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  bannerContainer: {
    padding: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  typingContainer: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
