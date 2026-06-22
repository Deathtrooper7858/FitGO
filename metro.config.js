// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
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

// Polyfill Node.js built-ins used by 'xlsx' (EventEmitter etc.)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: path.resolve(__dirname, 'shims/events.js'),
};

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: { keep_fnames: true },
    output: { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    toplevel: false,
    compress: {
      reduce_funcs: false,
    },
  },
};

module.exports = config;
