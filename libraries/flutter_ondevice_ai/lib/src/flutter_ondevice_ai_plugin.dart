import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

import 'types.dart';
import 'errors.dart';

class FlutterOndeviceAi {
  static FlutterOndeviceAi? _instance;

  static FlutterOndeviceAi get instance {
    _instance ??= FlutterOndeviceAi._();
    return _instance!;
  }

  final MethodChannel _channel = const MethodChannel('flutter_ondevice_ai');
  final EventChannel _chatStreamChannel = const EventChannel(
    'flutter_ondevice_ai/chat_stream',
  );
  final EventChannel _downloadProgressChannel = const EventChannel(
    'flutter_ondevice_ai/model_download_progress',
  );

  FlutterOndeviceAi._();

  @visibleForTesting
  FlutterOndeviceAi.forTesting();

  // ============================================================================
  // Core API
  // ============================================================================

  Future<InitializeResult> initialize() async {
    try {
      final result = await _channel.invokeMethod<Map>('initialize');
      return InitializeResult.fromJson(Map<String, dynamic>.from(result ?? {}));
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<DeviceCapability> getDeviceCapability() async {
    try {
      final result = await _channel.invokeMethod<Map>('getDeviceCapability');
      return DeviceCapability.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  // ============================================================================
  // AI Features
  // ============================================================================

  Future<SummarizeResult> summarize(
    String text, {
    SummarizeOptions? options,
  }) async {
    try {
      final args = <String, dynamic>{'text': text};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('summarize', args);
      return SummarizeResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<ClassifyResult> classify(
    String text, {
    ClassifyOptions? options,
  }) async {
    try {
      final args = <String, dynamic>{'text': text};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('classify', args);
      return ClassifyResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<ExtractResult> extract(
    String text, {
    ExtractOptions? options,
  }) async {
    try {
      final args = <String, dynamic>{'text': text};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('extract', args);
      return ExtractResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<ChatResult> chat(
    String message, {
    ChatOptions? options,
  }) async {
    try {
      final args = <String, dynamic>{'message': message};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('chat', args);
      return ChatResult.fromJson(Map<String, dynamic>.from(result ?? {}));
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<ChatResult> chatStream(
    String message, {
    ChatStreamOptions? options,
  }) async {
    StreamSubscription? subscription;
    try {
      if (options?.onChunk != null) {
        subscription = _chatStreamChannel
            .receiveBroadcastStream()
            .listen((event) {
              final chunk = ChatStreamChunk.fromJson(
                Map<String, dynamic>.from(event as Map),
              );
              options!.onChunk!(chunk);
            });
      }

      final args = <String, dynamic>{'message': message};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('chatStream', args);
      return ChatResult.fromJson(Map<String, dynamic>.from(result ?? {}));
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    } finally {
      await subscription?.cancel();
    }
  }

  Future<TranslateResult> translate(
    String text, {
    required TranslateOptions options,
  }) async {
    try {
      final args = <String, dynamic>{
        'text': text,
        'options': options.toJson(),
      };
      final result = await _channel.invokeMethod<Map>('translate', args);
      return TranslateResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<RewriteResult> rewrite(
    String text, {
    required RewriteOptions options,
  }) async {
    try {
      final args = <String, dynamic>{
        'text': text,
        'options': options.toJson(),
      };
      final result = await _channel.invokeMethod<Map>('rewrite', args);
      return RewriteResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<ProofreadResult> proofread(
    String text, {
    ProofreadOptions? options,
  }) async {
    try {
      final args = <String, dynamic>{'text': text};
      if (options != null) args['options'] = options.toJson();
      final result = await _channel.invokeMethod<Map>('proofread', args);
      return ProofreadResult.fromJson(
        Map<String, dynamic>.from(result ?? {}),
      );
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  // ============================================================================
  // Model Management
  // ============================================================================

  Future<List<DownloadableModelInfo>> getAvailableModels() async {
    try {
      final result = await _channel.invokeMethod<List>('getAvailableModels');
      return (result ?? [])
          .map(
            (m) =>
                DownloadableModelInfo.fromJson(
                  Map<String, dynamic>.from(m as Map),
                ),
          )
          .toList();
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<List<String>> getDownloadedModels() async {
    try {
      final result = await _channel.invokeMethod<List>('getDownloadedModels');
      return (result ?? []).map((id) => id.toString()).toList();
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<String?> getLoadedModel() async {
    try {
      return await _channel.invokeMethod<String?>('getLoadedModel');
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<InferenceEngine> getCurrentEngine() async {
    try {
      final result = await _channel.invokeMethod<String>('getCurrentEngine');
      return InferenceEngine.fromJson(result ?? 'none');
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<bool> downloadModel(
    String modelId, {
    void Function(ModelDownloadProgress)? onProgress,
  }) async {
    StreamSubscription? subscription;
    try {
      if (onProgress != null) {
        subscription = _downloadProgressChannel
            .receiveBroadcastStream()
            .listen((event) {
              final progress = ModelDownloadProgress.fromJson(
                Map<String, dynamic>.from(event as Map),
              );
              onProgress(progress);
            });
      }

      final result = await _channel.invokeMethod<bool>(
        'downloadModel',
        {'modelId': modelId},
      );
      return result ?? false;
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    } finally {
      await subscription?.cancel();
    }
  }

  Future<void> loadModel(String modelId) async {
    try {
      await _channel.invokeMethod<void>('loadModel', {'modelId': modelId});
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<void> deleteModel(String modelId) async {
    try {
      await _channel.invokeMethod<void>('deleteModel', {'modelId': modelId});
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<void> switchToDeviceAI() async {
    try {
      await _channel.invokeMethod<void>('switchToDeviceAI');
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<String> getPromptApiStatus() async {
    try {
      final result = await _channel.invokeMethod<String>('getPromptApiStatus');
      return result ?? 'not_available';
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    }
  }

  Future<bool> downloadPromptApiModel({
    void Function(ModelDownloadProgress)? onProgress,
  }) async {
    StreamSubscription? subscription;
    try {
      if (onProgress != null) {
        subscription = _downloadProgressChannel
            .receiveBroadcastStream()
            .listen((event) {
              final progress = ModelDownloadProgress.fromJson(
                Map<String, dynamic>.from(event as Map),
              );
              onProgress(progress);
            });
      }

      final result = await _channel.invokeMethod<bool>(
        'downloadPromptApiModel',
      );
      return result ?? false;
    } on PlatformException catch (e) {
      throw OndeviceAiException.fromPlatformException(e);
    } finally {
      await subscription?.cancel();
    }
  }
}
