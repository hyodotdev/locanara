import {
  initialize,
  getDeviceCapability,
  summarize,
  classify,
  extract,
  chat,
  translate,
  rewrite,
  proofread,
} from '../index';

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
