import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useSegments } from 'expo-router';
import { useTheme } from './useTheme';

export function useKeyboardNavBar() {
  const colors = useTheme();
  const segments = useSegments();

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // On Android 15+ (API 35+), edge-to-edge is enforced by the system and navigation bar color APIs are deprecated
    if (typeof Platform.Version === 'number' && Platform.Version >= 35) return;

    const inTabs = segments[0] === '(tabs)';
    const targetColor = inTabs ? colors.surface : colors.background;

    try {
      NavigationBar.setPositionAsync('relative').catch(() => {});
      NavigationBar.setBackgroundColorAsync(targetColor).catch(() => {});
      NavigationBar.setBorderColorAsync(targetColor).catch(() => {});
    } catch (e) {
      // Silently catch unsupported navigation bar platform operations
    }

    cleanupRef.current = () => {
      try {
        NavigationBar.setPositionAsync('relative').catch(() => {});
        NavigationBar.setBackgroundColorAsync(targetColor).catch(() => {});
        NavigationBar.setBorderColorAsync(targetColor).catch(() => {});
      } catch (e) {
        // Silently catch
      }
    };

    return () => {
      try {
        cleanupRef.current?.();
      } catch {}
      cleanupRef.current = null;
    };
  }, [colors, segments]);
}
