import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageSquare, Share2, Trash2 } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Radius, Spacing } from '../../../constants';
import { GlassCard } from '../../../components/GlassCard';

export function PostAudioPlayer({ audioUrl, colors }: { audioUrl: string; colors: any }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  const handleToggle = async () => {
    try {
      await setAudioModeAsync({ 
        playsInSilentMode: true, 
        allowsRecording: false, 
        interruptionMode: 'mixWithOthers', 
        shouldPlayInBackground: false, 
        shouldRouteThroughEarpiece: false 
      });
    } catch (e) {
      console.warn('Audio mode error:', e);
    }
    
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const handleSeek = (e: any) => {
    if (trackWidth > 0 && status.duration > 0) {
      const x = e.nativeEvent.locationX;
      const percent = Math.max(0, Math.min(1, x / trackWidth));
      player.seekTo(percent * status.duration);
    }
  };

  return (
    <View style={audioStyles.container}>
      <TouchableOpacity onPress={handleToggle} style={[audioStyles.playBtn, { backgroundColor: colors.primary + '30' }]}>
        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
          {status.playing ? '⏸' : '▶️'}
        </Text>
      </TouchableOpacity>
      <View style={audioStyles.progressWrapper}>
        <View 
          style={{ height: 24, justifyContent: 'center' }}
          onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleSeek}
          onResponderMove={handleSeek}
        >
          <View style={[audioStyles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[audioStyles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
        <Text style={[audioStyles.timeText, { color: colors.textMuted }]}>
          {status.playing ? formatTime(status.currentTime) : status.duration > 0 ? formatTime(status.duration) : '0:00'}
        </Text>
      </View>
    </View>
  );
}

const audioStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, marginBottom: 12 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressWrapper: { flex: 1, gap: 4 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  timeText: { fontSize: 11 },
});

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

export const PostCard = React.memo(function PostCard({
  post, currentUserId, colors, t, getNameStyle, premiumColor,
  onLike, onToggleComments, onDelete, onShare, onUserPress,
}: PostCardProps) {
  return (
    <GlassCard style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
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
          <Image cachePolicy="memory-disk" source={{ uri: post.image_url }} style={s.postImage} contentFit="cover" />
        )}
        {post.audio_url && (
          <PostAudioPlayer audioUrl={post.audio_url} colors={colors} />
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
});

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
