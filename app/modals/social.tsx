import React, { useState, useEffect, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Platform, Share, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Trophy, Users, Sword, Plus, ArrowLeft, Bot, Check, X, MessageSquare, Heart, Share2, Send, Trash2, Camera, Pencil } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getNameStyle } from '../../utils/styles';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants';
import { GlassCard } from '../../components/GlassCard';
import { useSocialStore, useAuthStore, useSettingsStore, useNutritionStore } from '../../store';
import { generateSocialChallenge } from '../../services/groq';
import { ImagePickerModal } from '../../components/ImagePickerModal';
import { supabase } from '../../services/supabase';
import { getLocalDateString } from '../../utils/date';
import { useAchievements, ALL_BADGES } from '../../hooks/useAchievements';

const SocialProfileTab = React.lazy(() => import('../../components/social/modal/SocialProfileTab'));
const SocialFeedTab = React.lazy(() => import('../../components/social/modal/SocialFeedTab'));
const SocialFriendsTab = React.lazy(() => import('../../components/social/modal/SocialFriendsTab'));

type TabType = 'you' | 'feed' | 'friends' | 'ranking' | 'challenges';

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  tabsWrapper: { marginBottom: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  tabText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  tabContent: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: Radius.full, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '500' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userName: { fontSize: 15, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mainBtn: { height: 52, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: Radius.lg },
  aiResult: { marginTop: 16, padding: 20, borderRadius: Radius.xl, borderWidth: 1, borderStyle: 'dashed' },
  gradientIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  inputField: { height: 48, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  friendSelectCard: { width: 80, padding: 12, borderRadius: Radius.lg, alignItems: 'center', marginRight: 12, borderWidth: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  rankBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 8, alignItems: 'center', justifyContent: 'center', minWidth: 24 },
  rankText: { fontSize: 10, fontWeight: '900' },
});

export default function SocialModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('you');
  const { profile } = useAuthStore();
  const { language, premiumColor } = useSettingsStore();
  const socialStore = useSocialStore();
  const nutritionStore = useNutritionStore();
  const { achievements, unlockedCount } = useAchievements();

  const TABS: TabType[] = ['you', 'feed', 'friends', 'ranking', 'challenges'];

  const handleSwipeTab = (direction: 1 | -1) => {
    Haptics.selectionAsync();
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < TABS.length) {
      setActiveTab(TABS[newIndex]);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 80) {
        handleSwipeTab(e.translationX > 0 ? -1 : 1);
      }
    });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [showRankingInstructions, setShowRankingInstructions] = useState(false);

  const [inspectingUser, setInspectingUser] = useState<any>(null);

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    type: 'steps',
    target_value: '10000',
    custom_goal: '',
    duration_days: '7',
    selectedFriendIds: [] as string[],
    includeSelf: true,
  });

  const [aiChallengeParticipantModal, setAiChallengeParticipantModal] = useState(false);
  const [aiChallengeSelectedFriends, setAiChallengeSelectedFriends] = useState<string[]>([]);
  const [aiChallengeIncludeSelf, setAiChallengeIncludeSelf] = useState(true);
  const [aiChallengeTitle, setAiChallengeTitle] = useState('');

  const getRank = (points: number) => {
    if (points >= 10000) return { label: 'S+', color: '#FFD700', bg: '#FFD70020', glow: '#FFD70050' };
    if (points >= 5000) return { label: 'S', color: '#A855F7', bg: '#A855F720', glow: '#A855F730' };
    if (points >= 2000) return { label: 'A', color: '#3B82F6', bg: '#3B82F620', glow: 'transparent' };
    if (points >= 1000) return { label: 'B', color: '#10B981', bg: '#10B98120', glow: 'transparent' };
    if (points >= 500) return { label: 'C', color: '#F59E0B', bg: '#F59E0B20', glow: 'transparent' };
    if (points >= 100) return { label: 'D', color: '#8B4513', bg: '#8B451320', glow: 'transparent' };
    return { label: 'F', color: '#6B7280', bg: '#6B728020', glow: 'transparent' };
  };

  useEffect(() => {
    let unsubscribeEvents: (() => void) | null = null;
    if (profile?.id) {
      socialStore.fetchFriends(profile.id);
      socialStore.fetchChallenges(profile.id);
      socialStore.fetchGlobalRanking();
      socialStore.fetchPosts();
      socialStore.fetchUnreadCounts(profile.id);
      unsubscribeEvents = socialStore.subscribeToSocialEvents(profile.id);
    }
    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, [profile?.id]);

  useEffect(() => {
    let commentsChannel: any = null;
    if (expandedComments) {
      commentsChannel = supabase.channel(`comments_${expandedComments}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${expandedComments}` }, async () => {
          const comments = await socialStore.fetchComments(expandedComments);
          setPostComments(prev => ({ ...prev, [expandedComments]: comments }));
        })
        .subscribe();
    }
    return () => {
      if (commentsChannel) supabase.removeChannel(commentsChannel);
    };
  }, [expandedComments]);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert(t('social.cameraPermission', 'Camera permission is required.'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.2 });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(t('social.galleryPermission', 'Gallery permission is required.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setSelectedAudio(null);
    }
  };

  const handleSelectAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedAudio(result.assets[0].uri);
        setSelectedImage(null);
      }
    } catch (e) {
      console.warn('Error audio:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await socialStore.searchUsers(searchQuery);
    setSearchResults(results.filter(u => u.id !== profile?.id));
    setIsSearching(false);
  };

  const handleAddFriend = async (userId: string) => {
    if (profile?.id) {
      await socialStore.addFriend(profile.id, userId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage && !selectedAudio || !profile?.id) return;
    setIsPosting(true);
    let imageUrl = null;
    let audioUrl = null;
    if (selectedImage) {
      imageUrl = await socialStore.uploadPostImage(selectedImage);
    } else if (selectedAudio) {
      audioUrl = await socialStore.uploadPostAudio(selectedAudio);
    }
    await socialStore.createPost({ user_id: profile.id, content: newPostContent, image_url: imageUrl || undefined, audio_url: audioUrl || undefined });
    setNewPostContent('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setIsPosting(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!profile?.id) return;
    if (isLiked) {
      await socialStore.unlikePost(postId, profile.id);
    } else {
      await socialStore.likePost(postId, profile.id);
    }
  };

  const handleShare = async (content: string) => {
    try {
      await Share.share({ message: `${content}\n\n${t('social.sharedFrom', 'Shared from FitGo')}` });
    } catch (error) {
      console.warn(error);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      const comments = await socialStore.fetchComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !profile?.id) return;
    await socialStore.addComment(postId, profile.id, newComment);
    setNewComment('');
    const updatedComments = await socialStore.fetchComments(postId);
    setPostComments(prev => ({ ...prev, [postId]: updatedComments }));
  };

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveCommentEdit = async (commentId: string, postId: string) => {
    if (!editingCommentText.trim()) return;
    await socialStore.editComment(commentId, editingCommentText);
    setEditingCommentId(null);
    setEditingCommentText('');
    const updatedComments = await socialStore.fetchComments(postId);
    setPostComments(prev => ({ ...prev, [postId]: updatedComments }));
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    await socialStore.deleteComment(commentId);
    const updatedComments = await socialStore.fetchComments(postId);
    setPostComments(prev => ({ ...prev, [postId]: updatedComments }));
  };

  const generateAIChallenge = async () => {
    setAiLoading(true);
    try {
      const response = await generateSocialChallenge(language);
      setAiRecommendation(response);
    } catch (err) {
      setAiRecommendation('Camina 10,000 pasos durante 3 días seguidos.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateChallenge = async (overrideTitle?: string, overrideFriendIds?: string[], overrideIncludeSelf?: boolean) => {
    if (!profile?.id) return;
    const title = overrideTitle || challengeForm.title;
    if (!title) return;
    const targetVal = challengeForm.type === 'physical' ? 1 : (parseFloat(challengeForm.target_value) || 0);
    const days = parseInt(challengeForm.duration_days) || 7;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);
    const challenge = {
      creator_id: profile.id, title,
      description: overrideTitle ? (aiRecommendation || '') : (challengeForm.type === 'physical' ? challengeForm.custom_goal : challengeForm.description),
      type: overrideTitle ? challengeForm.type : challengeForm.type,
      target_value: targetVal,
      start_date: getLocalDateString(startDate),
      end_date: getLocalDateString(endDate),
      status: 'active' as any,
    };
    const friendIds = overrideFriendIds ?? challengeForm.selectedFriendIds;
    const includeSelf = overrideIncludeSelf ?? challengeForm.includeSelf;
    const participants = includeSelf ? [profile.id, ...friendIds] : [...friendIds];
    if (!participants.includes(profile.id)) participants.unshift(profile.id);
    await socialStore.createChallenge(challenge, participants);
    setIsCreatingChallenge(false);
    setAiChallengeParticipantModal(false);
    setAiChallengeSelectedFriends([]);
    setAiChallengeTitle('');
    setAiChallengeIncludeSelf(true);
    setChallengeForm({ title: '', description: '', type: 'steps', target_value: '10000', custom_goal: '', duration_days: '7', selectedFriendIds: [], includeSelf: true });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  };

  const handleImageModal = () => setIsImageModalVisible(true);

  const handleUserPress = (user: any) => setInspectingUser(user);

  const handleChat = (friend: any) => {
    router.push({
      pathname: '/modals/chat',
      params: { friendId: friend.friend_profile?.id, friendName: friend.friend_profile?.name, friendAvatar: friend.friend_profile?.avatar_url || '' },
    } as any);
  };

  const handleNavigateAchievements = () => router.navigate('/modals/achievements' as any);

  const handleSetTab = (tab: string) => setActiveTab(tab as TabType);

  const renderRanking = () => {
    const userRankInfo = socialStore.globalRanking.find((u: any) => u.id === profile?.id);
    const userRankIndex = socialStore.globalRanking.findIndex((u: any) => u.id === profile?.id);
    const userGrade = userRankInfo ? getRank(userRankInfo.points) : getRank(0);

    return (
      <View style={s.tabContent}>
        {userRankInfo && (
          <GlassCard style={{ marginBottom: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: userGrade.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[s.rankBadge, { width: 44, height: 44, borderRadius: 12, backgroundColor: userGrade.bg, minWidth: 44, marginLeft: 0 }]}>
                  <Text style={[s.rankText, { fontSize: 20, color: userGrade.color }]}>{userGrade.label}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{t('social.ranking.currentRank')}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>#{userRankIndex + 1} {t('social.ranking.inWorld')}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>{Math.round(userRankInfo.points)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>{t('social.ranking.points')}</Text>
              </View>
            </View>
          </GlassCard>
        )}
        <GlassCard accentColor="#F59E0B" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Trophy size={24} color="#F59E0B" />
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.ranking.globalRanking')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRankingInstructions(true)} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full }}>
              <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold' }}>INFO</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>{t('social.ranking.description')}</Text>
          {socialStore.isRankingLoading && socialStore.globalRanking.length === 0 ? (
            <ActivityIndicator color="#F59E0B" />
          ) : (
            socialStore.globalRanking.map((user: any, index: number) => {
              const rank = getRank(user.points);
              return (
                <View key={user.id} style={[s.userRow, { borderBottomColor: colors.border + '33' }]}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }} onPress={() => setInspectingUser(user)}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: index < 3 ? '#F59E0B' : colors.textMuted, width: 24 }}>{index + 1}</Text>
                    <View style={{ position: 'relative' }}>
                      {user.avatar_url ? (
                        <Image cachePolicy="memory-disk" source={{ uri: user.avatar_url }} style={s.avatarSmall} />
                      ) : (
                        <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                          <Text style={[s.avatarInitials, { fontSize: 14 }]}>{user.name?.[0]}</Text>
                        </View>
                      )}
                      {rank.label.includes('S') && (
                        <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: rank.color, borderWidth: 2, borderColor: colors.background, shadowColor: rank.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 }} />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[s.userName, getNameStyle(user.name_color, user.id, profile?.id, profile?.nameColor, premiumColor)]}>{user.name}</Text>
                      <View style={[s.rankBadge, { backgroundColor: rank.bg, borderColor: rank.color + '40', borderWidth: 1 }]}>
                        <Text style={[s.rankText, { color: rank.color }]}>{rank.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 14 }}>{Math.round(user.points)}</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>{t('profile.points', 'Points')}</Text>
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>
        <Modal visible={showRankingInstructions} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', backgroundColor: colors.background, borderRadius: Radius.xl, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Trophy size={24} color="#F59E0B" />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{t('social.ranking.instructionsTitle')}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowRankingInstructions(false)} style={s.iconBtn}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 24 }}>{t('social.ranking.instructionsDesc')}</Text>
              <TouchableOpacity onPress={() => setShowRankingInstructions(false)} style={[s.mainBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('social.ranking.gotIt')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderChallenges = () => {
    const acceptedFriends = socialStore.friends.filter((f: any) => f.status === 'accepted');

    return (
      <View style={s.tabContent}>
        {!isCreatingChallenge ? (
          <GlassCard accentColor={colors.error} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sword size={24} color={colors.error} />
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.fitgoChallenges', 'FitGo Challenges')}</Text>
            </View>
            <TouchableOpacity style={[s.aiBtn, { backgroundColor: colors.surfaceAlt }]} onPress={generateAIChallenge}>
              <Bot size={20} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', flex: 1 }}>{t('social.challenges.aiSuggestion', "Fitz Suggestion (AI)")}</Text>
            </TouchableOpacity>
            {aiLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 15 }} />}
            {aiRecommendation && !aiLoading && (
              <View style={[s.aiResult, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '33' }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontStyle: 'italic', lineHeight: 20 }}>
                  {`"${aiRecommendation}"`}
                </Text>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.primary, marginTop: 12, alignSelf: 'flex-start' }]}
                  onPress={() => { setAiChallengeTitle(`Reto IA: ${new Date().toLocaleDateString()}`); setAiChallengeSelectedFriends([]); setAiChallengeParticipantModal(true); }}
                >
                  <Text style={s.actionBtnText}>{t('social.challenges.acceptChallenge')}</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[s.mainBtn, { backgroundColor: colors.primary, marginTop: 15 }]}
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsCreatingChallenge(true); }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('social.challenges.newCustomChallenge', 'New Custom Challenge')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard accentColor={colors.primary} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.challenges.createNew', 'Create New Challenge')}</Text>
              <TouchableOpacity onPress={() => setIsCreatingChallenge(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.challengeTitle', 'Challenge Title')}</Text>
            <TextInput style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]} placeholder={t('social.challenges.titlePlaceholder')} placeholderTextColor={colors.textMuted} value={challengeForm.title} onChangeText={t => setChallengeForm({...challengeForm, title: t})} />
            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.description', 'Description')}</Text>
            <TextInput style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, height: 80 }]} placeholder={t('social.challenges.descPlaceholder')} placeholderTextColor={colors.textMuted} multiline value={challengeForm.description} onChangeText={t => setChallengeForm({...challengeForm, description: t})} />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.type', 'Type')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['steps', 'calories', 'physical'] as const).map(type => (
                    <TouchableOpacity key={type} style={[s.typeBtn, { backgroundColor: challengeForm.type === type ? colors.primary : colors.surfaceAlt }]} onPress={() => setChallengeForm({...challengeForm, type})}>
                      <Text style={{ color: challengeForm.type === type ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                        {type === 'steps' ? `🚶 ${t('social.challenges.steps', 'Steps')}` : type === 'calories' ? `🔥 ${t('social.challenges.calories', 'Calories')}` : `💪 ${t('social.challenges.physical', 'Physical')}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.days', 'Days')}</Text>
                <TextInput style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, marginBottom: 0 }]} keyboardType="numeric" value={challengeForm.duration_days} onChangeText={t => setChallengeForm({...challengeForm, duration_days: t})} />
              </View>
            </View>
            {challengeForm.type === 'physical' ? (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.customGoalLabel', 'Custom goal')}</Text>
                <TextInput style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, height: 80 }]} placeholder={t('social.challenges.customGoalPlaceholder', 'e.g. 100 pushups...')} placeholderTextColor={colors.textMuted} multiline value={challengeForm.custom_goal} onChangeText={t => setChallengeForm({...challengeForm, custom_goal: t})} />
              </View>
            ) : (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.goalTitle', 'Goal')} ({challengeForm.type === 'steps' ? t('social.challenges.stepsPerDay', 'Steps per day') : t('social.challenges.caloriesPerDay', 'Calories per day')})</Text>
                <TextInput style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]} keyboardType="numeric" value={challengeForm.target_value} onChangeText={t => setChallengeForm({...challengeForm, target_value: t})} />
              </View>
            )}
            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.whoParticipates', 'Who participates?')}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>{t('social.challenges.tapToSelect', 'Tap to select. You can include yourself and multiple friends.')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <TouchableOpacity style={[s.friendSelectCard, { backgroundColor: challengeForm.includeSelf ? colors.primary + '20' : colors.surfaceAlt, borderColor: challengeForm.includeSelf ? colors.primary : 'transparent', borderWidth: 2 }]} onPress={() => setChallengeForm({...challengeForm, includeSelf: !challengeForm.includeSelf})}>
                {profile?.avatarUrl ? (
                  <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                    <Text style={[s.avatarInitials, { fontSize: 16 }]}>{profile?.name?.[0]}</Text>
                  </View>
                )}
                <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>{t('social.challenges.me', 'Me')}</Text>
                {challengeForm.includeSelf && <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text></View>}
              </TouchableOpacity>
              {acceptedFriends.map((friend: any) => {
                const fid = friend.friend_profile?.id || '';
                const isSelected = challengeForm.selectedFriendIds.includes(fid);
                return (
                  <TouchableOpacity key={fid} style={[s.friendSelectCard, { backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceAlt, borderColor: isSelected ? colors.primary : 'transparent', borderWidth: 2 }]} onPress={() => { const current = challengeForm.selectedFriendIds; const updated = current.includes(fid) ? current.filter((id: string) => id !== fid) : [...current, fid]; setChallengeForm({...challengeForm, selectedFriendIds: updated}); }}>
                    {friend.friend_profile?.avatar_url ? (
                      <Image cachePolicy="memory-disk" source={{ uri: friend.friend_profile.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                        <Text style={[s.avatarInitials, { fontSize: 16 }]}>{friend.friend_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>{friend.friend_profile?.name?.split(' ')[0]}</Text>
                    {isSelected && <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[s.mainBtn, { backgroundColor: challengeForm.title ? colors.primary : colors.surfaceAlt }]} onPress={() => handleCreateChallenge()} disabled={!challengeForm.title}>
              <Text style={{ color: challengeForm.title ? '#fff' : colors.textMuted, fontWeight: 'bold', fontSize: 16 }}>
                {challengeForm.selectedFriendIds.length === 0 && challengeForm.includeSelf
                   ? `🎯 ${t('social.challenges.startSolo', 'Start (only me)')}`
                  : challengeForm.selectedFriendIds.length > 0 && challengeForm.includeSelf
                   ? `⚔️ ${t('social.challenges.meAndFriends', 'Me + {{count}} friends', { count: challengeForm.selectedFriendIds.length })}`
                  : challengeForm.selectedFriendIds.length > 0
                   ? `⚔️ ${t('social.challenges.challengeFriends', 'Challenge {{count}} friends', { count: challengeForm.selectedFriendIds.length })}`
                   : `🎯 ${t('social.challenges.start', 'Start')}`
                }
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.activeChallenges', 'Active Challenges')}</Text>
        {socialStore.challenges.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>No hay retos activos.</Text>
        ) : (
          socialStore.challenges.map((challenge: any) => (
            <GlassCard key={challenge.id} style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: challenge.status === 'completed' ? colors.success : colors.error }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.userName, { color: colors.textPrimary, fontSize: 16 }]}>{challenge.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{challenge.description || `Reto de ${challenge.type}`}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={[s.chip, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{challenge.type === 'steps' ? 'Pasos' : 'Calorías'}</Text>
                    </View>
                    <View style={[s.chip, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>Objetivo: {challenge.target_value}</Text>
                    </View>
                  </View>
                  {(() => {
                    const todayStr = getLocalDateString(new Date());
                    let currentProgress = 0;
                    if (challenge.type === 'steps') {
                      currentProgress = nutritionStore.dailySteps?.[todayStr] || 0;
                    } else if (challenge.type === 'calories') {
                      currentProgress = 0;
                    }
                    const target = challenge.target_value || 1;
                    const percentage = challenge.status === 'completed' ? 100 : Math.min(100, Math.round((currentProgress / target) * 100));
                    const isFullyCompleted = challenge.status === 'completed' || percentage >= 100;
                    return (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                          <View style={{ height: 6, flex: 1, backgroundColor: colors.border + '33', borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: isFullyCompleted ? colors.success : colors.primary, borderRadius: 3 }} />
                          </View>
                          <Text style={{ color: isFullyCompleted ? colors.success : colors.primary, fontSize: 11, fontWeight: '800', marginLeft: 10 }}>{percentage}%</Text>
                        </View>
                        {challenge.status !== 'completed' && (
                          <TouchableOpacity
                            style={{ marginTop: 16, paddingVertical: 10, backgroundColor: isFullyCompleted || challenge.type === 'physical' ? colors.primary : colors.surfaceAlt, borderRadius: Radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, opacity: isFullyCompleted || challenge.type === 'physical' ? 1 : 0.6 }}
                            onPress={() => { if (profile?.id) { socialStore.completeChallengeAndAwardPoints(challenge.id, profile.id); } }}
                          >
                            <Check size={18} color={isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary} />
                            <Text style={{ color: isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                              {t('social.challenges.markAsCompleted', 'Mark as completed')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </View>
    );
  };

  if (!profile) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>FitGo Social</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {(['you', 'feed', 'friends', 'ranking', 'challenges'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={{ borderRadius: 100, overflow: 'hidden', marginRight: 10 }}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab); }}
              >
                <LinearGradient
                  colors={isActive ? [colors.primary, colors.secondary || '#A855F7'] : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.tab, { backgroundColor: isActive ? 'transparent' : colors.surfaceAlt }]}
                >
                  <Text style={[s.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                    {tab === 'you' ? 'Tú' : tab === 'feed' ? 'Comunidad' : tab === 'friends' ? 'Amigos' : tab === 'ranking' ? 'Ranking' : 'Retos'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'you' && (
            <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
            <SocialProfileTab
              profile={profile}
              socialStore={socialStore}
              colors={colors}
              t={t}
              onSetTab={handleSetTab}
              onNavigateAchievements={handleNavigateAchievements}
              onDeletePost={(id: string) => socialStore.deletePost(id)}
              onUserPress={handleUserPress}
            />
            </Suspense>
          )}
          {activeTab === 'feed' && (
            <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
            <SocialFeedTab
              profile={profile}
              socialStore={socialStore}
              colors={colors}
              t={t}
              getNameStyle={getNameStyle}
              premiumColor={premiumColor ?? undefined}
              newPostContent={newPostContent}
              selectedImage={selectedImage}
              selectedAudio={selectedAudio}
              isPosting={isPosting}
              expandedComments={expandedComments}
              postComments={postComments}
              newComment={newComment}
              editingCommentId={editingCommentId}
              editingCommentText={editingCommentText}
              onNewPostContentChange={setNewPostContent}
              onSelectImage={handleImageModal}
              onSelectAudio={handleSelectAudio}
              onRemoveImage={() => { setSelectedImage(null); setSelectedAudio(null); }}
              onCreatePost={handleCreatePost}
              onLike={handleLike}
              onToggleComments={toggleComments}
              onDelete={(id: string) => socialStore.deletePost(id)}
              onShare={handleShare}
              onUserPress={handleUserPress}
              onNewCommentChange={setNewComment}
              onAddComment={handleAddComment}
              onStartEditComment={handleStartEditComment}
              onCancelCommentEdit={handleCancelCommentEdit}
              onSaveCommentEdit={handleSaveCommentEdit}
              onDeleteComment={handleDeleteComment}
              onEditingTextChange={setEditingCommentText}
            />
            </Suspense>
          )}
          {activeTab === 'friends' && (
            <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
            <SocialFriendsTab
              profile={profile}
              socialStore={socialStore}
              colors={colors}
              t={t}
              getNameStyle={getNameStyle}
              premiumColor={premiumColor ?? undefined}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearch}
              onAddFriend={handleAddFriend}
              onAcceptFriend={(id: string) => socialStore.acceptFriend(id)}
              onRejectFriend={(id: string) => socialStore.rejectFriend(id)}
              onUserPress={handleUserPress}
              onChat={handleChat}
            />
            </Suspense>
          )}
          {activeTab === 'ranking' && renderRanking()}
          {activeTab === 'challenges' && renderChallenges()}
        </ScrollView>
      </GestureDetector>

      <Modal visible={!!inspectingUser} transparent animationType="fade" onRequestClose={() => setInspectingUser(null)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24, zIndex: 1000 }]}>
          <GlassCard style={{ padding: 0, overflow: 'hidden', borderRadius: 24 }}>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 20 }} onPress={() => setInspectingUser(null)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 14, marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, borderWidth: 3, borderColor: colors.primary + '60' }}>
                {inspectingUser?.avatar_url ? (
                  <Image cachePolicy="memory-disk" source={{ uri: inspectingUser.avatar_url }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 84, height: 84, borderRadius: 42 }]}>
                    <Text style={[s.avatarInitials, { fontSize: 32 }]}>{inspectingUser?.name?.[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={[{ fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginBottom: 4, textAlign: 'center' }, getNameStyle(inspectingUser?.name_color, inspectingUser?.id, profile?.id, profile?.nameColor, inspectingUser?.isPro)]}>{inspectingUser?.name}</Text>
              {(() => {
                const rankInfo = socialStore.globalRanking.find((u: any) => u.id === inspectingUser?.id);
                const rankIndex = socialStore.globalRanking.findIndex((u: any) => u.id === inspectingUser?.id);
                if (!rankInfo) return null;
                const grade = getRank(rankInfo.points);
                return (
                  <View style={{ flexDirection: 'row', gap: 20, marginTop: 10, marginBottom: 4 }}>
                    <View style={{ alignItems: 'center' }}><Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 16 }}>#{rankIndex + 1}</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>{t('competitive.ranking', 'Ranking')}</Text></View>
                    <View style={{ width: 1, backgroundColor: colors.border + '40' }} />
                    <View style={{ alignItems: 'center' }}><Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>{Math.round(rankInfo.points)}</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>{t('profile.points', 'Points')}</Text></View>
                    <View style={{ width: 1, backgroundColor: colors.border + '40' }} />
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ backgroundColor: grade.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}><Text style={{ color: grade.color, fontWeight: '900', fontSize: 14 }}>{grade.label}</Text></View>
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{t('competitive.class', 'Class')}</Text>
                    </View>
                  </View>
                );
              })()}
              {(() => {
                if (inspectingUser?.id === profile?.id) return null;
                const friendStatus = socialStore.friends.find((f: any) =>
                  (f.user_id_1 === profile?.id && f.user_id_2 === inspectingUser?.id) ||
                  (f.user_id_2 === profile?.id && f.user_id_1 === inspectingUser?.id)
                );
                return (
                  <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border + '40', flexDirection: 'row', gap: 8 }}
                      onPress={() => { router.push({ pathname: '/modals/user-profile', params: { userId: inspectingUser.id, name: inspectingUser.name, avatarUrl: inspectingUser.avatar_url } }); setInspectingUser(null); }}
                    >
                      <Users size={16} color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{t('social.viewFullProfile', 'View Full Profile')}</Text>
                    </TouchableOpacity>
                    {friendStatus?.status === 'accepted' ? (
                      <View style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success + '20', flexDirection: 'row', gap: 8 }}>
                        <Check size={16} color={colors.success} />
                        <Text style={{ color: colors.success, fontWeight: '700', fontSize: 14 }}>{t('social.friends.alreadyFriends', 'Already Friends')}</Text>
                      </View>
                    ) : friendStatus?.status === 'pending' ? (
                      <View style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, flexDirection: 'row', gap: 8 }}>
                        <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 14 }}>{t('social.pendingRequest', 'Pending Request')}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{ height: 48, borderRadius: 14, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}
                        onPress={async () => { await handleAddFriend(inspectingUser.id); setInspectingUser(null); }}
                      >
                        <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Plus size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('social.friends.add', 'Add Friend')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
            </View>
          </GlassCard>
        </View>
      </Modal>

      <Modal visible={aiChallengeParticipantModal} transparent animationType="slide" onRequestClose={() => setAiChallengeParticipantModal(false)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 1000 }]}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{t('social.challenges.whoParticipates', 'Who participates?')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>{t('social.challenges.tapToSelect', 'Tap to select. You can include yourself and multiple friends.')}</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, backgroundColor: aiChallengeIncludeSelf ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1.5, borderColor: aiChallengeIncludeSelf ? colors.primary : 'transparent' }}
                onPress={() => setAiChallengeIncludeSelf(v => !v)}
              >
                {profile?.avatarUrl ? (
                  <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                    <Text style={[s.avatarInitials, { fontSize: 16 }]}>{profile?.name?.[0]}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{t('social.challenges.me', 'Me')} ({profile?.name})</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('social.challenges.participate', 'Participate in the challenge')}</Text>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: aiChallengeIncludeSelf ? colors.primary : colors.border + '50', alignItems: 'center', justifyContent: 'center', borderWidth: aiChallengeIncludeSelf ? 0 : 1.5, borderColor: colors.border }}>
                  {aiChallengeIncludeSelf && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                </View>
              </TouchableOpacity>
              {socialStore.friends.filter((f: any) => f.status === 'accepted').map((friend: any) => {
                const fid = friend.friend_profile?.id || '';
                const isSelected = aiChallengeSelectedFriends.includes(fid);
                return (
                  <TouchableOpacity
                    key={fid}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1.5, borderColor: isSelected ? colors.primary : 'transparent' }}
                    onPress={() => { const updated = isSelected ? aiChallengeSelectedFriends.filter((id: string) => id !== fid) : [...aiChallengeSelectedFriends, fid]; setAiChallengeSelectedFriends(updated); }}
                  >
                    {friend.friend_profile?.avatar_url ? (
                      <Image cachePolicy="memory-disk" source={{ uri: friend.friend_profile.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                        <Text style={[s.avatarInitials, { fontSize: 16 }]}>{friend.friend_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{friend.friend_profile?.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('social.friend', 'Friend')}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isSelected ? colors.primary : colors.border + '50', alignItems: 'center', justifyContent: 'center', borderWidth: isSelected ? 0 : 1.5, borderColor: colors.border }}>
                      {isSelected && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }} onPress={() => setAiChallengeParticipantModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 15 }}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 2, height: 52, borderRadius: 16, overflow: 'hidden' }} onPress={() => handleCreateChallenge(aiChallengeTitle, aiChallengeSelectedFriends, aiChallengeIncludeSelf)}>
                <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>
                    {aiChallengeSelectedFriends.length === 0 && aiChallengeIncludeSelf
                      ? '🎯 Aceptar (solo yo)'
                      : aiChallengeSelectedFriends.length > 0 && aiChallengeIncludeSelf
                      ? `⚔️ Yo + ${aiChallengeSelectedFriends.length} amigo${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                      : `⚔️ Retar a ${aiChallengeSelectedFriends.length} amigo${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImagePickerModal
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onCamera={handleCamera}
        onGallery={handleGallery}
      />
    </SafeAreaView>
  );
}
