import React, { useMemo, useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Info,
  Search,
  X,
  Pin,
  PinOff,
  Trophy,
  Sparkles,
  Award,
  Plus,
  Crown,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import {
  useAchievements,
  Achievement,
  ALL_BADGES,
  TIER_POINTS,
  BadgeInfo,
} from '../../hooks/useAchievements';
import { getLucideIcon } from '../../constants/iconMap';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { GlobalBackground } from '../../components/GlobalBackground';

// ── Configuración de Categorías ────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; name: string; gradient: [string, string] }> = {
  'General':    { icon: '⭐', name: 'General', gradient: ['#F59E0B', '#D97706'] },
  'Constancia': { icon: '🔥', name: 'Constancia', gradient: ['#EF4444', '#B91C1C'] },
  'Nutrición':  { icon: '🥗', name: 'Nutrición', gradient: ['#10B981', '#047857'] },
  'Nutricion':  { icon: '🥗', name: 'Nutrición', gradient: ['#10B981', '#047857'] },
  'Físico':     { icon: '📐', name: 'Físico', gradient: ['#3B82F6', '#1D4ED8'] },
  'Fisico':     { icon: '📐', name: 'Físico', gradient: ['#3B82F6', '#1D4ED8'] },
  'Actividad':  { icon: '👟', name: 'Actividad', gradient: ['#06B6D4', '#0E7490'] },
  'Descanso':   { icon: '🌙', name: 'Descanso', gradient: ['#6366F1', '#4338CA'] },
  'Comunidad':  { icon: '🌟', name: 'Comunidad', gradient: ['#EC4899', '#BE185D'] },
  'Misterio':   { icon: '🔮', name: 'Misterio', gradient: ['#A855F7', '#6B21A8'] },
  'Especial':   { icon: '💎', name: 'Especial', gradient: ['#8B5CF6', '#5B21B6'] },
};

export function getTierData(tier: string) {
  switch (tier) {
    case 'diamante':
      return {
        label: 'Diamante',
        icon: '💎',
        colors: ['#38BDF8', '#6366F1'] as [string, string],
        accent: '#38BDF8',
        glow: '#38BDF850',
        bg: '#38BDF815',
        points: TIER_POINTS.diamante,
      };
    case 'oro':
      return {
        label: 'Oro',
        icon: '🥇',
        colors: ['#F59E0B', '#EA580C'] as [string, string],
        accent: '#F59E0B',
        glow: '#F59E0B50',
        bg: '#F59E0B15',
        points: TIER_POINTS.oro,
      };
    case 'plata':
      return {
        label: 'Plata',
        icon: '🥈',
        colors: ['#94A3B8', '#475569'] as [string, string],
        accent: '#94A3B8',
        glow: '#94A3B840',
        bg: '#94A3B815',
        points: TIER_POINTS.plata,
      };
    case 'bronce':
    default:
      return {
        label: 'Bronce',
        icon: '🥉',
        colors: ['#D97706', '#92400E'] as [string, string],
        accent: '#D97706',
        glow: '#D9770640',
        bg: '#D9770615',
        points: TIER_POINTS.bronce,
      };
  }
}

// ── Tarjeta de Insignia ────────────────────────────────────────────────────────
const BadgeCard = memo(({
  badge,
  owned,
  onPress,
}: {
  badge: BadgeInfo;
  owned: boolean;
  onPress: () => void;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        bs.badgeCard,
        {
          backgroundColor: colors.surface,
          borderColor: owned ? badge.colors[0] + '80' : colors.border + '40',
        },
        !owned && { opacity: 0.5 },
      ]}
    >
      <LinearGradient
        colors={owned ? badge.colors : [colors.surfaceAlt, colors.surfaceAlt]}
        style={bs.badgeIconWrap}
      >
        <Text style={{ fontSize: 24 }}>{badge.icon}</Text>
        {!owned && (
          <View style={bs.badgeLockOverlay}>
            <Lock size={10} color="#FFF" />
          </View>
        )}
      </LinearGradient>
      <Text
        style={[bs.badgeLabel, { color: owned ? colors.textPrimary : colors.textMuted }]}
        numberOfLines={2}
      >
        {t(`achievements.badges.${badge.id}.label`, badge.label)}
      </Text>
    </TouchableOpacity>
  );
});
BadgeCard.displayName = 'BadgeCard';

