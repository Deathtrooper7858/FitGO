import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAchievements, Achievement, ALL_BADGES } from '../../hooks/useAchievements';
import { Spacing, Radius, Shadow } from '../../constants';
import { supabase } from '../../services/supabase';
import LottieView from 'lottie-react-native';
import { LottieRegistry } from '../../hooks/LottieRegistry';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

export default function AchievementsModal() {
  const router = useRouter();
  const colors = useTheme();
  const { achievements, unlockedCount } = useAchievements();
  const { profile, setProfile } = useAuthStore();

  const handleTogglePin = async (id: string) => {
    if (!profile) return;
    const current = profile.pinnedAchievements || [];
    let newPinned = [...current];

    if (newPinned.includes(id)) {
      newPinned = newPinned.filter(a => a !== id);
    } else {
      if (newPinned.length >= 3) {
        newPinned.shift(); // Remove the oldest to keep max 3
      }
      newPinned.push(id);
    }

    setProfile({ ...profile, pinnedAchievements: newPinned });
    await supabase.from('users').update({ pinned_achievements: newPinned }).eq('id', profile.id);
  };

  const groupedAchievements = useMemo(() => {
    return Object.entries(
      achievements.reduce((acc, ach) => {
        if (!acc[ach.category]) acc[ach.category] = [];
        acc[ach.category].push(ach);
        return acc;
      }, {} as Record<string, Achievement[]>)
    );
  }, [achievements]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <LucideIcons.ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>Tus Logros</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Dashboard Header */}
        <View style={s.dashboardHeader}>
          <LottieView 
             source={LottieRegistry.fire_burst}
             autoPlay 
             loop
             style={s.dashboardLottie}
          />
          <View style={s.dashboardTextContainer}>
            <Text style={s.dashboardValue}>{unlockedCount}</Text>
            <Text style={s.dashboardDivider}>/</Text>
            <Text style={s.dashboardTotal}>{achievements.length}</Text>
          </View>
          <Text style={[s.dashboardLabel, { color: colors.textSecondary }]}>Logros Desbloqueados</Text>
        </View>

        <Text style={[s.instructions, { color: colors.textSecondary }]}>
          Toca un logro desbloqueado para fijarlo en tu vitrina (Máx 3)
        </Text>

        {groupedAchievements.map(([category, items]) => (
          <View key={category} style={s.categorySection}>
            <View style={s.categoryHeaderRow}>
              <View style={[s.categoryLine, { backgroundColor: colors.border }]} />
              <Text style={[s.categoryTitle, { color: colors.textPrimary }]}>{category}</Text>
              <View style={[s.categoryLine, { backgroundColor: colors.border }]} />
            </View>
            
            <View style={s.listContainer}>
              {items.map((item) => (
                <AchievementListItem
                  key={item.id}
                  achievement={item}
                  isPinned={profile?.pinnedAchievements?.includes(item.id) || false}
                  onTogglePin={() => item.unlocked && handleTogglePin(item.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementListItem({
  achievement, isPinned, onTogglePin
}: {
  achievement: Achievement; isPinned: boolean; onTogglePin: () => void;
}) {
  const colors = useTheme();

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'diamante': return ['#38BDF8', '#4F46E5'];
      case 'oro': return ['#FBBF24', '#EA580C'];
      case 'plata': return ['#9CA3AF', '#4B5563'];
      case 'bronce': return ['#D97706', '#92400E'];
      default: return ['#FFD700', '#FFA500'];
    }
  };

  const tierColors = getTierColors(achievement.tier);
  const isHolo = achievement.unlocked && (achievement.tier === 'oro' || achievement.tier === 'diamante');
  const accentColor = tierColors[0];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onTogglePin} style={{ marginBottom: 12 }}>
      <GlassCard 
        accentColor={achievement.unlocked ? accentColor : colors.border} 
        showStripe={achievement.unlocked}
        style={[s.listItem, !achievement.unlocked && { opacity: 0.7 }]}
        noPadding
      >
        <View style={s.listItemInner}>
          <View style={s.iconContainer}>
            {achievement.unlocked ? (
              <LinearGradient
                colors={tierColors as [string, string, ...string[]]}
                style={[s.iconHexagon, isHolo && { shadowColor: accentColor, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 }]}
              >
                {isHolo && (
                  <LottieView
                    source={LottieRegistry.diamond_glow}
                    autoPlay
                    loop
                    style={{ position: 'absolute', width: 90, height: 90, opacity: 0.85 }}
                    resizeMode="cover"
                  />
                )}
                <Text style={[s.emojiIconHuge, { textShadowColor: '#FFF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }]}>
                  {achievement.icon}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[s.iconHexagon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[s.emojiIconHuge, { opacity: 0.2 }]}>{achievement.icon}</Text>
                <View style={s.lockBadge}>
                  <LucideIcons.Lock size={12} color="#FFF" />
                </View>
              </View>
            )}
            
            {isPinned && (
              <View style={s.pinBadge}>
                <Text style={{ fontSize: 10 }}>📌</Text>
              </View>
            )}
          </View>

          <View style={s.textContent}>
            <View style={s.titleRow}>
              <Text style={[s.itemTitle, { color: achievement.unlocked ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
                {achievement.title}
              </Text>
              {achievement.unlocked && <LucideIcons.CheckCircle2 size={16} color={accentColor} />}
            </View>
            
            <Text style={[s.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {achievement.description}
            </Text>

            {achievement.rewardBadgeId && (
              <View style={[
                s.rewardPill,
                {
                  backgroundColor: achievement.unlocked ? accentColor + '15' : colors.surfaceAlt,
                  borderColor: achievement.unlocked ? accentColor + '40' : colors.border
                }
              ]}>
                <Text style={[
                  s.rewardPillText,
                  { color: achievement.unlocked ? accentColor : colors.textMuted }
                ]}>
                  🎁 {ALL_BADGES[achievement.rewardBadgeId]?.icon} {ALL_BADGES[achievement.rewardBadgeId]?.label}
                </Text>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm
  },
  closeBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: Spacing.md, paddingBottom: 60 },
  
  dashboardHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  dashboardLottie: {
    position: 'absolute',
    width: width,
    height: 250,
    opacity: 0.6,
    zIndex: -1,
  },
  dashboardTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dashboardValue: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  dashboardDivider: {
    fontSize: 32,
    marginHorizontal: 12,
    color: '#FFF',
    opacity: 0.4,
  },
  dashboardTotal: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    opacity: 0.6,
  },
  dashboardLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  instructions: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 30,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLine: {
    flex: 1,
    height: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
  },
  listContainer: {
    // gaps managed by marginBottom in listItem
  },
  listItem: {
    width: '100%',
    borderRadius: Radius.lg,
  },
  listItemInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
    position: 'relative',
  },
  iconHexagon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emojiIconLarge: {
    fontSize: 28,
  },
  emojiIconHuge: {
    fontSize: 34,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pinBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  rewardPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  rewardPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  testButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7C5CFC',
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: 'rgba(124, 92, 252, 0.1)',
  },
  testButtonText: {
    color: '#7C5CFC',
    fontSize: 14,
    fontWeight: '700',
  }
});
