import {
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
} from 'expo/config-plugins';
import {execSync} from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const pkg = require('../../package.json');

const LOCALLLMCLIENT_REPO = 'https://github.com/tattn/LocalLLMClient.git';

export interface ExpoOndeviceAiPluginOptions {
  /**
   * Enable local development mode.
   * When true, enables logging (JS + native) and uses local SDK paths.
   * @default false
   */
  enableLocalDev?: boolean;
  /**
   * Enable llama.cpp engine via an isolated bridge pod with C++ interop.
   * The bridge pod is compiled with C++ interop in isolation from React Native,
   * avoiding the fundamental incompatibility between C++ interop and RN headers.
   * @default true when enableLocalDev is true
   */
  enableLlamaCpp?: boolean;
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

/**
 * Adds LocalLLMClient SPM package reference to the main Xcode project.
 * This ensures workspace-level SPM package resolution — xcodebuild only
 * resolves SPM packages from the project that owns the build scheme.
 *
 * NOTE: Product dependencies are NOT added to the main app target.
 * Only the bridge pod target gets the product dependencies (via Podfile post_install).
 */
function addSPMPackageToMainProject(project: any): void {
  if (!project.hash.project.objects['XCRemoteSwiftPackageReference']) {
    project.hash.project.objects['XCRemoteSwiftPackageReference'] = {};
  }

  const refs = project.hash.project.objects['XCRemoteSwiftPackageReference'];
  const alreadyAdded = Object.keys(refs).some(
    (key: string) =>
      !key.endsWith('_comment') &&
      refs[key]?.repositoryURL === LOCALLLMCLIENT_REPO,
  );
  if (alreadyAdded) {
    logOnce('[expo-ondevice-ai] LocalLLMClient SPM already in main project');
    return;
  }

  const pkgRefUuid = project.generateUuid();
  refs[pkgRefUuid] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: LOCALLLMCLIENT_REPO,
    requirement: {
      kind: 'branch',
      branch: 'main',
    },
  };
  refs[`${pkgRefUuid}_comment`] =
    'XCRemoteSwiftPackageReference "LocalLLMClient"';

  const projectSection = project.pbxProjectSection();
  const projectUuid = Object.keys(projectSection).find(
    (k: string) =>
      !k.endsWith('_comment') && projectSection[k]?.isa === 'PBXProject',
  );
  if (!projectUuid) {
    console.warn('[expo-ondevice-ai] Could not find PBXProject');
    return;
  }

  const projectObj = projectSection[projectUuid];
  if (!projectObj.packageReferences) {
    projectObj.packageReferences = [];
  }
  projectObj.packageReferences.push({
    value: pkgRefUuid,
    comment: 'XCRemoteSwiftPackageReference "LocalLLMClient"',
  });

  logOnce(
    '[expo-ondevice-ai] LocalLLMClient SPM added to main project for workspace resolution',
  );
}

/**
 * Adds a "Copy Frameworks" build phase to embed llama.framework into the app bundle.
 * llama.framework is a dynamic framework built by SPM (from LocalLLMClient).
 * Without embedding, the app crashes on launch with dyld "image not found".
 */
function addEmbedLlamaFrameworkPhase(project: any): void {
  const appTarget = project.getFirstTarget();
  if (!appTarget?.firstTarget) {
    console.warn('[expo-ondevice-ai] Could not find app target for embed phase');
    return;
  }

  const target = appTarget.firstTarget;

  // Check if we already added this phase
  const existingPhases = target.buildPhases || [];
  for (const phase of existingPhases) {
    if (phase.comment === 'Embed llama.framework') {
      logOnce('[expo-ondevice-ai] Embed llama.framework phase already exists');
      return;
    }
  }

  // Add a shell script build phase to copy llama.framework into Frameworks/
  const buildPhase = project.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    'Embed llama.framework',
    target.uuid,
    {
      shellPath: '/bin/sh',
      shellScript:
        'LLAMA_FW=""\n' +
        'if [ -d "${BUILT_PRODUCTS_DIR}/PackageFrameworks/llama.framework" ]; then\n' +
        '  LLAMA_FW="${BUILT_PRODUCTS_DIR}/PackageFrameworks/llama.framework"\n' +
        'elif [ -d "${BUILT_PRODUCTS_DIR}/llama.framework" ]; then\n' +
        '  LLAMA_FW="${BUILT_PRODUCTS_DIR}/llama.framework"\n' +
        'fi\n' +
        'if [ -n "$LLAMA_FW" ]; then\n' +
        '  mkdir -p "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}"\n' +
        '  cp -R "$LLAMA_FW" "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/"\n' +
        '  if [ -n "${EXPANDED_CODE_SIGN_IDENTITY}" ]; then\n' +
        '    codesign --force --sign "${EXPANDED_CODE_SIGN_IDENTITY}" --preserve-metadata=identifier,entitlements "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/llama.framework"\n' +
        '  fi\n' +
        'fi\n',
    },
  );

  if (buildPhase) {
    logOnce('[expo-ondevice-ai] Added embed llama.framework build phase');
  }
}

