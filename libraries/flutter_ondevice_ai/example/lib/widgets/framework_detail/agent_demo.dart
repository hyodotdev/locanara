import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/run_button.dart';
import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

const _documents = [
  'Locanara is an on-device AI framework for iOS, Android, and Web. It provides composable chains, memory management, guardrails, and a pipeline DSL.',
  'Apple Intelligence uses Foundation Models to power features like summarization, rewriting, and proofreading directly on iPhone, iPad, and Mac.',
  'Gemini Nano is Google\'s smallest AI model, designed to run directly on mobile devices. It powers features in Android 14+ through the ML Kit API.',
  'On-device AI processes data locally without sending it to the cloud, ensuring privacy and low latency. It works offline and reduces server costs.',
];

class AgentDemo extends StatefulWidget {
  const AgentDemo({super.key});

  @override
  State<AgentDemo> createState() => _AgentDemoState();
}

class _AgentDemoState extends State<AgentDemo> {
  final _controller = TextEditingController();
  final _ai = FlutterOndeviceAi.instance;
  bool _loading = false;
  final _trace = <_Step>[];
  String? _finalAnswer;
  int? _timing;

  final _suggestions = ['What is Locanara?', 'How does on-device AI work?', 'Tell me about Gemini Nano'];

  Future<void> _run(String query) async {
    if (_loading || query.isEmpty) return;
    setState(() { _loading = true; _trace.clear(); _finalAnswer = null; _timing = null; });
    final sw = Stopwatch()..start();

    try {
      setState(() => _trace.add(_Step('Thought', 'I need to search for relevant documents about "$query"')));

      final keywords = query.toLowerCase().split(' ').where((w) => w.length > 3).toList();
      final matches = _documents.where((doc) {
        final lower = doc.toLowerCase();
        return keywords.any((k) => lower.contains(k));
      }).toList();

      setState(() => _trace.add(_Step('Action', 'SearchDocuments("${keywords.join(", ")}")')));
      setState(() => _trace.add(_Step('Observation', matches.isEmpty ? 'No relevant documents found.' : 'Found ${matches.length} document(s):\n${matches.map((d) => '- ${d.substring(0, 80)}...').join('\n')}')));

      if (matches.isNotEmpty) {
        setState(() => _trace.add(_Step('Thought', 'I found relevant information. Let me process it with AI.')));
        final context = matches.join('\n\n');
        final result = await _ai.chat(
          'Based on the following context, answer the question: "$query"\n\nContext:\n$context',
          options: const ChatOptions(systemPrompt: 'You are a helpful assistant. Answer based only on the provided context. Be concise.'),
        );
        setState(() => _finalAnswer = result.message);
      } else {
        final result = await _ai.chat(query, options: const ChatOptions(systemPrompt: 'You are a helpful assistant. Keep your answer concise.'));
        setState(() => _finalAnswer = result.message);
      }
      sw.stop();
      setState(() { _timing = sw.elapsedMilliseconds; _loading = false; });
    } catch (e) {
      sw.stop();
      setState(() { _finalAnswer = 'Error: $e'; _loading = false; });
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
          code: '''// Swift - ReAct Agent
let agent = Agent(
  model: model,
  tools: [SearchTool(), SummarizeTool()],
  maxSteps: 5
)
let result = try await agent.run("query")
// Traces: Thought -> Action -> Observation''',
        ),
        const Text('SUGGESTIONS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _suggestions.map((s) => ActionChip(
            label: Text(s, style: const TextStyle(fontSize: 13)),
            onPressed: _loading ? null : () { _controller.text = s; _run(s); },
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFE5E5EA)),
          )).toList(),
        ),
        const SizedBox(height: 16),
        TextField(controller: _controller, decoration: _inputDecoration('Ask a question...')),
        const SizedBox(height: 12),
        RunButton(label: 'Run Agent', loading: _loading, onPressed: () => _run(_controller.text)),
        if (_trace.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('REASONING TRACE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
          const SizedBox(height: 8),
          ..._trace.map((step) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: switch (step.type) {
                'Thought' => const Color(0xFF007AFF),
                'Action' => const Color(0xFFFF9500),
                _ => const Color(0xFF34C759),
              }.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(step.type, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: switch (step.type) {
                  'Thought' => const Color(0xFF007AFF),
                  'Action' => const Color(0xFFFF9500),
                  _ => const Color(0xFF34C759),
                })),
                const SizedBox(height: 4),
                Text(step.content, style: const TextStyle(fontSize: 14, color: Color(0xFF333333), height: 1.43)),
              ],
            ),
          )),
        ],
        if (_finalAnswer != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_timing != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: StatBadge(label: 'Time', value: '${_timing}ms')),
                const Text('FINAL ANSWER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF636366), letterSpacing: 0.5)),
                const SizedBox(height: 8),
                SelectableText(_finalAnswer!, style: const TextStyle(fontSize: 15, height: 1.47)),
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

class _Step {
  final String type;
  final String content;
  _Step(this.type, this.content);
}
