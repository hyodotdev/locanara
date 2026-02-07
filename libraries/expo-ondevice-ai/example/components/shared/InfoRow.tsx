import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function InfoRow({label, value, valueColor}: InfoRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor ? {color: valueColor} : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  value: {
    fontSize: 17,
    color: '#666',
  },
});
