import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAppState} from '../AppState';
import type {DownloadableModelInfo} from 'expo-ondevice-ai';

interface ModelSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ENGINE_DISPLAY_NAMES: Record<string, string> = {
  foundation_models: 'Apple Intelligence',
  llama_cpp: 'llama.cpp',
  mlx: 'MLX',
  core_ml: 'CoreML',
  prompt_api: 'Gemini Nano',
  none: 'Not Available',
};

export function ModelSelectionSheet({
  visible,
  onClose,
}: ModelSelectionSheetProps) {
  const {
    capability,
    modelState,
    downloadModelById,
    loadModelById,
    deleteModelById,
  } = useAppState();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const engineName =
    ENGINE_DISPLAY_NAMES[modelState.currentEngine] ?? modelState.currentEngine;

  const showError = (title: string, error: any) => {
    const msg = error?.message ?? String(error);
    console.error(`[ModelSelectionSheet] ${title}: ${msg}`);
    Alert.alert(title, msg);
  };

  const handleDownload = async (model: DownloadableModelInfo) => {
    console.log(`[ModelSelectionSheet] downloadModel(${model.modelId})`);
    setActionLoading(model.modelId);
    try {
      await downloadModelById(model.modelId);
      console.log(`[ModelSelectionSheet] downloadModel(${model.modelId}) done`);
    } catch (e: any) {
      showError('Download Failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLoad = async (modelId: string) => {
    console.log(`[ModelSelectionSheet] loadModel(${modelId})`);
    setActionLoading(modelId);
    try {
      await loadModelById(modelId);
      console.log(`[ModelSelectionSheet] loadModel(${modelId}) done`);
    } catch (e: any) {
      showError('Load Failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model? You can re-download it later.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log(`[ModelSelectionSheet] deleteModel(${modelId})`);
            setActionLoading(modelId);
            try {
              await deleteModelById(modelId);
              console.log(`[ModelSelectionSheet] deleteModel(${modelId}) done`);
            } catch (e: any) {
              showError('Delete Failed', e);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const isDownloaded = (modelId: string) =>
    modelState.downloadedModelIds.includes(modelId);
  const isLoaded = (modelId: string) => modelState.loadedModelId === modelId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>On-Device AI Models</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle-outline" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Download Progress */}
        {modelState.isDownloading && modelState.downloadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(modelState.downloadProgress.progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Downloading...{' '}
              {Math.round(modelState.downloadProgress.progress * 100)}%
            </Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Engine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Engine</Text>
            <View style={styles.engineCard}>
              <View style={styles.engineInfo}>
                <Ionicons
                  name={
                    modelState.currentEngine === 'none'
                      ? 'close-circle'
                      : 'sparkles'
                  }
                  size={24}
                  color={
                    modelState.currentEngine === 'none' ? '#FF3B30' : '#007AFF'
                  }
                />
                <View style={styles.engineTextContainer}>
                  <Text style={styles.engineName}>{engineName}</Text>
                  <Text style={styles.engineSubtitle}>
                    {modelState.currentEngine === 'none'
                      ? 'No AI engine available'
                      : Platform.OS === 'ios'
                        ? 'Apple on-device AI'
                        : 'Google on-device AI'}
                  </Text>
                </View>
              </View>
              {modelState.currentEngine !== 'none' && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* Downloadable Models (iOS only) */}
          {Platform.OS === 'ios' && modelState.availableModels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Models</Text>
              {modelState.availableModels.map((model) => (
                <ModelRow
                  key={model.modelId}
                  model={model}
                  downloaded={isDownloaded(model.modelId)}
                  loaded={isLoaded(model.modelId)}
                  loading={actionLoading === model.modelId}
                  isDownloading={modelState.isDownloading}
                  onDownload={() => handleDownload(model)}
                  onLoad={() => handleLoad(model.modelId)}
                  onDelete={() => handleDelete(model.modelId)}
                />
              ))}
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.aboutCard}>
              <AboutRow
                icon="lock-closed"
                title="Private"
                subtitle="All data stays on your device"
              />
              <AboutRow
                icon="cloud-offline"
                title="Offline"
                subtitle="Works without internet connection"
              />
              <AboutRow
                icon="flash"
                title="Fast"
                subtitle="Low latency, hardware-accelerated"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ModelRow({
  model,
  downloaded,
  loaded,
  loading,
  isDownloading,
  onDownload,
  onLoad,
  onDelete,
}: {
  model: DownloadableModelInfo;
  downloaded: boolean;
  loaded: boolean;
  loading: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.modelRow}>
      <View style={styles.modelInfo}>
        <Text style={styles.modelName}>{model.name}</Text>
        <Text style={styles.modelMeta}>
          {model.sizeMB} MB · {model.quantization} ·{' '}
          {model.contextLength.toLocaleString()} ctx
          {model.isMultimodal ? ' · Vision' : ''}
        </Text>
      </View>
      <View style={styles.modelActions}>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : loaded ? (
          <View style={styles.loadedBadge}>
            <Text style={styles.loadedBadgeText}>Loaded</Text>
          </View>
        ) : downloaded ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={onLoad}>
              <Text style={styles.actionButtonText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isDownloading && styles.actionButtonDisabled,
            ]}
            onPress={onDownload}
            disabled={isDownloading}
          >
            <Ionicons
              name="cloud-download-outline"
              size={14}
              color={isDownloading ? '#999' : '#007AFF'}
            />
            <Text
              style={[
                styles.actionButtonText,
                isDownloading && {color: '#999'},
              ]}
            >
              {' '}
              {model.sizeMB} MB
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AboutRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.aboutRow}>
      <Ionicons name={icon} size={20} color="#007AFF" />
      <View style={styles.aboutTextContainer}>
        <Text style={styles.aboutTitle}>{title}</Text>
        <Text style={styles.aboutSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  engineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  engineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  engineTextContainer: {
    marginLeft: 12,
  },
  engineName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  engineSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#E3F9E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  modelMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  modelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    padding: 6,
  },
  loadedBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 32,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutTextContainer: {
    marginLeft: 12,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  aboutSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});
