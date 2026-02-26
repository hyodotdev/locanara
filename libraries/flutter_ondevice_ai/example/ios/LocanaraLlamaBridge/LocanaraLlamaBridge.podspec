Pod::Spec.new do |s|
  s.name         = "LocanaraLlamaBridge"
  s.version      = "1.0.0"
  s.summary      = "llama.cpp bridge with isolated C++ interop"
  s.homepage     = "https://github.com/hyodotdev/locanara"
  s.license      = "MIT"
  s.author       = "Locanara"
  s.platform     = :ios, "17.0"
  s.source       = { :path => "." }
  s.source_files = "Sources/**/*.swift"
  s.dependency   "Locanara"
  s.swift_version = "5.0"
  s.static_framework = true
  s.pod_target_xcconfig = {
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
  }
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -framework "llama"',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"',
  }
end
