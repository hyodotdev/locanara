import 'react-native-nitro-modules';
import {NitroModules} from 'react-native-nitro-modules';
import {Platform} from 'react-native';

import type {
  OndeviceAi,
  NitroChatStreamChunk,
  NitroModelDownloadProgress,
} from './specs/OndeviceAi.nitro';
import type {
  DeviceCapability,
  SummarizeOptions,
  SummarizeResult,
  ClassifyOptions,
  ClassifyResult,
  ExtractOptions,
  ExtractResult,
  ChatOptions,
  ChatResult,
  ChatStreamOptions,
  ChatStreamChunk,
  TranslateOptions,
  TranslateResult,
  RewriteOptions,
  RewriteResult,
  ProofreadOptions,
  ProofreadResult,
  InitializeResult,
  DownloadableModelInfo,
  InferenceEngine,
  ModelDownloadProgress,
} from './types';

// Re-export all public types
export type {
  DeviceCapability,
  SummarizeOptions,
  SummarizeResult,
  Classification,
  ClassifyOptions,
  ClassifyResult,
  Entity,
  ExtractOptions,
  ExtractResult,
  ChatMessage,
  ChatOptions,
  ChatResult,
  ChatStreamOptions,
  ChatStreamChunk,
  TranslateOptions,
  TranslateResult,
  RewriteOptions,
  RewriteResult,
  ProofreadCorrection,
  ProofreadOptions,
  ProofreadResult,
  InitializeResult,
  DownloadableModelInfo,
  InferenceEngine,
  ModelDownloadProgress,
  EventSubscription,
} from './types';

export type {
  SummarizeInputType,
  SummarizeOutputType,
  RewriteOutputType,
  ProofreadInputType,
  Platform as OndeviceAiPlatform,
  ModelDownloadState,
} from './types';

// ──────────────────────────────────────────────────────────────────────────
// Lazy HybridObject Singleton
// ──────────────────────────────────────────────────────────────────────────

let ref: OndeviceAi | null = null;

const toErrorMessage = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    (error as {message?: unknown}).message != null
  ) {
    return String((error as {message?: unknown}).message);
  }
  return String(error ?? '');
};

/**
 * Check if Nitro runtime is ready for on-device AI operations.
 */
export const isNitroReady = (): boolean => {
  if (ref) return true;
  try {
    ref = NitroModules.createHybridObject<OndeviceAi>('OndeviceAi');
    return true;
  } catch {
    return false;
  }
};