// ── Tarjeta de Logro (Grid Item) ───────────────────────────────────────────────
const AchievementCard = memo(({
  achievement,
  isPinned,
  onPress,
  onTogglePin,
}: {
  achievement: Achievement;
  isPinned: boolean;
  onPress: () => void;
  onTogglePin: () => void;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const tier = getTierData(achievement.tier);
  const isUnlocked = achievement.unlocked;

  // Icon component lookup
  const LucideComp = achievement.lucideIcon ? getLucideIcon(achievement.lucideIcon) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        s.cardContainer,
        {
          backgroundColor: isUnlocked ? colors.surface : colors.surface + 'B0',
          borderColor: isPinned
            ? '#F59E0B'
            : isUnlocked
            ? tier.accent + '45'
            : colors.border + '35',
        },
        isPinned && {
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        },
      ]}
    >
      {/* Sombra de fondo para logros desbloqueados */}
      {isUnlocked && (
        <LinearGradient
          colors={[tier.accent + '15', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Header de la tarjeta: Tier badge + Pin button */}
      <View style={s.cardTopRow}>
        <View style={[s.tierPill, { backgroundColor: tier.bg, borderColor: tier.accent + '35' }]}>
          <Text style={[s.tierPillText, { color: tier.accent }]}>
            +{tier.points} pts
          </Text>
        </View>

        {isUnlocked && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              s.pinActionBtn,
              {
                backgroundColor: isPinned ? '#F59E0B25' : colors.surfaceAlt,
                borderColor: isPinned ? '#F59E0B' : colors.border + '50',
              },
            ]}
          >
            {isPinned ? (
              <Pin size={12} color="#F59E0B" fill="#F59E0B" />
            ) : (
              <Pin size={12} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Emblema central */}
      <View style={s.iconWrapper}>
        <LinearGradient
          colors={isUnlocked ? tier.colors : [colors.surfaceAlt, colors.surfaceAlt]}
          style={[s.iconHex, !isUnlocked && { opacity: 0.55 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {LucideComp ? (
            <LucideComp size={24} color={isUnlocked ? '#FFF' : colors.textMuted} strokeWidth={2.2} />
          ) : (
            <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
          )}
        </LinearGradient>

        {!isUnlocked && (
          <View style={[s.lockFloatingBadge, { backgroundColor: colors.surface }]}>
            <Lock size={11} color={colors.textMuted} />
          </View>
        )}
        {isUnlocked && (
          <View style={[s.checkFloatingBadge, { backgroundColor: tier.accent }]}>
            <CheckCircle2 size={11} color="#FFF" />
          </View>
        )}
      </View>

      {/* Textos */}
      <Text
        style={[
          s.cardTitle,
          { color: isUnlocked ? colors.textPrimary : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {t(`achievements.items.${achievement.id}.title`, achievement.title)}
      </Text>

      <Text
        style={[s.cardDesc, { color: colors.textMuted }]}
        numberOfLines={2}
      >
        {t(`achievements.items.${achievement.id}.description`, achievement.description)}
      </Text>

      {/* Recompensa especial si existe */}
      {achievement.rewardBadgeId && ALL_BADGES[achievement.rewardBadgeId] && (
        <View
          style={[
            s.rewardMiniPill,
            {
              backgroundColor: isUnlocked ? tier.accent + '15' : colors.surfaceAlt,
              borderColor: isUnlocked ? tier.accent + '35' : colors.border + '30',
            },
          ]}
        >
          <Text style={{ fontSize: 10 }}>{ALL_BADGES[achievement.rewardBadgeId].icon}</Text>
          <Text
            style={[
              s.rewardMiniText,
              { color: isUnlocked ? tier.accent : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {t(
              `achievements.badges.${achievement.rewardBadgeId}.label`,
              ALL_BADGES[achievement.rewardBadgeId].label
            )}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});
AchievementCard.displayName = 'AchievementCard';

// ── Acordeón de Categoría ──────────────────────────────────────────────────────
const CategoryAccordion = memo(({
  category,
  items,
  pinnedIds,
  onTogglePin,
  onSelectAchievement,
  defaultOpen = false,
}: {
  category: string;
  items: Achievement[];
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  onSelectAchievement: (achievement: Achievement) => void;
  defaultOpen?: boolean;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const cfg = CAT_CONFIG[category] || {
    icon: '🏅',
    name: category,
    gradient: ['#7C5CFC', '#4338CA'] as [string, string],
  };

  const unlockedCount = items.filter((i) => i.unlocked).length;
  const pct = items.length > 0 ? (unlockedCount / items.length) * 100 : 0;
  const isComplete = unlockedCount === items.length && items.length > 0;

  return (
    <View
      style={[
        s.catContainer,
        {
          backgroundColor: colors.surface,
          borderColor: open ? cfg.gradient[0] + '50' : colors.border + '45',
        },
      ]}
    >
      <TouchableOpacity
        style={s.catHeaderRow}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
      >
        {/* Icono de categoría */}
        <LinearGradient colors={cfg.gradient} style={s.catIconBox}>
          <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
        </LinearGradient>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.catTitleText, { color: colors.textPrimary }]}>
              {t(`achievements.categories.${category}`, category)}
            </Text>
            {isComplete && (
              <View style={s.completeBadge}>
                <Sparkles size={10} color="#F59E0B" />
                <Text style={s.completeBadgeText}>100%</Text>
              </View>
            )}
          </View>
          <Text style={[s.catSubText, { color: colors.textSecondary }]}>
            {String(t('achievements.completedOfTotal', '{{unlocked}} de {{total}} completados ({{pct}}%)', { unlocked: unlockedCount, total: items.length, pct: Math.round(pct) }))}
          </Text>
        </View>

        {/* Badge contador */}
        {unlockedCount > 0 && (
          <View
            style={[
              s.catCountBadge,
              { backgroundColor: cfg.gradient[0] + '20', borderColor: cfg.gradient[0] + '40' },
            ]}
          >
            <Text style={[s.catCountBadgeText, { color: cfg.gradient[0] }]}>
              {unlockedCount}
            </Text>
          </View>
        )}

        {/* Chevron */}
        <View style={[s.chevronBox, { backgroundColor: colors.surfaceAlt }]}>
          {open ? (
            <ChevronUp size={16} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Barra de progreso de la categoría */}
      <View style={[s.catProgressTrack, { backgroundColor: colors.surfaceAlt }]}>
        <LinearGradient
          colors={cfg.gradient}
          style={[s.catProgressBar, { width: `${pct}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      {/* Grid de logros al expandir */}
      {open && (
        <View style={s.catGrid}>
          {items.map((item) => (
            <AchievementCard
              key={item.id}
              achievement={item}
              isPinned={pinnedIds.includes(item.id)}
              onPress={() => onSelectAchievement(item)}
              onTogglePin={() => item.unlocked && onTogglePin(item.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
});
CategoryAccordion.displayName = 'CategoryAccordion';

// ── Vitrina Interactiva de 3 Slots (Showcase) ──────────────────────────────────
const TrophyShowcaseBar = memo(({
  pinnedAchievements,
  achievements,
  onSelectSlot,
  onUnpinSlot,
}: {
  pinnedAchievements: string[];
  achievements: Achievement[];
  onSelectSlot: (ach: Achievement) => void;
  onUnpinSlot: (id: string) => void;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[s.showcaseCard, { backgroundColor: colors.surface, borderColor: colors.border + '60' }]}>
      <View style={s.showcaseHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={[s.showcaseTitle, { color: colors.textPrimary }]}>
            {t('achievements.showcaseTitle', 'Vitrina del Perfil')}
          </Text>
        </View>
        <Text style={[s.showcaseSlotsCount, { color: colors.textMuted }]}>
          {String(t('achievements.pinnedCount', '{{count}}/3 fijados', { count: pinnedAchievements.length }))}
        </Text>
      </View>

      <View style={s.showcaseSlotsRow}>
        {[0, 1, 2].map((index) => {
          const pinId = pinnedAchievements[index];
          const ach = pinId ? achievements.find((a) => a.id === pinId) : null;

          if (ach) {
            const tier = getTierData(ach.tier);
            const LucideComp = ach.lucideIcon ? getLucideIcon(ach.lucideIcon) : null;

            return (
              <TouchableOpacity
                key={`slot-${index}-${ach.id}`}
                activeOpacity={0.8}
                onPress={() => onSelectSlot(ach)}
                style={[
                  s.showcaseSlotItem,
                  {
                    backgroundColor: tier.bg,
                    borderColor: tier.accent + '70',
                  },
                ]}
              >
                {/* Botón rápido para desfijar */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onUnpinSlot(ach.id);
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={[s.slotUnpinBtn, { backgroundColor: colors.surface }]}
                >
                  <X size={10} color={colors.textSecondary} />
                </TouchableOpacity>

                <LinearGradient colors={tier.colors} style={s.slotIconHex}>
                  {LucideComp ? (
                    <LucideComp size={18} color="#FFF" />
                  ) : (
                    <Text style={{ fontSize: 16 }}>{ach.icon}</Text>
                  )}
                </LinearGradient>

                <Text
                  style={[s.slotTitleText, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {t(`achievements.items.${ach.id}.title`, ach.title)}
                </Text>
                <Text style={[s.slotTierText, { color: tier.accent }]}>
                  {tier.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <View
              key={`empty-slot-${index}`}
              style={[
                s.showcaseSlotEmpty,
                {
                  backgroundColor: colors.surfaceAlt + '40',
                  borderColor: colors.border + '60',
                },
              ]}
            >
              <View style={[s.emptySlotPlus, { backgroundColor: colors.surfaceAlt }]}>
                <Plus size={14} color={colors.textMuted} />
              </View>
              <Text style={[s.emptySlotLabel, { color: colors.textMuted }]}>
                Slot {index + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});
TrophyShowcaseBar.displayName = 'TrophyShowcaseBar';

// ── Modal de Detalle de Logro ───────────────────────────────────────────────────
const AchievementDetailModal = memo(({
  achievement,
  isPinned,
  visible,
  onClose,
  onTogglePin,
}: {
  achievement: Achievement | null;
  isPinned: boolean;
  visible: boolean;
  onClose: () => void;
  onTogglePin: () => void;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();

  if (!achievement) return null;

  const tier = getTierData(achievement.tier);
  const LucideComp = achievement.lucideIcon ? getLucideIcon(achievement.lucideIcon) : null;
  const isUnlocked = achievement.unlocked;
  const rewardBadge = achievement.rewardBadgeId ? ALL_BADGES[achievement.rewardBadgeId] : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            s.detailModalCard,
            {
              backgroundColor: colors.surface,
              borderColor: isUnlocked ? tier.accent + '60' : colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Fondo con resplandor */}
          {isUnlocked && (
            <LinearGradient
              colors={[tier.accent + '25', 'transparent']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}

          {/* Botón cerrar */}
          <TouchableOpacity
            onPress={onClose}
            style={[s.detailCloseBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Gran Emblema */}
          <View style={s.detailEmblemWrap}>
            <LinearGradient
              colors={isUnlocked ? tier.colors : [colors.surfaceAlt, colors.surfaceAlt]}
              style={[s.detailEmblem, !isUnlocked && { opacity: 0.6 }]}
            >
              {LucideComp ? (
                <LucideComp size={42} color={isUnlocked ? '#FFF' : colors.textMuted} strokeWidth={2.2} />
              ) : (
                <Text style={{ fontSize: 42 }}>{achievement.icon}</Text>
              )}
            </LinearGradient>
            <View
              style={[
                s.detailBadgeFloating,
                { backgroundColor: isUnlocked ? tier.accent : colors.surfaceAlt },
              ]}
            >
              {isUnlocked ? (
                <CheckCircle2 size={14} color="#FFF" />
              ) : (
                <Lock size={14} color={colors.textMuted} />
              )}
            </View>
          </View>

          {/* Tier y Puntos */}
          <View style={[s.detailTierBadge, { backgroundColor: tier.bg, borderColor: tier.accent + '40' }]}>
            <Text style={{ fontSize: 13 }}>{tier.icon}</Text>
            <Text style={[s.detailTierText, { color: tier.accent }]}>
              {tier.label.toUpperCase()} • +{tier.points} PTS
            </Text>
          </View>

          {/* Título y Categoría */}
          <Text style={[s.detailTitle, { color: colors.textPrimary }]}>
            {t(`achievements.items.${achievement.id}.title`, achievement.title)}
          </Text>

          <View style={s.detailCategoryRow}>
            <Text style={{ fontSize: 12 }}>
              {CAT_CONFIG[achievement.category]?.icon || '🏅'}
            </Text>
            <Text style={[s.detailCategoryText, { color: colors.textSecondary }]}>
              {t(`achievements.categories.${achievement.category}`, achievement.category)}
            </Text>
          </View>

          {/* Descripción */}
          <Text style={[s.detailDescription, { color: colors.textSecondary }]}>
            {t(`achievements.items.${achievement.id}.description`, achievement.description)}
          </Text>

          {/* Recompensa de Insignia si aplica */}
          {rewardBadge && (
            <View
              style={[
                s.detailRewardBox,
                {
                  backgroundColor: colors.surfaceAlt + '60',
                  borderColor: isUnlocked ? tier.accent + '40' : colors.border + '50',
                },
              ]}
            >
              <View style={s.detailRewardLeft}>
                <LinearGradient colors={rewardBadge.colors} style={s.detailRewardIcon}>
                  <Text style={{ fontSize: 20 }}>{rewardBadge.icon}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.detailRewardHeader, { color: colors.textMuted }]}>
                    {t('achievements.rewardBadge', 'Recompensa desbloqueable:')}
                  </Text>
                  <Text style={[s.detailRewardName, { color: colors.textPrimary }]}>
                    {t(`achievements.badges.${rewardBadge.id}.label`, rewardBadge.label)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Estado de completado */}
          <View
            style={[
              s.detailStatusBanner,
              {
                backgroundColor: isUnlocked ? '#10B98115' : colors.surfaceAlt + '40',
                borderColor: isUnlocked ? '#10B98140' : colors.border + '40',
              },
            ]}
          >
            {isUnlocked ? (
              <>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={[s.detailStatusText, { color: '#10B981' }]}>
                  {t('achievements.unlockedSuccess', '¡Logro desbloqueado y sumado a tu ranking!')}
                </Text>
              </>
            ) : (
              <>
                <Lock size={16} color={colors.textMuted} />
                <Text style={[s.detailStatusText, { color: colors.textMuted }]}>
                  {t('achievements.lockedHint', 'Completa el objetivo para desbloquear este logro.')}
                </Text>
              </>
            )}
          </View>

          {/* Botón de acción */}
          {isUnlocked ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onTogglePin();
                onClose();
              }}
              style={[
                s.detailActionButton,
                {
                  backgroundColor: isPinned ? colors.surfaceAlt : colors.primary,
                  borderColor: isPinned ? colors.border : colors.primary,
                },
              ]}
            >
              {isPinned ? (
                <>
                  <PinOff size={16} color={colors.textPrimary} />
                  <Text style={[s.detailActionText, { color: colors.textPrimary }]}>
                    {t('achievements.unpinFromProfile', 'Desfijar de la Vitrina')}
                  </Text>
                </>
              ) : (
                <>
                  <Pin size={16} color="#FFF" />
                  <Text style={[s.detailActionText, { color: '#FFF' }]}>
                    {t('achievements.pinToProfile', 'Fijar en la Vitrina del Perfil')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[s.detailActionButton, { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={[s.detailActionText, { color: colors.textPrimary }]}>
                {t('common.close', 'Cerrar')}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
});
AchievementDetailModal.displayName = 'AchievementDetailModal';

// ── Modal de Detalle de Insignia ────────────────────────────────────────────────
const BadgeDetailModal = memo(({
  badge,
  owned,
  visible,
  onClose,
}: {
  badge: BadgeInfo | null;
  owned: boolean;
  visible: boolean;
  onClose: () => void;
}) => {
  const colors = useTheme();
  const { t } = useTranslation();

  if (!badge) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[s.detailModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[s.detailCloseBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={s.detailEmblemWrap}>
            <LinearGradient
              colors={owned ? badge.colors : [colors.surfaceAlt, colors.surfaceAlt]}
              style={[s.detailEmblem, !owned && { opacity: 0.6 }]}
            >
              <Text style={{ fontSize: 44 }}>{badge.icon}</Text>
            </LinearGradient>
            <View
              style={[
                s.detailBadgeFloating,
                { backgroundColor: owned ? badge.colors[0] : colors.surfaceAlt },
              ]}
            >
              {owned ? <CheckCircle2 size={14} color="#FFF" /> : <Lock size={14} color={colors.textMuted} />}
            </View>
          </View>

          <Text style={[s.detailTitle, { color: colors.textPrimary, marginTop: 12 }]}>
            {t(`achievements.badges.${badge.id}.label`, badge.label)}
          </Text>

          <Text style={[s.detailDescription, { color: colors.textSecondary, marginTop: 8 }]}>
            {t(`achievements.badges.${badge.id}.description`, badge.description)}
          </Text>

          <View
            style={[
              s.detailStatusBanner,
              {
                backgroundColor: owned ? '#10B98115' : colors.surfaceAlt + '40',
                borderColor: owned ? '#10B98140' : colors.border + '40',
                marginTop: 20,
              },
            ]}
          >
            {owned ? (
              <>
                <Award size={16} color="#10B981" />
                <Text style={[s.detailStatusText, { color: '#10B981' }]}>
                  {t('achievements.badgeOwned', '¡Insignia obtenida y visible en tu perfil!')}
                </Text>
              </>
            ) : (
              <>
                <Lock size={16} color={colors.textMuted} />
                <Text style={[s.detailStatusText, { color: colors.textMuted }]}>
                  {t('achievements.badgeLocked', 'Desbloquea el logro asociado para conseguir esta medalla.')}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={[s.detailActionButton, { backgroundColor: colors.surfaceAlt, marginTop: 16 }]}
          >
            <Text style={[s.detailActionText, { color: colors.textPrimary }]}>
              {t('common.understood', 'Entendido')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
});
BadgeDetailModal.displayName = 'BadgeDetailModal';

// ── PANTALLA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AchievementsModal() {
  const router = useRouter();
  const colors = useTheme();
  const { t } = useTranslation();
  const { achievements, unlockedCount, unlockedPoints, totalPoints } = useAchievements();
  const { profile, setProfile } = useAuthStore();

  // Estados de vista y filtros
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges'>('achievements');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'diamante' | 'oro' | 'plata' | 'bronce'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modales
  const [showInfo, setShowInfo] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

  // Pin / Unpin callback
  const handleTogglePin = useCallback(
    async (id: string) => {
      if (!profile) return;
      const current = profile.pinnedAchievements || [];
      let newPinned = [...current];
      if (newPinned.includes(id)) {
        newPinned = newPinned.filter((a) => a !== id);
      } else {
        if (newPinned.length >= 3) newPinned.shift();
        newPinned.push(id);
      }
      setProfile({ ...profile, pinnedAchievements: newPinned });
      await supabase.from('users').update({ pinned_achievements: newPinned }).eq('id', profile.id);
    },
    [profile, setProfile]
  );

  const pinnedIds = profile?.pinnedAchievements || [];

  // Badges obtenidos
  const ownedBadgeIds = useMemo(() => {
    const ids: string[] = [];
    if (profile?.role) ids.push(profile.role);
    if (profile?.badges) ids.push(...profile.badges);
    achievements.forEach((a) => {
      if (a.unlocked && a.rewardBadgeId) ids.push(a.rewardBadgeId);
    });
    return [...new Set(ids)];
  }, [profile, achievements]);

  // Lista de badges
  const allBadgesList = useMemo(() => Object.values(ALL_BADGES), []);
  const ownedBadgesCount = useMemo(
    () => allBadgesList.filter((b) => ownedBadgeIds.includes(b.id)).length,
    [allBadgesList, ownedBadgeIds]
  );

  // Categorías presentes
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    achievements.forEach((a) => cats.add(a.category));
    return Array.from(cats);
  }, [achievements]);

  // Filtrado de logros reactivo
  const filteredAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      // Búsqueda por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (ach.title || '').toLowerCase().includes(q);
        const descMatch = (ach.description || '').toLowerCase().includes(q);
        const catMatch = (ach.category || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      // Filtro por Estado
      if (statusFilter === 'unlocked' && !ach.unlocked) return false;
      if (statusFilter === 'locked' && ach.unlocked) return false;

      // Filtro por Tier
      if (tierFilter !== 'all' && ach.tier !== tierFilter) return false;

      // Filtro por Categoría
      if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;

      return true;
    });
  }, [achievements, searchQuery, statusFilter, tierFilter, selectedCategory]);

  // Agrupación por categoría para la vista de acordeones
  const groupedAchievements = useMemo(() => {
    return Object.entries(
      filteredAchievements.reduce((acc, ach) => {
        if (!acc[ach.category]) acc[ach.category] = [];
        acc[ach.category].push(ach);
        return acc;
      }, {} as Record<string, Achievement[]>)
    );
  }, [filteredAchievements]);

  // Porcentaje global
  const progressPct =
    achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0;

  const isFiltering =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    tierFilter !== 'all' ||
    selectedCategory !== 'all';

  return (
    <View style={s.container}>
      <GlobalBackground />

      {/* Halo superior */}
      <LinearGradient
        colors={[colors.primary + '30', colors.primary + '08', 'transparent']}
        style={s.topAmbientGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        {/* Header de navegación */}
        <View style={[s.header, { borderBottomColor: colors.border + '40' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft color={colors.textPrimary} size={20} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
              {t('achievements.title', 'Tus Logros')}
            </Text>
            <Text style={[s.headerSubtitle, { color: colors.textMuted }]}>
              {String(t('achievements.ptsAccumulated', '{{points}} pts acumulados', { points: unlockedPoints }))}
            </Text>
          </View>

          <View style={s.headerRight}>
            <TouchableOpacity
              onPress={() => setShowInfo(true)}
              style={[s.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Info color={colors.textPrimary} size={18} />
            </TouchableOpacity>

            <View style={[s.pointsBadge, { backgroundColor: colors.primary }]}>
              <Sparkles size={11} color="#FFF" />
              <Text style={s.pointsBadgeText}>{unlockedCount}</Text>
            </View>
          </View>
        </View>

        {/* Info Modal */}
        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <Pressable style={s.modalBackdrop} onPress={() => setShowInfo(false)}>
            <Pressable
              style={[s.infoModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[s.infoModalTitle, { color: colors.textPrimary }]}>
                {t('achievements.systemTitle', 'Sistema de Logros & Puntos')}
              </Text>
              <Text style={[s.infoModalDesc, { color: colors.textSecondary }]}>
                {t(
                  'achievements.systemDesc',
                  'Cada logro desbloqueado suma puntos permanentes a tu ranking y nivel de perfil según su categoría de rareza.'
                )}
              </Text>

              <View style={s.infoTierList}>
                <View style={[s.infoTierRow, { backgroundColor: colors.surfaceAlt + '60' }]}>
                  <LinearGradient colors={getTierData('bronce').colors} style={s.infoTierDot} />
                  <Text style={[s.infoTierLabel, { color: colors.textPrimary }]}>
                    {t('achievements.tiers.bronze', 'Bronce')}
                  </Text>
                  <Text style={[s.infoTierPoints, { color: getTierData('bronce').accent }]}>
                    +{TIER_POINTS.bronce} pts
                  </Text>
                </View>

                <View style={[s.infoTierRow, { backgroundColor: colors.surfaceAlt + '60' }]}>
                  <LinearGradient colors={getTierData('plata').colors} style={s.infoTierDot} />
                  <Text style={[s.infoTierLabel, { color: colors.textPrimary }]}>
                    {t('achievements.tiers.silver', 'Plata')}
                  </Text>
                  <Text style={[s.infoTierPoints, { color: getTierData('plata').accent }]}>
                    +{TIER_POINTS.plata} pts
                  </Text>
                </View>

                <View style={[s.infoTierRow, { backgroundColor: colors.surfaceAlt + '60' }]}>
                  <LinearGradient colors={getTierData('oro').colors} style={s.infoTierDot} />
                  <Text style={[s.infoTierLabel, { color: colors.textPrimary }]}>
                    {t('achievements.tiers.gold', 'Oro')}
                  </Text>
                  <Text style={[s.infoTierPoints, { color: getTierData('oro').accent }]}>
                    +{TIER_POINTS.oro} pts
                  </Text>
                </View>

                <View style={[s.infoTierRow, { backgroundColor: colors.surfaceAlt + '60' }]}>
                  <LinearGradient colors={getTierData('diamante').colors} style={s.infoTierDot} />
                  <Text style={[s.infoTierLabel, { color: colors.textPrimary }]}>
                    {t('achievements.tiers.diamond', 'Diamante')}
                  </Text>
                  <Text style={[s.infoTierPoints, { color: getTierData('diamante').accent }]}>
                    +{TIER_POINTS.diamante} pts
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowInfo(false)}
                style={[s.infoCloseBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={s.infoCloseText}>
                  {t('achievements.understood', 'Entendido')}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal de Detalle de Logro */}
        <AchievementDetailModal
          achievement={selectedAchievement}
          isPinned={selectedAchievement ? pinnedIds.includes(selectedAchievement.id) : false}
          visible={!!selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          onTogglePin={() => {
            if (selectedAchievement && selectedAchievement.unlocked) {
              handleTogglePin(selectedAchievement.id);
            }
          }}
        />

        {/* Modal de Detalle de Insignia */}
        <BadgeDetailModal
          badge={selectedBadge}
          owned={selectedBadge ? ownedBadgeIds.includes(selectedBadge.id) : false}
          visible={!!selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />

        {/* Pestañas Principales (Logros vs Insignias) */}
        <View style={[s.tabPillsContainer, { backgroundColor: colors.surface, borderColor: colors.border + '40' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('achievements')}
            style={[
              s.tabPill,
              activeTab === 'achievements' && { backgroundColor: colors.primary },
            ]}
          >
            <Trophy size={14} color={activeTab === 'achievements' ? '#FFF' : colors.textSecondary} />
            <Text
              style={[
                s.tabPillText,
                { color: activeTab === 'achievements' ? '#FFF' : colors.textSecondary },
              ]}
            >
              {t('achievements.tabAchievements', 'Logros')} ({achievements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('badges')}
            style={[
              s.tabPill,
              activeTab === 'badges' && { backgroundColor: colors.primary },
            ]}
          >
            <Award size={14} color={activeTab === 'badges' ? '#FFF' : colors.textSecondary} />
            <Text
              style={[
                s.tabPillText,
                { color: activeTab === 'badges' ? '#FFF' : colors.textSecondary },
              ]}
            >
              {t('achievements.tabBadges', 'Insignias')} ({allBadgesList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO DASHBOARD CARD */}
          <LinearGradient
            colors={[colors.primary + '20', colors.surfaceAlt + '40', colors.surface]}
            style={[s.heroCard, { borderColor: colors.border + '60' }]}
          >
            <View style={s.heroRow}>
              {/* Desbloqueados */}
              <View style={s.heroStatCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={16} color="#F59E0B" />
                  <Text style={[s.heroStatValue, { color: '#F59E0B' }]}>{unlockedCount}</Text>
                </View>
                <Text style={[s.heroStatLabel, { color: colors.textMuted }]}>
                  {t('achievements.unlocked', 'Desbloqueados')}
                </Text>
              </View>

              <View style={[s.heroDivider, { backgroundColor: colors.border + '50' }]} />

              {/* Puntos Ranking */}
              <View style={s.heroStatCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Crown size={16} color="#38BDF8" />
                  <Text style={[s.heroStatValue, { color: '#38BDF8' }]}>{unlockedPoints}</Text>
                </View>
                <Text style={[s.heroStatLabel, { color: colors.textMuted }]}>
                  {unlockedPoints} / {totalPoints} pts
                </Text>
              </View>

              <View style={[s.heroDivider, { backgroundColor: colors.border + '50' }]} />

              {/* Progreso % */}
              <View style={s.heroStatCol}>
                <Text style={[s.heroStatValue, { color: colors.primary }]}>
                  {Math.round(progressPct)}%
                </Text>
                <Text style={[s.heroStatLabel, { color: colors.textMuted }]}>
                  {t('achievements.completed', 'Completado')}
                </Text>
              </View>
            </View>

            {/* Barra de progreso global con gradiente radiante */}
            <View style={[s.globalTrack, { backgroundColor: colors.surfaceAlt }]}>
              <LinearGradient
                colors={['#F59E0B', '#7C5CFC', '#38BDF8']}
                style={[s.globalBar, { width: `${Math.max(progressPct, 3)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>

            {/* Progreso subtítulo */}
            <View style={s.heroBottomRow}>
              <Text style={[s.heroSubText, { color: colors.textMuted }]}>
                {String(t('achievements.achievementsObtained', '{{count}} de {{total}} logros obtenidos', { count: unlockedCount, total: achievements.length }))}
              </Text>
              <Text style={[s.heroSubText, { color: colors.textMuted }]}>
                {String(t('achievements.badgesObtained', '{{count}} de {{total}} insignias', { count: ownedBadgesCount, total: allBadgesList.length }))}
              </Text>
            </View>
          </LinearGradient>

          {/* VITRINA INTERACTIVA (3 SLOTS) */}
          <TrophyShowcaseBar
            pinnedAchievements={pinnedIds}
            achievements={achievements}
            onSelectSlot={(ach) => setSelectedAchievement(ach)}
            onUnpinSlot={(id) => handleTogglePin(id)}
          />

          {/* VISTA 1: LOGROS */}
          {activeTab === 'achievements' && (
            <>
              {/* Barra de búsqueda interactiva */}
              <View style={[s.searchBarWrap, { backgroundColor: colors.surface, borderColor: colors.border + '60' }]}>
                <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('achievements.searchPlaceholder', 'Buscar logros (ej: agua, racha, pasos)...')}
                  placeholderTextColor={colors.textMuted}
                  style={[s.searchInput, { color: colors.textPrimary }]}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtros rápidos por Estado */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterChipsRow}
              >
                <TouchableOpacity
                  onPress={() => setStatusFilter('all')}
                  style={[
                    s.filterChip,
                    {
                      backgroundColor: statusFilter === 'all' ? colors.primary + '20' : colors.surface,
                      borderColor: statusFilter === 'all' ? colors.primary : colors.border + '50',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.filterChipText,
                      { color: statusFilter === 'all' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {t('common.all', 'Todos')} ({achievements.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter('unlocked')}
                  style={[
                    s.filterChip,
                    {
                      backgroundColor: statusFilter === 'unlocked' ? '#10B98120' : colors.surface,
                      borderColor: statusFilter === 'unlocked' ? '#10B981' : colors.border + '50',
                    },
                  ]}
                >
                  <CheckCircle2 size={12} color={statusFilter === 'unlocked' ? '#10B981' : colors.textMuted} />
                  <Text
                    style={[
                      s.filterChipText,
                      { color: statusFilter === 'unlocked' ? '#10B981' : colors.textSecondary },
                    ]}
                  >
                    {t('achievements.unlocked', 'Desbloqueados')} ({unlockedCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter('locked')}
                  style={[
                    s.filterChip,
                    {
                      backgroundColor: statusFilter === 'locked' ? colors.surfaceAlt : colors.surface,
                      borderColor: statusFilter === 'locked' ? colors.textPrimary : colors.border + '50',
                    },
                  ]}
                >
                  <Lock size={11} color={statusFilter === 'locked' ? colors.textPrimary : colors.textMuted} />
                  <Text
                    style={[
                      s.filterChipText,
                      { color: statusFilter === 'locked' ? colors.textPrimary : colors.textSecondary },
                    ]}
                  >
                    {t('achievements.locked', 'Bloqueados')} ({achievements.length - unlockedCount})
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Filtros por Rango / Tier */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.tierChipsRow}
              >
                <TouchableOpacity
                  onPress={() => setTierFilter('all')}
                  style={[
                    s.tierChip,
                    {
                      backgroundColor: tierFilter === 'all' ? colors.surfaceAlt : colors.surface,
                      borderColor: tierFilter === 'all' ? colors.textPrimary : colors.border + '40',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.tierChipText,
                      { color: tierFilter === 'all' ? colors.textPrimary : colors.textMuted },
                    ]}
                  >
                    {String(t('achievements.allTiers', 'Todos Tiers'))}
                  </Text>
                </TouchableOpacity>

                {(['diamante', 'oro', 'plata', 'bronce'] as const).map((tierKey) => {
                  const tData = getTierData(tierKey);
                  const isSelected = tierFilter === tierKey;

                  return (
                    <TouchableOpacity
                      key={tierKey}
                      onPress={() => setTierFilter(isSelected ? 'all' : tierKey)}
                      style={[
                        s.tierChip,
                        {
                          backgroundColor: isSelected ? tData.bg : colors.surface,
                          borderColor: isSelected ? tData.accent : colors.border + '40',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12 }}>{tData.icon}</Text>
                      <Text
                        style={[
                          s.tierChipText,
                          { color: isSelected ? tData.accent : colors.textSecondary },
                        ]}
                      >
                        {String(t(`achievements.tiers.${tierKey === 'oro' ? 'gold' : tierKey === 'plata' ? 'silver' : tierKey === 'diamante' ? 'diamond' : 'bronze'}`, tData.label))}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selector de Categorías (Chips rápidos) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.catChipsRow}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory('all')}
                  style={[
                    s.catFilterChip,
                    {
                      backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surface,
                      borderColor: selectedCategory === 'all' ? colors.primary : colors.border + '50',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.catFilterChipText,
                      { color: selectedCategory === 'all' ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {String(t('achievements.allCategories', 'Todas Categorías'))}
                  </Text>
                </TouchableOpacity>

                {categoriesList.map((cat) => {
                  const cfg = CAT_CONFIG[cat];
                  const isSelected = selectedCategory === cat;

                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(isSelected ? 'all' : cat)}
                      style={[
                        s.catFilterChip,
                        {
                          backgroundColor: isSelected ? (cfg ? cfg.gradient[0] : colors.primary) : colors.surface,
                          borderColor: isSelected ? 'transparent' : colors.border + '50',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12 }}>{cfg?.icon || '⭐'}</Text>
                      <Text
                        style={[
                          s.catFilterChipText,
                          { color: isSelected ? '#FFF' : colors.textSecondary },
                        ]}
                      >
                        {t(`achievements.categories.${cat}`, cat)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Resultados */}
              {filteredAchievements.length === 0 ? (
                <View style={[s.emptyStateBox, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                  <Text style={[s.emptyStateTitle, { color: colors.textPrimary }]}>
                    {t('achievements.noResultsTitle', 'No se encontraron logros')}
                  </Text>
                  <Text style={[s.emptyStateDesc, { color: colors.textMuted }]}>
                    {t('achievements.noResultsDesc', 'Prueba cambiando los filtros o el texto de búsqueda.')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTierFilter('all');
                      setSelectedCategory('all');
                    }}
                    style={[s.resetFiltersBtn, { backgroundColor: colors.surfaceAlt }]}
                  >
                    <Text style={[s.resetFiltersText, { color: colors.primary }]}>
                      {t('achievements.resetFilters', 'Restablecer filtros')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isFiltering ? (
                /* Si hay filtros activos, mostramos directamente la cuadrícula para máxima comodidad */
                <View style={s.directGrid}>
                  <Text style={[s.resultsCountHeader, { color: colors.textMuted }]}>
                    Mostrando {filteredAchievements.length} logros
                  </Text>
                  <View style={s.catGrid}>
                    {filteredAchievements.map((item) => (
                      <AchievementCard
                        key={item.id}
                        achievement={item}
                        isPinned={pinnedIds.includes(item.id)}
                        onPress={() => setSelectedAchievement(item)}
                        onTogglePin={() => item.unlocked && handleTogglePin(item.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                /* Vista organizada por categorías con acordeones interactivos */
                groupedAchievements.map(([category, items], idx) => (
                  <CategoryAccordion
                    key={category}
                    category={category}
                    items={items}
                    pinnedIds={pinnedIds}
                    onTogglePin={handleTogglePin}
                    onSelectAchievement={(ach) => setSelectedAchievement(ach)}
                    defaultOpen={idx === 0 || idx === 1}
                  />
                ))
              )}
            </>
          )}

          {/* VISTA 2: INSIGNIAS Y MEDALLAS */}
          {activeTab === 'badges' && (
            <View style={[s.badgesShowcaseBox, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}>
              <View style={s.badgesShowcaseHeader}>
                <View>
                  <Text style={[s.badgesBoxTitle, { color: colors.textPrimary }]}>
                    {t('achievements.badgesTitle', 'Medallero & Insignias Especiales')}
                  </Text>
                  <Text style={[s.badgesBoxSub, { color: colors.textMuted }]}>
                    Has coleccionado {ownedBadgesCount} de {allBadgesList.length} medallas disponibles
                  </Text>
                </View>

                <View style={[s.catCountBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]}>
                  <Text style={[s.catCountBadgeText, { color: '#F59E0B' }]}>
                    {ownedBadgesCount}/{allBadgesList.length}
                  </Text>
                </View>
              </View>

              <View style={bs.badgesGrid}>
                {allBadgesList.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    owned={ownedBadgeIds.includes(badge.id)}
                    onPress={() => setSelectedBadge(badge)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  topAmbientGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 360,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  pointsBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Tab pills
  tabPillsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '800',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },

  // Hero Dashboard
  heroCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  heroDivider: {
    width: 1,
    height: 32,
  },
  globalTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  globalBar: {
    height: 7,
    borderRadius: 4,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Showcase
  showcaseCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  showcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  showcaseTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  showcaseSlotsCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  showcaseSlotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  showcaseSlotItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
  },
  slotUnpinBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  slotIconHex: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotTitleText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  slotTierText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  showcaseSlotEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  emptySlotPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Buscador
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },

  // Filtros Chips
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
  },

  tierChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tierChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  catChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 14,
  },
  catFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  catFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Categorías Acordeón
  catContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTitleText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  catSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completeBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '900',
  },
  catCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  catCountBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catProgressTrack: {
    height: 3,
    marginHorizontal: 14,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: 3,
    borderRadius: 1.5,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: 8,
    rowGap: 10,
  },

  directGrid: {
    marginTop: 4,
  },
  resultsCountHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    paddingLeft: 4,
  },

  // Tarjeta de Logro individual
  cardContainer: {
    width: '48.5%',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  pinActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  iconHex: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockFloatingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkFloatingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  rewardMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '95%',
  },
  rewardMiniText: {
    fontSize: 8,
    fontWeight: '800',
  },

  // Empty State
  emptyStateBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFiltersBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Insignias box
  badgesShowcaseBox: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  badgesShowcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgesBoxTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  badgesBoxSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Modales
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoModalDesc: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoTierList: {
    gap: 8,
    marginBottom: 20,
  },
  infoTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  infoTierDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 10,
  },
  infoTierLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  infoTierPoints: {
    fontSize: 14,
    fontWeight: '900',
  },
  infoCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  infoCloseText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Detail Modal
  detailModalCard: {
    width: '100%',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailEmblemWrap: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 12,
  },
  detailEmblem: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBadgeFloating: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  detailTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  detailTierText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  detailRewardBox: {
    width: '100%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  detailRewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailRewardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRewardHeader: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailRewardName: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

// Badges stylesheet
const bs = StyleSheet.create({
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  badgeCard: {
    width: '23.2%',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 4,
  },
  badgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeLockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    padding: 2,
    borderRadius: 6,
  },
  badgeLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
});
