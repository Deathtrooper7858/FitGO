module.exports = ({ config }) => {
  if (process.env.APP_VARIANT === 'development') {
    return {
      ...config,
      name: 'FitGO (Dev)',
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

  return config;
};
