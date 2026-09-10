import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  }, [isPro, featureId, premiumAdRemainingSeconds]);

  if (isPro || !hasPremiumAdAccess(featureId) || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: colors.primary + 'D9',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
      padding: 12,
      borderRadius: Radius.xl,
    }]}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 26, fontVariant: ['tabular-nums'] }}>{timeStr}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 0.8, textAlign: 'center' }}>ACCESO PRO TEMPORAL</Text>
    </View>
  );
}

export interface WidgetProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  value?: string;
  subValue?: string;
  badge?: string;
  badgeColor?: string;
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

export const WidgetCard = React.memo(function WidgetCard({
  title,
  icon,
  iconColor,
  value,
  subValue,
  badge,
  badgeColor,
  onPress,
  customContent,
  onLongPress,
  isEditing,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  index,
  adTimerFeatureId
}: WidgetProps) {
  const colors = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const widgetWidth = Math.floor((screenWidth - Spacing.base * 2 - Spacing.md) / 2);
  const activeColor = iconColor || colors.primary;

  const handlePress = () => {
    if (isEditing) return;
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <AnimatedCard index={index} direction="up" style={{ width: widgetWidth }}>
      <TouchableOpacity
        style={[
          w.card,
          {
            width: widgetWidth,
            backgroundColor: colors.surface,
            borderColor: isEditing ? colors.primary : colors.border + '40',
          },
          isEditing && {
            borderWidth: 2,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6
          },
          !isEditing && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.78}
        delayLongPress={450}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress?.();
        }}
      >
        <LinearGradient
          colors={[activeColor + '12', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
          pointerEvents="none"
        />

        {/* Header row */}
        <View style={w.header}>
          <View style={[w.iconWrap, { backgroundColor: activeColor + '1F', borderColor: activeColor + '30' }]}>
            {typeof icon === 'string' ? (
              <Text style={w.iconEmoji}>{icon}</Text>
            ) : (
              icon
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[w.title, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
            {badge && (
              <View style={[w.headerBadge, { backgroundColor: (badgeColor || activeColor) + '1A', borderColor: (badgeColor || activeColor) + '40' }]}>
                <Text style={[w.headerBadgeText, { color: badgeColor || activeColor }]}>{badge}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        {customContent ? customContent : (
          <View style={w.content}>
            <Text style={[w.value, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
            {subValue && (
              <Text style={[w.subValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {subValue}
              </Text>
            )}
          </View>
        )}

        {/* Reordering mode overlay */}
        {isEditing && (
          <View style={[StyleSheet.absoluteFill, w.editOverlay]}>
            <TouchableOpacity
              style={[w.moveBtn, { backgroundColor: colors.primary }, !canMoveLeft && { opacity: 0.25 }]}
              onPress={() => {
                Haptics.selectionAsync();
                onMoveLeft?.();
              }}
              disabled={!canMoveLeft}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[w.moveBtn, { backgroundColor: colors.primary }, !canMoveRight && { opacity: 0.25 }]}
              onPress={() => {
                Haptics.selectionAsync();
                onMoveRight?.();
              }}
              disabled={!canMoveRight}
              activeOpacity={0.7}
            >
              <ArrowRight size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {adTimerFeatureId && <WidgetAdTimer featureId={adTimerFeatureId} />}
      </TouchableOpacity>
    </AnimatedCard>
  );
});

export const w = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subValue: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.8,
  },
  editOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: Radius.xl,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  moveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
  },
  lockIcon: {
    fontSize: 10,
  },
  premiumTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.4,
  },
});
