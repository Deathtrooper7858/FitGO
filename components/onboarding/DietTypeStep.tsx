import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Sparkles, Dumbbell, Droplets, Zap, Leaf, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function DietTypeStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const DIET_TYPES = [
    {
      id: 'recommended',
      title: t('onboarding.dietTypeRecommendedTitle'),
      sub: t('onboarding.dietTypeRecommendedSub'),
      icon: <Sparkles size={24} />,
      color: '#8B5CF6'
    },
    {
      id: 'high_protein',
      title: t('onboarding.dietTypeHighProteinTitle'),
      sub: t('onboarding.dietTypeHighProteinSub'),
      icon: <Dumbbell size={24} />,
      color: '#F59E0B'
    },
    {
      id: 'low_carb',
      title: t('onboarding.dietTypeLowCarbTitle'),
      sub: t('onboarding.dietTypeLowCarbSub'),
      icon: <Droplets size={24} />,
      color: '#3B82F6'
    },
    {
      id: 'keto',
      title: t('onboarding.dietTypeKetoTitle'),
      sub: t('onboarding.dietTypeKetoSub'),
      icon: <Zap size={24} />,
      color: '#10B981'
    },
    {
      id: 'low_fat',
      title: t('onboarding.dietTypeLowFatTitle'),
      sub: t('onboarding.dietTypeLowFatSub'),
      icon: <Leaf size={24} />,
      color: '#06B6D4'
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary }]}>
          <Utensils size={36} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.dietTypeTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.dietTypeSub')}</Text>
      </View>

      <View style={step.optionList}>
        {DIET_TYPES.map((dt) => {
          const isActive = data.dietType === dt.id;
          return (
            <TouchableOpacity
              key={dt.id}
              style={[
                step.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isActive && {
                  borderColor: dt.color,
                  shadowColor: dt.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.28,
                  shadowRadius: 10,
                  elevation: 6
                }
              ]}
              onPress={() => onChange({ dietType: dt.id as any })}
              activeOpacity={0.8}
            >
              {isActive && (
                <LinearGradient
                  colors={[dt.color + '1C', dt.color + '04']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[
                step.iconContainer,
                { backgroundColor: colors.background, borderColor: isActive ? dt.color : 'rgba(255,255,255,0.05)' },
                isActive && { shadowColor: dt.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6 }
              ]}>
                {React.cloneElement(dt.icon as any, { color: isActive ? dt.color : colors.textSecondary })}
              </View>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[step.optionTitle, { color: colors.textPrimary }, isActive && { color: dt.color, fontWeight: '900' }]}>{dt.title}</Text>
                <Text style={[step.optionSub, { color: colors.textSecondary }]}>{dt.sub}</Text>
              </View>
              <View style={[
                step.radioOuter,
                {
                  borderColor: isActive ? dt.color : colors.border,
                  backgroundColor: isActive ? dt.color : 'transparent',
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
