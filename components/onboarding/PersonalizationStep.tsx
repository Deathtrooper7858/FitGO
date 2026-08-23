import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Scale,
  Target,
  Sparkles,
  AlertCircle,
  Minus,
  Plus,
  Gauge,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function PersonalizationStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  useEffect(() => {
    const defaultW = data.weightUnit === 'lbs' ? 154 : 70;
    const cur = data.weight ?? defaultW;
    const tar = data.targetWeight ?? cur;

    if (data.goal === 'maintain' && tar !== cur) {
      onChange({ targetWeight: cur });
    } else if (data.goal === 'lose' && tar >= cur) {
      onChange({ targetWeight: data.weightUnit === 'lbs' ? cur - 4 : cur - 2 });
    } else if (data.goal === 'gain' && tar <= cur) {
      onChange({ targetWeight: data.weightUnit === 'lbs' ? cur + 4 : cur + 2 });
    }
  }, [data.goal, data.weightUnit]);

  const heightM = (data.height ?? 170) / 100;
  const defaultW = data.weightUnit === 'lbs' ? 154 : 70;
  const currentVal = data.targetWeight ?? data.weight ?? defaultW;
  const currentValKg = data.weightUnit === 'lbs' ? currentVal / 2.20462 : currentVal;
  const targetBMI = currentValKg / (heightM * heightM);
  const idealMin = Math.round(18.5 * heightM * heightM);
  const idealMax = Math.round(24.9 * heightM * heightM);
  const idealMinDisplay = data.weightUnit === 'lbs' ? Math.round(idealMin * 2.20462) : idealMin;
  const idealMaxDisplay = data.weightUnit === 'lbs' ? Math.round(idealMax * 2.20462) : idealMax;
  const unitLabel = data.weightUnit === 'lbs' ? 'lbs' : 'kg';

  let statusColor = '#10B981';
  let statusTitle = t('onboarding.greatGoal', 'Great goal!');
  let statusText = '';

  if (data.goal === 'lose') {
    if (targetBMI < 18.5) {
      statusColor = '#EF4444';
      statusTitle = t('onboarding.cautionGoal', 'Caution');
      statusText = t('onboarding.warningUnderweight', {
        min: idealMinDisplay,
        max: idealMaxDisplay,
        unit: unitLabel,
        defaultValue: `This target is below your recommended weight. Your healthy range is ${idealMinDisplay}–${idealMaxDisplay} ${unitLabel}.`,
      });
    } else if (targetBMI > 24.9) {
      statusColor = '#F59E0B';
      statusTitle = t('onboarding.goodStep', 'Good first step!');
      statusText = t('onboarding.recOverweightStep', {
        min: idealMinDisplay,
        max: idealMaxDisplay,
        unit: unitLabel,
        defaultValue: `Good initial goal. Your long-term healthy range is ${idealMinDisplay}–${idealMaxDisplay} ${unitLabel}.`,
      });
    } else {
      statusTitle = t('onboarding.greatGoal', 'Great goal!');
      statusText = t(
        'onboarding.loseHealthy',
        'This target is within a healthy weight range for you.'
      );
    }
  } else if (data.goal === 'gain') {
    if (targetBMI > 27.5) {
      statusColor = '#F59E0B';
      statusTitle = t('onboarding.cautionGoal', 'Caution');
      statusText = t('onboarding.warningOverweightGain', {
        min: idealMinDisplay,
        max: idealMaxDisplay,
        unit: unitLabel,
        defaultValue: `Be mindful of gaining excess fat. Your baseline healthy range is ${idealMinDisplay}–${idealMaxDisplay} ${unitLabel}.`,
      });
    } else if (targetBMI < 18.5) {
      statusColor = '#EF4444';
      statusTitle = t('onboarding.cautionGoal', 'Caution');
      statusText = t('onboarding.warningUnderweightGain', {
        min: idealMinDisplay,
        max: idealMaxDisplay,
        unit: unitLabel,
        defaultValue: `This target is still low. Your ideal range is ${idealMinDisplay}–${idealMaxDisplay} ${unitLabel}.`,
      });
    } else {
      statusTitle = t('onboarding.greatGoal', 'Great goal!');
      statusText = t(
        'onboarding.gainHealthy',
        'Perfect for building lean muscle mass while staying healthy.'
      );
    }
  } else {
    if (targetBMI < 18.5) {
      statusColor = '#F59E0B';
      statusTitle = t('onboarding.cautionGoal', 'Caution');
      statusText = t(
        'onboarding.warningUnderweightMaintain',
        'Your current weight is low. Consider changing your goal to gaining muscle.'
      );
    } else if (targetBMI > 24.9) {
      statusColor = '#F59E0B';
      statusTitle = t('onboarding.cautionGoal', 'Caution');
      statusText = t(
        'onboarding.warningOverweightMaintain',
        'Your current weight is on the higher side. Consider a weight loss goal.'
      );
    } else {
      statusTitle = t('onboarding.greatGoal', 'Great goal!');
      statusText = t(
        'onboarding.maintainHealthy',
        'Excellent! You are in an ideal weight range to maintain and tone.'
      );
    }
  }

  const minAllowedWeightKg = Math.max(30, Math.floor(15.0 * heightM * heightM));
  const maxAllowedWeightKg = Math.min(250, Math.ceil(40.0 * heightM * heightM));
  const minAllowedWeight = data.weightUnit === 'lbs' ? Math.round(minAllowedWeightKg * 2.20462) : minAllowedWeightKg;
  const maxAllowedWeight = data.weightUnit === 'lbs' ? Math.round(maxAllowedWeightKg * 2.20462) : maxAllowedWeightKg;

  const currentVelocity = data.velocity || 'moderate';

  const VELOCITY_DETAILS = useMemo(() => {
    const isLbs = data.weightUnit === 'lbs';
    const isGain = data.goal === 'gain';

    return {
      slow: {
        label: t('onboarding.velocitySlow', 'Slow'),
        title: t('onboarding.paceSlowTitle', 'Gentle pace'),
        sub: t('onboarding.paceSlowSub', 'Gradual changes that are very easy to sustain long-term.'),
        rate: isLbs
          ? isGain ? '~0.5 lb / week' : '~0.5 lb / week'
          : isGain ? '~0.25 kg / week' : '~0.25 kg / week',
        color: '#10B981',
      },
      moderate: {
        label: t('onboarding.velocityModerate', 'Normal'),
        title: t('onboarding.paceNormalTitle', 'Normal pace'),
        sub: t('onboarding.paceNormalSub', "A steady pace that's easier to maintain with great results."),
        rate: isLbs
          ? isGain ? '~1.0 lb / week' : '~1.0 lb / week'
          : isGain ? '~0.5 kg / week' : '~0.5 kg / week',
        color: '#8B5CF6',
      },
      fast: {
        label: t('onboarding.velocityFast', 'Fast'),
        title: t('onboarding.paceFastTitle', 'Aggressive pace'),
        sub: t('onboarding.paceFastSub', 'Fastest progress requiring strict dietary discipline.'),
        rate: isLbs
          ? isGain ? '~1.5 lb / week' : '~2.0 lb / week'
          : isGain ? '~0.75 kg / week' : '~1.0 kg / week',
        color: '#EF4444',
      },
    };
  }, [data.weightUnit, data.goal, t]);

  const activeVelocityInfo = VELOCITY_DETAILS[currentVelocity];

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Scale size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.weightGoalTitle', "What's your weight goal?")}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.weightGoalSub', "Set your target weight and choose how quickly you'd like to reach it.")}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {/* Current Weight Card */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(18)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#8B5CF618' }]}>
              <Scale size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>{t('onboarding.currentWeightHeader', 'CURRENT WEIGHT')}</Text>
              <Text style={[styles.weightBigText, { color: colors.textPrimary }]}>
                {data.weight}{' '}
                <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '700' }}>{unitLabel}</Text>
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
        </Animated.View>

        {/* Target Weight Card with Stepper */}
        <Animated.View entering={FadeInUp.delay(140).springify().damping(18)} style={{ gap: 10 }}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconBox, { backgroundColor: '#EC489918' }]}>
                  <Target size={22} color="#EC4899" />
                </View>
                <Text style={styles.sectionLabel}>{t('onboarding.targetWeightHeader', 'TARGET WEIGHT')}</Text>
              </View>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (data.goal === 'lose' && currentVal - 1 >= minAllowedWeight) {
                    onChange({ targetWeight: currentVal - 1 });
                  } else if (data.goal === 'gain' && currentVal > (data.weight ?? 0) + 1 && currentVal - 1 >= minAllowedWeight) {
                    onChange({ targetWeight: currentVal - 1 });
                  } else if (data.goal === 'maintain' && currentVal - 1 >= minAllowedWeight) {
                    onChange({ targetWeight: currentVal - 1 });
                  }
                }}
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                activeOpacity={0.7}
              >
                <Minus size={20} color={colors.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.stepperValueBox}>
                <TextInput
                  style={[styles.stepperInput, { color: colors.textPrimary }]}
                  keyboardType="numeric"
                  value={data.targetWeight !== undefined ? data.targetWeight.toString() : ''}
                  placeholder={currentVal.toString()}
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(text) => {
                    if (text === '') {
                      onChange({ targetWeight: undefined });
                    } else {
                      const parsed = parseFloat(text.replace(/[^0-9]/g, ''));
                      if (!isNaN(parsed)) {
                        onChange({ targetWeight: parsed });
                      }
                    }
                  }}
                />
                <Text style={[styles.stepperUnit, { color: colors.textSecondary }]}>{unitLabel}</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (data.goal === 'gain' && currentVal + 1 <= maxAllowedWeight) {
                    onChange({ targetWeight: currentVal + 1 });
                  } else if (data.goal === 'lose' && currentVal < (data.weight ?? 0) - 1 && currentVal + 1 <= maxAllowedWeight) {
                    onChange({ targetWeight: currentVal + 1 });
                  } else if (data.goal === 'maintain' && currentVal + 1 <= maxAllowedWeight) {
                    onChange({ targetWeight: currentVal + 1 });
                  }
                }}
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                activeOpacity={0.7}
              >
                <Plus size={20} color={colors.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Status Assessment Card */}
            <View
              style={[
                styles.feedbackBox,
                { backgroundColor: statusColor + '12', borderColor: statusColor + '35' },
              ]}
            >
              <View style={[styles.feedbackIconBox, { backgroundColor: statusColor + '25' }]}>
                {statusColor === '#10B981' ? (
                  <Sparkles size={18} color={statusColor} />
                ) : (
                  <AlertCircle size={18} color={statusColor} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: statusColor }]}>{statusTitle}</Text>
                <Text style={[styles.feedbackSub, { color: colors.textPrimary + 'DD' }]}>{statusText}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Velocity Selection Section */}
        <Animated.View entering={FadeInUp.delay(200).springify().damping(18)} style={{ gap: 10 }}>
          <Text style={styles.sectionHeader}>
            {t('onboarding.howFastProgress', 'HOW FAST DO YOU WANT TO PROGRESS?')}
          </Text>

          {/* 3 Pace Tabs */}
          <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(['slow', 'moderate', 'fast'] as const).map((v) => {
              const info = VELOCITY_DETAILS[v];
              const isSelected = currentVelocity === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.paceTab,
                    isSelected && {
                      backgroundColor: colors.background,
                      borderColor: info.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange({ velocity: v as any });
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.paceTabText,
                      { color: isSelected ? info.color : colors.textSecondary },
                      isSelected && { fontWeight: '900' },
                    ]}
                  >
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Velocity Details Card */}
          <View style={[styles.velocityInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: activeVelocityInfo.color + '18' }]}>
              <Gauge size={22} color={activeVelocityInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.velocityTitle, { color: colors.textPrimary }]}>
                {activeVelocityInfo.title}
              </Text>
              <Text style={[styles.velocitySub, { color: colors.textSecondary }]}>
                {activeVelocityInfo.sub}
              </Text>
            </View>
            <View style={[styles.rateBadge, { backgroundColor: activeVelocityInfo.color + '20', borderColor: activeVelocityInfo.color + '40' }]}>
              <Text style={[styles.rateBadgeText, { color: activeVelocityInfo.color }]}>
                {activeVelocityInfo.rate}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 6,
    marginLeft: 4,
  },
  weightBigText: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 14,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minWidth: 100,
  },
  stepperInput: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    padding: 0,
  },
  stepperUnit: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 6,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    marginTop: 6,
  },
  feedbackIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  feedbackSub: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 4,
    gap: 6,
  },
  paceTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  velocityInfoCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  velocityTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  velocitySub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
