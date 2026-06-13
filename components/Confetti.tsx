import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COUNT = 80;
const CONFETTI_EMOJIS = ['🎉', '✨', '🔥', '💪', '🏆'];

export function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        return {
          id: `${trigger}-${i}`,
          x: Math.random() * width,
          emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
          animY: new Animated.Value(-50),
          animX: new Animated.Value(0),
          animRot: new Animated.Value(0),
          animOp: new Animated.Value(1),
          speedY: 1500 + Math.random() * 2000,
          wobbleAmt: 20 + Math.random() * 40,
        };
      });
      setParticles(newParticles);

      newParticles.forEach((p) => {
        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: height + 100,
            duration: p.speedY,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: p.wobbleAmt * (Math.random() > 0.5 ? 1 : -1),
            duration: p.speedY,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(p.animRot, {
            toValue: 1,
            duration: p.speedY,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.animOp, {
            toValue: 0,
            duration: p.speedY,
            delay: p.speedY - 500,
            useNativeDriver: true,
          })
        ]).start();
      });

      const timer = setTimeout(() => {
        setParticles([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
      {particles.map((p) => {
        const spin = p.animRot.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 + Math.random() * 360}deg`]
        });
        return (
          <Animated.Text
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              fontSize: 28 + Math.random() * 20,
              transform: [
                { translateY: p.animY },
                { translateX: p.animX },
                { rotate: spin }
              ],
              opacity: p.animOp
            }}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}
