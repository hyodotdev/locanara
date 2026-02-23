/**
 * Locanara Web SDK
 * Unified interface for Chrome Built-in AI (Gemini Nano)
 */

import { LocanaraError } from './Errors'
import {
  type ChatOptions,
  type ChatResult,
  type ClassifyOptions,
  type ClassifyResult,
  type DescribeImageOptions,
  type DescribeImageResult,
  type DetectLanguageResult,
  type DeviceCapability,
  type ExtractOptions,
  type ExtractResult,
  FeatureAvailability,
  FeatureType,
  Platform,
  type ProofreadOptions,
  type ProofreadResult,
  RewriteLength,
  type RewriteOptions,
  type RewriteResult,
  RewriteTone,
  SummarizeFormat,
  SummarizeLength,
  type SummarizeOptions,
  type SummarizeResult,
  SummarizeType,
  type TranslateOptions,
  type TranslateResult,
  type WriteOptions,
  type WriteResult,
  WriterLength,
  WriterTone,
} from './Types'

export type DownloadProgressCallback = (progress: {
  loaded: number
  total: number
}) => void

export interface LocanaraOptions {
  onDownloadProgress?: DownloadProgressCallback
}

/**
 * Locanara - Unified On-Device AI SDK for Web (Chrome Built-in AI)
 */
export class Locanara {
  private static _instance: Locanara | null = null
  private _options: LocanaraOptions

  // Cached instances
  private _summarizer: ChromeSummarizer | null = null
  private _summarizerOptionsKey: string | null = null
  private _translators: Map<string, ChromeTranslator> = new Map()
  private _rewriter: ChromeRewriter | null = null
  private _rewriterOptionsKey: string | null = null
  private _writer: ChromeWriter | null = null
  private _writerOptionsKey: string | null = null
  private _languageModel: ChromeLanguageModelSession | null = null
  private _languageModelOptionsKey: string | null = null
  private _languageDetector: ChromeLanguageDetector | null = null

  private constructor(options: LocanaraOptions = {}) {
    this._options = options
  }

  /**
   * Get the singleton instance of Locanara
   */
  static getInstance(options?: LocanaraOptions): Locanara {
    if (!Locanara._instance) {
      Locanara._instance = new Locanara(options)
    }
    return Locanara._instance
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (Locanara._instance) {
      Locanara._instance.destroy()
      Locanara._instance = null
    }
  }

  // ============================================================================
  // Device Capability
  // ============================================================================

  /**
   * Get device AI capabilities
   */
  async getDeviceCapability(): Promise<DeviceCapability> {
    const features: {
      feature: FeatureType
      availability: FeatureAvailability
    }[] = []

    // Check Summarizer
    features.push({
      feature: FeatureType.SUMMARIZE,
      availability: await this.checkAvailability('Summarizer'),
    })

    // Check Translator (basic check without language pair)
    features.push({
      feature: FeatureType.TRANSLATE,
      availability: this.checkTranslatorAvailability(),
    })

    // Check LanguageModel (for Chat, Classify, Extract)
    const chatAvailability = await this.checkLanguageModelAvailability()
    features.push({
      feature: FeatureType.CHAT,
      availability: chatAvailability,
    })
    features.push({
      feature: FeatureType.CLASSIFY,
      availability: chatAvailability,
    })
    features.push({
      feature: FeatureType.EXTRACT,
      availability: chatAvailability,
    })
    features.push({
      feature: FeatureType.DESCRIBE_IMAGE,
      availability: chatAvailability,
    })

    // Check Rewriter
    features.push({
      feature: FeatureType.REWRITE,
      availability: await this.checkAvailability('Rewriter'),
    })

    // Check Writer (used for Proofread)
    features.push({
      feature: FeatureType.PROOFREAD,
      availability: await this.checkAvailability('Writer'),
    })

    return {
      platform: Platform.WEB,
      supportsOnDeviceAI: features.some((f) => f.availability === FeatureAvailability.AVAILABLE),
      availableFeatures: features,
    }
  }

