import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function TermsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary }]}>
          <Check size={36} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.termsTitle', 'Aviso Legal')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.termsSub', 'Por favor revisa y acepta nuestros términos y políticas para continuar.')}</Text>
      </View>

      <TouchableOpacity
        style={[
          step.optionCard,
          { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 20 },
          data.termsAccepted && { borderColor: colors.primary, shadowColor: colors.primary, elevation: 3 }
        ]}
        onPress={() => onChange({ termsAccepted: !data.termsAccepted })}
        activeOpacity={0.8}
      >
        <View style={[
          step.radioOuter,
          {
            borderColor: data.termsAccepted ? colors.primary : colors.border,
            borderRadius: 8,
            backgroundColor: data.termsAccepted ? colors.primary : 'transparent',
            borderWidth: 2,
            marginRight: 16
          }
        ]}>
          {data.termsAccepted && <Check size={14} color="#fff" strokeWidth={4} />}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
            {t('auth.termsRead')}{' '}
            <Text
              style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/(auth)/terms', params: { tab: 'terms' } } as any); }}
            >
              {t('auth.termsLink')}
            </Text>
            {' '}{t('auth.termsAnd')}{' '}
            <Text
              style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/(auth)/terms', params: { tab: 'privacy' } } as any); }}
            >
              {t('auth.privacyLink')}
            </Text>
            .
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
