import {type EventSubscription} from 'expo-modules-core';
import ExpoOndeviceAiModule from './ExpoOndeviceAiModule';
import type {
  DeviceCapability,
  SummarizeOptions,
  SummarizeResult,
  SummarizeStreamOptions,
  ClassifyOptions,
  ClassifyResult,
  ExtractOptions,
  ExtractResult,
  ChatOptions,
  ChatResult,
  ChatStreamChunk,
  ChatStreamOptions,
  TextStreamChunk,
  TranslateOptions,
  TranslateResult,
  TranslateStreamOptions,
  RewriteOptions,
  RewriteResult,
  RewriteStreamOptions,
  ProofreadOptions,
  ProofreadResult,
  InitializeResult,
  DownloadableModelInfo,
  ModelDownloadProgress,
  InferenceEngine,
  DescribeImageOptions,
  DescribeImageResult,
} from './types';
import {ExpoOndeviceAiLog as Log} from './log';

export * from './types';
export {ExpoOndeviceAiLog} from './log';

type StreamKind = 'chat' | 'summarize' | 'translate' | 'rewrite';
type StreamEventName =
  | 'onChatStreamChunk'
  | 'onSummarizeStreamChunk'
  | 'onTranslateStreamChunk'
  | 'onRewriteStreamChunk';
type EmptyNativeOptionsPolicy = 'omit' | 'preserve';
type StreamCallbackOptions<TChunk> = {
  onChunk?: (chunk: TChunk) => void;
};
type NativeStreamOptions<TOptions> = Omit<TOptions, 'onChunk'>;

const streamEventEmitter = ExpoOndeviceAiModule as unknown as {
  addListener<TChunk>(
    name: StreamEventName,
    listener: (chunk: TChunk) => void,
  ): EventSubscription;
};

const streamTails: Record<StreamKind, Promise<void>> = {
  chat: Promise.resolve(),
  summarize: Promise.resolve(),
  translate: Promise.resolve(),
  rewrite: Promise.resolve(),
};

