import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useFrameOutput, useCameraPermission } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useRunOnJS } from 'react-native-worklets-core';

export default function FoodScanner() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [prediction, setPrediction] = useState<string>('Apuntando...');
  
  const device = useCameraDevice('back');

  // Load the model from local assets - using an empty delegates array for default CPU execution
  const plugin = useTensorflowModel(require('../assets/models/food101.tflite'), []);
  const model = plugin.state === 'loaded' ? plugin.model : undefined;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Update UI state from the Worklet thread
  const updatePrediction = useRunOnJS((result: string) => {
    setPrediction(result);
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      if (!model) {
        frame.dispose();
        return;
      }

      try {
        if (frame.hasPixelBuffer) {
          const buffer = frame.getPixelBuffer();
          // Run the model synchronously using the frame's pixel ArrayBuffer
          const outputs = model.runSync([buffer]);
          
          if (outputs && outputs[0]) {
            // Mock prediction logic: just to show structure
            // updatePrediction("Comida Detectada");
          }
        }
      } catch (e) {
        console.error('[FoodScanner] Frame processing error:', e);
      } finally {
        // ALWAYS dispose the frame to avoid stalling the camera pipeline
        frame.dispose();
      }
    }
  });

  if (!hasPermission) return <Text style={{ color: 'white' }}>Solicitando permisos de cámara...</Text>;
  if (device == null) return <Text style={{ color: 'white' }}>No se encontró cámara</Text>;
  
  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[frameOutput]}
      />
      
      <View style={styles.overlay}>
        {plugin.state === 'loading' ? (
          <View style={styles.loadingBox}>
             <ActivityIndicator color="#7C5CFC" />
             <Text style={styles.predictionText}>Cargando IA...</Text>
          </View>
        ) : (
          <View style={styles.predictionBox}>
            <Text style={styles.predictionText}>{prediction}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  predictionBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C5CFC',
  },
  loadingBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  predictionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
