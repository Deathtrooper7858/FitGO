import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert,
  Pressable, Animated
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Send, Mic, Play, Pause, X,
  Check, CheckCheck, Plus
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder, useAudioPlayer, useAudioPlayerStatus,
  requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets
} from 'expo-audio';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardNavBar } from '../../hooks/useKeyboardNavBar';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useAuthStore, useSocialStore, useSettingsStore } from '../../store';
import { DirectMessage } from '../../store/socialStore';
import { getNameStyle } from '../../utils/styles';
import { supabase } from '../../services/supabase';
import { AvatarViewerModal } from '../../components/AvatarViewerModal';
import { MediaPickerModal } from '../../components/MediaPickerModal';
import { VideoPlayerView } from '../../components/social/VideoPlayerView';

// Darkens a hex color by a given ratio (0–1)
const darkenHex = (hex?: string | null, amount = 0.22): string => {
  if (!hex || typeof hex !== 'string') return '#6D28D9';
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Formats message grouping date header
function formatMessageDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return '';
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return 'Hoy';
    if (isYesterday) return 'Ayer';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ── Audio Player Component ──────────────────────────────────────────────────
function VoiceNotePlayer({ audioUrl, isMine, colors }: { audioUrl?: string | null; isMine: boolean; colors: any }) {
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.trim()) {
    return null;
  }
  return <VoiceNotePlayerInner audioUrl={audioUrl} isMine={isMine} colors={colors} />;
}

