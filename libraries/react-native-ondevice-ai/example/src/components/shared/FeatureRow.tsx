import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type {FeatureInfo} from '../AppState';

interface FeatureRowProps {
  feature: FeatureInfo;
}

export function FeatureRow({feature}: FeatureRowProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          !feature.isAvailable && styles.iconDisabled,
        ]}
      >
        <Ionicons
          name={feature.icon as any}
          size={24}
          color={feature.isAvailable ? '#007AFF' : '#999'}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[styles.name, !feature.isAvailable && styles.textDisabled]}
        >
          {feature.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {feature.description}
        </Text>
      </View>
      {feature.isComingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : !feature.isAvailable ? (
        <Ionicons name="lock-closed" size={16} color="#999" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconDisabled: {
    backgroundColor: '#E5E5EA',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  textDisabled: {
    color: '#999',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: '#8E8E93',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
});
