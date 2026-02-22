require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroOndeviceAi"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => '17.0', :macos => '14.0' }
  s.source       = { :git => "https://github.com/hyodotdev/locanara.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
  ]

  load 'nitrogen/generated/ios/NitroOndeviceAi+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'React-Core'
  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  s.dependency 'Locanara'

  install_modules_dependencies(s)
end
