import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Star, ChevronLeft, ChevronRight, Award, Flame, Dumbbell, Sparkles, CheckCircle2, Quote } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

const STORIES = [
  {
    id: 'male',
    nameKey: 'paywall.transformations.case1.name',
    defaultName: 'Mateo C., 24 años',
    tagKey: 'paywall.transformations.case1.tag',
    defaultTag: 'Caso 1 · Mateo',
    durationKey: 'paywall.transformations.case1.duration',
    defaultDuration: '6 meses con FitGO Pro',
    quoteKey: 'paywall.transformations.case1.quote',
    defaultQuote: 'Con el Coach IA y los menús adaptados a mis macros diarios, dejé de improvisar. El cambio físico y de confianza fue increíble.',
    beforeWeightNum: 96,
    afterWeightNum: 70,
    diffNum: -26,
    diffColor: '#10B981',
    beforeImg: require('../../assets/model/obese.png'),
    afterImg: require('../../assets/model/selfie.png'),
  },
  {
    id: 'female',
    nameKey: 'paywall.transformations.case2.name',
    defaultName: 'Valeria M., 23 años',
    tagKey: 'paywall.transformations.case2.tag',
    defaultTag: 'Caso 2 · Valeria',
    durationKey: 'paywall.transformations.case2.duration',
    defaultDuration: '5 meses con FitGO Pro',
    quoteKey: 'paywall.transformations.case2.quote',
    defaultQuote: 'Probé dietas extremas por años. FitGO me enseñó a comer balanceado sin pasar hambre y el escáner me simplificó todo.',
    beforeWeightNum: 88,
    afterWeightNum: 61,
    diffNum: -27,
    diffColor: '#EC4899',
    beforeImg: require('../../assets/model/obese2.png'),
    afterImg: require('../../assets/model/selfie2.png'),
  },
];

