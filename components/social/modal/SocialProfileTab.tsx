import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Heart, MessageSquare, Trash2 } from 'lucide-react-native';
import { Radius, Spacing } from '../../../constants';
import { GlassCard } from '../../../components/GlassCard';
import { ALL_BADGES, useTranslatedBadge } from '../../../hooks/useAchievements';
import { PostAudioPlayer } from './PostCard';

interface SocialProfileTabProps {
  profile: any;
  socialStore: any;
  colors: any;
  t: any;
  onSetTab: (tab: string) => void;
  onNavigateAchievements: () => void;
  onDeletePost: (postId: string) => void;
  onUserPress: (user: any) => void;
}

export default function SocialProfileTab({
  profile, socialStore, colors, t,
  onSetTab, onNavigateAchievements, onDeletePost, onUserPress,
}: SocialProfileTabProps) {
  const acceptedFriends = socialStore.friends.filter((f: any) => f.status === 'accepted');
  const userRankInfo = socialStore.globalRanking.find((u: any) => u.id === profile?.id);
  const userRankIndex = socialStore.globalRanking.findIndex((u: any) => u.id === profile?.id);
  const myPosts = socialStore.posts.filter((p: any) => p.user_id === profile?.id);
  const currentBadgeId = profile?.selectedBadge || (profile?.role === 'owner' ? 'owner' : profile?.role === 'super_admin' ? 'super_admin' : profile?.role === 'admin' ? 'admin' : profile?.isPro ? 'pro' : 'verified');
  const currentBadge = useTranslatedBadge(currentBadgeId) || ALL_BADGES.verified;

  const getRank = (points: number) => {
    if (points >= 10000) return { label: 'S+', color: '#FFD700', bg: '#FFD70020' };
    if (points >= 5000) return { label: 'S', color: '#A855F7', bg: '#A855F720' };
    if (points >= 2000) return { label: 'A', color: '#3B82F6', bg: '#3B82F620' };
    if (points >= 1000) return { label: 'B', color: '#10B981', bg: '#10B98120' };
    if (points >= 500) return { label: 'C', color: '#F59E0B', bg: '#F59E0B20' };
    if (points >= 100) return { label: 'D', color: '#8B4513', bg: '#8B451320' };
    return { label: 'F', color: '#6B7280', bg: '#6B728020' };
  };

  const userGrade = userRankInfo ? getRank(userRankInfo.points) : getRank(0);

  return (
    <View style={s.tabContent}>
      <GlassCard style={{ marginBottom: 16, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {profile?.avatarUrl ? (
            <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 64, height: 64, borderRadius: 32 }]}>
              <Text style={[s.avatarInitials, { fontSize: 24 }]}>{profile?.name?.[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{profile?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={[s.chip, { backgroundColor: currentBadge.colors[0] + '20', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Text style={{ fontSize: 12 }}>{currentBadge.icon}</Text>
                <Text style={{ color: currentBadge.colors[0], fontSize: 12, fontWeight: '700' }}>{currentBadge.label}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border + '30', justifyContent: 'space-around' }}>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => onSetTab('friends')}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{acceptedFriends.length}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.friends')}</Text>
          </TouchableOpacity>
          <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => onSetTab('ranking')}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>#{userRankIndex >= 0 ? userRankIndex + 1 : '-'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.ranking')}</Text>
          </TouchableOpacity>
          <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => onSetTab('ranking')}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{Math.round(userRankInfo?.points || 0)}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.points')}</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      <TouchableOpacity
        onPress={onNavigateAchievements}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: '#F59E0B18', borderWidth: 1.5, borderColor: '#F59E0B40',
          borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 20, marginTop: 8,
        }}
      >
        <Trophy size={22} color="#F59E0B" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>{t('social.you.achievements')}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{t('social.you.viewAllAchievements')}</Text>
        </View>
        <View style={{ backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{profile?.achievements?.length || 0}/{(ALL_BADGES && Object.keys(ALL_BADGES).length) || 0}</Text>
        </View>
      </TouchableOpacity>

      <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.you.yourPosts')}</Text>
      {myPosts.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>{t('social.you.noPosts')}</Text>
      ) : (
        myPosts.map((post: any) => (
          <GlassCard key={post.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 16 }}>
              <View style={s.postHeader}>
                <TouchableOpacity style={s.userInfo} onPress={() => onUserPress({ ...post.user_profile, id: post.user_id })}>
                  {post.user_profile?.avatar_url ? (
                    <Image cachePolicy="memory-disk" source={{ uri: post.user_profile.avatar_url }} style={s.avatarSmall} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                      <Text style={[s.avatarInitials, { fontSize: 14 }]}>{post.user_profile?.name?.[0]}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={[s.userName, { color: colors.textPrimary }]}>{post.user_profile?.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeletePost(post.id)}>
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[s.postContent, { color: colors.textPrimary }]}>{post.content}</Text>
              {post.image_url && (
                <Image cachePolicy="memory-disk" source={{ uri: post.image_url }} style={s.postImage} contentFit="cover" />
              )}
              {post.audio_url && (
                <PostAudioPlayer audioUrl={post.audio_url} colors={colors} />
              )}
            </View>
            <View style={[s.postFooter, { borderTopColor: colors.border + '33' }]}>
              <View style={s.postAction}>
                <Heart size={18} color={post.is_liked ? colors.error : colors.textSecondary} fill={post.is_liked ? colors.error : 'transparent'} />
                <Text style={{ color: post.is_liked ? colors.error : colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {post.likes_count > 0 ? post.likes_count : ''} {t('social.feed.like')}
                </Text>
              </View>
              <View style={s.postAction}>
                <MessageSquare size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {post.comments_count > 0 ? post.comments_count : ''} {t('social.feed.comment')}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabContent: { flex: 1 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  userName: { fontSize: 15, fontWeight: '700' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: Radius.lg, marginBottom: 12 },
  postFooter: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  postAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
});
