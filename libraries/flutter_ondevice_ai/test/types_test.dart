import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

void main() {
  group('SummarizeInputType', () {
    test('toJson returns correct strings', () {
      expect(SummarizeInputType.article.toJson(), 'ARTICLE');
      expect(SummarizeInputType.conversation.toJson(), 'CONVERSATION');
    });

    test('fromJson parses correctly', () {
      expect(SummarizeInputType.fromJson('ARTICLE'), SummarizeInputType.article);
      expect(
        SummarizeInputType.fromJson('CONVERSATION'),
        SummarizeInputType.conversation,
      );
      expect(SummarizeInputType.fromJson('UNKNOWN'), SummarizeInputType.article);
    });
  });

  group('SummarizeOutputType', () {
    test('toJson returns correct strings', () {
      expect(SummarizeOutputType.oneBullet.toJson(), 'ONE_BULLET');
      expect(SummarizeOutputType.twoBullets.toJson(), 'TWO_BULLETS');
      expect(SummarizeOutputType.threeBullets.toJson(), 'THREE_BULLETS');
    });

    test('fromJson parses correctly', () {
      expect(
        SummarizeOutputType.fromJson('TWO_BULLETS'),
        SummarizeOutputType.twoBullets,
      );
    });
  });

  group('RewriteOutputType', () {
    test('round-trip all values', () {
      for (final value in RewriteOutputType.values) {
        final json = value.toJson();
        final parsed = RewriteOutputType.fromJson(json);
        expect(parsed, value);
      }
    });
  });

  group('InferenceEngine', () {
    test('toJson returns snake_case', () {
      expect(InferenceEngine.foundationModels.toJson(), 'foundation_models');
      expect(InferenceEngine.llamaCpp.toJson(), 'llama_cpp');
      expect(InferenceEngine.promptApi.toJson(), 'prompt_api');
      expect(InferenceEngine.none.toJson(), 'none');
    });

    test('fromJson parses correctly', () {
      expect(
        InferenceEngine.fromJson('foundation_models'),
        InferenceEngine.foundationModels,
      );
      expect(InferenceEngine.fromJson('unknown'), InferenceEngine.none);
    });
  });

  group('ModelDownloadState', () {
    test('round-trip all values', () {
      for (final value in ModelDownloadState.values) {
        final json = value.toJson();
        final parsed = ModelDownloadState.fromJson(json);
        expect(parsed, value);
      }
    });
  });

  group('ChatRole', () {
    test('round-trip all values', () {
      for (final value in ChatRole.values) {
        final json = value.toJson();
        final parsed = ChatRole.fromJson(json);
        expect(parsed, value);
      }
    });
  });

  group('SummarizeOptions', () {
    test('toJson includes only non-null fields', () {
      const opts = SummarizeOptions();
      expect(opts.toJson(), isEmpty);

      const opts2 = SummarizeOptions(
        inputType: SummarizeInputType.conversation,
        outputType: SummarizeOutputType.twoBullets,
      );
      expect(opts2.toJson(), {
        'inputType': 'CONVERSATION',
        'outputType': 'TWO_BULLETS',
      });
    });
  });

  group('ChatOptions', () {
    test('toJson serializes history correctly', () {
      const opts = ChatOptions(
        systemPrompt: 'Be helpful',
        history: [
          ChatMessage(role: ChatRole.user, content: 'Hi'),
          ChatMessage(role: ChatRole.assistant, content: 'Hello!'),
        ],
      );
      final json = opts.toJson();
      expect(json['systemPrompt'], 'Be helpful');
      expect(json['history'], isList);
      final history = json['history'] as List;
      expect(history.length, 2);
      expect(history[0]['role'], 'user');
      expect(history[0]['content'], 'Hi');
    });
  });

  group('TranslateOptions', () {
    test('toJson always includes targetLanguage', () {
      const opts = TranslateOptions(targetLanguage: 'ko');
      expect(opts.toJson(), {'targetLanguage': 'ko'});

      const opts2 = TranslateOptions(
        sourceLanguage: 'en',
        targetLanguage: 'ko',
      );
      expect(opts2.toJson(), {
        'sourceLanguage': 'en',
        'targetLanguage': 'ko',
      });
    });
  });

  group('SummarizeResult', () {
    test('fromJson parses all fields', () {
      final result = SummarizeResult.fromJson({
        'summary': 'Test summary',
        'originalLength': 100,
        'summaryLength': 20,
        'confidence': 0.95,
      });
      expect(result.summary, 'Test summary');
      expect(result.originalLength, 100);
      expect(result.summaryLength, 20);
      expect(result.confidence, 0.95);
    });

    test('fromJson handles missing optional fields', () {
      final result = SummarizeResult.fromJson({
        'summary': 'Test',
        'originalLength': 10,
        'summaryLength': 4,
      });
      expect(result.confidence, isNull);
    });
  });

  group('ClassifyResult', () {
    test('fromJson parses classifications', () {
      final result = ClassifyResult.fromJson({
        'classifications': [
          {'label': 'positive', 'score': 0.9, 'metadata': 'test'},
          {'label': 'neutral', 'score': 0.1},
        ],
        'topClassification': {'label': 'positive', 'score': 0.9},
      });
      expect(result.classifications.length, 2);
      expect(result.classifications[0].metadata, 'test');
      expect(result.classifications[1].metadata, isNull);
      expect(result.topClassification.label, 'positive');
    });
  });

  group('ExtractResult', () {
    test('fromJson parses entities', () {
      final result = ExtractResult.fromJson({
        'entities': [
          {
            'type': 'person',
            'value': 'John',
            'confidence': 0.95,
            'startPos': 0,
            'endPos': 4,
          },
        ],
      });
      expect(result.entities.length, 1);
      expect(result.entities[0].type, 'person');
      expect(result.keyValuePairs, isNull);
    });
  });

  group('ChatResult', () {
    test('fromJson parses all fields', () {
      final result = ChatResult.fromJson({
        'message': 'Hello!',
        'conversationId': 'conv-1',
        'canContinue': true,
        'suggestedPrompts': ['Tell me more', 'Thanks'],
      });
      expect(result.message, 'Hello!');
      expect(result.conversationId, 'conv-1');
      expect(result.canContinue, isTrue);
      expect(result.suggestedPrompts, ['Tell me more', 'Thanks']);
    });
  });

  group('ChatStreamChunk', () {
    test('fromJson parses correctly', () {
      final chunk = ChatStreamChunk.fromJson({
        'delta': 'Hello',
        'accumulated': 'Hello',
        'isFinal': false,
      });
      expect(chunk.delta, 'Hello');
      expect(chunk.accumulated, 'Hello');
      expect(chunk.isFinal, isFalse);
      expect(chunk.conversationId, isNull);
    });
  });

  group('ProofreadResult', () {
    test('fromJson parses corrections', () {
      final result = ProofreadResult.fromJson({
        'correctedText': 'The fox',
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
      });
      expect(result.hasCorrections, isTrue);
      expect(result.corrections.length, 1);
      expect(result.corrections[0].type, 'spelling');
    });
  });

  group('DownloadableModelInfo', () {
    test('fromJson parses all fields', () {
      final info = DownloadableModelInfo.fromJson({
        'modelId': 'test-model',
        'name': 'Test Model',
        'version': '1.0.0',
        'sizeMB': 500.0,
        'quantization': 'int4',
        'contextLength': 4096,
        'minMemoryMB': 2048,
        'isMultimodal': true,
      });
      expect(info.modelId, 'test-model');
      expect(info.sizeMB, 500.0);
      expect(info.isMultimodal, isTrue);
    });
  });

  group('ModelDownloadProgress', () {
    test('fromJson parses all fields', () {
      final progress = ModelDownloadProgress.fromJson({
        'modelId': 'model-1',
        'bytesDownloaded': 500000,
        'totalBytes': 1000000,
        'progress': 0.5,
        'state': 'downloading',
      });
      expect(progress.modelId, 'model-1');
      expect(progress.progress, 0.5);
      expect(progress.state, ModelDownloadState.downloading);
    });
  });

  group('ChatMessage', () {
    test('round-trip serialization', () {
      const msg = ChatMessage(role: ChatRole.assistant, content: 'Hello!');
      final json = msg.toJson();
      final parsed = ChatMessage.fromJson(json);
      expect(parsed.role, ChatRole.assistant);
      expect(parsed.content, 'Hello!');
    });
  });
}
