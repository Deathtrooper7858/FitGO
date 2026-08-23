import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing } from '../../constants';
import { useAdStore } from '../../store/adStore';
import { useTheme } from '../../hooks/useTheme';
import { useIsPro } from '../../hooks/useIsPro';
import { AnimatedCard } from '../AnimatedCard';

export function WidgetAdTimer({ featureId }: { featureId: string }) {
  const { premiumAdRemainingSeconds, hasPremiumAdAccess } = useAdStore();
  const [timeLeft, setTimeLeft] = useState(premiumAdRemainingSeconds(featureId));

  const isPro = useIsPro();
  const colors = useTheme();

  useEffect(() => {
    if (isPro) return;
    const timer = setInterval(() => {
      setTimeLeft(premiumAdRemainingSeconds(featureId));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPro, featureId]);

  if (isPro || !hasPremiumAdAccess(featureId) || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: colors.primary + 'C0', // 75% opacity
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
      padding: 12,
      borderRadius: Radius.xl,
    }]}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 28, fontVariant: ['tabular-nums'] }}>{timeStr}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, textAlign: 'center' }}>ACCESO PREMIUM</Text>
    </View>
  );
}

interface WidgetProps {
  id?: string;
  title: string;
  icon: any;
  value?: string;
  subValue?: string;
  onPress?: () => void;
  index: number;
  customContent?: React.ReactNode;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  isEditing?: boolean;
  adTimerFeatureId?: string;
  onLongPress?: () => void;
}

export function WidgetCard({ title, icon, value, subValue, onPress, customContent, onLongPress, isEditing, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight, index, adTimerFeatureId }: WidgetProps) {
  const colors = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const widgetWidth = (screenWidth - Spacing.base * 2 - Spacing.md) / 2;
  
  return (
    <AnimatedCard index={index} direction="up" style={{ width: widgetWidth }}>
      <TouchableOpacity 
        style={[
          w.card, 
          { width: widgetWidth, backgroundColor: colors.surface, borderColor: isEditing ? colors.primary : colors.surfaceAlt },
          isEditing && { borderWidth: 2, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
          !isEditing && { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 }
        ]} 
        onPress={isEditing ? undefined : onPress} 
        activeOpacity={0.8} 
        delayLongPress={500} 
        onLongPress={onLongPress}
      >
        <LinearGradient
          colors={[colors.primary + '14', 'transparent']} // 0.08 opacity hex is roughly 14
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
        />
        <View style={w.header}>
          <View style={[w.iconWrap, { backgroundColor: colors.primary + '26' }]}>
            <Text style={w.icon}>{icon}</Text>
          </View>
          <Text style={[w.title, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        </View>
        {customContent ? customContent : (
          <View style={w.content}>
            <Text style={[w.value, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            {subValue && <Text style={[w.subValue, { color: colors.textSecondary }]} numberOfLines={1}>{subValue}</Text>}
          </View>
        )}
        
        {isEditing && (
          <View style={[StyleSheet.absoluteFill, w.editOverlay]}>
            <TouchableOpacity 
              style={[w.moveBtn, { backgroundColor: colors.primary }, !canMoveLeft && { opacity: 0.3 }]} 
              onPress={onMoveLeft} 
              disabled={!canMoveLeft}
            >
              <Text style={w.moveIcon}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[w.moveBtn, { backgroundColor: colors.primary }, !canMoveRight && { opacity: 0.3 }]} 
              onPress={onMoveRight} 
              disabled={!canMoveRight}
            >
              <Text style={w.moveIcon}>→</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {adTimerFeatureId && <WidgetAdTimer featureId={adTimerFeatureId} />}

      </TouchableOpacity>
    </AnimatedCard>
  );
}

export const w = StyleSheet.create({
  card: { height: 160, borderRadius: Radius.xl, padding: Spacing.lg, justifyContent: 'space-between', borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: -0.3 },
  content: { flex: 1, justifyContent: 'flex-end', paddingBottom: 4 },
  value: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subValue: { fontSize: 13, marginTop: 4, fontWeight: '500', opacity: 0.8 },
  editOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  moveBtn: { backgroundColor: '#7C5CFC', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  moveIcon: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  lockOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -10,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
  },
  lockIcon: { fontSize: 11 },
  premiumTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.4)',
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
});