function VoiceNotePlayerInner({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = status?.duration && status.duration > 0 ? (status.currentTime || 0) / status.duration : 0;

  const handleToggle = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setAudioModeAsync({ 
        playsInSilentMode: true, 
        allowsRecording: false, 
        interruptionMode: 'mixWithOthers', 
        shouldPlayInBackground: false, 
        shouldRouteThroughEarpiece: false 
      });
    } catch (e) {
      console.warn('[Chat] Audio mode error:', e);
    }

    try {
      if (status.playing) {
        player.pause();
      } else {
        if (status.didJustFinish) player.seekTo(0);
        player.play();
      }
    } catch (e) {
      console.warn('[Chat] Play error:', e);
    }
  };

  const handleSeek = (e: any) => {
    if (trackWidth > 0 && status?.duration && status.duration > 0) {
      const x = e.nativeEvent.locationX;
      const percent = Math.max(0, Math.min(1, x / trackWidth));
      try {
        player.seekTo(percent * status.duration);
      } catch (err) {
        console.warn('[Chat] Seek error:', err);
      }
    }
  };

  const primaryColor = colors.primary || '#8B5CF6';

  return (
    <View style={[vStyles.container, { minWidth: 190 }]}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={[
          vStyles.playBtn,
          { backgroundColor: isMine ? 'rgba(255,255,255,0.28)' : primaryColor + '25' }
        ]}
      >
        {status.playing ? (
          <Pause size={15} color={isMine ? '#fff' : primaryColor} fill={isMine ? '#fff' : primaryColor} />
        ) : (
          <Play size={15} color={isMine ? '#fff' : primaryColor} fill={isMine ? '#fff' : primaryColor} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      <View style={vStyles.progressWrapper}>
        <View 
          style={vStyles.touchTrack}
          onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleSeek}
          onResponderMove={handleSeek}
        >
          <View style={[vStyles.progressTrack, { backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : (colors.border ? colors.border + '50' : 'rgba(255,255,255,0.15)') }]}>
            <View
              style={[
                vStyles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  backgroundColor: isMine ? '#fff' : primaryColor
                }
              ]}
            />
          </View>
        </View>

        <View style={vStyles.timeRow}>
          <Text style={[vStyles.timeText, { color: isMine ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
            {status.playing
              ? formatTime(status.currentTime)
              : status.duration > 0 ? formatTime(status.duration) : '0:00'}
          </Text>
          <Text style={[vStyles.timeText, { color: isMine ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            Nota de voz
          </Text>
        </View>
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    flex: 1,
    gap: 3,
  },
  touchTrack: {
    height: 22,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

// ── Main Chat Modal ─────────────────────────────────────────────────────────
export default function ChatModal() {
  const { friendId, friendName, friendAvatar } = useLocalSearchParams<{ friendId: string; friendName: string; friendAvatar: string }>();
  const colors = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { premiumColor } = useSettingsStore();
  const insets = useSafeAreaInsets();
  useKeyboardNavBar();
  const keyboardHeight = useKeyboardHeight();

  // Zustand Store Selectors (Stable references - prevents re-render loop!)
  const fetchDirectMessages = useSocialStore(s => s.fetchDirectMessages);
  const sendDirectMessage = useSocialStore(s => s.sendDirectMessage);
  const markAsRead = useSocialStore(s => s.markAsRead);
  const uploadChatAudio = useSocialStore(s => s.uploadChatAudio);
  const uploadChatImage = useSocialStore(s => s.uploadChatImage);
  const uploadChatVideo = useSocialStore(s => s.uploadChatVideo);
  const friends = useSocialStore(s => s.friends);

  const friendProfile = useMemo(() => {
    return friends.find(f => f.friend_profile?.id === friendId)?.friend_profile;
  }, [friends, friendId]);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  // Modals
  const [avatarVisible, setAvatarVisible] = useState(false);
  const [photoSourceVisible, setPhotoSourceVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIsSending, setPreviewIsSending] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationTimerRef = useRef<any>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const roomName = useMemo(() => {
    if (!profile?.id || !friendId) return 'general';
    return [profile.id, friendId].sort().join('_');
  }, [profile?.id, friendId]);

  // Pulse animation for recording badge
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current); };
  }, [isRecording, pulseAnim]);

  // Load messages and subscribe to Realtime updates (STABLE - no infinite loop!)
  useEffect(() => {
    if (!profile?.id || !friendId) return;

    let isMounted = true;

    // Fetch message history once
    const initChat = async () => {
      try {
        setIsLoading(true);
        const msgs = await fetchDirectMessages(profile.id, friendId);
        if (isMounted) {
          setMessages(msgs || []);
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        }
      } catch (err) {
        console.warn('[Chat] Error loading messages:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    initChat();

    // Mark as read once on screen focus
    markAsRead(profile.id, friendId).catch(() => {});

    // Supabase Realtime channel
    const channel = supabase.channel(`room_${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${profile.id}`
        },
        (payload) => {
          if (!isMounted) return;
          const newMsg = payload.new as DirectMessage;
          if (newMsg.sender_id === friendId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            markAsRead(profile.id, friendId).catch(() => {});
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!isMounted) return;
        if (payload.userId === friendId) {
          setIsFriendTyping(payload.isTyping);
          if (payload.isTyping) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, friendId, roomName, fetchDirectMessages, markAsRead]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (channelRef.current && profile?.id) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: profile.id, isTyping: text.length > 0 }
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: profile.id, isTyping: false }
        });
      }, 3000);
    }
  };

  const optimisticSend = (content: string, image_url?: string, audio_url?: string) => {
    if (!profile?.id || !friendId) return;
    const tempMsg: DirectMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender_id: profile.id,
      receiver_id: friendId,
      content,
      image_url,
      audio_url,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile?.id || !friendId) return;
    const content = newMessage.trim();
    setNewMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    optimisticSend(content);
    await sendDirectMessage(profile.id, friendId, content);
  };

  // ── Media Picker ──────────────────────────────────────────────────────────
  const handlePickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.cameraPermissionTitle', 'Permiso de Cámara'), t('chat.cameraPermissionMsg', 'Se necesita acceso a la cámara para tomar fotos.'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setPreviewImage(result.assets[0].uri);
  };

  const handleRecordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.cameraPermissionTitle', 'Permiso de Cámara'), t('chat.cameraPermissionMsg', 'Se necesita acceso a la cámara para grabar videos.'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setPreviewImage(result.assets[0].uri);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.galleryPermissionTitle', 'Permiso de Galería'), t('chat.galleryPermissionMsg', 'Se necesita acceso a la galería para enviar fotos.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setPreviewImage(result.assets[0].uri);
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        if (!profile?.id || !friendId) return;
        optimisticSend('', undefined, uri);
        const uploadedUrl = await uploadChatAudio(uri);
        if (uploadedUrl) {
          await sendDirectMessage(profile.id, friendId, '', undefined, uploadedUrl);
        }
      }
    } catch (e) {
      console.warn('[Chat] Error picking audio:', e);
    }
  };

  const handleSendPreviewImage = async () => {
    if (!previewImage || !profile?.id || !friendId) return;
    const uri = previewImage;
    setPreviewImage(null);
    setPreviewIsSending(true);
    optimisticSend('', uri);
    const isVideo = uri.toLowerCase().includes('.mp4') || uri.toLowerCase().includes('.mov') || uri.includes('video');
    const url = isVideo 
      ? await uploadChatVideo(uri)
      : await uploadChatImage(uri);
    if (url) {
      await sendDirectMessage(profile.id, friendId, '', url, undefined);
    } else {
      Alert.alert(t('common.error', 'Error'), t('chat.uploadFailed', 'No se pudo subir el archivo. Intenta de nuevo.'));
    }
    setPreviewIsSending(false);
  };

  // ── Voice Recording ───────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(t('chat.micPermissionTitle', 'Permiso de Micrófono'), t('chat.micPermissionMsg', 'Activa el micrófono para enviar notas de voz.'));
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      console.warn('[Chat] Start record error:', e);
    }
  };

  const handleStopAndSendRecording = async () => {
    if (!profile?.id || !friendId) return;
    setIsRecording(false);
    setIsSendingAudio(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        optimisticSend('', undefined, uri);
        const url = await uploadChatAudio(uri);
        if (url) {
          await sendDirectMessage(profile.id, friendId, '', undefined, url);
        } else {
          Alert.alert(t('common.error', 'Error'), t('chat.audioSendFailed', 'Error al enviar audio.'));
        }
      }
    } catch (e) {
      console.warn('[Chat] Stop record error:', e);
    } finally {
      setIsSendingAudio(false);
    }
  };

  const handleCancelRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRecording(false);
    try { await recorder.stop(); } catch {}
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const hasText = newMessage.trim().length > 0;
  const primaryColor = colors.primary || '#8B5CF6';

  // Fallback if friendId is missing
  if (!friendId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
          {t('chat.userNotFound', 'Chat no disponible')}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
          {t('chat.userNotFoundDesc', 'No se pudo identificar al usuario de la conversación.')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: primaryColor }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{t('common.back', 'Volver')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[primaryColor + '15', colors.background, colors.background] as const}
      locations={[0, 0.25, 1]}
      style={styles.safe}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={[styles.keyboardView, { paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* ── Top Header Bar ── */}
          <View style={[styles.header, { backgroundColor: colors.surface ? colors.surface + 'B0' : 'rgba(15,23,42,0.7)', borderBottomColor: colors.border ? colors.border + '35' : 'rgba(255,255,255,0.08)' }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '60' : 'rgba(255,255,255,0.06)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerProfileTouch}
              onPress={() => friendAvatar ? setAvatarVisible(true) : null}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrapper}>
                {friendAvatar ? (
                  <Image cachePolicy="memory-disk" source={{ uri: friendAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: primaryColor }]}>
                    <Text style={styles.avatarInitials}>{friendName?.charAt(0) || '?'}</Text>
                  </View>
                )}
                <View style={styles.onlineBadge} />
              </View>

              <View style={styles.headerInfo}>
                <Text
                  style={[
                    styles.headerName,
                    { color: colors.textPrimary },
                    getNameStyle(friendProfile?.name_color, friendId, profile?.id, profile?.nameColor, premiumColor)
                  ]}
                  numberOfLines={1}
                >
                  {friendName || t('chat.friend', 'Amigo')}
                </Text>
                <Text style={[styles.headerStatus, { color: isFriendTyping ? primaryColor : colors.textMuted }]}>
                  {isFriendTyping ? t('chat.typing', 'Escribiendo...') : t('chat.online', 'En línea')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Messages List ── */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={primaryColor} size="large" />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  {t('chat.loadingMessages', 'Cargando conversación...')}
                </Text>
              </View>
            ) : messages.length === 0 ? (
              /* Empty Conversation State */
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyAvatarWrap, { borderColor: primaryColor + '40', backgroundColor: primaryColor + '15' }]}>
                  {friendAvatar ? (
                    <Image cachePolicy="memory-disk" source={{ uri: friendAvatar }} style={styles.emptyAvatar} />
                  ) : (
                    <View style={[styles.emptyAvatar, { backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{friendName?.charAt(0) || '?'}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {friendName}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {t('chat.emptyGreeting', '¡Inicia la conversación! Comparte tus avances y logros.')}
                </Text>

                <View style={styles.icebreakersWrap}>
                  {['¡Hola! 👋', '¿Qué tal el entreno de hoy? 💪', '¿Entrenamos juntos? 🔥'].map((prompt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.icebreakerChip,
                        {
                          backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '60' : 'rgba(255,255,255,0.06)',
                          borderColor: colors.border ? colors.border + '35' : 'rgba(255,255,255,0.1)'
                        }
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewMessage(prompt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.icebreakerText, { color: colors.textPrimary }]}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.sender_id === profile?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isSameSender = prevMsg?.sender_id === msg.sender_id;

                const currDate = formatMessageDate(msg.created_at);
                const prevDate = prevMsg ? formatMessageDate(prevMsg.created_at) : '';
                const showDateHeader = !prevMsg || (currDate !== '' && currDate !== prevDate);

                const bubbleBg = isMine ? primaryColor : (colors.surfaceAlt || '#1E293B');

                return (
                  <React.Fragment key={`${msg.id}-${index}`}>
                    {showDateHeader && currDate ? (
                      <View style={styles.dateSeparator}>
                        <View style={[styles.dateBadge, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '90' : 'rgba(30,41,59,0.8)', borderColor: colors.border ? colors.border + '30' : 'rgba(255,255,255,0.08)' }]}>
                          <Text style={[styles.dateText, { color: colors.textMuted }]}>{currDate}</Text>
                        </View>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.messageWrapper,
                        isMine ? styles.myMessageWrapper : styles.theirMessageWrapper,
                        isSameSender ? { marginTop: 3 } : { marginTop: 10 }
                      ]}
                    >
                      {msg.image_url ? (
                        msg.image_url.toLowerCase().includes('.mp4') || msg.image_url.toLowerCase().includes('.mov') || msg.image_url.includes('chat_media/17') || msg.image_url.includes('video') ? (
                          <View style={[styles.imageWrapper, isMine ? styles.myBubble : styles.theirBubble]}>
                            <VideoPlayerView videoUrl={msg.image_url} style={{ width: 230, height: 190 }} />
                            <View style={styles.mediaFooter}>
                              <Text style={styles.mediaTimeText}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                              {isMine && (
                                <CheckCheck size={13} color="rgba(255,255,255,0.85)" />
                              )}
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.imageWrapper, isMine ? styles.myBubble : styles.theirBubble]}
                            onPress={() => setPreviewImage(msg.image_url!)}
                            activeOpacity={0.9}
                          >
                            <Image cachePolicy="memory-disk" source={{ uri: msg.image_url }} style={styles.chatImage} contentFit="cover" />
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.6)']}
                              style={styles.mediaOverlay}
                            >
                              <View style={styles.mediaFooter}>
                                <Text style={styles.mediaTimeText}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {isMine && (
                                  <CheckCheck size={13} color="rgba(255,255,255,0.85)" />
                                )}
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        )
                      ) : msg.audio_url ? (
                        <LinearGradient
                          colors={isMine ? [primaryColor, darkenHex(primaryColor, 0.2)] : [bubbleBg, bubbleBg]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.messageBubble,
                            isMine ? styles.myBubble : styles.theirBubble,
                            !isMine && { borderWidth: 1, borderColor: colors.border ? colors.border + '25' : 'rgba(255,255,255,0.06)' }
                          ]}
                        >
                          <VoiceNotePlayer audioUrl={msg.audio_url} isMine={isMine} colors={colors} />
                          <View style={styles.metaRow}>
                            <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isMine && (
                              <CheckCheck size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 3 }} />
                            )}
                          </View>
                        </LinearGradient>
                      ) : (
                        <LinearGradient
                          colors={isMine ? [primaryColor, darkenHex(primaryColor, 0.18)] : [bubbleBg, bubbleBg]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.messageBubble,
                            isMine ? styles.myBubble : styles.theirBubble,
                            !isMine && { borderWidth: 1, borderColor: colors.border ? colors.border + '25' : 'rgba(255,255,255,0.06)' }
                          ]}
                        >
                          <Text style={[styles.messageText, { color: isMine ? '#FFFFFF' : colors.textPrimary }]}>
                            {msg.content}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isMine && (
                              msg.is_read ? (
                                <CheckCheck size={13} color="rgba(255,255,255,0.95)" style={{ marginLeft: 3 }} />
                              ) : (
                                <Check size={13} color="rgba(255,255,255,0.7)" style={{ marginLeft: 3 }} />
                              )
                            )}
                          </View>
                        </LinearGradient>
                      )}
                    </View>
                  </React.Fragment>
                );
              })
            )}

            {isFriendTyping && (
              <View style={styles.typingContainer}>
                <View style={[styles.messageBubble, styles.theirBubble, { backgroundColor: colors.surfaceAlt || '#1E293B', flexDirection: 'row', gap: 5, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' }]}>
                  <View style={[styles.typingDot, { backgroundColor: primaryColor }]} />
                  <View style={[styles.typingDot, { backgroundColor: primaryColor, opacity: 0.65 }]} />
                  <View style={[styles.typingDot, { backgroundColor: primaryColor, opacity: 0.35 }]} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Input Bar ── */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface ? colors.surface + 'FA' : 'rgba(15,23,42,0.95)',
                borderTopColor: colors.border ? colors.border + '35' : 'rgba(255,255,255,0.08)',
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12)
              }
            ]}
          >
            {isRecording ? (
              <View style={styles.recordingBar}>
                <TouchableOpacity
                  onPress={handleCancelRecording}
                  style={[styles.cancelRecordBtn, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '90' : 'rgba(255,255,255,0.1)' }]}
                  activeOpacity={0.8}
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.recordingInfo}>
                  <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={[styles.recordingLabel, { color: colors.textPrimary }]}>
                    {t('chat.recording', 'Grabando...')} {formatDuration(recordingDuration)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleStopAndSendRecording}
                  style={[styles.sendBtn, { backgroundColor: primaryColor }]}
                  activeOpacity={0.85}
                >
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                {/* Media Attachment Button */}
                <TouchableOpacity
                  style={[styles.attachBtn, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '80' : 'rgba(255,255,255,0.08)' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPhotoSourceVisible(true);
                  }}
                  disabled={previewIsSending || isSendingAudio}
                  activeOpacity={0.8}
                >
                  {previewIsSending ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <Plus size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity>

                {/* Text Input Box */}
                <View style={[styles.textInputWrap, { backgroundColor: colors.background ? colors.background + 'B0' : 'rgba(0,0,0,0.3)', borderColor: colors.border ? colors.border + '30' : 'rgba(255,255,255,0.08)' }]}>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder={t('chat.messagePlaceholder', 'Escribe un mensaje...')}
                    placeholderTextColor={colors.textMuted || '#64748B'}
                    value={newMessage}
                    onChangeText={handleTyping}
                    multiline
                    maxLength={1000}
                  />
                </View>

                {/* Send / Mic Button */}
                {hasText ? (
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: primaryColor }]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                  >
                    <Send size={18} color="#fff" />
                  </TouchableOpacity>
                ) : isSendingAudio ? (
                  <View style={[styles.sendBtn, { backgroundColor: colors.surfaceAlt || '#1E293B' }]}>
                    <ActivityIndicator size="small" color={primaryColor} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '80' : 'rgba(255,255,255,0.08)' }]}
                    onPress={handleStartRecording}
                    activeOpacity={0.8}
                  >
                    <Mic size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* ── Modals ── */}
        <AvatarViewerModal
          visible={avatarVisible}
          avatarUrl={friendAvatar || null}
          name={friendName}
          onClose={() => setAvatarVisible(false)}
        />

        <MediaPickerModal
          visible={photoSourceVisible}
          onClose={() => setPhotoSourceVisible(false)}
          onTakePhoto={handlePickFromCamera}
          onRecordVideo={handleRecordVideo}
          onSelectLibrary={handlePickFromGallery}
          onSelectAudio={handlePickAudio}
          title={t('chat.sendMediaTitle', 'Enviar Multimedia')}
          subtitle={t('chat.sendMediaSub', 'Elige una foto, graba un video o selecciona desde la galería')}
        />

        {/* Full Image/Video Preview Modal */}
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPreviewImage(null)}
        >
          <Pressable style={styles.previewBackdrop} onPress={() => setPreviewImage(null)}>
            <View style={styles.previewContent}>
              <TouchableOpacity
                style={styles.previewClose}
                onPress={() => setPreviewImage(null)}
                activeOpacity={0.8}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>

              {previewImage && (
                previewImage.toLowerCase().includes('.mp4') || previewImage.toLowerCase().includes('.mov') || previewImage.includes('video') ? (
                  <VideoPlayerView videoUrl={previewImage} style={{ width: 320, height: 380, borderRadius: 16 }} />
                ) : (
                  <Image cachePolicy="memory-disk" source={{ uri: previewImage }} style={styles.previewImage} contentFit="contain" />
                )
              )}

              {previewImage && !messages.some(m => m.image_url === previewImage) && (
                <TouchableOpacity
                  style={[styles.previewSendBtn, { backgroundColor: primaryColor }]}
                  onPress={handleSendPreviewImage}
                  activeOpacity={0.85}
                >
                  <Send size={18} color="#fff" />
                  <Text style={styles.previewSendText}>{t('common.send', 'Enviar')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardView: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },

  // Messages list
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  emptyAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 3,
    marginBottom: 16,
  },
  emptyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 260,
  },
  icebreakersWrap: {
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  icebreakerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  icebreakerText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Date Separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Message Bubbles
  messageWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Media Messages
  imageWrapper: {
    maxWidth: '75%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  chatImage: {
    width: 230,
    height: 190,
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  mediaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  mediaTimeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // Input Bar
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 42,
    maxHeight: 110,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recording Bar
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
  },
  cancelRecordBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Image Preview
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  previewClose: {
    position: 'absolute',
    top: -50,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 320,
    height: 380,
    borderRadius: 16,
  },
  previewSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  previewSendText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
