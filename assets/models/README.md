# Modelos de IA (On-Device ML)

Esta carpeta está destinada a alojar los modelos de TensorFlow Lite (.tflite) que se ejecutarán localmente en el dispositivo usando `react-native-fast-tflite`.

Para el escáner de comida (FoodScanner), debes colocar aquí un modelo clasificador de imágenes (por ejemplo, `food101.tflite`) y su correspondiente archivo de etiquetas `labels.txt`.

## Instrucciones:
1. Descarga un modelo de clasificación de comida (ej. de TensorFlow Hub o Kaggle).
2. Asegúrate de que termine en `.tflite`.
3. Renómbralo a `food101.tflite` y colócalo en esta carpeta.
4. Crea o pega el archivo `labels.txt` con los nombres de las clases (una por línea) en esta misma carpeta.
