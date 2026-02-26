import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

class ChatDemo extends StatefulWidget {
  const ChatDemo({super.key});

  @override
  State<ChatDemo> createState() => _ChatDemoState();
}

class _ChatDemoState extends State<ChatDemo> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _ai = FlutterOndeviceAi.instance;
  final _messages = <_Message>[];
  bool _isStreaming = true;
  bool _loading = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _loading) return;
    _controller.clear();
    setState(() {
      _messages.add(_Message(role: 'user', content: text));
      _loading = true;
    });
    _scrollToBottom();

    final history = _messages.where((m) => m.role != 'typing').map((m) => ChatMessage(role: m.role == 'user' ? ChatRole.user : ChatRole.assistant, content: m.content)).toList();

    try {
      if (_isStreaming) {
        setState(() => _messages.add(_Message(role: 'assistant', content: '')));
        await _ai.chatStream(text, options: ChatStreamOptions(
          systemPrompt: 'You are a helpful AI assistant. Keep answers brief.',
          history: history.sublist(0, history.length - 1),
          onChunk: (chunk) {
            if (!mounted || _messages.isEmpty) return;
            setState(() { _messages.last = _Message(role: 'assistant', content: chunk.accumulated); });
            _scrollToBottom();
          },
        ));
      } else {
        setState(() => _messages.add(_Message(role: 'typing', content: '')));
        final result = await _ai.chat(text, options: ChatOptions(
          systemPrompt: 'You are a helpful AI assistant. Keep answers brief.',
          history: history.sublist(0, history.length - 1),
        ));
        if (!mounted) return;
        setState(() { _messages.last = _Message(role: 'assistant', content: result.message); });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (_messages.isNotEmpty && (_messages.last.role == 'typing' || _messages.last.content.isEmpty)) {
          _messages.last = _Message(role: 'assistant', content: 'Error: $e');
        } else {
          _messages.add(_Message(role: 'assistant', content: 'Error: $e'));
        }
      });
    } finally {
      if (mounted) setState(() => _loading = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      }
    });
  }

  @override
  void dispose() { _controller.dispose(); _scrollController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _modeButton('Standard', Icons.chat, !_isStreaming),
              const SizedBox(width: 8),
              _modeButton('Stream', Icons.bolt, _isStreaming),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final msg = _messages[index];
              if (msg.role == 'typing') {
                return const Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(padding: EdgeInsets.only(bottom: 8), child: _TypingIndicator()),
                );
              }
              final isUser = msg.role == 'user';
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  decoration: BoxDecoration(
                    color: isUser ? const Color(0xFF007AFF) : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                  ),
                  child: Text(msg.content, style: TextStyle(fontSize: 15, color: isUser ? Colors.white : const Color(0xFF333333), height: 1.47)),
                ),
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE5E5EA), width: 0.5)),
          ),
          child: Row(
            children: [
              if (_messages.isNotEmpty)
                IconButton(icon: const Icon(Icons.delete, color: Color(0xFFFF3B30)), onPressed: () => setState(() => _messages.clear())),
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    filled: true,
                    fillColor: const Color(0xFFF2F2F7),
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
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF007AFF).withValues(alpha: (_controller.text.trim().isEmpty || _loading) ? 0.4 : 1.0),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send, size: 20, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _modeButton(String label, IconData icon, bool isSelected) {
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _isStreaming = label == 'Stream'),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF007AFF) : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: isSelected ? Colors.white : const Color(0xFF333333)),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333))),
            ],
          ),
        ),
      ),
    );
  }
}

class _Message {
  final String role;
  final String content;

  _Message({required this.role, required this.content});
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (i) {
      final ctrl = AnimationController(duration: const Duration(milliseconds: 600), vsync: this);
      Future.delayed(Duration(milliseconds: i * 200), () { if (mounted) ctrl.repeat(reverse: true); });
      return ctrl;
    });
  }

  @override
  void dispose() { for (final c in _controllers) c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: _controllers.map((ctrl) {
          return AnimatedBuilder(
            animation: ctrl,
            builder: (_, __) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: Color.lerp(const Color(0xFFC7C7CC), const Color(0xFF8E8E93), ctrl.value),
                shape: BoxShape.circle,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
