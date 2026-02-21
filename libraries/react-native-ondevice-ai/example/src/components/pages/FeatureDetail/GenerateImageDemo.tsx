import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AIModelRequiredBanner} from './AIModelRequiredBanner';
import {useAppState} from '../../AppState';

export function GenerateImageDemo() {
  const {isModelReady} = useAppState();

  return (
    <View style={styles.container}>
      {!isModelReady && <AIModelRequiredBanner />}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="color-wand" size={80} color="#C7C7CC" />
        </View>

        <Text style={styles.title}>Generate Image</Text>
        <Text style={styles.subtitle}>
          Generate images from text prompts using on-device AI
        </Text>

        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>

        <Text style={styles.description}>
          This feature will allow you to generate images from text descriptions
          using Apple Intelligence or Gemini Nano, depending on your device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  comingSoonBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  comingSoonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
