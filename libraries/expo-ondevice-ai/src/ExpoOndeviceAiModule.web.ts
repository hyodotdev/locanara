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

// Cached Chrome AI instances
let cachedSummarizer: any = null;
let cachedSummarizerKey: string = '';
let cachedLanguageModel: any = null;
let cachedSystemPrompt: string | undefined = undefined;
const cachedTranslators = new Map<string, any>();
let cachedRewriter: any = null;
let cachedWriter: any = null;

// Simple event emitter for web (mimics Expo native module EventEmitter)
const eventListeners = new Map<string, Set<(data: any) => void>>();

function emitEvent(eventName: string, data: any) {
  const listeners = eventListeners.get(eventName);
  if (listeners) {
    for (const listener of listeners) {
      listener(data);
    }
  }
}

function getLanguageModelAPI(): any {
  const lm = (globalThis as any).LanguageModel;
  if (lm && (typeof lm === 'object' || typeof lm === 'function')) return lm;
  const ai = (globalThis as any).ai;
  if (ai && typeof ai === 'object' && ai.languageModel) return ai.languageModel;
  return undefined;
}

function hasAPI(api: string): boolean {
  const obj = (globalThis as any)[api];
  return !!obj && (typeof obj === 'object' || typeof obj === 'function');
}

async function checkAvailability(api: string): Promise<boolean> {
  try {
    const obj = (globalThis as any)[api];
    if (!obj) return false;
    // If .availability exists, check it with a timeout
    if (typeof obj.availability === 'function') {
      const status = await Promise.race([
        obj.availability(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      return status === 'available' || status === 'readily' || status === 'downloadable' || status === 'after-download';
    }
    // If API object exists but has no .availability, assume available (e.g. Translator)
    return typeof obj === 'object' || typeof obj === 'function';
  } catch {
    // API exists but availability check failed/timed out — still mark as available
    return hasAPI(api);
  }
}

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
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
        hasLanguageModel = s === 'readily' || s === 'available' || s === 'downloadable' || s === 'after-download';
      } catch {
        // API exists but check failed — still assume available
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
        proofread: hasWriter,
      },
    };
  },

  async summarize(text: string, options?: SummarizeOptions): Promise<SummarizeResult> {
    const Summarizer = (globalThis as any).Summarizer;
    if (!Summarizer) throw new Error('Summarizer API not available in this browser');

    // Always request key-points with enough length, then trim to desired bullet count
    const optionsKey = 'key-points:long';
    if (!cachedSummarizer || cachedSummarizerKey !== optionsKey) {
      cachedSummarizer?.destroy?.();
      cachedSummarizer = await Summarizer.create({
        type: 'key-points',
        length: 'long',
        format: 'markdown',
      });
      cachedSummarizerKey = optionsKey;
    }

    const raw = await cachedSummarizer.summarize(text);

    // Trim to desired bullet count
    const bulletCount =
      options?.outputType === 'ONE_BULLET' ? 1
      : options?.outputType === 'TWO_BULLETS' ? 2
      : 3;
    const bullets = raw
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.startsWith('*') || l.startsWith('-'));
    const summary = bullets.length > 0
      ? bullets.slice(0, bulletCount).join('\n')
      : raw;

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
    };
  },

  async classify(text: string, options?: ClassifyOptions): Promise<ClassifyResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const categories = options?.categories ?? ['positive', 'negative', 'neutral'];
    const session = await lm.create({});
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}.\n\nText: ${text}\n\nRespond with ONLY the category name.`;
    const response = await session.prompt(prompt);
    session.destroy();

    const category = response.trim();
    const isValid = categories.some(
      (c: string) => c.toLowerCase() === category.toLowerCase(),
    );

    return {
      classifications: [{label: isValid ? category : categories[0], score: isValid ? 0.9 : 0.5}],
      topClassification: {label: isValid ? category : categories[0], score: isValid ? 0.9 : 0.5},
    };
  },

  async extract(text: string, _options?: ExtractOptions): Promise<ExtractResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const session = await lm.create({});
    const prompt = `Extract entities from this text. Return JSON with these exact keys: "person", "email", "phone", "date", "location", "organization". Each key maps to an array of strings. Only include keys that have values.\n\nText: ${text}\n\nRespond with valid JSON only, no markdown.`;
    const response = await session.prompt(prompt);
    session.destroy();

    // Normalize type names to match iOS/Android SDK
    const typeNormalize: Record<string, string> = {
      person: 'person', persons: 'person', people: 'person', name: 'person', names: 'person',
      email: 'email', emails: 'email',
      phone: 'phone', phones: 'phone', phone_number: 'phone', phone_numbers: 'phone',
      date: 'date', dates: 'date',
      location: 'location', locations: 'location', place: 'location', places: 'location',
      organization: 'organization', organizations: 'organization', org: 'organization', orgs: 'organization',
      contact: 'email',
    };
    const confidenceMap: Record<string, number> = {
      person: 0.95, email: 0.98, phone: 0.97, date: 0.96, location: 0.92, organization: 0.90,
    };

    try {
      const jsonStr = response.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
      const parsed = JSON.parse(jsonStr);

      const entities: Array<{type: string; value: string; confidence: number}> = [];
      const walk = (obj: any, parentKey?: string) => {
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            if (typeof item === 'string') {
              const normalized = typeNormalize[(parentKey ?? '').toLowerCase()] ?? parentKey ?? 'unknown';
              entities.push({type: normalized, value: item, confidence: confidenceMap[normalized] ?? 0.85});
            } else {
              walk(item, parentKey);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => walk(value, key));
        } else {
          const normalized = typeNormalize[(parentKey ?? '').toLowerCase()] ?? parentKey ?? 'unknown';
          entities.push({type: normalized, value: String(obj), confidence: confidenceMap[normalized] ?? 0.85});
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
      cachedLanguageModel?.destroy?.();
      const initialPrompts: Array<{role: string; content: string}> = [];
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

  addListener(eventName: string, listener: (data: any) => void) {
    if (!eventListeners.has(eventName)) eventListeners.set(eventName, new Set());
    eventListeners.get(eventName)!.add(listener);
    return {remove: () => eventListeners.get(eventName)?.delete(listener)};
  },

  removeListeners(_count: number) {
    // No-op, cleanup handled by subscription.remove()
  },

  async chatStream(message: string, options?: ChatOptions): Promise<ChatResult> {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error('LanguageModel API not available in this browser');

    const newSystemPrompt = options?.systemPrompt;
    if (!cachedLanguageModel || newSystemPrompt !== cachedSystemPrompt) {
      cachedLanguageModel?.destroy?.();
      const initialPrompts: Array<{role: string; content: string}> = [];
      if (newSystemPrompt) {
        initialPrompts.push({role: 'system', content: newSystemPrompt});
      }
      cachedLanguageModel = await lm.create({
        initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
      });
      cachedSystemPrompt = newSystemPrompt;
    }

    // Use promptStreaming if available
    if (typeof cachedLanguageModel.promptStreaming === 'function') {
      const stream = cachedLanguageModel.promptStreaming(message);
      let accumulated = '';

      for await (const chunk of stream) {
        const text = typeof chunk === 'string' ? chunk : String(chunk);
        // Chrome may return cumulative or delta text depending on version
        if (text.length >= accumulated.length && text.startsWith(accumulated)) {
          // Cumulative: chunk already contains all previous content
          const delta = text.slice(accumulated.length);
          accumulated = text;
          emitEvent('onChatStreamChunk', {delta, accumulated, isFinal: false});
        } else {
          // Delta: just the new portion
          accumulated += text;
          emitEvent('onChatStreamChunk', {delta: text, accumulated, isFinal: false});
        }
      }

      emitEvent('onChatStreamChunk', {delta: '', accumulated, isFinal: true});
      return {message: accumulated, canContinue: true};
    }

    // Fallback to non-streaming
    const response = await cachedLanguageModel.prompt(message);
    emitEvent('onChatStreamChunk', {delta: response, accumulated: response, isFinal: true});
    return {message: response, canContinue: true};
  },

  async translate(text: string, options: TranslateOptions): Promise<TranslateResult> {
    const Translator = (globalThis as any).Translator;
    if (!Translator) throw new Error('Translator API not available in this browser');

    const key = `${options.sourceLanguage ?? 'en'}-${options.targetLanguage}`;
    if (!cachedTranslators.has(key)) {
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
    const Rewriter = (globalThis as any).Rewriter;
    if (!Rewriter) throw new Error('Rewriter API not available in this browser');

    const toneMap: Record<string, string> = {
      FRIENDLY: 'more-casual',
      PROFESSIONAL: 'more-formal',
      ELABORATE: 'as-is',
      SHORTEN: 'as-is',
      EMOJIFY: 'more-casual',
      REPHRASE: 'as-is',
    };
    const lengthMap: Record<string, string> = {
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

  async proofread(text: string, _options?: ProofreadOptions): Promise<ProofreadResult> {
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
        const jsonStr = response.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
        const parsed = JSON.parse(jsonStr);
        const correctedText = parsed.correctedText ?? text;
        const corrections = Array.isArray(parsed.corrections)
          ? parsed.corrections.map((c: any) => ({
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
    const Writer = (globalThis as any).Writer;
    if (!Writer) throw new Error('Writer or LanguageModel API not available in this browser');

    if (!cachedWriter) {
      cachedWriter = await Writer.create({});
    }

    const correctedText = await cachedWriter.write(
      `Proofread and correct this text. Fix ONLY spelling, grammar, and punctuation. Do NOT change meaning, tense, or word choice. Return only the corrected text:\n\n${text}`,
    );

    // Compute simple word-diff to populate corrections
    const corrections: Array<{original: string; corrected: string; type: string; confidence: number}> = [];
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
};

export default ExpoOndeviceAiModule;
