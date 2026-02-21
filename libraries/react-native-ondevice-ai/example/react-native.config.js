const path = require('path');
const pkg = require('../package.json');
const libraryRoot = path.join(__dirname, '..');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: libraryRoot,
      platforms: {
        ios: {},
        android: {
          sourceDir: path.join(libraryRoot, 'android'),
        },
      },
    },
  },
};
