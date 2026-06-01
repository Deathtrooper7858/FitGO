import React, { useMemo, useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, SectionList, LayoutAnimation, UIManager, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAchievements, Achievement, ALL_BADGES } from '../../hooks/useAchievements';
import { Spacing, Radius, Shadow } from '../../constants';

import { useAuthStore } from '../../store';
import { supabase } from '../../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ─── Category metadata ─────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'General':    { icon: '⭐', color: '#6366F1' },
  'Constancia': { icon: '🔥', color: '#EF4444' },
  'Nutrición':  { icon: '🥗', color: '#10B981' },
  'Físico':     { icon: '💪', color: '#F59E0B' },
  'Actividad':  { icon: '👟', color: '#3B82F6' },
  'Descanso':   { icon: '🌙', color: '#8B5CF6' },
  'Comunidad':  { icon: '🌟', color: '#EC4899' },
  'Especial':   { icon: '💎', color: '#14B8A6' },
  'Misterio':   { icon: '🔮', color: '#A78BFA' },
};

// ─── Helper: tier colors ───────────────────────────────────────────────────
function getTierColors(tier: string): [string, string] {
  switch (tier) {
    case 'diamante': return ['#38BDF8', '#4F46E5'];
    case 'oro':      return ['#FBBF24', '#EA580C'];
    case 'plata':    return ['#9CA3AF', '#4B5563'];
    case 'bronce':   return ['#D97706', '#92400E'];
    default:         return ['#FFD700', '#FFA500'];
  }
}

