import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:flutter/services.dart';
import 'package:flutter_web_plugins/flutter_web_plugins.dart';

// ============================================================================
// JS Interop Bindings for Chrome Built-in AI APIs
// ============================================================================

extension type _ChromeSummarizer(JSObject _) implements JSObject {
  external JSPromise<JSString> summarize(JSString text);
  external void destroy();
}

extension type _ChromeTranslator(JSObject _) implements JSObject {
  external JSPromise<JSString> translate(JSString text);
  external void destroy();
}

extension type _ChromeRewriter(JSObject _) implements JSObject {
  external JSPromise<JSString> rewrite(JSString text);
  external void destroy();
}

extension type _ChromeWriter(JSObject _) implements JSObject {
  external JSPromise<JSString> write(JSString prompt);
  external void destroy();
}

extension type _ChromeLanguageModelSession(JSObject _) implements JSObject {
  external JSPromise<JSString> prompt(JSString message);
  external JSObject promptStreaming(JSString message);
  external void destroy();
}

// ============================================================================
// Global API Accessors
// ============================================================================

bool _hasApi(String name) {
  final obj = globalContext.getProperty(name.toJS);
  return obj != null && !obj.isUndefinedOrNull;
}

JSObject? _getGlobalApi(String name) {
  final obj = globalContext.getProperty(name.toJS);
  if (obj == null || obj.isUndefinedOrNull) return null;
  return obj as JSObject;
}

// ============================================================================
// Availability Helpers (matching Expo's 3-second timeout + fallback)
// ============================================================================

Future<bool> _checkAvailabilityBool(String apiName) async {
  try {
    final obj = _getGlobalApi(apiName);
    if (obj == null) return false;

    final availabilityProp = obj.getProperty('availability'.toJS);
    if (availabilityProp == null || availabilityProp.isUndefinedOrNull) {
      return _hasApi(apiName);
    }

    final availabilityFn = availabilityProp as JSFunction;
    final promise = availabilityFn.callAsFunction(obj) as JSPromise<JSString>;

    // 3-second timeout matching Expo implementation
    final status = await Future.any([
      promise.toDart.then((v) => v.toDart),
      Future.delayed(const Duration(seconds: 3), () => throw TimeoutException('timeout')),
    ]);

    return status == 'available' ||
        status == 'readily' ||
        status == 'downloadable' ||
        status == 'after-download';
  } catch (_) {
    // On error/timeout, fall back to checking if the API object exists
    return _hasApi(apiName);
  }
}

Future<bool> _checkLanguageModelAvailability() async {
  final lmApi = _getLanguageModelApi();
  if (lmApi == null) return false;

  // Start with true if API exists (matching Expo: let hasLanguageModel = !!lm)
  bool hasLanguageModel = true;

  final availabilityProp = lmApi.getProperty('availability'.toJS);
  if (availabilityProp != null && !availabilityProp.isUndefinedOrNull) {
    try {
      final availabilityFn = availabilityProp as JSFunction;
      final promise =
          availabilityFn.callAsFunction(lmApi) as JSPromise<JSString>;

      final status = await Future.any([
        promise.toDart.then((v) => v.toDart),
        Future.delayed(const Duration(seconds: 3), () => throw TimeoutException('timeout')),
      ]);

      hasLanguageModel = status == 'readily' ||
          status == 'available' ||
          status == 'downloadable' ||
          status == 'after-download';
    } catch (_) {
      // On error/timeout, keep true (API object exists)
      hasLanguageModel = true;
    }
  }

  return hasLanguageModel;
}

// ============================================================================
// Chrome AI Factory Functions
// ============================================================================

Future<_ChromeSummarizer> _createSummarizer({
  String type = 'key-points',
  String length = 'long',
  String format = 'markdown',
}) async {
  final api = _getGlobalApi('Summarizer')!;
  final createFn = api.getProperty('create'.toJS) as JSFunction;
  final options = <String, String>{
    'type': type,
    'length': length,
    'format': format,
  }.jsify();
  final promise = createFn.callAsFunction(api, options) as JSPromise;
  final result = await promise.toDart;
  return result as _ChromeSummarizer;
}

