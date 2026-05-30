import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { GlassCard } from './GlassCard';
import { useToastStore } from '../store/toastStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Achievement } from '../hooks/useAchievements';

const { width } = Dimensions.get('window');

export function AchievementToast() {
  const { toastQueue, showNext } = useToastStore();
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      setCurrentToast(toastQueue[0]);
      
      // Animate in
      Animated.spring(translateY, {
        toValue: 60, // distance from top
        useNativeDriver: true,
        bounciness: 12
      }).start();

      // Wait 3.5s then animate out
      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          setCurrentToast(null);
          showNext();
        });
      }, 3500);
    }
  }, [toastQueue, currentToast]);

  if (!currentToast) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <GlassCard accentColor="#FFD700" style={styles.card} noPadding>
        <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'transparent']} style={styles.inner}>
          <Text style={styles.icon}>{currentToast.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>🏆 ¡Logro Desbloqueado!</Text>
            <Text style={styles.name}>{currentToast.title}</Text>
          </View>
        </LinearGradient>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginRight: 16,
    textShadowColor: '#FFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
