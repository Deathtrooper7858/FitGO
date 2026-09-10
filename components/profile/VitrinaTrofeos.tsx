import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Trophy, Sparkles, ChevronRight, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';
import { getLucideIcon } from '../../constants/iconMap';

function getTierGrad(tier: string): [string, string] {
  switch (tier) {
    case 'diamante': return ['#38BDF8', '#6366F1'];
    case 'oro': return ['#F59E0B', '#EA580C'];
    case 'plata': return ['#94A3B8', '#64748B'];
    default: return ['#D97706', '#92400E'];
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'diamante': return '#38BDF8';
    case 'oro': return '#F59E0B';
    case 'plata': return '#94A3B8';
    default: return '#D97706';
  }
}

const VitrinaTrofeoItem = React.memo(function VitrinaTrofeoItem({
  id,
  achievements,
  colors,
  onPress,
}: {
  id: string;
  achievements: any[];
  colors: any;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const ach = React.useMemo(() => achievements.find((a: any) => a.id === id), [achievements, id]);
  if (!ach) return null;

  const tierColors = getTierGrad(ach.tier);
  const tierMainColor = getTierColor(ach.tier);
  const isHolo = ach.tier === 'oro' || ach.tier === 'diamante';

  const tierKeyMap: Record<string, string> = {
    oro: 'gold',
    plata: 'silver',
    diamante: 'diamond',
    bronce: 'bronze',
  };
  const tierTransKey = tierKeyMap[ach.tier] || 'bronze';

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.trophyCard,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: isHolo ? tierMainColor + '70' : colors.border + '60',
          borderWidth: isHolo ? 1.5 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={tierColors}
        style={styles.trophyIconGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {ach.iconType === 'lucide' && ach.lucideIcon ? (
          React.createElement(getLucideIcon(ach.lucideIcon), {
            size: 20,
            color: '#FFF',
            strokeWidth: 2.5,
          })
        ) : (
          <Text style={styles.trophyEmoji}>{ach.icon || '🏆'}</Text>
        )}
      </LinearGradient>

      <Text
        style={[styles.trophyTitle, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {String(t(`achievements.items.${ach.id}.title`, ach.title))}
      </Text>

      <View
        style={[
          styles.tierChip,
          {
            backgroundColor: tierMainColor + '18',
            borderColor: tierMainColor + '40',
          },
        ]}
      >
        <Text style={[styles.tierChipText, { color: tierMainColor }]}>
          {String(t(`achievements.tiers.${tierTransKey}`, ach.tier))}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

interface VitrinaTrofeosProps {
  pinnedAchievements?: string[];
  achievements: any[];
  onEdit: () => void;
  premiumColor?: string;
  isPro?: boolean;
}

export const VitrinaTrofeos = React.memo(function VitrinaTrofeos({
  pinnedAchievements,
  achievements,
  onEdit,
  premiumColor,
  isPro,
}: VitrinaTrofeosProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const safeColor =
    premiumColor === 'admin_glow'
      ? '#00F0FF'
      : premiumColor && premiumColor.startsWith('#')
      ? premiumColor
      : null;
  const isPremiumCustom = isPro && safeColor;
  const accentColor = isPremiumCustom && safeColor ? safeColor : colors.primary;

  const unlockedCount = React.useMemo(() => {
    return achievements.filter((a: any) => a.unlocked).length;
  }, [achievements]);

  const hasPins = pinnedAchievements && pinnedAchievements.length > 0;

  const handleEditPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onEdit();
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isPremiumCustom ? safeColor + '60' : colors.border + '60',
          backgroundColor: colors.surface,
        },
      ]}
    >
      <LinearGradient
        colors={
          isPremiumCustom
            ? [safeColor + '18', safeColor + '04', 'transparent']
            : ['rgba(245, 158, 11, 0.08)', 'transparent']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <View style={styles.innerWrapper}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.headerIconGrad}
            >
              <Trophy size={15} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {t('achievements.trophyShowcase', 'Vitrina de Trofeos')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {unlockedCount} / {achievements.length}{' '}
                {t('dashboard.achievementsUnlocked', 'logros conseguidos')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleEditPress}
            style={[
              styles.editBtn,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border + '60',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.editBtnText, { color: accentColor }]}>
              {hasPins ? t('common.edit', 'Editar') : t('achievements.showcase', 'Ver todos')}
            </Text>
            <ChevronRight size={12} color={accentColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {hasPins ? (
          <View style={styles.trophyRow}>
            {pinnedAchievements.map((id) => (
              <VitrinaTrofeoItem
                key={id}
                id={id}
                achievements={achievements}
                colors={colors}
                onPress={handleEditPress}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleEditPress}
            activeOpacity={0.75}
            style={[
              styles.emptyPrompt,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border + '70',
              },
            ]}
          >
            <View style={styles.emptyLeft}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
                style={styles.emptyIconCircle}
              >
                <Sparkles size={16} color="#F59E0B" />
              </LinearGradient>
              <View style={styles.emptyTextCol}>
                <Text
                  style={[styles.emptyPromptTitle, { color: colors.textPrimary }]}
                >
                  {t('achievements.pinPromptTitle', 'Destaca tus logros')}
                </Text>
                <Text
                  style={[styles.emptyPromptDesc, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {t('achievements.pinPrompt', 'Ancla tus mejores trofeos para lucirlos aquí')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.addBadge,
                { backgroundColor: accentColor + '20', borderColor: accentColor + '50' },
              ]}
            >
              <Plus size={14} color={accentColor} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  innerWrapper: {
    padding: Spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconGrad: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trophyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  trophyCard: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  trophyIconGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trophyEmoji: {
    fontSize: 20,
  },
  trophyTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  tierChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierChipText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  emptyIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyPromptTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  emptyPromptDesc: {
    fontSize: 11,
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
