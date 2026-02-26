import 'package:flutter/material.dart';

class ComingSoonDemo extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String description;

  const ComingSoonDemo({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(icon, size: 80, color: const Color(0xFFC7C7CC)),
            ),
            const SizedBox(height: 24),
            Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: Color(0xFF666666))),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFF9500),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text('Coming Soon', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 24),
            Text(description, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: Color(0xFF666666), height: 1.43)),
          ],
        ),
      ),
    );
  }
}
