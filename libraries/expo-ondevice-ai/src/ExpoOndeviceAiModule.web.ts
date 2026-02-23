/**
 * Web implementation of ExpoOndeviceAi module
 * Uses Chrome Built-in AI (Gemini Nano) APIs
 */

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
  DownloadableModelInfo,
  InferenceEngine,
} from './types';

// ============================================================================
// Chrome Built-in AI Type Definitions
// ============================================================================

interface ChromeSummarizerConstructor {
  availability(): Promise<string>;
  create(options?: {
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    length?: 'short' | 'medium' | 'long';
    format?: 'markdown' | 'plain-text';
  }): Promise<ChromeSummarizer>;
}

interface ChromeSummarizer {
  summarize(text: string): Promise<string>;
  destroy(): void;
}

interface ChromeTranslatorConstructor {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<ChromeTranslator>;
}

interface ChromeTranslator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface ChromeRewriterConstructor {
  availability(): Promise<string>;
  create(options?: {
    tone?: 'more-formal' | 'as-is' | 'more-casual';
    length?: 'shorter' | 'as-is' | 'longer';
  }): Promise<ChromeRewriter>;
}

interface ChromeRewriter {
  rewrite(text: string): Promise<string>;
  destroy(): void;
}

interface ChromeWriterConstructor {
  availability(): Promise<string>;
  create(options?: Record<string, unknown>): Promise<ChromeWriter>;
}

interface ChromeWriter {
  write(prompt: string): Promise<string>;
  destroy(): void;
}

interface ChromeLanguageModelConstructor {
  availability(): Promise<string>;
  create(options?: {
    initialPrompts?: Array<{role: string; content: string}>;
  }): Promise<ChromeLanguageModelSession>;
}

interface ChromeLanguageModelSession {
  prompt(message: string): Promise<string>;
  promptStreaming(message: string): AsyncIterable<string>;
  destroy(): void;
}

// ============================================================================
// Chrome AI API Accessors
// ============================================================================

function getSummarizerAPI(): ChromeSummarizerConstructor | undefined {
  const s = (globalThis as Record<string, unknown>).Summarizer;
  if (s && (typeof s === 'object' || typeof s === 'function'))
    return s as unknown as ChromeSummarizerConstructor;
  return undefined;
}

function getTranslatorAPI(): ChromeTranslatorConstructor | undefined {
  const t = (globalThis as Record<string, unknown>).Translator;
  if (t && (typeof t === 'object' || typeof t === 'function'))
    return t as unknown as ChromeTranslatorConstructor;
  return undefined;
}

function getRewriterAPI(): ChromeRewriterConstructor | undefined {
  const r = (globalThis as Record<string, unknown>).Rewriter;
  if (r && (typeof r === 'object' || typeof r === 'function'))
    return r as unknown as ChromeRewriterConstructor;
  return undefined;
}

function getWriterAPI(): ChromeWriterConstructor | undefined {
  const w = (globalThis as Record<string, unknown>).Writer;
  if (w && (typeof w === 'object' || typeof w === 'function'))
    return w as unknown as ChromeWriterConstructor;
  return undefined;
}

function getLanguageModelAPI(): ChromeLanguageModelConstructor | undefined {
  // Try globalThis.LanguageModel first (newer API)
  const lm = (globalThis as Record<string, unknown>).LanguageModel;
  if (lm && (typeof lm === 'object' || typeof lm === 'function'))
    return lm as unknown as ChromeLanguageModelConstructor;
  // Try globalThis.ai.languageModel (older API)
  const ai = (globalThis as Record<string, unknown>).ai as
    | Record<string, unknown>
    | undefined;
  if (ai && typeof ai === 'object' && ai.languageModel)
    return ai.languageModel as unknown as ChromeLanguageModelConstructor;
  return undefined;
}

// ============================================================================
// Cached Chrome AI Instances
// ============================================================================

const MAX_CACHED_TRANSLATORS = 10;

