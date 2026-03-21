import {
  initialize,
  getDeviceCapability,
  summarize,
  summarizeStreaming,
  classify,
  extract,
  chat,
  chatStream,
  translate,
  translateStreaming,
  rewrite,
  rewriteStreaming,
  proofread,
  describeImage,
  getAvailableModels,
  getDownloadedModels,
  getLoadedModel,
  getCurrentEngine,
  downloadModel,
  loadModel,
  deleteModel,
  getPromptApiStatus,
  downloadPromptApiModel,
  isNitroReady,
} from '../index';
import type {ChatStreamChunk, TextStreamChunk} from '../types';

describe('react-native-ondevice-ai', () => {
  describe('isNitroReady', () => {
    it('should return true when Nitro is available', () => {
      expect(isNitroReady()).toBe(true);
    });
  });

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
      expect(result.features).toHaveProperty('summarize');
      expect(result.features).toHaveProperty('classify');
      expect(result.features).toHaveProperty('chat');
    });
  });

  describe('summarize', () => {
    it('should summarize text', async () => {
      const result = await summarize('This is a long text to summarize.');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('originalLength');
      expect(result).toHaveProperty('summaryLength');
      expect(result).toHaveProperty('confidence');
    });

    it('should accept output type option', async () => {
      const result = await summarize('Text', {
        outputType: 'THREE_BULLETS',
      });
      expect(result).toHaveProperty('summary');
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

    it('should work without options', async () => {
      const result = await classify('This is a test.');
      expect(result).toHaveProperty('classifications');
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

    it('should work without options', async () => {
      const result = await chat('Hello');
      expect(result).toHaveProperty('message');
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
      expect(chunks[0]!.delta).toBe('Hello');
      expect(chunks[0]!.accumulated).toBe('Hello');
      expect(chunks[0]!.isFinal).toBe(false);
      expect(chunks[1]!.delta).toBe(' world');
      expect(chunks[1]!.accumulated).toBe('Hello world');
      expect(chunks[1]!.isFinal).toBe(false);
      expect(chunks[2]!.isFinal).toBe(true);
      expect(chunks[2]!.accumulated).toBe('Hello world');
    });

    it('should work without onChunk callback', async () => {
      const result = await chatStream('Hello', {});
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Hello world');
    });

    it('should clean up listener after completion', async () => {
      const {
        __mockHybridObject: mock,
      } = require('react-native-nitro-modules');

      const onChunk = jest.fn();
      await chatStream('Hello', {onChunk});

      expect(mock.addChatStreamListener).toHaveBeenCalled();
      expect(mock.removeChatStreamListener).toHaveBeenCalled();
    });

    it('should clean up listener on error', async () => {
      const {
        __mockHybridObject: mock,
      } = require('react-native-nitro-modules');

      mock.chatStream.mockRejectedValueOnce(new Error('Stream failed'));

      const onChunk = jest.fn();
      await expect(chatStream('Hello', {onChunk})).rejects.toThrow(
        'Stream failed',
      );

      expect(mock.removeChatStreamListener).toHaveBeenCalled();
    });
  });

  describe('summarizeStreaming', () => {
    it('should return summarize result', async () => {
      const result = await summarizeStreaming('Long text to summarize.');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('originalLength');
    });

    it('should invoke onChunk with final chunk', async () => {
      const chunks: TextStreamChunk[] = [];
      await summarizeStreaming('Text', {onChunk: (c) => chunks.push(c)});
      expect(chunks.length).toBe(1);
      expect(chunks[0]!.isFinal).toBe(true);
    });

    it('should clean up listener after completion', async () => {
      const {__mockHybridObject: mock} = require('react-native-nitro-modules');
      await summarizeStreaming('Text', {onChunk: jest.fn()});
      expect(mock.addSummarizeStreamListener).toHaveBeenCalled();
      expect(mock.removeSummarizeStreamListener).toHaveBeenCalled();
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

  describe('translateStreaming', () => {
    it('should return translate result', async () => {
      const result = await translateStreaming('Hello', {targetLanguage: 'ko'});
      expect(result).toHaveProperty('translatedText');
    });

    it('should invoke onChunk with final chunk', async () => {
      const chunks: TextStreamChunk[] = [];
      await translateStreaming('Hello', {targetLanguage: 'ko', onChunk: (c) => chunks.push(c)});
      expect(chunks.length).toBe(1);
      expect(chunks[0]!.isFinal).toBe(true);
    });

    it('should clean up listener after completion', async () => {
      const {__mockHybridObject: mock} = require('react-native-nitro-modules');
      await translateStreaming('Hello', {targetLanguage: 'ko', onChunk: jest.fn()});
      expect(mock.addTranslateStreamListener).toHaveBeenCalled();
      expect(mock.removeTranslateStreamListener).toHaveBeenCalled();
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

  describe('rewriteStreaming', () => {
    it('should return rewrite result', async () => {
      const result = await rewriteStreaming('Text.', {outputType: 'PROFESSIONAL'});
      expect(result).toHaveProperty('rewrittenText');
    });

    it('should invoke onChunk with final chunk', async () => {
      const chunks: TextStreamChunk[] = [];
      await rewriteStreaming('Text.', {outputType: 'PROFESSIONAL', onChunk: (c) => chunks.push(c)});
      expect(chunks.length).toBe(1);
      expect(chunks[0]!.isFinal).toBe(true);
    });

    it('should clean up listener after completion', async () => {
      const {__mockHybridObject: mock} = require('react-native-nitro-modules');
      await rewriteStreaming('Text.', {outputType: 'PROFESSIONAL', onChunk: jest.fn()});
      expect(mock.addRewriteStreamListener).toHaveBeenCalled();
      expect(mock.removeRewriteStreamListener).toHaveBeenCalled();
    });
  });

  describe('describeImage', () => {
    it('should return image description', async () => {
      const result = await describeImage('file:///path/to/image.jpg');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('confidence');
    });

    it('should accept optional prompt', async () => {
      const result = await describeImage('file:///path/to/image.jpg', {prompt: 'What is in this image?'});
      expect(result).toHaveProperty('description');
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

  // Model Management

  describe('getAvailableModels', () => {
    it('should return model list', async () => {
      const models = await getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
    });
  });

  describe('getDownloadedModels', () => {
    it('should return downloaded model IDs', async () => {
      const ids = await getDownloadedModels();
      expect(Array.isArray(ids)).toBe(true);
    });
  });

  describe('getLoadedModel', () => {
    it('should return loaded model ID or null', async () => {
      const model = await getLoadedModel();
      expect(model === null || typeof model === 'string').toBe(true);
    });
  });

  describe('getCurrentEngine', () => {
    it('should return engine type', async () => {
      const engine = await getCurrentEngine();
      expect(typeof engine).toBe('string');
    });
  });

  describe('downloadModel', () => {
    it('should download model', async () => {
      const result = await downloadModel('test-model');
      expect(result).toBe(true);
    });

    it('should accept onProgress callback', async () => {
      const onProgress = jest.fn();
      const result = await downloadModel('test-model', onProgress);
      expect(result).toBe(true);
    });
  });

  describe('loadModel', () => {
    it('should load model', async () => {
      await expect(loadModel('test-model')).resolves.toBeUndefined();
    });
  });

  describe('deleteModel', () => {
    it('should delete model', async () => {
      await expect(deleteModel('test-model')).resolves.toBeUndefined();
    });
  });

  describe('getPromptApiStatus', () => {
    it('should return status string', async () => {
      const status = await getPromptApiStatus();
      expect(typeof status).toBe('string');
    });
  });

  describe('downloadPromptApiModel', () => {
    it('should download prompt API model', async () => {
      const result = await downloadPromptApiModel();
      expect(result).toBe(true);
    });
  });
});