  private async checkAvailability(
    api: 'Summarizer' | 'Rewriter' | 'Writer',
  ): Promise<FeatureAvailability> {
    try {
      const apiClass = (window as unknown as Record<string, unknown>)[api] as
        | { availability?: () => Promise<string> }
        | undefined
      if (!apiClass || typeof apiClass.availability !== 'function') {
        return FeatureAvailability.UNAVAILABLE
      }

      const status = await Promise.race([
        apiClass.availability(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ])

      switch (status) {
        case 'available':
        case 'readily':
          return FeatureAvailability.AVAILABLE
        case 'downloadable':
        case 'after-download':
          return FeatureAvailability.DOWNLOADABLE
        default:
          return FeatureAvailability.UNAVAILABLE
      }
    } catch {
      return FeatureAvailability.UNAVAILABLE
    }
  }

  private getLanguageModelAPI():
    | {
        availability?: () => Promise<string>
        create?: (options: unknown) => Promise<unknown>
      }
    | undefined {
    // Try window.LanguageModel first (newer API)
    // LanguageModel is a class/constructor, so typeof is "function"
    const lm = (window as unknown as Record<string, unknown>).LanguageModel
    if (lm && (typeof lm === 'object' || typeof lm === 'function')) {
      return lm as {
        availability?: () => Promise<string>
        create?: (options: unknown) => Promise<unknown>
      }
    }

    // Try window.ai.languageModel (older API)
    const ai = (window as unknown as Record<string, unknown>).ai as
      | Record<string, unknown>
      | undefined
    if (ai && typeof ai === 'object' && ai.languageModel) {
      return ai.languageModel as {
        availability?: () => Promise<string>
        create?: (options: unknown) => Promise<unknown>
      }
    }

    return undefined
  }

  private async checkLanguageModelAvailability(): Promise<FeatureAvailability> {
    try {
      const lm = this.getLanguageModelAPI()
      if (!lm || typeof lm.availability !== 'function') {
        return FeatureAvailability.UNAVAILABLE
      }

      const status = await Promise.race([
        lm.availability(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ])

      switch (status) {
        case 'readily':
        case 'available':
          return FeatureAvailability.AVAILABLE
        case 'after-download':
        case 'downloading':
        case 'downloadable':
          return FeatureAvailability.DOWNLOADABLE
        default:
          return FeatureAvailability.UNAVAILABLE
      }
    } catch {
      return FeatureAvailability.UNAVAILABLE
    }
  }

  private checkTranslatorAvailability(): FeatureAvailability {
    const translator = (window as unknown as Record<string, unknown>).Translator
    if (translator && typeof translator === 'object') {
      return FeatureAvailability.AVAILABLE
    }
    return FeatureAvailability.UNAVAILABLE
  }

  // ============================================================================
  // Summarize
  // ============================================================================

  /**
   * Summarize text
   */
  async summarize(text: string, options: SummarizeOptions = {}): Promise<SummarizeResult> {
    if (!window.Summarizer) {
      throw LocanaraError.notSupported('Summarizer')
    }

    try {
      const optionsKey = JSON.stringify({
        type: options.type,
        length: options.length,
        format: options.format,
        expectedInputLanguages: options.expectedInputLanguages,
        outputLanguage: options.outputLanguage,
      })

      if (!this._summarizer || this._summarizerOptionsKey !== optionsKey) {
        this._summarizer?.destroy()
        this._summarizer = await window.Summarizer.create({
          type: this.mapSummarizeType(options.type),
          length: this.mapSummarizeLength(options.length),
          format: this.mapSummarizeFormat(options.format),
          sharedContext: options.context,
          expectedInputLanguages: options.expectedInputLanguages ?? ['en'],
          outputLanguage: options.outputLanguage ?? 'en',
          monitor: this.createMonitor(),
        })
        this._summarizerOptionsKey = optionsKey
      }

      const summary = await this._summarizer.summarize(text, {
        context: options.context,
      })

      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
      }
    } catch (error) {
      throw LocanaraError.executionFailed('summarize', error)
    }
  }

  /**
   * Summarize text with streaming
   */
  async *summarizeStreaming(text: string, options: SummarizeOptions = {}): AsyncGenerator<string> {
    if (!window.Summarizer) {
      throw LocanaraError.notSupported('Summarizer')
    }

    try {
      const optionsKey = JSON.stringify({
        type: options.type,
        length: options.length,
        format: options.format,
        expectedInputLanguages: options.expectedInputLanguages,
        outputLanguage: options.outputLanguage,
      })

      if (!this._summarizer || this._summarizerOptionsKey !== optionsKey) {
        this._summarizer?.destroy()
        this._summarizer = await window.Summarizer.create({
          type: this.mapSummarizeType(options.type),
          length: this.mapSummarizeLength(options.length),
          format: this.mapSummarizeFormat(options.format),
          sharedContext: options.context,
          expectedInputLanguages: options.expectedInputLanguages ?? ['en'],
          outputLanguage: options.outputLanguage ?? 'en',
          monitor: this.createMonitor(),
        })
        this._summarizerOptionsKey = optionsKey
      }

      const stream = this._summarizer.summarizeStreaming(text, {
        context: options.context,
      })

      for await (const chunk of stream) {
        yield chunk
      }
    } catch (error) {
      throw LocanaraError.executionFailed('summarizeStreaming', error)
    }
  }

  private mapSummarizeType(type?: SummarizeType): 'key-points' | 'tldr' | 'teaser' | 'headline' {
    switch (type) {
      case SummarizeType.KEY_POINTS:
        return 'key-points'
      case SummarizeType.TLDR:
        return 'tldr'
      case SummarizeType.TEASER:
        return 'teaser'
      case SummarizeType.HEADLINE:
        return 'headline'
      default:
        return 'key-points'
    }
  }

  private mapSummarizeLength(length?: SummarizeLength): 'short' | 'medium' | 'long' {
    switch (length) {
      case SummarizeLength.SHORT:
        return 'short'
      case SummarizeLength.MEDIUM:
        return 'medium'
      case SummarizeLength.LONG:
        return 'long'
      default:
        return 'medium'
    }
  }

  private mapSummarizeFormat(format?: SummarizeFormat): 'markdown' | 'plain-text' {
    switch (format) {
      case SummarizeFormat.MARKDOWN:
        return 'markdown'
      case SummarizeFormat.PLAIN_TEXT:
        return 'plain-text'
      default:
        return 'markdown'
    }
  }

  // ============================================================================
  // Translate
  // ============================================================================

  /**
   * Translate text
   */
  async translate(text: string, options: TranslateOptions): Promise<TranslateResult> {
    if (!window.Translator) {
      throw LocanaraError.notSupported('Translator')
    }

    const key = `${options.sourceLanguage}-${options.targetLanguage}`

    try {
      if (!this._translators.has(key)) {
        const translator = await window.Translator.create({
          sourceLanguage: options.sourceLanguage,
          targetLanguage: options.targetLanguage,
          monitor: this.createMonitor(),
        })
        this._translators.set(key, translator)
      }

      const translator = this._translators.get(key)!
      const translatedText = await translator.translate(text)

      return {
        translatedText,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
      }
    } catch (error) {
      throw LocanaraError.executionFailed('translate', error)
    }
  }

  /**
   * Translate text with streaming
   */
  async *translateStreaming(text: string, options: TranslateOptions): AsyncGenerator<string> {
    if (!window.Translator) {
      throw LocanaraError.notSupported('Translator')
    }

    const key = `${options.sourceLanguage}-${options.targetLanguage}`

    try {
      if (!this._translators.has(key)) {
        const translator = await window.Translator.create({
          sourceLanguage: options.sourceLanguage,
          targetLanguage: options.targetLanguage,
          monitor: this.createMonitor(),
        })
        this._translators.set(key, translator)
      }

      const translator = this._translators.get(key)!
      const stream = translator.translateStreaming(text)

      for await (const chunk of stream) {
        yield chunk
      }
    } catch (error) {
      throw LocanaraError.executionFailed('translateStreaming', error)
    }
  }

  // ============================================================================
  // Chat (using LanguageModel / Prompt API)
  // ============================================================================

  /**
   * Send a chat message
   */
  async chat(message: string, options: ChatOptions = {}): Promise<ChatResult> {
    const lmAPI = this.getLanguageModelAPI()
    if (!lmAPI || typeof lmAPI.create !== 'function') {
      throw LocanaraError.notSupported('LanguageModel')
    }

    try {
      const optionsKey = JSON.stringify({
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        topK: options.topK,
        initialPrompts: options.initialPrompts,
      })

      if (!this._languageModel || this._languageModelOptionsKey !== optionsKey) {
        this._languageModel?.destroy()

        const initialPrompts: Array<{ role: string; content: string }> = []

        if (options.systemPrompt) {
          initialPrompts.push({
            role: 'system',
            content: options.systemPrompt,
          })
        }

        if (options.initialPrompts) {
          initialPrompts.push(
            ...options.initialPrompts.map((p) => ({
              role: p.role,
              content: p.content,
            })),
          )
        }

        this._languageModel = (await lmAPI.create({
          temperature: options.temperature,
          topK: options.topK,
          initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
          monitor: this.createMonitor(),
        })) as ChromeLanguageModelSession
        this._languageModelOptionsKey = optionsKey
      }

      const response = await this._languageModel.prompt(message)

      return { response }
    } catch (error) {
      throw LocanaraError.executionFailed('chat', error)
    }
  }

  /**
   * Send a chat message with streaming
   */
  async *chatStreaming(message: string, options: ChatOptions = {}): AsyncGenerator<string> {
    const lmAPI = this.getLanguageModelAPI()
    if (!lmAPI || typeof lmAPI.create !== 'function') {
      throw LocanaraError.notSupported('LanguageModel')
    }

    try {
      const optionsKey = JSON.stringify({
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        topK: options.topK,
      })

      if (!this._languageModel || this._languageModelOptionsKey !== optionsKey) {
        this._languageModel?.destroy()

        const initialPrompts: Array<{ role: string; content: string }> = []

        if (options.systemPrompt) {
          initialPrompts.push({
            role: 'system',
            content: options.systemPrompt,
          })
        }

        this._languageModel = (await lmAPI.create({
          temperature: options.temperature,
          topK: options.topK,
          initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
          monitor: this.createMonitor(),
        })) as ChromeLanguageModelSession
        this._languageModelOptionsKey = optionsKey
      }

      const stream = this._languageModel.promptStreaming(message)
      const reader = stream.getReader()
      let accumulated = ''

      try {
        while (true) {
          const result = await reader.read()
          if (result.done) {
            break
          }
          if (result.value) {
            const text = typeof result.value === 'string' ? result.value : String(result.value)
            // Chrome may return cumulative or delta text depending on version
            if (text.length >= accumulated.length && text.startsWith(accumulated)) {
              // Cumulative: chunk contains all previous content
              const delta = text.slice(accumulated.length)
              accumulated = text
              if (delta) yield delta
            } else {
              // Delta: just the new portion
              accumulated += text
              yield text
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      throw LocanaraError.executionFailed('chatStreaming', error)
    }
  }

  /**
   * Reset chat session (clear context)
   */
  async resetChat(): Promise<void> {
    if (this._languageModel) {
      this._languageModel.destroy()
      this._languageModel = null
      this._languageModelOptionsKey = null
    }
  }

  // ============================================================================
  // Rewrite
  // ============================================================================

  /**
   * Rewrite text
   */
  async rewrite(text: string, options: RewriteOptions = {}): Promise<RewriteResult> {
    if (!window.Rewriter) {
      throw LocanaraError.notSupported('Rewriter')
    }

    try {
      const optionsKey = JSON.stringify({
        tone: options.tone,
        length: options.length,
        format: options.format,
      })

      if (!this._rewriter || this._rewriterOptionsKey !== optionsKey) {
        this._rewriter?.destroy()
        this._rewriter = await window.Rewriter.create({
          tone: this.mapRewriteTone(options.tone),
          length: this.mapRewriteLength(options.length),
          format: options.format
            ? (this.mapSummarizeFormat(options.format) as 'markdown' | 'plain-text' | 'as-is')
            : 'as-is',
          sharedContext: options.context,
          monitor: this.createMonitor(),
        })
        this._rewriterOptionsKey = optionsKey
      }

      const rewrittenText = await this._rewriter.rewrite(text, {
        context: options.context,
      })

      return { rewrittenText }
    } catch (error) {
      throw LocanaraError.executionFailed('rewrite', error)
    }
  }

  /**
   * Rewrite text with streaming
   */
  async *rewriteStreaming(text: string, options: RewriteOptions = {}): AsyncGenerator<string> {
    if (!window.Rewriter) {
      throw LocanaraError.notSupported('Rewriter')
    }

    try {
      const optionsKey = JSON.stringify({
        tone: options.tone,
        length: options.length,
        format: options.format,
      })

      if (!this._rewriter || this._rewriterOptionsKey !== optionsKey) {
        this._rewriter?.destroy()
        this._rewriter = await window.Rewriter.create({
          tone: this.mapRewriteTone(options.tone),
          length: this.mapRewriteLength(options.length),
          monitor: this.createMonitor(),
        })
        this._rewriterOptionsKey = optionsKey
      }

      const stream = this._rewriter.rewriteStreaming(text, {
        context: options.context,
      })

      for await (const chunk of stream) {
        yield chunk
      }
    } catch (error) {
      throw LocanaraError.executionFailed('rewriteStreaming', error)
    }
  }

  private mapRewriteTone(tone?: RewriteTone): 'more-formal' | 'as-is' | 'more-casual' {
    switch (tone) {
      case RewriteTone.MORE_FORMAL:
        return 'more-formal'
      case RewriteTone.AS_IS:
        return 'as-is'
      case RewriteTone.MORE_CASUAL:
        return 'more-casual'
      default:
        return 'as-is'
    }
  }

  private mapRewriteLength(length?: RewriteLength): 'shorter' | 'as-is' | 'longer' {
    switch (length) {
      case RewriteLength.SHORTER:
        return 'shorter'
      case RewriteLength.AS_IS:
        return 'as-is'
      case RewriteLength.LONGER:
        return 'longer'
      default:
        return 'as-is'
    }
  }

  // ============================================================================
  // Classify (using LanguageModel)
  // ============================================================================

  /**
   * Classify text into categories
   */
  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResult> {
    const lmAPI = this.getLanguageModelAPI()
    if (!lmAPI || typeof lmAPI.create !== 'function') {
      throw LocanaraError.notSupported('LanguageModel')
    }

    if (!options.categories || options.categories.length === 0) {
      throw LocanaraError.invalidInput('Categories are required for classification')
    }

    try {
      const session = (await lmAPI.create({
        monitor: this.createMonitor(),
      })) as ChromeLanguageModelSession

      const prompt = `Classify the following text into one of these categories: ${options.categories.join(
        ', ',
      )}.
${options.context ? `Context: ${options.context}` : ''}

Text to classify:
${text}

Respond with ONLY the category name, nothing else.`

      const response = await session.prompt(prompt)
      session.destroy()

      const category = response.trim()
      const isValidCategory = options.categories.some(
        (c) => c.toLowerCase() === category.toLowerCase(),
      )

      return {
        category: isValidCategory ? category : options.categories[0]!,
        confidence: isValidCategory ? 0.9 : 0.5,
      }
    } catch (error) {
      throw LocanaraError.executionFailed('classify', error)
    }
  }

  // ============================================================================
  // Extract (using LanguageModel)
  // ============================================================================

  /**
   * Extract entities from text
   */
  async extract(text: string, options: ExtractOptions = {}): Promise<ExtractResult> {
    const lmAPI = this.getLanguageModelAPI()
    if (!lmAPI || typeof lmAPI.create !== 'function') {
      throw LocanaraError.notSupported('LanguageModel')
    }

    try {
      const session = (await lmAPI.create({
        monitor: this.createMonitor(),
      })) as ChromeLanguageModelSession

      const schemaDescription = options.schema
        ? `Extract the following fields: ${JSON.stringify(options.schema)}`
        : 'Extract key entities like names, dates, locations, organizations, and other important information'

      const prompt = `${schemaDescription}
${options.context ? `Context: ${options.context}` : ''}

Text:
${text}

Respond with a valid JSON object containing the extracted entities.`

      const response = await session.prompt(prompt)
      session.destroy()

      try {
        const entities = JSON.parse(response)
        return { entities }
      } catch {
        return { entities: { raw: response } }
      }
    } catch (error) {
      throw LocanaraError.executionFailed('extract', error)
    }
  }

  // ============================================================================
  // Proofread (using Writer API)
  // ============================================================================

  /**
   * Proofread text for grammar and spelling
   */
  async proofread(text: string, options: ProofreadOptions = {}): Promise<ProofreadResult> {
    if (!window.Writer) {
      throw LocanaraError.notSupported('Writer')
    }

    try {
      if (!this._writer) {
        this._writer = await window.Writer.create({
          monitor: this.createMonitor(),
        })
      }

      const prompt = `Proofread and correct the following text. Fix grammar, spelling, and punctuation errors while preserving the original meaning.
${options.context ? `Context: ${options.context}` : ''}

Text:
${text}`

      const correctedText = await this._writer.write(prompt)

      const hasCorrections = correctedText !== text

      return {
        correctedText,
        corrections: [], // Chrome API doesn't provide detailed corrections
        hasCorrections,
      }
    } catch (error) {
      throw LocanaraError.executionFailed('proofread', error)
    }
  }

  // ============================================================================
  // Describe Image (using LanguageModel with multimodal)
  // ============================================================================

  /**
   * Describe an image
   */
  async describeImage(
    image: Blob | HTMLImageElement | HTMLCanvasElement | ImageData,
    options: DescribeImageOptions = {},
  ): Promise<DescribeImageResult> {
    const lmAPI = this.getLanguageModelAPI()
    if (!lmAPI || typeof lmAPI.create !== 'function') {
      throw LocanaraError.notSupported('LanguageModel')
    }

    try {
      const session = (await lmAPI.create({
        monitor: this.createMonitor(),
      })) as ChromeLanguageModelSession

      let imageBlob: Blob
      if (image instanceof Blob) {
        imageBlob = image
      } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
        const canvas = image instanceof HTMLCanvasElement ? image : await this.imageToCanvas(image)
        imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to convert to blob'))),
            'image/png',
          )
        })
      } else {
        // ImageData
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')!
        ctx.putImageData(image, 0, 0)
        imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to convert to blob'))),
            'image/png',
          )
        })
      }

