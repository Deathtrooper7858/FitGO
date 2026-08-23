import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Monitor, Footprints, Flame, Zap, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function ActivityStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const ACTIVITY_LEVELS = [
    {
      id: 'sedentary',
      label: t('onboarding.activitySedentary', 'No planned exercise'),
      sub: t('onboarding.activitySedentaryEx', 'Casual walking · household chores'),
      icon: <Monitor size={22} color="#94A3B8" />,
      color: '#94A3B8',
    },
    {
      id: 'light',
      label: t('onboarding.activityLight', '1–3 sessions per week'),
      sub: t('onboarding.activityLightEx', 'Brisk walk · yoga · light cycling'),
      icon: <Footprints size={22} color="#10B981" />,
      color: '#10B981',
    },
    {
      id: 'moderate',
      label: t('onboarding.activityModerate', '3–5 sessions per week'),
      sub: t('onboarding.activityModerateEx', 'Gym · cardio · swimming · group classes'),
      icon: <Dumbbell size={22} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      id: 'active',
      label: t('onboarding.activityActive', '6–7 sessions per week'),
      sub: t('onboarding.activityActiveEx', 'Strength training · HIIT · amateur sports'),
      icon: <Flame size={22} color="#F59E0B" />,
      color: '#F59E0B',
    },
    {
      id: 'very_active',
      label: t('onboarding.activityVeryActive', 'Double sessions / elite sport'),
      sub: t('onboarding.activityVeryActiveEx', 'Competitive athlete · 2 workouts/day'),
      icon: <Zap size={22} color="#EF4444" />,
      color: '#EF4444',
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Dumbbell size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.activityTitle', 'How much do you exercise?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.activitySub', 'Count only planned physical exercise — not your daily life')}
        </Text>
      </View>

      <View style={step.optionList}>
        {ACTIVITY_LEVELS.map((a, index) => {
          const isActive = data.activityLevel === a.id;
          return (
            <Animated.View
              key={a.id}
              entering={FadeInUp.delay(80 + index * 65).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  step.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && {
                    borderColor: a.color,
                    shadowColor: a.color,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 7,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange({ activityLevel: a.id as any });
                }}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[a.color + '22', a.color + '05']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <View
                  style={[
                    step.iconContainer,
                    {
                      backgroundColor: colors.background,
                      borderColor: isActive ? a.color + '60' : colors.border + '40',
                    },
                    isActive && {
                      shadowColor: a.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  {a.icon}
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text
                    style={[
                      step.optionTitle,
                      { color: colors.textPrimary },
                      isActive && { color: a.color, fontWeight: '900' },
                    ]}
                  >
                    {a.label}
                  </Text>
                  <Text style={[step.optionSub, { color: colors.textSecondary }]}>{a.sub}</Text>
                </View>
                <View
                  style={[
                    step.radioOuter,
                    {
                      borderColor: isActive ? a.color : colors.border,
                      backgroundColor: isActive ? a.color : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                >
                  {isActive && <Check size={14} color="#FFF" strokeWidth={4} />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