const AI = {
  get instance(): OndeviceAi {
    if (ref) return ref;

    try {
      ref = NitroModules.createHybridObject<OndeviceAi>('OndeviceAi');
    } catch (e) {
      const msg = toErrorMessage(e);
      if (
        msg.includes('Nitro') ||
        msg.includes('JSI') ||
        msg.includes('dispatcher') ||
        msg.includes('HybridObject')
      ) {
        throw new Error(
          'Nitro runtime not installed yet. Ensure react-native-nitro-modules is initialized before calling on-device AI.',
        );
      }
      throw e;
    }
    return ref;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Initialization & Device Info
// ──────────────────────────────────────────────────────────────────────────

/**
 * Initialize the on-device AI SDK. Must be called before using any AI features.
 */
export async function initialize(): Promise<InitializeResult> {
  const success = await AI.instance.initialize();
  return {success};
}

/**
 * Get device capability information for on-device AI.
 */
export async function getDeviceCapability(): Promise<DeviceCapability> {
  const cap = await AI.instance.getDeviceCapability();
  return {
    isSupported: cap.isSupported,
    isModelReady: cap.isModelReady,
    supportsAppleIntelligence: cap.supportsAppleIntelligence,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    features: {
      summarize: cap.featureSummarize,
      classify: cap.featureClassify,
      extract: cap.featureExtract,
      chat: cap.featureChat,
      translate: cap.featureTranslate,
      rewrite: cap.featureRewrite,
      proofread: cap.featureProofread,
    },
    availableMemoryMB: cap.availableMemoryMB,
    isLowPowerMode: cap.isLowPowerMode,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 7 AI Features
// ──────────────────────────────────────────────────────────────────────────

/**
 * Summarize text using on-device AI.
 */
export async function summarize(
  text: string,
  options?: SummarizeOptions,
): Promise<SummarizeResult> {
  const nitroOptions =
    options?.inputType || options?.outputType
      ? {
          inputType: options?.inputType ?? null,
          outputType: options?.outputType ?? null,
        }
      : null;
  const result = await AI.instance.summarize(text, nitroOptions);
  return {
    summary: result.summary,
    originalLength: result.originalLength,
    summaryLength: result.summaryLength,
    confidence: result.confidence,
  };
}

/**
 * Classify text into categories using on-device AI.
 */
export async function classify(
  text: string,
  options?: ClassifyOptions,
): Promise<ClassifyResult> {
  const result = await AI.instance.classify(
    text,
    options
      ? {
          categories: options.categories ?? null,
          maxResults: options.maxResults ?? null,
        }
      : null,
  );
  return {
    classifications: result.classifications.map((c) => ({
      label: c.label,
      score: c.score,
      metadata: c.metadata || undefined,
    })),
    topClassification: {
      label: result.topLabel,
      score: result.topScore,
    },
  };
}

/**
 * Extract entities from text using on-device AI.
 */
export async function extract(
  text: string,
  options?: ExtractOptions,
): Promise<ExtractResult> {
  const result = await AI.instance.extract(
    text,
    options?.entityTypes ? {entityTypes: options.entityTypes} : null,
  );
  return {
    entities: result.entities.map((e) => ({
      type: e.type,
      value: e.value,
      confidence: e.confidence,
      startPos: e.startPos,
      endPos: e.endPos,
    })),
  };
}

/**
 * Chat with on-device AI.
 */
export async function chat(
  message: string,
  options?: ChatOptions,
): Promise<ChatResult> {
  const result = await AI.instance.chat(
    message,
    options
      ? {
          systemPrompt: options.systemPrompt ?? null,
          history:
            options.history?.map((m) => ({
              role: m.role,
              content: m.content,
            })) ?? null,
        }
      : null,
  );
  return {
    message: result.message,
    conversationId: result.conversationId || undefined,
    canContinue: result.canContinue,
  };
}

/**
 * Chat with on-device AI using streaming responses.
 * Use `options.onChunk` to receive progressive token delivery.
 */
export async function chatStream(
  message: string,
  options?: ChatStreamOptions,
): Promise<ChatResult> {
  const onChunk = options?.onChunk;

  let listener: ((chunk: NitroChatStreamChunk) => void) | null = null;

  if (onChunk) {
    listener = (chunk: NitroChatStreamChunk) => {
      const converted: ChatStreamChunk = {
        delta: chunk.delta,
        accumulated: chunk.accumulated,
        isFinal: chunk.isFinal,
      };
      onChunk(converted);
    };
    AI.instance.addChatStreamListener(listener);
  }

  try {
    const result = await AI.instance.chatStream(
      message,
      options
        ? {
            systemPrompt: options.systemPrompt ?? null,
            history:
              options.history?.map((m) => ({
                role: m.role,
                content: m.content,
              })) ?? null,
          }
        : null,
    );

    return {
      message: result.message,
      conversationId: result.conversationId || undefined,
      canContinue: result.canContinue,
    };
  } finally {
    if (listener) {
      AI.instance.removeChatStreamListener(listener);
    }
  }
}

/**
 * Translate text using on-device AI.
 */
export async function translate(
  text: string,
  options: TranslateOptions,
): Promise<TranslateResult> {
  const result = await AI.instance.translate(text, {
    sourceLanguage: options.sourceLanguage ?? 'en',
    targetLanguage: options.targetLanguage,
  });
  return {
    translatedText: result.translatedText,
    sourceLanguage: result.sourceLanguage,
    targetLanguage: result.targetLanguage,
    confidence: result.confidence,
  };
}

/**
 * Rewrite text using on-device AI.
 */
export async function rewrite(
  text: string,
  options: RewriteOptions,
): Promise<RewriteResult> {
  const result = await AI.instance.rewrite(text, {
    outputType: options.outputType,
  });
  return {
    rewrittenText: result.rewrittenText,
    style: (result.style as RewriteOptions['outputType']) || undefined,
    confidence: result.confidence,
  };
}

/**
 * Proofread text using on-device AI.
 */
export async function proofread(
  text: string,
  _options?: ProofreadOptions,
): Promise<ProofreadResult> {
  const result = await AI.instance.proofread(text);
  return {
    correctedText: result.correctedText,
    corrections: result.corrections.map((c) => ({
      original: c.original,
      corrected: c.corrected,
      type: c.type || undefined,
      confidence: c.confidence,
      startPos: c.startPos,
      endPos: c.endPos,
    })),
    hasCorrections: result.hasCorrections,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Model Management
// ──────────────────────────────────────────────────────────────────────────

/**
 * Get available downloadable models (iOS only; Android returns empty).
 */
export async function getAvailableModels(): Promise<DownloadableModelInfo[]> {
  return AI.instance.getAvailableModels();
}

/**
 * Get IDs of downloaded models (iOS only; Android returns empty).
 */
export async function getDownloadedModels(): Promise<string[]> {
  return AI.instance.getDownloadedModels();
}

/**
 * Get the currently loaded model ID (iOS only; Android returns null).
 */
export async function getLoadedModel(): Promise<string | null> {
  const model = await AI.instance.getLoadedModel();
  return model || null;
}

/**
 * Get the current inference engine type.
 */
export async function getCurrentEngine(): Promise<InferenceEngine> {
  return AI.instance.getCurrentEngine();
}

/**
 * Download a model by ID with optional progress callback (iOS only).
 */
export async function downloadModel(
  modelId: string,
  onProgress?: (progress: ModelDownloadProgress) => void,
): Promise<boolean> {
  let listener:
    | ((progress: NitroModelDownloadProgress) => void)
    | null = null;

  if (onProgress) {
    listener = (progress: NitroModelDownloadProgress) => {
      onProgress({
        modelId: progress.modelId,
        bytesDownloaded: progress.bytesDownloaded,
        totalBytes: progress.totalBytes,
        progress: progress.progress,
        state: progress.state,
      });
    };
    AI.instance.addModelDownloadProgressListener(listener);
  }

  try {
    return await AI.instance.downloadModel(modelId);
  } finally {
    if (listener) {
      AI.instance.removeModelDownloadProgressListener(listener);
    }
  }
}

/**
 * Load a model into memory by ID (iOS only).
 */
export async function loadModel(modelId: string): Promise<void> {
  return AI.instance.loadModel(modelId);
}

/**
 * Delete a downloaded model by ID (iOS only).
 */
export async function deleteModel(modelId: string): Promise<void> {
  return AI.instance.deleteModel(modelId);
}

/**
 * Get the Prompt API model status (Android only).
 * Returns: 'available' | 'downloadable' | 'downloading' | 'not_available'
 */
export async function getPromptApiStatus(): Promise<string> {
  return AI.instance.getPromptApiStatus();
}

/**
 * Download the Prompt API model (Gemini Nano) with optional progress callback (Android only).
 */
export async function downloadPromptApiModel(
  onProgress?: (progress: ModelDownloadProgress) => void,
): Promise<boolean> {
  let listener:
    | ((progress: NitroModelDownloadProgress) => void)
    | null = null;

  if (onProgress) {
    listener = (progress: NitroModelDownloadProgress) => {
      onProgress({
        modelId: progress.modelId,
        bytesDownloaded: progress.bytesDownloaded,
        totalBytes: progress.totalBytes,
        progress: progress.progress,
        state: progress.state,
      });
    };
    AI.instance.addModelDownloadProgressListener(listener);
  }

  try {
    return await AI.instance.downloadPromptApiModel();
  } finally {
    if (listener) {
      AI.instance.removeModelDownloadProgressListener(listener);
    }
  }
}
