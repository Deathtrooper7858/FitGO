import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface CustomToastProps {
  message: string;
  type: 'success' | 'error';
  onHide: () => void;
}

export function CustomToast({ message, type, onHide }: CustomToastProps) {
  const colors = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const isError = type === 'error';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isError ? '#FEF2F2' : colors.surface,
          borderColor: isError ? '#EF4444' : colors.primary,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {isError ? (
        <AlertCircle size={24} color="#EF4444" />
      ) : (
        <CheckCircle2 size={24} color={colors.primary} />
      )}
      <Text style={[styles.text, { color: isError ? '#991B1B' : colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 20, right: 20,
    zIndex: 9999, flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  text: { fontSize: 14, fontWeight: '700', flex: 1 },
});
