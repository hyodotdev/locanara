import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

export interface DebugLog {
  api: string;
  request: any;
  response: any;
  timing: number;
}

export function DebugLogPanel({log}: {log: DebugLog | null}) {
  const [expanded, setExpanded] = useState(false);
  if (!log) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons name="code-slash" size={16} color="#8E8E93" />
        <Text style={styles.title}>Debug Log</Text>
        <Text style={styles.timing}>{log.timing}ms</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#8E8E93"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.label}>API</Text>
          <Text style={styles.api}>{log.api}</Text>
          <Text style={styles.label}>Request</Text>
          <ScrollView horizontal style={styles.codeScroll}>
            <Text style={styles.code} selectable>
              {JSON.stringify(log.request, null, 2)}
            </Text>
          </ScrollView>
          <Text style={styles.label}>Response</Text>
          <ScrollView horizontal style={styles.codeScroll}>
            <Text style={styles.code} selectable>
              {JSON.stringify(log.response, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginTop: 12,
    overflow: 'hidden',
  },
  header: {flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8},
  title: {flex: 1, fontSize: 14, fontWeight: '600', color: '#8E8E93'},
  timing: {fontSize: 13, fontWeight: '500', color: '#30D158', marginRight: 4},
  body: {paddingHorizontal: 12, paddingBottom: 12},
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  api: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A84FF',
    fontFamily: 'monospace',
  },
  codeScroll: {maxHeight: 200},
  code: {
    fontSize: 12,
    color: '#E5E5EA',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
