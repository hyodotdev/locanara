import type {HybridObject} from 'react-native-nitro-modules';

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                      NITRO MODULE CONSTRAINTS                           ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║ 1. UNION TYPES REQUIRE 2+ VALUES                                        ║
// ║    - Single-value unions cause "ambiguous" codegen errors               ║
// ║    - All union types below have 2+ values                               ║
// ║                                                                         ║
// ║ 2. TYPES MUST BE DEFINED IN THIS FILE OR IMPORTED AS `type`             ║
// ║    - Nitro codegen reads this file to generate native bridge code       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ──────────────────────────────────────────────────────────────────────────
// Enums (all have 2+ values per Nitro constraint)
// ──────────────────────────────────────────────────────────────────────────

export type OndeviceAiPlatform = 'apple' | 'google';

export type NitroInferenceEngine =
  | 'foundation_models'
  | 'llama_cpp'
  | 'mlx'
  | 'core_ml'
  | 'prompt_api'
  | 'none';

export type NitroSummarizeInputType = 'ARTICLE' | 'CONVERSATION';

export type NitroSummarizeOutputType =
  | 'ONE_BULLET'
  | 'TWO_BULLETS'
  | 'THREE_BULLETS';

export type NitroRewriteOutputType =
  | 'ELABORATE'
  | 'EMOJIFY'
  | 'SHORTEN'
  | 'FRIENDLY'
  | 'PROFESSIONAL'
  | 'REPHRASE';

export type NitroChatMessageRole = 'user' | 'assistant' | 'system';

export type NitroModelDownloadState =
  | 'pending'
  | 'downloading'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ──────────────────────────────────────────────────────────────────────────
// Device Capability
// ──────────────────────────────────────────────────────────────────────────

export interface NitroDeviceCapability {
  isSupported: boolean;
  isModelReady: boolean;
  supportsAppleIntelligence: boolean;
  platform: OndeviceAiPlatform;
  featureSummarize: boolean;
  featureClassify: boolean;
  featureExtract: boolean;
  featureChat: boolean;
  featureTranslate: boolean;
  featureRewrite: boolean;
  featureProofread: boolean;
  availableMemoryMB: number;
  isLowPowerMode: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Summarize
// ──────────────────────────────────────────────────────────────────────────

export interface NitroSummarizeOptions {
  inputType?: NitroSummarizeInputType | null;
  outputType?: NitroSummarizeOutputType | null;
}

export interface NitroSummarizeResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  confidence: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Classify
// ──────────────────────────────────────────────────────────────────────────

export interface NitroClassification {
  label: string;
  score: number;
  metadata: string;
}

export interface NitroClassifyOptions {
  categories?: string[] | null;
  maxResults?: number | null;
}

export interface NitroClassifyResult {
  classifications: NitroClassification[];
  topLabel: string;
  topScore: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Extract
// ──────────────────────────────────────────────────────────────────────────

export interface NitroExtractEntity {
  type: string;
  value: string;
  confidence: number;
  startPos: number;
  endPos: number;
}

export interface NitroExtractOptions {
  entityTypes?: string[] | null;
}

export interface NitroExtractResult {
  entities: NitroExtractEntity[];
}

// ──────────────────────────────────────────────────────────────────────────
// Chat
// ──────────────────────────────────────────────────────────────────────────

export interface NitroChatMessage {
  role: NitroChatMessageRole;
  content: string;
}

export interface NitroChatOptions {
  systemPrompt?: string | null;
  history?: NitroChatMessage[] | null;
}

export interface NitroChatResult {
  message: string;
  conversationId: string;
  canContinue: boolean;
}

export interface NitroChatStreamChunk {
  delta: string;
  accumulated: string;
  isFinal: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Translate
// ──────────────────────────────────────────────────────────────────────────

export interface NitroTranslateOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export interface NitroTranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Rewrite
// ──────────────────────────────────────────────────────────────────────────

export interface NitroRewriteOptions {
  outputType: NitroRewriteOutputType;
}

export interface NitroRewriteResult {
  rewrittenText: string;
  style: string;
  confidence: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Proofread
// ──────────────────────────────────────────────────────────────────────────

export interface NitroProofreadCorrection {
  original: string;
  corrected: string;
  type: string;
  confidence: number;
  startPos: number;
  endPos: number;
}

export interface NitroProofreadResult {
  correctedText: string;
  corrections: NitroProofreadCorrection[];
  hasCorrections: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Model Management
// ──────────────────────────────────────────────────────────────────────────

export interface NitroModelInfo {
  modelId: string;
  name: string;
  version: string;
  sizeMB: number;
  quantization: string;
  contextLength: number;
  minMemoryMB: number;
  isMultimodal: boolean;
}

export interface NitroModelDownloadProgress {
  modelId: string;
  bytesDownloaded: number;
  totalBytes: number;
  progress: number;
  state: NitroModelDownloadState;
}

// ──────────────────────────────────────────────────────────────────────────
// Main HybridObject Interface
// ──────────────────────────────────────────────────────────────────────────

export interface OndeviceAi
  extends HybridObject<{ios: 'swift'; android: 'kotlin'}> {
  // Initialization
  initialize(): Promise<boolean>;
  getDeviceCapability(): Promise<NitroDeviceCapability>;

  // 7 AI Features
  summarize(
    text: string,
    options?: NitroSummarizeOptions | null,
  ): Promise<NitroSummarizeResult>;
  classify(
    text: string,
    options?: NitroClassifyOptions | null,
  ): Promise<NitroClassifyResult>;
  extract(
    text: string,
    options?: NitroExtractOptions | null,
  ): Promise<NitroExtractResult>;
  chat(
    message: string,
    options?: NitroChatOptions | null,
  ): Promise<NitroChatResult>;
  translate(
    text: string,
    options: NitroTranslateOptions,
  ): Promise<NitroTranslateResult>;
  rewrite(
    text: string,
    options: NitroRewriteOptions,
  ): Promise<NitroRewriteResult>;
  proofread(text: string): Promise<NitroProofreadResult>;

  // Chat Streaming (listener pattern)
  chatStream(
    message: string,
    options?: NitroChatOptions | null,
  ): Promise<NitroChatResult>;
  addChatStreamListener(
    listener: (chunk: NitroChatStreamChunk) => void,
  ): void;
  removeChatStreamListener(
    listener: (chunk: NitroChatStreamChunk) => void,
  ): void;

  // Model Management
  getAvailableModels(): Promise<NitroModelInfo[]>;
  getDownloadedModels(): Promise<string[]>;
  getLoadedModel(): Promise<string>;
  getCurrentEngine(): Promise<NitroInferenceEngine>;
  downloadModel(modelId: string): Promise<boolean>;
  addModelDownloadProgressListener(
    listener: (progress: NitroModelDownloadProgress) => void,
  ): void;
  removeModelDownloadProgressListener(
    listener: (progress: NitroModelDownloadProgress) => void,
  ): void;
  loadModel(modelId: string): Promise<void>;
  deleteModel(modelId: string): Promise<void>;

  // Android-specific
  getPromptApiStatus(): Promise<string>;
  downloadPromptApiModel(): Promise<boolean>;
}
