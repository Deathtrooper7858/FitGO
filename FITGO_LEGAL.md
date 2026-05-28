Contexto de la Aplicación "FitGO" para Políticas de Privacidad y Términos y Condiciones
Este documento detalla el funcionamiento técnico, la recopilación de datos y los servicios de terceros utilizados en la aplicación FitGO ("Tu mejor versión"). Su objetivo es servir como base o "prompt" detallado para generar las Políticas de Privacidad y Términos y Condiciones (TyC) de la app.

1. Información General de la Aplicación
Nombre de la App: FitGO
Propósito: Es una aplicación móvil enfocada en el fitness, el seguimiento de la salud y el bienestar. Ayuda a los usuarios a registrar sus hábitos, nutrición, entrenamientos y medir su progreso físico y de salud.
Plataformas: iOS y Android (Desarrollada con React Native / Expo).
Público Objetivo: Usuarios generales interesados en mejorar su estado físico. No es una aplicación médica.
2. Servicios de Terceros (Subprocesadores de Datos)
La aplicación se apoya en los siguientes servicios de terceros, los cuales procesan o almacenan datos de los usuarios:

Supabase: Utilizado como backend (Base de datos y Autenticación). Aquí se almacenan de forma segura los perfiles de usuario, registros de actividad, nutrición y métricas del cuerpo.
RevenueCat: Utilizado para gestionar las compras integradas y suscripciones (Suscripciones Premium).
OpenAI (IA): Utilizado para funcionalidades inteligentes dentro de la app (por ejemplo, analizar alimentos escaneados, generar rutinas, o proveer recomendaciones basadas en la evaluación del progreso).
Google Translate API: Para funcionalidades de traducción y soporte multi-idioma (i18n).
Tiendas de Aplicaciones (Apple App Store / Google Play Store): Para el procesamiento de pagos.
3. Recopilación y Tratamiento de Datos
La aplicación recopila las siguientes categorías de datos:

Datos de Cuenta e Identidad: Correo electrónico, contraseña cifrada (gestionado vía Supabase Auth), nombre de usuario o alias.
Datos Físicos y de Salud (Sensibles):
Medidas corporales (peso, altura, porcentajes).
Registros de sueño.
Niveles de actividad física (NEAT, rutinas de ejercicio).
Registros de alimentación y nutrición.
Datos Multimedia: Fotografías (ej. fotos de progreso físico, escaneo de alimentos/etiquetas).
Datos de Uso y Comportamiento: Interacciones dentro de la app, logros desbloqueados, evaluaciones de progreso y uso de la IA.
4. Permisos del Dispositivo Requeridos
Para funcionar correctamente, FitGO solicita acceso a:

Cámara y Galería de Fotos (expo-camera, expo-image-picker): Para escanear alimentos (reconocimiento visual) y subir fotos de perfil o de progreso físico.
Notificaciones Push (expo-notifications): Para enviar recordatorios sobre comidas, agua, entrenamientos o registro de sueño.
Almacenamiento Local (expo-file-system, AsyncStorage): Para guardar preferencias del usuario, configuraciones de la app y caché de datos.
Micrófono / Audio (expo-audio): Posiblemente para interacción por voz, alertas durante el ejercicio, etc.
5. Uso de Inteligencia Artificial (OpenAI)
Este es un punto crítico para las políticas de privacidad:

La app envía cierta información del usuario (textos, datos de alimentos, o posiblemente imágenes escaneadas) a los servidores de OpenAI a través de su API.
Finalidad: Procesar estos datos para devolver estimaciones nutricionales, análisis de rutinas, o respuestas de un asistente inteligente.
Privacidad IA: Se debe aclarar que los datos enviados a la IA se usan exclusivamente para proveer el servicio en el momento, y que el usuario consiente este envío de información a un tercero (OpenAI).
6. Monetización y Pagos
La aplicación cuenta con un modelo Freemium o de pago (Muro de pago / Paywall).
Los pagos se gestionan externamente a través de Apple y Google.
RevenueCat actúa como intermediario para validar si el usuario tiene una suscripción activa. FitGO no guarda ni procesa directamente tarjetas de crédito o información bancaria.
7. Aspectos Legales y "Descargos de Responsabilidad" (Disclaimers) que DEBEN incluirse
Al generar los Términos y Condiciones, asegúrate de pedirle a la IA (Claude) que haga especial énfasis en:

Descargo de Responsabilidad Médica (Medical Disclaimer): FitGO no proporciona consejos médicos, diagnósticos ni tratamientos. Toda la información (incluyendo la generada por IA) es puramente informativa. El usuario debe consultar a un médico antes de iniciar cualquier dieta o rutina.
Asunción de Riesgo: El usuario asume la responsabilidad por cualquier lesión o problema derivado de los entrenamientos sugeridos en la app.
Límites de Edad: Establecer la edad mínima para usar la app (usualmente +13 o +16 dependiendo de normativas como COPPA o GDPR).
Transferencia Internacional de Datos: Ya que Supabase y OpenAI operan servidores que pueden estar en EE. UU., se debe incluir una cláusula sobre transferencia de datos si el usuario reside en Europa (GDPR) o Latinoamérica.