/**
 * Bridge podspec for LocanaraLlamaBridge.
 * This pod is compiled with C++ interop in isolation — it does NOT import
 * React Native or ExpoModulesCore, so no C++ interop propagation occurs.
 */
const BRIDGE_PODSPEC = `Pod::Spec.new do |s|
  s.name         = "LocanaraLlamaBridge"
  s.version      = "1.0.0"
  s.summary      = "llama.cpp bridge with isolated C++ interop"
  s.homepage     = "https://github.com/hyodotdev/locanara"
  s.license      = "MIT"
  s.author       = "Locanara"
  s.platform     = :ios, "15.1"
  s.source       = { :path => "." }
  s.source_files = "Sources/**/*.swift"
  s.dependency   "Locanara"
  s.swift_version = "5.0"
  s.pod_target_xcconfig = {
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
    'IPHONEOS_DEPLOYMENT_TARGET' => '17.0',
  }
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -framework "llama"',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
  }
end
`;

/**
 * Swift source for the bridge engine.
 * Implements LlamaCppBridgeProvider (discovered by Locanara SDK via NSClassFromString)
 * and InferenceEngine (registered with InferenceRouter for inference routing).
 */
const BRIDGE_SWIFT_SOURCE = `// Auto-generated by expo-ondevice-ai config plugin
// This file is compiled with C++ interop enabled, isolated from React Native headers.

import Foundation
import Locanara
import LocalLLMClient
import LocalLLMClientLlama
import os.log
#if os(iOS)
import UIKit
#endif

private let logger = Logger(subsystem: "com.locanara.bridge", category: "LlamaCppBridge")

// MARK: - Bridge Engine (InferenceEngine conformance)

@available(iOS 17.0, *)
final class BridgedLlamaCppEngine: @unchecked Sendable, InferenceEngine, LlamaCppEngineProtocol {

    static var engineType: InferenceEngineType { .llamaCpp }
    var engineName: String { "On-Device LLM (llama.cpp via bridge)" }
    private(set) var isLoaded: Bool = false
    var isMultimodal: Bool { mmprojPath != nil }

    private var llmSession: LLMSession?
    private let modelPath: URL
    private let mmprojPath: URL?
    private var isCancelled = false
    private var isInferencing = false
    private let lock = NSLock()

    init(modelPath: URL, mmprojPath: URL?) {
        self.modelPath = modelPath
        self.mmprojPath = mmprojPath
    }

    func loadModel() async throws {
        guard !isLoaded else { return }

        guard FileManager.default.fileExists(atPath: modelPath.path) else {
            throw LocanaraError.modelNotDownloaded(modelPath.lastPathComponent)
        }

        let fileSize = (try? FileManager.default.attributesOfItem(atPath: modelPath.path)[.size] as? Int64) ?? 0
        guard fileSize >= 10_000_000 else {
            throw LocanaraError.modelLoadFailed("Invalid model file: too small")
        }

        let numThreads = max(4, ProcessInfo.processInfo.activeProcessorCount - 2)
        let llamaParam = LlamaClient.Parameter(
            context: 8192,
            seed: nil,
            numberOfThreads: numThreads,
            batch: 512,
            temperature: 0.5,
            topK: 40,
            topP: 0.9,
            typicalP: 1.0,
            penaltyLastN: 64,
            penaltyRepeat: 1.2,
            options: LlamaClient.Options(
                extraEOSTokens: ["</s>", "<end_of_turn>"],
                verbose: false
            )
        )

        let localModel = LLMSession.LocalModel.llama(
            url: modelPath,
            mmprojURL: mmprojPath,
            parameter: llamaParam
        )
        llmSession = LLMSession(model: localModel)
        try await llmSession?.prewarm()
        isLoaded = true
        logger.info("Bridge engine loaded model: \\(self.modelPath.lastPathComponent)")
    }

    func generate(prompt: String, config: InferenceConfig) async throws -> String {
        while lock.withLock({ isInferencing }) {
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        lock.withLock { isInferencing = true; isCancelled = false }
        defer { lock.withLock { isInferencing = false } }

        guard isLoaded, let session = llmSession else {
            throw LocanaraError.custom(.modelNotLoaded, "Model not loaded")
        }

        do {
            var result = try await session.respond(to: prompt)

            if let stops = config.stopSequences {
                for stop in stops {
                    if let range = result.range(of: stop) {
                        result = String(result[..<range.lowerBound])
                        break
                    }
                }
            }

            let maxChars = config.maxTokens * 4
            if result.count > maxChars {
                let truncated = String(result.prefix(maxChars))
                if let period = truncated.lastIndex(of: ".") {
                    result = String(truncated[...period])
                } else {
                    result = truncated
                }
            }

            return result.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            if error.localizedDescription.contains("nil") || error.localizedDescription.contains("fatal") {
                lock.withLock { isLoaded = false; llmSession = nil }
            }
            throw LocanaraError.executionFailed(error.localizedDescription)
        }
    }

    func generateStreaming(prompt: String, config: InferenceConfig) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task { [weak self] in
                guard let self, self.isLoaded, let session = self.llmSession else {
                    continuation.finish(throwing: LocanaraError.custom(.modelNotLoaded, "Model not loaded"))
                    return
                }
                do {
                    for try await text in session.streamResponse(to: prompt) {
                        if self.lock.withLock({ self.isCancelled }) { break }
                        continuation.yield(text)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: LocanaraError.executionFailed(error.localizedDescription))
                }
            }
        }
    }

    func generateWithImage(prompt: String, imageData: Data, config: InferenceConfig) async throws -> String {
        guard isMultimodal else {
            throw LocanaraError.custom(.featureNotSupported, "mmproj file required for image input")
        }
        guard isLoaded, let session = llmSession else {
            throw LocanaraError.custom(.modelNotLoaded, "Model not loaded")
        }

        #if os(iOS)
        guard let image = UIImage(data: imageData) else {
            throw LocanaraError.custom(.invalidInput, "Failed to create image from data")
        }
        let attachment = LLMAttachment.image(image)
        let response = try await session.respond(to: prompt, attachments: [attachment])
        return response.trimmingCharacters(in: .whitespacesAndNewlines)
        #else
        throw LocanaraError.custom(.featureNotSupported, "Image input not supported on this platform")
        #endif
    }

    func cancel() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if !isCancelled { isCancelled = true; return true }
        return false
    }

    func unload() {
        llmSession = nil
        isLoaded = false
        logger.info("Bridge engine unloaded")
    }
}

// MARK: - Bridge Provider (@objc discoverable by Locanara SDK)

@objc
@available(iOS 17.0, *)
public class LlamaCppBridgeEngine: NSObject, LlamaCppBridgeProvider {

    private var engine: BridgedLlamaCppEngine?

    public var isModelLoaded: Bool {
        engine?.isLoaded ?? false
    }

    public func loadAndRegisterModel(_ modelPath: String, mmprojPath: String?, completion: @escaping (NSError?) -> Void) {
        Task {
            do {
                let modelURL = URL(fileURLWithPath: modelPath)
                let mmprojURL = mmprojPath.map { URL(fileURLWithPath: $0) }

                let newEngine = BridgedLlamaCppEngine(modelPath: modelURL, mmprojPath: mmprojURL)
                try await newEngine.loadModel()

                self.engine = newEngine
                InferenceRouter.shared.registerEngine(newEngine as any InferenceEngine)

                logger.info("Bridge: model loaded and engine registered")
                completion(nil)
            } catch {
                logger.error("Bridge: loadModel failed: \\(error.localizedDescription)")
                completion(error as NSError)
            }
        }
    }

    public func unloadModel() {
        engine?.unload()
        InferenceRouter.shared.unregisterEngine()
        engine = nil
        logger.info("Bridge: model unloaded and engine unregistered")
    }
}
`;

