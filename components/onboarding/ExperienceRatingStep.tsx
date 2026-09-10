import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Star, ExternalLink, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export const openPlayStoreReview = async () => {
  const packageName = 'com.fitgo.app';
  // Direct market intent on Android opens the Play Store page & review dialog
  const marketUrl = `market://details?id=${packageName}&showAllReviews=true`;
  const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

  try {
    const canOpen = await Linking.canOpenURL(marketUrl);
    if (canOpen) {
      await Linking.openURL(marketUrl);
      return;
    }
  } catch {}

  try {
    await Linking.openURL(webUrl);
  } catch (err) {
    console.warn('[ExperienceRating] Could not open Play Store URL:', err);
  }
};

export function ExperienceRatingStep({ value: data, onChange, onNext }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [openingStore, setOpeningStore] = useState(false);

  const currentScore = data.experienceRating;

  const handleSelectScore = async (score: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onChange({ experienceRating: score });

    setOpeningStore(true);
    await openPlayStoreReview();
    setTimeout(() => {
      setOpeningStore(false);
    }, 2500);
  };

  const handleSkip = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onChange({ experienceRating: undefined });
    onNext?.();
  };

  return (
    <View style={step.container}>
      {/* Header with 3D Star Icon */}
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Star size={46} color="#F59E0B" fill="#F59E0B" />}
          color="#F59E0B"
          glowColor="#D97706"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.ratingTitle', 'Hasta ahora, ¿cómo calificarías tu experiencia?')}
        </Text>
      </View>

      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.contentWrap}>
        {/* 1 - 10 Rating Row */}
        <View style={[styles.ratingBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = currentScore === num;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => handleSelectScore(num)}
                activeOpacity={0.7}
                style={[
                  styles.numSlot,
                  isSelected && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                    isSelected && { fontWeight: '900' },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Range Labels: Mala ... Excelente */}
        <View style={styles.labelsRow}>
          <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>
            {t('onboarding.ratingBad', 'Mala')}
          </Text>
          <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>
            {t('onboarding.ratingExcellent', 'Excelente')}
          </Text>
        </View>

        {/* Feedback Card with direct Play Store button when rated */}
        {currentScore !== undefined && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.feedbackCard, { backgroundColor: colors.surface, borderColor: colors.primary + '40' }]}
          >
            <View style={styles.feedbackHeader}>
              <View style={[styles.checkCircle, { backgroundColor: colors.primary + '20' }]}>
                <CheckCircle2 size={20} color={colors.primary} />
              </View>
              <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                {t('onboarding.ratingSelected', { score: currentScore, defaultValue: `Calificación seleccionada: ${currentScore}/10` })}
              </Text>
            </View>

            <Text style={[styles.feedbackSub, { color: colors.textMuted }]}>
              {t('onboarding.ratingThankYou', '¡Gracias por tu apoyo! Tu reseña nos ayuda a seguir mejorando FitGO.')}
            </Text>

            <TouchableOpacity
              onPress={openPlayStoreReview}
              activeOpacity={0.8}
              style={styles.playStoreBtnWrap}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playStoreGradient}
              >
                <Star size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playStoreBtnText}>
                  {openingStore
                    ? t('onboarding.ratingRedirecting', 'Abriendo Google Play Store...')
                    : t('onboarding.ratingPlayStoreCta', 'Calificar en Google Play')}
                </Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Skip action */}
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.75}
          style={styles.skipBtn}
        >
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {t('onboarding.ratingSkip', 'Omitir')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  ratingBar: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  numSlot: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  rangeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackCard: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 12,
    gap: 10,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  playStoreBtnWrap: {
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playStoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  playStoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
