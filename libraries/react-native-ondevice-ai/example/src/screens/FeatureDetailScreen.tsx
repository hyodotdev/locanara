import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
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
} from '../components/pages/FeatureDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'FeatureDetail'>;

export default function FeatureDetailScreen({route}: Props) {
  const {id} = route.params;

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

  return <>{renderDemo()}</>;
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
