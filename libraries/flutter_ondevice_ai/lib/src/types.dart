// Locanara On-Device AI Types for Flutter
// Mirrors expo-ondevice-ai/src/types.ts

// ============================================================================
// Enums
// ============================================================================

enum SummarizeInputType {
  article,
  conversation;

  String toJson() {
    switch (this) {
      case SummarizeInputType.article:
        return 'ARTICLE';
      case SummarizeInputType.conversation:
        return 'CONVERSATION';
    }
  }

  static SummarizeInputType fromJson(String value) {
    switch (value) {
      case 'ARTICLE':
        return SummarizeInputType.article;
      case 'CONVERSATION':
        return SummarizeInputType.conversation;
      default:
        return SummarizeInputType.article;
    }
  }
}

enum SummarizeOutputType {
  oneBullet,
  twoBullets,
  threeBullets;

  String toJson() {
    switch (this) {
      case SummarizeOutputType.oneBullet:
        return 'ONE_BULLET';
      case SummarizeOutputType.twoBullets:
        return 'TWO_BULLETS';
      case SummarizeOutputType.threeBullets:
        return 'THREE_BULLETS';
    }
  }

  static SummarizeOutputType fromJson(String value) {
    switch (value) {
      case 'ONE_BULLET':
        return SummarizeOutputType.oneBullet;
      case 'TWO_BULLETS':
        return SummarizeOutputType.twoBullets;
      case 'THREE_BULLETS':
        return SummarizeOutputType.threeBullets;
      default:
        return SummarizeOutputType.oneBullet;
    }
  }
}

enum RewriteOutputType {
  elaborate,
  emojify,
  shorten,
  friendly,
  professional,
  rephrase;

  String toJson() {
    switch (this) {
      case RewriteOutputType.elaborate:
        return 'ELABORATE';
      case RewriteOutputType.emojify:
        return 'EMOJIFY';
      case RewriteOutputType.shorten:
        return 'SHORTEN';
      case RewriteOutputType.friendly:
        return 'FRIENDLY';
      case RewriteOutputType.professional:
        return 'PROFESSIONAL';
      case RewriteOutputType.rephrase:
        return 'REPHRASE';
    }
  }

  static RewriteOutputType fromJson(String value) {
    switch (value) {
      case 'ELABORATE':
        return RewriteOutputType.elaborate;
      case 'EMOJIFY':
        return RewriteOutputType.emojify;
      case 'SHORTEN':
        return RewriteOutputType.shorten;
      case 'FRIENDLY':
        return RewriteOutputType.friendly;
      case 'PROFESSIONAL':
        return RewriteOutputType.professional;
      case 'REPHRASE':
        return RewriteOutputType.rephrase;
      default:
        return RewriteOutputType.rephrase;
    }
  }
}

enum ProofreadInputType {
  keyboard,
  voice;

  String toJson() {
    switch (this) {
      case ProofreadInputType.keyboard:
        return 'KEYBOARD';
      case ProofreadInputType.voice:
        return 'VOICE';
    }
  }

  static ProofreadInputType fromJson(String value) {
    switch (value) {
      case 'KEYBOARD':
        return ProofreadInputType.keyboard;
      case 'VOICE':
        return ProofreadInputType.voice;
      default:
        return ProofreadInputType.keyboard;
    }
  }
}

enum OndeviceAiPlatform {
  ios,
  android,
  web;

  String toJson() {
    switch (this) {
      case OndeviceAiPlatform.ios:
        return 'IOS';
      case OndeviceAiPlatform.android:
        return 'ANDROID';
      case OndeviceAiPlatform.web:
        return 'WEB';
    }
  }

  static OndeviceAiPlatform fromJson(String value) {
    switch (value) {
      case 'IOS':
        return OndeviceAiPlatform.ios;
      case 'ANDROID':
        return OndeviceAiPlatform.android;
      case 'WEB':
        return OndeviceAiPlatform.web;
      default:
        return OndeviceAiPlatform.android;
    }
  }
}

