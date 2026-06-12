import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

export function GlobalBackground() {
  const colors = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        // Intense gradient starting from primary color
        colors={[
          colors.primary, 
          colors.primary + 'AA', // 66% opacity
          colors.background
        ]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Subtle overlay to ensure text readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)' }]} />
    </View>
  );
}
