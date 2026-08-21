# 🛡️ Informe de Viabilidad: Sistemas Anti-Cheat para FitGO (Ligas Competitivas)

**Objetivo:** Definir la infraestructura técnica para evitar fraudes en el registro de entrenamientos, asegurando que las Ligas Competitivas y los Rankings de FitGO sean justos, precisos y mantengan el prestigio de la aplicación.

---

## 1. El Problema del "Sistema de Honor"
Actualmente, el 90% de las aplicaciones fitness (incluyendo versiones gratuitas de grandes marcas) confían ciegamente en el usuario. El usuario puede marcar un entrenamiento como "Completado" desde su cama. 

> [!WARNING]
> En un entorno con **Ligas Competitivas, Rangos o Premios**, el Sistema de Honor colapsa. Bastan unos pocos usuarios haciendo trampa (subiendo a rango Diamante sin esfuerzo) para destruir la credibilidad de la app y causar el abandono masivo de los usuarios honestos.

---

## 2. Opciones de Solución Tecnológica

A continuación se presentan las 3 arquitecturas viables para FitGO, desde la más sencilla hasta la más vanguardista.

### Opción A: Verificación Biométrica Criptográfica (Uso de Smartwatches)
La aplicación exige vinculación con **Apple Health (iOS)** o **Google Fit / Health Connect (Android)** para participar en las Ligas.

* **Mecanismo:** Al terminar una sesión, FitGO extrae el historial de la **Frecuencia Cardíaca (BPM)** y las **Calorías Activas** registradas por el smartwatch durante esa ventana de tiempo.
* **Criterio de Validación:** Si no existen picos de frecuencia cardíaca (ej. el corazón nunca superó los 90 latidos por minuto durante una supuesta sesión intensa de HIIT o pesas), la sesión es invalidada automáticamente por "Esfuerzo no detectado".
* **Ventajas:** 
  * Cero fricción para el usuario (solo entrena y el reloj hace el resto).
  * Es altamente resistente al fraude (falsificar el pulso cardíaco requiere hardware especializado).
* **Desventajas:**
  * Excluye de la liga competitiva a usuarios que no posean un smartwatch.
  * No puede validar la "técnica" del ejercicio, solo el esfuerzo cardiovascular general.

### Opción B: Computer Vision (IA de Detección de Posturas)
Uso de la cámara del smartphone apoyado en el suelo o un trípode.

* **Mecanismo:** Se integra un modelo de Machine Learning (como *Google MediaPipe*) en React Native. La cámara lee los 33 puntos articulares del esqueleto del usuario en tiempo real.
* **Criterio de Validación:** La IA actúa como un juez. Si es una sentadilla, el modelo calcula matemáticamente si la cadera descendió por debajo de las rodillas. Si es válido, suma 1 repetición.
* **Ventajas:** 
  * Sistema infalible y de altísimo nivel tecnológico (estatus Premium).
  * Cuenta las repeticiones automáticamente, mejorando la experiencia de usuario.
* **Desventajas:**
  * Muy incómodo para usuarios que asisten a gimnasios comerciales abarrotados.
  * Alto consumo de batería y procesamiento del dispositivo móvil.

### Opción C: Verificación Híbrida (Geofencing + Acelerómetro)
Una combinación de los sensores internos del teléfono sin requerir hardware externo.

* **Mecanismo 1 (Acelerómetro):** Para ejercicios de peso corporal, el teléfono debe sujetarse al pecho (o ponerse en el suelo). El giroscopio valida el patrón de movimiento.
* **Mecanismo 2 (Geofencing GPS):** La app valida las coordenadas de ubicación durante el tiempo de entrenamiento, confirmando que el usuario estuvo físicamente en un gimnasio.
* **Criterio de Validación:** Cumplir con la ubicación o con el patrón de movimiento de los sensores.
* **Ventajas:** 
  * Accesible para el 100% de los usuarios con smartphone.
  * Muy económico de implementar a nivel de código.
* **Desventajas:**
  * Las validaciones por giroscopio son fáciles de engañar agitanto el teléfono con la mano.
  * Requiere permisos estrictos de ubicación (GPS).

---

## 3. Recomendación Estratégica para FitGO

Para balancear la **retención de usuarios** con la **integridad competitiva**, se recomienda una arquitectura por "Tiers" (Niveles):

> [!TIP]
> **Propuesta de Implementación:**
> 
> 1. **Ligas Casuales (Bronce - Oro):** Utilizan el "Sistema de Honor" apoyado por gamificación. Ideal para la masificación y retención temprana.
> 2. **Ligas Pro / Verificadas (Platino - Diamante):** Requisito obligatorio de **Verificación Biométrica (Opción A)**. Para estar en el Top del ranking de FitGO, el usuario DEBE conectar su smartwatch o subir evidencia. Esto crea un ecosistema justo para los verdaderos competidores y fomenta la compra de cuentas Premium.

---
*Informe generado para evaluación de producto y arquitectura de FitGO.*
