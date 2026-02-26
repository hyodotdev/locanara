import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class MemoryDemo extends StatefulWidget {
  const MemoryDemo({super.key});

  @override
  State<MemoryDemo> createState() => _MemoryDemoState();
}

class _MemoryDemoState extends State<MemoryDemo> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _ai = FlutterOndeviceAi.instance;
  final _messages = <_Msg>[];
  String _memoryType = 'buffer';
  bool _loading = false;
  final int _maxEntries = 4;

  List<ChatMessage> get _contextHistory {
    final history = _messages.map((m) => ChatMessage(role: m.role == 'user' ? ChatRole.user : ChatRole.assistant, content: m.content)).toList();
    return history.length > _maxEntries ? history.sublist(history.length - _maxEntries) : history;
  }

  int get _tokenEstimate => _contextHistory.fold(0, (sum, m) => sum + (m.content.length / 4).ceil());

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _loading) return;
    _controller.clear();
    setState(() {
      _messages.add(_Msg('user', text));
      _loading = true;
    });
    _scroll();

    final history = _contextHistory;
    try {
      final result = await _ai.chat(text, options: ChatOptions(
        systemPrompt: 'You are a helpful assistant. Keep responses concise. Always reference what the user previously said when possible.',
        history: history.sublist(0, history.length > 1 ? history.length - 1 : 0),
      ));
      setState(() { _messages.add(_Msg('assistant', result.message)); _loading = false; });
    } catch (e) {
      setState(() { _messages.add(_Msg('assistant', 'Error: $e')); _loading = false; });
    }
    _scroll();
  }

  void _scroll() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  @override
  void dispose() { _controller.dispose(); _scrollController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            children: [
              const CodePatternCard(
                title: 'Native Code Pattern',
                code: '''// Swift
let memory = BufferMemory(maxEntries: 4)
let chain = ChatChain(
  model: model, memory: memory
)
// Each call auto-stores context
let r1 = try await chain.run("Hello")
let r2 = try await chain.run("Follow up")
memory.entries  // last 4 entries''',
              ),
              Row(
                children: [('buffer', 'Buffer'), ('summary', 'Summary')].map((t) {
                  final (value, label) = t;
                  final isSelected = value == _memoryType;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _memoryType = value),
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF007AFF) : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA)),
                        ),
                        alignment: Alignment.center,
                        child: Text('${label}Memory', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333))),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lightbulb, size: 18, color: Color(0xFF007AFF)),
                        const SizedBox(width: 8),
                        const Expanded(child: Text('Memory Inspector', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
                        StatBadge(label: 'Entries', value: '${_contextHistory.length}'),
                        const SizedBox(width: 4),
                        StatBadge(label: 'Tokens', value: '~$_tokenEstimate'),
                      ],
                    ),
                    if (_contextHistory.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      ..._contextHistory.map((entry) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 22, height: 22,
                              decoration: BoxDecoration(
                                color: entry.role == ChatRole.user ? const Color(0xFF007AFF) : const Color(0xFF34C759),
                                shape: BoxShape.circle,
                              ),
                              child: Center(child: Text(entry.role == ChatRole.user ? 'U' : 'A', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white))),
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(entry.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Color(0xFF666666), height: 1.38))),
                          ],
                        ),
                      )),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 8),
              ..._messages.map((msg) => Align(
                alignment: msg.role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  decoration: BoxDecoration(
                    color: msg.role == 'user' ? const Color(0xFF007AFF) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(msg.content, style: TextStyle(fontSize: 15, color: msg.role == 'user' ? Colors.white : const Color(0xFF333333), height: 1.47)),
                ),
              )),
              if (_loading) Row(children: [
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF007AFF))),
                const SizedBox(width: 8),
                const Text('Thinking...', style: TextStyle(fontSize: 13, color: Color(0xFF999999))),
              ]),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFE5E5EA), width: 0.5))),
          child: Row(
            children: [
              if (_messages.isNotEmpty)
                IconButton(icon: const Icon(Icons.delete, color: Color(0xFFFF3B30)), onPressed: () => setState(() => _messages.clear())),
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    hintText: 'Type a message...', filled: true, fillColor: const Color(0xFFF2F2F7),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  ),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _send,
                child: Container(
                  width: 40, height: 40,
                  decoration: const BoxDecoration(color: Color(0xFF007AFF), shape: BoxShape.circle),
                  child: const Icon(Icons.send, size: 20, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Msg {
  final String role;
  final String content;
  _Msg(this.role, this.content);
}
