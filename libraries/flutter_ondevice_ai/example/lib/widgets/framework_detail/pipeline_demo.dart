import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/run_button.dart';
import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class PipelineDemo extends StatefulWidget {
  const PipelineDemo({super.key});

  @override
  State<PipelineDemo> createState() => _PipelineDemoState();
}

class _PipelineDemoState extends State<PipelineDemo> {
  final _controller = TextEditingController(text: 'Their going to the store tommorow and they will buys some grocerys for the party.');
  final _ai = FlutterOndeviceAi.instance;
  String _targetLang = 'ko';
  bool _loading = false;
  List<(String, String)> _steps = [];
  int? _timing;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _steps = []; _timing = null; });
    final sw = Stopwatch()..start();

    try {
      final proofread = await _ai.proofread(_controller.text);
      final translate = await _ai.translate(proofread.correctedText, options: TranslateOptions(sourceLanguage: 'en', targetLanguage: _targetLang));
      sw.stop();
      setState(() {
        _steps = [('Proofread', proofread.correctedText), ('Translate (\u2192 $_targetLang)', translate.translatedText)];
        _timing = sw.elapsedMilliseconds;
        _loading = false;
      });
    } catch (e) {
      sw.stop();
      setState(() { _steps = [('Error', e.toString())]; _loading = false; });
    }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const CodePatternCard(
          title: 'Native Code Pattern',
          code: '''// Swift - Pipeline DSL
let result = try await model.pipeline {
  Proofread()
  Translate(to: "ko")
}.run("text with typos")''',
        ),
        const Text('TARGET LANGUAGE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _langRow(),
        const SizedBox(height: 16),
        TextField(controller: _controller, maxLines: 3, decoration: _inputDecoration('Enter text with typos...')),
        const SizedBox(height: 12),
        RunButton(label: 'Run Pipeline', loading: _loading, onPressed: _run),
        if (_steps.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_timing != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(children: [
                      StatBadge(label: 'Time', value: '${_timing}ms'),
                      const SizedBox(width: 8),
                      StatBadge(label: 'Steps', value: '${_steps.length}'),
                    ]),
                  ),
                ..._steps.asMap().entries.map((entry) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (entry.key > 0) const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1, color: Color(0xFFE5E5EA))),
                    Text(entry.value.$1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF007AFF))),
                    const SizedBox(height: 4),
                    Text(entry.value.$2, style: const TextStyle(fontSize: 15, color: Color(0xFF333333), height: 1.47)),
                  ],
                )),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _langRow() {
    const langs = [('ko', 'Korean'), ('ja', 'Japanese'), ('es', 'Spanish'), ('fr', 'French')];
    return Row(
      children: langs.map((l) {
        final (code, label) = l;
        final isSelected = code == _targetLang;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _targetLang = code),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF007AFF) : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA)),
              ),
              alignment: Alignment.center,
              child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333))),
            ),
          ),
        );
      }).toList(),
    );
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint, filled: true, fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
  );

}
