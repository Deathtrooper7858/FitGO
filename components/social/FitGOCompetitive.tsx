import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Trophy, Users, Crown, Copy, LogOut, Plus, Hash, Star, ChevronRight, X, Sword, Trash2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useIsPro } from '../../hooks/useIsPro';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore, useSocialStore, useSettingsStore, useNutritionStore } from '../../store';
import { useLeagueStore, LeagueTier, SquadMember, Squad } from '../../store/leagueStore';
import MacroRewardAnimation from '../MacroRewardAnimation';
import { getNameStyle, getSafeColor } from '../../utils/styles';
import { CustomAlert, AlertType } from '../CustomAlert';
import { supabase } from '../../services/supabase';

import FitGOChallenges from './FitGOChallenges';

// ─── Liga Config ──────────────────────────────────────────────────────────────

const LEAGUE_CONFIG: Record<LeagueTier, {
  labelKey: string;
  colors: [string, string, string];
  glow: string;
  emoji: string;
  pointsNeeded: number;
  descriptionKey: string;
}> = {
  bronce: {
    labelKey: 'competitive.leagues.bronce.name',
    colors: ['#1A1008', '#8B6914', '#1A1008'],
    glow: '#CD7F32',
    emoji: '🥉',
    pointsNeeded: 0,
    descriptionKey: 'competitive.leagues.bronce.desc',
  },
  plata: {
    labelKey: 'competitive.leagues.plata.name',
    colors: ['#141418', '#9CA3AF', '#141418'],
    glow: '#C0C0C0',
    emoji: '🥈',
    pointsNeeded: 200,
    descriptionKey: 'competitive.leagues.plata.desc',
  },
  oro: {
    labelKey: 'competitive.leagues.oro.name',
    colors: ['#1A1400', '#FFD700', '#1A1400'],
    glow: '#FFD700',
    emoji: '🥇',
    pointsNeeded: 500,
    descriptionKey: 'competitive.leagues.oro.desc',
  },
  platino: {
    labelKey: 'competitive.leagues.platino.name',
    colors: ['#0A1A2A', '#A8D8EA', '#0A1A2A'],
    glow: '#A8D8EA',
    emoji: '💎',
    pointsNeeded: 1000,
    descriptionKey: 'competitive.leagues.platino.desc',
  },
  esmeralda: {
    labelKey: 'competitive.leagues.esmeralda.name',
    colors: ['#001A0A', '#50C878', '#001A0A'],
    glow: '#50C878',
    emoji: '🟢',
    pointsNeeded: 2000,
    descriptionKey: 'competitive.leagues.esmeralda.desc',
  },
  diamante: {
    labelKey: 'competitive.leagues.diamante.name',
    colors: ['#0D0D2E', '#88CCFF', '#0D0D2E'],
    glow: '#88CCFF',
    emoji: '💠',
    pointsNeeded: 3500,
    descriptionKey: 'competitive.leagues.diamante.desc',
  },
  maestro: {
    labelKey: 'competitive.leagues.maestro.name',
    colors: ['#1A001A', '#A855F7', '#1A001A'],
    glow: '#A855F7',
    emoji: '🔮',
    pointsNeeded: 5000,
    descriptionKey: 'competitive.leagues.maestro.desc',
  },
  leyenda: {
    labelKey: 'competitive.leagues.leyenda.name',
    colors: ['#1A0500', '#FF6B35', '#1A0500'],
    glow: '#FF6B35',
    emoji: '🔥',
    pointsNeeded: 7500,
    descriptionKey: 'competitive.leagues.leyenda.desc',
  },
  titan: {
    labelKey: 'competitive.leagues.titan.name',
    colors: ['#0A0010', '#FF0055', '#0A0010'],
    glow: '#FF0055',
    emoji: '⚡',
    pointsNeeded: 10000,
    descriptionKey: 'competitive.leagues.titan.desc',
  },
  celestial: {
    labelKey: 'competitive.leagues.celestial.name',
    colors: ['#000814', '#FFD700', '#000814'],
    glow: '#FFD700',
    emoji: '👑',
    pointsNeeded: 15000,
    descriptionKey: 'competitive.leagues.celestial.desc',
  },
};

// ─── Components ───────────────────────────────────────────────────────────────

function LeagueBadge({ tier, size = 'md' }: { tier: LeagueTier; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = LEAGUE_CONFIG[tier] || LEAGUE_CONFIG.bronce;
  const dim = size === 'sm' ? 44 : size === 'lg' ? 88 : 64;
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 40 : 28;
  return (
    <LinearGradient
      colors={cfg.colors as any}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.leagueBadge,
        {
          width: dim, height: dim, borderRadius: dim / 2,
          shadowColor: cfg.glow, shadowOpacity: 0.8, shadowRadius: 16, elevation: 12,
          borderColor: cfg.glow + '60', borderWidth: 2,
        }
      ]}
    >
      <View style={{
        width: dim - 8, height: dim - 8, borderRadius: (dim - 8) / 2,
        borderWidth: 1, borderColor: cfg.glow + '30',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize }}>{cfg.emoji}</Text>
      </View>
    </LinearGradient>
  );
}


