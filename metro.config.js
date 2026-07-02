// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const os = require('os');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ── Fix EMFILE: «too many open files» en Windows ──────────────────────────────
// Limitar workers adicional para reducir presión sobre el sistema de archivos
const cpuCount = os.cpus().length;
config.maxWorkers = Math.min(2, Math.max(1, Math.floor(cpuCount / 2)));


// Prevenir caídas del vigilante de archivos (ENOENT / EMFILE) en Windows
// Bloquear carpetas innecesarias para reducir la cantidad de archivos observados
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  /.*[\/\\](android|ios)[\/\\].*/,
  /.*[\/\\]\.git[\/\\].*/,
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
