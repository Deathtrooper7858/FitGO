# Guía para el Desarrollo de la Web de Fitgo

Esta guía está diseñada para que Claude (o cualquier otro asistente/desarrollador) pueda crear la página web oficial de **Fitgo**, conectada al mismo ecosistema que la aplicación móvil existente.

## 1. Objetivo General

Desarrollar una página web promocional y funcional para **Fitgo**, una aplicación móvil de fitness y entrenamiento físico. La web debe mantener una coherencia visual estricta con la app móvil y permitir a los usuarios interactuar con sus cuentas y suscripciones directamente desde el navegador.

## 2. Stack Tecnológico Sugerido para la Web

Dado que la aplicación móvil está construida con **React Native, Expo, TypeScript y Supabase**, se recomienda el siguiente stack para la web:

- **Framework Frontend:** Next.js (React) o Vite (React) con TypeScript.
- **Estilos:** Tailwind CSS (para replicar la apariencia de la app móvil que actualmente usa estilos similares).
- **Backend / Autenticación / Base de Datos:** Supabase (debe conectarse al MISMO proyecto de Supabase que usa la app móvil).
- **Pagos / Suscripciones:** Integración de pagos web (como Stripe) vinculada a la cuenta del usuario para que la suscripción funcione en la app (que usa RevenueCat).

## 3. Requerimientos Visuales y de Diseño

- **Similitud Visual:** La paleta de colores, tipografías y el estilo de los componentes (botones, tarjetas, gráficos) deben ser consistentes con la app móvil.
- **Diseño Responsivo:** Debe verse excelente tanto en dispositivos móviles como en pantallas de escritorio.
- **Experiencia Gamificada y Rápida:** Transiciones fluidas, animaciones modernas para dar una sensación de fluidez y modernidad.

## 4. Secciones Principales de la Web

### A. Landing Page (Inicio)

- Hero section con un llamado a la acción (CTA) claro para descargar la app o iniciar sesión/registrarse en la plataforma.
- Muestra de la interfaz de la app (mockups en dispositivos móviles).

### B. Sección "About" (Sobre la App)

Debe explicar detalladamente las funcionalidades clave de Fitgo:

- **Registro de progreso:** Seguimiento de peso corporal e historial detallado.
- **Entrenamiento:** Mapa muscular interactivo y rutinas.
- **Nutrición:** Base de datos de alimentos y carnes integrada.
- **Visión:** Sistema de entrenamiento rápido, eficiente y gamificado, superando en fluidez a alternativas como Fitia o MyFitnessPal.

### C. Sección "About Us" (Sobre Nosotros)

- Información sobre los desarrolladores detrás de Fitgo.
- Misión del equipo, motivación y visión a futuro del proyecto.

## 5. Funcionalidades Clave y Conexión Backend

### A. Autenticación Centralizada (Supabase)

- **Inicio de sesión y Registro web:** La web debe incluir formularios para iniciar sesión y registrarse.
- **Base de datos compartida (Single Sign-On):** Dado que se conectará a la misma base de datos en Supabase, una cuenta creada en la web debe permitir el acceso inmediato en la app móvil, y viceversa.
- Se debe utilizar `@supabase/supabase-js` para manejar la sesión del usuario.

### B. Gestión de Suscripciones (Compras en la Web)

- Los usuarios deben poder comprar o administrar su suscripción premium directamente desde la página web.
- El sistema de pagos en la web debe actualizar el estado del usuario en Supabase (o sincronizarse con RevenueCat) para que, al comprar la suscripción en la web, el usuario obtenga inmediatamente los beneficios premium al abrir la aplicación móvil.

## 6. Instrucciones para Claude

1. Inicializar el proyecto web usando un framework moderno (Next.js recomendado para SEO).
2. Configurar Tailwind CSS para coincidir con la estética de la app.
3. Configurar el cliente de Supabase usando las variables de entorno de Fitgo (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Construir las rutas y vistas estáticas: Inicio, About, About Us.
5. Desarrollar el flujo de Autenticación (Login, Registro, Recuperación de contraseña).
6. Implementar el flujo de Checkout de suscripciones (Ej. Stripe Checkout) conectado a Supabase.
