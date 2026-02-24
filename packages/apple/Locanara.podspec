require 'json'

# Read version from locanara-versions.json (Single Source of Truth)
versions_path = File.join(File.dirname(__FILE__), '../../locanara-versions.json')
versions = JSON.parse(File.read(versions_path))
apple_version = versions['apple']

Pod::Spec.new do |s|
  s.name             = 'Locanara'
  s.version          = apple_version
  s.summary          = 'On-device AI SDK for iOS using Apple Intelligence'
  s.description      = 'Locanara provides a unified API for on-device AI capabilities using Apple Intelligence Foundation Models.'
  s.homepage         = 'https://github.com/hyodotdev/locanara'
  s.license          = { :type => 'AGPL-3.0', :file => '../../LICENSE' }
  s.author           = { 'hyochan' => 'hyochan.dev@gmail.com' }
  s.source           = { :git => 'https://github.com/hyodotdev/locanara.git', :tag => s.version.to_s }

  s.ios.deployment_target = '17.0'
  s.macos.deployment_target = '14.0'
  s.tvos.deployment_target = '17.0'

  s.swift_version = '6.0'
  s.source_files = 'Sources/**/*.swift'

  s.frameworks = 'Foundation'
  # FoundationModels is resolved via canImport() in Swift source;
  # weak_frameworks causes linker errors on Xcode < 26.
end
