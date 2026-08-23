import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Apple, Leaf, Sprout, Wheat, Utensils, Droplets,
  Milk, Fish, Ban, Star, Clock, Pencil, Check
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

interface RestrictionItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface RestrictionGroup {
  id: string;
  title: string;
  items: RestrictionItem[];
}

export function DietaryRestrictionsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const inputRef = useRef<any>(null);

  const selected = data.dietaryRestrictions || [];
  const customValues = selected.filter((k) => k.startsWith('custom:'));
  const [customText, setCustomText] = useState(
    customValues.length > 0 ? customValues[0].replace('custom:', '') : ''
  );
  const [customFocused, setCustomFocused] = useState(false);

  const GROUPS: RestrictionGroup[] = [
    {
      id: 'preferences',
      title: t('onboarding.dietPreferencesHeader', 'DIET PREFERENCES'),
      items: [
        {
          id: 'vegetarian',
          labelKey: 'onboarding.dietaryItems.vegetarian',
          defaultLabel: 'Vegetarian',
          icon: <Leaf size={20} color="#10B981" />,
          color: '#10B981',
        },
        {
          id: 'vegan',
          labelKey: 'onboarding.dietaryItems.vegan',
          defaultLabel: 'Vegan',
          icon: <Sprout size={20} color="#10B981" />,
          color: '#10B981',
        },
        {
          id: 'gluten_free',
          labelKey: 'onboarding.dietaryItems.gluten_free',
          defaultLabel: 'Gluten-Free (Celiac)',
          icon: <Wheat size={20} color="#EAB308" />,
          color: '#EAB308',
        },
        {
          id: 'low_carb',
          labelKey: 'onboarding.dietaryItems.low_carb',
          defaultLabel: 'Low-Carb Diet',
          icon: <Utensils size={20} color="#3B82F6" />,
          color: '#3B82F6',
        },
        {
          id: 'low_sodium',
          labelKey: 'onboarding.dietaryItems.low_sodium',
          defaultLabel: 'Low-Sodium Diet',
          icon: <Droplets size={20} color="#06B6D4" />,
          color: '#06B6D4',
        },
      ],
    },
    {
      id: 'allergies',
      title: t('onboarding.allergiesHeader', 'ALLERGIES / AVOID'),
      items: [
        {
          id: 'lactose_free',
          labelKey: 'onboarding.dietaryItems.lactose_free',
          defaultLabel: 'Lactose-Free',
          icon: <Milk size={20} color="#EF4444" />,
          color: '#EF4444',
        },
        {
          id: 'no_seafood',
          labelKey: 'onboarding.dietaryItems.no_seafood',
          defaultLabel: 'No Seafood',
          icon: <Fish size={20} color="#EF4444" />,
          color: '#EF4444',
        },
        {
          id: 'no_nuts',
          labelKey: 'onboarding.dietaryItems.no_nuts',
          defaultLabel: 'No Nuts',
          icon: <Ban size={20} color="#EF4444" />,
          color: '#EF4444',
        },
      ],
    },
    {
      id: 'other',
      title: t('onboarding.otherHeader', 'OTHER'),
      items: [
        {
          id: 'halal',
          labelKey: 'onboarding.dietaryItems.halal',
          defaultLabel: 'Halal / Kosher',
          icon: <Star size={20} color="#8B5CF6" />,
          color: '#8B5CF6',
        },
        {
          id: 'intermittent_fasting',
          labelKey: 'onboarding.dietaryItems.intermittent_fasting',
          defaultLabel: 'Intermittent Fasting',
          icon: <Clock size={20} color="#8B5CF6" />,
          color: '#8B5CF6',
        },
      ],
    },
  ];

  const toggle = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (id === 'none') {
        onChange({ dietaryRestrictions: ['none'] });
        return;
      }
      const cur = selected.filter((x) => x !== 'none');
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      onChange({ dietaryRestrictions: next.length === 0 ? [] : next });
    },
    [selected, onChange]
  );

  const commitCustomText = (text: string) => {
    const trimmed = text.trim();
    const base = selected.filter((k) => !k.startsWith('custom:') && k !== 'none');
    if (trimmed) {
      onChange({ dietaryRestrictions: [...base, `custom:${trimmed}`] });
    } else {
      onChange({ dietaryRestrictions: base });
    }
  };

  const isOtherActive = customText.length > 0 || customFocused || selected.some((k) => k.startsWith('custom:'));

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Apple size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.dietaryRestrictionsTitle', 'Any dietary restrictions?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.dietaryRestrictionsSub', 'Select all that apply — you can skip this step')}
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
              <Leaf size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text
                style={[
                  step.optionTitle,
                  { color: colors.textPrimary },
                  selected.includes('none') && { color: '#10B981', fontWeight: '900' },
                ]}
              >
                {t('onboarding.dietaryItems.none', 'None')}
              </Text>
              <Text style={[step.optionSub, { color: colors.textSecondary }]}>
                {t('onboarding.eatEverything', 'I eat everything')}
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

              {/* Other specify custom text box in the OTHER group */}
              {group.id === 'other' && (
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
                      borderColor: '#8B5CF6',
                      shadowColor: '#8B5CF6',
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
                          borderColor: isOtherActive ? '#8B5CF650' : colors.border + '30',
                        },
                      ]}
                    >
                      <Pencil size={20} color="#8B5CF6" />
                    </View>
                    <Text
                      style={[
                        step.optionTitle,
                        { color: colors.textPrimary, flex: 1, fontSize: 15, marginBottom: 0 },
                        isOtherActive && { color: '#8B5CF6', fontWeight: '800' },
                      ]}
                    >
                      {t('onboarding.otherSpecify', 'Other (specify)')}
                    </Text>
                    <View
                      style={[
                        step.radioOuter,
                        {
                          borderColor: isOtherActive ? '#8B5CF6' : colors.border,
                          backgroundColor: isOtherActive ? '#8B5CF6' : 'transparent',
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
                        borderColor: customFocused ? '#8B5CF6' : colors.border,
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
              )}
            </View>
          </Animated.View>
        ))}
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
