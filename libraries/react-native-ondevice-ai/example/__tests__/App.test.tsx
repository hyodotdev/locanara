/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-ondevice-ai', () => ({
  initialize: jest.fn().mockResolvedValue({ success: true }),
  getDeviceCapability: jest.fn().mockResolvedValue({
    isSupported: false,
    isModelReady: false,
    platform: 'ANDROID',
    features: {},
  }),
  getAvailableModels: jest.fn().mockResolvedValue([]),
  getDownloadedModels: jest.fn().mockResolvedValue([]),
  getLoadedModel: jest.fn().mockResolvedValue(null),
  getCurrentEngine: jest.fn().mockResolvedValue('none'),
  downloadModel: jest.fn(),
  loadModel: jest.fn(),
  deleteModel: jest.fn(),
  summarize: jest.fn(),
  classify: jest.fn(),
  extract: jest.fn(),
  chat: jest.fn(),
  chatStream: jest.fn(),
  translate: jest.fn(),
  rewrite: jest.fn(),
  proofread: jest.fn(),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
