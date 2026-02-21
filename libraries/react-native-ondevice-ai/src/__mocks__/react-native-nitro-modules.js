const chatStreamListeners = [];
const modelDownloadProgressListeners = [];

const mockHybridObject = {
  initialize: jest.fn().mockResolvedValue(true),
  getDeviceCapability: jest.fn().mockResolvedValue({
    isSupported: true,
    isModelReady: true,
    supportsAppleIntelligence: false,
    platform: 'apple',
    featureSummarize: true,
    featureClassify: true,
    featureExtract: true,
    featureChat: true,
    featureTranslate: true,
    featureRewrite: true,
    featureProofread: true,
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
    classifications: [{label: 'positive', score: 0.9, metadata: ''}],
    topLabel: 'positive',
    topScore: 0.9,
  }),
  extract: jest.fn().mockResolvedValue({
    entities: [
      {type: 'person', value: 'John', confidence: 0.95, startPos: 0, endPos: 4},
    ],
  }),
  chat: jest.fn().mockResolvedValue({
    message: 'Mock response',
    conversationId: '',
    canContinue: true,
  }),
  chatStream: jest.fn().mockImplementation(() => {
    const chunks = [
      {delta: 'Hello', accumulated: 'Hello', isFinal: false},
      {delta: ' world', accumulated: 'Hello world', isFinal: false},
      {delta: '', accumulated: 'Hello world', isFinal: true},
    ];

    Promise.resolve().then(() => {
      chunks.forEach((chunk) => {
        chatStreamListeners.forEach((listener) => listener(chunk));
      });
    });

    return Promise.resolve({
      message: 'Hello world',
      conversationId: '',
      canContinue: true,
    });
  }),
  translate: jest.fn().mockResolvedValue({
    translatedText: 'Mock translation',
    sourceLanguage: 'en',
    targetLanguage: 'ko',
    confidence: 0.9,
  }),
  rewrite: jest.fn().mockResolvedValue({
    rewrittenText: 'Mock rewritten text',
    style: 'PROFESSIONAL',
    confidence: 0.9,
  }),
  proofread: jest.fn().mockResolvedValue({
    correctedText: 'This is a test.',
    corrections: [],
    hasCorrections: false,
  }),
  getAvailableModels: jest.fn().mockResolvedValue([]),
  getDownloadedModels: jest.fn().mockResolvedValue([]),
  getLoadedModel: jest.fn().mockResolvedValue(''),
  getCurrentEngine: jest.fn().mockResolvedValue('foundation_models'),
  downloadModel: jest.fn().mockResolvedValue(true),
  loadModel: jest.fn().mockResolvedValue(undefined),
  deleteModel: jest.fn().mockResolvedValue(undefined),
  getPromptApiStatus: jest.fn().mockResolvedValue('not_available'),
  downloadPromptApiModel: jest.fn().mockResolvedValue(true),
  addChatStreamListener: jest.fn().mockImplementation((listener) => {
    chatStreamListeners.push(listener);
  }),
  removeChatStreamListener: jest.fn().mockImplementation((listener) => {
    const idx = chatStreamListeners.indexOf(listener);
    if (idx >= 0) chatStreamListeners.splice(idx, 1);
  }),
  addModelDownloadProgressListener: jest.fn().mockImplementation((listener) => {
    modelDownloadProgressListeners.push(listener);
  }),
  removeModelDownloadProgressListener: jest
    .fn()
    .mockImplementation((listener) => {
      const idx = modelDownloadProgressListeners.indexOf(listener);
      if (idx >= 0) modelDownloadProgressListeners.splice(idx, 1);
    }),
};

module.exports = {
  NitroModules: {
    createHybridObject: jest.fn(() => mockHybridObject),
  },
  __mockHybridObject: mockHybridObject,
  __chatStreamListeners: chatStreamListeners,
  __modelDownloadProgressListeners: modelDownloadProgressListeners,
};
