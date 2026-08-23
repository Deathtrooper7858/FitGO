import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Flame, Dumbbell, Heart, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function GoalStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const GOALS = [
    {
      id: 'lose',
      icon: <Flame size={26} color="#FF5252" />,
      title: t('onboarding.loseTitle', 'Lose Weight'),
      sub: t('onboarding.loseGoalSub', 'Personalized nutrition & activity goals'),
      accent: '#FF5252',
    },
    {
      id: 'gain',
      icon: <Dumbbell size={26} color="#3B82F6" />,
      title: t('onboarding.gainTitle', 'Build Muscle'),
      sub: t('onboarding.gainGoalSub', 'Strength-focused training & nutrition'),
      accent: '#3B82F6',
    },
    {
      id: 'maintain',
      icon: <Heart size={26} color="#10B981" />,
      title: t('onboarding.stayTitle', 'Stay Healthy'),
      sub: t('onboarding.stayGoalSub', 'Balanced habits & daily wellness'),
      accent: '#10B981',
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Target size={44} color="#A855F7" />}
          color="#A855F7"
          glowColor="#8B5CF6"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.goalTitle', "What's your goal?")}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.goalSub', 'This helps us build your personalized plan.')}
        </Text>
      </View>

      <View style={step.optionList}>
        {GOALS.map((g, index) => {
          const isActive = data.goal === g.id;
          return (
            <Animated.View
              key={g.id}
              entering={FadeInUp.delay(100 + index * 90).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  step.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && {
                    borderColor: g.accent,
                    shadowColor: g.accent,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 14,
                    elevation: 8,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onChange({ goal: g.id as any });
                }}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[g.accent + '22', g.accent + '06']}
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
                      borderColor: isActive ? g.accent + '60' : colors.border + '50',
                    },
                    isActive && {
                      shadowColor: g.accent,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.45,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  {g.icon}
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text
                    style={[
                      step.optionTitle,
                      { color: colors.textPrimary },
                      isActive && { color: g.accent, fontWeight: '900' },
                    ]}
                  >
                    {g.title}
                  </Text>
                  <Text style={[step.optionSub, { color: colors.textSecondary }]}>{g.sub}</Text>
                </View>
                <View
                  style={[
                    step.radioOuter,
                    {
                      borderColor: isActive ? g.accent : colors.border,
                      backgroundColor: isActive ? g.accent : 'transparent',
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
