import 'package:flutter/material.dart';

import '../widgets/framework_detail/model_demo.dart';
import '../widgets/framework_detail/chain_demo.dart';
import '../widgets/framework_detail/pipeline_demo.dart';
import '../widgets/framework_detail/memory_demo.dart';
import '../widgets/framework_detail/guardrail_demo.dart';
import '../widgets/framework_detail/session_demo.dart';
import '../widgets/framework_detail/agent_demo.dart';

class FrameworkDetailScreen extends StatelessWidget {
  final String id;
  final String name;

  const FrameworkDetailScreen({super.key, required this.id, required this.name});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(name)),
      backgroundColor: const Color(0xFFF2F2F7),
      body: _buildDemo(),
    );
  }

  Widget _buildDemo() {
    return switch (id) {
      'model' => const ModelDemo(),
      'chain' => const ChainDemo(),
      'pipeline' => const PipelineDemo(),
      'memory' => const MemoryDemo(),
      'guardrail' => const GuardrailDemo(),
      'session' => const SessionDemo(),
      'agent' => const AgentDemo(),
      _ => const Center(child: Text('Unknown Demo', style: TextStyle(fontSize: 17, color: Color(0xFF666666)))),
    };
  }
}
