import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('flutter_ondevice_ai');
  late FlutterOndeviceAi plugin;

  setUp(() {
    plugin = FlutterOndeviceAi.forTesting();
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  void mockChannel(Future<dynamic> Function(MethodCall call)? handler) {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, handler);
  }

  group('initialize', () {
    test('returns InitializeResult with success true', () async {
      mockChannel((call) async {
        expect(call.method, 'initialize');
        return {'success': true};
      });

      final result = await plugin.initialize();
      expect(result.success, isTrue);
    });

    test('returns InitializeResult with success false', () async {
      mockChannel((call) async {
        return {'success': false};
      });

      final result = await plugin.initialize();
      expect(result.success, isFalse);
    });
  });

  group('getDeviceCapability', () {
    test('parses device capability correctly', () async {
      mockChannel((call) async {
        expect(call.method, 'getDeviceCapability');
        return {
          'isSupported': true,
          'isModelReady': true,
          'supportsAppleIntelligence': true,
          'platform': 'IOS',
          'features': {
            'summarize': true,
            'classify': true,
            'extract': true,
            'chat': true,
            'translate': true,
            'rewrite': true,
            'proofread': true,
          },
          'availableMemoryMB': 8192,
          'isLowPowerMode': false,
        };
      });

      final result = await plugin.getDeviceCapability();
      expect(result.isSupported, isTrue);
      expect(result.isModelReady, isTrue);
      expect(result.supportsAppleIntelligence, isTrue);
      expect(result.platform, OndeviceAiPlatform.ios);
      expect(result.features['summarize'], isTrue);
      expect(result.features['chat'], isTrue);
      expect(result.availableMemoryMB, 8192);
      expect(result.isLowPowerMode, isFalse);
    });
  });

  group('summarize', () {
    test('sends correct arguments and parses result', () async {
      mockChannel((call) async {
        expect(call.method, 'summarize');
        final args = call.arguments as Map;
        expect(args['text'], 'Hello world');
        expect(args['options']['outputType'], 'THREE_BULLETS');
        expect(args['options']['inputType'], 'ARTICLE');
        return {
          'summary': 'Summary text',
          'originalLength': 11,
          'summaryLength': 12,
          'confidence': 0.95,
        };
      });

      final result = await plugin.summarize(
        'Hello world',
        options: const SummarizeOptions(
          outputType: SummarizeOutputType.threeBullets,
          inputType: SummarizeInputType.article,
        ),
      );
      expect(result.summary, 'Summary text');
      expect(result.originalLength, 11);
      expect(result.summaryLength, 12);
      expect(result.confidence, 0.95);
    });

    test('works without options', () async {
      mockChannel((call) async {
        final args = call.arguments as Map;
        expect(args['text'], 'Test');
        expect(args.containsKey('options'), isFalse);
        return {
          'summary': 'Test summary',
          'originalLength': 4,
          'summaryLength': 12,
        };
      });

      final result = await plugin.summarize('Test');
      expect(result.summary, 'Test summary');
      expect(result.confidence, isNull);
    });
  });

  group('classify', () {
    test('sends correct arguments and parses result', () async {
      mockChannel((call) async {
        expect(call.method, 'classify');
        final args = call.arguments as Map;
        expect(args['text'], 'Great product!');
        return {
          'classifications': [
            {'label': 'positive', 'score': 0.95, 'metadata': ''},
            {'label': 'neutral', 'score': 0.04},
          ],
          'topClassification': {'label': 'positive', 'score': 0.95},
        };
      });

      final result = await plugin.classify(
        'Great product!',
        options: const ClassifyOptions(
          categories: ['positive', 'negative', 'neutral'],
          maxResults: 3,
        ),
      );
      expect(result.classifications.length, 2);
      expect(result.topClassification.label, 'positive');
      expect(result.topClassification.score, 0.95);
    });
  });

  group('extract', () {
    test('parses entities and key-value pairs', () async {
      mockChannel((call) async {
        return {
          'entities': [
            {
              'type': 'person',
              'value': 'John',
              'confidence': 0.95,
              'startPos': 0,
              'endPos': 4,
            },
          ],
          'keyValuePairs': [
            {'key': 'name', 'value': 'John', 'confidence': 0.9},
          ],
        };
      });

      final result = await plugin.extract('John is here');
      expect(result.entities.length, 1);
      expect(result.entities[0].type, 'person');
      expect(result.entities[0].value, 'John');
      expect(result.keyValuePairs?.length, 1);
      expect(result.keyValuePairs![0].key, 'name');
    });
  });

  group('chat', () {
    test('sends message with options', () async {
      mockChannel((call) async {
        expect(call.method, 'chat');
        final args = call.arguments as Map;
        expect(args['message'], 'Hello');
        final opts = args['options'] as Map;
        expect(opts['systemPrompt'], 'Be helpful');
        return {
          'message': 'Hi there!',
          'canContinue': true,
          'conversationId': 'conv-123',
        };
      });

      final result = await plugin.chat(
        'Hello',
        options: const ChatOptions(systemPrompt: 'Be helpful'),
      );
      expect(result.message, 'Hi there!');
      expect(result.canContinue, isTrue);
      expect(result.conversationId, 'conv-123');
    });
  });

  group('translate', () {
    test('sends correct translate options', () async {
      mockChannel((call) async {
        expect(call.method, 'translate');
        final args = call.arguments as Map;
        expect(args['text'], 'Hello');
        final opts = args['options'] as Map;
        expect(opts['targetLanguage'], 'ko');
        expect(opts['sourceLanguage'], 'en');
        return {
          'translatedText': '안녕하세요',
          'sourceLanguage': 'en',
          'targetLanguage': 'ko',
          'confidence': 0.98,
        };
      });

      final result = await plugin.translate(
        'Hello',
        options: const TranslateOptions(
          sourceLanguage: 'en',
          targetLanguage: 'ko',
        ),
      );
      expect(result.translatedText, '안녕하세요');
      expect(result.sourceLanguage, 'en');
      expect(result.targetLanguage, 'ko');
    });
  });

  group('rewrite', () {
    test('sends correct rewrite options', () async {
      mockChannel((call) async {
        final args = call.arguments as Map;
        final opts = args['options'] as Map;
        expect(opts['outputType'], 'PROFESSIONAL');
        return {
          'rewrittenText': 'Please find attached.',
          'style': 'PROFESSIONAL',
          'confidence': 0.9,
        };
      });

      final result = await plugin.rewrite(
        'Here it is',
        options: const RewriteOptions(outputType: RewriteOutputType.professional),
      );
      expect(result.rewrittenText, 'Please find attached.');
      expect(result.style, RewriteOutputType.professional);
    });
  });

  group('proofread', () {
    test('parses corrections correctly', () async {
      mockChannel((call) async {
        return {
          'correctedText': 'The quick brown fox',
          'corrections': [
            {
              'original': 'teh',
              'corrected': 'the',
              'type': 'spelling',
              'confidence': 0.99,
              'startPos': 0,
              'endPos': 3,
            },
          ],
          'hasCorrections': true,
        };
      });

      final result = await plugin.proofread('Teh quick brown fox');
      expect(result.correctedText, 'The quick brown fox');
      expect(result.hasCorrections, isTrue);
      expect(result.corrections.length, 1);
      expect(result.corrections[0].original, 'teh');
      expect(result.corrections[0].corrected, 'the');
      expect(result.corrections[0].type, 'spelling');
    });
  });

  group('model management', () {
    test('getAvailableModels parses model info', () async {
      mockChannel((call) async {
        return [
          {
            'modelId': 'llama-3.2-1b',
            'name': 'Llama 3.2 1B',
            'version': '1.0.0',
            'sizeMB': 750.0,
            'quantization': 'int4',
            'contextLength': 4096,
            'minMemoryMB': 2048,
            'isMultimodal': false,
          },
        ];
      });

      final models = await plugin.getAvailableModels();
      expect(models.length, 1);
      expect(models[0].modelId, 'llama-3.2-1b');
      expect(models[0].name, 'Llama 3.2 1B');
      expect(models[0].sizeMB, 750.0);
      expect(models[0].isMultimodal, isFalse);
    });

    test('getDownloadedModels returns list of strings', () async {
      mockChannel((call) async {
        return ['model-1', 'model-2'];
      });

      final ids = await plugin.getDownloadedModels();
      expect(ids, ['model-1', 'model-2']);
    });

    test('getLoadedModel returns null when no model loaded', () async {
      mockChannel((call) async => null);

      final id = await plugin.getLoadedModel();
      expect(id, isNull);
    });

    test('getCurrentEngine parses engine type', () async {
      mockChannel((call) async => 'foundation_models');

      final engine = await plugin.getCurrentEngine();
      expect(engine, InferenceEngine.foundationModels);
    });

    test('getPromptApiStatus returns status string', () async {
      mockChannel((call) async => 'available');

      final status = await plugin.getPromptApiStatus();
      expect(status, 'available');
    });
  });

  group('error handling', () {
    test('wraps PlatformException in OndeviceAiException', () async {
      mockChannel((call) async {
        throw PlatformException(
          code: 'ERR_SUMMARIZE',
          message: 'Model not ready',
        );
      });

      expect(
        () => plugin.summarize('test'),
        throwsA(
          isA<OndeviceAiException>()
              .having((e) => e.code, 'code', 'ERR_SUMMARIZE')
              .having((e) => e.message, 'message', 'Model not ready'),
        ),
      );
    });
  });
}
