import React from 'react';
import {View, FlatList, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import {useAppState} from '../components/AppState';
import {FeatureRow} from '../components/shared/FeatureRow';
import {AIStatusBanner} from '../components/shared/AIStatusBanner';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function FeaturesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {sdkState, availableFeatures, errorMessage, initializeSDK} =
    useAppState();

  if (sdkState === 'notInitialized' || sdkState === 'initializing') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Initializing Locanara SDK...</Text>
      </View>
    );
  }

  if (sdkState === 'error') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeSDK}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFeaturePress = (featureId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    navigation.navigate('FeatureDetail', {
      id: featureId,
      name: FEATURE_NAMES[featureId] || 'Feature',
    });
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<AIStatusBanner />}
      data={availableFeatures}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => (
        <TouchableOpacity
          onPress={() => handleFeaturePress(item.id, item.isAvailable)}
          disabled={!item.isAvailable}
          activeOpacity={0.7}>
          <FeatureRow feature={item} />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponentStyle={styles.header}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 17,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 68,
  },
});
