import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mars, Venus, PersonStanding, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function StatsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<User size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.statsTitle', "Let's personalize your FitGO")}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.statsSub', 'A few details help us tailor your experience.')}
        </Text>
      </View>

      <View style={step.statsGrid}>
        {/* Gender Selection */}
        <Animated.View entering={FadeInUp.delay(100).springify().damping(18)} style={step.field}>
          <Text style={[step.fieldLabel, { color: colors.textSecondary }]}>
            {t('onboarding.genderLabel', 'GENDER')}
          </Text>
          <View style={step.sexRow}>
            {(['male', 'female', 'other'] as const).map((s) => {
              const active = data.sex === s;
              const accentColor = s === 'male' ? '#3B82F6' : s === 'female' ? '#EC4899' : '#06B6D4';
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    step.sexBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    active && {
                      borderColor: accentColor,
                      shadowColor: accentColor,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 10,
                      elevation: 6,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange({ sex: s });
                  }}
                  activeOpacity={0.8}
                >
                  {active && (
                    <LinearGradient
                      colors={[accentColor + '20', accentColor + '05']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  )}
                  <View
                    style={[
                      step.sexIconWrap,
                      { backgroundColor: active ? accentColor + '25' : colors.background },
                      active && { borderColor: accentColor + '60', borderWidth: 1.5 },
                    ]}
                  >
                    {s === 'male' ? (
                      <Mars size={24} color={active ? accentColor : colors.textSecondary} strokeWidth={2.5} />
                    ) : s === 'female' ? (
                      <Venus size={24} color={active ? accentColor : colors.textSecondary} strokeWidth={2.5} />
                    ) : (
                      <PersonStanding size={24} color={active ? accentColor : colors.textSecondary} strokeWidth={2.5} />
                    )}
                  </View>
                  <Text
                    style={[
                      step.sexLabel,
                      { color: colors.textSecondary },
                      active && { color: colors.textPrimary, fontWeight: '800' },
                    ]}
                  >
                    {s === 'other'
                      ? t('profile.otherGender', 'Other')
                      : (t(`profile.${s}`) as string)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {data.sex === 'other' && (
          <Animated.View entering={FadeInUp.duration(200)} style={step.field}>
            <TextInput
              style={[
                step.numDisplay,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                  paddingHorizontal: 16,
                  height: 56,
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.textPrimary,
                },
              ]}
              placeholder={t('profile.specifyGender', 'Specify your gender')}
              placeholderTextColor={colors.textMuted}
              value={data.customGender ?? ''}
              onChangeText={(text) => onChange({ customGender: text })}
            />
          </Animated.View>
        )}

        {/* Age Field */}
        <Animated.View entering={FadeInUp.delay(180).springify().damping(18)} style={step.field}>
          <Text style={[step.fieldLabel, { color: colors.textSecondary }]}>
            {t('profile.age', 'AGE')}
          </Text>
          <View style={step.numRow}>
            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const cur = data.age ?? 25;
                if (cur > 15) onChange({ age: cur - 1 });
              }}
              activeOpacity={0.7}
            >
              <Minus size={22} color={colors.primary} />
            </TouchableOpacity>

            <View
              style={[
                step.numDisplay,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  step.numValue,
                  { color: colors.textPrimary, padding: 0, textAlign: 'center', minWidth: 44 },
                ]}
                keyboardType="numeric"
                value={((data.age ?? 25)).toString()}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9]/g, '');
                  const parsed = parseInt(sanitized, 10);
                  if (!isNaN(parsed)) onChange({ age: parsed });
                }}
              />
              <Text style={[step.numUnit, { color: colors.textSecondary }]}>
                {t('profile.ageYears', 'yrs')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const cur = data.age ?? 25;
                if (cur < 90) onChange({ age: cur + 1 });
              }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Weight Field with kg/lb toggle */}
        <Animated.View entering={FadeInUp.delay(240).springify().damping(18)} style={step.field}>
          <View style={styles.headerRow}>
            <Text style={[step.fieldLabel, { marginBottom: 0, color: colors.textSecondary }]}>
              {t('profile.weight', 'WEIGHT')}
            </Text>
            <View style={[styles.unitToggleWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.unitPill,
                  data.weightUnit !== 'lbs' && [styles.unitPillActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (data.weightUnit === 'lbs') {
                    const newWeight = Math.round((data.weight ?? 154) / 2.20462);
                    onChange({ weightUnit: 'kg', weight: newWeight });
                  }
                }}
              >
                <Text
                  style={[
                    styles.unitPillText,
                    { color: data.weightUnit !== 'lbs' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitPill,
                  data.weightUnit === 'lbs' && [styles.unitPillActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (data.weightUnit !== 'lbs') {
                    const newWeight = Math.round((data.weight ?? 70) * 2.20462);
                    onChange({ weightUnit: 'lbs', weight: newWeight });
                  }
                }}
              >
                <Text
                  style={[
                    styles.unitPillText,
                    { color: data.weightUnit === 'lbs' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  lb
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={step.numRow}>
            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const cur = data.weight ?? (data.weightUnit === 'lbs' ? 154 : 70);
                const min = data.weightUnit === 'lbs' ? 66 : 30;
                if (cur > min) onChange({ weight: cur - 1 });
              }}
              activeOpacity={0.7}
            >
              <Minus size={22} color={colors.primary} />
            </TouchableOpacity>

            <View
              style={[
                step.numDisplay,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  step.numValue,
                  { color: colors.textPrimary, padding: 0, textAlign: 'center', minWidth: 50 },
                ]}
                keyboardType="numeric"
                value={((data.weight ?? (data.weightUnit === 'lbs' ? 154 : 70))).toString()}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9]/g, '');
                  const parsed = parseInt(sanitized, 10);
                  if (!isNaN(parsed)) onChange({ weight: parsed });
                }}
              />
              <Text style={[step.numUnit, { color: colors.textSecondary }]}>
                {data.weightUnit === 'lbs' ? 'lbs' : 'kg'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const cur = data.weight ?? (data.weightUnit === 'lbs' ? 154 : 70);
                const max = data.weightUnit === 'lbs' ? 550 : 250;
                if (cur < max) onChange({ weight: cur + 1 });
              }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Height Field with cm/ft toggle */}
        <Animated.View entering={FadeInUp.delay(300).springify().damping(18)} style={step.field}>
          <View style={styles.headerRow}>
            <Text style={[step.fieldLabel, { marginBottom: 0, color: colors.textSecondary }]}>
              {t('profile.height', 'HEIGHT')}
            </Text>
            <View style={[styles.unitToggleWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.unitPill,
                  data.heightUnit !== 'ft' && [styles.unitPillActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (data.heightUnit === 'ft') {
                    const newHeight = Math.round((data.height ?? 5.6) * 30.48);
                    onChange({ heightUnit: 'cm', height: newHeight });
                  }
                }}
              >
                <Text
                  style={[
                    styles.unitPillText,
                    { color: data.heightUnit !== 'ft' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitPill,
                  data.heightUnit === 'ft' && [styles.unitPillActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (data.heightUnit !== 'ft') {
                    const newHeight = Number(((data.height ?? 170) / 30.48).toFixed(1));
                    onChange({ heightUnit: 'ft', height: newHeight });
                  }
                }}
              >
                <Text
                  style={[
                    styles.unitPillText,
                    { color: data.heightUnit === 'ft' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  ft
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={step.numRow}>
            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const isFt = data.heightUnit === 'ft';
                const cur = data.height ?? (isFt ? 5.6 : 170);
                const stepVal = isFt ? 0.1 : 1;
                const min = isFt ? 3.2 : 100;
                if (cur > min) onChange({ height: Number((cur - stepVal).toFixed(1)) });
              }}
              activeOpacity={0.7}
            >
              <Minus size={22} color={colors.primary} />
            </TouchableOpacity>

            <View
              style={[
                step.numDisplay,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  step.numValue,
                  { color: colors.textPrimary, padding: 0, textAlign: 'center', minWidth: 50 },
                ]}
                keyboardType="numeric"
                value={((data.height ?? (data.heightUnit === 'ft' ? 5.6 : 170))).toString()}
                onChangeText={(text) => {
                  const sanitized = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                  const parsed = parseFloat(sanitized);
                  if (!isNaN(parsed)) onChange({ height: parsed });
                }}
              />
              <Text style={[step.numUnit, { color: colors.textSecondary }]}>
                {data.heightUnit === 'ft' ? 'ft' : 'cm'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                step.numBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const isFt = data.heightUnit === 'ft';
                const cur = data.height ?? (isFt ? 5.6 : 170);
                const stepVal = isFt ? 0.1 : 1;
                const max = isFt ? 8.2 : 250;
                if (cur < max) onChange({ height: Number((cur + stepVal).toFixed(1)) });
              }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unitToggleWrap: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 3,
    gap: 2,
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitPillActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
});
