import 'package:flutter/material.dart';

import '../../app_state.dart';

IconData _iconDataFor(IconName name) {
  return switch (name) {
    IconName.description => Icons.description,
    IconName.label => Icons.label,
    IconName.documentScanner => Icons.document_scanner,
    IconName.chatBubble => Icons.chat_bubble,
    IconName.language => Icons.language,
    IconName.edit => Icons.edit,
    IconName.checkCircle => Icons.check_circle,
    IconName.image => Icons.image,
    IconName.autoFixHigh => Icons.auto_fix_high,
  };
}

class FeatureRow extends StatelessWidget {
  final FeatureInfo feature;

  const FeatureRow({super.key, required this.feature});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: feature.isAvailable ? const Color(0xFFF2F2F7) : const Color(0xFFE5E5EA),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _iconDataFor(feature.icon),
              size: 24,
              color: feature.isAvailable ? const Color(0xFF007AFF) : const Color(0xFF999999),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  feature.name,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: feature.isAvailable ? Colors.black : const Color(0xFF999999),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  feature.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF666666), height: 1.38),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (feature.isComingSoon)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF8E8E93),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Coming Soon',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            )
          else if (!feature.isAvailable)
            const Icon(Icons.lock, size: 16, color: Color(0xFF999999))
          else
            const Icon(Icons.chevron_right, size: 20, color: Color(0xFFC7C7CC)),
        ],
      ),
    );
  }
}
