import ExpoOndeviceAiModule from '../ExpoOndeviceAiModule.web';

async function* chunks(values: string[]): AsyncGenerator<string> {
  for (const value of values) {
    yield value;
  }
}

function setWebApi(name: string, value: unknown): void {
  (globalThis as Record<string, unknown>)[name] = value;
}

describe('ExpoOndeviceAiModule.web', () => {
  afterEach(() => {
    ExpoOndeviceAiModule.destroy();
    for (const api of ['Summarizer', 'Translator', 'Rewriter']) {
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
      chunks(['- First point', '- First point\n- Second point']),
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

  it('streams rewrites through the Chrome Rewriter API', async () => {
    const rewriteStreaming = jest.fn(() =>
      chunks(['A', 'A better sentence.']),
    );
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

  it('rejects unsupported URI-based image input explicitly', async () => {
    await expect(
      ExpoOndeviceAiModule.describeImage('file:///image.png'),
    ).rejects.toThrow('describeImage is not supported on Web');
  });
});