let cachedSummarizer: ChromeSummarizer | null = null;
let cachedSummarizerKey = '';
let cachedLanguageModel: ChromeLanguageModelSession | null = null;
let cachedSystemPrompt: string | undefined = undefined;
const cachedTranslators = new Map<string, ChromeTranslator>();
let cachedRewriter: ChromeRewriter | null = null;
let cachedWriter: ChromeWriter | null = null;

// Simple event emitter for web (mimics Expo native module EventEmitter)
const eventListeners = new Map<string, Set<(data: ChatStreamChunkData) => void>>();

interface ChatStreamChunkData {
  delta: string;
  accumulated: string;
  isFinal: boolean;
}

function emitEvent(eventName: string, data: ChatStreamChunkData) {
  const listeners = eventListeners.get(eventName);
  if (listeners) {
    for (const listener of listeners) {
      listener(data);
    }
  }
}

// ============================================================================
// Availability Helpers
// ============================================================================

function hasAPI(api: string): boolean {
  const obj = (globalThis as Record<string, unknown>)[api];
  return !!obj && (typeof obj === 'object' || typeof obj === 'function');
}

async function checkAvailability(api: string): Promise<boolean> {
  try {
    const obj = (globalThis as Record<string, unknown>)[api] as
      | {availability?: () => Promise<string>}
      | undefined;
    if (!obj) return false;
    if (typeof obj.availability === 'function') {
      const status = await Promise.race([
        obj.availability(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000),
        ),
      ]);
      return (
        status === 'available' ||
        status === 'readily' ||
        status === 'downloadable' ||
        status === 'after-download'
      );
    }
    return typeof obj === 'object' || typeof obj === 'function';
  } catch {
    return hasAPI(api);
  }
}

// ============================================================================
// Module Implementation
// ============================================================================

