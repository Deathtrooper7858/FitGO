import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pill,
  Heart,
  Droplets,
  Zap,
  Dumbbell,
  Sparkles,
  Fish,
  Shield,
  ShieldCheck,
  Brain,
  Pencil,
  Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

interface MedicationItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface MedicationGroup {
  id: string;
  title: string;
  items: MedicationItem[];
}

export function MedicationsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const inputRef = useRef<any>(null);

  const selected = useMemo(() => data.medicationsSupplements || [], [data.medicationsSupplements]);
  const customValues = selected.filter((k) => k.startsWith('custom:'));
  const [customText, setCustomText] = useState(
    customValues.length > 0 ? customValues[0].replace('custom:', '') : ''
  );
  const [customFocused, setCustomFocused] = useState(false);

  const GROUPS: MedicationGroup[] = [
    {
      id: 'prescription',
      title: t('onboarding.suppCategories.prescription', 'PRESCRIPTION MEDICATIONS'),
      items: [
        {
          id: 'metformin',
          labelKey: 'onboarding.medicationItems.metformin',
          defaultLabel: 'Metformin (Diabetes)',
          icon: <Pill size={20} color="#3B82F6" />,
          color: '#3B82F6',
        },
        {
          id: 'blood_pressure_meds',
          labelKey: 'onboarding.medicationItems.blood_pressure_meds',
          defaultLabel: 'Blood Pressure Medication',
          icon: <Heart size={20} color="#EF4444" />,
          color: '#EF4444',
        },
        {
          id: 'anticoagulants',
          labelKey: 'onboarding.medicationItems.anticoagulants',
          defaultLabel: 'Anticoagulants / Blood Thinners',
          icon: <Droplets size={20} color="#DC2626" />,
          color: '#DC2626',
        },
        {
          id: 'antidepressants',
          labelKey: 'onboarding.medicationItems.antidepressants',
          defaultLabel: 'Antidepressants / Anxiolytics',
          icon: <Brain size={20} color="#8B5CF6" />,
          color: '#8B5CF6',
        },
        {
          id: 'thyroid_hormone',
          labelKey: 'onboarding.medicationItems.thyroid_hormone',
          defaultLabel: 'Thyroid Hormone (Levothyroxine)',
          icon: <Zap size={20} color="#EAB308" />,
          color: '#EAB308',
        },
      ],
    },
    {
      id: 'supplements',
      title: t('onboarding.suppCategories.supplements', 'SUPPLEMENTS & FITNESS'),
      items: [
        {
          id: 'whey_protein',
          labelKey: 'onboarding.medicationItems.whey_protein',
          defaultLabel: 'Protein Powder (Whey / Plant / Casein)',
          icon: <Dumbbell size={20} color="#10B981" />,
          color: '#10B981',
        },
        {
          id: 'creatine',
          labelKey: 'onboarding.medicationItems.creatine',
          defaultLabel: 'Creatine Monohydrate',
          icon: <Zap size={20} color="#06B6D4" />,
          color: '#06B6D4',
        },
        {
          id: 'multivitamins',
          labelKey: 'onboarding.medicationItems.multivitamins',
          defaultLabel: 'Vitamins / Multivitamins',
          icon: <Sparkles size={20} color="#F59E0B" />,
          color: '#F59E0B',
        },
        {
          id: 'omega3',
          labelKey: 'onboarding.medicationItems.omega3',
          defaultLabel: 'Omega-3 Fish Oil',
          icon: <Fish size={20} color="#3B82F6" />,
          color: '#3B82F6',
        },
        {
          id: 'iron',
          labelKey: 'onboarding.medicationItems.iron',
          defaultLabel: 'Iron Supplement',
          icon: <Shield size={20} color="#EF4444" />,
          color: '#EF4444',
        },
      ],
    },
  ];

  const toggle = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (id === 'none') {
        onChange({ medicationsSupplements: ['none'] });
        return;
      }
      const cur = selected.filter((x) => x !== 'none');
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      onChange({ medicationsSupplements: next.length === 0 ? [] : next });
    },
    [selected, onChange]
  );

  const commitCustomText = (text: string) => {
    const trimmed = text.trim();
    const base = selected.filter((k) => !k.startsWith('custom:') && k !== 'none');
    if (trimmed) {
      onChange({ medicationsSupplements: [...base, `custom:${trimmed}`] });
    } else {
      onChange({ medicationsSupplements: base });
    }
  };

  const isOtherActive = customText.length > 0 || customFocused || selected.some((k) => k.startsWith('custom:'));

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Pill size={44} color="#06B6D4" />}
          color="#06B6D4"
          glowColor="#3B82F6"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.medicationsTitle', 'Medications & Supplements?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.medicationsSub', 'Helps tailor your nutrition and macronutrient targets')}
        </Text>
      </View>

      <View style={{ gap: 18 }}>
        {/* Standalone "None" option */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(18)}>
          <TouchableOpacity
            style={[
              step.optionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selected.includes('none') && {
                borderColor: '#10B981',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 6,
              },
            ]}
            onPress={() => toggle('none')}
            activeOpacity={0.82}
          >
            {selected.includes('none') && (
              <LinearGradient
                colors={['#10B98122', '#10B98105']}
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
                  borderColor: selected.includes('none') ? '#10B98160' : colors.border + '40',
                },
              ]}
            >
              <ShieldCheck size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text
                style={[
                  step.optionTitle,
                  { color: colors.textPrimary },
                  selected.includes('none') && { color: '#10B981', fontWeight: '900' },
                ]}
              >
                {t('onboarding.medicationItems.none', 'None')}
              </Text>
              <Text style={[step.optionSub, { color: colors.textSecondary }]}>
                {t('onboarding.noMedicationsSupplements', "I don't take medications or supplements")}
              </Text>
            </View>
            <View
              style={[
                step.radioOuter,
                {
                  borderColor: selected.includes('none') ? '#10B981' : colors.border,
                  backgroundColor: selected.includes('none') ? '#10B981' : 'transparent',
                  borderWidth: 2,
                },
              ]}
            >
              {selected.includes('none') && <Check size={14} color="#FFF" strokeWidth={4} />}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Grouped sections */}
        {GROUPS.map((group, gIndex) => (
          <Animated.View
            key={group.id}
            entering={FadeInUp.delay(140 + gIndex * 90).springify().damping(18)}
            style={{ gap: 10 }}
          >
            <Text style={styles.sectionHeader}>{group.title}</Text>
            <View style={{ gap: 8 }}>
              {group.items.map((item) => {
                const active = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      step.optionCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                      },
                      active && {
                        borderColor: item.color,
                        shadowColor: item.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 5,
                      },
                    ]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.82}
                  >
                    {active && (
                      <LinearGradient
                        colors={[item.color + '1A', item.color + '04']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <View
                      style={[
                        styles.itemIconWrap,
                        {
                          backgroundColor: colors.background,
                          borderColor: active ? item.color + '50' : colors.border + '30',
                        },
                      ]}
                    >
                      {item.icon}
                    </View>
                    <Text
                      style={[
                        step.optionTitle,
                        { color: colors.textPrimary, flex: 1, fontSize: 15, marginBottom: 0 },
                        active && { color: item.color, fontWeight: '800' },
                      ]}
                    >
                      {t(item.labelKey, item.defaultLabel)}
                    </Text>
                    <View
                      style={[
                        step.radioOuter,
                        {
                          borderColor: active ? item.color : colors.border,
                          backgroundColor: active ? item.color : 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      {active && <Check size={14} color="#FFF" strokeWidth={4} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        ))}

        {/* Other (specify) section */}
        <Animated.View entering={FadeInUp.delay(140 + GROUPS.length * 90).springify().damping(18)} style={{ gap: 10 }}>
          <Text style={styles.sectionHeader}>{t('onboarding.otherHeader', 'OTHER')}</Text>
          <View
            style={[
              step.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 14,
              },
              isOtherActive && {
                borderColor: '#06B6D4',
                shadowColor: '#06B6D4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
              },
            ]}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: isOtherActive ? 12 : 0 }}
              onPress={() => {
                inputRef.current?.focus();
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.itemIconWrap,
                  {
                    backgroundColor: colors.background,
                    borderColor: isOtherActive ? '#06B6D450' : colors.border + '30',
                  },
                ]}
              >
                <Pencil size={20} color="#06B6D4" />
              </View>
              <Text
                style={[
                  step.optionTitle,
                  { color: colors.textPrimary, flex: 1, fontSize: 15, marginBottom: 0 },
                  isOtherActive && { color: '#06B6D4', fontWeight: '800' },
                ]}
              >
                {t('onboarding.otherSpecify', 'Other (specify)')}
              </Text>
              <View
                style={[
                  step.radioOuter,
                  {
                    borderColor: isOtherActive ? '#06B6D4' : colors.border,
                    backgroundColor: isOtherActive ? '#06B6D4' : 'transparent',
                    borderWidth: 2,
                  },
                ]}
              >
                {isOtherActive && <Check size={14} color="#FFF" strokeWidth={4} />}
              </View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[
                styles.customInput,
                {
                  backgroundColor: colors.background,
                  borderColor: customFocused ? '#06B6D4' : colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder={t('onboarding.otherPlaceholder', 'Type here...')}
              placeholderTextColor={colors.textMuted}
              value={customText}
              onChangeText={(text) => {
                setCustomText(text);
                commitCustomText(text);
              }}
              onFocus={() => setCustomFocused(true)}
              onBlur={() => {
                setCustomFocused(false);
                commitCustomText(customText);
              }}
              returnKeyType="done"
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginTop: 6,
    marginLeft: 4,
  },
  itemIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  customInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    fontWeight: '600',
  },
});
