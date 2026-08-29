import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { X, Camera, Send, MessageSquare } from 'lucide-react-native';
import { Radius } from '../../../constants';
import { GlassCard } from '../../../components/GlassCard';
import { PostCard } from './PostCard';
import { CommentList } from './CommentList';

interface SocialFeedTabProps {
  profile: any;
  socialStore: any;
  colors: any;
  t: any;
  getNameStyle: any;
  premiumColor?: string;
  newPostContent: string;
  selectedImage: string | null;
  selectedAudio?: string | null;
  isPosting: boolean;
  expandedComments: string | null;
  postComments: Record<string, any[]>;
  newComment: string;
  editingCommentId: string | null;
  editingCommentText: string;
  onNewPostContentChange: (text: string) => void;
  onSelectImage: () => void;
  onSelectAudio?: () => void;
  onRemoveImage: () => void;
  onCreatePost: () => void;
  onLike: (postId: string, isLiked: boolean) => void;
  onToggleComments: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (content: string) => void;
  onUserPress: (user: any) => void;
  onNewCommentChange: (text: string) => void;
  onAddComment: (postId: string) => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelCommentEdit: () => void;
  onSaveCommentEdit: (commentId: string, postId: string) => void;
  onDeleteComment: (commentId: string, postId: string) => void;
  onEditingTextChange: (text: string) => void;
}

export default function SocialFeedTab({
  profile, socialStore, colors, t, getNameStyle, premiumColor,
  newPostContent, selectedImage, selectedAudio, isPosting,
  expandedComments, postComments, newComment,
  editingCommentId, editingCommentText,
  onNewPostContentChange, onSelectImage, onSelectAudio, onRemoveImage, onCreatePost,
  onLike, onToggleComments, onDelete, onShare, onUserPress,
  onNewCommentChange, onAddComment,
  onStartEditComment, onCancelCommentEdit, onSaveCommentEdit,
  onDeleteComment, onEditingTextChange,
}: SocialFeedTabProps) {
  return (
    <View style={s.tabContent}>
      <GlassCard style={{ marginBottom: 20, padding: 12 }}>
        <View style={s.postInputRow}>
          {profile?.avatarUrl ? (
            <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={s.avatarSmall} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
              <Text style={[s.avatarInitials, { fontSize: 14 }]}>{profile?.name?.[0]}</Text>
            </View>
          )}
          <TextInput
            style={[s.postInput, { color: colors.textPrimary }]}
            placeholder={t('social.feed.postPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            value={newPostContent}
            onChangeText={onNewPostContentChange}
          />
        </View>
        {selectedImage && (
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <Image cachePolicy="memory-disk" source={{ uri: selectedImage }} style={s.imagePreview} />
            <TouchableOpacity style={s.removeImageBtn} onPress={onRemoveImage}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {selectedAudio && (
          <View style={{ position: 'relative', marginBottom: 12, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.textPrimary, flex: 1 }}>🎵 Audio seleccionado</Text>
            <TouchableOpacity onPress={onRemoveImage}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={s.postActions}>
          <TouchableOpacity style={s.postTool} onPress={onSelectImage}>
            <Camera size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{t('social.feed.photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: (newPostContent.trim() || selectedImage || selectedAudio) ? colors.primary : colors.surfaceAlt }]}
            onPress={onCreatePost}
            disabled={(!newPostContent.trim() && !selectedImage && !selectedAudio) || isPosting}
          >
            {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </GlassCard>

      {socialStore.isPostsLoading && socialStore.posts.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : socialStore.posts.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <MessageSquare size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 15 }}>{t('social.feed.noPosts')}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('social.feed.firstToShare')}</Text>
        </View>
      ) : (
        socialStore.posts.map((post: any) => (
          <View key={post.id}>
            <PostCard
              post={post}
              currentUserId={profile?.id}
              colors={colors}
              t={t}
              getNameStyle={getNameStyle}
              premiumColor={premiumColor}
              onLike={onLike}
              onToggleComments={onToggleComments}
              onDelete={onDelete}
              onShare={onShare}
              onUserPress={onUserPress}
            />
            {expandedComments === post.id && (
              <CommentList
                postId={post.id}
                comments={postComments[post.id] || []}
                currentUserId={profile?.id}
                colors={colors}
                t={t}
                getNameStyle={getNameStyle}
                premiumColor={premiumColor}
                newComment={newComment}
                editingCommentId={editingCommentId}
                editingCommentText={editingCommentText}
                onNewCommentChange={onNewCommentChange}
                onAddComment={onAddComment}
                onStartEditComment={onStartEditComment}
                onCancelCommentEdit={onCancelCommentEdit}
                onSaveCommentEdit={onSaveCommentEdit}
                onDeleteComment={onDeleteComment}
                onEditingTextChange={onEditingTextChange}
              />
            )}
          </View>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabContent: { flex: 1 },
  postInputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  postInput: { flex: 1, fontSize: 15, minHeight: 40, paddingTop: 8 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  postTool: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: 'rgba(0,0,0,0.03)' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  imagePreview: { width: '100%', height: 200, borderRadius: Radius.lg },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
