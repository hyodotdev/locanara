import 'package:flutter/material.dart';

import '../widgets/feature_detail/summarize_demo.dart';
import '../widgets/feature_detail/classify_demo.dart';
import '../widgets/feature_detail/extract_demo.dart';
import '../widgets/feature_detail/chat_demo.dart';
import '../widgets/feature_detail/translate_demo.dart';
import '../widgets/feature_detail/rewrite_demo.dart';
import '../widgets/feature_detail/proofread_demo.dart';
import '../widgets/feature_detail/coming_soon_demo.dart';

class FeatureDetailScreen extends StatelessWidget {
  final String id;
  final String name;

  const FeatureDetailScreen({super.key, required this.id, required this.name});

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
      'summarize' => const SummarizeDemo(),
      'classify' => const ClassifyDemo(),
      'extract' => const ExtractDemo(),
      'chat' => const ChatDemo(),
      'translate' => const TranslateDemo(),
      'rewrite' => const RewriteDemo(),
      'proofread' => const ProofreadDemo(),
      'describeImage' => const ComingSoonDemo(
        icon: Icons.image,
        title: 'Describe Image',
        subtitle: 'Generate descriptions for images using on-device AI',
        description: 'This feature will allow you to select an image and generate descriptive text using Apple Intelligence or Gemini Nano, depending on your device.',
      ),
      'generateImage' => const ComingSoonDemo(
        icon: Icons.auto_fix_high,
        title: 'Generate Image',
        subtitle: 'Generate images from text prompts using on-device AI',
        description: 'This feature will allow you to generate images from text descriptions using Apple Intelligence or Gemini Nano, depending on your device.',
      ),
      _ => const Center(child: Text('Unknown Feature', style: TextStyle(fontSize: 17, color: Color(0xFF666666)))),
    };
  }
}
