/**
 * Locanara Web SDK Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FeatureAvailability,
  FeatureType,
  Locanara,
  LocanaraError,
  LocanaraErrorCode,
  Platform,
  RewriteTone,
  SummarizeLength,
  SummarizeType,
} from '../src'

// Mock Chrome Built-in AI APIs
const mockSummarizer = {
  summarize: vi.fn().mockResolvedValue('This is a summary.'),
  summarizeStreaming: vi.fn(),
  destroy: vi.fn(),
}

const mockTranslator = {
  translate: vi.fn().mockResolvedValue('Hola! ¿Cómo estás?'),
  translateStreaming: vi.fn(),
  destroy: vi.fn(),
}

const mockRewriter = {
  rewrite: vi.fn().mockResolvedValue('Rewritten text here.'),
  rewriteStreaming: vi.fn(),
  destroy: vi.fn(),
}

const mockLanguageModelSession = {
  prompt: vi.fn().mockResolvedValue('AI response here.'),
  promptStreaming: vi.fn().mockReturnValue({
    getReader: () => ({
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: 'chunk1' })
        .mockResolvedValueOnce({ done: false, value: 'chunk2' })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    }),
  }),
  clone: vi.fn(),
  destroy: vi.fn(),
  inputUsage: 0,
  inputQuota: 1000,
}

const mockLanguageDetector = {
  detect: vi.fn().mockResolvedValue([
    { detectedLanguage: 'fr', confidence: 0.95 },
    { detectedLanguage: 'en', confidence: 0.03 },
  ]),
}

describe('Locanara', () => {
  beforeEach(() => {
    // Reset singleton
    Locanara.resetInstance()

    // Setup window mocks
    ;(window as unknown as Record<string, unknown>).Summarizer = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue(mockSummarizer),
    }
    ;(window as unknown as Record<string, unknown>).Translator = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue(mockTranslator),
    }
    ;(window as unknown as Record<string, unknown>).Rewriter = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue(mockRewriter),
    }
    ;(window as unknown as Record<string, unknown>).Writer = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue(mockRewriter), // Using same mock for simplicity
    }
    ;(window as unknown as Record<string, unknown>).LanguageModel = {
      availability: vi.fn().mockResolvedValue('readily'),
      params: vi.fn().mockResolvedValue({
        defaultTopK: 3,
        maxTopK: 128,
        defaultTemperature: 1,
        maxTemperature: 2,
      }),
      create: vi.fn().mockResolvedValue(mockLanguageModelSession),
    }
    ;(window as unknown as Record<string, unknown>).LanguageDetector = {
      availability: vi.fn().mockResolvedValue('readily'),
      create: vi.fn().mockResolvedValue(mockLanguageDetector),
    }
  })

  afterEach(() => {
    Locanara.resetInstance()
    vi.clearAllMocks()

    // Cleanup window mocks
    ;(window as unknown as Record<string, unknown>).Summarizer = undefined
    ;(window as unknown as Record<string, unknown>).Translator = undefined
    ;(window as unknown as Record<string, unknown>).Rewriter = undefined
    ;(window as unknown as Record<string, unknown>).Writer = undefined
    ;(window as unknown as Record<string, unknown>).LanguageModel = undefined
    ;(window as unknown as Record<string, unknown>).LanguageDetector = undefined
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Locanara.getInstance()
      const instance2 = Locanara.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should accept options on first call', () => {
      const onProgress = vi.fn()
      const instance = Locanara.getInstance({ onDownloadProgress: onProgress })
      expect(instance).toBeDefined()
    })
  })

  describe('getDeviceCapability', () => {
    it('should return device capabilities', async () => {
      const locanara = Locanara.getInstance()
      const capability = await locanara.getDeviceCapability()

      expect(capability.platform).toBe(Platform.WEB)
      expect(capability.supportsOnDeviceAI).toBe(true)
      expect(capability.availableFeatures).toHaveLength(8)
    })

    it('should report unavailable when APIs not present', async () => {
      ;(window as unknown as Record<string, unknown>).Summarizer = undefined

      const locanara = Locanara.getInstance()
      const capability = await locanara.getDeviceCapability()

      const summarize = capability.availableFeatures.find(
        (f) => f.feature === FeatureType.SUMMARIZE,
      )
      expect(summarize?.availability).toBe(FeatureAvailability.UNAVAILABLE)
    })
  })

  describe('summarize', () => {
    it('should summarize text', async () => {
      const locanara = Locanara.getInstance()
      const result = await locanara.summarize('Long text to summarize...')

      expect(result.summary).toBe('This is a summary.')
      expect(result.originalLength).toBe('Long text to summarize...'.length)
      expect(result.summaryLength).toBe('This is a summary.'.length)
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(
        'Long text to summarize...',
        expect.any(Object),
      )
    })

    it('should accept options', async () => {
      const locanara = Locanara.getInstance()
      await locanara.summarize('Text', {
        type: SummarizeType.TLDR,
        length: SummarizeLength.SHORT,
      })

      expect(window.Summarizer?.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tldr',
          length: 'short',
        }),
      )
    })

    it('should throw when API not supported', async () => {
      ;(window as unknown as Record<string, unknown>).Summarizer = undefined

      const locanara = Locanara.getInstance()
      await expect(locanara.summarize('Text')).rejects.toThrow(LocanaraError)
    })
  })

  describe('translate', () => {
    it('should translate text', async () => {
      const locanara = Locanara.getInstance()
      const result = await locanara.translate('Hello!', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
      })

      expect(result.translatedText).toBe('Hola! ¿Cómo estás?')
      expect(result.sourceLanguage).toBe('en')
      expect(result.targetLanguage).toBe('es')
    })

    it('should cache translators by language pair', async () => {
      const locanara = Locanara.getInstance()

      await locanara.translate('Hello', { sourceLanguage: 'en', targetLanguage: 'es' })
      await locanara.translate('World', { sourceLanguage: 'en', targetLanguage: 'es' })

      // Should only create one translator
      expect(window.Translator?.create).toHaveBeenCalledTimes(1)
    })

    it('should create different translators for different language pairs', async () => {
      const locanara = Locanara.getInstance()

      await locanara.translate('Hello', { sourceLanguage: 'en', targetLanguage: 'es' })
      await locanara.translate('Hello', { sourceLanguage: 'en', targetLanguage: 'fr' })

      expect(window.Translator?.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('chat', () => {
    it('should send chat message', async () => {
      const locanara = Locanara.getInstance()
      const result = await locanara.chat('Hello AI!')

      expect(result.response).toBe('AI response here.')
      expect(mockLanguageModelSession.prompt).toHaveBeenCalledWith('Hello AI!')
    })

    it('should accept system prompt', async () => {
      const locanara = Locanara.getInstance()
      await locanara.chat('Hello', {
        systemPrompt: 'You are a helpful assistant.',
      })

      expect(window.LanguageModel?.create).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPrompts: expect.arrayContaining([
            { role: 'system', content: 'You are a helpful assistant.' },
          ]),
        }),
      )
    })

    it('should reset chat session', async () => {
      const locanara = Locanara.getInstance()
      await locanara.chat('Hello')
      await locanara.resetChat()

      expect(mockLanguageModelSession.destroy).toHaveBeenCalled()
    })
  })

  describe('rewrite', () => {
    it('should rewrite text', async () => {
      const locanara = Locanara.getInstance()
      const result = await locanara.rewrite('hey whats up')

      expect(result.rewrittenText).toBe('Rewritten text here.')
    })

    it('should accept tone option', async () => {
      const locanara = Locanara.getInstance()
      await locanara.rewrite('hey', { tone: RewriteTone.MORE_FORMAL })

      expect(window.Rewriter?.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'more-formal',
        }),
      )
    })
  })

  describe('classify', () => {
    it('should classify text into categories', async () => {
      mockLanguageModelSession.prompt.mockResolvedValueOnce('Technology')

      const locanara = Locanara.getInstance()
      const result = await locanara.classify('The new iPhone is great', {
        categories: ['Technology', 'Sports', 'Politics'],
      })

      expect(result.category).toBe('Technology')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should throw when no categories provided', async () => {
      const locanara = Locanara.getInstance()
      await expect(locanara.classify('Text', { categories: [] })).rejects.toThrow(LocanaraError)
    })
  })

  describe('detectLanguage', () => {
    it('should detect language', async () => {
      const locanara = Locanara.getInstance()
      const results = await locanara.detectLanguage('Bonjour!')

      expect(results).toHaveLength(2)
      expect(results[0].detectedLanguage).toBe('fr')
      expect(results[0].confidence).toBe(0.95)
    })
  })

  describe('destroy', () => {
    it('should destroy all cached instances', async () => {
      const locanara = Locanara.getInstance()

      // Create some instances
      await locanara.summarize('Text')
      await locanara.translate('Hello', { sourceLanguage: 'en', targetLanguage: 'es' })
      await locanara.chat('Hello')

      locanara.destroy()

      expect(mockSummarizer.destroy).toHaveBeenCalled()
      expect(mockTranslator.destroy).toHaveBeenCalled()
      expect(mockLanguageModelSession.destroy).toHaveBeenCalled()
    })
  })
})

describe('LocanaraError', () => {
  it('should create error with code and message', () => {
    const error = new LocanaraError(LocanaraErrorCode.NOT_SUPPORTED, 'Feature not supported')

    expect(error.code).toBe(LocanaraErrorCode.NOT_SUPPORTED)
    expect(error.message).toBe('Feature not supported')
    expect(error.name).toBe('LocanaraError')
  })

  it('should create notSupported error', () => {
    const error = LocanaraError.notSupported('Summarizer')

    expect(error.code).toBe(LocanaraErrorCode.NOT_SUPPORTED)
    expect(error.message).toContain('Summarizer')
  })

  it('should create executionFailed error with details', () => {
    const details = { originalError: 'Network error' }
    const error = LocanaraError.executionFailed('summarize', details)

    expect(error.code).toBe(LocanaraErrorCode.EXECUTION_FAILED)
    expect(error.details).toBe(details)
  })
})
