import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBubble({role, content}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={[styles.text, isUser && styles.textUser]}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  containerUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: '#007AFF',
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  textUser: {
    color: 'white',
  },
});