const ExpoOndeviceAiModule = {
  async initialize(): Promise<InitializeResult> {
    return {success: true};
  },

  async getDeviceCapability(): Promise<DeviceCapability> {
    const [hasSummarizer, hasRewriter, hasWriter] = await Promise.all([
      checkAvailability('Summarizer'),
      checkAvailability('Rewriter'),
      checkAvailability('Writer'),
    ]);
    const hasTranslator = hasAPI('Translator');

    const lm = getLanguageModelAPI();
    let hasLanguageModel = !!lm;
    if (lm && typeof lm.availability === 'function') {
      try {
        const s = await Promise.race([
          lm.availability(),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 3000),
          ),
        ]);
        hasLanguageModel =
          s === 'readily' ||
          s === 'available' ||
          s === 'downloadable' ||
          s === 'after-download';
      } catch {
        hasLanguageModel = !!lm;
      }
    }

    return {
      isSupported: hasSummarizer || hasLanguageModel || hasTranslator,
      isModelReady: hasSummarizer || hasLanguageModel,
      platform: 'WEB' as const,
      features: {
        summarize: hasSummarizer,
        classify: hasLanguageModel,
        extract: hasLanguageModel,
        chat: hasLanguageModel,
        translate: hasTranslator,
        rewrite: hasRewriter,
        proofread: hasLanguageModel || hasWriter,
      },
    };
  },

  async summarize(
    text: string,
    options?: SummarizeOptions,
  ): Promise<SummarizeResult> {
    const Summarizer = getSummarizerAPI();
    if (!Summarizer)
      throw new Error('Summarizer API not available in this browser');

    const optionsKey = 'key-points:long';
    if (!cachedSummarizer || cachedSummarizerKey !== optionsKey) {
      cachedSummarizer?.destroy();
      cachedSummarizer = await Summarizer.create({
        type: 'key-points',
        length: 'long',
        format: 'markdown',
      });
      cachedSummarizerKey = optionsKey;
    }

    const raw = await cachedSummarizer.summarize(text);

    const bulletCount =
      options?.outputType === 'ONE_BULLET'
        ? 1
        : options?.outputType === 'TWO_BULLETS'
          ? 2
          : 3;
    const bullets = raw
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.startsWith('*') || l.startsWith('-'));
    const summary =
      bullets.length > 0 ? bullets.slice(0, bulletCount).join('\n') : raw;

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
    };
  },

  async classify(
    text: string,
    options?: ClassifyOptions,
  ): Promise<ClassifyResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const categories = options?.categories ?? [
      'positive',
      'negative',
      'neutral',
    ];
    const session = await lm.create({});
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}.\n\nText: ${text}\n\nRespond with ONLY the category name.`;
    const response = await session.prompt(prompt);
    session.destroy();

    const category = response.trim();
    const isValid = categories.some(
      (c: string) => c.toLowerCase() === category.toLowerCase(),
    );

    return {
      classifications: [
        {label: isValid ? category : categories[0], score: isValid ? 0.9 : 0.5},
      ],
      topClassification: {
        label: isValid ? category : categories[0],
        score: isValid ? 0.9 : 0.5,
      },
    };
  },

  async extract(
    text: string,
    _options?: ExtractOptions,
  ): Promise<ExtractResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const session = await lm.create({});
    const prompt = `Extract entities from this text. Return JSON with these exact keys: "person", "email", "phone", "date", "location", "organization". Each key maps to an array of strings. Only include keys that have values.\n\nText: ${text}\n\nRespond with valid JSON only, no markdown.`;
    const response = await session.prompt(prompt);
    session.destroy();

    const typeNormalize: Record<string, string> = {
      person: 'person',
      persons: 'person',
      people: 'person',
      name: 'person',
      names: 'person',
      email: 'email',
      emails: 'email',
      phone: 'phone',
      phones: 'phone',
      phone_number: 'phone',
      phone_numbers: 'phone',
      date: 'date',
      dates: 'date',
      location: 'location',
      locations: 'location',
      place: 'location',
      places: 'location',
      organization: 'organization',
      organizations: 'organization',
      org: 'organization',
      orgs: 'organization',
      contact: 'email',
    };
    const confidenceMap: Record<string, number> = {
      person: 0.95,
      email: 0.98,
      phone: 0.97,
      date: 0.96,
      location: 0.92,
      organization: 0.9,
    };

    try {
      const jsonStr = response
        .replace(/^```(?:json)?\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();
      const parsed = JSON.parse(jsonStr);

      const entities: {type: string; value: string; confidence: number}[] = [];
      const walk = (obj: unknown, parentKey?: string) => {
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            if (typeof item === 'string') {
              const normalized =
                typeNormalize[(parentKey ?? '').toLowerCase()] ??
                parentKey ??
                'unknown';
              entities.push({
                type: normalized,
                value: item,
                confidence: confidenceMap[normalized] ?? 0.85,
              });
            } else {
              walk(item, parentKey);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj as Record<string, unknown>).forEach(([key, value]) =>
            walk(value, key),
          );
        } else {
          const normalized =
            typeNormalize[(parentKey ?? '').toLowerCase()] ??
            parentKey ??
            'unknown';
          entities.push({
            type: normalized,
            value: String(obj),
            confidence: confidenceMap[normalized] ?? 0.85,
          });
        }
      };
      walk(parsed);
      return {entities};
    } catch {
      return {entities: [{type: 'raw', value: response, confidence: 0.5}]};
    }
  },

  async chat(message: string, options?: ChatOptions): Promise<ChatResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const newSystemPrompt = options?.systemPrompt;
    if (!cachedLanguageModel || newSystemPrompt !== cachedSystemPrompt) {
      cachedLanguageModel?.destroy();
      const initialPrompts: {role: string; content: string}[] = [];
      if (newSystemPrompt) {
        initialPrompts.push({role: 'system', content: newSystemPrompt});
      }
      cachedLanguageModel = await lm.create({
        initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
      });
      cachedSystemPrompt = newSystemPrompt;
    }

    const response = await cachedLanguageModel.prompt(message);
    return {
      message: response,
      canContinue: true,
    };
  },

  addListener(eventName: string, listener: (data: ChatStreamChunkData) => void) {
    if (!eventListeners.has(eventName))
      eventListeners.set(eventName, new Set());
    eventListeners.get(eventName)!.add(listener);
    return {remove: () => eventListeners.get(eventName)?.delete(listener)};
  },

  removeListeners(_count: number) {
    // No-op, cleanup handled by subscription.remove()
  },

  async chatStream(
    message: string,
    options?: ChatOptions,
  ): Promise<ChatResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const newSystemPrompt = options?.systemPrompt;
    if (!cachedLanguageModel || newSystemPrompt !== cachedSystemPrompt) {
      cachedLanguageModel?.destroy();
      const initialPrompts: {role: string; content: string}[] = [];
      if (newSystemPrompt) {
        initialPrompts.push({role: 'system', content: newSystemPrompt});
      }
      cachedLanguageModel = await lm.create({
        initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
      });
      cachedSystemPrompt = newSystemPrompt;
    }

    if (typeof cachedLanguageModel.promptStreaming === 'function') {
      const stream = cachedLanguageModel.promptStreaming(message);
      let accumulated = '';

      for await (const chunk of stream) {
        const text = typeof chunk === 'string' ? chunk : String(chunk);
        // Chrome may return cumulative or delta text depending on version
        if (text.length >= accumulated.length && text.startsWith(accumulated)) {
          const delta = text.slice(accumulated.length);
          accumulated = text;
          emitEvent('onChatStreamChunk', {delta, accumulated, isFinal: false});
        } else {
          accumulated += text;
          emitEvent('onChatStreamChunk', {
            delta: text,
            accumulated,
            isFinal: false,
          });
        }
      }

      emitEvent('onChatStreamChunk', {delta: '', accumulated, isFinal: true});
      return {message: accumulated, canContinue: true};
    }

    // Fallback to non-streaming
    const response = await cachedLanguageModel.prompt(message);
    emitEvent('onChatStreamChunk', {
      delta: response,
      accumulated: response,
      isFinal: true,
    });
    return {message: response, canContinue: true};
  },

  async translate(
    text: string,
    options: TranslateOptions,
  ): Promise<TranslateResult> {
    const Translator = getTranslatorAPI();
    if (!Translator)
      throw new Error('Translator API not available in this browser');

    const key = `${options.sourceLanguage ?? 'en'}-${options.targetLanguage}`;
    if (!cachedTranslators.has(key)) {
      // Evict oldest entry if cache is full
      if (cachedTranslators.size >= MAX_CACHED_TRANSLATORS) {
        const oldestKey = cachedTranslators.keys().next().value!;
        cachedTranslators.get(oldestKey)?.destroy();
        cachedTranslators.delete(oldestKey);
      }
      const translator = await Translator.create({
        sourceLanguage: options.sourceLanguage ?? 'en',
        targetLanguage: options.targetLanguage,
      });
      cachedTranslators.set(key, translator);
    }

    const translator = cachedTranslators.get(key)!;
    const translatedText = await translator.translate(text);

    return {
      translatedText,
      sourceLanguage: options.sourceLanguage ?? 'en',
      targetLanguage: options.targetLanguage,
    };
  },

  async rewrite(text: string, options: RewriteOptions): Promise<RewriteResult> {
    const Rewriter = getRewriterAPI();
    if (!Rewriter)
      throw new Error('Rewriter API not available in this browser');

    const toneMap: Record<string, 'more-casual' | 'more-formal' | 'as-is'> = {
      FRIENDLY: 'more-casual',
      PROFESSIONAL: 'more-formal',
      ELABORATE: 'as-is',
      SHORTEN: 'as-is',
      EMOJIFY: 'more-casual',
      REPHRASE: 'as-is',
    };
    const lengthMap: Record<string, 'shorter' | 'as-is' | 'longer'> = {
      ELABORATE: 'longer',
      SHORTEN: 'shorter',
    };

    cachedRewriter?.destroy();
    cachedRewriter = await Rewriter.create({
      tone: toneMap[options.outputType] ?? 'as-is',
      length: lengthMap[options.outputType] ?? 'as-is',
    });

    const rewrittenText = await cachedRewriter.rewrite(text);
    return {
      rewrittenText,
      style: options.outputType,
    };
  },

  async proofread(
    text: string,
    _options?: ProofreadOptions,
  ): Promise<ProofreadResult> {
    // Prefer LanguageModel for structured proofreading (returns corrections list)
    const lm = getLanguageModelAPI();
    if (lm) {
      const session = await lm.create({});
      const prompt = `You are a proofreader. Fix ONLY spelling, grammar, and punctuation errors. Do NOT change meaning, tense, or style. Return JSON with this exact format:
{"correctedText":"the full corrected text","corrections":[{"original":"misspeled","corrected":"misspelled","type":"spelling"}]}

Type must be one of: "spelling", "grammar", "punctuation".
If there are no errors, return: {"correctedText":"<original text unchanged>","corrections":[]}
Respond with valid JSON only, no markdown, no explanation.

Text to proofread:
${text}`;
      const response = await session.prompt(prompt);
      session.destroy();

      try {
        const jsonStr = response
          .replace(/^```(?:json)?\s*\n?/m, '')
          .replace(/\n?```\s*$/m, '')
          .trim();
        const parsed = JSON.parse(jsonStr) as {
          correctedText?: string;
          corrections?: Array<{
            original?: string;
            corrected?: string;
            type?: string;
          }>;
        };
        const correctedText = parsed.correctedText ?? text;
        const corrections = Array.isArray(parsed.corrections)
          ? parsed.corrections.map((c) => ({
              original: c.original ?? '',
              corrected: c.corrected ?? '',
              type: c.type ?? 'grammar',
              confidence: 0.9,
            }))
          : [];
        return {
          correctedText,
          corrections,
          hasCorrections: corrections.length > 0,
        };
      } catch {
        // JSON parse failed — fall through to Writer API
      }
    }

    // Fallback to Writer API with word-diff
    const Writer = getWriterAPI();
    if (!Writer)
      throw new Error(
        'Writer or LanguageModel API not available in this browser',
      );

    if (!cachedWriter) {
      cachedWriter = await Writer.create({});
    }

    const correctedText = await cachedWriter.write(
      `Proofread and correct this text. Fix ONLY spelling, grammar, and punctuation. Do NOT change meaning, tense, or word choice. Return only the corrected text:\n\n${text}`,
    );

    const corrections: {
      original: string;
      corrected: string;
      type: string;
      confidence: number;
    }[] = [];
    const origWords = text.split(/\s+/);
    const corrWords = correctedText.split(/\s+/);
    if (origWords.length === corrWords.length) {
      for (let i = 0; i < origWords.length; i++) {
        if (origWords[i] !== corrWords[i]) {
          corrections.push({
            original: origWords[i],
            corrected: corrWords[i],
            type: 'spelling',
            confidence: 0.85,
          });
        }
      }
    }

    return {
      correctedText,
      corrections,
      hasCorrections: correctedText !== text,
    };
  },

  // Model Management - Chrome manages models automatically
  async getAvailableModels(): Promise<DownloadableModelInfo[]> {
    return [];
  },

  async getDownloadedModels(): Promise<string[]> {
    return [];
  },

  async getLoadedModel(): Promise<string | null> {
    return null;
  },

  async getCurrentEngine(): Promise<InferenceEngine> {
    return 'none';
  },

  async downloadModel(_modelId: string): Promise<boolean> {
    return false;
  },

  async loadModel(_modelId: string): Promise<void> {},

  async deleteModel(_modelId: string): Promise<void> {},

  async getPromptApiStatus(): Promise<string> {
    const lm = getLanguageModelAPI();
    if (!lm) return 'not_available';
    try {
      return await lm.availability();
    } catch {
      return 'not_available';
    }
  },

  async downloadPromptApiModel(): Promise<boolean> {
    return false;
  },

  /** Destroy all cached Chrome AI instances and free resources */
  destroy() {
    cachedSummarizer?.destroy();
    cachedSummarizer = null;
    cachedSummarizerKey = '';

    cachedLanguageModel?.destroy();
    cachedLanguageModel = null;
    cachedSystemPrompt = undefined;

    for (const translator of cachedTranslators.values()) {
      translator.destroy();
    }
    cachedTranslators.clear();

    cachedRewriter?.destroy();
    cachedRewriter = null;

    cachedWriter?.destroy();
    cachedWriter = null;

    eventListeners.clear();
  },
};

export default ExpoOndeviceAiModule;
