import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {Platform} from 'react-native';
import {
  initialize,
  getDeviceCapability,
  getAvailableModels,
  getDownloadedModels,
  getLoadedModel,
  getCurrentEngine,
  downloadModel,
  loadModel as loadModelNative,
  deleteModel as deleteModelNative,
} from 'react-native-ondevice-ai';
import type {
  DeviceCapability,
  DownloadableModelInfo,
  ModelDownloadProgress,
  InferenceEngine,
} from 'react-native-ondevice-ai';

// Feature types matching iOS (text and image features)
export type FeatureType =
  | 'summarize'
  | 'classify'
  | 'extract'
  | 'chat'
  | 'translate'
  | 'rewrite'
  | 'proofread'
  | 'describeImage'
  | 'generateImage';

export interface FeatureInfo {
  id: string;
  type: FeatureType;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isComingSoon?: boolean;
}

export interface DeviceInfoDisplay {
  platform: string;
  osVersion: string;
  supportsOnDeviceAI: boolean;
  provider: string;
}

type SDKState = 'notInitialized' | 'initializing' | 'initialized' | 'error';

interface ModelState {
  currentEngine: InferenceEngine;
  availableModels: DownloadableModelInfo[];
  downloadedModelIds: string[];
  loadedModelId: string | null;
  downloadProgress: ModelDownloadProgress | null;
  isDownloading: boolean;
}

interface AppStateContextType {
  sdkState: SDKState;
  errorMessage: string | null;
  deviceInfo: DeviceInfoDisplay | null;
  capability: DeviceCapability | null;
  availableFeatures: FeatureInfo[];
  isModelReady: boolean;
  initializeSDK: () => Promise<void>;
  modelState: ModelState;
  refreshModels: () => Promise<void>;
  downloadModelById: (modelId: string) => Promise<void>;
  loadModelById: (modelId: string) => Promise<void>;
  deleteModelById: (modelId: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

const FEATURE_DEFINITIONS: Omit<FeatureInfo, 'isAvailable'>[] = [
  {
    id: 'summarize',
    type: 'summarize',
    name: 'Summarize',
    description: 'Condense long text into concise summaries',
    icon: 'document-text',
  },
  {
    id: 'classify',
    type: 'classify',
    name: 'Classify',
    description: 'Categorize content into predefined labels',
    icon: 'pricetag',
  },
  {
    id: 'extract',
    type: 'extract',
    name: 'Extract',
    description: 'Extract entities and key information from text',
    icon: 'scan',
  },
  {
    id: 'chat',
    type: 'chat',
    name: 'Chat',
    description: 'Have conversational interactions with AI',
    icon: 'chatbubbles',
  },
  {
    id: 'translate',
    type: 'translate',
    name: 'Translate',
    description: 'Translate text between languages',
    icon: 'globe',
  },
  {
    id: 'rewrite',
    type: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrite text in different styles or tones',
    icon: 'create',
  },
  {
    id: 'proofread',
    type: 'proofread',
    name: 'Proofread',
    description: 'Check and correct grammar and spelling',
    icon: 'checkmark-circle',
  },
  {
    id: 'describeImage',
    type: 'describeImage',
    name: 'Describe Image',
    description: 'Generate descriptions for images',
    icon: 'image',
  },
  {
    id: 'generateImage',
    type: 'generateImage',
    name: 'Generate Image',
    description: 'Generate images from text prompts',
    icon: 'color-wand',
  },
];

export function AppStateProvider({children}: {children: ReactNode}) {
  const [sdkState, setSdkState] = useState<SDKState>('notInitialized');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoDisplay | null>(null);
  const [capability, setCapability] = useState<DeviceCapability | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<FeatureInfo[]>([]);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelState, setModelState] = useState<ModelState>({
    currentEngine: 'none',
    availableModels: [],
    downloadedModelIds: [],
    loadedModelId: null,
    downloadProgress: null,
    isDownloading: false,
  });

  const refreshModels = useCallback(async () => {
    try {
      const [models, downloaded, loaded, engine] = await Promise.all([
        getAvailableModels(),
        getDownloadedModels(),
        getLoadedModel(),
        getCurrentEngine(),
      ]);
      setModelState((prev) => ({
        ...prev,
        availableModels: models,
        downloadedModelIds: downloaded,
        loadedModelId: loaded,
        currentEngine: engine,
      }));
    } catch {
      // Model management may not be available on all devices
    }
  }, []);

  const downloadModelById = useCallback(
    async (modelId: string) => {
      setModelState((prev) => ({
        ...prev,
        isDownloading: true,
        downloadProgress: null,
      }));
      try {
        await downloadModel(modelId, (progress) => {
          setModelState((prev) => ({...prev, downloadProgress: progress}));
        });
        await refreshModels();
      } finally {
        setModelState((prev) => ({
          ...prev,
          isDownloading: false,
          downloadProgress: null,
        }));
      }
    },
    [refreshModels],
  );

  const loadModelById = useCallback(
    async (modelId: string) => {
      await loadModelNative(modelId);
      await refreshModels();
    },
    [refreshModels],
  );

  const deleteModelById = useCallback(
    async (modelId: string) => {
      await deleteModelNative(modelId);
      await refreshModels();
    },
    [refreshModels],
  );

  const initializeSDK = async () => {
    if (sdkState === 'initializing' || sdkState === 'initialized') {
      return;
    }

    setSdkState('initializing');
    setErrorMessage(null);

    try {
      // Initialize SDK first
      await initialize();

      // Then get device capability
      const cap = await getDeviceCapability();
      setCapability(cap);
      setIsModelReady(cap.isModelReady ?? cap.isSupported);

      // Set device info
      setDeviceInfo({
        platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
        osVersion: Platform.Version.toString(),
        supportsOnDeviceAI: cap.isSupported,
        provider: cap.platform === 'IOS' ? 'Apple Intelligence' : 'Gemini Nano',
      });

      // Set available features based on capability
      const modelReady = cap.isModelReady ?? cap.isSupported;
      const comingSoonFeatures: FeatureType[] = [
        'describeImage',
        'generateImage',
      ];
      const features = FEATURE_DEFINITIONS.map((def) => {
        const isComingSoon = comingSoonFeatures.includes(def.type);
        return {
          ...def,
          isAvailable: isComingSoon
            ? false
            : modelReady &&
              (cap.features?.[def.type as keyof typeof cap.features] ?? false),
          isComingSoon,
        };
      });
      setAvailableFeatures(features);

      setSdkState('initialized');

      // Load model info after initialization
      try {
        const [models, downloaded, loaded, engine] = await Promise.all([
          getAvailableModels(),
          getDownloadedModels(),
          getLoadedModel(),
          getCurrentEngine(),
        ]);
        setModelState((prev) => ({
          ...prev,
          availableModels: models,
          downloadedModelIds: downloaded,
          loadedModelId: loaded,
          currentEngine: engine,
        }));
      } catch {
        // Model management may not be available
      }
    } catch (error: any) {
      setSdkState('error');
      setErrorMessage(error.message || 'Failed to initialize SDK');
    }
  };

  useEffect(() => {
    initializeSDK();
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        sdkState,
        errorMessage,
        deviceInfo,
        capability,
        availableFeatures,
        isModelReady,
        initializeSDK,
        modelState,
        refreshModels,
        downloadModelById,
        loadModelById,
        deleteModelById,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
