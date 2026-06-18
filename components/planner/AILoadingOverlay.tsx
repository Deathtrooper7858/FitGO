import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const AI_MESSAGES = {
  workouts: [
    "Analizando tu historial muscular...",
    "Calculando simetría y fatiga...",
    "Ajustando volumen e intensidad...",
    "Buscando ejercicios de reemplazo...",
    "Optimizando para sobrecarga progresiva...",
    "Finalizando tu plan perfecto..."
  ],
  nutrition: [
    "Analizando tus requerimientos calóricos...",
    "Equilibrando macros y micronutrientes...",
    "Seleccionando alimentos de tu preferencia...",
    "Evitando alergias y restricciones...",
    "Generando recetas fáciles y rápidas...",
    "Finalizando tu menú semanal..."
  ],
  analysis: [
    "Nutricionista leyendo tus macros...",
    "Revisando tus metas de calorías...",
    "Redactando consejos personalizados...",
    "Generando plan de acción..."
  ],
  bodyweight: [
    "Traduciendo a peso corporal...",
    "Buscando alternativas de calistenia...",
    "Ajustando la dificultad sin pesas...",
    "Casi listo..."
  ]
};

interface AILoadingOverlayProps {
  visible: boolean;
  mode: 'workouts' | 'nutrition' | 'analysis' | 'bodyweight';
}

export default function AILoadingOverlay({ visible, mode }: AILoadingOverlayProps) {
  const colors = useTheme();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }
    const msgs = AI_MESSAGES[mode];
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % msgs.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [visible, mode]);

  if (!visible) return null;

  const msgs = AI_MESSAGES[mode];

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ backgroundColor: colors.surface, padding: 30, borderRadius: 28, alignItems: 'center', width: '85%', maxWidth: 340, shadowColor: colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: colors.primary + '55' }}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20, transform: [{ scale: 1.5 }] }} />
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center' }}>
          La IA está trabajando...
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', minHeight: 40, fontWeight: '500' }}>
          {msgs[msgIndex]}
        </Text>
      </View>
    </View>
  );
}
