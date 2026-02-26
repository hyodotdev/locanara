import 'package:flutter/material.dart';

class AIModelRequiredBanner extends StatelessWidget {
  const AIModelRequiredBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Row(
        children: [
          Icon(Icons.warning, size: 20, color: Color(0xFFFF9500)),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Model Not Available', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                SizedBox(height: 2),
                Text('This feature requires on-device AI support', style: TextStyle(fontSize: 13, color: Color(0xFF666666))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
