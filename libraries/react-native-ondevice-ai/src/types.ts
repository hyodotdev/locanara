/**
 * Locanara On-Device AI Types for React Native
 */

// Enums

export type SummarizeInputType = 'ARTICLE' | 'CONVERSATION';
export type SummarizeOutputType =
  | 'ONE_BULLET'
  | 'TWO_BULLETS'
  | 'THREE_BULLETS';
export type RewriteOutputType =
  | 'ELABORATE'
  | 'EMOJIFY'
  | 'SHORTEN'
  | 'FRIENDLY'
  | 'PROFESSIONAL'
  | 'REPHRASE';
export type ProofreadInputType = 'KEYBOARD' | 'VOICE';
export type Platform = 'IOS' | 'ANDROID' | 'WEB';

export type InferenceEngine =
  | 'foundation_models'
  | 'llama_cpp'
  | 'mlx'
  | 'core_ml'
  | 'prompt_api'
  | 'none';

export type ModelDownloadState =
  | 'pending'
  | 'downloading'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Device capability information for on-device AI */
export interface DeviceCapability {
  /** Whether on-device AI is supported */
  isSupported: boolean;
  /** Whether the AI model is ready for use */
  isModelReady: boolean;
  /** Whether the device supports Apple Intelligence (iOS only) */
  supportsAppleIntelligence?: boolean;
  /** The platform */
  platform: Platform;
  /** Available AI features (keys are feature names from the native SDK) */
  features: Record<string, boolean>;
  /** Available memory in MB */
  availableMemoryMB?: number;
  /** Whether device is in low power mode */
  isLowPowerMode?: boolean;
}

/** Options for text summarization */
export interface SummarizeOptions {
  /** Input type (ARTICLE or CONVERSATION) */
  inputType?: SummarizeInputType;
  /** Output type (ONE_BULLET, TWO_BULLETS, THREE_BULLETS) */
  outputType?: SummarizeOutputType;
}

/** Result of text summarization */
export interface SummarizeResult {
  /** The summarized text */
  summary: string;
  /** Original text length */
  originalLength: number;
  /** Summary text length */
  summaryLength: number;
  /** Confidence score (0-1) */
  confidence?: number;
}

/** Options for text classification */
export interface ClassifyOptions {
  /** Categories to classify into */
  categories?: string[];
  /** Maximum number of classifications to return */
  maxResults?: number;
}

/** Classification result */
export interface Classification {
  /** Label or category */
  label: string;
  /** Confidence score (0-1) */
  score: number;
  /** Additional metadata */
  metadata?: string;
}

/** Result of text classification */
export interface ClassifyResult {
  /** All classifications */
  classifications: Classification[];
  /** Top classification */
  topClassification: Classification;
}

/** Options for entity extraction */
export interface ExtractOptions {
  /** Types of entities to extract */
  entityTypes?: string[];
}

/** Extracted entity */
export interface Entity {
  /** Entity type (person, location, date, etc.) */
  type: string;
  /** Entity value */
  value: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Start position in original text */
  startPos?: number;
  /** End position in original text */
  endPos?: number;
}

/** Key-value pair */
export interface KeyValuePair {
  key: string;
  value: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

/** Result of entity extraction */
export interface ExtractResult {
  /** List of extracted entities */
  entities: Entity[];
  /** Extracted key-value pairs */
  keyValuePairs?: KeyValuePair[];
}

/** Chat message */
export interface ChatMessage {
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';
  /** Content of the message */
  content: string;
}

/** Options for chat */
export interface ChatOptions {
  /** Conversation ID for context */
  conversationId?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Chat history for context */
  history?: ChatMessage[];
}

/** Result of chat */
export interface ChatResult {
  /** The assistant's response message */
  message: string;
  /** Conversation ID for context */
  conversationId?: string;
  /** Whether the conversation can continue */
  canContinue: boolean;
  /** Suggested follow-up prompts */
  suggestedPrompts?: string[];
}

/** A chunk of streamed chat response */
export interface ChatStreamChunk {
  /** New text in this chunk */
  delta: string;
  /** Full accumulated text so far */
  accumulated: string;
  /** Whether this is the final chunk */
  isFinal: boolean;
  /** Conversation ID for context */
  conversationId?: string;
}

/** Options for streaming chat (extends ChatOptions) */
export interface ChatStreamOptions extends ChatOptions {
  /** Callback invoked for each streamed chunk */
  onChunk?: (chunk: ChatStreamChunk) => void;
}

/** Options for translation */
export interface TranslateOptions {
  /** Source language code (auto-detect if not provided) */
  sourceLanguage?: string;
  /** Target language code */
  targetLanguage: string;
}

/** Result of translation */
export interface TranslateResult {
  /** The translated text */
  translatedText: string;
  /** Source language code */
  sourceLanguage: string;
  /** Target language code */
  targetLanguage: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

/** Options for text rewriting */
export interface RewriteOptions {
  /** Output type (ELABORATE, EMOJIFY, SHORTEN, FRIENDLY, PROFESSIONAL, REPHRASE) */
  outputType: RewriteOutputType;
}

/** Result of text rewriting */
export interface RewriteResult {
  /** The rewritten text */
  rewrittenText: string;
  /** Style applied */
  style?: RewriteOutputType;
  /** Alternative suggestions */
  alternatives?: string[];
  /** Confidence score (0-1) */
  confidence?: number;
}

/** Options for proofreading */
export interface ProofreadOptions {
  /** Input type (KEYBOARD or VOICE) */
  inputType?: ProofreadInputType;
}

/** Proofreading correction */
export interface ProofreadCorrection {
  /** Original text */
  original: string;
  /** Corrected text */
  corrected: string;
  /** Type of correction */
  type?: string;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Start position in original text */
  startPos?: number;
  /** End position in original text */
  endPos?: number;
}

/** Result of proofreading */
export interface ProofreadResult {
  /** Corrected text */
  correctedText: string;
  /** List of corrections */
  corrections: ProofreadCorrection[];
  /** Whether any corrections were made */
  hasCorrections: boolean;
}

/** Initialize result */
export interface InitializeResult {
  success: boolean;
}

/** Downloadable model information */
export interface DownloadableModelInfo {
  modelId: string;
  name: string;
  version: string;
  sizeMB: number;
  quantization: string;
  contextLength: number;
  minMemoryMB: number;
  isMultimodal: boolean;
}

/** Model download progress */
export interface ModelDownloadProgress {
  modelId: string;
  bytesDownloaded: number;
  totalBytes: number;
  progress: number;
  state: ModelDownloadState;
}

/** Event subscription handle */
export interface EventSubscription {
  remove(): void;
}
