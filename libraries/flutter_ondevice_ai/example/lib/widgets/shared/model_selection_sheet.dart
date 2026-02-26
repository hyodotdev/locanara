import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';
import 'package:provider/provider.dart';

import '../../app_state.dart';

const _engineDisplayNames = {
  InferenceEngine.foundationModels: 'Apple Intelligence',
  InferenceEngine.llamaCpp: 'llama.cpp',
  InferenceEngine.mlx: 'MLX',
  InferenceEngine.coreMl: 'CoreML',
  InferenceEngine.promptApi: 'Gemini Nano',
  InferenceEngine.none: 'Not Available',
};

class ModelSelectionSheet extends StatefulWidget {
  const ModelSelectionSheet({super.key});

  @override
  State<ModelSelectionSheet> createState() => _ModelSelectionSheetState();
}

class _ModelSelectionSheetState extends State<ModelSelectionSheet> {
  String? _actionLoading;

  Future<void> _handleDownload(BuildContext context, DownloadableModelInfo model) async {
    debugPrint('[ModelSheet] download ${model.modelId} (${model.name}, ${model.sizeMB}MB)');
    setState(() => _actionLoading = model.modelId);
    try {
      await context.read<AppState>().downloadModelById(model.modelId);
      debugPrint('[ModelSheet] download ${model.modelId} done');
    } catch (e, st) {
      debugPrint('[ModelSheet] download ${model.modelId} FAILED: $e\n$st');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Download Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  Future<void> _handleLoad(BuildContext context, String modelId) async {
    debugPrint('[ModelSheet] load $modelId');
    setState(() => _actionLoading = modelId);
    try {
      await context.read<AppState>().loadModelById(modelId);
      debugPrint('[ModelSheet] load $modelId done');
    } catch (e, st) {
      debugPrint('[ModelSheet] load $modelId FAILED: $e\n$st');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Load Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  Future<void> _handleDelete(BuildContext context, String modelId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Model'),
        content: const Text('Are you sure you want to delete this model? You can re-download it later.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFFF3B30)),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    debugPrint('[ModelSheet] delete $modelId');
    setState(() => _actionLoading = modelId);
    try {
      await context.read<AppState>().deleteModelById(modelId);
      debugPrint('[ModelSheet] delete $modelId done');
    } catch (e, st) {
      debugPrint('[ModelSheet] delete $modelId FAILED: $e\n$st');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  Future<void> _handleSwitchToDeviceAI(BuildContext context) async {
    debugPrint('[ModelSheet] switchToDeviceAI');
    setState(() => _actionLoading = '__switch__');
    try {
      await context.read<AppState>().switchToDeviceAI();
      debugPrint('[ModelSheet] switchToDeviceAI done');
    } catch (e, st) {
      debugPrint('[ModelSheet] switchToDeviceAI FAILED: $e\n$st');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Switch Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final ms = state.modelState;
    final isIOS = !kIsWeb && Platform.isIOS;

    // On web, Chrome manages models — show "Chrome Built-in AI" when ready
    final bool isWebReady = kIsWeb && state.isModelReady;
    final bool engineAvailable = ms.currentEngine != InferenceEngine.none || isWebReady;
    final engineName = isWebReady
        ? 'Chrome Built-in AI'
        : (_engineDisplayNames[ms.currentEngine] ?? ms.currentEngine.name);

    return Container(
      color: const Color(0xFFF2F2F7),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('On-Device AI Models', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.cancel_outlined, size: 28, color: Color(0xFF666666)),
                ),
              ],
            ),
          ),

          // Download Progress
          if (ms.isDownloading && ms.downloadProgress != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: ms.downloadProgress!.progress,
                      backgroundColor: const Color(0xFFE5E5EA),
                      color: const Color(0xFF007AFF),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Downloading... ${(ms.downloadProgress!.progress * 100).round()}%',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
                    ),
                  ),
                ],
              ),
            ),

          Expanded(
            child: ListView(
              children: [
                // Active Engine section
                _SectionHeader(title: 'Active Engine'),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        Icon(
                          engineAvailable ? Icons.auto_awesome : Icons.cancel,
                          size: 24,
                          color: engineAvailable ? const Color(0xFF007AFF) : const Color(0xFFFF3B30),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(engineName, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 2),
                              Text(
                                !engineAvailable
                                    ? 'No AI engine available'
                                    : kIsWeb
                                        ? 'Gemini Nano via Chrome'
                                        : isIOS
                                            ? 'Apple on-device AI'
                                            : 'Google on-device AI',
                                style: const TextStyle(fontSize: 13, color: Color(0xFF666666)),
                              ),
                            ],
                          ),
                        ),
                        if (engineAvailable)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFFE3F9E5), borderRadius: BorderRadius.circular(12)),
                            child: const Text('Active', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF34C759))),
                          ),
                      ],
                    ),
                  ),
                ),

                // Switch back to Device AI when using llama.cpp
                if (ms.currentEngine == InferenceEngine.llamaCpp)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: _ActionButton(
                      label: isIOS ? 'Switch to Apple Intelligence' : 'Switch to Device AI',
                      icon: Icons.auto_awesome,
                      loading: _actionLoading == '__switch__',
                      onTap: _actionLoading != null ? null : () => _handleSwitchToDeviceAI(context),
                      expand: true,
                      outlined: true,
                    ),
                  ),

                // Chrome Setup Guide (web only, when not available)
                if (kIsWeb && !state.isModelReady) ...[
                  _SectionHeader(title: 'Setup Guide'),
                  const _ChromeSetupGuide(),
                ],

                // Available Models
                if (ms.availableModels.isNotEmpty) ...[
                  _SectionHeader(title: 'Available Models'),
                  ...ms.availableModels.map((model) {
                    final downloaded = ms.downloadedModelIds.contains(model.modelId);
                    final isActiveModel = ms.loadedModelId == model.modelId && ms.currentEngine == InferenceEngine.llamaCpp;
                    final loading = _actionLoading == model.modelId;
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _ModelRow(
                        model: model,
                        downloaded: downloaded,
                        loaded: isActiveModel,
                        loading: loading,
                        isDownloading: ms.isDownloading,
                        onDownload: () => _handleDownload(context, model),
                        onLoad: () => _handleLoad(context, model.modelId),
                        onDelete: () => _handleDelete(context, model.modelId),
                      ),
                    );
                  }),
                ],

                // About section
                _SectionHeader(title: 'About'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: const Column(
                      children: [
                        _AboutRow(icon: Icons.lock, title: 'Private', subtitle: 'All data stays on your device'),
                        _AboutRow(icon: Icons.cloud_off, title: 'Offline', subtitle: 'Works without internet connection'),
                        _AboutRow(icon: Icons.flash_on, title: 'Fast', subtitle: 'Low latency, hardware-accelerated'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChromeSetupGuide extends StatelessWidget {
  const _ChromeSetupGuide();

  static const _steps = [
    (
      title: '1. Use Chrome 138+',
      desc: 'Download the latest version from chrome.com',
    ),
    (
      title: '2. Enable Feature Flags',
      desc: 'Open each URL in Chrome and set to "Enabled":',
    ),
    (
      title: '3. Restart Chrome',
      desc: 'Click "Relaunch" or close and reopen Chrome completely.',
    ),
    (
      title: '4. Verify Model Status',
      desc: 'Check chrome://on-device-internals → Model Status tab',
    ),
    (
      title: '5. Requirements',
      desc: '22GB+ free disk space. GPU with 4GB+ VRAM or CPU with 16GB+ RAM.',
    ),
  ];

  static const _flags = [
    'chrome://flags/#optimization-guide-on-device-model',
    'chrome://flags/#prompt-api-for-gemini-nano',
    'chrome://flags/#enable-experimental-web-platform-features',
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < _steps.length; i++) ...[
              if (i > 0) const SizedBox(height: 12),
              Text(_steps[i].title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(_steps[i].desc, style: const TextStyle(fontSize: 13, color: Color(0xFF666666))),
              // Show flag URLs for step 2
              if (i == 1)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Column(
                    children: _flags.map((flag) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: flag));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Copied: $flag'), duration: const Duration(seconds: 2)),
                          );
                        },
                        child: Container(
                          width: double.infinity,
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
                    )).toList(),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF666666), letterSpacing: 0.5),
      ),
    );
  }
}

