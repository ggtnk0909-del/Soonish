require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'soonish-widget'
  s.version        = package['version']
  s.summary        = 'Soonish WidgetKit bridge'
  s.homepage       = 'https://github.com/hidet/soonish'
  s.license        = 'MIT'
  s.author         = 'hidet'
  s.platform       = :ios, '15.1'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{swift}'

  s.pod_target_xcconfig = {
    'SWIFT_VERSION' => '5',
  }
end
