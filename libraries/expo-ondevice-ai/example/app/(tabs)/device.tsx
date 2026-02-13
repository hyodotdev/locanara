import React from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
import {useAppState} from '../../components/AppState';
import {InfoRow} from '../../components/shared/InfoRow';

export default function DeviceScreen() {
  const {deviceInfo, capability, sdkState} = useAppState();

  return (
    <ScrollView style={styles.container}>
      {/* Device Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>DEVICE</Text>
        <View style={styles.sectionContent}>
          <InfoRow label="Platform" value={deviceInfo?.platform || 'Unknown'} />
          <View style={styles.separator} />
          <InfoRow
            label="OS Version"
            value={deviceInfo?.osVersion || 'Unknown'}
          />
        </View>
      </View>

      {/* AI Capabilities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>AI CAPABILITIES</Text>
        <View style={styles.sectionContent}>
          <InfoRow
            label="On-Device AI"
            value={
              deviceInfo?.supportsOnDeviceAI ? 'Supported' : 'Not Supported'
            }
            valueColor={deviceInfo?.supportsOnDeviceAI ? '#34C759' : '#FF3B30'}
          />
          <View style={styles.separator} />
          <InfoRow label="Provider" value={deviceInfo?.provider || 'None'} />
        </View>
      </View>

      {/* Available Features Section */}
      {capability && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AVAILABLE FEATURES</Text>
          <View style={styles.sectionContent}>
            <InfoRow
              label="Summarize"
              value={capability.features.summarize ? 'Yes' : 'No'}
              valueColor={capability.features.summarize ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Classify"
              value={capability.features.classify ? 'Yes' : 'No'}
              valueColor={capability.features.classify ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Extract"
              value={capability.features.extract ? 'Yes' : 'No'}
              valueColor={capability.features.extract ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Chat"
              value={capability.features.chat ? 'Yes' : 'No'}
              valueColor={capability.features.chat ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Translate"
              value={capability.features.translate ? 'Yes' : 'No'}
              valueColor={capability.features.translate ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Rewrite"
              value={capability.features.rewrite ? 'Yes' : 'No'}
              valueColor={capability.features.rewrite ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Proofread"
              value={capability.features.proofread ? 'Yes' : 'No'}
              valueColor={capability.features.proofread ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.separator} />
            <InfoRow
              label="Describe Image"
              value="Coming Soon"
              valueColor="#FF9500"
            />
            <View style={styles.separator} />
            <InfoRow
              label="Generate Image"
              value="Coming Soon"
              valueColor="#FF9500"
            />
          </View>
        </View>
      )}

      {/* SDK Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SDK</Text>
        <View style={styles.sectionContent}>
          <InfoRow label="Module" value="expo-ondevice-ai" />
          <View style={styles.separator} />
          <InfoRow label="Version" value="0.1.0" />
          <View style={styles.separator} />
          <InfoRow label="Tier" value="Community" />
          <View style={styles.separator} />
          <InfoRow label="SDK State" value={sdkState} />
        </View>
      </View>

      {/* Footer */}
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  footer: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
    lineHeight: 20,
  },
});
