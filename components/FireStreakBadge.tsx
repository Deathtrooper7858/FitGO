import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

export function FireStreakBadge({ streakDays, style, size = 'default' }: { streakDays: number; style?: any; size?: 'small' | 'default' | 'large' }) {
  const colors = useTheme();
  const isOnFire = streakDays >= 3;
  
  const pulseOpacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isOnFire) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 0;
      scale.value = 1;
    }
  }, [isOnFire]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: scale.value }]
  }));

  const fontSize = size === 'large' ? 24 : size === 'small' ? 14 : 16;
  const paddingVertical = size === 'large' ? 8 : 4;
  const paddingHorizontal = size === 'large' ? 16 : 12;

  return (
    <View style={[{ position: 'relative', alignItems: 'center', justifyContent: 'center', paddingHorizontal, paddingVertical }, style]}>
      {isOnFire && (
        <Animated.View style={[
          {
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: '#FF6B00',
            borderRadius: 16,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 10,
          },
          animatedStyle
        ]} />
      )}
      <Text style={{ 
        color: isOnFire ? '#FFF' : colors.textPrimary, 
        fontWeight: isOnFire ? '900' : '600',
        fontSize,
        textShadowColor: isOnFire ? 'rgba(255,255,255,0.8)' : 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: isOnFire ? 4 : 0
      }}>
        🔥 {streakDays}
      </Text>
    </View>
  );
}