/**
 * Podfile helper for configuring the bridge pod with C++ interop and SPM deps.
 * Only the LocanaraLlamaBridge target gets C++ interop — NOT Locanara, ExpoOndeviceAi,
 * or any other target. This prevents C++ interop from propagating to React Native.
 */
const BRIDGE_PODFILE_HELPER = `
# LocanaraLlamaBridge: Isolated C++ interop for llama.cpp (auto-generated by expo-ondevice-ai)
def configure_llama_bridge(installer)
  begin
    pods_project = installer.pods_project

    # Add SPM package reference for LocalLLMClient
    pkg_ref = pods_project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
    pkg_ref.repositoryURL = 'https://github.com/tattn/LocalLLMClient.git'
    pkg_ref.requirement = { 'kind' => 'branch', 'branch' => 'main' }
    pods_project.root_object.package_references << pkg_ref

    # Find the bridge target (ONLY this target gets C++ interop)
    bridge_target = pods_project.targets.find { |t| t.name == 'LocanaraLlamaBridge' }
    unless bridge_target
      puts "\\u26a0\\ufe0f [expo-ondevice-ai] LocanaraLlamaBridge target not found"
      return
    end

    # Add SPM product dependencies to the bridge target
    ['LocalLLMClient', 'LocalLLMClientLlama'].each do |product_name|
      dep = pods_project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
      dep.product_name = product_name
      dep.package = pkg_ref
      bridge_target.package_product_dependencies << dep
    end

    # Enable C++ interop and add SPM module search paths ONLY on the bridge target
    bridge_target.build_configurations.each do |bc|
      swift_flags = bc.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
      unless swift_flags.include?('-cxx-interoperability-mode')
        bc.build_settings['OTHER_SWIFT_FLAGS'] = "#{swift_flags} -cxx-interoperability-mode=default -Xcc -std=c++20"
      end
      bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
    end

    puts "\\u2705 [expo-ondevice-ai] LocanaraLlamaBridge configured with C++ interop (isolated from React Native)"
  rescue => e
    puts "\\u26a0\\ufe0f [expo-ondevice-ai] Bridge configuration failed: #{e.message}"
    puts e.backtrace&.first(3)&.join("\\n")
  end
end
`;