// ─── Achievement Card (memoized) ───────────────────────────────────────────
const AchievementCard = memo(function AchievementCard({
  achievement, isPinned, onTogglePin
}: {
  achievement: Achievement; isPinned: boolean; onTogglePin: () => void;
}) {
  const colors = useTheme();
  const tierColors = getTierColors(achievement.tier);
  const isHolo = achievement.unlocked && (achievement.tier === 'oro' || achievement.tier === 'diamante');

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onTogglePin}
      style={[
        s.card,
        { backgroundColor: colors.surface },
        isHolo && { borderColor: tierColors[0] + '50', borderWidth: 1.5 },
        !achievement.unlocked && { opacity: 0.55 }
      ]}
    >
      {isPinned && (
        <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
          <Text style={{ fontSize: 14 }}>📌</Text>
        </View>
      )}

      {/* Icon */}
      <View style={s.cardTop}>
        {achievement.unlocked ? (
          <LinearGradient
            colors={tierColors as [string, string]}
            style={[s.iconCircle, isHolo && { shadowColor: tierColors[0], shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 }]}
          >
            {achievement.iconType === 'lucide' && achievement.lucideIcon ? (
              // @ts-ignore
              React.createElement(LucideIcons[achievement.lucideIcon] || LucideIcons.Star, {
                size: 28, color: '#FFF', strokeWidth: 2
              })
            ) : (
              <Text style={s.emojiIcon}>{achievement.icon}</Text>
            )}
          </LinearGradient>
        ) : (
          <View style={[s.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
            {achievement.iconType === 'lucide' && achievement.lucideIcon ? (
              // @ts-ignore
              React.createElement(LucideIcons[achievement.lucideIcon] || LucideIcons.Star, {
                size: 28, color: colors.textSecondary, opacity: 0.25
              })
            ) : (
              <Text style={[s.emojiIcon, { opacity: 0.2 }]}>{achievement.icon}</Text>
            )}
            <View style={s.lockOverlay}>
              <LucideIcons.Lock size={10} color={colors.textSecondary} />
            </View>
          </View>
        )}
      </View>

      {/* Tier pill */}
      <View style={[s.tierPill, { backgroundColor: tierColors[0] + '20', borderColor: tierColors[0] + '40' }]}>
        <Text style={[s.tierText, { color: tierColors[0] }]}>{achievement.tier.toUpperCase()}</Text>
      </View>

      <Text style={[s.cardTitle, { color: achievement.unlocked ? colors.textPrimary : colors.textSecondary }]} numberOfLines={2}>
        {achievement.title}
      </Text>
      <Text style={[s.cardDesc, { color: colors.textMuted }]} numberOfLines={3}>
        {achievement.description}
      </Text>

      {/* Reward badge */}
      {achievement.rewardBadgeId && (
        <View style={[
          s.rewardRow,
          {
            backgroundColor: achievement.unlocked ? tierColors[0] + '15' : colors.surfaceAlt,
            borderColor: achievement.unlocked ? tierColors[0] + '40' : colors.border
          }
        ]}>
          <Text style={[s.rewardText, { color: achievement.unlocked ? tierColors[0] : colors.textMuted, fontWeight: achievement.unlocked ? '800' : '600' }]}>
            🎁 {ALL_BADGES[achievement.rewardBadgeId]?.icon} {ALL_BADGES[achievement.rewardBadgeId]?.label}
          </Text>
        </View>
      )}

      {achievement.unlocked && (
        <View style={s.checkMark}>
          <LucideIcons.CheckCircle2 size={14} color={tierColors[0]} />
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Category Accordion ────────────────────────────────────────────────────
const CategoryAccordion = memo(function CategoryAccordion({
  category,
  items,
  pinnedAchievements,
  onTogglePin,
}: {
  category: string;
  items: Achievement[];
  pinnedAchievements: string[];
  onTogglePin: (id: string) => void;
}) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[category] || { icon: '🏅', color: '#6366F1' };
  const unlockedInCat = items.filter(i => i.unlocked).length;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  }, []);

  return (
    <View style={[s.accordion, { borderColor: colors.border + '40' }]}>
      {/* Accordion header */}
      <TouchableOpacity activeOpacity={0.75} onPress={toggle} style={s.accordionHeader}>
        <LinearGradient
          colors={[meta.color + '30', meta.color + '10']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[s.catIconBg, { borderColor: meta.color + '40' }]}
        >
          <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[s.catTitle, { color: colors.textPrimary }]}>{category}</Text>
          <Text style={[s.catCount, { color: colors.textMuted }]}>{unlockedInCat}/{items.length} desbloqueados</Text>
        </View>
        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[s.progressFill, { width: `${(unlockedInCat / items.length) * 100}%` as any, backgroundColor: meta.color }]} />
        </View>
        <LucideIcons.ChevronDown
          size={18}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {/* Accordion body */}
      {open && (
        <View style={s.accordionBody}>
          <View style={s.grid}>
            {items.map((item) => (
              <AchievementCard
                key={item.id}
                achievement={item}
                isPinned={pinnedAchievements.includes(item.id)}
                onTogglePin={() => onTogglePin(item.id)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

// ─── Badge Reward Card (memoized) ──────────────────────────────────────────
const BadgeRewardCard = memo(function BadgeRewardCard({ badgeId, earned }: { badgeId: string; earned: boolean }) {
  const colors = useTheme();
  const badge = ALL_BADGES[badgeId];
  if (!badge) return null;
  return (
    <View style={[s.badgeCard, { backgroundColor: colors.surface, borderColor: earned ? badge.colors[0] + '60' : colors.border, opacity: earned ? 1 : 0.45 }]}>
      <LinearGradient colors={badge.colors as [string, string]} style={s.badgeIcon}>
        <Text style={{ fontSize: 20 }}>{badge.icon}</Text>
      </LinearGradient>
      <Text style={[s.badgeLabel, { color: earned ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>{badge.label}</Text>
      {earned && <LucideIcons.CheckCircle2 size={12} color={badge.colors[0]} />}
    </View>
  );
});

// ─── Badges Accordion ──────────────────────────────────────────────────────
const BadgesAccordion = memo(function BadgesAccordion({
  rewardBadgeIds, earnedBadgeIds
}: {
  rewardBadgeIds: string[]; earnedBadgeIds: string[];
}) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const earnedCount = earnedBadgeIds.length;
  const totalCount = rewardBadgeIds.length;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  }, []);

  return (
    <View style={[s.accordion, { borderColor: colors.border + '40', marginBottom: Spacing.xl }]}>
      {/* Accordion header */}
      <TouchableOpacity activeOpacity={0.75} onPress={toggle} style={s.accordionHeader}>
        <LinearGradient
          colors={['#0EA5E930', '#0EA5E910']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[s.catIconBg, { borderColor: '#0EA5E940' }]}
        >
          <Text style={{ fontSize: 20 }}>🎁</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[s.catTitle, { color: colors.textPrimary }]}>Badges de Recompensa</Text>
          <Text style={[s.catCount, { color: colors.textMuted }]}>{earnedCount}/{totalCount} desbloqueados</Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[s.progressFill, { width: `${(earnedCount / Math.max(1, totalCount)) * 100}%` as any, backgroundColor: '#0EA5E9' }]} />
        </View>
        <LucideIcons.ChevronDown
          size={18}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {/* Accordion body */}
      {open && (
        <View style={s.accordionBody}>
          <Text style={[s.sectionSub, { color: colors.textMuted, marginBottom: 12 }]}>Desbloquea logros para ganar estos badges exclusivos</Text>
          <View style={s.badgesRow}>
            {rewardBadgeIds.map(bid => (
              <BadgeRewardCard key={bid} badgeId={bid} earned={earnedBadgeIds.includes(bid)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function AchievementsModal() {
  const router = useRouter();
  const colors = useTheme();
  const { achievements, unlockedCount } = useAchievements();
  const { profile, setProfile } = useAuthStore();

  const pinnedAchievements = profile?.pinnedAchievements || [];

  const handleTogglePin = useCallback(async (id: string) => {
    if (!profile) return;
    const current = profile.pinnedAchievements || [];
    let newPinned = [...current];

    if (newPinned.includes(id)) {
      newPinned = newPinned.filter(a => a !== id);
    } else {
      if (newPinned.length >= 3) {
        newPinned.shift();
      }
      newPinned.push(id);
    }

    setProfile({ ...profile, pinnedAchievements: newPinned });
    await supabase.from('users').update({ pinned_achievements: newPinned }).eq('id', profile.id);
  }, [profile, setProfile]);

  // Group by category (memoized)
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, Achievement[]> = {};
    for (const ach of achievements) {
      if (!groups[ach.category]) groups[ach.category] = [];
      groups[ach.category].push(ach);
    }
    // Sort: unlocked first within each category
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
    }
    return Object.entries(groups);
  }, [achievements]);

  // Earned reward badges (memoized)
  const earnedBadgeIds = useMemo(() => {
    return achievements.filter(a => a.unlocked && a.rewardBadgeId).map(a => a.rewardBadgeId!);
  }, [achievements]);

  // All unique badge IDs that can be earned via achievements
  const rewardBadgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of achievements) {
      if (a.rewardBadgeId) ids.add(a.rewardBadgeId);
    }
    return Array.from(ids);
  }, [achievements]);

  const percentDone = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  // Sections for SectionList: header + categories accordion list
  // We'll use a simple FlatList for the accordion list since accordions handle their own expand/collapse
  const sections = useMemo(() => [
    { key: 'header', data: ['header'] },
    { key: 'badges', data: ['badges'] },
    { key: 'categories', data: groupedAchievements },
  ], [groupedAchievements]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[s.headerBar, { borderBottomColor: colors.border + '30' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <LucideIcons.X color={colors.textPrimary} size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>🏆 Mis Logros</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={[0]}
        keyExtractor={() => 'main'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        renderItem={() => (
          <View>
            {/* Stats summary card */}
            <LinearGradient
              colors={['#FFD700', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.statsCard}
            >
              <View style={s.statsIconBox}>
                <LucideIcons.Trophy size={40} color="#FFF" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.statsValue}>{unlockedCount} / {achievements.length}</Text>
                <Text style={s.statsLabel}>Logros Completados · {percentDone}%</Text>
                {/* Progress bar */}
                <View style={s.statProgress}>
                  <View style={[s.statProgressFill, { width: `${percentDone}%` as any }]} />
                </View>
              </View>
            </LinearGradient>

            <Text style={[s.hint, { color: colors.textSecondary }]}>
              Toca un logro desbloqueado para fijarlo en tu vitrina (Máx 3)
            </Text>

            {/* Reward Badges section */}
            {rewardBadgeIds.length > 0 && (
              <BadgesAccordion rewardBadgeIds={rewardBadgeIds} earnedBadgeIds={earnedBadgeIds} />
            )}

            {/* Category accordions */}
            <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>📚 Categorías</Text>
            {groupedAchievements.map(([category, items]) => (
              <CategoryAccordion
                key={category}
                category={category}
                items={items}
                pinnedAchievements={pinnedAchievements}
                onTogglePin={handleTogglePin}
              />
            ))}

            <View style={{ height: 40 }} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 8, borderRadius: 20 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  scrollContent: { padding: Spacing.md },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    gap: 16,
    marginBottom: Spacing.md,
    ...Shadow.md
  },
  statsIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: Radius.lg
  },
  statsValue: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  statsLabel: { fontSize: 12, color: '#FFF', fontWeight: '600', opacity: 0.92, marginTop: 2 },
  statProgress: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  statProgressFill: { height: 6, backgroundColor: '#FFF', borderRadius: 3 },

  hint: { fontSize: 13, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 18 },

  sectionLabel: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sectionSub: { fontSize: 12, marginBottom: 12 },

  // Badges row
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  badgeCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    width: '31%',
    ...Shadow.sm
  },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badgeLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },

  // Accordion
  accordion: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  catIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  catTitle: { fontSize: 15, fontWeight: '800' },
  catCount: { fontSize: 11, marginTop: 2 },
  progressTrack: { width: 50, height: 5, borderRadius: 3, overflow: 'hidden', marginRight: 6 },
  progressFill: { height: 5, borderRadius: 3 },
  accordionBody: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.sm,
    marginBottom: 0,
  },
  cardTop: { marginBottom: 8 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  emojiIcon: { fontSize: 28 },
  lockOverlay: {
    position: 'absolute',
    bottom: -2, right: -2,
    backgroundColor: '#121212',
    borderRadius: 9,
    padding: 3,
    borderWidth: 1,
    borderColor: '#333'
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  tierText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  cardTitle: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 3, lineHeight: 16 },
  cardDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14, marginBottom: 4 },
  checkMark: { position: 'absolute', top: 8, right: 8 },
  rewardRow: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  rewardText: { fontSize: 8, textAlign: 'center' },
});