Future<_ChromeTranslator> _createTranslator({
  required String sourceLanguage,
  required String targetLanguage,
}) async {
  final api = _getGlobalApi('Translator')!;
  final createFn = api.getProperty('create'.toJS) as JSFunction;
  final options = <String, String>{
    'sourceLanguage': sourceLanguage,
    'targetLanguage': targetLanguage,
  }.jsify();
  final promise = createFn.callAsFunction(api, options) as JSPromise;
  final result = await promise.toDart;
  return result as _ChromeTranslator;
}

Future<_ChromeRewriter> _createRewriter({
  String tone = 'as-is',
  String length = 'as-is',
}) async {
  final api = _getGlobalApi('Rewriter')!;
  final createFn = api.getProperty('create'.toJS) as JSFunction;
  final options = <String, String>{'tone': tone, 'length': length}.jsify();
  final promise = createFn.callAsFunction(api, options) as JSPromise;
  final result = await promise.toDart;
  return result as _ChromeRewriter;
}

Future<_ChromeWriter> _createWriter() async {
  final api = _getGlobalApi('Writer')!;
  final createFn = api.getProperty('create'.toJS) as JSFunction;
  final options = <String, Object>{}.jsify();
  final promise = createFn.callAsFunction(api, options) as JSPromise;
  final result = await promise.toDart;
  return result as _ChromeWriter;
}

JSObject? _getLanguageModelApi() {
  // Try globalThis.LanguageModel first (newer API)
  final lm = _getGlobalApi('LanguageModel');
  if (lm != null) return lm;
  // Try globalThis.ai.languageModel (older API)
  final ai = _getGlobalApi('ai');
  if (ai != null) {
    final languageModel = ai.getProperty('languageModel'.toJS);
    if (languageModel != null && !languageModel.isUndefinedOrNull) {
      return languageModel as JSObject;
    }
  }
  return null;
}

Future<_ChromeLanguageModelSession> _createLanguageModel({
  List<Map<String, String>>? initialPrompts,
}) async {
  final api = _getLanguageModelApi();
  if (api == null) throw Exception('LanguageModel API not available');

  final createFn = api.getProperty('create'.toJS) as JSFunction;
  final options = <String, Object>{};
  if (initialPrompts != null && initialPrompts.isNotEmpty) {
    options['initialPrompts'] = initialPrompts;
  }
  final promise = createFn.callAsFunction(api, options.jsify()) as JSPromise;
  final result = await promise.toDart;
  return result as _ChromeLanguageModelSession;
}

// ============================================================================
// Entity extraction helpers (matching Expo's typeNormalize + confidenceMap)
// ============================================================================

const _typeNormalize = <String, String>{
  'person': 'person',
  'persons': 'person',
  'people': 'person',
  'name': 'person',
  'names': 'person',
  'email': 'email',
  'emails': 'email',
  'phone': 'phone',
  'phones': 'phone',
  'phone_number': 'phone',
  'phone_numbers': 'phone',
  'date': 'date',
  'dates': 'date',
  'location': 'location',
  'locations': 'location',
  'place': 'location',
  'places': 'location',
  'organization': 'organization',
  'organizations': 'organization',
  'org': 'organization',
  'orgs': 'organization',
  'contact': 'email',
};

const _confidenceMap = <String, double>{
  'person': 0.95,
  'email': 0.98,
  'phone': 0.97,
  'date': 0.96,
  'location': 0.92,
  'organization': 0.9,
};

List<Map<String, dynamic>> _walkEntities(dynamic obj, [String? parentKey]) {
  final entities = <Map<String, dynamic>>[];

  if (obj is List) {
    for (final item in obj) {
      if (item is String) {
        final normalized =
            _typeNormalize[(parentKey ?? '').toLowerCase()] ??
            parentKey ??
            'unknown';
        entities.add({
          'type': normalized,
          'value': item,
          'confidence': _confidenceMap[normalized] ?? 0.85,
        });
      } else {
        entities.addAll(_walkEntities(item, parentKey));
      }
    }
  } else if (obj is Map) {
    for (final entry in obj.entries) {
      entities.addAll(_walkEntities(entry.value, entry.key.toString()));
    }
  } else if (obj != null) {
    final normalized =
        _typeNormalize[(parentKey ?? '').toLowerCase()] ??
        parentKey ??
        'unknown';
    entities.add({
      'type': normalized,
      'value': obj.toString(),
      'confidence': _confidenceMap[normalized] ?? 0.85,
    });
  }

  return entities;
}

// ============================================================================
// Cached instances
// ============================================================================

const _maxCachedTranslators = 10;

