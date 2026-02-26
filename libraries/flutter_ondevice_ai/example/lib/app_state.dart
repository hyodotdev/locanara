import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

class FeatureInfo {
  final String id;
  final String name;
  final String description;
  final IconName icon;
  final bool isAvailable;
  final bool isComingSoon;

  const FeatureInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    this.isAvailable = false,
    this.isComingSoon = false,
  });
}

enum IconName {
  description,
  label,
  documentScanner,
  chatBubble,
  language,
  edit,
  checkCircle,
  image,
  autoFixHigh,
}

class DeviceInfoDisplay {
  final String platform;
  final String osVersion;
  final bool supportsOnDeviceAI;
  final String provider;

  const DeviceInfoDisplay({
    required this.platform,
    required this.osVersion,
    required this.supportsOnDeviceAI,
    required this.provider,
  });
}

class ModelState {
  final InferenceEngine currentEngine;
  final List<DownloadableModelInfo> availableModels;
  final List<String> downloadedModelIds;
  final String? loadedModelId;
  final ModelDownloadProgress? downloadProgress;
  final bool isDownloading;

  const ModelState({
    this.currentEngine = InferenceEngine.none,
    this.availableModels = const [],
    this.downloadedModelIds = const [],
    this.loadedModelId,
    this.downloadProgress,
    this.isDownloading = false,
  });

  ModelState copyWith({
    InferenceEngine? currentEngine,
    List<DownloadableModelInfo>? availableModels,
    List<String>? downloadedModelIds,
    String? loadedModelId,
    ModelDownloadProgress? downloadProgress,
    bool? isDownloading,
    bool clearLoadedModelId = false,
    bool clearDownloadProgress = false,
  }) {
    return ModelState(
      currentEngine: currentEngine ?? this.currentEngine,
      availableModels: availableModels ?? this.availableModels,
      downloadedModelIds: downloadedModelIds ?? this.downloadedModelIds,
      loadedModelId: clearLoadedModelId ? null : (loadedModelId ?? this.loadedModelId),
      downloadProgress: clearDownloadProgress ? null : (downloadProgress ?? this.downloadProgress),
      isDownloading: isDownloading ?? this.isDownloading,
    );
  }
}

enum SDKState { notInitialized, initializing, initialized, error }

const _featureDefinitions = [
  (id: 'summarize', name: 'Summarize', description: 'Condense long text into concise summaries', icon: IconName.description),
  (id: 'classify', name: 'Classify', description: 'Categorize content into predefined labels', icon: IconName.label),
  (id: 'extract', name: 'Extract', description: 'Extract entities and key information from text', icon: IconName.documentScanner),
  (id: 'chat', name: 'Chat', description: 'Have conversational interactions with AI', icon: IconName.chatBubble),
  (id: 'translate', name: 'Translate', description: 'Translate text between languages', icon: IconName.language),
  (id: 'rewrite', name: 'Rewrite', description: 'Rewrite text in different styles or tones', icon: IconName.edit),
  (id: 'proofread', name: 'Proofread', description: 'Check and correct grammar and spelling', icon: IconName.checkCircle),
  (id: 'describeImage', name: 'Describe Image', description: 'Generate descriptions for images', icon: IconName.image),
  (id: 'generateImage', name: 'Generate Image', description: 'Generate images from text prompts', icon: IconName.autoFixHigh),
];

const _comingSoonFeatures = {'describeImage', 'generateImage'};

class AppState extends ChangeNotifier {
  final _ai = FlutterOndeviceAi.instance;

  AppState() {
    initializeSDK();
  }

  SDKState _sdkState = SDKState.notInitialized;
  String? _errorMessage;
  DeviceInfoDisplay? _deviceInfo;
  DeviceCapability? _capability;
  List<FeatureInfo> _availableFeatures = [];
  bool _isModelReady = false;
  ModelState _modelState = const ModelState();

  SDKState get sdkState => _sdkState;
  String? get errorMessage => _errorMessage;
  DeviceInfoDisplay? get deviceInfo => _deviceInfo;
  DeviceCapability? get capability => _capability;
  List<FeatureInfo> get availableFeatures => _availableFeatures;
  bool get isModelReady => _isModelReady;
  ModelState get modelState => _modelState;

