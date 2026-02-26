import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_state.dart';
import '../widgets/shared/info_row.dart';

class DeviceScreen extends StatelessWidget {
  const DeviceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final cap = state.capability;

    return ListView(
      children: [
        _section('DEVICE', [
          InfoRow(label: 'Platform', value: state.deviceInfo?.platform ?? 'Unknown'),
          const _Separator(),
          InfoRow(label: 'OS Version', value: state.deviceInfo?.osVersion ?? 'Unknown'),
        ]),
        _section('AI CAPABILITIES', [
          InfoRow(
            label: 'On-Device AI',
            value: state.deviceInfo?.supportsOnDeviceAI == true ? 'Supported' : 'Not Supported',
            valueColor: state.deviceInfo?.supportsOnDeviceAI == true ? const Color(0xFF34C759) : const Color(0xFFFF3B30),
          ),
          const _Separator(),
          InfoRow(label: 'Provider', value: state.deviceInfo?.provider ?? 'None'),
        ]),
        if (cap != null)
          _section('AVAILABLE FEATURES', [
            ..._featureRows(cap.features),
            const _Separator(),
            const InfoRow(label: 'Describe Image', value: 'Coming Soon', valueColor: Color(0xFFFF9500)),
            const _Separator(),
            const InfoRow(label: 'Generate Image', value: 'Coming Soon', valueColor: Color(0xFFFF9500)),
          ]),
        _section('SDK', [
          const InfoRow(label: 'Module', value: 'flutter_ondevice_ai'),
          const _Separator(),
          const InfoRow(label: 'Version', value: '0.1.0'),
          const _Separator(),
          const InfoRow(label: 'Tier', value: 'Community'),
          const _Separator(),
          InfoRow(label: 'SDK State', value: state.sdkState.name),
        ]),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 32),
          child: Text(
            'All AI processing happens on-device.\nYour data never leaves this device.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFF666666), height: 1.54),
          ),
        ),
      ],
    );
  }

  List<Widget> _featureRows(Map<String, bool> features) {
    const names = ['summarize', 'classify', 'extract', 'chat', 'translate', 'rewrite', 'proofread'];
    const labels = ['Summarize', 'Classify', 'Extract', 'Chat', 'Translate', 'Rewrite', 'Proofread'];
    final widgets = <Widget>[];
    for (var i = 0; i < names.length; i++) {
      if (i > 0) widgets.add(const _Separator());
      final available = features[names[i]] ?? false;
      widgets.add(InfoRow(
        label: labels[i],
        value: available ? 'Yes' : 'No',
        valueColor: available ? const Color(0xFF34C759) : const Color(0xFFFF3B30),
      ));
    }
    return widgets;
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(
            title,
            style: const TextStyle(fontSize: 13, color: Color(0xFF666666), letterSpacing: 0.5),
          ),
        ),
        Container(color: Colors.white, child: Column(children: children)),
      ],
    );
  }
}

class _Separator extends StatelessWidget {
  const _Separator();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(left: 16),
      child: Divider(height: 0.5, thickness: 0.5, color: Color(0xFFC6C6C8)),
    );
  }
}
