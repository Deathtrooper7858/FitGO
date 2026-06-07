import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useAdStore } from '../store/adStore';
import { useAuthStore } from '../store/authStore';

interface AdTimerOverlayProps {
  featureId: string;
}

export function AdTimerOverlay({ featureId }: AdTimerOverlayProps) {
  const { profile } = useAuthStore();
  const { hasPremiumAdAccess, premiumAdRemainingSeconds } = useAdStore();
  const [timeLeft, setTimeLeft] = useState(premiumAdRemainingSeconds(featureId));

  const isPro = !!profile?.isPro;

  useEffect(() => {
    if (isPro) return;
    const timer = setInterval(() => {
      setTimeLeft(premiumAdRemainingSeconds(featureId));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPro, featureId]);

  if (isPro || !hasPremiumAdAccess(featureId)) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Clock size={14} color="#FFF" />
      <Text style={styles.text}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  text: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
