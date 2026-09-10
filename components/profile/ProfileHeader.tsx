import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ChevronLeft, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';
import { getNameStyle } from '../../utils/styles';
import { convertMass, convertLength } from '../../utils/units';
import type { UserProfile } from '../../store';
import type { BadgeInfo } from '../../hooks/useAchievements';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  currentBadge: BadgeInfo;
  safePremiumColor: string | null;
  isPremiumCustom: boolean;
  massUnit?: string;
  lengthUnit?: string;
  onAvatarPress: () => void;
  onNamePress: () => void;
  onBadgePress: () => void;
  onBackPress?: () => void;
}

export function ProfileHeader({
  profile, currentBadge, safePremiumColor, isPremiumCustom,
  massUnit = 'kg', lengthUnit = 'cm',
  onAvatarPress, onNamePress, onBadgePress, onBackPress,
}: ProfileHeaderProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const accentColor = isPremiumCustom && safePremiumColor ? safePremiumColor : colors.primary;

  // Cálculo de IMC (Índice de Masa Corporal)
  const bmiInfo = useMemo(() => {
    if (!profile?.weight || !profile?.height) return null;
    const heightM = profile.height / 100;
    if (heightM <= 0) return null;
    const val = Number((profile.weight / (heightM * heightM)).toFixed(1));
    let label = t('profile.bmiNormal', 'Saludable');
    let color = colors.success || '#10B981';
    if (val < 18.5) {
      label = t('profile.bmiLow', 'Bajo');
      color = '#38BDF8';
    } else if (val >= 25 && val < 30) {
      label = t('profile.bmiOverweight', 'Sobrepeso');
      color = '#F59E0B';
    } else if (val >= 30) {
      label = t('profile.bmiObese', 'Elevado');
      color = '#EF4444';
    }
    return { val, label, color };
  }, [profile?.weight, profile?.height, colors, t]);

  const displayWeight = profile?.weight
    ? `${convertMass(profile.weight, 'kg', massUnit as any).toFixed(1)} ${massUnit}`
    : '--';

  const displayHeight = profile?.height
    ? `${convertLength(profile.height, 'cm', lengthUnit as any).toFixed(0)} ${lengthUnit}`
    : '--';

  const goalText = useMemo(() => {
    if (!profile?.goal) return '--';
    const g = String(profile.goal);
    if (g === 'lose' || g === 'lose_weight') return t('profile.loseWeight', 'Perder Peso');
    if (g === 'gain' || g === 'gain_muscle') return t('profile.gainMuscle', 'Ganar Músculo');
    return t('profile.maintain', 'Mantenimiento');
  }, [profile?.goal, t]);

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={isPremiumCustom
          ? [(safePremiumColor ?? colors.primary) + '28', (safePremiumColor ?? colors.primary) + '08', 'transparent']
          : ['rgba(124, 92, 252, 0.18)', 'rgba(67, 56, 202, 0.05)', 'transparent']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Top Bar with Back Button if navigation exists */}
      <View style={styles.topBar}>
        {onBackPress ? (
          <TouchableOpacity
            onPress={onBackPress}
            style={[styles.topIconBtn, { backgroundColor: colors.surfaceAlt + '90', borderColor: colors.border + '50' }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={styles.topBadgeRow}>
          <TouchableOpacity
            onPress={onBadgePress}
            activeOpacity={0.8}
            style={[styles.badgePill, { borderColor: accentColor + '40', backgroundColor: colors.surface + 'B0' }]}
          >
            <LinearGradient
              colors={currentBadge.colors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeIconWrap}
            >
              <Text style={{ fontSize: 10 }}>{currentBadge.icon}</Text>
            </LinearGradient>
            <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>
              {currentBadge.label}
            </Text>
            <Sparkles size={11} color={accentColor} />
          </TouchableOpacity>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Avatar Section with Glowing Ring */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.85} style={styles.avatarTouch}>
          <LinearGradient
            colors={[accentColor, accentColor + '60', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGlowRing}
          >
            <View style={[styles.avatarInner, { backgroundColor: colors.surface }]}>
              {profile?.avatarUrl ? (
                <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[accentColor, accentColor + 'AA']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitial}>{profile?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>

          <View style={[styles.cameraBadge, { backgroundColor: accentColor, borderColor: colors.surface }]}>
            <Camera size={13} color="#FFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Name and Email */}
        <TouchableOpacity onPress={onNamePress} activeOpacity={0.7} style={styles.nameRow}>
          <Text
            style={[
              styles.nameText,
              { color: colors.textPrimary },
              getNameStyle(profile?.nameColor, profile?.id, profile?.id, profile?.nameColor)
            ]}
          >
            {profile?.name || t('profile.user', 'Usuario')}
          </Text>
          <View style={[styles.editIconBadge, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>✎</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.emailText, { color: colors.textMuted }]}>
          {profile?.email || ''}
        </Text>
      </View>

      {/* Quick Metrics Ribbon (Vital Stats) */}
      <View style={[styles.metricsRibbon, { backgroundColor: colors.surface + 'CC', borderColor: colors.border + '50' }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('profile.weight', 'Peso')}</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{displayWeight}</Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: colors.border + '60' }]} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('profile.height', 'Altura')}</Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{displayHeight}</Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: colors.border + '60' }]} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{t('onboarding.goal', 'Meta')}</Text>
          <Text style={[styles.metricValue, { color: accentColor }]} numberOfLines={1}>
            {goalText}
          </Text>
        </View>

        {bmiInfo && (
          <>
            <View style={[styles.metricDivider, { backgroundColor: colors.border + '60' }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>IMC</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.metricValue, { color: bmiInfo.color }]}>{bmiInfo.val}</Text>
                <View style={[styles.bmiDot, { backgroundColor: bmiInfo.color }]} />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    position: 'relative',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  topBadgeRow: {
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  avatarTouch: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarGlowRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  editIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  metricsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  bmiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