function MemberRow({ member, rank, onRemove, isMe, onInspect, onMakeLeader, streakOverride }: { member: SquadMember; rank: number; onRemove?: () => void; isMe?: boolean; onInspect?: () => void; onMakeLeader?: () => void; streakOverride?: number }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { premiumColor } = useSettingsStore();

  // Use the local (always-accurate) streak for the current user's row,
  // falling back to DB value for other members.
  const displayStreak = (isMe && streakOverride !== undefined) ? streakOverride : member.current_streak;

  const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : colors.textSecondary;
  return (
    <TouchableOpacity 
      activeOpacity={onInspect ? 0.7 : 1} 
      onPress={onInspect} 
      style={[styles.memberRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Text style={[styles.rankText, { color: rankColor }]}>#{rank}</Text>
      <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '30', overflow: 'hidden' }]}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: 18, color: colors.textPrimary }}>{member.name?.[0]?.toUpperCase() ?? '?'}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.memberName, { color: colors.textPrimary }, getNameStyle(member.name_color, member.user_id, profile?.id, profile?.nameColor, premiumColor)]} numberOfLines={1}>{member.name}</Text>
        <Text style={[styles.memberSub, { color: colors.textSecondary }]}>
          🔥 {displayStreak} {t('competitive.squads.days', 'días')}
        </Text>
      </View>
      <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.pointsBadgeText, { color: colors.primary }]}>
          {member.league_points.toLocaleString()} pts
        </Text>
      </View>
      {onMakeLeader && !isMe && (
        <TouchableOpacity style={{ marginLeft: 8, padding: 6, backgroundColor: '#F59E0B15', borderRadius: 8 }} onPress={onMakeLeader}>
          <Crown size={16} color="#F59E0B" />
        </TouchableOpacity>
      )}
      {onRemove && !isMe && (
        <TouchableOpacity style={{ marginLeft: 8, padding: 6, backgroundColor: '#EF444415', borderRadius: 8 }} onPress={onRemove}>
          <X size={16} color="#EF4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function EmptySquad({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const socialStore = useSocialStore();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      socialStore.fetchSquadInvitations(profile.id).then(invites => {
        setInvitations(invites);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [profile?.id, socialStore]);

  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(255,215,0,0.06)', 'transparent']}
        style={styles.emptyGlow}
      />
      <View style={[styles.emptyIconWrap, { borderColor: colors.border }]}>
        <Trophy size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('competitive.squads.emptyTitle', 'Guerras de Macros')}</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        {t('competitive.squads.emptySub', 'Únete o crea un Squad con hasta 4 amigos. Cumplan sus macros diarios, acumulen puntos y suban de liga juntos.')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 }}>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreate(); }}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.emptyBtnText}>{t('competitive.squads.createSquad', 'Crear Squad')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyBtnOutline, { borderColor: colors.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onJoin(); }}
        >
          <Hash size={18} color={colors.primary} />
          <Text style={[styles.emptyBtnText, { color: colors.primary }]}>{t('competitive.squads.joinSquad', 'Unirme')}</Text>
        </TouchableOpacity>
      </View>

      {!loading && invitations.length > 0 && (
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12, paddingHorizontal: 4 }}>
            {t('competitive.squads.invitations', 'Tus Invitaciones')} ({invitations.length})
          </Text>
          {invitations.map((inv) => {
            const match = inv.content.match(/código de invitación:\s*([a-zA-Z0-9]+)/i);
            const code = match ? match[1] : null;
            return (
              <View key={inv.id} style={{ width: '100%', backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                {inv.sender?.avatar_url ? (
                  <Image source={{ uri: inv.sender.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{inv.sender?.name?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{inv.sender?.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{t('competitive.squads.invitedToSquad', 'Te ha invitado a un squad.')}</Text>
                </View>
                {code ? (
                  <TouchableOpacity
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const store = useLeagueStore.getState();
                      if (profile?.id) {
                        const ok = await store.joinSquadByCode(code, profile.id);
                        if (ok) {
                          store.fetchMySquad(profile.id);
                        } else {
                          Alert.alert(t('common.error'), store.error || t('competitive.squads.joinFailed'));
                        }
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('common.accept', 'Aceptar')}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontStyle: 'italic' }}>{t('common.invalid', 'Inválido')}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({ squad, position, onInspect }: { squad: Squad; position: number; onInspect: (s: Squad) => void }) {
  const colors = useTheme();

  const cfg = LEAGUE_CONFIG[squad.league_tier];
  const podiumColors: Record<number, { medal: string; height: number; glow: string }> = {
    1: { medal: '🥇', height: 110, glow: '#FFD700' },
    2: { medal: '🥈', height: 80, glow: '#C0C0C0' },
    3: { medal: '🥉', height: 60, glow: '#CD7F32' },
  };
  const pd = podiumColors[position] || { medal: `#${position}`, height: 40, glow: colors.primary };

  return (
    <TouchableOpacity
      style={[styles.podiumCard, { shadowColor: pd.glow }]}
      onPress={() => { Haptics.selectionAsync(); onInspect(squad); }}
      activeOpacity={0.82}
    >
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{pd.medal}</Text>
      <LeagueBadge tier={squad.league_tier} size="sm" />
      <Text style={[styles.podiumSquadName, { color: colors.textPrimary }]} numberOfLines={2}>
        {squad.name}
      </Text>
      <View style={[styles.podiumPts, { backgroundColor: cfg.glow + '20' }]}>
        <Text style={{ color: cfg.glow, fontSize: 11, fontWeight: '800' }}>
          {squad.points.toLocaleString()} pts
        </Text>
      </View>
      {/* Podium bar */}
      <LinearGradient
        colors={[pd.glow + '35', pd.glow + '05']}
        style={[styles.podiumBar, { height: pd.height, borderColor: pd.glow + '50', borderTopWidth: 2 }]}
      />
    </TouchableOpacity>
  );
}

function LocalFireStreakBadge({ streakDays, style, size = 'default' }: { streakDays: number; style?: any; size?: 'small' | 'default' | 'large' }) {
  const isOnFire = (streakDays || 0) >= 3;
  
  const pulseOpacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isOnFire) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 0;
      scale.value = 1;
    }
  }, [isOnFire, pulseOpacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: scale.value }]
  }));

  const fontSize = size === 'large' ? 24 : size === 'small' ? 14 : 16;
  const paddingVertical = size === 'large' ? 8 : 4;
  const paddingHorizontal = size === 'large' ? 16 : 12;

  return (
    <View style={[{ position: 'relative', alignItems: 'center', justifyContent: 'center', paddingHorizontal, paddingVertical }, style]}>
      {isOnFire && (
        <Animated.View style={[
          {
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: '#FF6B00',
            borderRadius: 16,
            shadowColor: '#FF6B00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 10,
          },
          animatedStyle
        ]} />
      )}
      <Text style={{ 
        color: isOnFire ? '#FFF' : '#FF6B00', 
        fontWeight: isOnFire ? '900' : '900',
        fontSize,
        textShadowColor: isOnFire ? 'rgba(255,255,255,0.8)' : 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: isOnFire ? 4 : 0
      }}>
        🔥 {streakDays || 0}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface FitGOCompetitiveProps {
  initialSection?: 'ranking' | 'my-squad' | 'challenges';
  onNavigateToSocial?: () => void;
}

export default function FitGOCompetitive({
  initialSection = 'ranking',
  onNavigateToSocial
}: FitGOCompetitiveProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { premiumColor } = useSettingsStore();
  const isProActually = useIsPro();
  const squad = useLeagueStore(s => s.squad);
  const members = useLeagueStore(s => s.members);
  const mySquadPoints = useLeagueStore(s => s.mySquadPoints);
  const loading = useLeagueStore(s => s.loading);
  const fetchMySquad = useLeagueStore(s => s.fetchMySquad);
  const leaveSquad = useLeagueStore(s => s.leaveSquad);
  const createSquad = useLeagueStore(s => s.createSquad);
  const joinSquadByCode = useLeagueStore(s => s.joinSquadByCode);
  const rewardVisible = useLeagueStore(s => s.rewardVisible);
  const rewardPoints = useLeagueStore(s => s.rewardPoints);
  const hideReward = useLeagueStore(s => s.hideReward);
  const topSquads = useLeagueStore(s => s.topSquads);
  const fetchTopSquads = useLeagueStore(s => s.fetchTopSquads);
  const streakDays = useNutritionStore(s => s.streakDays);
  
  // Sync streak to DB only when streakDays actually *changes* (not on every mount)
  const isFirstStreakSync = useRef(true);
  useEffect(() => {
    if (isFirstStreakSync.current) {
      isFirstStreakSync.current = false;
      return; // skip mount — value is already in DB from last session
    }
    const profile = useAuthStore.getState().profile;
    if (profile?.id && streakDays !== undefined) {
      void supabase
        .from('users')
        .update({ current_streak: streakDays })
        .eq('id', profile.id);
      useLeagueStore.setState({ myStreak: streakDays });
    }
  }, [streakDays]); // Only runs when streak changes

  const socialStore = useSocialStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [inspectingSquad, setInspectingSquad] = useState<Squad | null>(null);
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingSquadMembers, setInspectingSquadMembers] = useState<SquadMember[]>([]);
  const [loadingInspectMembers, setLoadingInspectMembers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'my-squad' | 'ranking' | 'challenges'>(initialSection);
  const [rankingSubTab, setRankingSubTab] = useState<'squads' | 'individual'>('individual');
  const [showRankingInfo, setShowRankingInfo] = useState(false);
  const [showRanksList, setShowRanksList] = useState(false);
  const [showSquadInfo, setShowSquadInfo] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);
  
  const [alert, setAlert] = useState<{
    visible: boolean; type: AlertType; title: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel?: () => void;
  }>({ visible: false, type: 'info', title: '', message: '', onConfirm: () => {} });

  const handleInspectSquad = async (s: Squad) => {
    Haptics.selectionAsync();
    setInspectingSquad(s);
    setLoadingInspectMembers(true);
    const members = await useLeagueStore.getState().fetchSquadMembers(s.id);
    setInspectingSquadMembers(members);
    setLoadingInspectMembers(false);
  };

  // Swipe between ranking / my-squad / challenges
  // ← izquierda: ranking → my-squad → challenges
  // → derecha:  challenges → my-squad → ranking → (Social/Planner tab)
  const SECTIONS: ('ranking' | 'my-squad' | 'challenges')[] = ['ranking', 'my-squad', 'challenges'];
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-35, 35])
    .failOffsetY([-12, 12])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 80) {
        const dir = e.translationX > 0 ? -1 : 1;
        const idx = SECTIONS.indexOf(activeSection);
        const next = idx + dir;
        if (next >= 0 && next < SECTIONS.length) {
          Haptics.selectionAsync();
          setActiveSection(SECTIONS[next]);
        } else if (next < 0) {
          Haptics.selectionAsync();
          if (onNavigateToSocial) {
            onNavigateToSocial();
          } else {
            if (!isProActually) {
              router.push('/modals/paywall');
            } else {
              router.push('/(tabs)/planner');
            }
          }
        }
      }
    });

  useEffect(() => {
    if (profile?.id) fetchMySquad(profile.id);
    fetchTopSquads();
    socialStore.fetchGlobalRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (profile?.id) await fetchMySquad(profile.id);
    await fetchTopSquads();
    await socialStore.fetchGlobalRanking(true); // force bypass cache on manual refresh
    setRefreshing(false);
  }, [profile?.id, fetchMySquad, fetchTopSquads, socialStore]);

  const getRankGrade = (points: number) => {
    if (points >= 15000) return { label: 'S++', color: '#FF0055', bg: '#FF005520' };
    if (points >= 10000) return { label: 'S+', color: '#FFD700', bg: '#FFD70020' };
    if (points >= 5000)  return { label: 'S',  color: '#A855F7', bg: '#A855F720' };
    if (points >= 2000)  return { label: 'A',  color: '#3B82F6', bg: '#3B82F620' };
    if (points >= 1000)  return { label: 'B',  color: '#10B981', bg: '#10B98120' };
    if (points >= 500)   return { label: 'C',  color: '#F59E0B', bg: '#F59E0B20' };
    if (points >= 100)   return { label: 'D',  color: '#8B4513', bg: '#8B451320' };
    return { label: 'F', color: '#6B7280', bg: '#6B728020' };
  };

  const handleCreate = async () => {
    if (!squadName.trim() || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = await createSquad(squadName.trim(), profile.id);
    if (!result) {
      Alert.alert(t('common.error'), useLeagueStore.getState().error || t('competitive.squads.createFailed'));
      return;
    }
    setShowCreate(false);
    setSquadName('');
    setActiveSection('my-squad');
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await joinSquadByCode(joinCode.trim(), profile.id);
    if (ok) {
      setShowJoin(false);
      setJoinCode('');
      setActiveSection('my-squad');
    } else {
      Alert.alert(t('common.error'), useLeagueStore.getState().error || t('competitive.squads.joinFailed'));
    }
  };

  const handleLeave = () => {
    setAlert({
      visible: true,
      type: 'warning',
      title: t('competitive.squads.leaveSquadTitle', 'Salir del Squad'),
      message: t('competitive.squads.leaveSquadMsg', '¿Estás seguro de que deseas salir del squad?'),
      confirmText: t('competitive.squads.leave', 'Salir'),
      cancelText: t('common.cancel', 'Cancelar'),
      onConfirm: () => {
        if (profile?.id) leaveSquad(profile.id);
        setAlert(prev => ({ ...prev, visible: false }));
      },
      onCancel: () => setAlert(prev => ({ ...prev, visible: false }))
    });
  };

  const leagueCfg = squad ? LEAGUE_CONFIG[squad.league_tier] : LEAGUE_CONFIG.bronce;
  const top3 = topSquads.slice(0, 3);
  const rest = topSquads.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <CustomAlert 
        visible={alert.visible} 
        type={alert.type} 
        title={alert.title} 
        message={alert.message} 
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm} 
        onCancel={alert.onCancel}
      />
      <MacroRewardAnimation visible={rewardVisible} points={rewardPoints} onHide={hideReward} />

      {/* Section Toggle */}
      <View style={[styles.sectionToggle, { backgroundColor: colors.surfaceAlt }]}>
        <TouchableOpacity
          style={[styles.sectionToggleBtn, activeSection === 'ranking' && { backgroundColor: colors.surface }]}
          onPress={() => { Haptics.selectionAsync(); setActiveSection('ranking'); }}
        >
          <Trophy size={15} color={activeSection === 'ranking' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.sectionToggleText, { color: activeSection === 'ranking' ? colors.primary : colors.textSecondary }]}>
            {t('social.ranking.globalRanking', 'Ranking')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionToggleBtn, activeSection === 'my-squad' && { backgroundColor: colors.surface }]}
          onPress={() => { Haptics.selectionAsync(); setActiveSection('my-squad'); }}
        >
          <Users size={15} color={activeSection === 'my-squad' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.sectionToggleText, { color: activeSection === 'my-squad' ? colors.primary : colors.textSecondary }]}>
            {t('competitive.mySquad', 'My Squad')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionToggleBtn, activeSection === 'challenges' && { backgroundColor: colors.surface }]}
          onPress={() => { Haptics.selectionAsync(); setActiveSection('challenges'); }}
        >
          <Sword size={15} color={activeSection === 'challenges' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.sectionToggleText, { color: activeSection === 'challenges' ? colors.primary : colors.textSecondary }]}>
            {t('social.challenges.fitgoChallenges', 'Challenges')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content wrapped in swipe gesture */}
      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >

        {activeSection === 'challenges' && (
          <FitGOChallenges />
        )}

        {/* ── RANKING SECTION ── */}
        {activeSection === 'ranking' && (
          <>
            {/* Sub-toggle: Squads vs Individual */}
            <View style={[styles.subToggle, { backgroundColor: colors.surfaceAlt }]}>
              <TouchableOpacity
                style={[styles.subToggleBtn, rankingSubTab === 'individual' && { backgroundColor: colors.surface }]}
                onPress={() => { Haptics.selectionAsync(); setRankingSubTab('individual'); }}
              >
                <Users size={14} color={rankingSubTab === 'individual' ? colors.primary : colors.textMuted} />
                <Text style={[styles.subToggleText, { color: rankingSubTab === 'individual' ? colors.primary : colors.textMuted }]}>
                  {t('competitive.individual', 'Individual')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subToggleBtn, rankingSubTab === 'squads' && { backgroundColor: colors.surface }]}
                onPress={() => { Haptics.selectionAsync(); setRankingSubTab('squads'); }}
              >
                <Trophy size={14} color={rankingSubTab === 'squads' ? colors.primary : colors.textMuted} />
                <Text style={[styles.subToggleText, { color: rankingSubTab === 'squads' ? colors.primary : colors.textMuted }]}>
                  Squads
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── SQUADS RANKING ── */}
            {rankingSubTab === 'squads' && (
              <>
                <View style={styles.rankingHeader}>
                  <Text style={[styles.rankingTitle, { color: colors.textPrimary }]}>🏆 {t('competitive.squads.podiumTitle', 'Podio de Ligas')}</Text>
                  <Text style={[styles.rankingSub, { color: colors.textSecondary }]}>
                    {t('competitive.squads.podiumSub', 'Los mejores squads de FitGO Competitive')}
                  </Text>
                </View>

                {topSquads.length === 0 && !loading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Trophy size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
                    <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                      {t('competitive.squads.noSquads', 'Aún no hay squads en el ranking.') + '\n' + t('competitive.squads.beFirst', '¡Sé el primero!')}
                    </Text>
                  </View>
                ) : loading && topSquads.length === 0 ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} size="large" />
                ) : (
                  <>
                    <View style={styles.podiumContainer}>
                      {top3[1] && <View style={styles.podiumSlot}><PodiumCard squad={top3[1]} position={2} onInspect={handleInspectSquad} /></View>}
                      {top3[0] && <View style={[styles.podiumSlot, { zIndex: 2 }]}><PodiumCard squad={top3[0]} position={1} onInspect={handleInspectSquad} /></View>}
                      {top3[2] && <View style={styles.podiumSlot}><PodiumCard squad={top3[2]} position={3} onInspect={handleInspectSquad} /></View>}
                    </View>

                    {rest.length > 0 && (
                      <View style={[styles.restList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>{t('competitive.squads.generalRanking', 'Clasificación General')}</Text>
                        {rest.map((s, i) => {
                          const cfg = LEAGUE_CONFIG[s.league_tier];
                          return (
                            <TouchableOpacity
                              key={s.id}
                              style={[styles.restRow, { borderBottomColor: colors.border + '40' }]}
                              onPress={() => handleInspectSquad(s)}
                            >
                              <Text style={[styles.restRank, { color: colors.textMuted }]}>#{i + 4}</Text>
                              <LeagueBadge tier={s.league_tier} size="sm" />
                              <Text style={[styles.restName, { color: colors.textPrimary }]} numberOfLines={1}>{s.name}</Text>
                              <View style={{ backgroundColor: cfg.glow + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                <Text style={{ color: cfg.glow, fontSize: 11, fontWeight: '800' }}>{s.points.toLocaleString()} pts</Text>
                              </View>
                              <ChevronRight size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── INDIVIDUAL RANKING ── */}
            {rankingSubTab === 'individual' && (() => {
              const myRankInfo = socialStore.globalRanking.find(u => u.id === profile?.id);
              const myRankIndex = socialStore.globalRanking.findIndex(u => u.id === profile?.id);
              const myGrade = myRankInfo ? getRankGrade(myRankInfo.points) : getRankGrade(0);
              return (
                <>
                  <View style={styles.rankingHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={[styles.rankingTitle, { color: colors.textPrimary }]}>🌍 {t('social.ranking.globalRanking', 'Ranking Global')}</Text>
                        <Text style={[styles.rankingSub, { color: colors.textSecondary }]}>{t('competitive.individual.subtitle', 'Ranking individual de usuarios')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: colors.primary + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => setShowRanksList(true)}
                        >
                          <Trophy size={14} color={colors.primary} />
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{t('competitive.ranks', 'RANGOS')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#F59E0B18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                          onPress={() => setShowRankingInfo(true)}
                        >
                          <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>INFO</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* My position card */}
                  {myRankInfo && (
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => setShowRanksList(true)}
                      style={[styles.myRankCard, { backgroundColor: colors.surface, borderColor: myGrade.color + '50', borderLeftColor: myGrade.color }]}
                    >
                      <View style={[styles.myRankBadge, { backgroundColor: myGrade.bg }]}>
                        <Text style={{ color: myGrade.color, fontSize: 18, fontWeight: '900' }}>{myGrade.label}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{t('social.ranking.currentRank', 'Your Current Rank')}</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>#{myRankIndex + 1} {t('social.ranking.inWorld', 'in the world')}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>{Math.round(myRankInfo.points)}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>{t('social.ranking.points', 'POINTS')}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Global list */}
                  <View style={[styles.restList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>{t('social.ranking.globalRanking', 'Global Ranking')}</Text>
                    {socialStore.isRankingLoading && socialStore.globalRanking.length === 0 ? (
                      <ActivityIndicator color="#F59E0B" />
                    ) : (
                      socialStore.globalRanking.map((user, index) => {
                        const grade = getRankGrade(user.points);
                        const isMe = user.id === profile?.id;
                        return (
                          <TouchableOpacity
                            key={user.id}
                            activeOpacity={0.7}
                            onPress={() => { Haptics.selectionAsync(); setInspectingUser(user); }}
                            style={[
                              styles.restRow,
                              { borderBottomColor: colors.border + '33' },
                              isMe && { backgroundColor: colors.primary + '08' },
                            ]}
                          >
                            <Text style={[
                              styles.restRank,
                              { color: index < 3 ? '#F59E0B' : colors.textMuted, minWidth: 28 },
                            ]}>
                              {index < 3 ? ['🥇','🥈','🥉'][index] : `#${index + 1}`}
                            </Text>
                            <View style={{ position: 'relative' }}>
                              {user.avatar_url ? (
                                <Image source={{ uri: user.avatar_url }} style={styles.rankAvatar} />
                              ) : (
                                <View style={[styles.rankAvatarPlaceholder, { backgroundColor: isMe ? colors.primary : colors.surfaceAlt }]}>
                                  <Text style={{ color: isMe ? '#fff' : colors.textSecondary, fontWeight: 'bold', fontSize: 14 }}>
                                    {user.name?.[0]?.toUpperCase()}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.restName, { color: colors.textPrimary }, getNameStyle(user.name_color, user.id, profile?.id, profile?.nameColor, premiumColor)]} numberOfLines={1}>{user.name}</Text>
                                {isMe && <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{t('competitive.you', 'TÚ')}</Text>}
                                <View style={{ backgroundColor: grade.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                  <Text style={{ color: grade.color, fontSize: 10, fontWeight: '900' }}>{grade.label}</Text>
                                </View>
                              </View>
                              <Text style={[styles.memberSub, { color: colors.textSecondary, marginTop: 2 }]}>
                                🔥 {isMe ? streakDays : (user.current_streak || 0)} {t('competitive.squads.days', 'días')}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{Math.round(user.points)}</Text>
                              <Text style={{ color: colors.textMuted, fontSize: 10 }}>pts</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>

                  {/* Ranks modal */}
                  <Modal visible={showRanksList} transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                      <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Trophy size={22} color={colors.primary} />
                            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{t('competitive.ranksList', 'Rangos Individuales')}</Text>
                          </View>
                          <TouchableOpacity onPress={() => setShowRanksList(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 14 }}>
                            <X size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                          <View style={{ gap: 8, paddingBottom: 16 }}>
                            {[
                              { label: 'S++', pts: 15000, color: '#FF0055', bg: '#FF005520' },
                              { label: 'S+', pts: 10000, color: '#FFD700', bg: '#FFD70020' },
                              { label: 'S', pts: 5000, color: '#A855F7', bg: '#A855F720' },
                              { label: 'A', pts: 2000, color: '#3B82F6', bg: '#3B82F620' },
                              { label: 'B', pts: 1000, color: '#10B981', bg: '#10B98120' },
                              { label: 'C', pts: 500, color: '#F59E0B', bg: '#F59E0B20' },
                              { label: 'D', pts: 100, color: '#8B4513', bg: '#8B451320' },
                              { label: 'F', pts: 0, color: '#6B7280', bg: '#6B728020' },
                            ].map((rankItem) => (
                              <View key={rankItem.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, gap: 12 }}>
                                <View style={[styles.myRankBadge, { backgroundColor: rankItem.bg, width: 40, height: 40 }]}>
                                  <Text style={{ color: rankItem.color, fontSize: 16, fontWeight: '900' }}>{rankItem.label}</Text>
                                </View>
                                <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{t('competitive.rankLabel', { label: rankItem.label, defaultValue: `Rank ${rankItem.label}` })}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14 }}>{rankItem.pts.toLocaleString()}</Text>
                                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>pts</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </ScrollView>

                        <TouchableOpacity
                          style={{ marginTop: 10, backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' }}
                          onPress={() => setShowRanksList(false)}
                        >
                          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{t('common.close', 'Cerrar')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>

                  {/* Info modal */}
                  <Modal visible={showRankingInfo} transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                      <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Trophy size={22} color="#F59E0B" />
                            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{t('competitive.howItWorks', '¿Cómo funciona?')}</Text>
                          </View>
                          <TouchableOpacity onPress={() => setShowRankingInfo(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 14 }}>
                            <X size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {/* Points breakdown */}
                        <View style={{ gap: 10, marginBottom: 16 }}>
                          {[
                            { icon: '🍽️', label: t('competitive.points.logMeal', 'Registrar una comida'), pts: '+10 pts' },
                            { icon: '🎯', label: t('competitive.points.perfectMacros', 'Macros perfectos (±5%)'), pts: '+100 pts' },
                            { icon: '⚡', label: t('competitive.points.squadSynergy', 'Sinergia de Squad'), pts: '+50 pts' },
                          ].map((row) => (
                            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, gap: 10 }}>
                              <Text style={{ fontSize: 20 }}>{row.icon}</Text>
                              <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{row.label}</Text>
                              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{row.pts}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Streak multipliers */}
                        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14, marginBottom: 8 }}>🔥 {t('competitive.streakMultipliers', 'Multiplicadores de Racha')}</Text>
                        <View style={{ gap: 6, marginBottom: 16 }}>
                          {[
                            { range: t('competitive.streak.days3to7', '3–7 días'), mult: '×1.2', color: '#F59E0B' },
                            { range: t('competitive.streak.days8to14', '8–14 días'), mult: '×1.5', color: '#F97316' },
                            { range: t('competitive.streak.days15plus', '15+ días'), mult: '×2.0', color: '#EF4444' },
                          ].map((row) => (
                            <View key={row.range} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: row.color + '15', borderRadius: 10 }}>
                              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{row.range}</Text>
                              <Text style={{ color: row.color, fontWeight: '900', fontSize: 15 }}>{row.mult}</Text>
                            </View>
                          ))}
                        </View>

                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                          {t('competitive.streakDesc', 'El multiplicador se aplica a cada punto ganado mientras tu racha esté activa. ¡Sé constante y sube más rápido!')}
                        </Text>
                        <TouchableOpacity
                          style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' }}
                          onPress={() => setShowRankingInfo(false)}
                        >
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('common.understood', 'Entendido 👊')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              );
            })()}
          </>
        )}

        {/* ── MY SQUAD SECTION ── */}
        {activeSection === 'my-squad' && (
          <>
            {loading && !squad ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} size="large" />
            ) : !squad ? (
              <EmptySquad onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
            ) : (
              <>
                {/* Liga Banner */}
                <LinearGradient
                  colors={leagueCfg.colors as any}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.leagueBanner, { borderColor: leagueCfg.glow + '40' }]}
                >
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.leagueBannerContent}>
                    <LeagueBadge tier={squad.league_tier} size="lg" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.leagueName, { color: '#fff', textShadowColor: leagueCfg.glow, textShadowRadius: 8 }]}>
                        {t(leagueCfg.labelKey)}
                      </Text>
                      <Text style={[styles.leagueDesc, { color: 'rgba(255,255,255,0.65)' }]}>
                        {t(leagueCfg.descriptionKey)}
                      </Text>
                      <View style={[styles.totalPoints, { backgroundColor: leagueCfg.glow + '25' }]}>
                        <Text style={{ color: leagueCfg.glow, fontWeight: '700', fontSize: 13 }}>
                          {members.reduce((sum, m) => sum + (m.league_points || 0), 0).toLocaleString()} {t('competitive.squads.totalPoints', 'pts totales del squad')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>

                {/* Squad Info */}
                <View style={[styles.squadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.squadCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.squadName, getNameStyle((squad as any).created_by_profile?.name_color, squad.created_by, profile?.id, profile?.nameColor, premiumColor)]}>{squad.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={14} color={colors.textSecondary} />
                        <Text style={[styles.squadMeta, { color: colors.textSecondary }]}>
                          {members.length}/5 {t('competitive.squads.members', 'miembros')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.codeChip, 
                        copied 
                          ? { backgroundColor: '#10B98120', borderColor: '#10B98150' }
                          : { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }
                      ]}
                      onPress={async () => {
                        await Clipboard.setStringAsync(squad.invite_code);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? (
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>¡Copiado!</Text>
                      ) : (
                        <>
                          <Hash size={13} color={colors.primary} />
                          <Text style={[styles.codeText, { color: colors.primary }]}>{squad.invite_code}</Text>
                          <Copy size={13} color={colors.primary} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* My Stats */}
                <View style={styles.statsRow}>
                  <LinearGradient
                    colors={[colors.primary + '20', colors.primary + '08']}
                    style={[styles.statCard, { borderColor: colors.primary + '30' }]}
                  >
                    <Text style={[styles.statValue, { color: colors.primary }]}>{mySquadPoints.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('competitive.squads.myPoints', 'Mis puntos')}</Text>
                  </LinearGradient>
                  <LinearGradient
                    colors={['#FF6B0020', '#FF6B0008']}
                    style={[styles.statCard, { borderColor: '#FF6B0030', justifyContent: 'center' }]}
                  >
                    <LocalFireStreakBadge streakDays={streakDays} size="large" style={{ marginBottom: 4 }} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('competitive.squads.streakDays', 'Días racha')}</Text>
                  </LinearGradient>
                </View>

                {/* Leaderboard */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('competitive.squads.rankingTitle', 'Clasificación del Squad')}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#F59E0B18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                    onPress={() => setShowSquadInfo(true)}
                  >
                    <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>INFO</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8 }}>
                  {members.map((m, i) => (
                    <MemberRow 
                      key={m.user_id} 
                      member={m} 
                      rank={i + 1} 
                      isMe={m.user_id === profile?.id}
                      streakOverride={m.user_id === profile?.id ? streakDays : undefined}
                      onInspect={() => { Haptics.selectionAsync(); setInspectingUser({ id: m.user_id, name: m.name, avatar_url: m.avatar_url, points: m.total_league_points ?? m.league_points, current_streak: m.current_streak, name_color: m.name_color }); }}
                      onMakeLeader={squad.created_by === profile?.id ? () => {
                        setAlert({
                          visible: true,
                          type: 'warning',
                          title: t('competitive.squads.transferLeaderTitle', 'Pasar Liderazgo'),
                          message: t('competitive.squads.transferLeaderMsg', '¿Pasar el liderazgo del squad a {{name}}? Perderás los permisos de creador.').replace('{{name}}', m.name),
                          confirmText: t('common.confirm', 'Confirmar'),
                          cancelText: t('common.cancel', 'Cancelar'),
                          onConfirm: async () => {
                            const success = await useLeagueStore.getState().transferLeadership(squad.id, m.user_id);
                            if (success) {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            setAlert(prev => ({ ...prev, visible: false }));
                          },
                          onCancel: () => setAlert(prev => ({ ...prev, visible: false }))
                        });
                      } : undefined}
                      onRemove={squad.created_by === profile?.id ? () => {
                        setAlert({
                          visible: true,
                          type: 'warning',
                          title: t('competitive.squads.removeMemberTitle', 'Expulsar integrante'),
                          message: t('competitive.squads.removeMemberMsg', '¿Estás seguro de que quieres expulsar a {{name}} del squad?').replace('{{name}}', m.name),
                          confirmText: t('competitive.squads.remove', 'Expulsar'),
                          cancelText: t('common.cancel', 'Cancelar'),
                          onConfirm: async () => {
                            const success = await useLeagueStore.getState().removeMember(squad.id, m.user_id);
                            if (success) {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            setAlert(prev => ({ ...prev, visible: false }));
                          },
                          onCancel: () => setAlert(prev => ({ ...prev, visible: false }))
                        });
                      } : undefined}
                    />
                  ))}
                </View>

                {squad.created_by === profile?.id && members.length < 5 && (
                  <TouchableOpacity 
                    style={{ marginTop: 16, backgroundColor: colors.primary + '20', padding: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary + '40' }}
                    onPress={() => {
                      socialStore.fetchFriends(profile?.id || '');
                      setShowInviteModal(true);
                    }}
                  >
                    <Plus size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{t('competitive.squads.inviteFriends', 'Invitar Amigos')}</Text>
                  </TouchableOpacity>
                )}

                {/* Leagues Progress */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 28 }]}>{t('competitive.squads.pathToElite', 'Camino a la Élite')}</Text>
                {(Object.entries(LEAGUE_CONFIG) as [LeagueTier, typeof LEAGUE_CONFIG[LeagueTier]][]).map(([tier, cfg]) => {
                  const isCurrent = tier === squad.league_tier;
                  const reached = squad.points >= cfg.pointsNeeded;
                  return (
                    <View
                      key={tier}
                      style={[
                        styles.tierRow,
                        { borderColor: isCurrent ? cfg.glow : colors.border, backgroundColor: colors.surface },
                        isCurrent && { shadowColor: cfg.glow, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
                      ]}
                    >
                      <LeagueBadge tier={tier} size="sm" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tierName, { color: isCurrent ? cfg.glow : colors.textPrimary }]}>
                          {t(cfg.labelKey)} {isCurrent && t('competitive.current', '← Actual')}
                        </Text>
                        <Text style={[styles.tierPts, { color: colors.textSecondary }]}>
                          {cfg.pointsNeeded.toLocaleString()} {t('profile.points', 'puntos')}
                        </Text>
                      </View>
                      {reached && !isCurrent && (
                        <Text style={{ color: '#10B981', fontSize: 18 }}>✓</Text>
                      )}
                    </View>
                  );
                })}

                {/* Leave / Delete */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
                  <TouchableOpacity style={[styles.leaveBtn, { flex: 1, marginTop: 0, borderColor: colors.error + '50' }]} onPress={handleLeave}>
                    <LogOut size={16} color={colors.error} />
                    <Text style={[styles.leaveBtnText, { color: colors.error }]}>{t('competitive.squads.leaveSquad', 'Salir')}</Text>
                  </TouchableOpacity>
                  {squad.created_by === profile?.id && (
                    <TouchableOpacity style={[styles.leaveBtn, { flex: 1, marginTop: 0, backgroundColor: colors.error + '15', borderColor: colors.error + '50' }]} onPress={() => {
                      setAlert({
                        visible: true,
                        type: 'warning',
                        title: t('competitive.squads.deleteSquadTitle', 'Eliminar Squad'),
                        message: t('competitive.squads.deleteSquadMsg', '¿Estás seguro de que quieres eliminar tu squad permanentemente?'),
                        confirmText: t('competitive.squads.delete', 'Eliminar'),
                        cancelText: t('common.cancel', 'Cancelar'),
                        onConfirm: async () => {
                          if (squad?.id) {
                            await useLeagueStore.getState().deleteSquad(squad.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                          setAlert(prev => ({ ...prev, visible: false }));
                        },
                        onCancel: () => setAlert(prev => ({ ...prev, visible: false }))
                      });
                    }}>
                      <Trash2 size={16} color={colors.error} />
                      <Text style={[styles.leaveBtnText, { color: colors.error }]}>{t('competitive.squads.deleteSquad', 'Eliminar Squad')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}


          </>
        )}
      </ScrollView>
      </GestureDetector>

      {/* Squad Info Modal */}
      <Modal visible={showSquadInfo} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Trophy size={22} color="#F59E0B" />
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{t('competitive.squads.squadPoints', 'Puntos del Squad')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSquadInfo(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 14 }}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
              {t('competitive.squads.infoText', "Los puntos totales del squad son la suma de los puntos de todos sus integrantes.\n\nObtén más puntos al completar tus registros diarios, cumplir tus macros al pie de la letra y mantener una racha constante.\n\n¡Trabaja en equipo y motiva a tus amigos para subir juntos a la Liga Zenit!")}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' }}
              onPress={() => setShowSquadInfo(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('common.understood', 'Entendido 👊')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: colors.border, gap: 14 }}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('competitive.squads.createSquad', 'Crear Squad')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={t('competitive.squads.squadNamePlaceholder', 'Nombre de tu Squad...')}
              placeholderTextColor={colors.textMuted}
              value={squadName}
              onChangeText={setSquadName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
                <Text style={styles.modalBtnText}>{t('common.create', 'Crear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnOutline, { borderColor: colors.border }]} onPress={() => setShowCreate(false)}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancelar')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoin} transparent animationType="fade" onRequestClose={() => setShowJoin(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: colors.border, gap: 14 }}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('competitive.squads.joinWithCode', 'Unirme con Código')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={t('competitive.squads.codePlaceholder', 'Código del Squad (ej: ab12cd34)')}
              placeholderTextColor={colors.textMuted}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleJoin}>
                <Text style={styles.modalBtnText}>{t('competitive.squads.join', 'Unirme')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnOutline, { borderColor: colors.border }]} onPress={() => setShowJoin(false)}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancelar')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Squad Inspect Modal */}
      <Modal visible={!!inspectingSquad} transparent animationType="slide" onRequestClose={() => setInspectingSquad(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          {inspectingSquad && (() => {
            const cfg = LEAGUE_CONFIG[inspectingSquad.league_tier];
            const isMySquad = squad?.id === inspectingSquad.id;
            return (
              <View style={[styles.inspectSheet, { backgroundColor: colors.surface }]}>
                {/* Handle */}
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />

                <TouchableOpacity
                  style={{ position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 20, zIndex: 10 }}
                  onPress={() => setInspectingSquad(null)}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  {/* League badge */}
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <LeagueBadge tier={inspectingSquad.league_tier} size="lg" />
                    <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' }}>
                      {inspectingSquad.name}
                    </Text>
                    <View style={{ backgroundColor: cfg.glow + '20', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, marginTop: 8 }}>
                      <Text style={{ color: cfg.glow, fontWeight: '800', fontSize: 13 }}>
                        {t(cfg.labelKey)}  •  {inspectingSquad.points.toLocaleString()} pts
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16, paddingHorizontal: 4 }]}>{t('competitive.squads.members', 'Integrantes del Squad')}</Text>
                  
                  {loadingInspectMembers ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
                  ) : (
                    <View style={{ gap: 8, marginBottom: 24 }}>
                      {inspectingSquadMembers.length > 0 ? inspectingSquadMembers.map((m, i) => (
                        <MemberRow 
                          key={m.user_id} 
                          member={m} 
                          rank={i + 1} 
                          isMe={m.user_id === profile?.id}
                          streakOverride={m.user_id === profile?.id ? streakDays : undefined}
                          onInspect={() => { Haptics.selectionAsync(); setInspectingUser({ id: m.user_id, name: m.name, avatar_url: m.avatar_url, points: m.total_league_points ?? m.league_points, current_streak: m.current_streak, name_color: m.name_color }); }} 
                        />
                      )) : (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{t('competitive.squads.noMembers', 'No hay integrantes visibles.')}</Text>
                      )}
                    </View>
                  )}

                  {isMySquad ? (
                    <View style={[styles.infoChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                      <Star size={14} color={colors.primary} fill={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{t('competitive.squads.youAreHere', 'Estás en este squad')}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinSheetBtn, { overflow: 'hidden' }]}
                      onPress={() => {
                        setInspectingSquad(null);
                        setJoinCode(inspectingSquad.invite_code);
                        setActiveSection('my-squad');
                        setShowJoin(true);
                      }}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.secondary || '#A855F7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <Plus size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{t('competitive.squads.requestJoin', 'Solicitar Unirse')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>
      {/* Invite Friends Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide" onRequestClose={() => setShowInviteModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={[styles.inspectSheet, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />

            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 20, zIndex: 10 }}
              onPress={() => setShowInviteModal(false)}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16, paddingHorizontal: 4 }]}>{t('competitive.squads.inviteFriendsTitle', 'Invitar Amigos al Squad')}</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {socialStore.isFriendsLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
              ) : socialStore.friends.filter(f => f.status === 'accepted').length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>{t('competitive.squads.noFriendsToInvite', 'No tienes amigos agregados aún para invitar.')}</Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {socialStore.friends.filter(f => f.status === 'accepted').map(f => {
                    const friendProfile = f.friend_profile;
                    const isInvited = invitedFriends[f.id];
                    if (!friendProfile) return null;
                    return (
                      <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16 }}>
                        {friendProfile.avatar_url ? (
                          <Image source={{ uri: friendProfile.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{friendProfile.name?.[0]?.toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{friendProfile.name}</Text>
                        </View>
                        <TouchableOpacity
                          style={{ backgroundColor: isInvited ? colors.border : colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                          disabled={isInvited}
                          onPress={async () => {
                            Haptics.selectionAsync();
                            await socialStore.sendDirectMessage(
                              profile!.id,
                              friendProfile.id,
                              `¡Hola! Únete a mi squad en FitGO. Usa este código de invitación: ${squad?.invite_code}`
                            );
                            setInvitedFriends(prev => ({ ...prev, [f.id]: true }));
                          }}
                        >
                          <Text style={{ color: isInvited ? colors.textSecondary : '#fff', fontWeight: 'bold', fontSize: 13 }}>
                            {isInvited ? t('competitive.squads.sent', 'Enviado ✓') : t('competitive.squads.inviteBtn', 'Invitar')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Inspect Modal */}
      <Modal visible={!!inspectingUser} transparent animationType="fade" onRequestClose={() => setInspectingUser(null)}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {inspectingUser && (() => {
            const grade = getRankGrade(inspectingUser.points);
            const isMe = inspectingUser.id === profile?.id;
            
            const isFriend = socialStore.friends.some(f => 
              f.status === 'accepted' && (f.user_id_1 === inspectingUser.id || f.user_id_2 === inspectingUser.id)
            );
            const isPending = socialStore.friends.some(f => 
              f.status === 'pending' && (f.user_id_1 === inspectingUser.id || f.user_id_2 === inspectingUser.id)
            );

            const rankIndex = socialStore.globalRanking.findIndex(u => u.id === inspectingUser.id);
            const rankPos = rankIndex !== -1 ? `#${rankIndex + 1}` : 'N/A';
            const userColor = colors.secondary || '#A855F7';

            return (
              <LinearGradient
                colors={[colors.surface, colors.surfaceAlt]}
                style={{ width: '85%', borderRadius: 32, padding: 24, paddingTop: 0, alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: grade.color, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}
              >
                <TouchableOpacity
                  style={{ position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 20, zIndex: 10, borderWidth: 1, borderColor: colors.border }}
                  onPress={() => setInspectingUser(null)}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Protruding Avatar */}
                <View style={{ marginTop: -55, marginBottom: 16 }}>
                  <View style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: userColor, padding: 3, backgroundColor: colors.surface, shadowColor: userColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 }}>
                    {inspectingUser.avatar_url ? (
                      <Image source={{ uri: inspectingUser.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
                    ) : (
                      <View style={{ flex: 1, borderRadius: 50, backgroundColor: isMe ? colors.primary : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: isMe ? '#fff' : colors.textSecondary, fontWeight: 'bold', fontSize: 36 }}>
                          {inspectingUser.name?.[0]?.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Username */}
                <Text style={[{ fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 28, textShadowColor: getSafeColor(userColor) + '40', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }, getNameStyle(inspectingUser.name_color, inspectingUser.id, profile?.id, profile?.nameColor, premiumColor)]}>
                  {inspectingUser.name}
                </Text>

                {/* Stats Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 32, backgroundColor: colors.surfaceAlt + '50', paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border + '50' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900' }}>{rankPos}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{t('competitive.ranking', 'Ranking')}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border + '80', marginVertical: 4 }} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: userColor, fontSize: 18, fontWeight: '900' }}>{Math.round(inspectingUser.points)}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{t('profile.points', 'Puntos')}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border + '80', marginVertical: 4 }} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: grade.bg, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: grade.color + '40' }}>
                      <Text style={{ color: grade.color, fontSize: 15, fontWeight: '900' }}>{grade.label}</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{t('competitive.class', 'Clase')}</Text>
                  </View>
                  </View>
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>🔥</Text>
                      <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14 }}>
                        {inspectingUser.current_streak || 0} {t('competitive.squads.days', 'días')}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                <View style={{ width: '100%', gap: 12 }}>
                  <TouchableOpacity 
                    style={{ overflow: 'hidden', borderRadius: 16 }}
                    onPress={() => {
                      setInspectingUser(null);
                      router.push({ 
                        pathname: '/modals/user-profile', 
                        params: { userId: inspectingUser.id, name: inspectingUser.name, avatarUrl: inspectingUser.avatar_url || '' } 
                      });
                    }}
                  >
                    <LinearGradient
                      colors={[colors.surfaceAlt, colors.surface]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}
                    >
                      <Users size={18} color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>{t('social.viewFullProfile', 'Ver Perfil Completo')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {!isMe && (
                    <TouchableOpacity 
                      style={{ overflow: 'hidden', borderRadius: 16 }}
                      onPress={() => {
                        if (!isFriend && !isPending && profile?.id) {
                          socialStore.addFriend(profile.id, inspectingUser.id);
                        }
                      }}
                    >
                      <LinearGradient
                        colors={isFriend ? ['#10B98120', '#10B98110'] : (isPending ? ['#F59E0B20', '#F59E0B10'] : [colors.primary + '20', colors.primary + '10'])}
                        style={{ 
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, 
                          paddingVertical: 16, borderRadius: 16,
                          borderWidth: 1, borderColor: isFriend ? '#10B98140' : (isPending ? '#F59E0B40' : colors.primary + '40')
                        }}
                      >
                        {isFriend ? (
                          <>
                            <Text style={{ color: '#10B981', fontSize: 18 }}>✓</Text>
                            <Text style={{ color: '#10B981', fontSize: 15, fontWeight: '800' }}>{t('social.friends.alreadyFriends', 'Son Amigos')}</Text>
                          </>
                        ) : isPending ? (
                          <>
                            <Text style={{ color: '#F59E0B', fontSize: 18 }}>⌛</Text>
                            <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '800' }}>{t('social.friends.pending', 'Pendiente')}</Text>
                          </>
                        ) : (
                          <>
                            <Plus size={18} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800' }}>{t('social.friends.addFriend', 'Añadir a Amigos')}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>

              </LinearGradient>
            );
          })()}
        </BlurView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 60 },

  sectionToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 4,
  },
  sectionToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sectionToggleText: {
    fontSize: 13,
    fontWeight: '800',
  },

  subToggle: {
    flexDirection: 'row',
    marginVertical: 8,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  subToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },

  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    marginBottom: 24,
    gap: 12,
  },
  myRankBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rankAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankingHeader: { marginBottom: 20 },
  rankingTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  rankingSub: { fontSize: 13, marginTop: 2 },

  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 24,
    minHeight: 260,
  },
  podiumSlot: { flex: 1, alignItems: 'center' },
  podiumCard: {
    alignItems: 'center',
    width: '100%',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  podiumSquadName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  podiumPts: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },

  restList: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  restRank: { fontSize: 13, fontWeight: '900', minWidth: 28 },
  restName: { flex: 1, fontSize: 14, fontWeight: '700' },

  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  leagueBanner: {
    borderRadius: 28, borderWidth: 1.5, overflow: 'hidden',
    marginBottom: 16, minHeight: 130,
  },
  leagueBannerContent: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 20,
  },
  leagueName: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  leagueDesc: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  totalPoints: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    alignSelf: 'flex-start',
  },
  totalPointsText: { fontSize: 12, fontWeight: '800' },
  leagueBadge: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  squadCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 18, marginBottom: 16,
  },
  squadCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  squadName: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  squadMeta: { fontSize: 13, fontWeight: '600' },
  codeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5,
  },
  codeText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 20, borderWidth: 1.5, padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18, borderWidth: 1.5,
  },
  rankText: { fontSize: 15, fontWeight: '900', minWidth: 28 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  memberName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  memberSub: { fontSize: 12, fontWeight: '600' },
  pointsBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  pointsBadgeText: { fontSize: 13, fontWeight: '800' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18, borderWidth: 1.5, marginBottom: 8,
  },
  tierName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  tierPts: { fontSize: 12, fontWeight: '600' },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderRadius: 18, padding: 14, marginTop: 28,
  },
  leaveBtnText: { fontSize: 14, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyGlow: {
    position: 'absolute', top: 0, width: 300, height: 300, borderRadius: 150,
  },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, marginBottom: 20,
  },
  emptyTitle: { fontSize: 26, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  emptySub: { fontSize: 15, lineHeight: 22, textAlign: 'center', opacity: 0.7 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18,
  },
  emptyBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18, borderWidth: 2,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  inlineModal: {
    borderRadius: 24, borderWidth: 1.5, padding: 24, marginTop: 24, gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderRadius: 16, padding: 14,
    fontSize: 16, fontWeight: '600',
  },
  modalBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
  },
  modalBtnOutline: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5,
  },
  modalBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  inspectSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  joinSheetBtn: {
    height: 52,
    borderRadius: 16,
    marginTop: 4,
  },
});
