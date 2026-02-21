import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAppState} from '../components/AppState';

const SETUP_STEPS = [
  {
    number: '1',
    title: 'Open Settings',
    description: 'Go to Settings app on your device',
  },
  {
    number: '2',
    title: 'Apple Intelligence & Siri',
    description: 'Navigate to Apple Intelligence & Siri settings',
  },
  {
    number: '3',
    title: 'Enable Apple Intelligence',
    description: 'Turn on Apple Intelligence toggle',
  },
  {
    number: '4',
    title: 'Wait for Setup',
    description: 'Models will be downloaded in the background',
  },
];

export default function SettingsScreen() {
  const {initializeSDK, capability} = useAppState();

  const handleRefresh = async () => {
    await initializeSDK();
    Alert.alert('Refreshed', 'SDK state has been refreshed.');
  };

  const handleOpenSettings = async () => {
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

  const handleOpenDocs = () => {
    Linking.openURL('https://locanara.com/docs');
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/hyodotdev/locanara');
  };

  const showSetupGuide =
    Platform.OS === 'ios' &&
    capability?.supportsAppleIntelligence &&
    !capability?.isModelReady;

  return (
    <ScrollView style={styles.container}>
      {/* Setup Guide Section (iOS only, when model not ready) */}
      {showSetupGuide && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SETUP GUIDE</Text>
          <View style={styles.sectionContent}>
            {SETUP_STEPS.map((step, index) => (
              <View key={step.number}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Apple Intelligence Section (iOS only) */}
      {Platform.OS === 'ios' && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPLE INTELLIGENCE</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.row} onPress={handleOpenSettings}>
              <Ionicons name="settings" size={22} color="#007AFF" />
              <Text style={styles.rowText}>Open System Settings</Text>
              <Ionicons name="open-outline" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACTIONS</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.row} onPress={handleRefresh}>
            <Ionicons name="refresh" size={22} color="#007AFF" />
            <Text style={styles.rowText}>Refresh SDK State</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Links Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>LINKS</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.row} onPress={handleOpenDocs}>
            <Ionicons name="book" size={22} color="#007AFF" />
            <Text style={styles.rowText}>Documentation</Text>
            <Ionicons name="open-outline" size={20} color="#C7C7CC" />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={handleOpenGitHub}>
            <Ionicons name="logo-github" size={22} color="#007AFF" />
            <Text style={styles.rowText}>GitHub Repository</Text>
            <Ionicons name="open-outline" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.sectionContent}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>react-native-ondevice-ai</Text>
            <Text style={styles.aboutValue}>v0.1.0</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Locanara SDK</Text>
            <Text style={styles.aboutValue}>Open Source</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        All AI processing happens on-device.{'\n'}
        Your data never leaves this device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    marginLeft: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 50,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 17,
    color: '#000',
  },
  aboutValue: {
    fontSize: 17,
    color: '#666',
  },
  footer: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
  },
});