class _ModelRow extends StatelessWidget {
  final DownloadableModelInfo model;
  final bool downloaded;
  final bool loaded;
  final bool loading;
  final bool isDownloading;
  final VoidCallback onDownload;
  final VoidCallback onLoad;
  final VoidCallback onDelete;

  const _ModelRow({
    required this.model,
    required this.downloaded,
    required this.loaded,
    required this.loading,
    required this.isDownloading,
    required this.onDownload,
    required this.onLoad,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(model.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${model.sizeMB} MB \u00B7 ${model.quantization} \u00B7 ${model.contextLength} ctx${model.isMultimodal ? ' \u00B7 Vision' : ''}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF888888)),
                ),
              ],
            ),
          ),
          if (loaded)
            _ActionButton(label: 'Loaded', loading: loading, color: const Color(0xFF007AFF), badge: true)
          else if (downloaded)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _ActionButton(label: 'Load', loading: loading, onTap: onLoad),
                const SizedBox(width: 8),
                _ActionButton(icon: Icons.delete_outline, loading: false, onTap: onDelete, color: const Color(0xFFFF3B30)),
              ],
            )
          else
            _ActionButton(
              label: '${model.sizeMB} MB',
              icon: Icons.cloud_download_outlined,
              loading: loading,
              onTap: isDownloading ? null : onDownload,
              disabled: isDownloading,
            ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final bool loading;
  final bool badge;
  final bool expand;
  final bool outlined;
  final bool disabled;
  final Color color;
  final VoidCallback? onTap;

  const _ActionButton({
    this.label,
    this.icon,
    this.loading = false,
    this.badge = false,
    this.expand = false,
    this.outlined = false,
    this.disabled = false,
    this.color = const Color(0xFF007AFF),
    this.onTap,
  });

  static const _height = 32.0;
  static const _fontSize = 13.0;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = disabled ? const Color(0xFF999999) : color;
    final bgColor = outlined
        ? Colors.transparent
        : disabled
            ? const Color(0xFFF2F2F7)
            : badge
                ? const Color(0xFFE3F2FD)
                : const Color(0xFFE3F2FD);

    final content = loading
        ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: effectiveColor))
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 15, color: effectiveColor),
                if (label != null) const SizedBox(width: 4),
              ],
              if (label != null)
                Text(label!, style: TextStyle(fontSize: _fontSize, fontWeight: FontWeight.w600, color: effectiveColor)),
            ],
          );

    final decoration = outlined
        ? BoxDecoration(
            border: Border.all(color: effectiveColor),
            borderRadius: BorderRadius.circular(10),
          )
        : BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(badge ? 12 : 8),
          );

    final widget = GestureDetector(
      onTap: (loading || disabled) ? null : onTap,
      child: Container(
        height: _height,
        padding: EdgeInsets.symmetric(horizontal: badge ? 10 : 12),
        decoration: decoration,
        alignment: Alignment.center,
        child: content,
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: widget) : widget;
  }
}

class _AboutRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _AboutRow({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF007AFF)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF666666))),
            ],
          ),
        ],
      ),
    );
  }
}
