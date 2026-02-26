import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

import '../shared/stat_badge.dart';
import 'code_pattern_card.dart';

class SessionDemo extends StatefulWidget {
  const SessionDemo({super.key});

  @override
  State<SessionDemo> createState() => _SessionDemoState();
}

class _SessionDemoState extends State<SessionDemo> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _ai = FlutterOndeviceAi.instance;
  final _messages = <_Msg>[];
  bool _loading = false;
  bool _showMemory = false;
  final int _maxMemoryEntries = 6;

  List<ChatMessage> get _contextHistory {
    final history = _messages.map((m) => ChatMessage(role: m.role == 'user' ? ChatRole.user : ChatRole.assistant, content: m.content)).toList();
    return history.length > _maxMemoryEntries ? history.sublist(history.length - _maxMemoryEntries) : history;
  }

  int get _tokenEstimate => _contextHistory.fold(0, (sum, m) => sum + (m.content.length / 4).ceil());

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _loading) return;
    _controller.clear();
    setState(() { _messages.add(_Msg('user', text)); _loading = true; });
    _scroll();

    final history = [..._messages.map((m) => ChatMessage(role: m.role == 'user' ? ChatRole.user : ChatRole.assistant, content: m.content))];
    final contextHistory = history.length > _maxMemoryEntries ? history.sublist(history.length - _maxMemoryEntries) : history;

    try {
      setState(() => _messages.add(_Msg('assistant', '...')));
      var accumulated = '';
      await _ai.chatStream(text, options: ChatStreamOptions(
        systemPrompt: 'You are a helpful assistant. Keep responses concise.',
        history: contextHistory.sublist(0, contextHistory.length > 1 ? contextHistory.length - 1 : 0),
        onChunk: (chunk) {
          accumulated = chunk.accumulated;
          setState(() { _messages.last = _Msg('assistant', accumulated); });
          _scroll();
        },
      ));
    } catch (e) {
      setState(() { _messages.last = _Msg('assistant', 'Error: $e'); });
    } finally {
      setState(() => _loading = false);
      _scroll();
    }
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
                code: '''// Swift - Stateful Session
let session = Session(
  model: model,
  memory: BufferMemory(maxEntries: 6),
  systemPrompt: "You are helpful."
)

// Each call auto-manages memory
let r1 = try await session.send("Hello!")
let r2 = try await session.send("Follow up")

// Inspect memory state
session.memory.entries''',
              ),
              GestureDetector(
                onTap: () => setState(() => _showMemory = !_showMemory),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                  child: Row(
                    children: [
                      const Icon(Icons.lightbulb, size: 18, color: Color(0xFF007AFF)),
                      const SizedBox(width: 8),
                      const Expanded(child: Text('Memory Inspector', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
                      StatBadge(label: 'Entries', value: '${_contextHistory.length}'),
                      const SizedBox(width: 4),
                      StatBadge(label: 'Tokens', value: '~$_tokenEstimate'),
                      Icon(_showMemory ? Icons.expand_less : Icons.expand_more, size: 16, color: const Color(0xFF8E8E93)),
                    ],
                  ),
                ),
              ),
              if (_showMemory && _contextHistory.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: _contextHistory.map((entry) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 22, height: 22,
                            decoration: BoxDecoration(color: entry.role == ChatRole.user ? const Color(0xFF007AFF) : const Color(0xFF34C759), shape: BoxShape.circle),
                            child: Center(child: Text(entry.role == ChatRole.user ? 'U' : 'A', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white))),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(entry.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Color(0xFF666666)))),
                        ],
                      ),
                    )).toList(),
                  ),
                ),
              const SizedBox(height: 8),
              ..._messages.where((m) => m.content != '...').map((msg) => Align(
                alignment: msg.role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  decoration: BoxDecoration(
                    color: msg.role == 'user' ? const Color(0xFF007AFF) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(msg.content, style: TextStyle(fontSize: 15, color: msg.role == 'user' ? Colors.white : const Color(0xFF333333))),
                ),
              )),
              if (_loading && _messages.isNotEmpty && _messages.last.content == '...')
                Row(children: [
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
  String content;
  _Msg(this.role, this.content);
}
