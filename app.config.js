module.exports = ({ config }) => {
  if (process.env.APP_VARIANT === 'development') {
    return {
      ...config,
      name: 'fitgo-dev',
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

  return config;
};
