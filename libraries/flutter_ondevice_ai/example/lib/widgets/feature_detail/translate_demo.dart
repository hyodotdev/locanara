import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';
import '../shared/stat_badge.dart';

const _languages = [
  ('en', 'English'),
  ('ko', 'Korean'),
  ('ja', 'Japanese'),
  ('zh', 'Chinese'),
  ('es', 'Spanish'),
  ('fr', 'French'),
  ('de', 'German'),
];

class TranslateDemo extends StatefulWidget {
  const TranslateDemo({super.key});

  @override
  State<TranslateDemo> createState() => _TranslateDemoState();
}

class _TranslateDemoState extends State<TranslateDemo> {
  final _controller = TextEditingController(text: 'Hello, how are you? I hope you are having a great day.');
  final _ai = FlutterOndeviceAi.instance;
  String _targetLang = 'ko';
  bool _loading = false;
  TranslateResult? _result;
  DebugLog? _debugLog;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    try {
      final result = await _ai.translate(_controller.text, options: TranslateOptions(sourceLanguage: 'en', targetLanguage: _targetLang));
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(api: 'translate', request: {'text': _controller.text, 'source': 'en', 'target': _targetLang}, response: {'translatedText': result.translatedText, 'sourceLanguage': result.sourceLanguage, 'targetLanguage': result.targetLanguage}, timing: sw.elapsedMilliseconds);
        _loading = false;
      });
    } catch (e) {
      sw.stop();
      setState(() { _loading = false; });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('TARGET LANGUAGE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _languages.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final (code, label) = _languages[i];
              final isSelected = code == _targetLang;
              return GestureDetector(
                onTap: () => setState(() => _targetLang = code),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF007AFF) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA)),
                  ),
                  alignment: Alignment.center,
                  child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333))),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        TextField(controller: _controller, maxLines: 4, decoration: _inputDecoration('Enter text to translate...')),
        const SizedBox(height: 12),
        RunButton(label: 'Translate', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  StatBadge(label: 'From', value: _result!.sourceLanguage),
                  const SizedBox(width: 8),
                  StatBadge(label: 'To', value: _result!.targetLanguage),
                ]),
                const SizedBox(height: 12),
                SelectableText(_result!.translatedText, style: const TextStyle(fontSize: 15, height: 1.47)),
              ],
            ),
          ),
        ],
        DebugLogPanel(log: _debugLog),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint, filled: true, fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
  );

}
