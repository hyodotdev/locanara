import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/run_button.dart';
import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class ChainDemo extends StatefulWidget {
  const ChainDemo({super.key});

  @override
  State<ChainDemo> createState() => _ChainDemoState();
}

class _ChainDemoState extends State<ChainDemo> {
  final _controller = TextEditingController(text: 'Apple announced the new M4 chip today, featuring a 10-core CPU and 16-core GPU that delivers unprecedented performance for professional workflows.');
  final _ai = FlutterOndeviceAi.instance;
  String _chainType = 'sequential';
  bool _loading = false;
  List<(String, String)> _steps = [];
  int? _timing;

  Future<void> _run() async {
    if (_loading || _controller.text.isEmpty) return;
    setState(() { _loading = true; _steps = []; _timing = null; });
    final sw = Stopwatch()..start();

    try {
      if (_chainType == 'sequential') {
        final summary = await _ai.summarize(_controller.text, options: const SummarizeOptions(outputType: SummarizeOutputType.oneBullet));
        final classify = await _ai.classify(summary.summary, options: const ClassifyOptions(categories: ['Technology', 'Business', 'Science', 'Entertainment']));
        sw.stop();
        setState(() {
          _steps = [('Summarize', summary.summary), ('Classify', classify.classifications.map((c) => '${c.label}: ${(c.score * 100).toStringAsFixed(0)}%').join(', '))];
        });
      } else if (_chainType == 'parallel') {
        final results = await Future.wait([
          _ai.summarize(_controller.text),
          _ai.classify(_controller.text, options: const ClassifyOptions(categories: ['Technology', 'Business', 'Science'])),
        ]);
        sw.stop();
        final summary = results[0] as SummarizeResult;
        final classify = results[1] as ClassifyResult;
        setState(() {
          _steps = [('Summarize (parallel)', summary.summary), ('Classify (parallel)', classify.classifications.map((c) => '${c.label}: ${(c.score * 100).toStringAsFixed(0)}%').join(', '))];
        });
      } else {
        final classify = await _ai.classify(_controller.text, options: const ClassifyOptions(categories: ['Technology', 'Business', 'Science', 'Entertainment']));
        final topCategory = classify.classifications.isNotEmpty ? classify.classifications.first.label : 'Unknown';
        final rewrite = await _ai.rewrite(_controller.text, options: RewriteOptions(outputType: topCategory == 'Technology' ? RewriteOutputType.professional : RewriteOutputType.friendly));
        sw.stop();
        setState(() {
          _steps = [('Classify (condition)', topCategory), ('Rewrite (${topCategory == 'Technology' ? 'professional' : 'friendly'})', rewrite.rewrittenText)];
        });
      }
      setState(() { _timing = sw.elapsedMilliseconds; _loading = false; });
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
          code: '''// Swift - SequentialChain
let pipeline = SequentialChain(chains: [
  SummarizeChain(model: model),
  ClassifyChain(model: model),
])
let result = try await pipeline.run("text")''',
        ),
        const Text('CHAIN TYPE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        _typeRow(),
        const SizedBox(height: 16),
        TextField(controller: _controller, maxLines: 4, decoration: _inputDecoration('Enter text...')),
        const SizedBox(height: 12),
        RunButton(label: 'Run Chain', loading: _loading, onPressed: _run),
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
                      StatBadge(label: 'Chain', value: _chainType),
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

  Widget _typeRow() {
    const types = [('sequential', 'Sequential'), ('parallel', 'Parallel'), ('conditional', 'Conditional')];
    return Row(
      children: types.map((t) {
        final (value, label) = t;
        final isSelected = value == _chainType;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _chainType = value),
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
