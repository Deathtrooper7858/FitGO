import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, UserPlus, Check, Trophy, Heart, MessageSquare, Users, Trash2 } from 'lucide-react-native';
import { getNameStyle } from '../../utils/styles';
import * as LucideIcons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useAuthStore, useSocialStore, useSettingsStore, usePurchaseStore } from '../../store';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../hooks/useTheme';
import { useAchievements, ALL_BADGES } from '../../hooks/useAchievements';
import { useTranslation } from 'react-i18next';
import { Radius } from '../../constants';
import { CustomAlert } from '../../components/CustomAlert';
import { AvatarViewerModal } from '../../components/AvatarViewerModal';
// TEMPORARILY DISABLED FOR EXPO GO COMPATIBILITY
// import LottieView from 'lottie-react-native';
// import { LottieRegistry } from '../../hooks/LottieRegistry';

export default function UserProfileModal() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const fallbackName = params.name as string;
  const fallbackAvatar = params.avatarUrl as string;

  const colors = useTheme();
  const { profile: myProfile } = useAuthStore();
  const { premiumColor } = useSettingsStore();
  const { isPro } = usePurchaseStore();
  const { t } = useTranslation();
  const socialStore = useSocialStore();
  const { achievements: myAchievements } = useAchievements();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userFriends, setUserFriends] = useState<any[]>([]);
  const [totalFriends, setTotalFriends] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [deleteFriendAlert, setDeleteFriendAlert] = useState<{ friendId: string; friendName: string } | null>(null);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);

  const isMe = userId === myProfile?.id;

  useEffect(() => {
    async function loadUser() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        setUserProfile(data);
      } catch (err) {
        console.warn('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  useEffect(() => {
    async function loadPosts() {
      if (!userId) return;
      try {
        const { data } = await supabase
          .from('posts')
          .select('*, user_profile:user_id(name, avatar_url)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        setUserPosts(data || []);
      } catch (err) {
        console.warn('Error loading posts:', err);
      }
    }
    loadPosts();
  }, [userId]);

  useEffect(() => {
    async function loadFriends() {
      if (!userId) return;
      try {
        const { data, count } = await supabase
          .from('friends')
          .select('*, user1:user_id_1(id, name, avatar_url), user2:user_id_2(id, name, avatar_url)', { count: 'exact' })
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
          .eq('status', 'accepted')
          .limit(12);
          
        const friendsList = (data || []).map((f: any) => ({
          ...f,
          friend_profile: f.user_id_1 === userId ? f.user2 : f.user1
        }));
        
        setUserFriends(friendsList);
        setTotalFriends(count || 0);
      } catch (err) {
        console.warn('Error loading friends:', err);
      }
    }
    loadFriends();
  }, [userId]);

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!userProfile && !fallbackName) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Usuario no encontrado.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>{t('common.back', 'Volver')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayUser = userProfile || { name: fallbackName, avatar_url: fallbackAvatar, unlockedAchievements: [], role: 'verified' };

  // For own profile: use premiumColor from local store.
  // For others: use their name_color from DB (visible to ALL users inspecting the profile).
  const isValidColor = (c: string | null | undefined) => !!c && (c.startsWith('#') || c.startsWith('rgb'));
  const vitrineColor: string | null = isMe
    ? ((isPro || myProfile?.isPro || myProfile?.role === 'owner' || myProfile?.role === 'super_admin' || myProfile?.role === 'admin') && isValidColor(premiumColor) ? premiumColor! : null)
    : (isValidColor(displayUser.name_color) ? displayUser.name_color : null);

  const friendStatus = socialStore.friends.find(f =>
    (f.user_id_1 === myProfile?.id && f.user_id_2 === userId) ||
    (f.user_id_2 === myProfile?.id && f.user_id_1 === userId)
  );

  const rankInfo = socialStore.globalRanking.find(u => u.id === userId);
  const rankIndex = socialStore.globalRanking.findIndex(u => u.id === userId);

  const getRank = (points: number) => {
    if (points >= 15000) return { label: 'S++', color: '#FF0055', bg: '#FF005520' };
    if (points >= 10000) return { label: 'S+', color: '#FFD700', bg: '#FFD70020' };
    if (points >= 5000) return { label: 'S', color: '#A855F7', bg: '#A855F720' };
    if (points >= 2000) return { label: 'A', color: '#3B82F6', bg: '#3B82F620' };
    if (points >= 1000) return { label: 'B', color: '#10B981', bg: '#10B98120' };
    if (points >= 500) return { label: 'C', color: '#F59E0B', bg: '#F59E0B20' };
    if (points >= 100) return { label: 'D', color: '#8B4513', bg: '#8B451320' };
    return { label: 'F', color: '#6B7280', bg: '#6B728020' };
  };

  const userGrade = rankInfo ? getRank(rankInfo.points) : getRank(0);
  const currentBadgeId = displayUser.selectedBadge || (displayUser.role === 'owner' ? 'owner' : displayUser.role === 'super_admin' ? 'super_admin' : displayUser.role === 'admin' ? 'admin' : displayUser.isPro ? 'pro' : 'verified');
  const currentBadge = ALL_BADGES[currentBadgeId] || ALL_BADGES.verified;

  const theirUnlockedIds: string[] = Array.from(new Set(displayUser.unlocked_achievements || []));
  const theirUnlockedCount = isMe
    ? myAchievements.filter(a => a.unlocked).length
    : myAchievements.filter(a => theirUnlockedIds.includes(a.id)).length;
  const totalAchievements = myAchievements.length;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('profile.userProfile', 'Perfil de Usuario')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlassCard style={{ margin: 16, padding: 0, overflow: 'hidden' }}>
          <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 28 }}>
            {/* Avatar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => displayUser.avatar_url ? setAvatarViewerVisible(true) : null}
              style={{
                width: 88, height: 88, borderRadius: 44,
                borderWidth: 3, borderColor: colors.background,
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                marginBottom: 12,
              }}
            >
              {displayUser.avatar_url ? (
                <Image source={{ uri: displayUser.avatar_url }} style={{ width: 82, height: 82, borderRadius: 41 }} />
              ) : (
                <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 82, height: 82, borderRadius: 41 }]}>
                  <Text style={{ fontSize: 32, color: '#fff', fontWeight: 'bold' }}>{displayUser.name?.[0]}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }, getNameStyle(displayUser.name_color, displayUser.id, myProfile?.id, myProfile?.nameColor)]}>{displayUser.name}</Text>

            <View style={[s.chip, { backgroundColor: currentBadge.colors[0] + '20', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }]}>
              <Text style={{ fontSize: 13 }}>{currentBadge.icon}</Text>
              <Text style={{ color: currentBadge.colors[0], fontSize: 13, fontWeight: '700' }}>{currentBadge.label}</Text>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border + '30' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900' }}>#{rankIndex >= 0 ? rankIndex + 1 : '-'}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t('profile.ranking', 'Ranking')}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '900' }}>{Math.round(rankInfo?.points || 0)}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t('profile.points', 'Puntos')}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: userGrade.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: userGrade.color, fontSize: 18, fontWeight: '900' }}>{userGrade.label}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>{t('profile.class', 'Clase')}</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Friend Action Button */}
          {!isMe && (
            <View style={{ marginBottom: 20 }}>
              {friendStatus?.status === 'accepted' ? (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[s.actionBtn, { flex: 1, backgroundColor: colors.success + '20' }]}>
                      <Check size={20} color={colors.success} />
                      <Text style={[s.actionBtnText, { color: colors.success }]}>{t('profile.areFriends', 'Son Amigos')}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[s.actionBtn, { flex: 1, backgroundColor: colors.primary }]}
                      onPress={() => router.push({ pathname: '/modals/chat', params: { friendId: userId, friendName: displayUser.name, friendAvatar: displayUser.avatar_url || '' } })}
                    >
                      <MessageSquare size={20} color="#fff" />
                      <Text style={[s.actionBtnText, { color: '#fff' }]}>{t('profile.message', 'Mensaje')}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{ height: 46, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40', flexDirection: 'row', gap: 8 }}
                    onPress={() => setDeleteFriendAlert({ friendId: friendStatus.id, friendName: displayUser.name || 'este usuario' })}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>{t('profile.removeFriend', 'Eliminar Amigo')}</Text>
                  </TouchableOpacity>
                </View>
              ) : friendStatus?.status === 'pending' ? (
                <View style={[s.actionBtn, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[s.actionBtnText, { color: colors.textSecondary }]}>{t('profile.pendingRequest', 'Solicitud Pendiente')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ height: 52, borderRadius: Radius.xl, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}
                  onPress={async () => {
                    await socialStore.addFriend(myProfile?.id || '', userId);
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary || '#A855F7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <UserPlus size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{t('profile.sendFriendRequest', 'Enviar Solicitud de Amistad')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Vitrina de Trofeos (Showcase) ── */}
          {displayUser.pinned_achievements && displayUser.pinned_achievements.length > 0 && (
            <View
              style={
                vitrineColor
                  ? {
                      marginBottom: 16,
                      borderRadius: 20,
                      shadowColor: vitrineColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.6,
                      shadowRadius: 12,
                      elevation: 8,
                    }
                  : { marginBottom: 16 }
              }
            >
              <View
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: vitrineColor ? 1.5 : 1,
                  borderColor: vitrineColor ? vitrineColor + '80' : colors.border,
                }}
              >
                {/* Premium background gradient */}
                {vitrineColor ? (
                  <LinearGradient
                    colors={[vitrineColor + '25', vitrineColor + '10', 'transparent'] as [string, string, string]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, borderRadius: 20 }]} />
                )}
                {/* Top accent stripe */}
                {vitrineColor && (
                  <LinearGradient
                    colors={[vitrineColor + 'DD', vitrineColor + '00'] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
                  />
                )}
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>🏆 {t('achievements.trophyShowcase', 'Vitrina de Trofeos')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {displayUser.pinned_achievements.map((id: string) => {
                    const ach = myAchievements.find((a: any) => a.id === id);
                    if (!ach) return null;
                    const isHolo = ach.tier === 'oro' || ach.tier === 'diamante';
                    const tierColor = ach.tier === 'diamante' ? '#38BDF8' : 
                                      ach.tier === 'oro' ? '#FBBF24' : 
                                      ach.tier === 'plata' ? '#9CA3AF' : '#D97706';
                    const activeColor = vitrineColor ? vitrineColor : tierColor;
                    
                    return (
                      <View key={id} style={{
                        flex: 1,
                        backgroundColor: vitrineColor
                          ? vitrineColor + '15'
                          : isHolo ? activeColor + '12' : 'transparent',
                        padding: 8, borderRadius: 16, alignItems: 'center',
                        borderWidth: 1, borderColor: isHolo ? activeColor + '50' : (vitrineColor ? vitrineColor + '40' : colors.border + '60')
                      }}>
                        <LinearGradient
                          colors={(isHolo ? [activeColor, vitrineColor ? vitrineColor + '80' : (activeColor === '#FBBF24' ? '#EA580C' : '#4F46E5')] : ['transparent', 'transparent']) as [string, string, ...string[]]}
                          style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: isHolo ? 'transparent' : (vitrineColor ? vitrineColor + '20' : colors.surfaceAlt), marginBottom: 8 }}
                        >
                          {ach.iconType === 'lucide' && ach.lucideIcon ? (
                            // @ts-ignore
                            React.createElement(LucideIcons[ach.lucideIcon] || LucideIcons.Star, {
                              size: 24,
                              color: isHolo ? '#FFF' : activeColor,
                              strokeWidth: 2.5
                            })
                          ) : (
                            <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
                          )}
                        </LinearGradient>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>{ach.title}</Text>
                        <Text style={{ fontSize: 9, color: activeColor, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>{ach.tier}</Text>
                      </View>
                    );
                  })}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Achievements Trophy Button */}
          <TouchableOpacity
            onPress={() => setShowAchievements(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#F59E0B18',
              borderWidth: 1.5,
              borderColor: '#F59E0B40',
              borderRadius: 16,
              paddingHorizontal: 18,
              paddingVertical: 14,
              marginBottom: 16,
            }}
          >
            <Trophy size={22} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>
                {isMe ? t('achievements.myAchievements', 'Mis Logros') : t('achievements.achievements', 'Logros')}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                {showAchievements ? t('common.tapToHide', 'Toca para ocultar') : t('common.tapToView', 'Toca para ver los logros')}
              </Text>
            </View>
            <View style={{ backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                {theirUnlockedCount}/{totalAchievements}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Achievements Detail (expandable) */}
          {showAchievements && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, gap: 10 }}>
                <LinearGradient
                  colors={[colors.primary + '30', colors.surfaceAlt]}
                  style={{ padding: 12, borderRadius: Radius.lg, alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: colors.primary + '40' }}
                >
                  <Text style={{ fontWeight: '900', color: colors.textPrimary, fontSize: 16 }}>{t('common.you', 'Tú')}</Text>
                  <View style={{ backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '800' }}>
                      {myAchievements.filter(a => a.unlocked).length} / {totalAchievements}
                    </Text>
                  </View>
                </LinearGradient>
                {myAchievements.filter(a => a.unlocked).length === 0 && (
                   <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 10 }}>{t('achievements.noAchievements', 'Sin logros')}</Text>
                )}
                {myAchievements.map(achievement => {
                  if (!achievement.unlocked) return null;
                  const isHolo = achievement.tier === 'oro' || achievement.tier === 'diamante';
                  const tierColor = achievement.tier === 'diamante' ? '#38BDF8' : 
                                    achievement.tier === 'oro' ? '#FBBF24' : 
                                    achievement.tier === 'plata' ? '#9CA3AF' : '#D97706';
                  
                  const tierGradients = {
                    bronce: ['#D97706', '#92400E'],
                    plata: ['#9CA3AF', '#4B5563'],
                    oro: ['#FBBF24', '#EA580C'],
                    diamante: ['#38BDF8', '#4F46E5']
                  };
                  const gradientColors = tierGradients[achievement.tier as keyof typeof tierGradients] || tierGradients.bronce;

                  return (
                    <View key={`me-${achievement.id}`} style={{
                      padding: 12, alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 16,
                      borderWidth: 1, borderColor: isHolo ? tierColor + '50' : colors.border,
                      ...(isHolo ? { shadowColor: tierColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 } : {})
                    }}>
                      <LinearGradient
                        colors={gradientColors as [string, string]}
                        style={{ width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: tierColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}
                      >
                        {achievement.iconType === 'lucide' && achievement.lucideIcon ? (
                          // @ts-ignore
                          React.createElement(LucideIcons[achievement.lucideIcon] || LucideIcons.Star, {
                            size: 26,
                            color: '#FFF',
                            strokeWidth: 2.5
                          })
                        ) : (
                          <Text style={{ fontSize: 26 }}>{achievement.icon}</Text>
                        )}
                      </LinearGradient>
                      <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12, textAlign: 'center' }} numberOfLines={2}>{achievement.title}</Text>
                      <Text style={{ fontSize: 10, color: tierColor, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 }}>{achievement.tier}</Text>
                    </View>
                  );
                })}
              </View>

              {!isMe && (
                <View style={{ flex: 1, gap: 10 }}>
                  <LinearGradient
                    colors={[(colors.secondary || '#A855F7') + '30', colors.surfaceAlt]}
                    style={{ padding: 12, borderRadius: Radius.lg, alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: (colors.secondary || '#A855F7') + '40' }}
                  >
                    <Text style={{ fontWeight: '900', color: colors.textPrimary, fontSize: 16 }} numberOfLines={1}>{displayUser.name?.split(' ')[0]}</Text>
                    <View style={{ backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.secondary || '#A855F7', fontWeight: '800' }}>
                        {theirUnlockedCount} / {totalAchievements}
                      </Text>
                    </View>
                  </LinearGradient>
                  {theirUnlockedCount === 0 && (
                     <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 10 }}>{t('achievements.noAchievements', 'Sin logros')}</Text>
                  )}
                  {myAchievements.map(achievement => {
                    if (!theirUnlockedIds.includes(achievement.id)) return null;
                    const isHolo = achievement.tier === 'oro' || achievement.tier === 'diamante';
                    const tierColor = achievement.tier === 'diamante' ? '#38BDF8' : 
                                      achievement.tier === 'oro' ? '#FBBF24' : 
                                      achievement.tier === 'plata' ? '#9CA3AF' : '#D97706';
                    
                    const tierGradients = {
                      bronce: ['#D97706', '#92400E'],
                      plata: ['#9CA3AF', '#4B5563'],
                      oro: ['#FBBF24', '#EA580C'],
                      diamante: ['#38BDF8', '#4F46E5']
                    };
                    const gradientColors = tierGradients[achievement.tier as keyof typeof tierGradients] || tierGradients.bronce;

                    return (
                      <View key={`them-${achievement.id}`} style={{
                        padding: 12, alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 16,
                        borderWidth: 1, borderColor: isHolo ? tierColor + '50' : colors.border,
                        ...(isHolo ? { shadowColor: tierColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 } : {})
                      }}>
                        <LinearGradient
                          colors={gradientColors as [string, string]}
                          style={{ width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: tierColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}
                        >
                          {achievement.iconType === 'lucide' && achievement.lucideIcon ? (
                            // @ts-ignore
                            React.createElement(LucideIcons[achievement.lucideIcon] || LucideIcons.Star, {
                              size: 26,
                              color: '#FFF',
                              strokeWidth: 2.5
                            })
                          ) : (
                            <Text style={{ fontSize: 26 }}>{achievement.icon}</Text>
                          )}
                        </LinearGradient>
                        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12, textAlign: 'center' }} numberOfLines={2}>{achievement.title}</Text>
                        <Text style={{ fontSize: 10, color: tierColor, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 }}>{achievement.tier}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Friends Section */}
          {userFriends.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users size={18} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                  {t('social.friends.friends', 'Amigos')} · {totalFriends}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {userFriends.map(f => {
                  const fp = f.friend_profile;
                  if (!fp) return null;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={{ alignItems: 'center', marginRight: 16, width: 64 }}
                      onPress={() => router.push({ pathname: '/modals/user-profile', params: { userId: fp.id, name: fp.name, avatarUrl: fp.avatar_url || '' } })}
                    >
                      {fp.avatar_url ? (
                        <Image source={{ uri: fp.avatar_url }} style={{ width: 52, height: 52, borderRadius: 26, marginBottom: 6 }} />
                      ) : (
                        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>{fp.name?.[0]}</Text>
                        </View>
                      )}
                      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{fp.name?.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Posts Section */}
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MessageSquare size={18} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                {t('social.posts', 'Publicaciones')}
              </Text>
            </View>
            {userPosts.length === 0 ? (
              <GlassCard style={{ padding: 24, alignItems: 'center' }}>
                <MessageSquare size={32} color={colors.textMuted} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  {isMe ? t('social.noPostsMe', 'Aún no has publicado nada.') : t('social.noPosts', 'Este usuario no ha publicado nada.')}
                </Text>
              </GlassCard>
            ) : (
              userPosts.map(post => (
                <GlassCard key={post.id} style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {displayUser.avatar_url ? (
                        <Image source={{ uri: displayUser.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{displayUser.name?.[0]}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{displayUser.name}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                          {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20 }}>{post.content}</Text>
                    {post.image_url && (
                      <Image source={{ uri: post.image_url }} style={{ width: '100%', height: 180, borderRadius: 10, marginTop: 10 }} contentFit="cover" />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border + '33', paddingVertical: 10 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Heart size={15} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {post.likes_count > 0 ? post.likes_count : ''} {t('social.likes', 'Me gusta')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <MessageSquare size={15} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {post.comments_count > 0 ? post.comments_count : ''} {t('social.comments', 'Comentarios')}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Avatar Viewer */}
      <AvatarViewerModal
        visible={avatarViewerVisible}
        avatarUrl={displayUser.avatar_url}
        name={displayUser.name}
        onClose={() => setAvatarViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  actionBtnText: { fontWeight: 'bold', fontSize: 16 },
});
