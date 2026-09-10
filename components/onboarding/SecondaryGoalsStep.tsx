import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export const SECONDARY_GOAL_OPTIONS = [
  { id: 'clothes', emoji: '👕', key: 'onboarding.secondaryGoalClothes', fallback: 'Que me quede mejor la ropa', color: '#F59E0B' },
  { id: 'confidence', emoji: '😎', key: 'onboarding.secondaryGoalConfidence', fallback: 'Sentirme con más seguridad', color: '#EC4899' },
  { id: 'health', emoji: '❤️', key: 'onboarding.secondaryGoalHealth', fallback: 'Mejorar mi salud', color: '#EF4444' },
  { id: 'fitness', emoji: '🦾', key: 'onboarding.secondaryGoalFitness', fallback: 'Mejorar mi condición física', color: '#3B82F6' },
  { id: 'energy', emoji: '⚡', key: 'onboarding.secondaryGoalEnergy', fallback: 'Tener más energía', color: '#EAB308' },
  { id: 'sleep', emoji: '💤', key: 'onboarding.secondaryGoalSleep', fallback: 'Dormir mejor', color: '#8B5CF6' },
] as const;

export function SecondaryGoalsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const selected = data.secondaryGoals ?? [];

  const handleToggle = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const isAlready = selected.includes(id);
    const updated = isAlready ? selected.filter((x: string) => x !== id) : [...selected, id];
    onChange({ secondaryGoals: updated });
  };

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Sparkles size={44} color="#F59E0B" />}
          color="#F59E0B"
          glowColor="#D97706"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.secondaryGoalsTitle', '¿Qué quieres lograr además de tu meta principal?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.secondaryGoalsSub', 'Selecciona todas las que apliquen para personalizar tu plan.')}
        </Text>
      </View>

      <View style={styles.list}>
        {SECONDARY_GOAL_OPTIONS.map((item, index) => {
          const isActive = selected.includes(item.id);
          return (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(60 + index * 60).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && {
                    borderColor: item.color,
                    backgroundColor: colors.surfaceAlt,
                    shadowColor: item.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 5,
                  },
                ]}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[item.color + '18', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <View style={styles.contentRow}>
                  <View style={[styles.emojiWrap, { backgroundColor: colors.background }]}>
                    <Text style={styles.emojiText}>{item.emoji}</Text>
                  </View>

                  <Text
                    style={[
                      styles.cardText,
                      { color: colors.textPrimary },
                      isActive && { fontWeight: '700' },
                    ]}
                  >
                    {t(item.key, item.fallback)}
                  </Text>

                  <View
                    style={[
                      styles.checkCircle,
                      {
                        borderColor: isActive ? item.color : colors.border + '90',
                        backgroundColor: isActive ? item.color : 'transparent',
                      },
                    ]}
                  >
                    {isActive && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
