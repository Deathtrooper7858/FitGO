// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ── Workers ──────────────────────────────────────────────────────────────────
// 2 workers en dev para limitar RAM; todos los cores disponibles en producción/build.
const os = require('os');
const isProd = process.env.NODE_ENV === 'production' || process.env.APP_VARIANT === 'production';
config.maxWorkers = isProd ? Math.max(2, os.cpus().length - 1) : 2;

// ── Resolver: extensiones priorizadas ────────────────────────────────────────
config.resolver.sourceExts = Array.from(
  new Set(['ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs', ...config.resolver.sourceExts])
);

// ── Resolver: Package Exports (Node 12+ ESM) ─────────────────────────────────
// Usa el campo "exports" de package.json para resolución → menos fallbacks,
// resolución más directa, especialmente en librerías modernas.
config.resolver.unstable_enablePackageExports = true;

// ── BlockList: reducir archivos observados ───────────────────────────────────
// Cada archivo en el blockList es uno menos que Metro tiene que hacer watch.
// En Windows con 842+ paquetes, esto tiene un impacto directo en startup time.
const projectRoot = __dirname.replace(/\\/g, '/');
const escapedRoot = projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),

  // ── Raíz del proyecto: carpetas nativas ──
  new RegExp(`^${escapedRoot}[\\/\\\\](android|ios)[\\/\\\\]`),
  /.*[\/\\]\.git[\/\\].*/,
  /.*[\/\\]\.cxx[\/\\].*/,

  // ── node_modules: carpetas nativas y de build ──
  /.*[\/\\]node_modules[\/\\].*[\/\\]android[\/\\]build[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]\.gradle[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]cpp[\/\\].*/,

  // ── Directorios pesados sin código JS ejecutable ──
  /.*[\/\\]node_modules[\/\\].*[\/\\]__tests__[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]__mocks__[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]\.github[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]docs[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]website[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]examples[\/\\].*/,
  /.*[\/\\]node_modules[\/\\].*[\/\\]e2e[\/\\].*/,

  // ── Paquetes con código nativo pesado: excluir sus srcs C++/obj ──
  /.*[\/\\]node_modules[\/\\]react-native-reanimated[\/\\]android[\/\\]build[\/\\].*/,
  /.*[\/\\]node_modules[\/\\]react-native-vision-camera[\/\\]android[\/\\]build[\/\\].*/,
  /.*[\/\\]node_modules[\/\\]react-native-nitro-modules[\/\\]android[\/\\]build[\/\\].*/,

  // ── Metro cache y builds temporales ──
  /.*[\/\\]node_modules[\/\\]\.metro-cache[\/\\].*/,
  /.*[\/\\]\.expo[\/\\].*/,
];

// ── Assets extras ────────────────────────────────────────────────────────────
config.resolver.assetExts.push('tflite');

// ── Polyfill para xlsx ────────────────────────────────────────────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: path.resolve(__dirname, 'shims/events.js'),
};

// ── Transformer ──────────────────────────────────────────────────────────────
config.transformer = {
  ...config.transformer,
  // inlineRequires: los módulos se cargan solo cuando se usan (lazy),
  // no todos al arrancar → startup notablemente más rápido.
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // minifierConfig solo aplica en builds de producción (expo export),
  // en dev Metro nunca minifica.
  minifierConfig: {
    keep_fnames: true,
    mangle: { keep_fnames: true },
    output: { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    toplevel: false,
    compress: { reduce_funcs: false },
  },
};

// ── Server ───────────────────────────────────────────────────────────────────
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
  port: 8081,
};

// ── Cache persistente en disco ────────────────────────────────────────────────
// En reinicios de Metro (Ctrl+C → start:dev) los módulos ya transformados
// se cargan desde disco en vez de retransformarse → 60-80% más rápido.
config.cacheStores = ({ FileStore }) => [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.metro-cache') }),
];

module.exports = config;