enum InferenceEngine {
  foundationModels,
  llamaCpp,
  mlx,
  coreMl,
  promptApi,
  none;

  String toJson() {
    switch (this) {
      case InferenceEngine.foundationModels:
        return 'foundation_models';
      case InferenceEngine.llamaCpp:
        return 'llama_cpp';
      case InferenceEngine.mlx:
        return 'mlx';
      case InferenceEngine.coreMl:
        return 'core_ml';
      case InferenceEngine.promptApi:
        return 'prompt_api';
      case InferenceEngine.none:
        return 'none';
    }
  }

  static InferenceEngine fromJson(String value) {
    switch (value) {
      case 'foundation_models':
        return InferenceEngine.foundationModels;
      case 'llama_cpp':
        return InferenceEngine.llamaCpp;
      case 'mlx':
        return InferenceEngine.mlx;
      case 'core_ml':
        return InferenceEngine.coreMl;
      case 'prompt_api':
        return InferenceEngine.promptApi;
      default:
        return InferenceEngine.none;
    }
  }
}

enum ModelDownloadState {
  pending,
  downloading,
  verifying,
  completed,
  failed,
  cancelled;

  String toJson() => name;

  static ModelDownloadState fromJson(String value) {
    switch (value) {
      case 'pending':
        return ModelDownloadState.pending;
      case 'downloading':
        return ModelDownloadState.downloading;
      case 'verifying':
        return ModelDownloadState.verifying;
      case 'completed':
        return ModelDownloadState.completed;
      case 'failed':
        return ModelDownloadState.failed;
      case 'cancelled':
        return ModelDownloadState.cancelled;
      default:
        return ModelDownloadState.pending;
    }
  }
}

enum ChatRole {
  user,
  assistant,
  system;

  String toJson() => name;

  static ChatRole fromJson(String value) {
    switch (value) {
      case 'user':
        return ChatRole.user;
      case 'assistant':
        return ChatRole.assistant;
      case 'system':
        return ChatRole.system;
      default:
        return ChatRole.user;
    }
  }
}

// ============================================================================
// Core Types
// ============================================================================

class InitializeResult {
  final bool success;

  const InitializeResult({required this.success});

  factory InitializeResult.fromJson(Map<String, dynamic> json) {
    return InitializeResult(success: json['success'] as bool? ?? false);
  }
}

class DeviceCapability {
  final bool isSupported;
  final bool isModelReady;
  final bool? supportsAppleIntelligence;
  final OndeviceAiPlatform platform;
  final Map<String, bool> features;
  final int? availableMemoryMB;
  final bool? isLowPowerMode;

  const DeviceCapability({
    required this.isSupported,
    required this.isModelReady,
    this.supportsAppleIntelligence,
    required this.platform,
    required this.features,
    this.availableMemoryMB,
    this.isLowPowerMode,
  });

  factory DeviceCapability.fromJson(Map<String, dynamic> json) {
    final featuresRaw = json['features'];
    final features = <String, bool>{};
    if (featuresRaw is Map) {
      for (final entry in featuresRaw.entries) {
        features[entry.key.toString()] = entry.value as bool? ?? false;
      }
    }

    return DeviceCapability(
      isSupported: json['isSupported'] as bool? ?? false,
      isModelReady: json['isModelReady'] as bool? ?? false,
      supportsAppleIntelligence: json['supportsAppleIntelligence'] as bool?,
      platform: OndeviceAiPlatform.fromJson(
        json['platform'] as String? ?? 'ANDROID',
      ),
      features: features,
      availableMemoryMB: json['availableMemoryMB'] as int?,
      isLowPowerMode: json['isLowPowerMode'] as bool?,
    );
  }
}

// ============================================================================
// Options Types
// ============================================================================

class SummarizeOptions {
  final SummarizeInputType? inputType;
  final SummarizeOutputType? outputType;

  const SummarizeOptions({this.inputType, this.outputType});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (inputType != null) map['inputType'] = inputType!.toJson();
    if (outputType != null) map['outputType'] = outputType!.toJson();
    return map;
  }
}

