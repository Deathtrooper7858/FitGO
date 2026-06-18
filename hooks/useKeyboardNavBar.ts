import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useSegments } from 'expo-router';
import { useTheme } from './useTheme';

let isEdgeToEdgeActive = false;
try {
  const { isEdgeToEdge } = require('react-native-is-edge-to-edge');
  isEdgeToEdgeActive = isEdgeToEdge();
} catch (e) {
  // Fallback — module not available
}

export function useKeyboardNavBar() {
  const colors = useTheme();
  const segments = useSegments();

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (isEdgeToEdgeActive) return;

    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('#00000000');

    cleanupRef.current = () => {
      const inTabs = segments[0] === '(tabs)';
      const targetColor = inTabs ? colors.surface : colors.background;
      NavigationBar.setPositionAsync('relative');
      NavigationBar.setBackgroundColorAsync(targetColor);
      NavigationBar.setBorderColorAsync(targetColor);
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [colors, segments]);
}
