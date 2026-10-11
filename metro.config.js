const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports its bundled WebAssembly module as an asset.
if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');

module.exports = config;
