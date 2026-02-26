import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/run_button.dart';
import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class GuardrailDemo extends StatefulWidget {
  const GuardrailDemo({super.key});

  @override
  State<GuardrailDemo> createState() => _GuardrailDemoState();
}

class _GuardrailDemoState extends State<GuardrailDemo> {
  final _controller = TextEditingController(text: 'Summarize this article for me.');
  final _ai = FlutterOndeviceAi.instance;
  double _maxLength = 500;
  final _blockedPatterns = ['password', 'ssn', 'credit card'];
  bool _loading = false;
  String? _resultText;
  String? _errorText;
  int? _timing;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _resultText = null; _errorText = null; _timing = null; });

    final text = _controller.text;
    if (text.length > _maxLength.toInt()) {
      setState(() { _errorText = 'Input too long: ${text.length} chars exceeds limit of ${_maxLength.toInt()}'; _loading = false; });
      return;
    }

    final lower = text.toLowerCase();
    for (final pattern in _blockedPatterns) {
      if (lower.contains(pattern)) {
        setState(() { _errorText = 'Content blocked: contains "$pattern"'; _loading = false; });
        return;
      }
    }

    final sw = Stopwatch()..start();
    try {
      final result = await _ai.chat(text, options: const ChatOptions(systemPrompt: 'You are a helpful assistant.'));
      sw.stop();
      setState(() { _resultText = result.message; _timing = sw.elapsedMilliseconds; _loading = false; });
    } catch (e) {
      sw.stop();
      setState(() { _errorText = 'Error: $e'; _loading = false; });
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
          code: '''// Swift - Guardrail
let guardrail = InputLengthGuardrail(maxLength: 500)
let chain = GuardedChain(
  chain: SummarizeChain(model: model),
  guardrails: [guardrail]
)
let result = try await chain.run("text")''',
        ),
        const Text('MAX LENGTH', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: _maxLength,
                min: 50,
                max: 2000,
                divisions: 39,
                activeColor: const Color(0xFF007AFF),
                onChanged: (v) => setState(() => _maxLength = v),
              ),
            ),
            SizedBox(width: 60, child: Text('${_maxLength.toInt()}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
          ],
        ),
        const SizedBox(height: 8),
        const Text('BLOCKED PATTERNS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          children: _blockedPatterns.map((p) => Chip(
            label: Text(p, style: const TextStyle(fontSize: 12)),
            backgroundColor: const Color(0xFFFFEBEE),
            side: BorderSide.none,
          )).toList(),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _controller,
          maxLines: 3,
          decoration: _inputDecoration('Enter text...'),
          onChanged: (_) => setState(() {}),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${_controller.text.length}/${_maxLength.toInt()} chars',
            style: TextStyle(fontSize: 12, color: _controller.text.length > _maxLength ? const Color(0xFFFF3B30) : const Color(0xFF666666)),
          ),
        ),
        const SizedBox(height: 12),
        RunButton(label: 'Run with Guardrails', loading: _loading, onPressed: _run),
        if (_errorText != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFFFFEBEE), borderRadius: BorderRadius.circular(10)),
            child: Row(
              children: [
                const Icon(Icons.block, color: Color(0xFFFF3B30)),
                const SizedBox(width: 12),
                Expanded(child: Text(_errorText!, style: const TextStyle(fontSize: 14, color: Color(0xFFFF3B30)))),
              ],
            ),
          ),
        ],
        if (_resultText != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_timing != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: StatBadge(label: 'Time', value: '${_timing}ms')),
                SelectableText(_resultText!, style: const TextStyle(fontSize: 15, height: 1.47)),
              ],
            ),
          ),
        ],
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint, filled: true, fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
  );

}
