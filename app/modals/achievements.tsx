import React, { useMemo, useState, memo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAchievements, Achievement, ALL_BADGES } from '../../hooks/useAchievements';
import { Spacing, Radius } from '../../constants';
import { supabase } from '../../services/supabase';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

// Category config: icon & gradient per category name
const CAT_CONFIG: Record<string, { icon: string; gradient: [string, string] }> = {
  'General':      { icon: '⭐', gradient: ['#F59E0B', '#D97706'] },
  'Constancia':   { icon: '🔥', gradient: ['#EF4444', '#B91C1C'] },
  'Nutrición':    { icon: '🥗', gradient: ['#10B981', '#047857'] },
  'Misterio':     { icon: '🔮', gradient: ['#A855F7', '#6B21A8'] },
  'Físico':       { icon: '📐', gradient: ['#3B82F6', '#1D4ED8'] },
  'Actividad':    { icon: '👟', gradient: ['#06B6D4', '#0E7490'] },
  'Descanso':     { icon: '🌙', gradient: ['#6366F1', '#4338CA'] },
  'Comunidad':    { icon: '🌟', gradient: ['#EC4899', '#BE185D'] },
  'Especial':     { icon: '💎', gradient: ['#8B5CF6', '#5B21B6'] },
};

function getTierColors(tier: string): [string, string] {
  switch (tier) {
    case 'diamante': return ['#38BDF8', '#4F46E5'];
    case 'oro':      return ['#FBBF24', '#EA580C'];
    case 'plata':    return ['#9CA3AF', '#4B5563'];
    case 'bronce':   return ['#D97706', '#92400E'];
    default:         return ['#FFD700', '#FFA500'];
  }
}

// ── Badge Card (for the Badges Accordion) ─────────────────────────────────────
const BadgeCard = memo(({ badge, owned }: { badge: typeof ALL_BADGES[string]; owned: boolean }) => {
  const colors = useTheme();
  return (
    <View style={[
      bs.badgeCard,
      { backgroundColor: colors.surface, borderColor: owned ? badge.colors[0] + '80' : colors.border },
      !owned ? { opacity: 0.45 } : {}
    ]}>
      <LinearGradient
        colors={owned ? badge.colors as [string, string] : [colors.surfaceAlt, colors.surfaceAlt]}
        style={bs.badgeIconWrap}
      >
        <Text style={{ fontSize: 22 }}>{badge.icon}</Text>
      </LinearGradient>
      <Text style={[bs.badgeLabel, { color: owned ? colors.textPrimary : colors.textSecondary }]} numberOfLines={2}>
        {badge.label}
      </Text>
      {!owned && <LucideIcons.Lock size={10} color={colors.textMuted} style={{ marginTop: 2 }} />}
    </View>
  );
});

