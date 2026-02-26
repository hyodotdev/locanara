# flutter_ondevice_ai

Flutter plugin for on-device AI using [Locanara SDK](https://locanara.com).

Supports iOS (Apple Intelligence / llama.cpp), Android (Gemini Nano), and Web (Chrome Built-in AI) from a single Dart API.

## Installation

```bash
flutter pub add flutter_ondevice_ai
```

## Quick Start

```dart
import 'package:flutter_ondevice_ai/flutter_ondevice_ai.dart';

final ai = FlutterOndeviceAi.instance;
await ai.initialize();

final capability = await ai.getDeviceCapability();
if (capability.isSupported) {
  final result = await ai.summarize('Long text to summarize...');
  print(result.summary);
}
```

## Documentation

Full documentation at [locanara.com/docs/libraries/flutter](https://locanara.com/docs/libraries/flutter)

## License

MIT
