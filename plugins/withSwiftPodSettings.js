const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = "# withSwiftPodSettings";
const INJECTION = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
        config.build_settings['SWIFT_VERSION'] = '5.0'
      end
    end`;

const withSwiftPodSettings = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes(MARKER)) {
        return config;
      }

      // react_native_post_install(...) の閉じ括弧の直後に挿入
      podfile = podfile.replace(
        /(:ccache_enabled => ccache_enabled\?[^\n]+\n\s+\))/,
        `$1${INJECTION}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};

module.exports = withSwiftPodSettings;
