import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mars, Venus, PersonStanding, Activity, Target, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function StatsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary, elevation: 12 }]}>
          <User size={42} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.statsTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.statsSub')}</Text>
      </View>

      <View style={step.statsGrid}>
        <View style={step.field}>
          <Text style={[step.fieldLabel, { color: colors.textSecondary }]}>{t('onboarding.sexLabel')}</Text>
          <View style={step.sexRow}>
            {(['male', 'female', 'other'] as const).map((s) => {
              const active = data.sex === s;
              const accentColor = s === 'male' ? '#3B82F6' : s === 'female' ? '#EC4899' : '#8B5CF6';
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    step.sexBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    active && {
                      borderColor: accentColor,
                      shadowColor: accentColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange({ sex: s });
                  }}
                  activeOpacity={0.8}
                >
                  {active && (
                    <LinearGradient
                      colors={[accentColor + '18', accentColor + '04']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  )}
                  <View style={[
                    step.sexIconWrap,
                    { backgroundColor: active ? accentColor : colors.background },
                    active && { shadowColor: accentColor, shadowOpacity: 0.3, shadowRadius: 4 }
                  ]}>
                    {s === 'male' ? <Mars size={20} color={active ? '#fff' : colors.textSecondary} /> :
                     s === 'female' ? <Venus size={20} color={active ? '#fff' : colors.textSecondary} /> :
                     <PersonStanding size={20} color={active ? '#fff' : colors.textSecondary} />}
                  </View>
                  <Text style={[
                    step.sexLabel,
                    { color: colors.textSecondary },
                    active && { color: colors.textPrimary, fontWeight: '900' }
                  ]}>
                    {s === 'other' ? t('profile.otherGender') : (t(`profile.${s}`) as string)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {data.sex === 'other' && (
          <View style={step.field}>
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
                  color: colors.textPrimary
                }
              ]}
              placeholder={t('profile.specifyGender')}
              placeholderTextColor={colors.textMuted}
              value={data.customGender ?? ''}
              onChangeText={(text) => onChange({ customGender: text })}
            />
          </View>
        )}

        {[
          { label: t('profile.age'), key: 'age', unit: t('profile.ageYears'), min: 15, max: 80, icon: <Activity size={18} /> },
          { label: t('profile.weight'), key: 'weight', unit: data.weightUnit === 'lbs' ? 'lbs' : 'kg', min: data.weightUnit === 'lbs' ? 66 : 30, max: data.weightUnit === 'lbs' ? 550 : 250, icon: <Target size={18} /> },
          { label: t('profile.height'), key: 'height', unit: data.heightUnit === 'ft' ? 'ft' : 'cm', min: data.heightUnit === 'ft' ? 3.2 : 100, max: data.heightUnit === 'ft' ? 8.2 : 250, icon: <User size={18} /> },
        ].map(({ label, key, unit, min, max, icon }) => (
          <View key={key} style={step.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[step.fieldLabel, { marginBottom: 0, color: colors.textSecondary }]}>{label}</Text>
              </View>
              {(key === 'weight' || key === 'height') && (
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary + '12',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colors.primary + '25'
                  }}
                  onPress={() => {
                    if (key === 'weight') {
                      const newUnit = data.weightUnit === 'lbs' ? 'kg' : 'lbs';
                      const newWeight = newUnit === 'lbs' ? Math.round((data.weight ?? 70) * 2.20462) : Math.round((data.weight ?? 154) / 2.20462);
                      onChange({ weightUnit: newUnit as 'kg' | 'lbs', weight: newWeight });
                    } else {
                      const newUnit = data.heightUnit === 'ft' ? 'cm' : 'ft';
                      const newHeight = newUnit === 'ft'
                        ? Number(((data.height ?? 170) / 30.48).toFixed(1))
                        : Math.round((data.height ?? 5.6) * 30.48);
                      onChange({ heightUnit: newUnit as 'cm' | 'ft', height: newHeight });
                    }
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {key === 'weight'
                      ? (data.weightUnit === 'lbs' ? t('profile.changeToKg') : t('profile.changeToLbs'))
                      : (data.heightUnit === 'ft' ? t('profile.changeToCm') : t('profile.changeToFt'))
                    }
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={step.numRow}>
              <TouchableOpacity
                style={[
                  step.numBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.08,
                    shadowRadius: 4
                  }
                ]}
                onPress={() => {
                  const cur = (data as any)[key] ?? min;
                  const stepVal = key === 'height' && data.heightUnit === 'ft' ? 0.1 : 1;
                  if (cur > min) onChange({ [key]: Number((cur - stepVal).toFixed(1)) });
                }}
                activeOpacity={0.7}
              >
                <Minus size={24} color={colors.primary} />
              </TouchableOpacity>

              <View style={[
                step.numDisplay,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.05,
                  shadowRadius: 6
                }
              ]}>
                <TextInput
                  style={[step.numValue, { color: colors.textPrimary, padding: 0, textAlign: 'center', minWidth: 60 }]}
                  keyboardType="numeric"
                  value={((data as any)[key] ?? '').toString()}
                  onChangeText={(text) => {
                    if (text === '') {
                      onChange({ [key]: undefined as any });
                    } else {
                      const sanitized = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                      const parsed = parseFloat(sanitized);
                      if (!isNaN(parsed)) {
                        onChange({ [key]: parsed });
                      }
                    }
                  }}
                />
                <Text style={[step.numUnit, { color: colors.textSecondary }]}>{unit}</Text>
              </View>

              <TouchableOpacity
                style={[
                  step.numBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.08,
                    shadowRadius: 4
                  }
                ]}
                onPress={() => {
                  const cur = (data as any)[key] ?? min;
                  const stepVal = key === 'height' && data.heightUnit === 'ft' ? 0.1 : 1;
                  if (cur < max) onChange({ [key]: Number((cur + stepVal).toFixed(1)) });
                }}
                activeOpacity={0.7}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
