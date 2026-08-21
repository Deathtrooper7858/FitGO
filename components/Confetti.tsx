import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COUNT = 15;
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        return {
          id: `${trigger}-${i}`,
          x: (width / 2) + (Math.random() * 40 - 20),
          y: height * 0.7,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          animY: new Animated.Value(0),
          animX: new Animated.Value(0),
          animOp: new Animated.Value(1),
          animScale: new Animated.Value(1 + Math.random() * 0.5),
          destX: (Math.random() - 0.5) * 250,
          destY: (Math.random() - 0.5) * 250 - 100,
        };
      });
      setParticles(newParticles);

      newParticles.forEach((p) => {
        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: p.destY,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: p.destX,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.animOp, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.animScale, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          })
        ]).start();
      });

      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
      {particles.map((p) => {
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: p.color,
              transform: [
                { translateY: p.animY },
                { translateX: p.animX },
                { scale: p.animScale }
              ],
              opacity: p.animOp
            }}
          />
        );
      })}
    </View>
  );
}