class ClassifyOptions {
  final List<String>? categories;
  final int? maxResults;

  const ClassifyOptions({this.categories, this.maxResults});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (categories != null) map['categories'] = categories;
    if (maxResults != null) map['maxResults'] = maxResults;
    return map;
  }
}

class ExtractOptions {
  final List<String>? entityTypes;
  final bool? extractKeyValues;

  const ExtractOptions({this.entityTypes, this.extractKeyValues});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (entityTypes != null) map['entityTypes'] = entityTypes;
    if (extractKeyValues != null) map['extractKeyValues'] = extractKeyValues;
    return map;
  }
}

class ChatMessage {
  final ChatRole role;
  final String content;

  const ChatMessage({required this.role, required this.content});

  Map<String, dynamic> toJson() => {
    'role': role.toJson(),
    'content': content,
  };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: ChatRole.fromJson(json['role'] as String? ?? 'user'),
      content: json['content'] as String? ?? '',
    );
  }
}

class ChatOptions {
  final String? conversationId;
  final String? systemPrompt;
  final List<ChatMessage>? history;

  const ChatOptions({this.conversationId, this.systemPrompt, this.history});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (conversationId != null) map['conversationId'] = conversationId;
    if (systemPrompt != null) map['systemPrompt'] = systemPrompt;
    if (history != null) {
      map['history'] = history!.map((m) => m.toJson()).toList();
    }
    return map;
  }
}

class ChatStreamOptions extends ChatOptions {
  final void Function(ChatStreamChunk chunk)? onChunk;

  const ChatStreamOptions({
    super.conversationId,
    super.systemPrompt,
    super.history,
    this.onChunk,
  });

  @override
  Map<String, dynamic> toJson() {
    // onChunk is stripped — not serializable
    return super.toJson();
  }
}

class TranslateOptions {
  final String? sourceLanguage;
  final String targetLanguage;

  const TranslateOptions({
    this.sourceLanguage,
    required this.targetLanguage,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'targetLanguage': targetLanguage};
    if (sourceLanguage != null) map['sourceLanguage'] = sourceLanguage;
    return map;
  }
}

class RewriteOptions {
  final RewriteOutputType outputType;

  const RewriteOptions({required this.outputType});

  Map<String, dynamic> toJson() => {'outputType': outputType.toJson()};
}

class ProofreadOptions {
  final ProofreadInputType? inputType;

  const ProofreadOptions({this.inputType});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (inputType != null) map['inputType'] = inputType!.toJson();
    return map;
  }
}

// ============================================================================
// Result Types
// ============================================================================

class SummarizeResult {
  final String summary;
  final int originalLength;
  final int summaryLength;
  final double? confidence;

  const SummarizeResult({
    required this.summary,
    required this.originalLength,
    required this.summaryLength,
    this.confidence,
  });

  factory SummarizeResult.fromJson(Map<String, dynamic> json) {
    return SummarizeResult(
      summary: json['summary'] as String? ?? '',
      originalLength: (json['originalLength'] as num?)?.toInt() ?? 0,
      summaryLength: (json['summaryLength'] as num?)?.toInt() ?? 0,
      confidence: (json['confidence'] as num?)?.toDouble(),
    );
  }
}

class Classification {
  final String label;
  final double score;
  final String? metadata;

  const Classification({
    required this.label,
    required this.score,
    this.metadata,
  });

  factory Classification.fromJson(Map<String, dynamic> json) {
    return Classification(
      label: json['label'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      metadata: json['metadata'] as String?,
    );
  }
}

class ClassifyResult {
  final List<Classification> classifications;
  final Classification topClassification;

  const ClassifyResult({
    required this.classifications,
    required this.topClassification,
  });