_ChromeSummarizer? _cachedSummarizer;
String _cachedSummarizerKey = '';
_ChromeLanguageModelSession? _cachedLanguageModel;
String? _cachedSystemPrompt;
final Map<String, _ChromeTranslator> _cachedTranslators = {};
_ChromeRewriter? _cachedRewriter;
_ChromeWriter? _cachedWriter;

// ============================================================================
// Web Plugin
// ============================================================================

class FlutterOndeviceAiWebPlugin {
  late final StreamController<Map<String, dynamic>> _chatStreamController;

  FlutterOndeviceAiWebPlugin._() {
    _chatStreamController = StreamController<Map<String, dynamic>>.broadcast();
  }

  static void registerWith(Registrar registrar) {
    final plugin = FlutterOndeviceAiWebPlugin._();

    final channel = MethodChannel(
      'flutter_ondevice_ai',
      const StandardMethodCodec(),
      registrar,
    );
    channel.setMethodCallHandler(plugin.handleMethodCall);

    final chatStreamEventChannel = PluginEventChannel<dynamic>(
      'flutter_ondevice_ai/chat_stream',
      const StandardMethodCodec(),
      registrar,
    );
    chatStreamEventChannel.setController(plugin._chatStreamController);
  }

  Future<dynamic> handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'initialize':
        return {'success': true};
      case 'getDeviceCapability':
        return await _getDeviceCapability();
      case 'summarize':
        return await _summarize(call.arguments as Map);
      case 'classify':
        return await _classify(call.arguments as Map);
      case 'extract':
        return await _extract(call.arguments as Map);
      case 'chat':
        return await _chat(call.arguments as Map);
      case 'chatStream':
        return await _chatStream(call.arguments as Map);
      case 'translate':
        return await _translate(call.arguments as Map);
      case 'rewrite':
        return await _rewrite(call.arguments as Map);
      case 'proofread':
        return await _proofread(call.arguments as Map);
      case 'getAvailableModels':
        return <Map<String, dynamic>>[];
      case 'getDownloadedModels':
        return <String>[];
      case 'getLoadedModel':
        return null;
      case 'getCurrentEngine':
        return 'none';
      case 'downloadModel':
        return false;
      case 'loadModel':
        return null;
      case 'deleteModel':
        return null;
      case 'getPromptApiStatus':
        return await _getPromptApiStatus();
      case 'downloadPromptApiModel':
        return false;
      default:
        throw PlatformException(
          code: 'Unimplemented',
          message: '${call.method} is not implemented on web',
        );
    }
  }

  Future<Map<String, dynamic>> _getDeviceCapability() async {
    // Parallel availability checks with timeout (matching Expo)
    final results = await Future.wait([
      _checkAvailabilityBool('Summarizer'),
      _checkAvailabilityBool('Rewriter'),
      _checkAvailabilityBool('Writer'),
      _checkLanguageModelAvailability(),
    ]);

    final hasSummarizer = results[0];
    final hasRewriter = results[1];
    final hasWriter = results[2];
    final hasLanguageModel = results[3];
    final hasTranslator = _hasApi('Translator');

    return {
      'isSupported': hasSummarizer || hasLanguageModel || hasTranslator,
      'isModelReady': hasSummarizer || hasLanguageModel,
      'platform': 'WEB',
      'features': {
        'summarize': hasSummarizer,
        'classify': hasLanguageModel,
        'extract': hasLanguageModel,
        'chat': hasLanguageModel,
        'translate': hasTranslator,
        'rewrite': hasRewriter,
        'proofread': hasLanguageModel || hasWriter,
      },
    };
  }

  Future<Map<String, dynamic>> _summarize(Map args) async {
    if (_getGlobalApi('Summarizer') == null) {
      throw PlatformException(
        code: 'ERR_NOT_AVAILABLE',
        message: 'Summarizer API not available in this browser',
      );
    }

    final text = args['text'] as String;
    final options = args['options'] as Map?;

    const optionsKey = 'key-points:long';
    if (_cachedSummarizer == null || _cachedSummarizerKey != optionsKey) {
      _cachedSummarizer?.destroy();
      _cachedSummarizer = await _createSummarizer();
      _cachedSummarizerKey = optionsKey;
    }

    final raw =
        (await _cachedSummarizer!.summarize(text.toJS).toDart).toDart;

    final outputType = options?['outputType'] as String?;
    final bulletCount =
        outputType == 'ONE_BULLET'
            ? 1
            : outputType == 'TWO_BULLETS'
            ? 2
            : 3;

    final bullets =
        raw
            .split('\n')
            .map((l) => l.trim())
            .where((l) => l.startsWith('*') || l.startsWith('-'))
            .toList();
    final summary =
        bullets.isNotEmpty ? bullets.take(bulletCount).join('\n') : raw;

    return {
      'summary': summary,
      'originalLength': text.length,
      'summaryLength': summary.length,
    };
  }

  Future<Map<String, dynamic>> _classify(Map args) async {
    final text = args['text'] as String;
    final options = args['options'] as Map?;

    final categories =
        (options?['categories'] as List?)?.cast<String>() ??
        ['positive', 'negative', 'neutral'];

    final session = await _createLanguageModel();
    final prompt =
        'Classify the following text into one of these categories: ${categories.join(', ')}.\n\nText: $text\n\nRespond with ONLY the category name.';
    final response = (await session.prompt(prompt.toJS).toDart).toDart;
    session.destroy();

    final category = response.trim();
    final isValid = categories.any(
      (c) => c.toLowerCase() == category.toLowerCase(),
    );

    return {
      'classifications': [
        {
          'label': isValid ? category : categories[0],
          'score': isValid ? 0.9 : 0.5,
        },
      ],
      'topClassification': {
        'label': isValid ? category : categories[0],
        'score': isValid ? 0.9 : 0.5,
      },
    };
  }

  Future<Map<String, dynamic>> _extract(Map args) async {
    final text = args['text'] as String;

    final session = await _createLanguageModel();
    final prompt =
        'Extract entities from this text. Return JSON with these exact keys: "person", "email", "phone", "date", "location", "organization". Each key maps to an array of strings. Only include keys that have values.\n\nText: $text\n\nRespond with valid JSON only, no markdown.';
    final response = (await session.prompt(prompt.toJS).toDart).toDart;
    session.destroy();

    try {
      // Strip markdown code fence if present (matching Expo)
      final jsonStr = response
          .replaceFirst(RegExp(r'^```(?:json)?\s*\n?', multiLine: true), '')
          .replaceFirst(RegExp(r'\n?```\s*$', multiLine: true), '')
          .trim();
      final parsed = jsonDecode(jsonStr);

      final entities = _walkEntities(parsed);
      return {'entities': entities};
    } catch (_) {
      return {
        'entities': [
          {'type': 'raw', 'value': response, 'confidence': 0.5},
        ],
      };
    }
  }

  Future<Map<String, dynamic>> _chat(Map args) async {
    final message = args['message'] as String;
    final options = args['options'] as Map?;

    final newSystemPrompt = options?['systemPrompt'] as String?;
    if (_cachedLanguageModel == null ||
        newSystemPrompt != _cachedSystemPrompt) {
      _cachedLanguageModel?.destroy();
      final initialPrompts = <Map<String, String>>[];
      if (newSystemPrompt != null) {
        initialPrompts.add({'role': 'system', 'content': newSystemPrompt});
      }
      _cachedLanguageModel = await _createLanguageModel(
        initialPrompts: initialPrompts.isNotEmpty ? initialPrompts : null,
      );
      _cachedSystemPrompt = newSystemPrompt;
    }

    final response =
        (await _cachedLanguageModel!.prompt(message.toJS).toDart).toDart;
    return {'message': response, 'canContinue': true};
  }

  Future<Map<String, dynamic>> _chatStream(Map args) async {
    final message = args['message'] as String;
    final options = args['options'] as Map?;

    final newSystemPrompt = options?['systemPrompt'] as String?;
    if (_cachedLanguageModel == null ||
        newSystemPrompt != _cachedSystemPrompt) {
      _cachedLanguageModel?.destroy();
      final initialPrompts = <Map<String, String>>[];
      if (newSystemPrompt != null) {
        initialPrompts.add({'role': 'system', 'content': newSystemPrompt});
      }
      _cachedLanguageModel = await _createLanguageModel(
        initialPrompts: initialPrompts.isNotEmpty ? initialPrompts : null,
      );
      _cachedSystemPrompt = newSystemPrompt;
    }

    // Try real streaming with promptStreaming
    try {
      final streamObj =
          _cachedLanguageModel!.promptStreaming(message.toJS);

      // Access Symbol.asyncIterator via JS interop
      final symbolAsyncIterator = globalContext
          .getProperty('Symbol'.toJS);
      if (symbolAsyncIterator != null && !symbolAsyncIterator.isUndefinedOrNull) {
        final asyncIteratorSymbol =
            (symbolAsyncIterator as JSObject).getProperty('asyncIterator'.toJS);
        if (asyncIteratorSymbol != null &&
            !asyncIteratorSymbol.isUndefinedOrNull) {
          final iteratorFn =
              streamObj.getProperty(asyncIteratorSymbol) as JSFunction?;
          if (iteratorFn != null) {
            final iterator =
                iteratorFn.callAsFunction(streamObj) as JSObject;
            final nextFn =
                iterator.getProperty('next'.toJS) as JSFunction;

            var accumulated = '';

            while (true) {
              final resultPromise =
                  nextFn.callAsFunction(iterator) as JSPromise;
              final result = (await resultPromise.toDart) as JSObject;

              final done = result.getProperty('done'.toJS);
              if (done != null &&
                  !done.isUndefinedOrNull &&
                  (done as JSBoolean).toDart) {
                break;
              }

              final value = result.getProperty('value'.toJS);
              if (value == null || value.isUndefinedOrNull) continue;

              final text = (value as JSString).toDart;

              // Chrome may return cumulative or delta text depending on version
              String delta;
              if (text.length >= accumulated.length &&
                  text.startsWith(accumulated)) {
                delta = text.substring(accumulated.length);
                accumulated = text;
              } else {
                delta = text;
                accumulated += text;
              }

              _chatStreamController.add({
                'delta': delta,
                'accumulated': accumulated,
                'isFinal': false,
              });
            }

            _chatStreamController.add({
              'delta': '',
              'accumulated': accumulated,
              'isFinal': true,
            });

            return {'message': accumulated, 'canContinue': true};
          }
        }
      }
    } catch (_) {
      // promptStreaming not available, fall through to non-streaming
    }

    // Fallback to non-streaming
    final response =
        (await _cachedLanguageModel!.prompt(message.toJS).toDart).toDart;

    _chatStreamController.add({
      'delta': response,
      'accumulated': response,
      'isFinal': true,
    });

    return {'message': response, 'canContinue': true};
  }

  Future<Map<String, dynamic>> _translate(Map args) async {
    if (_getGlobalApi('Translator') == null) {
      throw PlatformException(
        code: 'ERR_NOT_AVAILABLE',
        message: 'Translator API not available in this browser',
      );
    }

    final text = args['text'] as String;
    final options = args['options'] as Map?;
    final sourceLanguage = (options?['sourceLanguage'] as String?) ?? 'en';
    final targetLanguage =
        (options?['targetLanguage'] as String?) ?? 'en';

    final key = '$sourceLanguage-$targetLanguage';
    if (!_cachedTranslators.containsKey(key)) {
      if (_cachedTranslators.length >= _maxCachedTranslators) {
        final oldestKey = _cachedTranslators.keys.first;
        _cachedTranslators[oldestKey]?.destroy();
        _cachedTranslators.remove(oldestKey);
      }
      _cachedTranslators[key] = await _createTranslator(
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      );
    }

    final translator = _cachedTranslators[key]!;
    final translatedText =
        (await translator.translate(text.toJS).toDart).toDart;

    return {
      'translatedText': translatedText,
      'sourceLanguage': sourceLanguage,
      'targetLanguage': targetLanguage,
    };
  }

  Future<Map<String, dynamic>> _rewrite(Map args) async {
    if (_getGlobalApi('Rewriter') == null) {
      throw PlatformException(
        code: 'ERR_NOT_AVAILABLE',
        message: 'Rewriter API not available in this browser',
      );
    }

    final text = args['text'] as String;
    final options = args['options'] as Map?;
    final outputType = (options?['outputType'] as String?) ?? 'REPHRASE';

    const toneMap = {
      'FRIENDLY': 'more-casual',
      'PROFESSIONAL': 'more-formal',
      'ELABORATE': 'as-is',
      'SHORTEN': 'as-is',
      'EMOJIFY': 'more-casual',
      'REPHRASE': 'as-is',
    };
    const lengthMap = {'ELABORATE': 'longer', 'SHORTEN': 'shorter'};

    _cachedRewriter?.destroy();
    _cachedRewriter = await _createRewriter(
      tone: toneMap[outputType] ?? 'as-is',
      length: lengthMap[outputType] ?? 'as-is',
    );

    final rewrittenText =
        (await _cachedRewriter!.rewrite(text.toJS).toDart).toDart;
    return {'rewrittenText': rewrittenText, 'style': outputType};
  }

  Future<Map<String, dynamic>> _proofread(Map args) async {
    final text = args['text'] as String;

    // Prefer LanguageModel for structured proofreading (matching Expo)
    final lmApi = _getLanguageModelApi();
    if (lmApi != null) {
      try {
        final session = await _createLanguageModel();
        final prompt =
            'You are a proofreader. Fix ONLY spelling, grammar, and punctuation errors. Do NOT change meaning, tense, or style. Return JSON with this exact format:\n{"correctedText":"the full corrected text","corrections":[{"original":"misspeled","corrected":"misspelled","type":"spelling"}]}\n\nType must be one of: "spelling", "grammar", "punctuation".\nIf there are no errors, return: {"correctedText":"<original text unchanged>","corrections":[]}\nRespond with valid JSON only, no markdown, no explanation.\n\nText to proofread:\n$text';
        final response =
            (await session.prompt(prompt.toJS).toDart).toDart;
        session.destroy();

        try {
          // Parse JSON response (matching Expo's JSON parsing)
          final jsonStr = response
              .replaceFirst(
                  RegExp(r'^```(?:json)?\s*\n?', multiLine: true), '')
              .replaceFirst(RegExp(r'\n?```\s*$', multiLine: true), '')
              .trim();
          final parsed = jsonDecode(jsonStr) as Map<String, dynamic>;

          final correctedText =
              (parsed['correctedText'] as String?) ?? text;
          final rawCorrections = parsed['corrections'];
          final corrections = <Map<String, dynamic>>[];

          if (rawCorrections is List) {
            for (final c in rawCorrections) {
              if (c is Map) {
                corrections.add({
                  'original': (c['original'] as String?) ?? '',
                  'corrected': (c['corrected'] as String?) ?? '',
                  'type': (c['type'] as String?) ?? 'grammar',
                  'confidence': 0.9,
                });
              }
            }
          }

          return {
            'correctedText': correctedText,
            'corrections': corrections,
            'hasCorrections': corrections.isNotEmpty,
          };
        } catch (_) {
          // JSON parse failed — fall through to Writer API
        }
      } catch (_) {
        // LanguageModel failed — fall through to Writer API
      }
    }

    // Fallback to Writer API with word-diff (matching Expo)
    if (_getGlobalApi('Writer') != null) {
      _cachedWriter ??= await _createWriter();
      final correctedText =
          (await _cachedWriter!
                  .write(
                    'Proofread and correct this text. Fix ONLY spelling, grammar, and punctuation. Do NOT change meaning, tense, or word choice. Return only the corrected text:\n\n$text'
                        .toJS,
                  )
                  .toDart)
              .toDart;

      // Word-diff to find corrections (matching Expo)
      final corrections = <Map<String, dynamic>>[];
      final origWords = text.split(RegExp(r'\s+'));
      final corrWords = correctedText.split(RegExp(r'\s+'));
      if (origWords.length == corrWords.length) {
        for (var i = 0; i < origWords.length; i++) {
          if (origWords[i] != corrWords[i]) {
            corrections.add({
              'original': origWords[i],
              'corrected': corrWords[i],
              'type': 'spelling',
              'confidence': 0.85,
            });
          }
        }
      }

      return {
        'correctedText': correctedText,
        'corrections': corrections,
        'hasCorrections': correctedText != text,
      };
    }

    throw PlatformException(
      code: 'ERR_NOT_AVAILABLE',
      message: 'Writer or LanguageModel API not available in this browser',
    );
  }

  Future<String> _getPromptApiStatus() async {
    final lmApi = _getLanguageModelApi();
    if (lmApi == null) return 'not_available';
    try {
      final availabilityProp = lmApi.getProperty('availability'.toJS);
      if (availabilityProp == null || availabilityProp.isUndefinedOrNull) {
        return 'available';
      }
      final availabilityFn = availabilityProp as JSFunction;
      final result =
          availabilityFn.callAsFunction(lmApi) as JSPromise<JSString>;
      final status = (await result.toDart).toDart;
      return status;
    } catch (_) {
      return 'not_available';
    }
  }
}
