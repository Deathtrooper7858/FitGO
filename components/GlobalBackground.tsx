import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

export function GlobalBackground() {
  const colors = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} pointerEvents="none">
      <LinearGradient
        // The glow is drawn ON TOP of the base background
        // This ensures the custom premium color is correctly visible and not obscured by dark overlays
        colors={[
          colors.primary, 
          'transparent'
        ]}
        locations={[0, 0.8]}
        style={[StyleSheet.absoluteFill, { opacity: colors.theme === 'dark' ? 0.15 : 0.08 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}
