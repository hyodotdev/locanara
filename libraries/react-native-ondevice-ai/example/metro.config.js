const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const libraryRoot = path.resolve(__dirname, '..');

const config = {
  watchFolders: [libraryRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(libraryRoot, 'node_modules'),
    ],
    blockList: [
      new RegExp(
        path
          .resolve(libraryRoot, 'node_modules', 'react', '.*')
          .replace(/[/\\]/g, '[/\\\\]'),
      ),
      new RegExp(
        path
          .resolve(libraryRoot, 'node_modules', 'react-native', '.*')
          .replace(/[/\\]/g, '[/\\\\]'),
      ),
      /.*\/__tests__\/.*/,
      /.*\.test\.(js|jsx|ts|tsx)$/,
      /.*\.spec\.(js|jsx|ts|tsx)$/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
