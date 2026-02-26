import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';

const _entityColors = {
  'person': Color(0xFF007AFF),
  'email': Color(0xFFFF9500),
  'phone': Color(0xFF34C759),
  'date': Color(0xFFAF52DE),
  'location': Color(0xFFFF3B30),
};

class ExtractDemo extends StatefulWidget {
  const ExtractDemo({super.key});

  @override
  State<ExtractDemo> createState() => _ExtractDemoState();
}

class _ExtractDemoState extends State<ExtractDemo> {
  final _controller = TextEditingController(text: 'John Smith works at Apple Inc. Contact him at john@apple.com or call (555) 123-4567. Meeting on March 15th in Cupertino.');
  final _ai = FlutterOndeviceAi.instance;
  bool _loading = false;
  ExtractResult? _result;
  DebugLog? _debugLog;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    try {
      final result = await _ai.extract(_controller.text, options: const ExtractOptions(entityTypes: ['person', 'email', 'phone', 'date', 'location']));
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(api: 'extract', request: {'text': _controller.text}, response: {'entities': result.entities.map((e) => {'value': e.value, 'type': e.type, 'confidence': e.confidence}).toList()}, timing: sw.elapsedMilliseconds);
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
        TextField(controller: _controller, maxLines: 4, decoration: _inputDecoration('Enter text to extract entities...')),
        const SizedBox(height: 12),
        RunButton(label: 'Extract', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              children: _result!.entities.map((entity) {
                final color = _entityColors[entity.type] ?? const Color(0xFF8E8E93);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
                        child: Text(entity.type, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(child: Text(entity.value, style: const TextStyle(fontSize: 15))),
                      Text('${(entity.confidence * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 13, color: Color(0xFF666666))),
                    ],
                  ),
                );
              }).toList(),
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