      const prompt = options.context
        ? `Describe this image. Context: ${options.context}`
        : 'Describe this image in detail.'

      const response = await session.prompt([
        { role: 'user', content: imageBlob },
        { role: 'user', content: prompt },
      ])

      session.destroy()

      return { description: response }
    } catch (error) {
      throw LocanaraError.executionFailed('describeImage', error)
    }
  }

  private async imageToCanvas(image: HTMLImageElement): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    return canvas
  }

  // ============================================================================
  // Language Detection
  // ============================================================================

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<DetectLanguageResult[]> {
    if (!window.LanguageDetector) {
      throw LocanaraError.notSupported('LanguageDetector')
    }

    try {
      if (!this._languageDetector) {
        this._languageDetector = await window.LanguageDetector.create({
          monitor: this.createMonitor(),
        })
      }

      return await this._languageDetector.detect(text)
    } catch (error) {
      throw LocanaraError.executionFailed('detectLanguage', error)
    }
  }

  // ============================================================================
  // Write (Chrome-specific)
  // ============================================================================

  /**
   * Generate text based on a prompt
   */
  async write(prompt: string, options: WriteOptions = {}): Promise<WriteResult> {
    if (!window.Writer) {
      throw LocanaraError.notSupported('Writer')
    }

    try {
      const optionsKey = JSON.stringify({
        tone: options.tone,
        length: options.length,
        format: options.format,
      })

      if (!this._writer || this._writerOptionsKey !== optionsKey) {
        this._writer?.destroy()
        this._writer = await window.Writer.create({
          tone: this.mapWriterTone(options.tone),
          length: this.mapWriterLength(options.length),
          format: options.format ? this.mapSummarizeFormat(options.format) : 'markdown',
          sharedContext: options.context,
          monitor: this.createMonitor(),
        })
        this._writerOptionsKey = optionsKey
      }

      const text = await this._writer.write(prompt, {
        context: options.context,
      })

      return { text }
    } catch (error) {
      throw LocanaraError.executionFailed('write', error)
    }
  }

  /**
   * Generate text with streaming
   */
  async *writeStreaming(prompt: string, options: WriteOptions = {}): AsyncGenerator<string> {
    if (!window.Writer) {
      throw LocanaraError.notSupported('Writer')
    }

    try {
      const optionsKey = JSON.stringify({
        tone: options.tone,
        length: options.length,
        format: options.format,
      })

      if (!this._writer || this._writerOptionsKey !== optionsKey) {
        this._writer?.destroy()
        this._writer = await window.Writer.create({
          tone: this.mapWriterTone(options.tone),
          length: this.mapWriterLength(options.length),
          monitor: this.createMonitor(),
        })
        this._writerOptionsKey = optionsKey
      }

      const stream = this._writer.writeStreaming(prompt, {
        context: options.context,
      })

      for await (const chunk of stream) {
        yield chunk
      }
    } catch (error) {
      throw LocanaraError.executionFailed('writeStreaming', error)
    }
  }

  private mapWriterTone(tone?: WriterTone): 'formal' | 'neutral' | 'casual' {
    switch (tone) {
      case WriterTone.FORMAL:
        return 'formal'
      case WriterTone.NEUTRAL:
        return 'neutral'
      case WriterTone.CASUAL:
        return 'casual'
      default:
        return 'neutral'
    }
  }

  private mapWriterLength(length?: WriterLength): 'short' | 'medium' | 'long' {
    switch (length) {
      case WriterLength.SHORT:
        return 'short'
      case WriterLength.MEDIUM:
        return 'medium'
      case WriterLength.LONG:
        return 'long'
      default:
        return 'medium'
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private createMonitor(): ((m: EventTarget) => void) | undefined {
    if (!this._options.onDownloadProgress) return undefined

    return (monitor: EventTarget) => {
      monitor.addEventListener('downloadprogress', ((
        e: Event & { loaded?: number; total?: number },
      ) => {
        const loaded = e.loaded ?? 0
        const total = e.total ?? 1
        this._options.onDownloadProgress?.({ loaded, total })
      }) as EventListener)
    }
  }

  // ============================================================================
  // Model Management
  // ============================================================================

  /**
   * Preload models for better performance
   * Chrome Built-in AI manages model caching automatically.
   */
  async preloadModels(_features: FeatureType[]): Promise<void> {
    // Chrome Built-in AI manages model caching automatically
  }

  /**
   * Unload models to free memory
   * Chrome Built-in AI manages model memory automatically.
   */
  async unloadModels(_features: FeatureType[]): Promise<void> {
    // Chrome Built-in AI manages model memory automatically
  }

  /**
   * Cancel an ongoing execution
   */
  cancelExecution(_executionId: string): void {
    // Chrome Built-in AI operations complete quickly
  }

  /**
   * Download a specific model
   * Chrome Built-in AI manages model downloads automatically.
   */
  async downloadModel(_modelId: string): Promise<void> {
    // Chrome Built-in AI manages model downloads automatically
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Destroy all cached instances and free resources
   */
  destroy(): void {
    this._summarizer?.destroy()
    this._summarizer = null
    this._summarizerOptionsKey = null

    for (const translator of this._translators.values()) {
      translator.destroy()
    }
    this._translators.clear()

    this._rewriter?.destroy()
    this._rewriter = null
    this._rewriterOptionsKey = null

    this._writer?.destroy()
    this._writer = null
    this._writerOptionsKey = null

    this._languageModel?.destroy()
    this._languageModel = null

    this._languageDetector = null
  }
}

export default Locanara
