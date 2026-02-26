import 'package:flutter/services.dart';

class OndeviceAiException implements Exception {
  final String code;
  final String message;
  final dynamic details;

  const OndeviceAiException({
    required this.code,
    required this.message,
    this.details,
  });

  factory OndeviceAiException.fromPlatformException(PlatformException e) {
    return OndeviceAiException(
      code: e.code,
      message: e.message ?? 'Unknown error',
      details: e.details,
    );
  }

  @override
  String toString() => 'OndeviceAiException($code): $message';
}
