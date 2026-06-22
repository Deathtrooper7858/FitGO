import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Share, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, Trophy, Users, Plus, Check, X, MessageSquare, Heart, Share2, Send, Trash2, Camera, Pencil, Filter } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getNameStyle } from '../../utils/styles';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants';
import { GlassCard } from '../../components/GlassCard';
import { useSocialStore, useAuthStore, useSettingsStore, usePurchaseStore } from '../../store';
import { ImageViewerModal } from '../../components/ImageViewerModal';
import { CustomAlert } from '../../components/CustomAlert';
import { AvatarViewerModal } from '../../components/AvatarViewerModal';
import { supabase } from '../../services/supabase';
import { useAchievements, ALL_BADGES } from '../../hooks/useAchievements';
import { parsePostContent, formatPostContent } from '../../utils/language';
import { MediaPickerModal } from '../MediaPickerModal';
import { CommentList } from './modal/CommentList';
import { PostCard, PostAudioPlayer } from './modal/PostCard';
import { VideoPlayerView } from './VideoPlayerView';



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

  // Feed Styles
  postInputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  postInput: { flex: 1, fontSize: 15, minHeight: 40, paddingTop: 8 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  postTool: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: 'rgba(0,0,0,0.03)' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  imagePreview: { width: '100%', height: 200, borderRadius: Radius.lg },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: Radius.lg, marginBottom: 12 },
  postFooter: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  postAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },

  commentsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14 },
  commentBubble: { flex: 1, padding: 12, borderRadius: Radius.lg, borderTopLeftRadius: 4 },
  commentUser: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, height: 44, borderRadius: Radius.full, paddingHorizontal: 16, fontSize: 14 },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  gradientIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Challenges Form Styles
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  inputField: { height: 48, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  friendSelectCard: { width: 80, padding: 12, borderRadius: Radius.lg, alignItems: 'center', marginRight: 12, borderWidth: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '900',
  },
});

interface FitGOSocialProps {
  initialTab?: TabType;
  initialFriendsTab?: 'list' | 'search' | 'requests';
  onNavigateToCompetitive?: () => void;
}

