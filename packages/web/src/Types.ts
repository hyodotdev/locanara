/**
 * Locanara Web SDK Types
 * Types matching the GraphQL schema for Chrome Built-in AI
 */

// ============================================================================
// Enums (Common — from type.graphql)
// ============================================================================

export enum Platform {
  IOS = "IOS",
  ANDROID = "ANDROID",
  WEB = "WEB",
}

export enum FeatureType {
  SUMMARIZE = "SUMMARIZE",
  CLASSIFY = "CLASSIFY",
  EXTRACT = "EXTRACT",
  CHAT = "CHAT",
  TRANSLATE = "TRANSLATE",
  REWRITE = "REWRITE",
  PROOFREAD = "PROOFREAD",
  DESCRIBE_IMAGE = "DESCRIBE_IMAGE",
}

export enum FeatureAvailability {
  AVAILABLE = "AVAILABLE",
  DOWNLOADABLE = "DOWNLOADABLE",
  UNAVAILABLE = "UNAVAILABLE",
}

/** ML Kit Summarization InputType (common — type.graphql) */
export enum SummarizeInputType {
  ARTICLE = "ARTICLE",
  CONVERSATION = "CONVERSATION",
}

/** ML Kit Summarization OutputType (common — type.graphql) */
export enum SummarizeOutputType {
  ONE_BULLET = "ONE_BULLET",
  TWO_BULLETS = "TWO_BULLETS",
  THREE_BULLETS = "THREE_BULLETS",
}

/** ML Kit Rewrite OutputType / Style (common — type.graphql) */
export enum RewriteOutputType {
  ELABORATE = "ELABORATE",
  EMOJIFY = "EMOJIFY",
  SHORTEN = "SHORTEN",
  FRIENDLY = "FRIENDLY",
  PROFESSIONAL = "PROFESSIONAL",
  REPHRASE = "REPHRASE",
}

/** ML Kit Proofreading InputType (common — type.graphql) */
export enum ProofreadInputType {
  KEYBOARD = "KEYBOARD",
  VOICE = "VOICE",
}

/** Device capability levels (common — type.graphql) */
export enum CapabilityLevel {
  NONE = "NONE",
  LIMITED = "LIMITED",
  FULL = "FULL",
}

/** Feature download status (common — type.graphql) */
export enum FeatureStatus {
  UNAVAILABLE = "UNAVAILABLE",
  DOWNLOADABLE = "DOWNLOADABLE",
  DOWNLOADING = "DOWNLOADING",
  AVAILABLE = "AVAILABLE",
}

/** Model execution state (common — type.graphql) */
export enum ExecutionState {
  IDLE = "IDLE",
  PREPARING = "PREPARING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Enums (Web-specific — from type-web.graphql, Chrome Built-in AI)
// ============================================================================

export enum SummarizeType {
  KEY_POINTS = "KEY_POINTS",
  TLDR = "TLDR",
  TEASER = "TEASER",
  HEADLINE = "HEADLINE",
}

export enum SummarizeLength {
  SHORT = "SHORT",
  MEDIUM = "MEDIUM",
  LONG = "LONG",
}

export enum SummarizeFormat {
  MARKDOWN = "MARKDOWN",
  PLAIN_TEXT = "PLAIN_TEXT",
}

export enum RewriteTone {
  MORE_FORMAL = "MORE_FORMAL",
  AS_IS = "AS_IS",
  MORE_CASUAL = "MORE_CASUAL",
}

export enum RewriteLength {
  SHORTER = "SHORTER",
  AS_IS = "AS_IS",
  LONGER = "LONGER",
}

export enum WriterTone {
  FORMAL = "FORMAL",
  NEUTRAL = "NEUTRAL",
  CASUAL = "CASUAL",
}

export enum WriterLength {
  SHORT = "SHORT",
  MEDIUM = "MEDIUM",
  LONG = "LONG",
}

// ============================================================================
// Device Capability
// ============================================================================

export interface FeatureCapability {
  feature: FeatureType;
  availability: FeatureAvailability;
}

export interface DeviceCapability {
  platform: Platform;
  supportsOnDeviceAI: boolean;
  availableFeatures: FeatureCapability[];
}

// ============================================================================
// Summarize
// ============================================================================

export interface SummarizeOptions {
  type?: SummarizeType;
  length?: SummarizeLength;
  format?: SummarizeFormat;
  context?: string;
  expectedInputLanguages?: string[];
  outputLanguage?: string;
}

export interface SummarizeResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
}

// ============================================================================
// Translate
// ============================================================================

export interface TranslateOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// ============================================================================
// Chat
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  initialPrompts?: ChatMessage[];
}

export interface ChatResult {
  response: string;
}

// ============================================================================
// Rewrite
// ============================================================================

export interface RewriteOptions {
  tone?: RewriteTone;
  length?: RewriteLength;
  format?: SummarizeFormat;
  context?: string;
}

export interface RewriteResult {
  rewrittenText: string;
}

// ============================================================================
// Classify
// ============================================================================

export interface ClassifyOptions {
  categories: string[];
  context?: string;
}

export interface ClassifyResult {
  category: string;
  confidence: number;
}

// ============================================================================
// Extract
// ============================================================================

export interface ExtractOptions {
  schema?: Record<string, unknown>;
  context?: string;
}

export interface ExtractResult {
  entities: Record<string, unknown>;
}

