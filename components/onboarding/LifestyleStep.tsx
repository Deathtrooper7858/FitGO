import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Monitor, Coffee, PersonStanding, Footprints, Hammer, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function LifestyleStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const LIFESTYLE_LEVELS = [
    {
      id: 'seated',
      label: t('onboarding.lifestyleSeated', 'Mostly sitting'),
      sub: t('onboarding.lifestyleSeatedEx', 'Desk work, studying, mostly seated'),
      icon: <Monitor size={22} color="#94A3B8" />,
      color: '#94A3B8',
    },
    {
      id: 'standing_sometimes',
      label: t('onboarding.lifestyleStandingSometimes', 'Sometimes standing'),
      sub: t('onboarding.lifestyleStandingSometimesEx', 'Some standing and occasional walking'),
      icon: <Coffee size={22} color="#10B981" />,
      color: '#10B981',
    },
    {
      id: 'standing_mostly',
      label: t('onboarding.lifestyleStandingMostly', 'Mostly standing'),
      sub: t('onboarding.lifestyleStandingMostlyEx', 'Standing work with regular movement'),
      icon: <PersonStanding size={22} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      id: 'moving',
      label: t('onboarding.lifestyleMoving', 'Moving all day'),
      sub: t('onboarding.lifestyleMovingEx', 'Frequent walking and movement'),
      icon: <Footprints size={22} color="#F59E0B" />,
      color: '#F59E0B',
    },
    {
      id: 'physical_work',
      label: t('onboarding.lifestylePhysical', 'Physically demanding'),
      sub: t('onboarding.lifestylePhysicalEx', 'Heavy lifting or continuous physical activity'),
      icon: <Hammer size={22} color="#EF4444" />,
      color: '#EF4444',
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<PersonStanding size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.lifestyleTitle', 'How active is your daily life?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.lifestyleSub', 'Outside of exercise, how much do you move during the day?')}
        </Text>
      </View>

      <View style={step.optionList}>
        {LIFESTYLE_LEVELS.map((lv, index) => {
          const isActive = data.lifestyle === lv.id;
          return (
            <Animated.View
              key={lv.id}
              entering={FadeInUp.delay(80 + index * 65).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  step.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && {
                    borderColor: lv.color,
                    shadowColor: lv.color,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 7,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange({ lifestyle: lv.id as any });
                }}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[lv.color + '22', lv.color + '05']}
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
                      borderColor: isActive ? lv.color + '60' : colors.border + '40',
                    },
                    isActive && {
                      shadowColor: lv.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  {lv.icon}
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text
                    style={[
                      step.optionTitle,
                      { color: colors.textPrimary },
                      isActive && { color: lv.color, fontWeight: '900' },
                    ]}
                  >
                    {lv.label}
                  </Text>
                  <Text style={[step.optionSub, { color: colors.textSecondary }]}>{lv.sub}</Text>
                </View>
                <View
                  style={[
                    step.radioOuter,
                    {
                      borderColor: isActive ? lv.color : colors.border,
                      backgroundColor: isActive ? lv.color : 'transparent',
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