// ── Achievement Row (memoized, NO lottie) ─────────────────────────────────────
const AchievementRow = memo(({ achievement, isPinned, onTogglePin }: {
  achievement: Achievement; isPinned: boolean; onTogglePin: () => void;
}) => {
  const colors = useTheme();
  const tierColors = getTierColors(achievement.tier);
  const accentColor = tierColors[0];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onTogglePin} style={s.rowWrap}>
      <GlassCard
        accentColor={achievement.unlocked ? accentColor : colors.border}
        showStripe={achievement.unlocked}
        style={[s.listItem, !achievement.unlocked ? { opacity: 0.55 } : {}]}
        noPadding
      >
        <View style={s.listItemInner}>
          {/* Icon */}
          <View style={s.iconContainer}>
            {achievement.unlocked ? (
              <LinearGradient colors={tierColors} style={s.iconHex}>
                <Text style={s.emojiHuge}>{achievement.icon}</Text>
              </LinearGradient>
            ) : (
              <View style={[s.iconHex, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[s.emojiHuge, { opacity: 0.2 }]}>{achievement.icon}</Text>
                <View style={s.lockBadge}>
                  <LucideIcons.Lock size={11} color="#FFF" />
                </View>
              </View>
            )}
            {isPinned && (
              <View style={s.pinBadge}>
                <Text style={{ fontSize: 9 }}>📌</Text>
              </View>
            )}
          </View>

          {/* Text */}
          <View style={s.textContent}>
            <View style={s.titleRow}>
              <Text style={[s.itemTitle, { color: achievement.unlocked ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
                {achievement.title}
              </Text>
              {achievement.unlocked && <LucideIcons.CheckCircle2 size={15} color={accentColor} />}
            </View>
            <Text style={[s.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {achievement.description}
            </Text>
            {achievement.rewardBadgeId && (
              <View style={[s.rewardPill, {
                backgroundColor: achievement.unlocked ? accentColor + '15' : colors.surfaceAlt,
                borderColor: achievement.unlocked ? accentColor + '40' : colors.border,
              }]}>
                <Text style={[s.rewardPillText, { color: achievement.unlocked ? accentColor : colors.textMuted }]}>
                  🎁 {ALL_BADGES[achievement.rewardBadgeId]?.icon} {ALL_BADGES[achievement.rewardBadgeId]?.label}
                </Text>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
});

// ── Category Accordion ─────────────────────────────────────────────────────────
const CategoryAccordion = memo(({ category, items, pinnedIds, onTogglePin }: {
  category: string;
  items: Achievement[];
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
}) => {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const cfg = CAT_CONFIG[category] || { icon: '🏅', gradient: ['#7C5CFC', '#4338CA'] as [string, string] };
  const unlockedInCat = items.filter(i => i.unlocked).length;

  return (
    <View style={[s.catCard, { backgroundColor: colors.surface, borderColor: open ? cfg.gradient[0] + '50' : colors.border }]}>
      <TouchableOpacity style={s.catHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
        <View style={s.catIconWrap}>
          <LinearGradient colors={cfg.gradient} style={s.catIconGrad}>
            <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[s.catTitle, { color: colors.textPrimary }]}>{category}</Text>
          <Text style={[s.catSub, { color: colors.textSecondary }]}>
            {unlockedInCat}/{items.length} desbloqueados
          </Text>
        </View>
        {unlockedInCat > 0 && (
          <View style={[s.catBadge, { backgroundColor: cfg.gradient[0] + '30' }]}>
            <Text style={[s.catBadgeText, { color: cfg.gradient[0] }]}>{unlockedInCat}</Text>
          </View>
        )}
        <View style={[s.chevronWrap, { backgroundColor: colors.surfaceAlt }]}>
          {open ? <LucideIcons.ChevronUp size={16} color={colors.textSecondary} />
                : <LucideIcons.ChevronDown size={16} color={colors.textSecondary} />}
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={cfg.gradient}
            style={[s.progressBar, { width: `${(unlockedInCat / items.length) * 100}%` }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>
      )}

      {open && (
        <View style={s.catItems}>
          {items.map(item => (
            <AchievementRow
              key={item.id}
              achievement={item}
              isPinned={pinnedIds.includes(item.id)}
              onTogglePin={() => item.unlocked && onTogglePin(item.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
});

// ── Badges Accordion ───────────────────────────────────────────────────────────
const BadgesAccordion = memo(({ ownedBadgeIds }: { ownedBadgeIds: string[] }) => {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const allBadges = Object.values(ALL_BADGES);
  const ownedCount = allBadges.filter(b => ownedBadgeIds.includes(b.id)).length;

  return (
    <View style={[s.catCard, { backgroundColor: colors.surface, borderColor: open ? '#F59E0B50' : colors.border, marginBottom: 24 }]}>
      <TouchableOpacity style={s.catHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
        <View style={s.catIconWrap}>
          <LinearGradient colors={['#F59E0B', '#7C5CFC']} style={s.catIconGrad}>
            <Text style={{ fontSize: 22 }}>🎖️</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[s.catTitle, { color: colors.textPrimary }]}>Insignias</Text>
          <Text style={[s.catSub, { color: colors.textSecondary }]}>{ownedCount}/{allBadges.length} disponibles</Text>
        </View>
        {ownedCount > 0 && (
          <View style={[s.catBadge, { backgroundColor: '#F59E0B30' }]}>
            <Text style={[s.catBadgeText, { color: '#F59E0B' }]}>{ownedCount}</Text>
          </View>
        )}
        <View style={[s.chevronWrap, { backgroundColor: colors.surfaceAlt }]}>
          {open ? <LucideIcons.ChevronUp size={16} color={colors.textSecondary} />
                : <LucideIcons.ChevronDown size={16} color={colors.textSecondary} />}
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={['#F59E0B', '#7C5CFC']}
          style={[s.progressBar, { width: allBadges.length > 0 ? `${(ownedCount / allBadges.length) * 100}%` : '0%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
      </View>

      {open && (
        <View style={bs.badgesGrid}>
          {allBadges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              owned={ownedBadgeIds.includes(badge.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
});

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function AchievementsModal() {
  const router = useRouter();
  const colors = useTheme();
  const { achievements, unlockedCount } = useAchievements();
  const { profile, setProfile } = useAuthStore();

  const handleTogglePin = useCallback(async (id: string) => {
    if (!profile) return;
    const current = profile.pinnedAchievements || [];
    let newPinned = [...current];
    if (newPinned.includes(id)) {
      newPinned = newPinned.filter(a => a !== id);
    } else {
      if (newPinned.length >= 3) newPinned.shift();
      newPinned.push(id);
    }
    setProfile({ ...profile, pinnedAchievements: newPinned });
    await supabase.from('users').update({ pinned_achievements: newPinned }).eq('id', profile.id);
  }, [profile, setProfile]);

  const groupedAchievements = useMemo(() => {
    return Object.entries(
      achievements.reduce((acc, ach) => {
        if (!acc[ach.category]) acc[ach.category] = [];
        acc[ach.category].push(ach);
        return acc;
      }, {} as Record<string, Achievement[]>)
    );
  }, [achievements]);

  const pinnedIds = profile?.pinnedAchievements || [];
  
  // Collect owned badge IDs from profile role + unlocked achievements' rewards
  const ownedBadgeIds = useMemo(() => {
    const ids: string[] = [];
    if (profile?.role) ids.push(profile.role);
    if (profile?.badges) ids.push(...profile.badges);
    achievements.forEach(a => {
      if (a.unlocked && a.rewardBadgeId) ids.push(a.rewardBadgeId);
    });
    return [...new Set(ids)];
  }, [profile, achievements]);

  const progressPct = achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }]}>
          <LucideIcons.ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>Tus Logros</Text>
        <View style={[s.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={s.countText}>{unlockedCount}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Stats Card */}
        <LinearGradient colors={[colors.primary + '25', colors.primary + '08', 'transparent']} style={s.heroCard}>
          <View style={s.heroRow}>
            <View style={s.heroStatCol}>
              <Text style={[s.heroStatValue, { color: '#FFD700' }]}>{unlockedCount}</Text>
              <Text style={[s.heroStatLabel, { color: colors.textSecondary }]}>Desbloqueados</Text>
            </View>
            <View style={[s.heroDivider, { backgroundColor: colors.border }]} />
            <View style={s.heroStatCol}>
              <Text style={[s.heroStatValue, { color: colors.textPrimary }]}>{achievements.length}</Text>
              <Text style={[s.heroStatLabel, { color: colors.textSecondary }]}>Totales</Text>
            </View>
            <View style={[s.heroDivider, { backgroundColor: colors.border }]} />
            <View style={s.heroStatCol}>
              <Text style={[s.heroStatValue, { color: colors.primary }]}>{Math.round(progressPct)}%</Text>
              <Text style={[s.heroStatLabel, { color: colors.textSecondary }]}>Completado</Text>
            </View>
          </View>

          {/* Global progress bar */}
          <View style={[s.globalTrack, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#FFD700', '#7C5CFC']}
              style={[s.globalBar, { width: `${progressPct}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={[s.pinHint, { color: colors.textSecondary }]}>
            📌 Toca un logro desbloqueado para fijarlo (máx. 3)
          </Text>
        </LinearGradient>

        {/* Badges Accordion */}
        <BadgesAccordion ownedBadgeIds={ownedBadgeIds} />

        {/* Achievement Category Accordions */}
        {groupedAchievements.map(([category, items]) => (
          <CategoryAccordion
            key={category}
            category={category}
            items={items}
            pinnedIds={pinnedIds}
            onTogglePin={handleTogglePin}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1 },
  header:         { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn:        { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title:          { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  countBadge:     { minWidth: 32, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  countText:      { color: '#FFF', fontSize: 13, fontWeight: '800' },

  scrollContent:  { padding: 16, paddingBottom: 80 },

  heroCard:       { borderRadius: 20, padding: 20, marginBottom: 16 },
  heroRow:        { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  heroStatCol:    { alignItems: 'center', flex: 1 },
  heroStatValue:  { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  heroStatLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  heroDivider:    { width: 1, height: 40 },
  globalTrack:    { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  globalBar:      { height: 6, borderRadius: 3 },
  pinHint:        { fontSize: 12, textAlign: 'center', opacity: 0.7 },

  // Category accordion card
  catCard:        { borderRadius: 22, borderWidth: 1.5, marginBottom: 16, overflow: 'hidden' },
  catHeader:      { flexDirection: 'row', alignItems: 'center', padding: 16 },
  catIconWrap:    { borderRadius: 16, overflow: 'hidden' },
  catIconGrad:    { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  catTitle:       { fontSize: 17, fontWeight: '900', marginBottom: 2, letterSpacing: -0.3 },
  catSub:         { fontSize: 13, fontWeight: '600', opacity: 0.6 },
  catBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 18, marginRight: 10 },
  catBadgeText:   { fontSize: 13, fontWeight: '800' },
  chevronWrap:    { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  progressTrack:  { height: 4, marginHorizontal: 16, borderRadius: 2, marginBottom: 2 },
  progressBar:    { height: 4, borderRadius: 2 },
  catItems:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6 },

  // Achievement row
  rowWrap:        { width: (width - 74) / 2 },
  listItem:       { width: '100%', borderRadius: Radius.lg },
  listItemInner:  { flexDirection: 'column', padding: 12, alignItems: 'center' },
  iconContainer:  { marginRight: 0, marginBottom: 8, position: 'relative' },
  iconHex:        { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  emojiHuge:      { fontSize: 26 },
  lockBadge:      { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1E293B', padding: 3, borderRadius: 9, borderWidth: 1, borderColor: '#334155' },
  pinBadge:       { position: 'absolute', top: -5, left: -5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  textContent:    { alignItems: 'center', width: '100%' },
  titleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4, gap: 4 },
  itemTitle:      { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  itemDesc:       { fontSize: 10, lineHeight: 13, textAlign: 'center', marginBottom: 6, opacity: 0.8 },
  rewardPill:     { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  rewardPillText: { fontSize: 9, fontWeight: '700' },
});

// Badges stylesheet
const bs = StyleSheet.create({
  badgesGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  badgeCard:    { 
    width: (width - 84) / 4, 
    alignItems: 'center', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 6, paddingHorizontal: 2, gap: 4,
  },
  badgeIconWrap:{ width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeLabel:   { fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 11 },
});
