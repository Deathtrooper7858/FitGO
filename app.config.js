const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withDisableLintVital = (expoConfig) => {
  let updatedConfig = withProjectBuildGradle(expoConfig, (modConfig) => {
    const lintDisableCode = `
subprojects { subproject ->
  subproject.tasks.configureEach { task ->
    if (task.name.startsWith("lintVital")) {
      task.enabled = false
    }
  }
  def configLint = {
    if (subproject.hasProperty('android')) {
      subproject.android {
        lintOptions {
          abortOnError false
          checkReleaseBuilds false
          checkDependencies false
        }
      }
    }
  }
  if (subproject.state.executed) {
    configLint()
  } else {
    subproject.afterEvaluate {
      configLint()
    }
  }
}
`;
    if (!modConfig.modResults.contents.includes('lintVital')) {
      modConfig.modResults.contents += lintDisableCode;
    }
    return modConfig;
  });

  updatedConfig = withAppBuildGradle(updatedConfig, (modConfig) => {
    if (!modConfig.modResults.contents.includes('abortOnError false')) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /android\s*\{/,
        `android {
    lintOptions {
        checkReleaseBuilds false
        abortOnError false
        ignoreWarnings true
        checkDependencies false
    }`
      );
    }
    return modConfig;
  });

  return updatedConfig;
};

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT;

  let finalConfig;
  if (variant === 'development') {
    finalConfig = {
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
  } else if (variant === 'preview') {
    finalConfig = {
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
  } else {
    // Production variant (default)
    finalConfig = {
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
  }

  return withDisableLintVital(finalConfig);
};

