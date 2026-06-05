# Propuesta de Arquitectura: Reconocimiento de Alimentos "On-Device" para FitGO

> [!TIP]
> **Objetivo:** Implementar una función de escaneo de alimentos y reconocimiento de imágenes en la app que sea **100% gratuita, escalable a millones de usuarios y con uso ilimitado**, evitando costos mensuales de APIs externas.

## 🏗️ La Arquitectura Propuesta (El Combo Ilimitado)

La solución se divide en dos componentes principales que trabajan juntos: **Procesamiento Local (IA)** y **Consulta en la Nube (Base de datos abierta)**.

### 1. El Cerebro Visual: IA On-Device (TensorFlow Lite)
En lugar de subir las fotos de los usuarios a un servidor en la nube para que sean analizadas (lo cual cuesta dinero por cada foto), el análisis se hace **dentro del celular del usuario**.

*   **¿Cómo funciona?** Descargamos un pequeño archivo de modelo de Inteligencia Artificial (por ejemplo, un modelo basado en el dataset *Food-101* que pesa unos 10-20 MB) e incluimos este archivo dentro de la app FitGO.
*   **Librerías a usar en React Native:** `react-native-vision-camera` junto con `react-native-fast-tflite`.
*   **Beneficios Clave:**
    *   **Costo Cero ($0):** Al no usar servidores de procesamiento, puedes escanear 1 millón de fotos y no te costará nada.
    *   **Velocidad Extrema:** La cámara reconoce el plato en tiempo real (milisegundos) sin tiempos de carga por internet.
    *   **Privacidad:** Las fotos nunca salen del celular del usuario (excelente para el marketing de la app).
    *   **Funciona Offline:** La cámara sabe qué comida es incluso en modo avión.

### 2. Los Datos Nutricionales: Open Food Facts API
Una vez que nuestra IA en el celular sabe qué comida es, necesitamos saber cuántas calorías tiene. Para esto usaremos la API pública más grande del mundo.

*   **¿Cómo funciona?** Es como la "Wikipedia" de la comida. Es una base de datos abierta y mantenida por la comunidad global.
*   **Beneficios Clave:**
    *   **100% Gratuita e Ilimitada:** Sin necesidad de tarjetas de crédito ni cuotas mensuales.
    *   **Códigos de Barras:** Nos da la funcionalidad extra (y gratis) de poder escanear directamente el código de barras de cualquier producto del supermercado.

---

## 🔄 El Flujo de Trabajo (Experiencia del Usuario)

1.  **Apertura de Cámara:** El usuario abre FitGO y apunta la cámara a su almuerzo (por ejemplo, una hamburguesa).
2.  **Inferencia Local (Magia):** El modelo TensorFlow Lite integrado en la app analiza lo que ve la cámara al instante y dictamina: *"Esto es una Hamburguesa con un 96% de confianza"*.
3.  **Consulta Nutricional:** La app toma internamente la palabra "Hamburguesa" y hace una petición silenciosa y rápida a la API de *Open Food Facts*.
4.  **Resultado Final:** El usuario ve en su pantalla: *"🍔 Hamburguesa detectada: 250 kcal, 12g Proteína, 30g Carbohidratos"*, listo para guardar en su diario.

---

## 🚀 Siguientes Pasos para el MVP (Producto Mínimo Viable)

Para probar que esto funciona en nuestro código sin invertir demasiado tiempo, deberíamos hacer una Prueba de Concepto (PoC):

1.  **Conseguir el Modelo:** Descargar un modelo gratuito pre-entrenado `.tflite` especializado en comidas.
2.  **Instalar Dependencias:** Configurar `react-native-fast-tflite` en el proyecto de FitGO.
3.  **Hacer la Prueba Visual:** Lograr que la consola de React Native imprima el nombre de la comida cuando apuntemos la cámara.
4.  **Conectar la Base de Datos:** Hacer un simple `fetch()` a la API de Open Food Facts con el resultado obtenido.
