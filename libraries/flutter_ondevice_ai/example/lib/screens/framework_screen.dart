import 'package:flutter/material.dart';

import '../widgets/shared/ai_status_banner.dart';
import 'framework_detail_screen.dart';

class _FrameworkDemo {
  final String id;
  final String name;
  final IconData icon;
  final String description;

  const _FrameworkDemo({required this.id, required this.name, required this.icon, required this.description});
}

const _frameworkDemos = [
  _FrameworkDemo(id: 'model', name: 'Model', icon: Icons.memory, description: 'Direct model usage with GenerationConfig presets and streaming'),
  _FrameworkDemo(id: 'chain', name: 'Chain', icon: Icons.link, description: 'ModelChain, SequentialChain, ParallelChain, ConditionalChain, and custom chains'),
  _FrameworkDemo(id: 'pipeline', name: 'Pipeline DSL', icon: Icons.swap_horiz, description: 'Compose multiple AI steps into a single pipeline with compile-time type safety'),
  _FrameworkDemo(id: 'memory', name: 'Memory', icon: Icons.lightbulb, description: 'BufferMemory and SummaryMemory \u2014 conversation history management'),
  _FrameworkDemo(id: 'guardrail', name: 'Guardrail', icon: Icons.verified_user, description: 'Wrap chains with input length and content safety guardrails'),
  _FrameworkDemo(id: 'session', name: 'Session', icon: Icons.chat_bubble_outline, description: 'Stateful chat with BufferMemory \u2014 see memory entries in real-time'),
  _FrameworkDemo(id: 'agent', name: 'Agent + Tools', icon: Icons.account_circle, description: 'ReAct-lite agent with tools and step-by-step reasoning trace'),
];

class FrameworkScreen extends StatelessWidget {
  const FrameworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: _frameworkDemos.length + 1,
      separatorBuilder: (_, i) => i == 0
          ? const SizedBox(height: 16)
          : const Padding(
              padding: EdgeInsets.only(left: 68),
              child: Divider(height: 0.5, thickness: 0.5, color: Color(0xFFC6C6C8)),
            ),
      itemBuilder: (context, index) {
        if (index == 0) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const AIStatusBanner(),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Text(
                  "Explore Locanara's composable framework primitives \u2014 the building blocks for custom AI features.",
                  style: TextStyle(fontSize: 14, color: Color(0xFF666666), height: 1.43),
                ),
              ),
            ],
          );
        }
        final demo = _frameworkDemos[index - 1];
        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FrameworkDetailScreen(id: demo.id, name: demo.name),
            ),
          ),
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(demo.icon, size: 24, color: const Color(0xFF007AFF)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(demo.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(demo.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Color(0xFF666666), height: 1.38)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, size: 20, color: Color(0xFFC7C7CC)),
              ],
            ),
          ),
        );
      },
    );
  }
}
