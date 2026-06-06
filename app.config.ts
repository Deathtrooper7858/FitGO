import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Verificamos si estamos corriendo en modo desarrollo
  const IS_DEV = process.env.APP_VARIANT === 'development';

  return {
    ...config,
    // Si es desarrollo, el nombre en el celular será "FitGO Dev"
    name: IS_DEV ? 'FitGO Dev' : config.name,
    ios: {
      ...config.ios,
      // Cambiamos el identificador para iOS
      bundleIdentifier: IS_DEV ? 'com.fitgo.app.dev' : config.ios?.bundleIdentifier,
    },
    android: {
      ...config.android,
      // Cambiamos el identificador de paquete para Android
      package: IS_DEV ? 'com.fitgo.app.dev' : config.android?.package,
    },
  } as ExpoConfig;
};
