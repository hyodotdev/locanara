import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';

const _styles = [
  ('elaborate', 'Elaborate'),
  ('emojify', 'Emojify'),
  ('shorten', 'Shorten'),
  ('friendly', 'Friendly'),
  ('professional', 'Professional'),
  ('rephrase', 'Rephrase'),
];

class RewriteDemo extends StatefulWidget {
  const RewriteDemo({super.key});

  @override
  State<RewriteDemo> createState() => _RewriteDemoState();
}

class _RewriteDemoState extends State<RewriteDemo> {
  final _controller = TextEditingController(text: 'Hey, just wanted to let you know that the project is going well and we should be done soon.');
  final _ai = FlutterOndeviceAi.instance;
  String _style = 'professional';
  bool _loading = false;
  RewriteResult? _result;
  DebugLog? _debugLog;

  RewriteOutputType get _outputType => switch (_style) {
        'elaborate' => RewriteOutputType.elaborate,
        'emojify' => RewriteOutputType.emojify,
        'shorten' => RewriteOutputType.shorten,
        'friendly' => RewriteOutputType.friendly,
        'professional' => RewriteOutputType.professional,
        _ => RewriteOutputType.rephrase,
      };

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    try {
      final result = await _ai.rewrite(_controller.text, options: RewriteOptions(outputType: _outputType));
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(api: 'rewrite', request: {'text': _controller.text, 'style': _style}, response: {'rewrittenText': result.rewrittenText, 'alternatives': result.alternatives}, timing: sw.elapsedMilliseconds);
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
        const Text('STYLE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _styleGrid(),
        const SizedBox(height: 16),
        TextField(controller: _controller, maxLines: 4, decoration: _inputDecoration('Enter text to rewrite...')),
        const SizedBox(height: 12),
        RunButton(label: 'Rewrite', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(_result!.rewrittenText, style: const TextStyle(fontSize: 15, height: 1.47)),
                if (_result!.alternatives != null && _result!.alternatives!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: Color(0xFFE5E5EA)),
                  const SizedBox(height: 12),
                  const Text('ALTERNATIVES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF636366), letterSpacing: 0.5)),
                  const SizedBox(height: 8),
                  ...(_result!.alternatives!.map((alt) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(alt, style: const TextStyle(fontSize: 14, color: Color(0xFF666666), height: 1.43)),
                  ))),
                ],
              ],
            ),
          ),
        ],
        DebugLogPanel(log: _debugLog),
      ],
    );
  }

  Widget _styleGrid() {
    return Column(
      children: [
        Row(children: _styles.sublist(0, 3).map((s) => _styleChip(s)).toList()),
        const SizedBox(height: 8),
        Row(children: _styles.sublist(3).map((s) => _styleChip(s)).toList()),
      ],
    );
  }

  Widget _styleChip((String, String) style) {
    final (value, label) = style;
    final isSelected = value == _style;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _style = value),
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
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint, filled: true, fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
  );

}
