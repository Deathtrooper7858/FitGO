import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Check, X, Pencil, Trash2, Send } from 'lucide-react-native';
import { Radius, Spacing } from '../../../constants';

interface CommentListProps {
  postId: string;
  comments: any[];
  currentUserId?: string;
  colors: any;
  t: any;
  getNameStyle: any;
  premiumColor?: string;
  newComment: string;
  editingCommentId: string | null;
  editingCommentText: string;
  onNewCommentChange: (text: string) => void;
  onAddComment: (postId: string) => void;
  onStartEditComment: (commentId: string, content: string) => void;
  onCancelCommentEdit: () => void;
  onSaveCommentEdit: (commentId: string, postId: string) => void;
  onDeleteComment: (commentId: string, postId: string) => void;
  onEditingTextChange: (text: string) => void;
}

export function CommentList({
  postId, comments, currentUserId, colors, t, getNameStyle, premiumColor,
  newComment, editingCommentId, editingCommentText,
  onNewCommentChange, onAddComment,
  onStartEditComment, onCancelCommentEdit, onSaveCommentEdit,
  onDeleteComment, onEditingTextChange,
}: CommentListProps) {
  return (
    <View style={[s.commentsContainer, { backgroundColor: colors.surfaceAlt + '50' }]}>
      {comments?.map(comment => (
        <View key={comment.id} style={s.commentRow}>
          {comment.user_profile?.avatar_url ? (
            <Image cachePolicy="memory-disk" source={{ uri: comment.user_profile.avatar_url }} style={s.commentAvatar} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 24, height: 24 }]}>
              <Text style={{ fontSize: 10, color: '#fff' }}>{comment.user_profile?.name?.[0]}</Text>
            </View>
          )}
          <View style={[s.commentBubble, { backgroundColor: colors.surfaceAlt }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[s.commentUser, getNameStyle(comment.user_profile?.name_color, comment.user_id, currentUserId, undefined, premiumColor), { marginBottom: 0 }]}>
                {comment.user_profile?.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.textMuted, fontSize: 9 }}>
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {comment.user_id === currentUserId && !editingCommentId && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                    <TouchableOpacity onPress={() => onStartEditComment(comment.id, comment.content)}>
                      <Pencil size={11} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteComment(comment.id, postId)}>
                      <Trash2 size={11} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            {editingCommentId === comment.id ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <TextInput
                  style={{ flex: 1, color: colors.textPrimary, borderBottomColor: colors.primary, borderBottomWidth: 1, fontSize: 14, paddingVertical: 2 }}
                  value={editingCommentText}
                  onChangeText={onEditingTextChange}
                  autoFocus
                />
                <TouchableOpacity onPress={() => onSaveCommentEdit(comment.id, postId)}>
                  <Check size={16} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onCancelCommentEdit}>
                  <X size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={[s.commentText, { color: colors.textSecondary }]}>{comment.content}</Text>
                {comment.is_edited && (
                  <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 }}>
                    {t('social.feed.edited')}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      ))}
      <View style={s.commentInputRow}>
        <TextInput
          style={[s.commentInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt }]}
          placeholder={t('social.feed.writeComment')}
          placeholderTextColor={colors.textMuted}
          value={newComment}
          onChangeText={onNewCommentChange}
        />
        <TouchableOpacity style={[s.commentSendBtn, { backgroundColor: colors.primary }]} onPress={() => onAddComment(postId)}>
          <Send size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  commentsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14 },
  commentBubble: { flex: 1, padding: 12, borderRadius: Radius.lg, borderTopLeftRadius: 4 },
  commentUser: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, height: 44, borderRadius: Radius.full, paddingHorizontal: 16, fontSize: 14 },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholder: { borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
