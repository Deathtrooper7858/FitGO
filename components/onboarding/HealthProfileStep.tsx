import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Keyboard, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, OnboardingData } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

interface HealthProfileStepProps {
  icon: React.ElementType;
  titleKey: string;
  subKey: string;
  itemsObj: Record<string, string>;
  fieldKey: 'dietaryRestrictions' | 'medicalConditions' | 'medicationsSupplements';
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function HealthProfileStep({
  icon: Icon,
  titleKey,
  subKey,
  itemsObj,
  fieldKey,
  data,
  onChange,
}: HealthProfileStepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const inputRef = useRef<any>(null);

  const selected = data[fieldKey] || [];
  const predefinedKeys = Object.keys(itemsObj);
  const customValues = selected.filter((k) => !predefinedKeys.includes(k));
  const [localCustomText, setLocalCustomText] = useState(
    customValues.length > 0 ? customValues[0].replace('custom:', '') : ''
  );
  const [customFocused, setCustomFocused] = useState(false);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const localTextRef = useRef(localCustomText);
  localTextRef.current = localCustomText;

  const toggle = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const cur = selectedRef.current;
      if (id === 'none') {
        onChange({ [fieldKey]: ['none'] });
        return;
      }
      const newSelection = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur.filter((x) => x !== 'none'), id];
      onChange({ [fieldKey]: newSelection });
    },
    [onChange, fieldKey]
  );

  const commitCustomText = useCallback(() => {
    const cur = selectedRef.current;
    const text = localTextRef.current;
    const base = cur.filter((k) => predefinedKeys.includes(k) && k !== 'none');
    if (text.trim() === '') {
      onChange({ [fieldKey]: [...base] });
    } else {
      onChange({ [fieldKey]: [...base, `custom:${text.trim()}`] });
    }
  }, [onChange, fieldKey, predefinedKeys]);

  const isCustomActive = localCustomText.length > 0 || customFocused;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Icon size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>{t(titleKey)}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t(subKey)}</Text>
      </View>

      <View style={{ gap: 10 }}>
        {Object.entries(itemsObj).map(([key, label], index) => {
          const isActive = selected.includes(key);
          return (
            <Animated.View
              key={key}
              entering={FadeInUp.delay(60 + index * 50).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  step.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  },
                  isActive && {
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
                onPress={() => toggle(key)}
                activeOpacity={0.82}
              >
                {isActive && (
                  <LinearGradient
                    colors={[colors.primary + '18', colors.primary + '04']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text
                  style={[
                    step.optionTitle,
                    { color: colors.textPrimary, flex: 1, fontSize: 15, marginBottom: 0 },
                    isActive && { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {label}
                </Text>

                <View
                  style={[
                    step.radioOuter,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                >
                  {isActive && <Check size={14} color="#fff" strokeWidth={4} />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <Animated.View
          entering={FadeInUp.delay(60 + Object.keys(itemsObj).length * 50).springify().damping(18)}
        >
          <View
            style={[
              step.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                padding: 14,
                flexDirection: 'column',
                alignItems: 'stretch',
              },
              isCustomActive && {
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: isCustomActive ? 12 : 0,
              }}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={0.8}
            >
              <Pencil size={18} color={isCustomActive ? colors.primary : colors.textSecondary} />
              <Text
                style={[
                  step.optionTitle,
                  { color: colors.textPrimary, flex: 1, fontSize: 15, marginBottom: 0 },
                  isCustomActive && { color: colors.primary, fontWeight: '800' },
                ]}
              >
                {t('onboarding.otherSpecify', 'Other (specify)')}
              </Text>
              <View
                style={[
                  step.radioOuter,
                  {
                    borderColor: isCustomActive ? colors.primary : colors.border,
                    backgroundColor: isCustomActive ? colors.primary : 'transparent',
                    borderWidth: 2,
                  },
                ]}
              >
                {isCustomActive && <Check size={14} color="#fff" strokeWidth={4} />}
              </View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                paddingHorizontal: 14,
                height: 46,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: customFocused ? colors.primary : colors.border,
                fontSize: 14,
                fontWeight: '600',
              }}
              placeholder={t('onboarding.otherPlaceholder', 'Type here...')}
              placeholderTextColor={colors.textMuted}
              value={localCustomText}
              onChangeText={setLocalCustomText}
              onFocus={() => setCustomFocused(true)}
              onBlur={() => {
                setCustomFocused(false);
                commitCustomText();
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => {
                commitCustomText();
                Keyboard.dismiss();
              }}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
