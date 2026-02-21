import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import {
  ModelDemo,
  ChainDemo,
  PipelineDemo,
  MemoryDemo,
  GuardrailDemo,
  SessionDemo,
  AgentDemo,
} from '../components/pages/FrameworkDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'FrameworkDetail'>;

export default function FrameworkDetailScreen({route}: Props) {
  const {id} = route.params;

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
          <View style={styles.center}>
            <Text style={styles.centerText}>Unknown Demo</Text>
          </View>
        );
    }
  };

  return <>{renderDemo()}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  centerText: {
    fontSize: 17,
    color: '#666',
  },
});