export default function FitGOSocial({
  initialTab = 'you',
  initialFriendsTab = 'list',
  onNavigateToCompetitive
}: FitGOSocialProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { profile } = useAuthStore();
  const { premiumColor } = useSettingsStore();
  const { isPro } = usePurchaseStore();
  const socialStore = useSocialStore();
  const [friendsTab, setFriendsTab] = useState<'list' | 'requests' | 'search'>(initialFriendsTab);
  const [deleteFriendAlert, setDeleteFriendAlert] = useState<{ friendId: string; friendName: string } | null>(null);
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialFriendsTab) {
      setFriendsTab(initialFriendsTab);
    }
  }, [initialFriendsTab]);

  const TABS: TabType[] = ['you', 'feed', 'friends'];
  const FRIENDS_TABS: ('list' | 'search' | 'requests')[] = ['list', 'search', 'requests'];
  
  const handleSwipeTab = (direction: 1 | -1) => {
    Haptics.selectionAsync();
    if (activeTab === 'friends') {
      const currentFriendsIdx = FRIENDS_TABS.indexOf(friendsTab);
      const nextFriendsIdx = currentFriendsIdx + direction;
      if (nextFriendsIdx >= 0 && nextFriendsIdx < FRIENDS_TABS.length) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFriendsTab(FRIENDS_TABS[nextFriendsIdx]);
        return;
      } else if (nextFriendsIdx < 0) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab('feed');
        return;
      } else if (nextFriendsIdx >= FRIENDS_TABS.length) {
        if (onNavigateToCompetitive) {
          onNavigateToCompetitive();
          return;
        }
      }
    }

    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < TABS.length) {
      setActiveTab(TABS[newIndex]);
    } else if (newIndex < 0 && activeTab === 'you') {
      router.push('/(tabs)/planner' as any);
    } else if (newIndex >= TABS.length && activeTab === 'friends') {
      if (onNavigateToCompetitive) {
        onNavigateToCompetitive();
      }
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-12, 12])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 80) {
        // Drag right (translationX > 0) -> go to previous tab (-1)
        // Drag left (translationX < 0) -> go to next tab (+1)
        handleSwipeTab(e.translationX > 0 ? -1 : 1);
      }
    });
  

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);


  // Feed Filter States
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [contentFilter, setContentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);


  // Comments state
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [inspectingUser, setInspectingUser] = useState<any>(null);
  const [avatarViewerData, setAvatarViewerData] = useState<{ url: string; name: string } | null>(null);
  const { achievements } = useAchievements();

  const getRank = (points: number) => {
    if (points >= 15000) return { label: 'S++', color: '#FF0055', bg: '#FF005520', glow: '#FF005550' };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedComments]);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert(t('social.cameraPermission', 'Se necesita permiso para acceder a la cámara.'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
    }
  };

  const handleRecordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert(t('social.cameraPermission', 'Se necesita permiso para acceder a la cámara.'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(t('social.galleryPermission', 'Se necesita permiso para acceder a la galería.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.type === 'video') {
        setSelectedVideo(asset.uri);
        setSelectedImage(null);
        setSelectedAudio(null);
      } else {
        setSelectedImage(asset.uri);
        setSelectedVideo(null);
        setSelectedAudio(null);
      }
    }
  };

  const handleSelectAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedAudio(result.assets[0].uri);
        setSelectedImage(null);
        setSelectedVideo(null);
      }
    } catch (error) {
      console.warn('Error selecting audio:', error);
    }
  };


  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await socialStore.searchUsers(searchQuery);
    setSearchResults(results.filter(u => u.id !== profile?.id));
    setIsSearching(false);
  }, [searchQuery, socialStore, profile?.id]);

  const handleAddFriend = useCallback(async (userId: string) => {
    if (profile?.id) {
      await socialStore.addFriend(profile.id, userId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [profile?.id, socialStore]);

  const handleCreatePost = useCallback(async () => {
    if (!newPostContent.trim() && !selectedImage && !selectedVideo && !selectedAudio || !profile?.id) return;
    setIsPosting(true);
    let imageUrl = null;
    let audioUrl = null;
    if (selectedVideo) {
      imageUrl = await socialStore.uploadPostVideo(selectedVideo);
    } else if (selectedImage) {
      imageUrl = await socialStore.uploadPostImage(selectedImage);
    } else if (selectedAudio) {
      audioUrl = await socialStore.uploadPostAudio(selectedAudio);
    }

    await socialStore.createPost({
      user_id: profile.id,
      content: formatPostContent(newPostContent),
      image_url: imageUrl || undefined,
      audio_url: audioUrl || undefined,
    });
    
    setNewPostContent('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setSelectedAudio(null);
    setIsPosting(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [newPostContent, selectedImage, selectedVideo, selectedAudio, profile?.id, socialStore]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!profile?.id) return;
    if (isLiked) {
      await socialStore.unlikePost(postId, profile.id);
    } else {
      await socialStore.likePost(postId, profile.id);
    }
  }, [profile?.id, socialStore]);

  const handleShare = useCallback(async (content: string) => {
    try {
      await Share.share({
        message: `${content}\n\n${t('social.sharedFrom', 'Compartido desde FitGo')}`,
      });
    } catch (error) {
      console.warn(error);
    }
  }, [t]);

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

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...socialStore.posts];

    // 1. Filter by search query
    if (feedSearchQuery.trim()) {
      const query = feedSearchQuery.toLowerCase();
      result = result.filter(post => {
        const { cleanContent } = parsePostContent(post.content);
        const name = post.user_profile?.name?.toLowerCase() || '';
        return cleanContent.toLowerCase().includes(query) || name.includes(query);
      });
    }

    // 2. Filter by language
    if (selectedLanguage !== 'all') {
      const KNOWN_LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ru'];
      result = result.filter(post => {
        const { language } = parsePostContent(post.content);
        if (selectedLanguage === 'other') {
          return !KNOWN_LANGS.includes(language);
        }
        return language === selectedLanguage;
      });
    }

    // 3. Filter by content type
    if (contentFilter === 'images') {
      result = result.filter(post => !!post.image_url && !post.image_url.toLowerCase().includes('.mp4') && !post.image_url.toLowerCase().includes('.mov'));
    } else if (contentFilter === 'text') {
      result = result.filter(post => !post.image_url && !post.audio_url);
    } else if (contentFilter === 'audio') {
      result = result.filter(post => !!post.audio_url);
    }

    // 4. Sort
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sortBy === 'commented') {
      result.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    }

    return result;
  }, [socialStore.posts, feedSearchQuery, selectedLanguage, contentFilter, sortBy]);


  const renderYou = () => {
    const acceptedFriends = socialStore.friends.filter(f => f.status === 'accepted');
    const userRankInfo = socialStore.globalRanking.find(u => u.id === profile?.id);
    const userRankIndex = socialStore.globalRanking.findIndex(u => u.id === profile?.id);
    const myPosts = socialStore.posts.filter(p => p.user_id === profile?.id);
    const currentBadgeId = profile?.selectedBadge || (profile?.role === 'owner' ? 'owner' : profile?.role === 'super_admin' ? 'super_admin' : profile?.role === 'admin' ? 'admin' : profile?.isPro ? 'pro' : 'verified');
    const currentBadge = ALL_BADGES[currentBadgeId] || ALL_BADGES.verified;

    return (
      <View style={s.tabContent}>
        <GlassCard style={{ marginBottom: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            ) : (
              <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 64, height: 64, borderRadius: 32 }]}>
                <Text style={[s.avatarInitials, { fontSize: 24 }]}>{profile?.name?.[0]}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 20, fontWeight: 'bold' }, getNameStyle(profile?.nameColor, profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{profile?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={[s.chip, { backgroundColor: currentBadge.colors[0] + '20', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Text style={{ fontSize: 12 }}>{currentBadge.icon}</Text>
                  <Text style={{ color: currentBadge.colors[0], fontSize: 12, fontWeight: '700' }}>{String(t(`achievements.badges.${currentBadgeId}.label`, currentBadge.label))}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border + '30', justifyContent: 'space-around' }}>
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setActiveTab('friends')}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{acceptedFriends.length}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.friends', 'Friends')}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setActiveTab('ranking')}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>#{userRankIndex >= 0 ? userRankIndex + 1 : '-'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.ranking')}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: colors.border + '30' }} />
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setActiveTab('ranking')}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{Math.round(userRankInfo?.points || 0)}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('social.you.points')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {(() => {
          const isValidHex = !!(premiumColor && premiumColor.startsWith('#'));
          const safePremiumColor = isValidHex ? premiumColor! : '#7C5CFC';
          const isPremiumCustom = (isPro || profile?.isPro) && isValidHex;
          const accentColor = isPremiumCustom ? safePremiumColor : colors.primary;
          return (
            <>
              {profile?.pinnedAchievements && profile.pinnedAchievements.length > 0 && (
                <View
                  style={
                    isPremiumCustom && premiumColor
                      ? {
                          marginBottom: Spacing.md,
                          borderRadius: 20,
                          shadowColor: premiumColor,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.6,
                          shadowRadius: 12,
                        }
                      : { marginBottom: Spacing.md }
                  }
                >
                  <View
                    style={{
                      borderRadius: 20,
                      overflow: 'hidden',
                      borderWidth: isPremiumCustom ? 1.5 : 1,
                      borderColor: isPremiumCustom ? safePremiumColor + '80' : colors.border,
                    }}
                  >
                    {isPremiumCustom && premiumColor ? (
                      <LinearGradient
                        colors={[safePremiumColor + '25', safePremiumColor + '10', 'transparent'] as [string, string, string]}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, borderRadius: 20 }]} />
                    )}
                    {isPremiumCustom && premiumColor && (
                      <LinearGradient
                        colors={[safePremiumColor + 'DD', safePremiumColor + '00'] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
                      />
                    )}
                    <View style={{ padding: Spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{t('social.you.trophyShowcase', '🏆 Trophy Showcase')}</Text>
                        <TouchableOpacity onPress={() => router.push('/modals/achievements' as any)}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>{t('common.edit', 'Editar')}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                        {profile.pinnedAchievements.map(id => {
                          const ach = achievements.find((a: any) => a.id === id);
                          if (!ach) return null;
                          const isHolo = ach.tier === 'oro' || ach.tier === 'diamante';
                          const tierColor = ach.tier === 'diamante' ? '#38BDF8' : 
                                            ach.tier === 'oro' ? '#FBBF24' : 
                                            ach.tier === 'plata' ? '#9CA3AF' : '#D97706';
                          return (
                            <View key={id} style={{
                              flex: 1, backgroundColor: isPremiumCustom ? (safePremiumColor + '12') : (isHolo ? tierColor + '10' : 'transparent'), padding: Spacing.sm, borderRadius: 16, alignItems: 'center',
                              borderWidth: 1, borderColor: isHolo ? tierColor + '50' : (isPremiumCustom ? safePremiumColor + '30' : 'transparent')
                            }}>
                              <LinearGradient
                                colors={(isHolo ? [tierColor, tierColor === '#FBBF24' ? '#EA580C' : '#4F46E5'] : ['transparent', 'transparent']) as [string, string, ...string[]]}
                                style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: isHolo ? 'transparent' : colors.surfaceAlt, marginBottom: 8 }}
                              >
                                {ach.iconType === 'lucide' && ach.lucideIcon ? (
                                  // @ts-ignore
                                  React.createElement((LucideIcons as any)[ach.lucideIcon] || LucideIcons.Star, {
                                    size: 24,
                                    color: isHolo ? '#FFF' : tierColor,
                                    strokeWidth: 2.5
                                  })
                                ) : (
                                  <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
                                )}
                              </LinearGradient>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>{ach.title}</Text>
                              <Text style={{ fontSize: 9, color: tierColor, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>
                                {String(t(`achievements.tiers.${ach.tier === 'bronce' ? 'bronze' : ach.tier === 'plata' ? 'silver' : ach.tier === 'oro' ? 'gold' : ach.tier === 'diamante' ? 'diamond' : ach.tier}`, ach.tier))}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => router.push('/modals/achievements' as any)}
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
                  marginBottom: 20,
                  marginTop: 8,
                }}
              >
                <Trophy size={22} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>{t('social.you.achievements')}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{t('social.you.viewAllAchievements')}</Text>
                </View>
                <View style={{ backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    {achievements.filter((a: any) => a.unlocked).length}/{achievements.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          );
        })()}

        <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.you.yourPosts')}</Text>
        {myPosts.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>{t('social.you.noPosts')}</Text>
        ) : (
          myPosts.map(post => (
            <GlassCard key={post.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <View style={{ padding: 16 }}>
                <View style={s.postHeader}>
                  <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser({ ...post.user_profile, id: post.user_id })}>
                    {post.user_profile?.avatar_url ? (
                      <Image source={{ uri: post.user_profile.avatar_url }} style={s.avatarSmall} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                        <Text style={[s.avatarInitials, { fontSize: 14 }]}>{post.user_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={[s.userName, getNameStyle(post.user_profile?.name_color, post.user_id, profile?.id, profile?.nameColor, premiumColor)]}>{post.user_profile?.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => socialStore.deletePost(post.id)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={[s.postContent, { color: colors.textPrimary }]}>{parsePostContent(post.content).cleanContent}</Text>
                {post.image_url && (
                  post.image_url.toLowerCase().includes('.mp4') || post.image_url.toLowerCase().includes('.mov') || post.image_url.includes('posts/17') || post.image_url.includes('video') ? (
                    <VideoPlayerView videoUrl={post.image_url} style={s.postImage} />
                  ) : (
                    <TouchableOpacity onPress={() => setViewingImage(post.image_url!)} activeOpacity={0.8}>
                      <Image source={{ uri: post.image_url }} style={s.postImage} contentFit="cover" />
                    </TouchableOpacity>
                  )
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
  };


  const postHeader = useMemo(() => (
    <GlassCard style={{ marginBottom: 20, padding: 12 }}>
      <View style={s.postInputRow}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={s.avatarSmall} />
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
          onChangeText={setNewPostContent}
        />
      </View>
      
      {selectedImage && (
        <View style={{ position: 'relative', marginBottom: 12 }}>
          <Image source={{ uri: selectedImage }} style={s.imagePreview} />
          <TouchableOpacity 
            style={s.removeImageBtn} 
            onPress={() => setSelectedImage(null)}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {selectedVideo && (
        <View style={{ position: 'relative', marginBottom: 12 }}>
          <VideoPlayerView videoUrl={selectedVideo} style={s.imagePreview} />
          <TouchableOpacity 
            style={s.removeImageBtn} 
            onPress={() => setSelectedVideo(null)}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.postActions}>
        <TouchableOpacity style={s.postTool} onPress={() => setIsImageModalVisible(true)}>
          <Camera size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{t('social.feed.photo', 'Multimedia')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.sendBtn, { backgroundColor: (newPostContent.trim() || selectedImage || selectedVideo) ? colors.primary : colors.surfaceAlt }]}
          onPress={handleCreatePost}
          disabled={(!newPostContent.trim() && !selectedImage && !selectedVideo) || isPosting}
        >

          {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
        </TouchableOpacity>
      </View>
    </GlassCard>
  ), [newPostContent, selectedImage, selectedVideo, isPosting, profile?.avatarUrl, profile?.name, colors.primary, colors.surfaceAlt, colors.textPrimary, colors.textMuted, colors.textSecondary, handleCreatePost, t]);

  const feedHeader = useMemo(() => {
    const isValidHex = !!(premiumColor && premiumColor.startsWith('#'));
    const safePremiumColor = isValidHex ? premiumColor! : '#7C5CFC';
    const isPremiumCustom = (isPro || profile?.isPro) && isValidHex;
    const accentColor = isPremiumCustom ? safePremiumColor : colors.primary;

    // Count active filters (excluding defaults)
    const activeFilterCount = [
      selectedLanguage !== 'all',
      sortBy !== 'recent',
      contentFilter !== 'all'
    ].filter(Boolean).length;

    const LANGUAGES = [
      { key: 'all', flag: '🌐', label: t('common.all', 'Todos') },
      { key: 'es', flag: '🇪🇸', label: 'Español' },
      { key: 'en', flag: '🇺🇸', label: 'English' },
      { key: 'pt', flag: '🇧🇷', label: 'Português' },
      { key: 'fr', flag: '🇫🇷', label: 'Français' },
      { key: 'de', flag: '🇩🇪', label: 'Deutsch' },
      { key: 'it', flag: '🇮🇹', label: 'Italiano' },
      { key: 'ru', flag: '🇷🇺', label: 'Русский' },
    ];

    const SORT_OPTIONS = [
      { key: 'recent', icon: '⏱️', label: t('social.feed.sortRecent', 'Más recientes') },
      { key: 'oldest', icon: '⏳', label: t('social.feed.sortOldest', 'Más antiguos') },
      { key: 'popular', icon: '🔥', label: t('social.feed.sortPopular', 'Más populares') },
      { key: 'commented', icon: '💬', label: t('social.feed.sortCommented', 'Más comentados') },
    ];

    const CONTENT_OPTIONS = [
      { key: 'all', icon: '📱', label: t('common.all', 'Todos') },
      { key: 'images', icon: '🖼️', label: t('social.feed.filterImages', 'Con imágenes') },
      { key: 'text', icon: '📝', label: t('social.feed.filterText', 'Solo texto') },
      { key: 'audio', icon: '🎵', label: t('social.feed.filterAudio', 'Con audio') },
    ];

    const renderChip = (item: { key: string; icon?: string; flag?: string; label: string }, isActive: boolean, onPress: () => void) => (
      <TouchableOpacity
        key={item.key}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: Radius.full,
          backgroundColor: isActive ? accentColor : colors.surfaceAlt,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.border + '25',
          shadowColor: isActive ? accentColor : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isActive ? 0.35 : 0,
          shadowRadius: 6,
          elevation: isActive ? 4 : 0,
        }}
      >
        {(item.flag || item.icon) && (
          <Text style={{ fontSize: 13 }}>{item.flag || item.icon}</Text>
        )}
        <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : colors.textSecondary }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={{ marginBottom: 12 }}>
        {postHeader}

        {/* Search and Filters Toggle Bar */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: showFilters ? 10 : 12, alignItems: 'center' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: colors.border + '20' }}>
            <Search size={17} color={colors.textSecondary} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}
              placeholder={t('social.feed.searchPostsPlaceholder', 'Buscar publicaciones...')}
              placeholderTextColor={colors.textMuted}
              value={feedSearchQuery}
              onChangeText={setFeedSearchQuery}
            />
            {feedSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setFeedSearchQuery('')}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: showFilters ? accentColor : colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: showFilters ? 0 : 1,
              borderColor: colors.border + '25',
              shadowColor: showFilters ? accentColor : 'transparent',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: showFilters ? 0.4 : 0,
              shadowRadius: 8,
              elevation: showFilters ? 6 : 0,
            }}
            onPress={() => {
              Haptics.selectionAsync();
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowFilters(!showFilters);
            }}
          >
            <Filter size={18} color={showFilters ? '#fff' : colors.textSecondary} />
            {activeFilterCount > 0 && !showFilters && (
              <View style={{
                position: 'absolute', top: -3, right: -3,
                backgroundColor: accentColor, borderRadius: 10,
                minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 4, borderWidth: 2, borderColor: colors.background,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isPremiumCustom ? safePremiumColor + '30' : colors.border + '30',
            marginBottom: 12,
            overflow: 'hidden',
          }}>
            {/* Premium accent top border */}
            {isPremiumCustom && (
              <LinearGradient
                colors={[safePremiumColor + 'CC', safePremiumColor + '00'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2, width: '100%' }}
              />
            )}

            <View style={{ padding: 14, gap: 16 }}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Filter size={14} color={accentColor} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 }}>
                    {t('social.feed.filters', 'Filtros')}
                  </Text>
                  {activeFilterCount > 0 && (
                    <View style={{ backgroundColor: accentColor + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: accentColor, fontSize: 11, fontWeight: '800' }}>
                        {activeFilterCount} {t('social.feed.filtersActive', 'activos')}
                      </Text>
                    </View>
                  )}
                </View>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedLanguage('all');
                      setSortBy('recent');
                      setContentFilter('all');
                    }}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.surfaceAlt }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                      {t('social.feed.clearFilters', 'Limpiar')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border + '25' }} />

              {/* Language filter */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: accentColor, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {t('social.feed.filterLanguage', 'Idioma')}
                  </Text>
                  {selectedLanguage !== 'all' && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accentColor }} />
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                  {LANGUAGES.map(item => renderChip(item, selectedLanguage === item.key, () => {
                    Haptics.selectionAsync();
                    setSelectedLanguage(item.key);
                  }))}
                </ScrollView>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border + '25' }} />

              {/* Sort order filter */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: accentColor, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {t('social.feed.sortBy', 'Ordenar por')}
                  </Text>
                  {sortBy !== 'recent' && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accentColor }} />
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                  {SORT_OPTIONS.map(item => renderChip({ ...item, flag: item.icon }, sortBy === item.key, () => {
                    Haptics.selectionAsync();
                    setSortBy(item.key);
                  }))}
                </ScrollView>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border + '25' }} />

              {/* Content Type Filter */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: accentColor, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {t('social.feed.filterContentType', 'Tipo de contenido')}
                  </Text>
                  {contentFilter !== 'all' && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accentColor }} />
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                  {CONTENT_OPTIONS.map(item => renderChip({ ...item, flag: item.icon }, contentFilter === item.key, () => {
                    Haptics.selectionAsync();
                    setContentFilter(item.key);
                  }))}
                </ScrollView>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }, [postHeader, feedSearchQuery, showFilters, selectedLanguage, sortBy, contentFilter, colors, t, premiumColor, isPro, profile?.isPro]);


  const renderFeed = () => (
    <View style={s.tabContent}>
      <FlashList
        data={filteredAndSortedPosts}
        // @ts-ignore
        estimatedItemSize={200}
        keyExtractor={post => post.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={feedHeader}
        ListEmptyComponent={() => (
          socialStore.isPostsLoading && socialStore.posts.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <MessageSquare size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 15 }}>{t('social.feed.noPosts')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('social.feed.firstToShare')}</Text>
            </View>
          )
        )}
        renderItem={({ item: post }) => (
          <GlassCard key={post.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 16 }}>
              <View style={s.postHeader}>
                <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser({ ...post.user_profile, id: post.user_id })}>
                  {post.user_profile?.avatar_url ? (
                    <Image source={{ uri: post.user_profile.avatar_url }} style={s.avatarSmall} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                      <Text style={[s.avatarInitials, { fontSize: 14 }]}>{post.user_profile?.name?.[0]}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={[s.userName, getNameStyle(post.user_profile?.name_color, post.user_id, profile?.id, profile?.nameColor)]}>{post.user_profile?.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
                {post.user_id === profile?.id && (
                  <TouchableOpacity onPress={() => socialStore.deletePost(post.id)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[s.postContent, { color: colors.textPrimary }]}>{parsePostContent(post.content).cleanContent}</Text>
              {post.image_url && (
                post.image_url.toLowerCase().includes('.mp4') || post.image_url.toLowerCase().includes('.mov') || post.image_url.includes('posts/17') || post.image_url.includes('video') ? (
                  <VideoPlayerView videoUrl={post.image_url} style={s.postImage} />
                ) : (
                  <TouchableOpacity onPress={() => setViewingImage(post.image_url!)} activeOpacity={0.8}>
                    <Image source={{ uri: post.image_url }} style={s.postImage} contentFit="cover" />
                  </TouchableOpacity>
                )
              )}

            </View>
            <View style={[s.postFooter, { borderTopColor: colors.border + '33' }]}>
              <TouchableOpacity style={s.postAction} onPress={() => handleLike(post.id, post.is_liked)}>
                <Heart size={18} color={post.is_liked ? colors.error : colors.textSecondary} fill={post.is_liked ? colors.error : 'transparent'} />
                <Text style={{ color: post.is_liked ? colors.error : colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {post.likes_count > 0 ? post.likes_count : ''} {post.is_liked ? t('social.feed.liked') : t('social.feed.like')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.postAction} onPress={() => toggleComments(post.id)}>
                <MessageSquare size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                  {post.comments_count > 0 ? post.comments_count : ''} {t('social.feed.comment')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.postAction} onPress={() => handleShare(post.content)}>
                <Share2 size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{t('social.feed.share')}</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            {expandedComments === post.id && (
              <View style={[s.commentsContainer, { backgroundColor: colors.surfaceAlt + '50' }]}>
                {postComments[post.id]?.map(comment => (
                  <View key={comment.id} style={s.commentRow}>
                    {comment.user_profile?.avatar_url ? (
                      <Image source={{ uri: comment.user_profile.avatar_url }} style={s.commentAvatar} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 24, height: 24 }]}>
                        <Text style={{ fontSize: 10, color: '#fff' }}>{comment.user_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <View style={[s.commentBubble, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={[s.commentUser, getNameStyle(comment.user_profile?.name_color, comment.user_id, profile?.id, profile?.nameColor, premiumColor), { marginBottom: 0 }]}>{comment.user_profile?.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: colors.textMuted, fontSize: 9 }}>
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          {comment.user_id === profile?.id && !editingCommentId && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                              <TouchableOpacity onPress={() => handleStartEditComment(comment.id, comment.content)}>
                                <Pencil size={11} color={colors.textSecondary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteComment(comment.id, post.id)}>
                                <Trash2 size={11} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                      {editingCommentId === comment.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              color: colors.textPrimary,
                              borderBottomColor: colors.primary,
                              borderBottomWidth: 1,
                              fontSize: 14,
                              paddingVertical: 2,
                            }}
                            value={editingCommentText}
                            onChangeText={setEditingCommentText}
                            autoFocus
                          />
                          <TouchableOpacity onPress={() => handleSaveCommentEdit(comment.id, post.id)}>
                            <Check size={16} color={colors.success} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleCancelCommentEdit}>
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
                    onChangeText={setNewComment}
                  />
                  <TouchableOpacity 
                    style={[s.commentSendBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Send size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </GlassCard>
        )}
      />
    </View>
  );

  const renderFriends = () => {
    const receivedRequests = socialStore.friends.filter(f => f.status === 'pending' && f.user_id_2 === profile?.id);
    const sentRequests = socialStore.friends.filter(f => f.status === 'pending' && f.user_id_1 === profile?.id);
    const acceptedFriends = socialStore.friends.filter(f => f.status === 'accepted');

    return (
      <View style={s.tabContent}>
        {/* Sub-tabs for Friends Section */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: friendsTab === 'list' ? colors.primary : 'transparent', borderRadius: 8 }}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFriendsTab('list'); }}
          >
            <Text style={{ color: friendsTab === 'list' ? '#fff' : colors.textSecondary, fontWeight: '600' }}>{t('social.friends.myFriends', 'My Friends')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: friendsTab === 'search' ? colors.primary : 'transparent', borderRadius: 8 }}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFriendsTab('search'); }}
          >
            <Text style={{ color: friendsTab === 'search' ? '#fff' : colors.textSecondary, fontWeight: '600' }}>{t('social.friends.search', 'Search')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: friendsTab === 'requests' ? colors.primary : 'transparent', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFriendsTab('requests'); }}
          >
            <Text style={{ color: friendsTab === 'requests' ? '#fff' : colors.textSecondary, fontWeight: '600' }}>{t('social.friends.requests', 'Requests')}</Text>
            {receivedRequests.length > 0 && (
              <View style={{ backgroundColor: friendsTab === 'requests' ? '#fff' : colors.error, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: friendsTab === 'requests' ? colors.primary : '#fff', fontSize: 10, fontWeight: 'bold' }}>{receivedRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {friendsTab === 'search' && (
          <GlassCard accentColor={colors.primary} style={{ marginBottom: 20 }}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('social.friends.addFriends')}</Text>
            <View style={[s.searchBar, { backgroundColor: colors.surfaceAlt }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[s.searchInput, { color: colors.textPrimary }]}
                placeholder={t('social.friends.searchPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('social.friends.searchBtn')}</Text>
              </TouchableOpacity>
            </View>

            {isSearching && <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />}
            
            {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>{t('social.friends.noResults', 'No results found.')}</Text>
            )}

            {searchResults.map(user => (
              <View key={user.id} style={[s.userRow, { borderBottomColor: colors.border + '33' }]}>
                <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser(user)}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={s.avatarInitials}>{user.name?.[0]}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={[s.userName, getNameStyle(user.name_color, user.id, profile?.id, profile?.nameColor, premiumColor)]} numberOfLines={1}>{user.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{user.email}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAddFriend(user.id)}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={s.actionBtnText}>{t('social.friends.sendRequest')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </GlassCard>
        )}

        {friendsTab === 'requests' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.friends.receivedRequests', 'Received Requests')}</Text>
            {receivedRequests.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>{t('social.friends.noReceived', 'No received requests.')}</Text>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {receivedRequests.map(req => (
                  <GlassCard key={req.id} style={{ marginBottom: 8, padding: 12 }}>
                    <View style={s.userRow}>
                      <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser(req.friend_profile)}>
                        {req.friend_profile?.avatar_url ? (
                          <Image source={{ uri: req.friend_profile.avatar_url }} style={s.avatarSmall} />
                        ) : (
                          <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                            <Text style={[s.avatarInitials, { fontSize: 14 }]}>{req.friend_profile?.name?.[0]}</Text>
                          </View>
                        )}
                        <Text style={[s.userName, getNameStyle(req.friend_profile?.name_color, req.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{req.friend_profile?.name}</Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity 
                          style={[s.iconBtn, { backgroundColor: colors.success }]}
                          onPress={() => socialStore.acceptFriend(req.id)}
                        >
                          <Check size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[s.iconBtn, { backgroundColor: colors.error }]}
                          onPress={() => socialStore.rejectFriend(req.id)}
                        >
                          <X size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12, marginTop: 10 }]}>{t('social.friends.sentRequests', 'Sent Requests')}</Text>
            {sentRequests.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>{t('social.friends.noSent', 'No sent requests.')}</Text>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {sentRequests.map(req => (
                  <GlassCard key={req.id} style={{ marginBottom: 8, padding: 12, opacity: 0.8 }}>
                    <View style={s.userRow}>
                      <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser(req.friend_profile)}>
                        {req.friend_profile?.avatar_url ? (
                          <Image source={{ uri: req.friend_profile.avatar_url }} style={s.avatarSmall} />
                        ) : (
                          <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                            <Text style={[s.avatarInitials, { fontSize: 14 }]}>{req.friend_profile?.name?.[0]}</Text>
                          </View>
                        )}
                        <Text style={[s.userName, getNameStyle(req.friend_profile?.name_color, req.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{req.friend_profile?.name}</Text>
                      </TouchableOpacity>
                      <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full }}>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('social.friends.pending', 'Pending')}</Text>
                      </View>
                      <TouchableOpacity onPress={() => socialStore.rejectFriend(req.id)} style={{ marginLeft: 12 }}>
                        <Trash2 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </View>
        )}

        {friendsTab === 'list' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.friends.myFriends', 'My Friends')}</Text>
            {acceptedFriends.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>{t('social.friends.noFriends', 'You have no friends yet.')}</Text>
            ) : (
              acceptedFriends.map(friend => (
                <GlassCard key={friend.id} style={{ marginBottom: 8, padding: 12 }}>
                  <View style={s.userRow}>
                    <TouchableOpacity style={s.userInfo} onPress={() => setInspectingUser(friend.friend_profile)}>
                      {friend.friend_profile?.avatar_url ? (
                        <Image source={{ uri: friend.friend_profile.avatar_url }} style={s.avatarSmall} />
                      ) : (
                        <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 32, height: 32 }]}>
                          <Text style={[s.avatarInitials, { fontSize: 14 }]}>{friend.friend_profile?.name?.[0]}</Text>
                        </View>
                      )}
                      <Text style={[s.userName, getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{friend.friend_profile?.name}</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity 
                        style={s.iconBtn}
                        onPress={() => router.push({
                          pathname: '/modals/chat',
                          params: { 
                            friendId: friend.friend_profile?.id, 
                            friendName: friend.friend_profile?.name, 
                            friendAvatar: friend.friend_profile?.avatar_url || ''
                          }
                        } as any)}
                      >
                        {socialStore.unreadCounts[friend.friend_profile?.id || ''] > 0 ? (
                          <LinearGradient
                            colors={[colors.primary, colors.secondary || '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={s.gradientIconBtn}
                          >
                            <MessageSquare size={18} color="#fff" />
                            <View style={s.badge}>
                              <Text style={s.badgeText}>{socialStore.unreadCounts[friend.friend_profile?.id || '']}</Text>
                            </View>
                          </LinearGradient>
                        ) : (
                          <MessageSquare size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.iconBtn, { backgroundColor: colors.error + '20' }]}
                        onPress={() => setDeleteFriendAlert({ friendId: friend.id, friendName: friend.friend_profile?.name || 'este usuario' })}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
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
    <View style={[s.container, { backgroundColor: 'transparent' }]}>

      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {(['you', 'feed', 'friends'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            let badgeCount = 0;
            if (tab === 'friends') {
              const totalUnreadMessages = Object.values(socialStore.unreadCounts || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);
              const pendingRequests = socialStore.friends.filter(f => f.status === 'pending' && f.user_id_2 === profile?.id).length;
              badgeCount = totalUnreadMessages + pendingRequests;
            }
            return (
              <TouchableOpacity 
                key={tab} 
                style={{ borderRadius: 100, overflow: 'hidden', marginRight: 10 }}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveTab(tab);
                }}
              >
                <LinearGradient
                  colors={isActive ? [colors.primary, colors.secondary || '#A855F7'] : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    s.tab, 
                    { backgroundColor: isActive ? 'transparent' : colors.surfaceAlt }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[
                      s.tabText, 
                      { color: isActive ? '#fff' : colors.textSecondary },
                    ]}>
                      {t('social.tabs.' + tab)}
                    </Text>
                    {badgeCount > 0 && (
                      <View style={{ backgroundColor: isActive ? '#fff' : colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: isActive ? colors.primary : '#fff', fontSize: 10, fontWeight: 'bold' }}>
                          {badgeCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          {activeTab === 'you' && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
              {renderYou()}
            </ScrollView>
          )}
          {activeTab === 'feed' && renderFeed()}
          {activeTab === 'friends' && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
              {renderFriends()}
            </ScrollView>
          )}
        </View>
      </GestureDetector>

      
      <Modal
        visible={!!inspectingUser}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectingUser(null)}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24, zIndex: 1000 }]}>
          <GlassCard style={{ padding: 0, overflow: 'hidden', borderRadius: 24 }}>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 20 }} onPress={() => setInspectingUser(null)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Avatar */}
              <TouchableOpacity
                onPress={() => inspectingUser?.avatar_url ? setAvatarViewerData({ url: inspectingUser.avatar_url, name: inspectingUser.name }) : null}
                activeOpacity={0.85}
                style={{
                  width: 90, height: 90, borderRadius: 45, marginBottom: 14, marginTop: 8,
                  shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  borderWidth: 3, borderColor: colors.primary + '60',
                }}
              >
                {inspectingUser?.avatar_url ? (
                  <Image source={{ uri: inspectingUser.avatar_url }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary, width: 84, height: 84, borderRadius: 42 }]}>
                    <Text style={[s.avatarInitials, { fontSize: 32 }]}>{inspectingUser?.name?.[0]}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[{ fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginBottom: 4, textAlign: 'center' }, getNameStyle(inspectingUser?.name_color, inspectingUser?.id, profile?.id, profile?.nameColor, premiumColor)]}>{inspectingUser?.name}</Text>

              {/* Points row */}
              {(() => {
                const rankInfo = socialStore.globalRanking.find(u => u.id === inspectingUser?.id);
                const rankIndex = socialStore.globalRanking.findIndex(u => u.id === inspectingUser?.id);
                if (!rankInfo) return null;
                const grade = getRank(rankInfo.points);
                return (
                  <View style={{ flexDirection: 'row', gap: 20, marginTop: 10, marginBottom: 4 }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 16 }}>#{rankIndex + 1}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>Ranking</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.border + '40' }} />
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>{Math.round(rankInfo.points)}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>Puntos</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.border + '40' }} />
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ backgroundColor: grade.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: grade.color, fontWeight: '900', fontSize: 14 }}>{grade.label}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>Clase</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Action buttons */}
              {(() => {
                const friendStatus = socialStore.friends.find(f =>
                  (f.user_id_1 === profile?.id && f.user_id_2 === inspectingUser?.id) ||
                  (f.user_id_2 === profile?.id && f.user_id_1 === inspectingUser?.id)
                );

                if (inspectingUser?.id === profile?.id) return null;

                return (
                  <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                    {/* Ver Perfil */}
                    <TouchableOpacity
                      style={{
                        height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: colors.surfaceAlt,
                        borderWidth: 1, borderColor: colors.border + '40',
                        flexDirection: 'row', gap: 8,
                      }}
                      onPress={() => {
                        router.push({ pathname: '/modals/user-profile', params: { userId: inspectingUser.id, name: inspectingUser.name, avatarUrl: inspectingUser.avatar_url } });
                        setInspectingUser(null);
                      }}
                    >
                      <Users size={16} color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>Ver Perfil Completo</Text>
                    </TouchableOpacity>

                    {/* Friend action */}
                    {friendStatus?.status === 'accepted' ? (
                      <View style={{ gap: 8 }}>
                        <View style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success + '20', flexDirection: 'row', gap: 8 }}>
                          <Check size={16} color={colors.success} />
                          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 14 }}>Son Amigos</Text>
                        </View>
                        <TouchableOpacity
                          style={{ height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40', flexDirection: 'row', gap: 8 }}
                          onPress={() => setDeleteFriendAlert({ friendId: friendStatus.id, friendName: inspectingUser?.name || 'este usuario' })}
                        >
                          <Trash2 size={16} color={colors.error} />
                          <Text style={{ color: colors.error, fontWeight: '700', fontSize: 14 }}>Eliminar Amigo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : friendStatus?.status === 'pending' ? (
                      <View style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, flexDirection: 'row', gap: 8 }}>
                        <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 14 }}>Solicitud Pendiente</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{
                          height: 48, borderRadius: 14, overflow: 'hidden',
                          shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
                        }}
                        onPress={async () => {
                          await handleAddFriend(inspectingUser.id);
                          setInspectingUser(null);
                        }}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.secondary || '#A855F7']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <Plus size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Añadir Amigo</Text>
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



      <MediaPickerModal
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onTakePhoto={handleCamera}
        onRecordVideo={handleRecordVideo}
        onSelectLibrary={handleGallery}
      />

      
      <ImageViewerModal
        visible={!!viewingImage}
        imageUri={viewingImage}
        onClose={() => setViewingImage(null)}
      />

      <CustomAlert
        visible={!!deleteFriendAlert}
        type="confirm"
        title="Eliminar amigo"
        message={`¿Seguro que quieres eliminar a ${deleteFriendAlert?.friendName} de tus amigos?`}
        onConfirm={() => {}} // Not used because we use actions
        actions={[
          { text: 'Cancelar', onPress: () => setDeleteFriendAlert(null), type: 'secondary' },
          { text: 'Eliminar', onPress: async () => {
            if (deleteFriendAlert) {
              await socialStore.rejectFriend(deleteFriendAlert.friendId);
              setDeleteFriendAlert(null);
              setInspectingUser(null);
            }
          }, type: 'destructive' }
        ]}
      />
      <AvatarViewerModal
        visible={!!avatarViewerData}
        avatarUrl={avatarViewerData?.url || null}
        name={avatarViewerData?.name}
        onClose={() => setAvatarViewerData(null)}
      />
    </View>
  );
}
