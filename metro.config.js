const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Illustrations are SVG files bundled as assets (rendered with expo-image).
if (!config.resolver.assetExts.includes('svg')) config.resolver.assetExts.push('svg');

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});
