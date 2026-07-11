import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Monitor, Footprints, Flame, Zap, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function ActivityStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const ACTIVITY_LEVELS = [
    {
      id: 'sedentary',
      label: t('onboarding.activitySedentary'),
      sub: t('onboarding.activitySedentaryEx'),
      icon: <Monitor size={22} color="#6B7280" />,
      color: '#6B7280'
    },
    {
      id: 'light',
      label: t('onboarding.activityLight'),
      sub: t('onboarding.activityLightEx'),
      icon: <Footprints size={22} color="#10B981" />,
      color: '#10B981'
    },
    {
      id: 'moderate',
      label: t('onboarding.activityModerate'),
      sub: t('onboarding.activityModerateEx'),
      icon: <Dumbbell size={22} color="#3B82F6" />,
      color: '#3B82F6'
    },
    {
      id: 'active',
      label: t('onboarding.activityActive'),
      sub: t('onboarding.activityActiveEx'),
      icon: <Flame size={22} color="#F59E0B" />,
      color: '#F59E0B'
    },
    {
      id: 'very_active',
      label: t('onboarding.activityVeryActive'),
      sub: t('onboarding.activityVeryActiveEx'),
      icon: <Zap size={22} color="#EF4444" />,
      color: '#EF4444'
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary, elevation: 12 }]}>
          <Dumbbell size={42} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.activityTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.activitySub')}</Text>
      </View>

      <View style={step.optionList}>
        {ACTIVITY_LEVELS.map((a) => {
          const isActive = data.activityLevel === a.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[
                step.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isActive && {
                  borderColor: a.color,
                  shadowColor: a.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 6
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange({ activityLevel: a.id as any });
              }}
              activeOpacity={0.8}
            >
              {isActive && (
                <LinearGradient
                  colors={[a.color + '1C', a.color + '04']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[
                step.iconContainer,
                { backgroundColor: colors.background, borderColor: isActive ? a.color + '50' : colors.border + '40' },
                isActive && { shadowColor: a.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6 }
              ]}>
                {a.icon}
              </View>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[step.optionTitle, { color: colors.textPrimary }, isActive && { color: a.color, fontWeight: '900' }]}>{a.label}</Text>
                <Text style={[step.optionSub, { color: colors.textSecondary }]}>{a.sub}</Text>
              </View>
              <View style={[
                step.radioOuter,
                {
                  borderColor: isActive ? a.color : colors.border,
                  backgroundColor: isActive ? a.color : 'transparent',
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
