import ExpoOndeviceAiModule from '../ExpoOndeviceAiModule.web';

async function* chunks(values: string[]): AsyncGenerator<string> {
  for (const value of values) {
    yield value;
  }
}

async function* chunksThenThrow(
  values: string[],
  error: Error,
): AsyncGenerator<string> {
  yield* chunks(values);
  throw error;
}

function setWebApi(name: string, value: unknown): void {
  (globalThis as Record<string, unknown>)[name] = value;
}

describe('ExpoOndeviceAiModule.web', () => {
  afterEach(() => {
    ExpoOndeviceAiModule.destroy();
    for (const api of [
      'Summarizer',
      'Translator',
      'Rewriter',
      'LanguageModel',
    ]) {
      delete (globalThis as Record<string, unknown>)[api];
    }
  });

  it('exposes the complete Web runtime surface', () => {
    expect(ExpoOndeviceAiModule.summarizeStreaming).toEqual(
      expect.any(Function),
    );
    expect(ExpoOndeviceAiModule.translateStreaming).toEqual(
      expect.any(Function),
    );
    expect(ExpoOndeviceAiModule.rewriteStreaming).toEqual(expect.any(Function));
    expect(ExpoOndeviceAiModule.describeImage).toEqual(expect.any(Function));
  });

  it('streams summaries through the Chrome Summarizer API', async () => {
    const summarizeStreaming = jest.fn(() =>
      chunks(['- First point', '\n- Second point']),
    );
    const create = jest.fn().mockResolvedValue({
      summarize: jest.fn(),
      summarizeStreaming,
      destroy: jest.fn(),
    });
    setWebApi('Summarizer', {create});
    const received: {
      delta: string;
      accumulated: string;
      isFinal: boolean;
    }[] = [];
    const subscription = ExpoOndeviceAiModule.addListener(
      'onSummarizeStreamChunk',
      (chunk) => received.push(chunk),
    );

    const result = await ExpoOndeviceAiModule.summarizeStreaming('Long input', {
      outputType: 'ONE_BULLET',
    });

    subscription.remove();
    expect(create).toHaveBeenCalledWith({
      type: 'key-points',
      length: 'short',
      format: 'markdown',
    });
    expect(summarizeStreaming).toHaveBeenCalledWith('Long input');
    expect(result).toEqual({
      summary: '- First point\n- Second point',
      originalLength: 10,
      summaryLength: 28,
    });
    expect(received).toEqual([
      {
        delta: '- First point',
        accumulated: '- First point',
        isFinal: false,
      },
      {
        delta: '\n- Second point',
        accumulated: '- First point\n- Second point',
        isFinal: false,
      },
      {
        delta: '',
        accumulated: '- First point\n- Second point',
        isFinal: true,
      },
    ]);
  });

  it('streams translations through the Chrome Translator API', async () => {
    const translateStreaming = jest.fn(() => chunks(['안', '녕']));
    const create = jest.fn().mockResolvedValue({
      translate: jest.fn(),
      translateStreaming,
      destroy: jest.fn(),
    });
    setWebApi('Translator', {create});
    const received: {
      delta: string;
      accumulated: string;
      isFinal: boolean;
    }[] = [];
    const subscription = ExpoOndeviceAiModule.addListener(
      'onTranslateStreamChunk',
      (chunk) => received.push(chunk),
    );

    const result = await ExpoOndeviceAiModule.translateStreaming('Hello', {
      sourceLanguage: 'en',
      targetLanguage: 'ko',
    });

    subscription.remove();
    expect(create).toHaveBeenCalledWith({
      sourceLanguage: 'en',
      targetLanguage: 'ko',
      signal: expect.any(AbortSignal),
    });
    expect(translateStreaming).toHaveBeenCalledWith('Hello');
    expect(result).toEqual({
      translatedText: '안녕',
      sourceLanguage: 'en',
      targetLanguage: 'ko',
    });
    expect(received.at(-1)).toEqual({
      delta: '',
      accumulated: '안녕',
      isFinal: true,
    });
  });

  it('reuses one cached translator for direct and streaming calls', async () => {
    const translate = jest.fn().mockResolvedValue('Bonjour');
    const translateStreaming = jest.fn(() => chunks(['Bon', 'jour']));
    const create = jest.fn().mockResolvedValue({
      translate,
      translateStreaming,
      destroy: jest.fn(),
    });
    setWebApi('Translator', {create});

    await ExpoOndeviceAiModule.translate('Hello', {targetLanguage: 'fr'});
    await ExpoOndeviceAiModule.translateStreaming('Hello again', {
      targetLanguage: 'fr',
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      signal: expect.any(AbortSignal),
    });
    expect(translate).toHaveBeenCalledWith('Hello');
    expect(translateStreaming).toHaveBeenCalledWith('Hello again');
  });

  it('single-flights concurrent translator creation for the same language pair', async () => {
    const translate = jest.fn().mockResolvedValue('Bonjour');
    const translateStreaming = jest.fn(() => chunks(['Bon', 'jour']));
    const translator = {
      translate,
      translateStreaming,
      destroy: jest.fn(),
    };
    let resolveCreation = (_translator: typeof translator) => {};
    const create = jest.fn(
      () =>
        new Promise<typeof translator>((resolve) => {
          resolveCreation = resolve;
        }),
    );
    setWebApi('Translator', {create});

    const directResult = ExpoOndeviceAiModule.translate('Hello', {
      targetLanguage: 'fr',
    });
    const streamResult = ExpoOndeviceAiModule.translateStreaming(
      'Hello again',
      {targetLanguage: 'fr'},
    );

    expect(create).toHaveBeenCalledTimes(1);
    resolveCreation(translator);

    await expect(directResult).resolves.toMatchObject({
      translatedText: 'Bonjour',
    });
    await expect(streamResult).resolves.toMatchObject({
      translatedText: 'Bonjour',
    });
    expect(translate).toHaveBeenCalledWith('Hello');
    expect(translateStreaming).toHaveBeenCalledWith('Hello again');
  });

  it('clears a failed translator single-flight so a later call can retry', async () => {
    const creationError = new Error('Translator creation failed');
    const create = jest
      .fn()
      .mockRejectedValueOnce(creationError)
      .mockResolvedValueOnce({
        translate: jest.fn().mockResolvedValue('Bonjour'),
        destroy: jest.fn(),
      });
    setWebApi('Translator', {create});

    const firstAttempt = ExpoOndeviceAiModule.translate('Hello', {
      targetLanguage: 'fr',
    });
    const sharedAttempt = ExpoOndeviceAiModule.translate('Hello again', {
      targetLanguage: 'fr',
    });

    await expect(Promise.all([firstAttempt, sharedAttempt])).rejects.toBe(
      creationError,
    );
    expect(create).toHaveBeenCalledTimes(1);
    await expect(
      ExpoOndeviceAiModule.translate('Retry', {targetLanguage: 'fr'}),
    ).resolves.toMatchObject({translatedText: 'Bonjour'});
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('keeps the translator cache bounded across concurrent creations', async () => {
    const destroyers: jest.Mock[] = [];
    const create = jest.fn(async () => {
      await Promise.resolve();
      const destroy = jest.fn();
      destroyers.push(destroy);
      return {
        translate: jest.fn().mockResolvedValue('translated'),
        destroy,
      };
    });
    setWebApi('Translator', {create});

    await Promise.all(
      Array.from({length: 11}, (_, index) =>
        ExpoOndeviceAiModule.translate('Hello', {
          sourceLanguage: 'en',
          targetLanguage: `language-${index}`,
        }),
      ),
    );

    expect(create).toHaveBeenCalledTimes(11);
    expect(
      destroyers.reduce(
        (destroyCount, destroy) => destroyCount + destroy.mock.calls.length,
        0,
      ),
    ).toBe(1);
  });

  it('never evicts a translator while its request is active', async () => {
    let resolveFirstTranslation = (_value: string) => {};
    let markFirstTranslationStarted = () => {};
    const firstTranslationStarted = new Promise<void>((resolve) => {
      markFirstTranslationStarted = resolve;
    });
    const destroyers = new Map<string, jest.Mock>();
    const create = jest.fn(
      async (options: {sourceLanguage: string; targetLanguage: string}) => {
        const destroy = jest.fn();
        destroyers.set(options.targetLanguage, destroy);
        return {
          translate: jest.fn(() => {
            if (options.targetLanguage !== 'language-0') {
              return Promise.resolve('translated');
            }

            markFirstTranslationStarted();
            return new Promise<string>((resolve) => {
              resolveFirstTranslation = resolve;
            });
          }),
          destroy,
        };
      },
    );
    setWebApi('Translator', {create});

    const firstRequest = ExpoOndeviceAiModule.translate('Hello', {
      sourceLanguage: 'en',
      targetLanguage: 'language-0',
    });
    await firstTranslationStarted;

    await Promise.all(
      Array.from({length: 10}, (_, index) =>
        ExpoOndeviceAiModule.translate('Hello', {
          sourceLanguage: 'en',
          targetLanguage: `language-${index + 1}`,
        }),
      ),
    );

    expect(destroyers.get('language-0')).not.toHaveBeenCalled();
    resolveFirstTranslation('translated');
    await expect(firstRequest).resolves.toMatchObject({
      translatedText: 'translated',
    });
  });

  it('releases direct and streaming translator leases after failures', async () => {
    const directError = new Error('Direct translation failed');
    const streamError = new Error('Streaming translation failed');
    const destroyers = new Map<string, jest.Mock>();
    const create = jest.fn(
      async (options: {sourceLanguage: string; targetLanguage: string}) => {
        const destroy = jest.fn();
        destroyers.set(options.targetLanguage, destroy);
        return {
          translate: jest.fn(() =>
            options.targetLanguage === 'language-0'
              ? Promise.reject(directError)
              : Promise.resolve('translated'),
          ),
          translateStreaming: jest.fn(() =>
            options.targetLanguage === 'language-1'
              ? chunksThenThrow([], streamError)
              : chunks(['translated']),
          ),
          destroy,
        };
      },
    );
    setWebApi('Translator', {create});

    await expect(
      ExpoOndeviceAiModule.translate('Hello', {
        sourceLanguage: 'en',
        targetLanguage: 'language-0',
      }),
    ).rejects.toBe(directError);
    await expect(
      ExpoOndeviceAiModule.translateStreaming('Hello', {
        sourceLanguage: 'en',
        targetLanguage: 'language-1',
      }),
    ).rejects.toBe(streamError);

    for (let index = 2; index < 12; index += 1) {
      await ExpoOndeviceAiModule.translate('Hello', {
        sourceLanguage: 'en',
        targetLanguage: `language-${index}`,
      });
    }

    expect(destroyers.get('language-0')).toHaveBeenCalledTimes(1);
    expect(destroyers.get('language-1')).toHaveBeenCalledTimes(1);
  });

  it('evicts the least recently used idle translator', async () => {
    const destroyers = new Map<string, jest.Mock>();
    const create = jest.fn(
      async (options: {sourceLanguage: string; targetLanguage: string}) => {
        const destroy = jest.fn();
        destroyers.set(options.targetLanguage, destroy);
        return {
          translate: jest.fn().mockResolvedValue('translated'),
          destroy,
        };
      },
    );
    setWebApi('Translator', {create});

    for (let index = 0; index < 10; index += 1) {
      await ExpoOndeviceAiModule.translate('Hello', {
        sourceLanguage: 'en',
        targetLanguage: `language-${index}`,
      });
    }
    await ExpoOndeviceAiModule.translate('Refresh', {
      sourceLanguage: 'en',
      targetLanguage: 'language-0',
    });
    await ExpoOndeviceAiModule.translate('Overflow', {
      sourceLanguage: 'en',
      targetLanguage: 'language-10',
    });

    expect(destroyers.get('language-0')).not.toHaveBeenCalled();
    expect(destroyers.get('language-1')).toHaveBeenCalledTimes(1);
  });

  it('aborts pending creation without disturbing the next generation', async () => {
    type TestTranslator = {
      translate: jest.Mock<Promise<string>, [string]>;
      destroy: jest.Mock;
    };
    const creations: {
      signal?: AbortSignal;
      resolve: (translator: TestTranslator) => void;
    }[] = [];
    const create = jest.fn(
      (options: {
        sourceLanguage: string;
        targetLanguage: string;
        signal?: AbortSignal;
      }) =>
        new Promise<TestTranslator>((resolve, reject) => {
          creations.push({signal: options.signal, resolve});
          options.signal?.addEventListener(
            'abort',
            () => {
              const abortError = new Error('Translator creation aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            },
            {once: true},
          );
        }),
    );
    setWebApi('Translator', {create});

    const firstRequest = ExpoOndeviceAiModule.translate('Before reset', {
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    });
    expect(creations).toHaveLength(1);
    expect(creations[0]?.signal?.aborted).toBe(false);

    ExpoOndeviceAiModule.destroy();
    expect(creations[0]?.signal?.aborted).toBe(true);

    const secondRequest = ExpoOndeviceAiModule.translate('After reset', {
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    });
    expect(creations).toHaveLength(2);
    expect(creations[1]?.signal?.aborted).toBe(false);
    await expect(firstRequest).rejects.toMatchObject({name: 'AbortError'});

    const sharedSecondRequest = ExpoOndeviceAiModule.translate(
      'After reset again',
      {sourceLanguage: 'en', targetLanguage: 'fr'},
    );
    expect(create).toHaveBeenCalledTimes(2);
    creations[1]?.resolve({
      translate: jest.fn().mockResolvedValue('Bonjour'),
      destroy: jest.fn(),
    });

    await expect(
      Promise.all([secondRequest, sharedSecondRequest]),
    ).resolves.toHaveLength(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('keeps delimiter-containing translator language pairs distinct', async () => {
    const create = jest.fn(
      async (options: {sourceLanguage: string; targetLanguage: string}) => ({
        translate: jest
          .fn()
          .mockResolvedValue(
            `${options.sourceLanguage}:${options.targetLanguage}`,
          ),
        destroy: jest.fn(),
      }),
    );
    setWebApi('Translator', {create});

    const first = await ExpoOndeviceAiModule.translate('Hello', {
      sourceLanguage: 'en-US',
      targetLanguage: 'fr',
    });
    const second = await ExpoOndeviceAiModule.translate('Hello', {
      sourceLanguage: 'en',
      targetLanguage: 'US-fr',
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(first.translatedText).toBe('en-US:fr');
    expect(second.translatedText).toBe('en:US-fr');
  });

  it('does not mistake a delta that starts with prior output for cumulative text', async () => {
    const translateStreaming = jest.fn(() => chunks(['a', 'abc']));
    setWebApi('Translator', {
      create: jest.fn().mockResolvedValue({
        translate: jest.fn(),
        translateStreaming,
        destroy: jest.fn(),
      }),
    });

    const result = await ExpoOndeviceAiModule.translateStreaming('text', {
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    });

    expect(result.translatedText).toBe('aabc');
  });

  it('streams rewrites through the Chrome Rewriter API', async () => {
    const rewriteStreaming = jest.fn(() => chunks(['A', ' better sentence.']));
    const create = jest.fn().mockResolvedValue({
      rewrite: jest.fn(),
      rewriteStreaming,
      destroy: jest.fn(),
    });
    setWebApi('Rewriter', {create});

    const result = await ExpoOndeviceAiModule.rewriteStreaming('Sentence.', {
      outputType: 'PROFESSIONAL',
    });

    expect(create).toHaveBeenCalledWith({
      tone: 'more-formal',
      length: 'as-is',
    });
    expect(rewriteStreaming).toHaveBeenCalledWith('Sentence.');
    expect(result).toEqual({
      rewrittenText: 'A better sentence.',
      style: 'PROFESSIONAL',
    });
  });

  it('shares rewrite option mappings across direct and streaming calls', async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        rewrite: jest.fn().mockResolvedValue('Expanded sentence.'),
        destroy: jest.fn(),
      })
      .mockResolvedValueOnce({
        rewriteStreaming: jest.fn(() => chunks(['Expanded', ' sentence.'])),
        destroy: jest.fn(),
      });
    setWebApi('Rewriter', {create});

    await ExpoOndeviceAiModule.rewrite('Sentence.', {
      outputType: 'ELABORATE',
    });
    await ExpoOndeviceAiModule.rewriteStreaming('Sentence.', {
      outputType: 'ELABORATE',
    });

    expect(create).toHaveBeenNthCalledWith(1, {
      tone: 'as-is',
      length: 'longer',
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      tone: 'as-is',
      length: 'longer',
    });
  });

  it('emits the latest accumulated text before rethrowing stream errors', async () => {
    const streamError = new Error('Chrome stream failed');
    setWebApi('Summarizer', {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn(),
        summarizeStreaming: jest.fn(() =>
          chunksThenThrow(['Partial summary'], streamError),
        ),
        destroy: jest.fn(),
      }),
    });
    const received: {
      delta: string;
      accumulated: string;
      isFinal: boolean;
    }[] = [];
    const subscription = ExpoOndeviceAiModule.addListener(
      'onSummarizeStreamChunk',
      (chunk) => received.push(chunk),
    );

    await expect(
      ExpoOndeviceAiModule.summarizeStreaming('Long input'),
    ).rejects.toBe(streamError);

    subscription.remove();
    expect(received).toEqual([
      {
        delta: 'Partial summary',
        accumulated: 'Partial summary',
        isFinal: false,
      },
      {delta: '', accumulated: 'Partial summary', isFinal: true},
    ]);
  });

  it('emits a terminal event when the stream factory throws synchronously', async () => {
    const streamError = new Error('Chrome stream factory failed');
    setWebApi('Summarizer', {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn(),
        summarizeStreaming: jest.fn(() => {
          throw streamError;
        }),
        destroy: jest.fn(),
      }),
    });
    const received: {
      delta: string;
      accumulated: string;
      isFinal: boolean;
    }[] = [];
    const subscription = ExpoOndeviceAiModule.addListener(
      'onSummarizeStreamChunk',
      (chunk) => received.push(chunk),
    );

    await expect(
      ExpoOndeviceAiModule.summarizeStreaming('Long input'),
    ).rejects.toBe(streamError);

    subscription.remove();
    expect(received).toEqual([{delta: '', accumulated: '', isFinal: true}]);
  });

  it('uses delta semantics for LanguageModel chat streams', async () => {
    const promptStreaming = jest.fn(() => chunks(['a', 'abc']));
    setWebApi('LanguageModel', {
      create: jest.fn().mockResolvedValue({
        prompt: jest.fn(),
        promptStreaming,
        destroy: jest.fn(),
      }),
    });

    const received: {delta: string; accumulated: string; isFinal: boolean}[] =
      [];
    const subscription = ExpoOndeviceAiModule.addListener(
      'onChatStreamChunk',
      (chunk) => received.push(chunk),
    );

    const result = await ExpoOndeviceAiModule.chatStream('Hello');

    subscription.remove();
    expect(result.message).toBe('aabc');
    expect(received).toEqual([
      {delta: 'a', accumulated: 'a', isFinal: false},
      {delta: 'abc', accumulated: 'aabc', isFinal: false},
      {delta: '', accumulated: 'aabc', isFinal: true},
    ]);
  });

  it('rejects unsupported URI-based image input explicitly', async () => {
    await expect(
      ExpoOndeviceAiModule.describeImage('file:///image.png'),
    ).rejects.toThrow('describeImage is not supported on Web');
  });
});
