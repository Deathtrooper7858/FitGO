const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withMultiDex = (expoConfig) => {
  return withAppBuildGradle(expoConfig, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Inject multiDexEnabled into defaultConfig if not already present
    if (!contents.includes('multiDexEnabled')) {
      contents = contents.replace(
        /versionName\s+"[^"]+"\s*\n/,
        (match) => `${match}        multiDexEnabled true\n`
      );
    }

    // Inject multidex dependency if not already present
    if (!contents.includes('androidx.multidex:multidex')) {
      contents = contents.replace(
        /implementation\("com\.facebook\.react:react-android"\)/,
        `implementation("com.facebook.react:react-android")\n    implementation("androidx.multidex:multidex:2.0.1")`
      );
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
};



const withDisableLintVital = (expoConfig) => {
  let updatedConfig = withProjectBuildGradle(expoConfig, (modConfig) => {
    const lintDisableCode = `
subprojects { subproject ->
  subproject.tasks.configureEach { task ->
    if (task.name.startsWith("lintVital") || task.name.startsWith("lint")) {
      task.enabled = false
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

const withR8Optimization = (expoConfig) => {
  return withAppBuildGradle(expoConfig, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Ensure enableMinifyInReleaseBuilds defaults to true
    if (contents.includes("def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()")) {
      contents = contents.replace(
        "def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()",
        "def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: 'true').toBoolean()"
      );
    }

    // Ensure proguard-android-optimize.txt is used
    if (contents.includes('getDefaultProguardFile("proguard-android.txt")')) {
      contents = contents.replace(
        'getDefaultProguardFile("proguard-android.txt")',
        'getDefaultProguardFile("proguard-android-optimize.txt")'
      );
    }

    // Ensure shrinkResources in release defaults to true
    if (contents.includes("def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'")) {
      contents = contents.replace(
        "def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'",
        "def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'true'"
      );
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
};

module.exports = ({ config }) => {
  const variant = (process.env.APP_VARIANT || 'development').trim();

  let finalConfig;
  if (variant === 'development') {
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
  } else if (variant === 'preview') {
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

  return withR8Optimization(withMultiDex(withDisableLintVital(finalConfig)));
};

