import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Sparkles, BookOpen, ChevronRight, X, ChevronDown, ChevronUp, Camera, Flame, Bot } from 'lucide-react-native';
import { Radius } from '../../constants';

interface AppGuideBannerProps {
  dayNumber: number;
  totalDays?: number;
  onOpenGuide: () => void;
  onDismiss?: () => void;
  colors: any;
  t: any;
}

export const AppGuideBanner = React.memo(function AppGuideBanner({
  dayNumber,
  totalDays = 60,
  onOpenGuide,
  onDismiss,
  colors,
  t,
}: AppGuideBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOpen = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onOpenGuide();
  };

  const handleToggleExpand = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onDismiss) onDismiss();
  };

  // ─── Compact / Non-invasive Collapsed State (Default) ────────────────────
  if (!isExpanded) {
    return (
      <View style={styles.compactContainer}>
        <LinearGradient
          colors={[colors.primary + '18', '#06B6D4' + '12', colors.surfaceAlt + '45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.compactCard, { borderColor: colors.primary + '35' }]}
        >
          {/* Glowing top line accent */}
          <LinearGradient
            colors={[colors.primary, '#06B6D4', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topStripe}
          />

          <TouchableOpacity
            style={styles.compactTouchArea}
            onPress={handleToggleExpand}
            activeOpacity={0.78}
          >
            {/* Left Icon Badge */}
            <View style={[styles.compactIconWrap, { backgroundColor: colors.primary + '25', borderColor: colors.primary + '45' }]}>
              <BookOpen size={16} color={colors.primary} />
            </View>

            {/* Central Information */}
            <View style={styles.compactInfo}>
              <View style={styles.compactTitleRow}>
                <Text style={[styles.compactTitle, { color: colors.textPrimary }]}>
                  {t('guide.badgeTitle', 'Instructivo FitGo')}
                </Text>
                <View style={[styles.compactDayPill, { backgroundColor: '#06B6D4' + '20', borderColor: '#06B6D4' + '45' }]}>
                  <Text style={[styles.compactDayText, { color: '#06B6D4' }]}>
                    {t('guide.dayCount', `Día {{day}} de {{total}}`, { day: Math.min(dayNumber, totalDays), total: totalDays })}
                  </Text>
                </View>
              </View>
              <Text style={[styles.compactSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('guide.bannerCompactSubtitle', 'Aprende a escanear comidas con IA, macros y coach')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right Action Buttons */}
          <View style={styles.compactRightActions}>
            <TouchableOpacity
              onPress={handleToggleExpand}
              style={[styles.expandToggleBtn, { backgroundColor: colors.surfaceAlt + '70' }]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel={t('guide.expand', 'Desplegar instructivo')}
            >
              <ChevronDown size={16} color={colors.primary} />
            </TouchableOpacity>

            {onDismiss && (
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                accessibilityLabel={t('common.close', 'Cerrar')}
              >
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ─── Expanded State (Desplegado con detalles concisos) ─────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary + '22', '#06B6D4' + '15', colors.surfaceAlt + '50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.primary + '45' }]}
      >
        {/* Glowing top line accent */}
        <LinearGradient
          colors={[colors.primary, '#06B6D4', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topStripe}
        />

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.tagPill, { backgroundColor: colors.primary + '25', borderColor: colors.primary + '50' }]}>
              <Sparkles size={11} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {t('guide.badgeTitle', 'INSTRUCTIVO FITGO')}
              </Text>
            </View>
            <View style={[styles.dayPill, { backgroundColor: '#06B6D4' + '20', borderColor: '#06B6D4' + '45' }]}>
              <Text style={[styles.dayPillText, { color: '#06B6D4' }]}>
                {t('guide.dayCounter', `Día {{day}} de {{total}}`, { day: Math.min(dayNumber, totalDays), total: totalDays })}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleToggleExpand}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceAlt + '60' }]}
              accessibilityLabel={t('guide.minimize', 'Minimizar')}
            >
              <ChevronUp size={16} color={colors.primary} />
            </TouchableOpacity>
            {onDismiss && (
              <TouchableOpacity
                onPress={handleDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerIconBtn}
                accessibilityLabel={t('common.close', 'Cerrar')}
              >
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('guide.bannerTitle', '¿Cómo sacarle el máximo provecho a FitGo? 🚀')}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('guide.bannerSubtitle', 'Aprende qué hace cada botón, cómo escanear tus comidas con IA, entender tus macros y moverte por la app con total facilidad.')}
        </Text>

        {/* Features preview pills */}
        <View style={styles.featuresRow}>
          <View style={[styles.featureChip, { backgroundColor: colors.surface + '85', borderColor: colors.border + '30' }]}>
            <Camera size={13} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>
              {t('guide.featureScan', 'Escáner con IA')}
            </Text>
          </View>
          <View style={[styles.featureChip, { backgroundColor: colors.surface + '85', borderColor: colors.border + '30' }]}>
            <Flame size={13} color="#FF6B00" />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>
              {t('guide.featureMacros', 'Anillo y Macros')}
            </Text>
          </View>
          <View style={[styles.featureChip, { backgroundColor: colors.surface + '85', borderColor: colors.border + '30' }]}>
            <Bot size={13} color="#06B6D4" />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>
              {t('guide.featureCoach', 'Coach Inteligente')}
            </Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.expandedBottomRow}>
          <TouchableOpacity
            onPress={handleOpen}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={[colors.primary, '#7C3AED', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <BookOpen size={15} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {t('guide.ctaButton', 'Abrir Instructivo Detallado')}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleExpand}
            style={styles.collapseTextBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.collapseText, { color: colors.textMuted }]}>
              {t('guide.collapse', 'Plegar')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  // Compact / Non-invasive Collapsed
  compactContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  compactCard: {
    borderRadius: Radius.md || 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  compactTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 6,
  },
  compactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  compactDayPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  compactDayText: {
    fontSize: 9,
    fontWeight: '700',
  },
  compactSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
  },
  compactRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 3,
  },

  // Expanded State
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    borderRadius: Radius.lg || 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ctaWrapper: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  collapseTextBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  collapseText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

