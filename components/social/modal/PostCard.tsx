import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageSquare, Share2, Trash2 } from 'lucide-react-native';
import { Radius, Spacing } from '../../../constants';
import { GlassCard } from '../../../components/GlassCard';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  colors: any;
  t: any;
  getNameStyle: any;
  premiumColor?: string;
  onLike: (postId: string, isLiked: boolean) => void;
  onToggleComments: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (content: string) => void;
  onUserPress: (user: any) => void;
}

export function PostCard({
  post, currentUserId, colors, t, getNameStyle, premiumColor,
  onLike, onToggleComments, onDelete, onShare, onUserPress,
}: PostCardProps) {
  return (
    <GlassCard style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <View style={{ padding: 16 }}>
        <View style={s.postHeader}>
          <TouchableOpacity style={s.userInfo} onPress={() => onUserPress({ ...post.user_profile, id: post.user_id })}>
            {post.user_profile?.avatar_url ? (
              <Image source={{ uri: post.user_profile.avatar_url }} style={s.avatarSmall} />
            ) : (
              <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                <Text style={[s.avatarInitials, { fontSize: 14 }]}>{post.user_profile?.name?.[0]}</Text>
              </View>
            )}
            <View>
              <Text style={[s.userName, getNameStyle(post.user_profile?.name_color, post.user_id, currentUserId, undefined, premiumColor)]}>
                {post.user_profile?.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
          {post.user_id === currentUserId && (
            <TouchableOpacity onPress={() => onDelete(post.id)}>
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[s.postContent, { color: colors.textPrimary }]}>{post.content}</Text>
        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={s.postImage} contentFit="cover" />
        )}
      </View>
      <View style={[s.postFooter, { borderTopColor: colors.border + '33' }]}>
        <TouchableOpacity style={s.postAction} onPress={() => onLike(post.id, post.is_liked)}>
          <Heart size={18} color={post.is_liked ? colors.error : colors.textSecondary} fill={post.is_liked ? colors.error : 'transparent'} />
          <Text style={{ color: post.is_liked ? colors.error : colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
            {post.likes_count > 0 ? post.likes_count : ''} {post.is_liked ? t('social.feed.liked') : t('social.feed.like')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} onPress={() => onToggleComments(post.id)}>
          <MessageSquare size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
            {post.comments_count > 0 ? post.comments_count : ''} {t('social.feed.comment')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} onPress={() => onShare(post.content)}>
          <Share2 size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{t('social.feed.share')}</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userName: { fontSize: 15, fontWeight: '700' },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: Radius.lg, marginBottom: 12 },
  postFooter: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  postAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
});
