module.exports = {
  project: {
    android: {
      packageName: 'com.fitgo.app',
    },
  },
  dependencies: {
    // Exclude react-native-worklets-core from native autolinking.
    // react-native-reanimated 3.17+ ships its own embedded worklets runtime
    // (libworklets.so). When worklets-core is ALSO linked natively, two
    // separate worklets runtimes register into the same JSI instance, causing
    // a null pointer dereference (SIGSEGV) in libreanimated.so whenever a
    // Reanimated animation triggers a UI-thread callback (e.g. on navigation).
    // Vision Camera's JS-side still works because it only imports the JS layer.
    'react-native-worklets-core': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
