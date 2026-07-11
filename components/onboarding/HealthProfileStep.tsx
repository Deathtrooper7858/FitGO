import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Keyboard, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, OnboardingData } from './constants';

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
  onChange
}: HealthProfileStepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const inputRef = useRef<any>(null);

  const selected = data[fieldKey] || [];
  const predefinedKeys = Object.keys(itemsObj);
  const customValues = selected.filter(k => !predefinedKeys.includes(k));
  const [localCustomText, setLocalCustomText] = useState(customValues.length > 0 ? customValues[0].replace('custom:', '') : '');
  const [customFocused, setCustomFocused] = useState(false);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const localTextRef = useRef(localCustomText);
  localTextRef.current = localCustomText;

  const toggle = useCallback((id: string) => {
    const cur = selectedRef.current;
    if (id === 'none') {
      onChange({ [fieldKey]: ['none'] });
      return;
    }
    const newSelection = cur.includes(id)
      ? cur.filter(x => x !== id)
      : [...cur.filter(x => x !== 'none'), id];
    onChange({ [fieldKey]: newSelection });
  }, [onChange, fieldKey]);

  const commitCustomText = useCallback(() => {
    const cur = selectedRef.current;
    const text = localTextRef.current;
    const base = cur.filter(k => predefinedKeys.includes(k) && k !== 'none');
    if (text.trim() === '') {
      onChange({ [fieldKey]: [...base] });
    } else {
      onChange({ [fieldKey]: [...base, `custom:${text.trim()}`] });
    }
  }, [onChange, fieldKey, predefinedKeys]);

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary }]}>
          <Icon size={36} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t(titleKey)}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t(subKey)}</Text>
      </View>

      <View style={{ gap: 12 }}>
        {Object.entries(itemsObj).map(([key, label]) => {
          const isActive = selected.includes(key);
          return (
            <View key={key} style={{ gap: 8 }}>
              <TouchableOpacity
                style={[
                  step.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: 16 },
                  isActive && {
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 3
                  }
                ]}
                onPress={() => toggle(key)}
                activeOpacity={0.8}
              >
                {isActive && (
                  <LinearGradient
                    colors={[colors.primary + '14', colors.primary + '03']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={[
                  step.optionTitle,
                  { color: colors.textPrimary, flex: 1, fontSize: 16 },
                  isActive && { color: colors.primary, fontWeight: '800' }
                ]}>
                  {label}
                </Text>

                <View style={[
                  step.radioOuter,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: 8,
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderWidth: 2
                  }
                ]}>
                  {isActive && <Check size={14} color="#fff" strokeWidth={4} />}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { inputRef.current?.focus(); }}
          style={[
            step.optionCard,
            { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 14, flexDirection: 'column', alignItems: 'stretch' },
            (localCustomText.length > 0 || customFocused) && {
              borderColor: colors.primary,
              shadowColor: colors.primary,
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 2
            }
          ]}
        >
          {localCustomText.length > 0 && (
            <LinearGradient
              colors={[colors.primary + '0C', colors.primary + '02']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          )}
          <Text style={[
            step.optionTitle,
            { color: colors.textPrimary, marginLeft: 16, marginBottom: 12, fontSize: 16 },
            (localCustomText.length > 0 || customFocused) && { color: colors.primary, fontWeight: '800' }
          ]}>
            {t('onboarding.otherSpecify')}
          </Text>
          <TextInput
            ref={inputRef}
            style={{
              backgroundColor: colors.background,
              color: colors.textPrimary,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: customFocused ? colors.primary : colors.border,
              marginHorizontal: 16,
              marginBottom: 8,
              fontSize: 15,
              fontWeight: '600',
              minHeight: 48,
            }}
            placeholder={t('onboarding.otherPlaceholder')}
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
            blurOnSubmit={true}
            onSubmitEditing={() => {
              commitCustomText();
              Keyboard.dismiss();
            }}
          />
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </View>
    </View>
  );
}
