// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prevenir caídas del vigilante de archivos (ENOENT) en Windows
// Solo bloquear las carpetas raíz de Android/iOS, no las de node_modules
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  new RegExp(`${__dirname.replace(/\\/g, '/')}/(android|ios)/.*`),
];

config.resolver.assetExts.push('tflite');

module.exports = config;