async function runSerializedStream<T>(
  kind: StreamKind,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = streamTails[kind];
  let release = () => {};
  streamTails[kind] = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function runStreamingOperation<
  TResult,
  TChunk,
  TOptions extends StreamCallbackOptions<TChunk>,
>(
  kind: StreamKind,
  eventName: StreamEventName,
  options: TOptions | undefined,
  emptyOptionsPolicy: EmptyNativeOptionsPolicy,
  operation: (
    nativeOptions: NativeStreamOptions<TOptions> | undefined,
  ) => Promise<TResult>,
): Promise<TResult> {
  return runSerializedStream(kind, async () => {
    let subscription: EventSubscription | undefined;

    try {
      if (options?.onChunk) {
        subscription = streamEventEmitter.addListener<TChunk>(
          eventName,
          (chunk) => options.onChunk!(chunk),
        );
      }

      const {onChunk: _, ...nativeOptions} = options ?? {};
      const normalizedOptions =
        emptyOptionsPolicy === 'omit' && Object.keys(nativeOptions).length === 0
          ? undefined
          : (nativeOptions as NativeStreamOptions<TOptions>);
      const result = await operation(normalizedOptions);

      // Flush the event queue so queued native events (sendEvent) are
      // delivered before we remove the subscription in the finally block.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      return result;
    } finally {
      subscription?.remove();
    }
  });
}

/**
 * Initialize the Locanara SDK
 * Must be called before using any AI features
 */
export async function initialize(): Promise<InitializeResult> {
  return ExpoOndeviceAiModule.initialize();
}

/**
 * Get device capability information for on-device AI
 */
export async function getDeviceCapability(): Promise<DeviceCapability> {
  return ExpoOndeviceAiModule.getDeviceCapability();
}

/**
 * Summarize text using on-device AI
 * @param text - The text to summarize
 * @param options - Summarization options
 */
export async function summarize(
  text: string,
  options?: SummarizeOptions,
): Promise<SummarizeResult> {
  return ExpoOndeviceAiModule.summarize(text, options);
}

/**
 * Classify text into categories using on-device AI
 * @param text - The text to classify
 * @param options - Classification options
 */
export async function classify(
  text: string,
  options?: ClassifyOptions,
): Promise<ClassifyResult> {
  return ExpoOndeviceAiModule.classify(text, options);
}

/**
 * Extract entities from text using on-device AI
 * @param text - The text to extract entities from
 * @param options - Extraction options
 */
export async function extract(
  text: string,
  options?: ExtractOptions,
): Promise<ExtractResult> {
  return ExpoOndeviceAiModule.extract(text, options);
}

/**
 * Chat with on-device AI
 * @param message - The user message
 * @param options - Chat options including history
 */
export async function chat(
  message: string,
  options?: ChatOptions,
): Promise<ChatResult> {
  return ExpoOndeviceAiModule.chat(message, options);
}

/**
 * Chat with on-device AI using streaming responses
 * Tokens are delivered progressively via the onChunk callback.
 * @param message - The user message
 * @param options - Chat stream options including onChunk callback
 * @returns Promise resolving to final ChatResult when stream completes
 */
export async function chatStream(
  message: string,
  options?: ChatStreamOptions,
): Promise<ChatResult> {
  return runStreamingOperation<ChatResult, ChatStreamChunk, ChatStreamOptions>(
    'chat',
    'onChatStreamChunk',
    options,
    'omit',
    (nativeOptions) => ExpoOndeviceAiModule.chatStream(message, nativeOptions),
  );
}

/**
 * Translate text using on-device AI
 * @param text - The text to translate
 * @param options - Translation options
 */
export async function translate(
  text: string,
  options: TranslateOptions,
): Promise<TranslateResult> {
  return ExpoOndeviceAiModule.translate(text, options);
}

/**
 * Rewrite text using on-device AI
 * @param text - The text to rewrite
 * @param options - Rewrite options
 */
export async function rewrite(
  text: string,
  options: RewriteOptions,
): Promise<RewriteResult> {
  return ExpoOndeviceAiModule.rewrite(text, options);
}

/**
 * Proofread text using on-device AI
 * @param text - The text to proofread
 * @param options - Proofread options
 */
export async function proofread(
  text: string,
  options?: ProofreadOptions,
): Promise<ProofreadResult> {
  return ExpoOndeviceAiModule.proofread(text, options);
}

// MARK: - Streaming Variants

/**
 * Summarize text with streaming where the platform exposes a real stream.
 * Unsupported platforms reject instead of emitting a synthetic final chunk.
 * @param text - The text to summarize
 * @param options - Options including onChunk callback
 * @returns Promise resolving to final SummarizeResult
 */
export async function summarizeStreaming(
  text: string,
  options?: SummarizeStreamOptions,
): Promise<SummarizeResult> {
  return runStreamingOperation<
    SummarizeResult,
    TextStreamChunk,
    SummarizeStreamOptions
  >('summarize', 'onSummarizeStreamChunk', options, 'omit', (nativeOptions) =>
    ExpoOndeviceAiModule.summarizeStreaming(text, nativeOptions),
  );
}

/**
 * Translate text with streaming where the platform exposes a real stream.
 * Unsupported platforms reject instead of emitting a synthetic final chunk.
 * @param text - The text to translate
 * @param options - Options including targetLanguage and onChunk callback
 * @returns Promise resolving to final TranslateResult
 */
export async function translateStreaming(
  text: string,
  options: TranslateStreamOptions,
): Promise<TranslateResult> {
  return runStreamingOperation<
    TranslateResult,
    TextStreamChunk,
    TranslateStreamOptions
  >(
    'translate',
    'onTranslateStreamChunk',
    options,
    'preserve',
    (nativeOptions) =>
      ExpoOndeviceAiModule.translateStreaming(text, nativeOptions!),
  );
}

/**
 * Rewrite text with streaming where the platform exposes a real stream.
 * Unsupported platforms reject instead of emitting a synthetic final chunk.
 * @param text - The text to rewrite
 * @param options - Options including outputType and onChunk callback
 * @returns Promise resolving to final RewriteResult
 */
export async function rewriteStreaming(
  text: string,
  options: RewriteStreamOptions,
): Promise<RewriteResult> {
  return runStreamingOperation<
    RewriteResult,
    TextStreamChunk,
    RewriteStreamOptions
  >('rewrite', 'onRewriteStreamChunk', options, 'preserve', (nativeOptions) =>
    ExpoOndeviceAiModule.rewriteStreaming(text, nativeOptions!),
  );
}

// MARK: - Image Description

/**
 * Describe the contents of an image using on-device AI.
 * Supported only when the native wrapper reports image capability.
 * The current Android and Web wrappers return an explicit unsupported error.
 * @param imageUri - URI or file path to the image
 * @param options - Optional prompt and other options
 */
export async function describeImage(
  imageUri: string,
  options?: DescribeImageOptions,
): Promise<DescribeImageResult> {
  return ExpoOndeviceAiModule.describeImage(imageUri, options);
}

// MARK: - Model Management

/**
 * Get available models for download.
 * iOS only; Android rejects with an explicit unsupported error.
 */
export async function getAvailableModels(): Promise<DownloadableModelInfo[]> {
  const models = await ExpoOndeviceAiModule.getAvailableModels();
  Log.d(`getAvailableModels() → ${models.length} models`);
  return models;
}

/**
 * Get IDs of downloaded models.
 * iOS only; Android rejects with an explicit unsupported error.
 */
export async function getDownloadedModels(): Promise<string[]> {
  const ids = await ExpoOndeviceAiModule.getDownloadedModels();
  Log.d(`getDownloadedModels() → [${ids.join(', ')}]`);
  return ids;
}

/**
 * Get currently loaded model ID, or null if none is loaded.
 * iOS only; Android rejects with an explicit unsupported error.
 */
export async function getLoadedModel(): Promise<string | null> {
  const id = await ExpoOndeviceAiModule.getLoadedModel();
  Log.d(`getLoadedModel() → ${id ?? 'null'}`);
  return id;
}

/**
 * Get the active general-purpose inference engine.
 * Task-specific OS services may still be available when this returns `none`.
 */
export async function getCurrentEngine(): Promise<InferenceEngine> {
  const engine = await ExpoOndeviceAiModule.getCurrentEngine();
  Log.d(`getCurrentEngine() → ${engine}`);
  return engine;
}

/**
 * Download a model by ID (iOS only)
 * @param modelId - The model to download
 * @param onProgress - Optional progress callback
 */
export async function downloadModel(
  modelId: string,
  onProgress?: (progress: ModelDownloadProgress) => void,
): Promise<boolean> {
  Log.d(`downloadModel(${modelId}) starting...`);
  let subscription: EventSubscription | undefined;

  try {
    if (onProgress) {
      subscription = (
        ExpoOndeviceAiModule as unknown as {
          addListener: (
            name: string,
            listener: (progress: ModelDownloadProgress) => void,
          ) => EventSubscription;
        }
      ).addListener('onModelDownloadProgress', onProgress);
    }

    const result = await ExpoOndeviceAiModule.downloadModel(modelId);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    Log.d(`downloadModel(${modelId}) completed`);
    return result;
  } catch (e: any) {
    Log.error(`downloadModel(${modelId}) FAILED: ${e.message}`);
    throw e;
  } finally {
    subscription?.remove();
  }
}

/**
 * Load a downloaded model into memory (iOS only)
 */
export async function loadModel(modelId: string): Promise<void> {
  Log.d(`loadModel(${modelId}) starting...`);
  try {
    await ExpoOndeviceAiModule.loadModel(modelId);
    Log.d(`loadModel(${modelId}) success`);
  } catch (e: any) {
    Log.error(`loadModel(${modelId}) FAILED: ${e.message}`);
    throw e;
  }
}

/**
 * Delete a downloaded model (iOS only)
 */
export async function deleteModel(modelId: string): Promise<void> {
  Log.d(`deleteModel(${modelId}) called`);
  try {
    await ExpoOndeviceAiModule.deleteModel(modelId);
    Log.d(`deleteModel(${modelId}) success`);
  } catch (e: any) {
    Log.error(`deleteModel(${modelId}) FAILED: ${e.message}`);
    throw e;
  }
}

/**
 * Get Prompt API status (Android only)
 * @returns 'available' | 'downloadable' | 'downloading' | 'not_available'
 */
export async function getPromptApiStatus(): Promise<string> {
  const status = await ExpoOndeviceAiModule.getPromptApiStatus();
  Log.d(`getPromptApiStatus() → ${status}`);
  return status;
}

/**
 * Download the Prompt API model / Gemini Nano (Android only)
 * @param onProgress - Optional progress callback
 */
export async function downloadPromptApiModel(
  onProgress?: (progress: ModelDownloadProgress) => void,
): Promise<boolean> {
  Log.d('downloadPromptApiModel() starting...');
  let subscription: EventSubscription | undefined;

  try {
    if (onProgress) {
      subscription = (
        ExpoOndeviceAiModule as unknown as {
          addListener: (
            name: string,
            listener: (progress: ModelDownloadProgress) => void,
          ) => EventSubscription;
        }
      ).addListener('onModelDownloadProgress', onProgress);
    }

    const result = await ExpoOndeviceAiModule.downloadPromptApiModel();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    Log.d('downloadPromptApiModel() completed');
    return result;
  } catch (e: any) {
    Log.error(`downloadPromptApiModel() FAILED: ${e.message}`);
    throw e;
  } finally {
    subscription?.remove();
  }
}
