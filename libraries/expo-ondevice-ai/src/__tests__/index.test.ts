import {requireNativeModule} from 'expo-modules-core';

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
} from '../index';
import type {ChatStreamChunk, TextStreamChunk} from '../types';

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

    it('should pass options to native module without onChunk', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      await chatStream('Hello', {
        systemPrompt: 'Be helpful',
        history: [{role: 'user', content: 'Hi'}],
        onChunk: jest.fn(),
      });

      // onChunk should be stripped — functions are not serializable
      expect(mockModule.chatStream).toHaveBeenCalledWith('Hello', {
        systemPrompt: 'Be helpful',
        history: [{role: 'user', content: 'Hi'}],
      });
    });

    it('should clean up subscription after completion', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      const onChunk = jest.fn();
      const subscriptionIndex = mockModule.addListener.mock.results.length;
      await chatStream('Hello', {onChunk});

      expect(mockModule.addListener).toHaveBeenCalledWith(
        'onChatStreamChunk',
        expect.any(Function),
      );
      expect(
        mockModule.addListener.mock.results[subscriptionIndex].value.remove,
      ).toHaveBeenCalledTimes(1);
    });

    it('should clean up subscription on error', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');

      // Temporarily make chatStream reject
      mockModule.chatStream.mockRejectedValueOnce(new Error('Stream failed'));

      const onChunk = jest.fn();
      const subscriptionIndex = mockModule.addListener.mock.results.length;
      await expect(chatStream('Hello', {onChunk})).rejects.toThrow(
        'Stream failed',
      );
      expect(
        mockModule.addListener.mock.results[subscriptionIndex].value.remove,
      ).toHaveBeenCalledTimes(1);
    });

    it('serializes concurrent streams before registering the next listener', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');
      const initialCalls = mockModule.chatStream.mock.calls.length;
      let resolveFirst = (_value: unknown) => {};

      mockModule.chatStream
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValueOnce({message: 'second', canContinue: true});

      const first = chatStream('first', {onChunk: jest.fn()});
      await Promise.resolve();
      const second = chatStream('second', {onChunk: jest.fn()});
      await Promise.resolve();

      expect(mockModule.chatStream).toHaveBeenCalledTimes(initialCalls + 1);
      resolveFirst({message: 'first', canContinue: true});
      await first;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      expect(mockModule.chatStream).toHaveBeenCalledTimes(initialCalls + 2);
      await second;
    });
  });

  describe('streaming variants', () => {
    it('forwards a summarize chunk and result', async () => {
      const chunks: TextStreamChunk[] = [];
      const result = await summarizeStreaming('Text', {
        onChunk: (chunk) => chunks.push(chunk),
      });
      expect(result.summary).toBe('Mock summary');
      expect(chunks).toHaveLength(1);
      expect(chunks[0].isFinal).toBe(true);
    });

    it('forwards translate and rewrite results', async () => {
      await expect(
        translateStreaming('Hello', {targetLanguage: 'ko'}),
      ).resolves.toHaveProperty('translatedText');
      await expect(
        rewriteStreaming('Hello', {outputType: 'PROFESSIONAL'}),
      ).resolves.toHaveProperty('rewrittenText');
    });

    it('uses one subscription lifecycle and strips callbacks for every stream', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');
      const cases = [
        {
          eventName: 'onChatStreamChunk',
          nativeOperation: mockModule.chatStream,
          expectedArguments: ['Lifecycle chat', {systemPrompt: 'Be concise'}],
          invoke: (onChunk: (chunk: ChatStreamChunk) => void) =>
            chatStream('Lifecycle chat', {
              systemPrompt: 'Be concise',
              onChunk,
            }),
        },
        {
          eventName: 'onSummarizeStreamChunk',
          nativeOperation: mockModule.summarizeStreaming,
          expectedArguments: ['Lifecycle summary', {outputType: 'ONE_BULLET'}],
          invoke: (onChunk: (chunk: TextStreamChunk) => void) =>
            summarizeStreaming('Lifecycle summary', {
              outputType: 'ONE_BULLET',
              onChunk,
            }),
        },
        {
          eventName: 'onTranslateStreamChunk',
          nativeOperation: mockModule.translateStreaming,
          expectedArguments: [
            'Lifecycle translation',
            {sourceLanguage: 'en', targetLanguage: 'ko'},
          ],
          invoke: (onChunk: (chunk: TextStreamChunk) => void) =>
            translateStreaming('Lifecycle translation', {
              sourceLanguage: 'en',
              targetLanguage: 'ko',
              onChunk,
            }),
        },
        {
          eventName: 'onRewriteStreamChunk',
          nativeOperation: mockModule.rewriteStreaming,
          expectedArguments: [
            'Lifecycle rewrite',
            {outputType: 'PROFESSIONAL'},
          ],
          invoke: (onChunk: (chunk: TextStreamChunk) => void) =>
            rewriteStreaming('Lifecycle rewrite', {
              outputType: 'PROFESSIONAL',
              onChunk,
            }),
        },
      ];

      for (const testCase of cases) {
        const subscriptionIndex = mockModule.addListener.mock.results.length;
        await testCase.invoke(jest.fn());

        expect(mockModule.addListener.mock.calls.at(-1)?.[0]).toBe(
          testCase.eventName,
        );
        expect(testCase.nativeOperation.mock.calls.at(-1)).toEqual(
          testCase.expectedArguments,
        );
        expect(
          mockModule.addListener.mock.results[subscriptionIndex].value.remove,
        ).toHaveBeenCalledTimes(1);
      }
    });

    it('removes a non-chat stream subscription when native execution fails', async () => {
      const mockModule = requireNativeModule('ExpoOndeviceAi');
      const streamError = new Error('Translate stream failed');
      mockModule.translateStreaming.mockRejectedValueOnce(streamError);
      const subscriptionIndex = mockModule.addListener.mock.results.length;

      await expect(
        translateStreaming('Hello', {
          targetLanguage: 'ko',
          onChunk: jest.fn(),
        }),
      ).rejects.toBe(streamError);

      expect(
        mockModule.addListener.mock.results[subscriptionIndex].value.remove,
      ).toHaveBeenCalledTimes(1);
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
