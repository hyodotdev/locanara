import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking, Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAppState} from '../AppState';

export function AIStatusBanner() {
  const {isModelReady, capability, sdkState} = useAppState();

  const openSettings = async () => {
    if (Platform.OS === 'ios') {
      const urls = [
        'App-Prefs:root=APPLE_INTELLIGENCE',
        'prefs:root=APPLE_INTELLIGENCE',
        'App-Prefs:root=SIRI',
        'app-settings:',
      ];

      for (const url of urls) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return;
        }
      }

      await Linking.openSettings();
    } else {
      await Linking.openSettings();
    }
  };

  // Show loading state while initializing
  if (sdkState === 'initializing' || sdkState === 'notInitialized') {
    return (
      <View style={[styles.container, styles.checking]}>
        <Ionicons name="hourglass" size={20} color="#007AFF" />
        <View style={styles.content}>
          <Text style={styles.title}>Checking Apple Intelligence...</Text>
          <Text style={styles.subtitle}>Please wait while checking device capabilities</Text>
        </View>
      </View>
    );
  }

  // Model is ready - show success (tappable to manage models)
  if (isModelReady) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.ready]}
        onPress={openSettings}
        activeOpacity={0.7}
      >
        <Ionicons name="sparkles" size={20} color="#007AFF" />
        <View style={styles.content}>
          <Text style={styles.title}>Apple Intelligence Active</Text>
          <Text style={styles.subtitle}>Using Apple's on-device AI • Tap to manage models</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  }

  // Device supports Apple Intelligence but model not ready
  if (capability?.supportsAppleIntelligence) {
    return (
      <View style={[styles.container, styles.enableRequired]}>
        <Ionicons name="sparkles-outline" size={20} color="#FF9500" />
        <View style={styles.content}>
          <Text style={styles.title}>Apple Intelligence Required</Text>
          <Text style={styles.subtitle}>
            Enable Apple Intelligence in Settings → Apple Intelligence & Siri
          </Text>
        </View>
        <TouchableOpacity style={styles.enableButton} onPress={openSettings}>
          <Text style={styles.enableButtonText}>Enable</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Device does not support Apple Intelligence
  return (
    <View style={[styles.container, styles.notSupported]}>
      <Ionicons name="warning" size={20} color="#FF3B30" />
      <View style={styles.content}>
        <Text style={styles.title}>Device Not Supported</Text>
        <Text style={styles.subtitle}>
          This device does not support Apple Intelligence. Requires iPhone 15 Pro or newer with iOS 18.1+
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  checking: {
    backgroundColor: '#E3F2FD',
  },
  ready: {
    backgroundColor: '#E3F2FD',
  },
  enableRequired: {
    backgroundColor: '#FFF3E0',
  },
  notSupported: {
    backgroundColor: '#FFEBEE',
  },
  content: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
