import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FloatingHeroIconProps {
  icon: React.ReactNode;
  color?: string;
  glowColor?: string;
  size?: number;
  containerStyle?: ViewStyle;
}

export function FloatingHeroIcon({
  icon,
  color = '#8B5CF6',
  glowColor = '#7C5CFC',
  size = 96,
  containerStyle,
}: FloatingHeroIconProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const starPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Continuous floating animation (Native Driver - 60fps rock solid)
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Aura pulse animation
    const auraAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.08,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.85,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 0.96,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.4,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Star sparkle animation
    const starsAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, {
          toValue: 0.9,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(starPulse, {
          toValue: 0.2,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim.start();
    auraAnim.start();
    starsAnim.start();

    return () => {
      floatAnim.stop();
      auraAnim.stop();
      starsAnim.stop();
    };
  }, [translateY, pulseScale, pulseOpacity, starPulse]);

  const halfSize = size / 2;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Outer ambient glow */}
      <Animated.View
        style={[
          styles.glowOuterRing,
          {
            width: size * 1.55,
            height: size * 1.55,
            borderRadius: (size * 1.55) / 2,
            backgroundColor: glowColor + '18',
            shadowColor: glowColor,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Subtle sparkle dots around the circle */}
      <Animated.View
        style={[
          styles.starsContainer,
          {
            opacity: starPulse,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.sparkleDot, { top: -4, left: '26%', backgroundColor: glowColor }]} />
        <View style={[styles.sparkleDot, { top: 12, right: '14%', backgroundColor: glowColor, width: 4, height: 4 }]} />
        <View style={[styles.sparkleDot, { bottom: 8, left: '16%', backgroundColor: glowColor, width: 3, height: 3 }]} />
        <View style={[styles.sparkleDot, { bottom: 16, right: '22%', backgroundColor: glowColor }]} />
      </Animated.View>

      {/* Floating container for icon circle */}
      <Animated.View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Middle ambient ring */}
        <LinearGradient
          colors={[glowColor + '40', glowColor + '10', 'transparent']}
          style={[
            styles.middleRing,
            {
              width: size * 1.25,
              height: size * 1.25,
              borderRadius: (size * 1.25) / 2,
              borderColor: glowColor + '30',
            },
          ]}
        />

        {/* Center icon circle with gradient and glowing border */}
        <LinearGradient
          colors={[glowColor + '35', glowColor + '15', '#0F1026']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[
            styles.mainCircle,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderColor: glowColor + '60',
              shadowColor: glowColor,
            },
          ]}
        >
          {icon}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    height: 120,
  },
  glowOuterRing: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 12,
  },
  starsContainer: {
    position: 'absolute',
    width: 140,
    height: 120,
  },
  sparkleDot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  middleRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  mainCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