  factory ClassifyResult.fromJson(Map<String, dynamic> json) {
    final classificationsRaw = json['classifications'] as List<dynamic>? ?? [];
    final classifications =
        classificationsRaw
            .map(
              (c) =>
                  Classification.fromJson(Map<String, dynamic>.from(c as Map)),
            )
            .toList();

    final topRaw = json['topClassification'] as Map?;
    final topClassification =
        topRaw != null
            ? Classification.fromJson(Map<String, dynamic>.from(topRaw))
            : (classifications.isNotEmpty
                ? classifications.first
                : const Classification(label: '', score: 0.0));

    return ClassifyResult(
      classifications: classifications,
      topClassification: topClassification,
    );
  }
}

class Entity {
  final String type;
  final String value;
  final double confidence;
  final int? startPos;
  final int? endPos;

  const Entity({
    required this.type,
    required this.value,
    required this.confidence,
    this.startPos,
    this.endPos,
  });

  factory Entity.fromJson(Map<String, dynamic> json) {
    return Entity(
      type: json['type'] as String? ?? '',
      value: json['value'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      startPos: json['startPos'] as int?,
      endPos: json['endPos'] as int?,
    );
  }
}

class KeyValuePair {
  final String key;
  final String value;
  final double? confidence;

  const KeyValuePair({
    required this.key,
    required this.value,
    this.confidence,
  });

  factory KeyValuePair.fromJson(Map<String, dynamic> json) {
    return KeyValuePair(
      key: json['key'] as String? ?? '',
      value: json['value'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble(),
    );
  }
}

class ExtractResult {
  final List<Entity> entities;
  final List<KeyValuePair>? keyValuePairs;

  const ExtractResult({required this.entities, this.keyValuePairs});

  factory ExtractResult.fromJson(Map<String, dynamic> json) {
    final entitiesRaw = json['entities'] as List<dynamic>? ?? [];
    final entities =
        entitiesRaw
            .map(
              (e) => Entity.fromJson(Map<String, dynamic>.from(e as Map)),
            )
            .toList();

    final kvRaw = json['keyValuePairs'] as List<dynamic>?;
    final keyValuePairs =
        kvRaw
            ?.map(
              (p) => KeyValuePair.fromJson(Map<String, dynamic>.from(p as Map)),
            )
            .toList();

    return ExtractResult(entities: entities, keyValuePairs: keyValuePairs);
  }
}

class ChatResult {
  final String message;
  final String? conversationId;
  final bool canContinue;
  final List<String>? suggestedPrompts;

  const ChatResult({
    required this.message,
    this.conversationId,
    required this.canContinue,
    this.suggestedPrompts,
  });

