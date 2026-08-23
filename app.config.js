module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT;

  if (variant === 'development') {
    return {
      ...config,
      name: 'FitGO (Dev)',
      scheme: 'fitgo-dev',
      ios: {
        ...config.ios,
        bundleIdentifier: 'com.fitgo.app.dev',
      },
      android: {
        ...config.android,
        package: 'com.fitgo.app.dev',
      },
    };
  }

  if (variant === 'preview') {
    return {
      ...config,
      name: 'FitGO (Preview)',
      scheme: 'fitgo-preview',
      ios: {
        ...config.ios,
        bundleIdentifier: 'com.fitgo.app.preview',
      },
      android: {
        ...config.android,
        package: 'com.fitgo.app.preview',
      },
    };
  }

  // Production variant (default)
  return {
    ...config,
    name: 'FitGO',
    scheme: 'fitgo',
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.fitgo.app',
    },
    android: {
      ...config.android,
      package: 'com.fitgo.app',
    },
  };
};
