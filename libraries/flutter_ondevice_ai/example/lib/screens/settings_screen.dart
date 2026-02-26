import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_state.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    final showIOSSetupGuide = isIOS &&
        state.capability?.isSupported == true &&
        !state.isModelReady;
    final showWebSetupGuide = kIsWeb && !state.isModelReady;

    return ListView(
      children: [
        // Setup Guide (iOS only, when model not ready)
        if (showIOSSetupGuide)
          _section('SETUP GUIDE', [
            const _SetupStep(number: '1', title: 'Open Settings', description: 'Go to Settings app on your device'),
            const _Separator(),
            const _SetupStep(number: '2', title: 'Apple Intelligence & Siri', description: 'Navigate to Apple Intelligence & Siri settings'),
            const _Separator(),
            const _SetupStep(number: '3', title: 'Enable Apple Intelligence', description: 'Turn on Apple Intelligence toggle'),
            const _Separator(),
            const _SetupStep(number: '4', title: 'Wait for Setup', description: 'Models will be downloaded in the background'),
          ]),
        // Setup Guide (Web, when Chrome Built-in AI not ready)
        if (showWebSetupGuide)
          _section('CHROME SETUP GUIDE', [
            const _SetupStep(number: '1', title: 'Use Chrome 138+', description: 'Download the latest version from chrome.com'),
            const _Separator(),
            const _SetupStep(number: '2', title: 'Enable Feature Flags', description: 'Open each URL below in Chrome and set to "Enabled"'),
            const _ChromeFlagRow(flag: 'chrome://flags/#optimization-guide-on-device-model'),
            const _ChromeFlagRow(flag: 'chrome://flags/#prompt-api-for-gemini-nano'),
            const _ChromeFlagRow(flag: 'chrome://flags/#enable-experimental-web-platform-features'),
            const _Separator(),
            const _SetupStep(number: '3', title: 'Restart Chrome', description: 'Click "Relaunch" or close and reopen Chrome completely'),
            const _Separator(),
            const _SetupStep(number: '4', title: 'Verify Model Status', description: 'Go to chrome://on-device-internals → Model Status tab'),
            const _Separator(),
            const _SetupStep(number: '5', title: 'System Requirements', description: '22GB+ free disk space. GPU with 4GB+ VRAM or CPU with 16GB+ RAM.'),
          ]),
        if (isIOS) ...[
          _section('APPLE INTELLIGENCE', [
            _ActionRow(
              icon: Icons.settings,
              label: 'Open System Settings',
              trailing: Icons.open_in_new,
              onTap: () => _openSettings(),
            ),
          ]),
        ],
        _section('ACTIONS', [
          _ActionRow(
            icon: Icons.refresh,
            label: 'Refresh SDK State',
            trailing: Icons.chevron_right,
            onTap: () async {
              await state.initializeSDK();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('SDK state has been refreshed.')),
                );
              }
            },
          ),
        ]),
        _section('LINKS', [
          _ActionRow(
            icon: Icons.menu_book,
            label: 'Documentation',
            trailing: Icons.open_in_new,
            onTap: () => _launchUrl('https://locanara.com/docs'),
          ),
          const _Separator(),
          _ActionRow(
            icon: Icons.code,
            label: 'GitHub Repository',
            trailing: Icons.open_in_new,
            onTap: () => _launchUrl('https://github.com/hyodotdev/locanara'),
          ),
        ]),
        _section('ABOUT', [
          const _AboutRow(label: 'flutter_ondevice_ai', value: 'v0.1.0'),
          const _Separator(),
          const _AboutRow(label: 'Locanara SDK', value: 'Open Source'),
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

  Future<void> _openSettings() async {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      final uri = Uri.parse('app-settings:');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final IconData trailing;
  final VoidCallback onTap;

  const _ActionRow({required this.icon, required this.label, required this.trailing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            Icon(icon, size: 22, color: const Color(0xFF007AFF)),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 17))),
            Icon(trailing, size: 20, color: const Color(0xFFC7C7CC)),
          ],
        ),
      ),
    );
  }
}

class _AboutRow extends StatelessWidget {
  final String label;
  final String value;

  const _AboutRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 17)),
          Text(value, style: const TextStyle(fontSize: 17, color: Color(0xFF666666))),
        ],
      ),
    );
  }
}

class _Separator extends StatelessWidget {
  const _Separator();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(left: 50),
      child: Divider(height: 0.5, thickness: 0.5, color: Color(0xFFC6C6C8)),
    );
  }
}

class _SetupStep extends StatelessWidget {
  final String number;
  final String title;
  final String description;

  const _SetupStep({required this.number, required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(color: Color(0xFF007AFF), shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(number, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(description, style: const TextStyle(fontSize: 13, color: Color(0xFF666666))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChromeFlagRow extends StatelessWidget {
  final String flag;

  const _ChromeFlagRow({required this.flag});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(52, 4, 16, 4),
      child: GestureDetector(
        onTap: () {
          Clipboard.setData(ClipboardData(text: flag));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Copied: $flag'), duration: const Duration(seconds: 2)),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF2F2F7),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(flag, style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: Color(0xFF007AFF))),
              ),
              const Icon(Icons.copy, size: 14, color: Color(0xFF999999)),
            ],
          ),
        ),
      ),
    );
  }
}
