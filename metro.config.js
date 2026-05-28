// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prevenir caídas del vigilante de archivos (ENOENT) en Windows
// ignorando las carpetas de compilación de Android/iOS
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  /.*\/android\/.*/,
  /.*\/ios\/.*/
];

module.exports = config;
