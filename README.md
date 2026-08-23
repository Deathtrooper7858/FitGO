# FitGO

## ¿Qué es?
FitGO es una aplicación móvil de fitness moderna, gamificada y competitiva, diseñada para asistir a los usuarios en el registro de sus entrenamientos, nutrición y evolución física. Destaca por integrar funciones avanzadas como un asistente (coach) de inteligencia artificial, ligas competitivas estructuradas y seguimiento detallado de hábitos diarios.

## ¿Para qué sirve?
- **Registro Inteligente de Actividad y Nutrición:** Permite registrar entrenamientos, calorías quemadas y consumidas. Los usuarios pueden escanear códigos de barras de alimentos o utilizar comandos de voz para interactuar con su coach de IA y registrar su progreso sin esfuerzo.
- **Ligas Competitivas y Sistema Anti-Cheat:** Cuenta con un entorno competitivo dividido en rangos (desde Bronce hasta Diamante). Para asegurar la justicia, implementa sofisticados sistemas anti-fraude que analizan la viabilidad fisiológica de los resultados (cálculos MET, tiempos mínimos entre entrenamientos, límites de ganancia de fuerza) y promueve la verificación a través de smartwatches o reportes de la comunidad.
- **Seguimiento Diario y Hábitos:** Facilita el monitoreo de pasos, consumo de agua y rachas de días activos (streaks). Ofrece Widgets nativos para la pantalla de inicio del dispositivo para visualizar este resumen diario rápidamente.
- **Progreso Visual y Salud:** Integración con la cámara y sensores del dispositivo para llevar un álbum de fotos de progreso físico y conectar con datos de salud (como frecuencia cardíaca).

## ¿Cómo se desarrolló el proyecto?
El proyecto está construido sobre un stack tecnológico moderno, altamente escalable y enfocado en el ecosistema móvil (cross-platform):

- **Frontend Móvil (App):** 
  - Desarrollado con **React Native** (v0.83) y el framework **Expo** (v55).
  - Navegación gestionada a través de **Expo Router**.
  - Interfaces fluidas utilizando `react-native-reanimated`, `@shopify/flash-list` para listas de alto rendimiento, y gráficos interactivos con `react-native-gifted-charts`.
  - Internacionalización integrada mediante `i18next`.

- **Backend y Base de Datos:** 
  - Infraestructura backend como servicio utilizando **Supabase**. Se encarga de la base de datos (PostgreSQL), la autenticación de usuarios y las *Edge Functions* para procesar la lógica de negocio, como la validación anti-fraude en segundo plano.

- **Integración Nativa y Hardware:** 
  - Uso intensivo de las APIs del dispositivo móvil: `expo-camera`, `expo-audio` (para el coach de voz), `expo-sensors` (podómetro/acelerómetro), y acceso seguro al almacenamiento nativo con `expo-secure-store`.
  - Implementación de Widgets para Android mediante `react-native-android-widget`.

- **Infraestructura y Monitoreo:**
  - Control de calidad y errores en tiempo real empleando **Sentry**.
  - Monetización y gestión de suscripciones o compras integradas con **RevenueCat** (`react-native-purchases`) y **Google Mobile Ads**.
  - Herramientas de desarrollo sólidas: TypeScript estricto, ESLint, Jest para pruebas, y Husky para el control de commits.
