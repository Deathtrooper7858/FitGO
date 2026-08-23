import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Sparkles, Dumbbell, Droplets, Zap, Leaf, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function DietTypeStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const DIET_TYPES = [
    {
      id: 'recommended',
      title: t('onboarding.dietTypeRecommendedTitle', 'Recommended (Balanced)'),
      sub: t('onboarding.dietTypeRecommendedSub', 'Optimal balance of proteins, complex carbs, and healthy fats'),
      macros: 'P: 30% • C: 40% • F: 30%',
      icon: <Sparkles size={22} />,
      color: '#8B5CF6',
    },
    {
      id: 'high_protein',
      title: t('onboarding.dietTypeHighProteinTitle', 'High Protein'),
      sub: t('onboarding.dietTypeHighProteinSub', 'Maximum muscle retention & satiety with elevated protein intake'),
      macros: 'P: 40% • C: 35% • F: 25%',
      icon: <Dumbbell size={22} />,
      color: '#F59E0B',
    },
    {
      id: 'low_carb',
      title: t('onboarding.dietTypeLowCarbTitle', 'Low Carb'),
      sub: t('onboarding.dietTypeLowCarbSub', 'Moderate protein with reduced carbohydrates to control insulin spikes'),
      macros: 'P: 30% • C: 20% • F: 50%',
      icon: <Droplets size={22} />,
      color: '#3B82F6',
    },
    {
      id: 'keto',
      title: t('onboarding.dietTypeKetoTitle', 'Ketogenic (Keto)'),
      sub: t('onboarding.dietTypeKetoSub', 'Very low carb, high healthy fats to promote nutritional ketosis'),
      macros: 'P: 25% • C: 5% • F: 70%',
      icon: <Zap size={22} />,
      color: '#10B981',
    },
    {
      id: 'low_fat',
      title: t('onboarding.dietTypeLowFatTitle', 'Low Fat'),
      sub: t('onboarding.dietTypeLowFatSub', 'Plant-forward carbs with minimal dietary fats and lean proteins'),
      macros: 'P: 25% • C: 60% • F: 15%',
      icon: <Leaf size={22} />,
      color: '#06B6D4',
    },
  ] as const;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Utensils size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.dietTypeTitle', 'Which diet type do you prefer?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.dietTypeSub', 'Select the nutritional approach that best matches your lifestyle')}
        </Text>
      </View>

      <View style={step.optionList}>
        {DIET_TYPES.map((dt, index) => {
          const isActive = (data.dietType || 'recommended') === dt.id;
          return (
            <Animated.View
              key={dt.id}
              entering={FadeInUp.delay(80 + index * 65).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  step.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 16 },
                  isActive && {
                    borderColor: dt.color,
                    shadowColor: dt.color,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 7,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange({ dietType: dt.id as any });
                }}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[dt.color + '22', dt.color + '05']}
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
                      borderColor: isActive ? dt.color + '60' : colors.border + '40',
                    },
                    isActive && {
                      shadowColor: dt.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  {React.cloneElement(dt.icon as any, {
                    color: isActive ? dt.color : colors.textSecondary,
                  })}
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Text
                    style={[
                      step.optionTitle,
                      { color: colors.textPrimary },
                      isActive && { color: dt.color, fontWeight: '900' },
                    ]}
                  >
                    {dt.title}
                  </Text>
                  <Text style={[step.optionSub, { color: colors.textSecondary, marginBottom: 8 }]}>
                    {dt.sub}
                  </Text>
                  <View style={[styles.macroPill, { backgroundColor: colors.background, borderColor: isActive ? dt.color + '40' : colors.border + '50' }]}>
                    <Text style={[styles.macroText, { color: isActive ? dt.color : colors.textMuted }]}>
                      {dt.macros}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    step.radioOuter,
                    {
                      borderColor: isActive ? dt.color : colors.border,
                      backgroundColor: isActive ? dt.color : 'transparent',
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

const styles = StyleSheet.create({
  macroPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  macroText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
