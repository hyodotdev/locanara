import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useLocalSearchParams, Stack} from 'expo-router';
import {
  ModelDemo,
  ChainDemo,
  PipelineDemo,
  MemoryDemo,
  GuardrailDemo,
  SessionDemo,
  AgentDemo,
} from '../../components/pages/FrameworkDetail';

const FRAMEWORK_NAMES: Record<string, string> = {
  model: 'Model',
  chain: 'Chain',
  pipeline: 'Pipeline',
  memory: 'Memory',
  guardrail: 'Guardrail',
  session: 'Session',
  agent: 'Agent',
};

export default function FrameworkDetailScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const name = FRAMEWORK_NAMES[id || ''] || 'Framework';

  const renderDemo = () => {
    switch (id) {
      case 'model':
        return <ModelDemo />;
      case 'chain':
        return <ChainDemo />;
      case 'pipeline':
        return <PipelineDemo />;
      case 'memory':
        return <MemoryDemo />;
      case 'guardrail':
        return <GuardrailDemo />;
      case 'session':
        return <SessionDemo />;
      case 'agent':
        return <AgentDemo />;
      default:
        return (
          <View style={styles.unknown}>
            <Text style={styles.unknownText}>Unknown Framework</Text>
          </View>
        );
    }
  };

  return (
    <>
      <Stack.Screen options={{title: name}} />
      {renderDemo()}
    </>
  );
}

const styles = StyleSheet.create({
  unknown: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  unknownText: {
    fontSize: 17,
    color: '#666',
  },
});
