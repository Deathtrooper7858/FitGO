import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ShieldCheck, FileText, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function TermsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const isAccepted = !!data.termsAccepted;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Check size={44} color="#8B5CF6" strokeWidth={3} />}
          color="#8B5CF6"
          glowColor="#7C5CFC"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.termsTitle', 'Terms & Conditions')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.termsSub', 'Read and accept to continue with your plan.')}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {/* Main Card with Acceptance and Privacy Guarantee */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(18)}>
          <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Interactive Terms Checkbox Row */}
            <TouchableOpacity
              style={[
                styles.termsRow,
                isAccepted && {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange({ termsAccepted: !isAccepted });
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isAccepted ? colors.primary : colors.border,
                    backgroundColor: isAccepted ? colors.primary : 'transparent',
                  },
                ]}
              >
                {isAccepted && <Check size={16} color="#FFF" strokeWidth={3.5} />}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.termsText, { color: colors.textPrimary }]}>
                  {t('onboarding.termsAgreementPrefix', 'I have read and accept the')}{' '}
                  <Text
                    style={[styles.linkText, { color: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/(auth)/terms', params: { tab: 'terms' } } as any);
                    }}
                  >
                    {t('onboarding.termsLink', 'Terms & Conditions')}
                  </Text>
                  {' '}{t('onboarding.termsAnd', 'and the')}{' '}
                  <Text
                    style={[styles.linkText, { color: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/(auth)/terms', params: { tab: 'privacy' } } as any);
                    }}
                  >
                    {t('onboarding.privacyLink', 'Privacy Policy')}
                  </Text>
                  .
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border + '40' }]} />

            {/* Privacy Security Row */}
            <View style={styles.privacyRow}>
              <View style={[styles.shieldIconWrap, { backgroundColor: '#8B5CF618' }]}>
                <ShieldCheck size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                {t(
                  'onboarding.privacyGuarantee',
                  'Your data is secure and will only be used to personalize your experience.'
                )}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  linkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  shieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
});
