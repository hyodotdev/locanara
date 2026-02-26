import 'dart:convert';

import 'package:flutter/material.dart';

class DebugLog {
  final String api;
  final dynamic request;
  final dynamic response;
  final int timing;

  const DebugLog({
    required this.api,
    required this.request,
    required this.response,
    required this.timing,
  });
}

class DebugLogPanel extends StatefulWidget {
  final DebugLog? log;

  const DebugLogPanel({super.key, this.log});

  @override
  State<DebugLogPanel> createState() => _DebugLogPanelState();
}

class _DebugLogPanelState extends State<DebugLogPanel> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    if (widget.log == null) return const SizedBox.shrink();
    final log = widget.log!;

    return Container(
      margin: const EdgeInsets.only(top: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(10),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.code, size: 16, color: Color(0xFF8E8E93)),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Debug Log',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF8E8E93)),
                    ),
                  ),
                  Text(
                    '${log.timing}ms',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF30D158)),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                    color: const Color(0xFF8E8E93),
                  ),
                ],
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('API'),
                  Text(log.api, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0A84FF), fontFamily: 'monospace')),
                  _label('Request'),
                  _codeBlock(log.request),
                  _label('Response'),
                  _codeBlock(log.response),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF636366), letterSpacing: 0.5),
      ),
    );
  }

  Widget _codeBlock(dynamic data) {
    final text = const JsonEncoder.withIndent('  ').convert(data);
    return SizedBox(
      height: 200,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SelectableText(
          text,
          style: const TextStyle(fontSize: 12, color: Color(0xFFE5E5EA), fontFamily: 'monospace', height: 1.5),
        ),
      ),
    );
  }
}