export function SocialProofStep(_props: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStory = STORIES[currentIndex];
  const weightUnit = t('profile.kg', 'kg');

  const handleNextStory = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setCurrentIndex((prev) => (prev + 1) % STORIES.length);
  };

  const handlePrevStory = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setCurrentIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
  };

  // Full multilingual title with highlighted counter (10M+, 10M, 10 Mio., 10М)
  const titleText = t('onboarding.socialProofTitle', 'FitGO ya ayudó a 10M+ de personas a alcanzar sus metas');
  const titleParts = titleText.split(/(10M\+|10M|10 Mio\.|10М)/gi);

  return (
    <View style={step.container}>
      {/* Title with Badge */}
      <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.titleSection}>
        <Text style={[styles.mainHeadline, { color: colors.textPrimary }]}>
          {titleParts.map((part, index) => {
            const isHighlight = /^(10M\+|10M|10 Mio\.|10М)$/i.test(part.trim());
            return isHighlight ? (
              <Text key={index} style={styles.highlightBadge}>
                {part}
              </Text>
            ) : (
              part
            );
          })}
        </Text>
      </Animated.View>

      {/* Before & After Interactive Showcase */}
      <Animated.View entering={FadeInUp.delay(120).springify()} style={styles.showcaseCard}>
        <View style={[styles.cardInner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Card Top Header: User Profile & Diff Badge */}
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.personName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {t(currentStory.nameKey, currentStory.defaultName)}
                </Text>
                <View style={[styles.verifiedPill, { backgroundColor: '#10B98118', borderColor: '#10B98130' }]}>
                  <CheckCircle2 size={11} color="#10B981" />
                  <Text style={styles.verifiedText}>{t('paywall.reviews.verifiedUser', 'Verificado')}</Text>
                </View>
              </View>
              <Text style={[styles.durationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {t(currentStory.durationKey, currentStory.defaultDuration)}
              </Text>
            </View>

            {/* Diff Badge */}
            <View style={[styles.diffBadge, { backgroundColor: currentStory.diffColor }]}>
              <Text style={styles.diffText}>
                {`${currentStory.diffNum} ${weightUnit}`}
              </Text>
            </View>
          </View>

          {/* Side-by-Side Images */}
          <View style={styles.splitRow}>
            {/* Before Box */}
            <View style={[styles.imageCardCol, { borderColor: colors.border + '70' }]}>
              <Image
                source={currentStory.beforeImg}
                style={styles.modelImg}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.75)']}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Top Tag */}
              <View style={[styles.imgTagTop, { backgroundColor: 'rgba(239, 68, 68, 0.88)' }]}>
                <Text style={styles.imgTagTopText}>{t('paywall.transformations.before', 'ANTES')}</Text>
              </View>
              {/* Bottom Weight */}
              <View style={styles.imgWeightBottom}>
                <Flame size={12} color="#EF4444" />
                <Text style={styles.imgWeightText}>
                  {`${currentStory.beforeWeightNum} ${weightUnit}`}
                </Text>
              </View>
            </View>

            {/* Connecting Arrow */}
            <View style={styles.centerDivider}>
              <LinearGradient
                colors={['#8B5CF6', '#F59E0B']}
                style={styles.dividerPill}
              >
                <Text style={{ fontSize: 13, color: '#FFF', fontWeight: '800' }}>➔</Text>
              </LinearGradient>
            </View>

            {/* After Box */}
            <View style={[styles.imageCardCol, { borderColor: currentStory.diffColor + '65' }]}>
              <Image
                source={currentStory.afterImg}
                style={styles.modelImg}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.75)']}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Top Tag */}
              <View style={[styles.imgTagTop, { backgroundColor: '#10B981' }]}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.imgTagTopText}>{t('paywall.transformations.after', 'DESPUÉS')}</Text>
              </View>
              {/* Bottom Weight */}
              <View style={[styles.imgWeightBottom, { borderColor: currentStory.diffColor + '50' }]}>
                <Dumbbell size={12} color={currentStory.diffColor} />
                <Text style={[styles.imgWeightText, { color: '#FFF', fontWeight: '800' }]}>
                  {`${currentStory.afterWeightNum} ${weightUnit}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Testimonial Quote Box */}
          <View style={[styles.quoteBox, { backgroundColor: colors.background, borderColor: colors.border + '60' }]}>
            <Quote size={14} color={colors.primary} style={{ marginTop: 2, marginRight: 6, flexShrink: 0 }} />
            <Text style={[styles.quoteText, { color: colors.textSecondary }]}>
              {`"${t(currentStory.quoteKey, currentStory.defaultQuote)}"`}
            </Text>
          </View>

          {/* Carousel Navigation: Arrows & 2 Dots */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handlePrevStory}
              hitSlop={12}
              style={[styles.navArrowBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.dotsRow}>
              {STORIES.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setCurrentIndex(i);
                  }}
                  hitSlop={8}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: colors.border },
                      i === currentIndex && {
                        backgroundColor: colors.primary,
                        width: 22,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNextStory}
              hitSlop={12}
              style={[styles.navArrowBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Social Proof Rating Card */}
      <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.ratingSection}>
        <LinearGradient
          colors={[colors.surface, colors.surfaceAlt]}
          style={[styles.ratingCard, { borderColor: colors.border }]}
        >
          <View style={styles.ratingContent}>
            {/* Left Laurel Accent */}
            <Award size={26} color="#F59E0B" />

            <View style={styles.ratingCenter}>
              <Text style={[styles.scoreBig, { color: colors.textPrimary }]}>
                4.9 <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '600' }}>/ 5.0</Text>
              </Text>

              {/* 5 Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={15} color="#F59E0B" fill="#F59E0B" />
                ))}
              </View>

              <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                {t('onboarding.socialProofRatingLabel', 'Calificación Promedio Play Store')}
              </Text>
            </View>

            {/* Right Laurel Accent */}
            <Award size={26} color="#F59E0B" style={{ transform: [{ scaleX: -1 }] }} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  highlightBadge: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  showcaseCard: {
    width: '100%',
    marginBottom: 16,
  },
  cardInner: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  personName: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  diffBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  diffText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  imageCardCol: {
    flex: 1,
    height: 160,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  modelImg: {
    width: '100%',
    height: '100%',
  },
  imgTagTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  imgTagTopText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  imgWeightBottom: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  imgWeightText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerDivider: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingSection: {
    width: '100%',
  },
  ratingCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  ratingCenter: {
    alignItems: 'center',
    gap: 4,
  },
  scoreBig: {
    fontSize: 24,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
