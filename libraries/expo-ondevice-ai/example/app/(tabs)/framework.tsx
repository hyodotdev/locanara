import React from 'react';
import {View, FlatList, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {AIStatusBanner} from '../../components/shared/AIStatusBanner';

interface FrameworkDemo {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const FRAMEWORK_DEMOS: FrameworkDemo[] = [
  {
    id: 'model',
    name: 'Model',
    icon: 'hardware-chip',
    description:
      'Direct model usage with GenerationConfig presets and streaming',
  },
  {
    id: 'chain',
    name: 'Chain',
    icon: 'link',
    description:
      'ModelChain, SequentialChain, ParallelChain, ConditionalChain, and custom chains',
  },
  {
    id: 'pipeline',
    name: 'Pipeline DSL',
    icon: 'swap-horizontal',
    description:
      'Compose multiple AI steps into a single pipeline with compile-time type safety',
  },
  {
    id: 'memory',
    name: 'Memory',
    icon: 'bulb',
    description:
      'BufferMemory and SummaryMemory — conversation history management',
  },
  {
    id: 'guardrail',
    name: 'Guardrail',
    icon: 'shield-checkmark',
    description: 'Wrap chains with input length and content safety guardrails',
  },
  {
    id: 'session',
    name: 'Session',
    icon: 'chatbubbles',
    description:
      'Stateful chat with BufferMemory — see memory entries in real-time',
  },
  {
    id: 'agent',
    name: 'Agent + Tools',
    icon: 'person-circle',
    description: 'ReAct-lite agent with tools and step-by-step reasoning trace',
  },
];

export default function FrameworkScreen() {
  const router = useRouter();

  const handlePress = (demo: FrameworkDemo) => {
    router.push(`/framework/${demo.id}`);
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <AIStatusBanner />
          <View style={styles.intro}>
            <Text style={styles.introText}>
              Explore Locanara's composable framework primitives — the building
              blocks for custom AI features.
            </Text>
          </View>
        </>
      }
      data={FRAMEWORK_DEMOS}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => (
        <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.7}>
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color="#007AFF" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponentStyle={styles.header}
    />
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {paddingBottom: 20},
  header: {marginBottom: 16},
  intro: {paddingHorizontal: 16, paddingTop: 8},
  introText: {fontSize: 14, color: '#666', lineHeight: 20},
  row: {
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
  rowContent: {flex: 1, marginRight: 8},
  rowName: {fontSize: 17, fontWeight: '600', color: '#000', marginBottom: 2},
  rowDescription: {fontSize: 13, color: '#666', lineHeight: 18},
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 68,
  },
});
