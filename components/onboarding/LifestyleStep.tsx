import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Monitor, Coffee, Briefcase, Footprints, Hammer, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function LifestyleStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const LIFESTYLE_LEVELS = [
    {
      id: 'seated',
      label: t('onboarding.lifestyleSeated'),
      sub: t('onboarding.lifestyleSeatedEx'),
      icon: <Monitor size={22} color="#6B7280" />,
      color: '#6B7280'
    },
    {
      id: 'standing_sometimes',
      label: t('onboarding.lifestyleStandingSometimes'),
      sub: t('onboarding.lifestyleStandingSometimesEx'),
      icon: <Coffee size={22} color="#10B981" />,
      color: '#10B981'
    },
    {
      id: 'standing_mostly',
      label: t('onboarding.lifestyleStandingMostly'),
      sub: t('onboarding.lifestyleStandingMostlyEx'),
      icon: <Briefcase size={22} color="#3B82F6" />,
      color: '#3B82F6'
    },
    {
      id: 'moving',
      label: t('onboarding.lifestyleMoving'),
      sub: t('onboarding.lifestyleMovingEx'),
      icon: <Footprints size={22} color="#F59E0B" />,
      color: '#F59E0B'
    },
    {
      id: 'physical_work',
      label: t('onboarding.lifestylePhysical'),
      sub: t('onboarding.lifestylePhysicalEx'),
      icon: <Hammer size={22} color="#EF4444" />,
      color: '#EF4444'
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary, elevation: 12 }]}>
          <Building2 size={42} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.lifestyleTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.lifestyleSub')}</Text>
      </View>

      <View style={step.optionList}>
        {LIFESTYLE_LEVELS.map((lv) => {
          const isActive = data.lifestyle === lv.id;
          return (
            <TouchableOpacity
              key={lv.id}
              style={[
                step.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isActive && {
                  borderColor: lv.color,
                  shadowColor: lv.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 6
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange({ lifestyle: lv.id as any });
              }}
              activeOpacity={0.8}
            >
              {isActive && (
                <LinearGradient
                  colors={[lv.color + '1C', lv.color + '04']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[
                step.iconContainer,
                { backgroundColor: colors.background, borderColor: isActive ? lv.color : 'rgba(255,255,255,0.05)' },
                isActive && { shadowColor: lv.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6 }
              ]}>
                {lv.icon}
              </View>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[step.optionTitle, { color: colors.textPrimary }, isActive && { color: lv.color, fontWeight: '900' }]}>{lv.label}</Text>
                <Text style={[step.optionSub, { color: colors.textSecondary }]}>{lv.sub}</Text>
              </View>
              <View style={[
                step.radioOuter,
                {
                  borderColor: isActive ? lv.color : colors.border,
                  backgroundColor: isActive ? lv.color : 'transparent',
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
