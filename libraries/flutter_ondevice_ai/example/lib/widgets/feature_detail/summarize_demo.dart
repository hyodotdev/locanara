import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';
import '../shared/stat_badge.dart';

const _defaultText =
    'Apple Intelligence is the personal intelligence system that puts powerful generative '
    'models right at the core of your iPhone, iPad, and Mac. It powers incredible new features '
    'that understand and create language and images, take action across apps, and draw from '
    'personal context to simplify and accelerate everyday tasks.';

class SummarizeDemo extends StatefulWidget {
  const SummarizeDemo({super.key});

  @override
  State<SummarizeDemo> createState() => _SummarizeDemoState();
}

class _SummarizeDemoState extends State<SummarizeDemo> {
  final _controller = TextEditingController(text: _defaultText);
  final _ai = FlutterOndeviceAi.instance;
  String _inputType = 'article';
  String _outputType = 'oneBullet';
  bool _loading = false;
  SummarizeResult? _result;
  DebugLog? _debugLog;

  SummarizeOutputType get _outputEnum => switch (_outputType) {
        'twoBullets' => SummarizeOutputType.twoBullets,
        'threeBullets' => SummarizeOutputType.threeBullets,
        _ => SummarizeOutputType.oneBullet,
      };

  SummarizeInputType get _inputEnum => _inputType == 'conversation'
      ? SummarizeInputType.conversation
      : SummarizeInputType.article;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    final options = SummarizeOptions(outputType: _outputEnum, inputType: _inputEnum);
    try {
      final result = await _ai.summarize(_controller.text, options: options);
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(
          api: 'summarize',
          request: {'text': _controller.text.substring(0, 100), 'options': {'outputType': _outputType, 'inputType': _inputType}},
          response: {'summary': result.summary, 'originalLength': result.originalLength, 'summaryLength': result.summaryLength},
          timing: sw.elapsedMilliseconds,
        );
        _loading = false;
      });
    } catch (e) {
      sw.stop();
      setState(() { _loading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('INPUT TYPE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _segmented(['article', 'conversation'], ['Article', 'Conversation'], _inputType, (v) => setState(() => _inputType = v)),
        const SizedBox(height: 16),
        const Text('OUTPUT TYPE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _segmented(['oneBullet', 'twoBullets', 'threeBullets'], ['1 Bullet', '2 Bullets', '3 Bullets'], _outputType, (v) => setState(() => _outputType = v)),
        const SizedBox(height: 16),
        TextField(
          controller: _controller,
          maxLines: 5,
          decoration: InputDecoration(
            hintText: 'Enter text to summarize...',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        RunButton(label: 'Summarize', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  StatBadge(label: 'Original', value: '${_result!.originalLength} chars'),
                  const SizedBox(width: 8),
                  StatBadge(label: 'Summary', value: '${_result!.summaryLength} chars'),
                ]),
                const SizedBox(height: 12),
                SelectableText(_result!.summary, style: const TextStyle(fontSize: 15, height: 1.47)),
              ],
            ),
          ),
        ],
        DebugLogPanel(log: _debugLog),
      ],
    );
  }

  Widget _segmented(List<String> values, List<String> labels, String selected, ValueChanged<String> onChanged) {
    return Row(
      children: List.generate(values.length, (i) {
        final isSelected = values[i] == selected;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(values[i]),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              margin: EdgeInsets.only(right: i < values.length - 1 ? 8 : 0),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF007AFF) : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA)),
              ),
              alignment: Alignment.center,
              child: Text(labels[i], style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333))),
            ),
          ),
        );
      }),
    );
  }
}