  Future<void> initializeSDK() async {
    if (_sdkState == SDKState.initializing || _sdkState == SDKState.initialized) {
      return;
    }

    _sdkState = SDKState.initializing;
    _errorMessage = null;
    notifyListeners();

    try {
      await _ai.initialize().timeout(
        const Duration(seconds: 35),
        onTimeout: () => throw TimeoutException('SDK initialization timed out'),
      );
      final cap = await _ai.getDeviceCapability().timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('Device capability check timed out'),
      );
      _capability = cap;
      _isModelReady = cap.isModelReady || cap.isSupported;

      final isIOS = !kIsWeb && Platform.isIOS;
      _deviceInfo = DeviceInfoDisplay(
        platform: kIsWeb ? 'Web' : (isIOS ? 'iOS' : 'Android'),
        osVersion: kIsWeb ? 'Chrome' : Platform.operatingSystemVersion,
        supportsOnDeviceAI: cap.isSupported,
        provider: cap.platform == OndeviceAiPlatform.ios
            ? 'Apple Intelligence'
            : cap.platform == OndeviceAiPlatform.android
                ? 'Gemini Nano'
                : 'Chrome Built-in AI',
      );

      final modelReady = cap.isModelReady || cap.isSupported;
      _availableFeatures = _featureDefinitions.map((def) {
        final isComingSoon = _comingSoonFeatures.contains(def.id);
        final featureMap = cap.features;
        final isFeatureAvailable = featureMap[def.id] ?? false;
        return FeatureInfo(
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          isAvailable: isComingSoon ? false : modelReady && isFeatureAvailable,
          isComingSoon: isComingSoon,
        );
      }).toList();

      _sdkState = SDKState.initialized;
      notifyListeners();

      // Load model info after initialization
      try {
        final results = await Future.wait([
          _ai.getAvailableModels(),
          _ai.getDownloadedModels(),
          _ai.getLoadedModel(),
          _ai.getCurrentEngine(),
        ]);
        _modelState = _modelState.copyWith(
          availableModels: results[0] as List<DownloadableModelInfo>,
          downloadedModelIds: results[1] as List<String>,
          loadedModelId: results[2] as String?,
          currentEngine: results[3] as InferenceEngine,
          clearLoadedModelId: results[2] == null,
        );
        notifyListeners();
      } catch (_) {
        // Model management may not be available on all devices
      }
    } catch (e) {
      debugPrint('[AppState] ERROR: $e');
      _sdkState = SDKState.error;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> refreshModels() async {
    debugPrint('[AppState] refreshModels()');
    try {
      final results = await Future.wait([
        _ai.getAvailableModels(),
        _ai.getDownloadedModels(),
        _ai.getLoadedModel(),
        _ai.getCurrentEngine(),
      ]);
      _modelState = _modelState.copyWith(
        availableModels: results[0] as List<DownloadableModelInfo>,
        downloadedModelIds: results[1] as List<String>,
        loadedModelId: results[2] as String?,
        currentEngine: results[3] as InferenceEngine,
        clearLoadedModelId: results[2] == null,
      );
      debugPrint('[AppState] refreshModels() done — engine=${_modelState.currentEngine}, loaded=${_modelState.loadedModelId}, downloaded=${_modelState.downloadedModelIds}');
      notifyListeners();
    } catch (e, st) {
      debugPrint('[AppState] refreshModels() ERROR: $e\n$st');
    }
  }

  Future<void> downloadModelById(String modelId) async {
    debugPrint('[AppState] downloadModel($modelId) starting...');
    _modelState = _modelState.copyWith(isDownloading: true, clearDownloadProgress: true);
    notifyListeners();
    try {
      await _ai.downloadModel(modelId, onProgress: (progress) {
        debugPrint('[AppState] downloadModel($modelId) progress: ${(progress.progress * 100).round()}%');
        _modelState = _modelState.copyWith(downloadProgress: progress);
        notifyListeners();
      });
      debugPrint('[AppState] downloadModel($modelId) completed');
      await refreshModels();
    } catch (e, st) {
      debugPrint('[AppState] downloadModel($modelId) ERROR: $e\n$st');
      rethrow;
    } finally {
      _modelState = _modelState.copyWith(isDownloading: false, clearDownloadProgress: true);
      notifyListeners();
    }
  }

  Future<void> loadModelById(String modelId) async {
    debugPrint('[AppState] loadModel($modelId) starting...');
    try {
      await _ai.loadModel(modelId);
      debugPrint('[AppState] loadModel($modelId) success');
      await refreshModels();
    } catch (e, st) {
      debugPrint('[AppState] loadModel($modelId) ERROR: $e\n$st');
      rethrow;
    }
  }

  Future<void> deleteModelById(String modelId) async {
    debugPrint('[AppState] deleteModel($modelId) starting...');
    try {
      await _ai.deleteModel(modelId);
      debugPrint('[AppState] deleteModel($modelId) success');
      await refreshModels();
    } catch (e, st) {
      debugPrint('[AppState] deleteModel($modelId) ERROR: $e\n$st');
      rethrow;
    }
  }

  Future<void> switchToDeviceAI() async {
    debugPrint('[AppState] switchToDeviceAI() starting...');
    try {
      await _ai.switchToDeviceAI();
      debugPrint('[AppState] switchToDeviceAI() success');
      await refreshModels();
    } catch (e, st) {
      debugPrint('[AppState] switchToDeviceAI() ERROR: $e\n$st');
      rethrow;
    }
  }
}
