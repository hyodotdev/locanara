import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/debug_log_panel.dart';
import '../shared/run_button.dart';

const _defaultCategories = [
  'Technology',
  'Sports',
  'Entertainment',
  'Business',
  'Health',
];

class ClassifyDemo extends StatefulWidget {
  const ClassifyDemo({super.key});

  @override
  State<ClassifyDemo> createState() => _ClassifyDemoState();
}

class _ClassifyDemoState extends State<ClassifyDemo> {
  final _textController = TextEditingController(text: 'The new iPhone features a faster chip and improved camera system.');
  final _customController = TextEditingController();
  final _ai = FlutterOndeviceAi.instance;
  final _selectedCategories = List<String>.from(_defaultCategories);
  bool _loading = false;
  ClassifyResult? _result;
  DebugLog? _debugLog;

  Future<void> _run() async {
    if (_loading || _textController.text.isEmpty || _selectedCategories.isEmpty) return;
    setState(() { _loading = true; _result = null; _debugLog = null; });
    final sw = Stopwatch()..start();
    try {
      final result = await _ai.classify(_textController.text, options: ClassifyOptions(categories: _selectedCategories));
      sw.stop();
      setState(() {
        _result = result;
        _debugLog = DebugLog(api: 'classify', request: {'text': _textController.text, 'categories': _selectedCategories}, response: {'classifications': result.classifications.map((c) => {'label': c.label, 'score': c.score}).toList()}, timing: sw.elapsedMilliseconds);
        _loading = false;
      });
    } catch (e) {
      sw.stop();
      setState(() { _loading = false; });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _toggleCategory(String category) {
    setState(() {
      if (_selectedCategories.contains(category)) {
        _selectedCategories.remove(category);
      } else {
        _selectedCategories.add(category);
      }
    });
  }

  void _addCustomCategory() {
    final custom = _customController.text.trim();
    if (custom.isEmpty || _selectedCategories.contains(custom)) return;
    setState(() {
      _selectedCategories.add(custom);
      _customController.clear();
    });
  }

  @override
  void dispose() { _textController.dispose(); _customController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('CATEGORIES', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _defaultCategories.map((cat) {
            final selected = _selectedCategories.contains(cat);
            return FilterChip(
              label: Text(cat),
              selected: selected,
              onSelected: (_) => _toggleCategory(cat),
              selectedColor: const Color(0xFF007AFF).withValues(alpha: 0.15),
              checkmarkColor: const Color(0xFF007AFF),
              labelStyle: TextStyle(
                color: selected ? const Color(0xFF007AFF) : const Color(0xFF333333),
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _customController,
                decoration: InputDecoration(
                  hintText: 'Add custom category...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                onSubmitted: (_) => _addCustomCategory(),
              ),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: _customController.text.trim().isEmpty ? null : _addCustomCategory,
              child: const Text('Add', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        if (_selectedCategories.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'Selected: ${_selectedCategories.join(', ')}',
            style: const TextStyle(fontSize: 13, color: Color(0xFF007AFF)),
          ),
        ],
        const SizedBox(height: 16),
        TextField(controller: _textController, maxLines: 4, decoration: _inputDecoration('Enter text to classify...')),
        const SizedBox(height: 12),
        RunButton(label: 'Classify', loading: _loading, onPressed: _run),
        if (_result != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Column(
              children: _result!.classifications.asMap().entries.map((entry) {
                final c = entry.value;
                final isTop = entry.key == 0;
                return Padding(
                  padding: EdgeInsets.only(top: entry.key > 0 ? 8 : 0),
                  child: Row(
                    children: [
                      SizedBox(width: 80, child: Text(c.label, style: TextStyle(fontSize: 14, fontWeight: isTop ? FontWeight.w600 : FontWeight.normal))),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: c.score,
                            backgroundColor: const Color(0xFFF2F2F7),
                            color: isTop ? const Color(0xFF007AFF) : const Color(0xFFC7C7CC),
                            minHeight: 8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${(c.score * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
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
