import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Flame, Dumbbell, Heart, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function GoalStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const GOALS = [
    {
      id: 'lose',
      icon: <Flame size={26} color="#FF4D4D" />,
      title: t('onboarding.loseTitle'),
      sub: t('onboarding.loseSub'),
      accent: '#FF4D4D'
    },
    {
      id: 'gain',
      icon: <Dumbbell size={26} color="#4D94FF" />,
      title: t('onboarding.gainTitle'),
      sub: t('onboarding.gainSub'),
      accent: '#4D94FF'
    },
    {
      id: 'maintain',
      icon: <Heart size={26} color="#4DFF88" />,
      title: t('onboarding.stayTitle'),
      sub: t('onboarding.staySub'),
      accent: '#4DFF88'
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary, elevation: 12 }]}>
          <Target size={42} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.goalTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.goalSub')}</Text>
      </View>

      <View style={step.optionList}>
        {GOALS.map((g) => {
          const isActive = data.goal === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[
                step.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isActive && {
                  borderColor: g.accent,
                  shadowColor: g.accent,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange({ goal: g.id as any });
              }}
              activeOpacity={0.8}
            >
              {isActive && (
                <LinearGradient
                  colors={[g.accent + '1C', g.accent + '05']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[
                step.iconContainer,
                { backgroundColor: colors.background, borderColor: isActive ? g.accent + '50' : colors.border + '40' },
                isActive && { shadowColor: g.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6 }
              ]}>
                {g.icon}
              </View>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[step.optionTitle, { color: colors.textPrimary }, isActive && { color: g.accent, fontWeight: '900' }]}>{g.title}</Text>
                <Text style={[step.optionSub, { color: colors.textSecondary }]}>{g.sub}</Text>
              </View>
              <View style={[
                step.radioOuter,
                {
                  borderColor: isActive ? g.accent : colors.border,
                  backgroundColor: isActive ? g.accent : 'transparent',
                  borderWidth: 2
                }
              ]}>
                {isActive && <Check size={14} color="#FFF" strokeWidth={4} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
