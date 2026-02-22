import type {ConfigContext, ExpoConfig} from '@expo/config';
import * as path from 'path';

const LOCAL_LOCANARA_PATHS = {
  ios: path.resolve(__dirname, '..', '..', '..', 'packages', 'apple'),
  android: path.resolve(__dirname, '..', '..', '..', 'packages', 'android'),
};

export default ({config}: ConfigContext): ExpoConfig => {
  const expoConfig: ExpoConfig = {
    ...config,
    name: 'expo-ondevice-ai-example',
    slug: 'expo-ondevice-ai-example',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'expo-ondevice-ai-example',
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: 'com.locanara.example.expo',
      infoPlist: {
        UIRequiredDeviceCapabilities: [],
        LSMinimumSystemVersion: '14.0',
        LSApplicationQueriesSchemes: ['App-Prefs', 'prefs', 'app-settings'],
      },
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.locanara.example.expo',
    },
    plugins: [
      [
        '../app.plugin.js',
        {
          enableLocalDev: true,
          enableLlamaCpp: !process.env.CI,
          localPath: {
            ios: LOCAL_LOCANARA_PATHS.ios,
            android: LOCAL_LOCANARA_PATHS.android,
          },
        },
      ],
      'expo-font',
      'expo-router',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
          },
          android: {
            minSdkVersion: 31,
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    experiments: {
      ...config.experiments,
      typedRoutes: true,
    },
  };

  return expoConfig;
};