// ============================================================================
// Proofread
// ============================================================================

export interface ProofreadOptions {
  context?: string;
}

export interface ProofreadResult {
  correctedText: string;
  corrections: ProofreadCorrection[];
  hasCorrections: boolean;
}

export interface ProofreadCorrection {
  original: string;
  corrected: string;
  type?: string;
}

// ============================================================================
// Describe Image
// ============================================================================

export interface DescribeImageOptions {
  context?: string;
}

export interface DescribeImageResult {
  description: string;
}

// ============================================================================
// Language Detection
// ============================================================================

export interface DetectLanguageResult {
  detectedLanguage: string;
  confidence: number;
}

// ============================================================================
// Writer (Chrome-specific)
// ============================================================================

export interface WriteOptions {
  tone?: WriterTone;
  length?: WriterLength;
  format?: SummarizeFormat;
  context?: string;
}

export interface WriteResult {
  text: string;
}

// ============================================================================
// Execution Result (Generic)
// ============================================================================

export interface ExecutionResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

// ============================================================================
// Chrome Built-in AI Type Declarations
// ============================================================================

declare global {
  interface Window {
    Summarizer?: SummarizerConstructor;
    Translator?: TranslatorConstructor;
    Rewriter?: RewriterConstructor;
    Writer?: WriterConstructor;
    LanguageModel?: LanguageModelConstructor;
    LanguageDetector?: LanguageDetectorConstructor;
  }

  // Summarizer
  interface SummarizerConstructor {
    availability(): Promise<string>;
    create(options?: ChromeSummarizerOptions): Promise<ChromeSummarizer>;
  }

  interface ChromeSummarizerOptions {
    type?: "key-points" | "tldr" | "teaser" | "headline" | undefined;
    length?: "short" | "medium" | "long" | undefined;
    format?: "markdown" | "plain-text" | undefined;
    sharedContext?: string | undefined;
    expectedInputLanguages?: string[] | undefined;
    outputLanguage?: string | undefined;
    monitor?: ((m: EventTarget) => void) | undefined;
  }

  interface ChromeSummarizer {
    summarize(text: string, options?: { context?: string }): Promise<string>;
    summarizeStreaming(
      text: string,
      options?: { context?: string },
    ): AsyncIterable<string>;
    destroy(): void;
  }

  // Translator
  interface TranslatorConstructor {
    availability(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<string>;
    create(options: ChromeTranslatorOptions): Promise<ChromeTranslator>;
  }

  interface ChromeTranslatorOptions {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }

  interface ChromeTranslator {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): AsyncIterable<string>;
    destroy(): void;
  }

  // Rewriter
  interface RewriterConstructor {
    availability(): Promise<string>;
    create(options?: ChromeRewriterOptions): Promise<ChromeRewriter>;
  }

  interface ChromeRewriterOptions {
    tone?: "more-formal" | "as-is" | "more-casual";
    length?: "shorter" | "as-is" | "longer";
    format?: "as-is" | "markdown" | "plain-text";
    sharedContext?: string;
    monitor?: (m: EventTarget) => void;
  }

  interface ChromeRewriter {
    rewrite(text: string, options?: { context?: string }): Promise<string>;
    rewriteStreaming(
      text: string,
      options?: { context?: string },
    ): AsyncIterable<string>;
    destroy(): void;
  }

  // Writer
  interface WriterConstructor {
    availability(): Promise<string>;
    create(options?: ChromeWriterOptions): Promise<ChromeWriter>;
  }

  interface ChromeWriterOptions {
    tone?: "formal" | "neutral" | "casual";
    length?: "short" | "medium" | "long";
    format?: "markdown" | "plain-text";
    sharedContext?: string;
    monitor?: (m: EventTarget) => void;
  }

  interface ChromeWriter {
    write(prompt: string, options?: { context?: string }): Promise<string>;
    writeStreaming(
      prompt: string,
      options?: { context?: string },
    ): AsyncIterable<string>;
    destroy(): void;
  }

  // LanguageModel (Prompt API)
  interface LanguageModelConstructor {
    availability(): Promise<
      "readily" | "after-download" | "downloading" | "unavailable"
    >;
    params(): Promise<{
      defaultTopK: number;
      maxTopK: number;
      defaultTemperature: number;
      maxTemperature: number;
    }>;
    create(
      options?: ChromeLanguageModelOptions,
    ): Promise<ChromeLanguageModelSession>;
  }

  interface ChromeLanguageModelOptions {
    temperature?: number;
    topK?: number;
    initialPrompts?: Array<{ role: string; content: string }>;
    monitor?: (m: EventTarget) => void;
  }

  interface ChromeLanguageModelSession {
    prompt(
      input:
        | string
        | Array<{ role: string; content: string | Blob | ImageData }>,
    ): Promise<string>;
    promptStreaming(input: string): ReadableStream<string>;
    clone(): Promise<ChromeLanguageModelSession>;
    destroy(): void;
    inputUsage: number;
    inputQuota: number;
  }

  // LanguageDetector
  interface LanguageDetectorConstructor {
    availability(): Promise<"readily" | "downloadable" | "no">;
    create(options?: {
      monitor?: (m: EventTarget) => void;
    }): Promise<ChromeLanguageDetector>;
  }

  interface ChromeLanguageDetector {
    detect(
      text: string,
    ): Promise<Array<{ detectedLanguage: string; confidence: number }>>;
  }
}
