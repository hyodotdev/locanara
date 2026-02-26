import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';
import 'package:provider/provider.dart';

import '../../app_state.dart';
import 'model_selection_sheet.dart';

const _engineLabels = {
  InferenceEngine.foundationModels: 'Apple Intelligence',
  InferenceEngine.llamaCpp: 'llama.cpp Model',
  InferenceEngine.promptApi: 'Gemini Nano',
};

class AIStatusBanner extends StatelessWidget {
  const AIStatusBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    // Loading state
    if (state.sdkState == SDKState.initializing || state.sdkState == SDKState.notInitialized) {
      final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
      final checkingText = kIsWeb
          ? 'Checking Chrome Built-in AI...'
          : isIOS
              ? 'Checking Apple Intelligence...'
              : 'Checking Gemini Nano...';

      return _BannerContainer(
        color: const Color(0xFFE3F2FD),
        icon: const Icon(Icons.hourglass_empty, size: 20, color: Color(0xFF007AFF)),
        title: checkingText,
        subtitle: 'Please wait while checking device capabilities',
      );
    }

    // Model ready - tappable to manage models
    if (state.isModelReady) {
      final engineLabel = _engineLabels[state.modelState.currentEngine] ??
          (kIsWeb
              ? 'Chrome Built-in AI'
              : (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS)
                  ? 'Apple Intelligence'
                  : 'Gemini Nano');

      return GestureDetector(
        onTap: () => _showModelSheet(context),
        child: _BannerContainer(
          color: const Color(0xFFE3F2FD),
          icon: const Icon(Icons.auto_awesome, size: 20, color: Color(0xFF007AFF)),
          title: '$engineLabel Active',
          subtitle: 'Tap to manage models',
          trailing: const Icon(Icons.chevron_right, size: 20, color: Color(0xFFC7C7CC)),
        ),
      );
    }

    // Web: Chrome Built-in AI not available
    if (kIsWeb) {
      return _BannerContainer(
        color: const Color(0xFFFFEBEE),
        icon: const Icon(Icons.warning, size: 20, color: Color(0xFFFF3B30)),
        title: 'Chrome Built-in AI Not Available',
        subtitle: 'Requires Chrome 138+ with Gemini Nano enabled',
      );
    }

    // iOS: Apple Intelligence required but not ready
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS && state.capability?.isSupported == true) {
      return _BannerContainer(
        color: const Color(0xFFFFF3E0),
        icon: const Icon(Icons.auto_awesome_outlined, size: 20, color: Color(0xFFFF9500)),
        title: 'Apple Intelligence Required',
        subtitle: 'Enable Apple Intelligence in Settings',
        trailing: GestureDetector(
          onTap: () {},
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFFFF9500), borderRadius: BorderRadius.circular(8)),
            child: const Text('Enable', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
          ),
        ),
      );
    }

    // Android/other: AI supported but model not ready
    if (state.capability?.isSupported == true) {
      return _BannerContainer(
        color: const Color(0xFFFFF3E0),
        icon: const Icon(Icons.auto_awesome_outlined, size: 20, color: Color(0xFFFF9500)),
        title: 'AI Model Not Ready',
        subtitle: 'Enable on-device AI in system settings',
      );
    }

    // Device not supported
    final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    return _BannerContainer(
      color: const Color(0xFFFFEBEE),
      icon: const Icon(Icons.warning, size: 20, color: Color(0xFFFF3B30)),
      title: 'Device Not Supported',
      subtitle: isIOS
          ? 'Requires iPhone 15 Pro or newer with iOS 18.1+'
          : 'This device does not support on-device AI',
    );
  }

  void _showModelSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: const Color(0xFFF2F2F7),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<AppState>(),
        child: const SizedBox(
          height: double.infinity,
          child: ModelSelectionSheet(),
        ),
      ),
    );
  }
}

class _BannerContainer extends StatelessWidget {
  final Color color;
  final Widget icon;
  final String title;
  final String subtitle;
  final Widget? trailing;

  const _BannerContainer({
    required this.color,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          icon,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF666666))),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
