import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface Props {
  title: string;
  code: string;
}

export function CodePatternCard({title, code}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons name="code-slash" size={16} color="#007AFF" />
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#8E8E93"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{code}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  title: {flex: 1, fontSize: 14, fontWeight: '600', color: '#333'},
  codeContainer: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  code: {fontFamily: 'Menlo', fontSize: 12, color: '#D4D4D4', lineHeight: 18},
});
