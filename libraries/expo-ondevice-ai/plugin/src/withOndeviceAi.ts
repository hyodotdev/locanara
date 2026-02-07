import {
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
  withDangerousMod,
} from 'expo/config-plugins';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const pkg = require('../../package.json');

export interface ExpoOndeviceAiPluginOptions {
  /**
   * Enable local development mode.
   * When true, enables logging (JS + native) and uses local SDK paths.
   * @default false
   */
  enableLocalDev?: boolean;
  /**
   * Local Locanara SDK paths for development.
   * @example
   * localPath: {
   *   ios: '/path/to/locanara/packages/apple',
   *   android: '/path/to/locanara/packages/android',
   * }
   */
  localPath?:
    | string
    | {
        ios?: string;
        android?: string;
      };
}

const logOnce = (() => {
  const logged = new Set<string>();
  return (msg: string) => {
    if (!logged.has(msg)) {
      logged.add(msg);
      console.log(msg);
    }
  };
})();

const withOndeviceAi: ConfigPlugin<ExpoOndeviceAiPluginOptions | void> = (
  config,
  options,
) => {
  const isLocalDev = options?.enableLocalDev ?? !!options?.localPath;

  // Add logging config to iOS Info.plist (enabled in local dev mode)
  config = withInfoPlist(config, (config) => {
    config.modResults.ExpoOndeviceAiEnableLogging = isLocalDev;
    return config;
  });

  if (isLocalDev) {
    if (!options?.localPath) {
      console.warn(
        '[expo-ondevice-ai] enableLocalDev is true but no localPath provided. Skipping local Locanara integration.',
      );
      return config;
    }

    const raw = options.localPath;
    const iosPath =
      typeof raw === 'string' ? raw : raw.ios;
    const androidPath =
      typeof raw === 'string' ? raw : raw.android;

    // iOS: Inject local Locanara pod into Podfile
    if (iosPath) {
      const resolvedIosPath = path.resolve(iosPath);
      logOnce(`🔧 [expo-ondevice-ai] Local iOS SDK: ${resolvedIosPath}`);

      config = withDangerousMod(config, [
        'ios',
        (config) => {
          const podfilePath = path.join(
            config.modRequest.platformProjectRoot,
            'Podfile',
          );
          let podfileContent = fs.readFileSync(podfilePath, 'utf8');

          const localPodLine = `  pod 'Locanara', :path => '${resolvedIosPath}'`;
          if (!podfileContent.includes(localPodLine)) {
            podfileContent = podfileContent.replace(
              'use_expo_modules!',
              `use_expo_modules!\n${localPodLine}`,
            );
            fs.writeFileSync(podfilePath, podfileContent);
          }

          return config;
        },
      ]);
    }

    // Android: Build local SDK AAR and install to mavenLocal.
    // This only runs during local development (LOCAL_LOCANARA_PATHS env set)
    // and is scoped to the 'android' withDangerousMod, so it won't execute during iOS-only prebuild.
    if (androidPath) {
      const resolvedAndroidPath = path.resolve(androidPath);
      logOnce(`🔧 [expo-ondevice-ai] Local Android SDK: ${resolvedAndroidPath}`);

      config = withDangerousMod(config, [
        'android',
        (config) => {
          // Build AAR and install to ~/.m2/repository during Android prebuild only
          try {
            console.log('🔧 [expo-ondevice-ai] Building local Android SDK...');
            execSync(
              './gradlew :locanara:assembleRelease :locanara:generatePomFileForMavenPublication',
              { cwd: resolvedAndroidPath, stdio: 'inherit' },
            );

            const versionsFile = path.resolve(resolvedAndroidPath, '../../locanara-versions.json');
            const version: string = JSON.parse(fs.readFileSync(versionsFile, 'utf8')).android;
            const aarFile = path.join(resolvedAndroidPath, 'locanara/build/outputs/aar/locanara-release.aar');
            const pomFile = path.join(resolvedAndroidPath, 'locanara/build/publications/maven/pom-default.xml');
            const mavenDir = path.join(os.homedir(), `.m2/repository/com/locanara/locanara/${version}`);

            if (fs.existsSync(aarFile) && fs.existsSync(pomFile)) {
              fs.mkdirSync(mavenDir, { recursive: true });
              fs.copyFileSync(aarFile, path.join(mavenDir, `locanara-${version}.aar`));
              fs.copyFileSync(pomFile, path.join(mavenDir, `locanara-${version}.pom`));
              console.log(`✅ [expo-ondevice-ai] Installed com.locanara:locanara:${version} to mavenLocal`);
            }
          } catch (e) {
            console.warn('[expo-ondevice-ai] Failed to build local Android SDK:', e);
          }

          // Add mavenLocal() to repositories
          const buildGradlePath = path.join(
            config.modRequest.platformProjectRoot,
            'build.gradle',
          );
          let content = fs.readFileSync(buildGradlePath, 'utf8');

          if (!content.includes('mavenLocal()')) {
            content = content.replace(
              /allprojects\s*\{\s*\n\s*repositories\s*\{/,
              'allprojects {\n  repositories {\n    mavenLocal()',
            );
            fs.writeFileSync(buildGradlePath, content);
          }

          return config;
        },
      ]);
    }
  } else {
    logOnce('📦 [expo-ondevice-ai] Using Locanara from package manager');
  }

  return config;
};

export default createRunOncePlugin(withOndeviceAi, pkg.name, pkg.version);
