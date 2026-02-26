import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../widgets/shared/ai_status_banner.dart';
import '../widgets/shared/feature_row.dart';
import 'feature_detail_screen.dart';

class FeaturesScreen extends StatelessWidget {
  const FeaturesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (state.sdkState == SDKState.notInitialized || state.sdkState == SDKState.initializing) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Initializing Locanara SDK...', style: TextStyle(fontSize: 17, color: Color(0xFF666666))),
          ],
        ),
      );
    }

    if (state.sdkState == SDKState.error) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Initialization Error', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFFFF3B30))),
              const SizedBox(height: 8),
              Text(state.errorMessage ?? '', textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: Color(0xFF666666))),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: state.initializeSDK,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF007AFF),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Retry', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      itemCount: state.availableFeatures.length + 1,
      separatorBuilder: (_, i) => i == 0
          ? const SizedBox(height: 16)
          : const Padding(
              padding: EdgeInsets.only(left: 68),
              child: Divider(height: 0.5, thickness: 0.5, color: Color(0xFFC6C6C8)),
            ),
      itemBuilder: (context, index) {
        if (index == 0) return const AIStatusBanner();
        final feature = state.availableFeatures[index - 1];
        return GestureDetector(
          onTap: feature.isAvailable
              ? () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => FeatureDetailScreen(id: feature.id, name: feature.name),
                    ),
                  )
              : null,
          child: FeatureRow(feature: feature),
        );
      },
    );
  }
}