  factory ChatResult.fromJson(Map<String, dynamic> json) {
    return ChatResult(
      message: json['message'] as String? ?? '',
      conversationId: json['conversationId'] as String?,
      canContinue: json['canContinue'] as bool? ?? false,
      suggestedPrompts:
          (json['suggestedPrompts'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .toList(),
    );
  }
}

class ChatStreamChunk {
  final String delta;
  final String accumulated;
  final bool isFinal;
  final String? conversationId;

  const ChatStreamChunk({
    required this.delta,
    required this.accumulated,
    required this.isFinal,
    this.conversationId,
  });

  factory ChatStreamChunk.fromJson(Map<String, dynamic> json) {
    return ChatStreamChunk(
      delta: json['delta'] as String? ?? '',
      accumulated: json['accumulated'] as String? ?? '',
      isFinal: json['isFinal'] as bool? ?? false,
      conversationId: json['conversationId'] as String?,
    );
  }
}

class TranslateResult {
  final String translatedText;
  final String sourceLanguage;
  final String targetLanguage;
  final double? confidence;

  const TranslateResult({
    required this.translatedText,
    required this.sourceLanguage,
    required this.targetLanguage,
    this.confidence,
  });

  factory TranslateResult.fromJson(Map<String, dynamic> json) {
    return TranslateResult(
      translatedText: json['translatedText'] as String? ?? '',
      sourceLanguage: json['sourceLanguage'] as String? ?? '',
      targetLanguage: json['targetLanguage'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble(),
    );
  }
}

class RewriteResult {
  final String rewrittenText;
  final RewriteOutputType? style;
  final List<String>? alternatives;
  final double? confidence;

  const RewriteResult({
    required this.rewrittenText,
    this.style,
    this.alternatives,
    this.confidence,
  });

  factory RewriteResult.fromJson(Map<String, dynamic> json) {
    return RewriteResult(
      rewrittenText: json['rewrittenText'] as String? ?? '',
      style:
          json['style'] != null
              ? RewriteOutputType.fromJson(json['style'] as String)
              : null,
      alternatives:
          (json['alternatives'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .toList(),
      confidence: (json['confidence'] as num?)?.toDouble(),
    );
  }
}

class ProofreadCorrection {
  final String original;
  final String corrected;
  final String? type;
  final double? confidence;
  final int? startPos;
  final int? endPos;

  const ProofreadCorrection({
    required this.original,
    required this.corrected,
    this.type,
    this.confidence,
    this.startPos,
    this.endPos,
  });

  factory ProofreadCorrection.fromJson(Map<String, dynamic> json) {
    return ProofreadCorrection(
      original: json['original'] as String? ?? '',
      corrected: json['corrected'] as String? ?? '',
      type: json['type'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble(),
      startPos: json['startPos'] as int?,
      endPos: json['endPos'] as int?,
    );
  }
}

class ProofreadResult {
  final String correctedText;
  final List<ProofreadCorrection> corrections;
  final bool hasCorrections;

  const ProofreadResult({
    required this.correctedText,
    required this.corrections,
    required this.hasCorrections,
  });

  factory ProofreadResult.fromJson(Map<String, dynamic> json) {
    final correctionsRaw = json['corrections'] as List<dynamic>? ?? [];
    final corrections =
        correctionsRaw
            .map(
              (c) => ProofreadCorrection.fromJson(
                Map<String, dynamic>.from(c as Map),
              ),
            )
            .toList();

    return ProofreadResult(
      correctedText: json['correctedText'] as String? ?? '',
      corrections: corrections,
      hasCorrections: json['hasCorrections'] as bool? ?? false,
    );
  }
}

// ============================================================================
// Model Management Types
// ============================================================================

class DownloadableModelInfo {
  final String modelId;
  final String name;
  final String version;
  final double sizeMB;
  final String quantization;
  final int contextLength;
  final int minMemoryMB;
  final bool isMultimodal;

  const DownloadableModelInfo({
    required this.modelId,
    required this.name,
    required this.version,
    required this.sizeMB,
    required this.quantization,
    required this.contextLength,
    required this.minMemoryMB,
    required this.isMultimodal,
  });

  factory DownloadableModelInfo.fromJson(Map<String, dynamic> json) {
    return DownloadableModelInfo(
      modelId: json['modelId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      version: json['version'] as String? ?? '',
      sizeMB: (json['sizeMB'] as num?)?.toDouble() ?? 0.0,
      quantization: json['quantization'] as String? ?? '',
      contextLength: (json['contextLength'] as num?)?.toInt() ?? 0,
      minMemoryMB: (json['minMemoryMB'] as num?)?.toInt() ?? 0,
      isMultimodal: json['isMultimodal'] as bool? ?? false,
    );
  }
}

class ModelDownloadProgress {
  final String modelId;
  final int bytesDownloaded;
  final int totalBytes;
  final double progress;
  final ModelDownloadState state;

  const ModelDownloadProgress({
    required this.modelId,
    required this.bytesDownloaded,
    required this.totalBytes,
    required this.progress,
    required this.state,
  });

  factory ModelDownloadProgress.fromJson(Map<String, dynamic> json) {
    return ModelDownloadProgress(
      modelId: json['modelId'] as String? ?? '',
      bytesDownloaded: (json['bytesDownloaded'] as num?)?.toInt() ?? 0,
      totalBytes: (json['totalBytes'] as num?)?.toInt() ?? 0,
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      state: ModelDownloadState.fromJson(
        json['state'] as String? ?? 'pending',
      ),
    );
  }
}
