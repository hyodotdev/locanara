import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';
import '../shared/stat_badge.dart';

const _correctionColors = {
  'grammar': Color(0xFF007AFF),
  'spelling': Color(0xFFFF9500),
  'punctuation': Color(0xFFAF52DE),
  'style': Color(0xFF34C759),
};

class ProofreadDemo extends StatefulWidget {
  const ProofreadDemo({super.key});

  @override
  State<ProofreadDemo> createState() => _ProofreadDemoState();
}

class _ProofreadDemoState extends State<ProofreadDemo> {
  final _controller = TextEditingController(text: 'Their going to the store tommorow and they will buys some grocerys for the party.');
  final _ai = FlutterOndeviceAi.instance;
  bool _loading = false;
  ProofreadResult? _result;
  DebugLog? _debugLog;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    try {
      final result = await _ai.proofread(_controller.text);
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(api: 'proofread', request: {'text': _controller.text}, response: {'correctedText': result.correctedText, 'corrections': result.corrections.length}, timing: sw.elapsedMilliseconds);
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
        TextField(controller: _controller, maxLines: 4, decoration: _inputDecoration('Enter text with errors...')),
        const SizedBox(height: 12),
        RunButton(label: 'Proofread', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  StatBadge(label: 'Corrections', value: '${_result!.corrections.length}'),
                ]),
                const SizedBox(height: 12),
                const Text('CORRECTED TEXT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF636366), letterSpacing: 0.5)),
                const SizedBox(height: 4),
                SelectableText(_result!.correctedText, style: const TextStyle(fontSize: 15, color: Color(0xFF34C759), fontWeight: FontWeight.w500, height: 1.47)),
                if (_result!.corrections.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('DETAILS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF636366), letterSpacing: 0.5)),
                  const SizedBox(height: 8),
                  ..._result!.corrections.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              children: [
                                TextSpan(text: c.original, style: const TextStyle(fontSize: 14, color: Color(0xFFFF3B30), decoration: TextDecoration.lineThrough)),
                                const TextSpan(text: ' \u2192 ', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                                TextSpan(text: c.corrected, style: const TextStyle(fontSize: 14, color: Color(0xFF34C759), fontWeight: FontWeight.w500)),
                              ],
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _correctionColors[c.type] ?? const Color(0xFF8E8E93),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(c.type ?? 'other', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
                        ),
                      ],
                    ),
                  )),
                ],
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
