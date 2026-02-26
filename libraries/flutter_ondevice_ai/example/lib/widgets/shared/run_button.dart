import 'package:flutter/material.dart';

class RunButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onPressed;

  const RunButton({
    super.key,
    required this.label,
    required this.loading,
    required this.onPressed,
  });

  static const _height = 50.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: _height,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF007AFF),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          disabledBackgroundColor: const Color(0xFF007AFF).withValues(alpha: 0.6),
        ),
        child: loading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(label, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