const withOndeviceAi: ConfigPlugin<ExpoOndeviceAiPluginOptions | void> = (
  config,
  options,
) => {
  const isLocalDev = options?.enableLocalDev ?? !!options?.localPath;
  const enableLlamaCpp = options?.enableLlamaCpp ?? isLocalDev;

  // Add logging config to iOS Info.plist (enabled in local dev mode)
  config = withInfoPlist(config, (config) => {
    config.modResults.ExpoOndeviceAiEnableLogging = isLocalDev;
    return config;
  });

  // Add LocalLLMClient SPM package reference + embed llama.framework
  if (enableLlamaCpp) {
    config = withXcodeProject(config, (config) => {
      addSPMPackageToMainProject(config.modResults);
      addEmbedLlamaFrameworkPhase(config.modResults);
      return config;
    });
  }

  if (isLocalDev) {
    if (!options?.localPath) {
      console.warn(
        '[expo-ondevice-ai] enableLocalDev is true but no localPath provided. Skipping local Locanara integration.',
      );
      return config;
    }

    const raw = options.localPath;
    const iosPath = typeof raw === 'string' ? raw : raw.ios;
    const androidPath = typeof raw === 'string' ? raw : raw.android;

    // iOS: Inject local Locanara pod + optional llama.cpp bridge
    if (iosPath) {
      const resolvedIosPath = path.resolve(iosPath);
      logOnce(`[expo-ondevice-ai] Local iOS SDK: ${resolvedIosPath}`);

      config = withDangerousMod(config, [
        'ios',
        (config) => {
          const iosDir = config.modRequest.platformProjectRoot;
          const podfilePath = path.join(iosDir, 'Podfile');
          let podfileContent = fs.readFileSync(podfilePath, 'utf8');

          // 1. Inject local Locanara pod
          const localPodLine = `  pod 'Locanara', :path => '${resolvedIosPath}'`;
          if (!podfileContent.includes(localPodLine)) {
            podfileContent = podfileContent.replace(
              'use_expo_modules!',
              `use_expo_modules!\n${localPodLine}`,
            );
          }

          // 2. Create bridge pod for llama.cpp (isolated C++ interop)
          if (enableLlamaCpp) {
            const bridgeDir = path.join(iosDir, 'LocanaraLlamaBridge');
            const bridgeSrcDir = path.join(bridgeDir, 'Sources');

            fs.mkdirSync(bridgeSrcDir, {recursive: true});
            fs.writeFileSync(
              path.join(bridgeDir, 'LocanaraLlamaBridge.podspec'),
              BRIDGE_PODSPEC,
            );
            fs.writeFileSync(
              path.join(bridgeSrcDir, 'LlamaCppBridgeEngine.swift'),
              BRIDGE_SWIFT_SOURCE,
            );

            // Add bridge pod to Podfile
            const bridgePodLine = `  pod 'LocanaraLlamaBridge', :path => 'LocanaraLlamaBridge'`;
            if (!podfileContent.includes(bridgePodLine)) {
              podfileContent = podfileContent.replace(
                localPodLine,
                `${localPodLine}\n${bridgePodLine}`,
              );
            }

            // Add bridge configuration helper
            if (!podfileContent.includes('configure_llama_bridge')) {
              podfileContent = podfileContent.replace(
                /^(target\s)/m,
                `${BRIDGE_PODFILE_HELPER}\n$1`,
              );

              podfileContent = podfileContent.replace(
                'post_install do |installer|',
                'post_install do |installer|\n    configure_llama_bridge(installer)',
              );
            }

            logOnce(
              '[expo-ondevice-ai] LocanaraLlamaBridge pod created for isolated C++ interop',
            );
          }

          fs.writeFileSync(podfilePath, podfileContent);
          return config;
        },
      ]);
    }

    // Android: Build local SDK AAR and install to mavenLocal.
    if (androidPath) {
      const resolvedAndroidPath = path.resolve(androidPath);
      logOnce(
        `[expo-ondevice-ai] Local Android SDK: ${resolvedAndroidPath}`,
      );

      config = withDangerousMod(config, [
        'android',
        (config) => {
          try {
            console.log('[expo-ondevice-ai] Building local Android SDK...');
            execSync(
              './gradlew :locanara:assembleRelease :locanara:generatePomFileForMavenPublication',
              {cwd: resolvedAndroidPath, stdio: 'inherit'},
            );

            const versionsFile = path.resolve(
              resolvedAndroidPath,
              '../../locanara-versions.json',
            );
            const version: string = JSON.parse(
              fs.readFileSync(versionsFile, 'utf8'),
            ).android;
            const aarFile = path.join(
              resolvedAndroidPath,
              'locanara/build/outputs/aar/locanara-release.aar',
            );
            const pomFile = path.join(
              resolvedAndroidPath,
              'locanara/build/publications/maven/pom-default.xml',
            );
            const mavenDir = path.join(
              os.homedir(),
              `.m2/repository/com/locanara/locanara/${version}`,
            );

            if (fs.existsSync(aarFile) && fs.existsSync(pomFile)) {
              fs.mkdirSync(mavenDir, {recursive: true});
              fs.copyFileSync(
                aarFile,
                path.join(mavenDir, `locanara-${version}.aar`),
              );
              fs.copyFileSync(
                pomFile,
                path.join(mavenDir, `locanara-${version}.pom`),
              );
              console.log(
                `[expo-ondevice-ai] Installed com.locanara:locanara:${version} to mavenLocal`,
              );
            }
          } catch (e) {
            console.warn(
              '[expo-ondevice-ai] Failed to build local Android SDK:',
              e,
            );
          }

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
    logOnce('[expo-ondevice-ai] Using Locanara from package manager');
  }

  return config;
};

export default createRunOncePlugin(withOndeviceAi, pkg.name, pkg.version);
