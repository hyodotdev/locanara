Pod::Spec.new do |s|
  s.name             = 'flutter_ondevice_ai'
  s.version          = '0.1.0'
  s.summary          = 'Flutter plugin for on-device AI using Locanara SDK'
  s.description      = 'Flutter plugin for on-device AI supporting Apple Intelligence, Gemini Nano, and Chrome Built-in AI.'
  s.homepage         = 'https://github.com/hyodotdev/locanara'
  s.license          = { :file => '../LICENSE' }
  s.author           = { 'hyodotdev' => 'hyochan.dev@gmail.com' }
  s.source           = { :path => '.' }
  s.source_files     = 'Classes/**/*.swift'
  s.dependency 'Flutter'
  s.dependency 'Locanara'
  s.ios.deployment_target = '17.0'
  s.swift_version = '5.9'
  s.static_framework = true
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
