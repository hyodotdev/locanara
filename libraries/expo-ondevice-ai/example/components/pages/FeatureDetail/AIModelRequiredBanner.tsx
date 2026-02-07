import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

export function AIModelRequiredBanner() {
  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={20} color="#FF9500" />
      <View style={styles.content}>
        <Text style={styles.title}>AI Model Not Available</Text>
        <Text style={styles.subtitle}>
          This feature requires on-device AI support
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
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    marginBottom: 16,
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
});
