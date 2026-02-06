Pod::Spec.new do |s|
  s.name             = 'Locanara'
  s.version          = '1.0.1'
  s.summary          = 'On-device AI SDK for iOS using Apple Intelligence'
  s.description      = 'Locanara provides a unified API for on-device AI capabilities using Apple Intelligence Foundation Models.'
  s.homepage         = 'https://github.com/hyodotdev/locanara'
  s.license          = { :type => 'MIT', :file => '../../LICENSE' }
  s.author           = { 'hyochan' => 'hyochan.dev@gmail.com' }
  s.source           = { :git => 'https://github.com/hyodotdev/locanara.git', :tag => s.version.to_s }

  s.ios.deployment_target = '15.0'
  s.macos.deployment_target = '14.0'
  s.tvos.deployment_target = '15.0'
  s.watchos.deployment_target = '8.0'

  s.swift_version = '5.9'
  s.source_files = 'Sources/**/*.swift'

  s.frameworks = 'Foundation'
  s.weak_frameworks = 'FoundationModels'
end
