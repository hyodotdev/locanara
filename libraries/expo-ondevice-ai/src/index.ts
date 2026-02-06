import ExpoOndeviceAiModule from './ExpoOndeviceAiModule';
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
  TranslateOptions,
  TranslateResult,
  RewriteOptions,
  RewriteResult,
  ProofreadOptions,
  ProofreadResult,
  InitializeResult,
} from './types';

export * from './types';
export { ExpoOndeviceAiLog } from './log';

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
