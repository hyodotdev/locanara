import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/run_button.dart';
import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class ModelDemo extends StatefulWidget {
  const ModelDemo({super.key});

  @override
  State<ModelDemo> createState() => _ModelDemoState();
}

class _ModelDemoState extends State<ModelDemo> {
  final _controller = TextEditingController(text: 'What is on-device AI and why is it important?');
  final _ai = FlutterOndeviceAi.instance;
  String _preset = 'structured';
  bool _streaming = false;
  bool _loading = false;
  String _output = '';
  int? _timing;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _output = ''; _timing = null; });
    final sw = Stopwatch()..start();

    final systemPrompt = switch (_preset) {
      'creative' => 'You are a creative writer. Be expressive and use vivid language.',
      'conversational' => 'You are a friendly conversational partner. Be casual and warm.',
      _ => 'You are a helpful assistant. Be precise and structured.',
    };

    try {
      if (_streaming) {
        await _ai.chatStream(_controller.text, options: ChatStreamOptions(
          systemPrompt: systemPrompt,
          onChunk: (chunk) {
            setState(() { _output = chunk.accumulated; });
          },
        ));
      } else {
        final result = await _ai.chat(_controller.text, options: ChatOptions(systemPrompt: systemPrompt));
        setState(() { _output = result.message; });
      }
      sw.stop();
      setState(() { _timing = sw.elapsedMilliseconds; _loading = false; });
    } catch (e) {
      sw.stop();
      setState(() { _output = 'Error: $e'; _loading = false; });
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
          code: '''// Swift
let model = FoundationLanguageModel()
let response = try await model.generate(
  "What is AI?",
  config: .structured
)

// Kotlin
val model = PromptApiModel(context)
val response = model.generate(
  "What is AI?",
  GenerationConfig.STRUCTURED
)''',
        ),
        const Text('PRESET', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _presetRow(),
        const SizedBox(height: 16),
        Row(
          children: [
            const Text('Streaming', style: TextStyle(fontSize: 15)),
            const Spacer(),
            Switch(value: _streaming, onChanged: (v) => setState(() => _streaming = v), activeColor: const Color(0xFF007AFF)),
          ],
        ),
        const SizedBox(height: 8),
        TextField(controller: _controller, maxLines: 3, decoration: _inputDecoration('Enter a prompt...')),
        const SizedBox(height: 12),
        RunButton(label: 'Generate', loading: _loading, onPressed: _run),
        if (_output.isNotEmpty) ...[
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
                    child: Row(
                      children: [
                        StatBadge(label: 'Time', value: '${_timing}ms'),
                        const SizedBox(width: 8),
                        StatBadge(label: 'Config', value: _preset),
                        const SizedBox(width: 8),
                        StatBadge(label: 'Mode', value: _streaming ? 'Stream' : 'Batch'),
                      ],
                    ),
                  ),
                SelectableText(_output, style: const TextStyle(fontSize: 15, height: 1.47)),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _presetRow() {
    const presets = [('structured', 'Structured'), ('creative', 'Creative'), ('conversational', 'Conversational')];
    return Row(
      children: presets.map((p) {
        final (value, label) = p;
        final isSelected = value == _preset;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _preset = value),
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
