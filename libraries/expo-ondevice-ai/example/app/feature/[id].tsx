import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useLocalSearchParams, Stack} from 'expo-router';
import {
  SummarizeDemo,
  ClassifyDemo,
  ExtractDemo,
  ChatDemo,
  TranslateDemo,
  RewriteDemo,
  ProofreadDemo,
  DescribeImageDemo,
  GenerateImageDemo,
} from '../../components/pages/FeatureDetail';

const FEATURE_NAMES: Record<string, string> = {
  summarize: 'Summarize',
  classify: 'Classify',
  extract: 'Extract',
  chat: 'Chat',
  translate: 'Translate',
  rewrite: 'Rewrite',
  proofread: 'Proofread',
  describeImage: 'Describe Image',
  generateImage: 'Generate Image',
};

export default function FeatureDetailScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const featureName = FEATURE_NAMES[id || ''] || 'Feature';

  const renderDemo = () => {
    switch (id) {
      case 'summarize':
        return <SummarizeDemo />;
      case 'classify':
        return <ClassifyDemo />;
      case 'extract':
        return <ExtractDemo />;
      case 'chat':
        return <ChatDemo />;
      case 'translate':
        return <TranslateDemo />;
      case 'rewrite':
        return <RewriteDemo />;
      case 'proofread':
        return <ProofreadDemo />;
      case 'describeImage':
        return <DescribeImageDemo />;
      case 'generateImage':
        return <GenerateImageDemo />;
      default:
        return (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>Unknown Feature</Text>
          </View>
        );
    }
  };

  return (
    <>
      <Stack.Screen options={{title: featureName}} />
      {renderDemo()}
    </>
  );
}

const styles = StyleSheet.create({
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  comingSoonText: {
    fontSize: 17,
    color: '#666',
  },
});
