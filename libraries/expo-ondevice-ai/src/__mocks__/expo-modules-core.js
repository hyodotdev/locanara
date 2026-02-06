const mockModule = {
  initialize: jest.fn().mockResolvedValue({success: true}),
  getDeviceCapability: jest.fn().mockResolvedValue({
    isSupported: true,
    isModelReady: true,
    supportsAppleIntelligence: false,
    platform: 'IOS',
    features: {
      summarize: true,
      classify: true,
      extract: true,
      chat: true,
      translate: true,
      rewrite: true,
      proofread: true,
    },
    availableMemoryMB: 4096,
    isLowPowerMode: false,
  }),
  summarize: jest.fn().mockResolvedValue({
    summary: 'Mock summary',
    originalLength: 100,
    summaryLength: 20,
    confidence: 0.9,
  }),
  classify: jest.fn().mockResolvedValue({
    classifications: [{label: 'positive', score: 0.9}],
    topClassification: {label: 'positive', score: 0.9},
  }),
  extract: jest.fn().mockResolvedValue({
    entities: [{type: 'person', value: 'John', confidence: 0.95}],
  }),
  chat: jest.fn().mockResolvedValue({
    message: 'Mock response',
    canContinue: true,
  }),
  translate: jest.fn().mockResolvedValue({
    translatedText: 'Mock translation',
    sourceLanguage: 'en',
    targetLanguage: 'ko',
    confidence: 0.9,
  }),
  rewrite: jest.fn().mockResolvedValue({
    rewrittenText: 'Mock rewritten text',
    confidence: 0.9,
  }),
  proofread: jest.fn().mockResolvedValue({
    correctedText: 'This is a test.',
    corrections: [],
    hasCorrections: false,
  }),
};

module.exports = {
  requireNativeModule: jest.fn(() => mockModule),
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
};
