import {
  initialize,
  getDeviceCapability,
  summarize,
  classify,
  extract,
  chat,
  chatStream,
  translate,
  rewrite,
  proofread,
} from '../index';
import type {ChatStreamChunk} from '../types';

describe('expo-ondevice-ai', () => {
  describe('initialize', () => {
    it('should initialize SDK', async () => {
      const result = await initialize();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });

  describe('getDeviceCapability', () => {
    it('should return device capability', async () => {
      const result = await getDeviceCapability();
      expect(result).toHaveProperty('isSupported');
      expect(result).toHaveProperty('isModelReady');
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('features');
    });
  });

  describe('summarize', () => {
    it('should summarize text', async () => {
      const result = await summarize('This is a long text to summarize.');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('originalLength');
      expect(result).toHaveProperty('summaryLength');
    });
  });

  describe('classify', () => {
    it('should classify text', async () => {
      const result = await classify('This is a test.', {
        categories: ['positive', 'negative'],
      });
      expect(result).toHaveProperty('classifications');
      expect(result).toHaveProperty('topClassification');
      expect(result.topClassification).toHaveProperty('label');
      expect(result.topClassification).toHaveProperty('score');
    });
  });

  describe('extract', () => {
    it('should extract entities', async () => {
      const result = await extract('John lives in New York.');
      expect(result).toHaveProperty('entities');
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities[0]).toHaveProperty('type');
      expect(result.entities[0]).toHaveProperty('value');
      expect(result.entities[0]).toHaveProperty('confidence');
    });
  });

  describe('chat', () => {
    it('should return chat response', async () => {
      const result = await chat('Hello', {
        history: [{role: 'user', content: 'Hi'}],
      });
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canContinue');
    });
  });

  describe('chatStream', () => {
    it('should return final ChatResult', async () => {
      const result = await chatStream('Hello');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canContinue');
      expect(result.message).toBe('Hello world');
      expect(result.canContinue).toBe(true);
    });

    it('should invoke onChunk callback with streamed chunks', async () => {
      const chunks: ChatStreamChunk[] = [];

      await chatStream('Hello', {
        onChunk: (chunk) => {
          chunks.push(chunk);
        },
      });

      expect(chunks.length).toBe(3);
      expect(chunks[0].delta).toBe('Hello');
      expect(chunks[0].accumulated).toBe('Hello');
      expect(chunks[0].isFinal).toBe(false);
      expect(chunks[1].delta).toBe(' world');
      expect(chunks[1].accumulated).toBe('Hello world');
      expect(chunks[1].isFinal).toBe(false);
      expect(chunks[2].isFinal).toBe(true);
      expect(chunks[2].accumulated).toBe('Hello world');
    });

    it('should work without onChunk callback', async () => {
      const result = await chatStream('Hello', {});
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Hello world');
    });

    it('should pass options to native module', async () => {
      const {requireNativeModule} = require('expo-modules-core');
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      await chatStream('Hello', {
        systemPrompt: 'Be helpful',
        history: [{role: 'user', content: 'Hi'}],
      });

      expect(mockModule.chatStream).toHaveBeenCalledWith('Hello', {
        systemPrompt: 'Be helpful',
        history: [{role: 'user', content: 'Hi'}],
      });
    });

    it('should clean up subscription after completion', async () => {
      const {requireNativeModule} = require('expo-modules-core');
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      const onChunk = jest.fn();
      await chatStream('Hello', {onChunk});

      // addListener should have been called
      expect(mockModule.addListener).toHaveBeenCalledWith(
        'onChatStreamChunk',
        expect.any(Function),
      );
    });

    it('should clean up subscription on error', async () => {
      const {requireNativeModule} = require('expo-modules-core');
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      // Temporarily make chatStream reject
      mockModule.chatStream.mockRejectedValueOnce(new Error('Stream failed'));

      const onChunk = jest.fn();
      await expect(chatStream('Hello', {onChunk})).rejects.toThrow(
        'Stream failed',
      );
    });
  });

  describe('translate', () => {
    it('should translate text', async () => {
      const result = await translate('Hello', {targetLanguage: 'ko'});
      expect(result).toHaveProperty('translatedText');
      expect(result).toHaveProperty('sourceLanguage');
      expect(result).toHaveProperty('targetLanguage');
    });
  });

  describe('rewrite', () => {
    it('should rewrite text', async () => {
      const result = await rewrite('This is a test.', {
        outputType: 'PROFESSIONAL',
      });
      expect(result).toHaveProperty('rewrittenText');
    });
  });

  describe('proofread', () => {
    it('should proofread text', async () => {
      const result = await proofread('This is a test.');
      expect(result).toHaveProperty('correctedText');
      expect(result).toHaveProperty('corrections');
      expect(result).toHaveProperty('hasCorrections');
    });
  });
});
