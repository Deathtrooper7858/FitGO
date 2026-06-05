import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert,
  Pressable, Animated
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Image as ImageIcon, Mic, Play, Pause, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardNavBar } from '../../hooks/useKeyboardNavBar';
import { Radius } from '../../constants';
import { useAuthStore, useSocialStore } from '../../store';
import { DirectMessage } from '../../store/socialStore';
import { supabase } from '../../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder, useAudioPlayer, useAudioPlayerStatus,
  requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets
} from 'expo-audio';
import { AvatarViewerModal } from '../../components/AvatarViewerModal';
import { PhotoSourceModal } from '../../components/PhotoSourceModal';

// ── Voice Note Player ─────────────────────────────────────────────────────────
function VoiceNotePlayer({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  const handleToggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={[vStyles.container, { minWidth: 180 }]}>
      <TouchableOpacity
        onPress={handleToggle}
        style={[vStyles.playBtn, { backgroundColor: isMine ? 'rgba(255,255,255,0.25)' : colors.primary + '30' }]}
      >
        {status.playing
          ? <Pause size={16} color={isMine ? '#fff' : colors.primary} />
          : <Play size={16} color={isMine ? '#fff' : colors.primary} />}
      </TouchableOpacity>
      <View style={vStyles.progressWrapper}>
        <View style={[vStyles.progressTrack, { backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border }]}>
          <View style={[vStyles.progressFill, { width: `${progress * 100}%`, backgroundColor: isMine ? '#fff' : colors.primary }]} />
        </View>
        <Text style={[vStyles.timeText, { color: isMine ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
          {status.playing
            ? formatTime(status.currentTime)
            : status.duration > 0 ? formatTime(status.duration) : '0:00'}
        </Text>
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressWrapper: { flex: 1, gap: 3 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  timeText: { fontSize: 10 },
});

// ── Main Chat ─────────────────────────────────────────────────────────────────
export default function ChatModal() {
  const { friendId, friendName, friendAvatar } = useLocalSearchParams<{ friendId: string; friendName: string; friendAvatar: string }>();
  const colors = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const socialStore = useSocialStore();
  const insets = useSafeAreaInsets();
  useKeyboardNavBar();

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
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const roomName = [profile?.id, friendId].sort().join('_');

  // Pulse animation for recording dot
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
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
  }, [isRecording]);

  // Real-time subscription
  useEffect(() => {
    if (profile?.id && friendId) {
      loadMessages();
      socialStore.markAsRead(profile.id, friendId);

      const channel = supabase.channel(`room_${roomName}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `receiver_id=eq.${profile.id}` },
          (payload) => {
            if (payload.new.sender_id === friendId) {
              setMessages(prev => [...prev, payload.new as DirectMessage]);
              socialStore.markAsRead(profile.id, friendId);
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
          }
        )
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId === friendId) {
            setIsFriendTyping(payload.isTyping);
            if (payload.isTyping) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }
        })
        .subscribe();

      channelRef.current = channel;
      return () => { supabase.removeChannel(channel); channelRef.current = null; };
    }
  }, [profile?.id, friendId]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (channelRef.current && profile?.id) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: profile.id, isTyping: text.length > 0 } });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: profile.id, isTyping: false } });
      }, 3000);
    }
  };

  const loadMessages = async () => {
    if (!profile?.id || !friendId) return;
    setIsLoading(true);
    const msgs = await socialStore.fetchDirectMessages(profile.id, friendId);
    setMessages(msgs);
    setIsLoading(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const optimisticSend = (content: string, image_url?: string, audio_url?: string) => {
    if (!profile?.id) return;
    const tempMsg: DirectMessage = {
      id: Math.random().toString(),
      sender_id: profile.id,
      receiver_id: friendId,
      content, image_url, audio_url,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile?.id) return;
    const content = newMessage.trim();
    setNewMessage('');
    optimisticSend(content);
    await socialStore.sendDirectMessage(profile.id, friendId, content);
  };

  // ── Image Picker ─────────────────────────────────────────────────────────────
  const handlePickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPreviewImage(result.assets[0].uri);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPreviewImage(result.assets[0].uri);
  };

  const handleSendPreviewImage = async () => {
    if (!previewImage || !profile?.id) return;
    const uri = previewImage;
    setPreviewImage(null);
    setPreviewIsSending(true);
    optimisticSend('', uri); // show local preview immediately
    const url = await socialStore.uploadChatImage(uri);
    if (url) {
      await socialStore.sendDirectMessage(profile.id, friendId, '', url, undefined);
    } else {
      Alert.alert('Error', 'No se pudo subir la imagen.');
    }
    setPreviewIsSending(false);
  };

  // ── Voice Recording ──────────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) { Alert.alert('Permiso requerido', 'Se necesita acceso al micrófono.'); return; }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, interruptionMode: 'doNotMix', shouldPlayInBackground: false, shouldRouteThroughEarpiece: false });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      console.warn('[Chat] Start record error:', e);
    }
  };

  const handleStopAndSendRecording = async () => {
    if (!profile?.id) return;
    setIsRecording(false);
    setIsSendingAudio(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        optimisticSend('', undefined, uri);
        const url = await socialStore.uploadChatAudio(uri);
        if (url) {
          await socialStore.sendDirectMessage(profile.id, friendId, '', undefined, url);
        } else {
          Alert.alert('Error', 'No se pudo enviar el audio.');
        }
      }
    } catch (e) {
      console.warn('[Chat] Stop record error:', e);
    } finally {
      setIsSendingAudio(false);
    }
  };

  const handleCancelRecording = async () => {
    setIsRecording(false);
    try { await recorder.stop(); } catch (_) {}
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const hasText = newMessage.trim().length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border + '50' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <TouchableOpacity onPress={() => friendAvatar ? setAvatarVisible(true) : null} activeOpacity={0.85}>
              {friendAvatar ? (
                <Image source={{ uri: friendAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitials}>{friendName?.charAt(0) || '?'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{friendName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : messages.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>¡Empieza a chatear con {friendName}!</Text>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.sender_id === profile?.id;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSameSender = prevMsg?.sender_id === msg.sender_id;
              const bubbleBg = isMine ? colors.primary : colors.surfaceAlt;

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    isMine ? styles.myMessageWrapper : styles.theirMessageWrapper,
                    isSameSender ? { marginTop: 2 } : { marginTop: 12 }
                  ]}
                >
                  {msg.image_url ? (
                    <TouchableOpacity
                      style={[styles.imageWrapper, isMine ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }]}
                      onPress={() => setPreviewImage(msg.image_url!)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: msg.image_url }} style={styles.chatImage} resizeMode="cover" />
                      <Text style={[styles.messageTime, styles.imageTime]}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ) : msg.audio_url ? (
                    <View style={[styles.messageBubble, isMine ? [styles.myBubble, { backgroundColor: bubbleBg }] : [styles.theirBubble, { backgroundColor: bubbleBg }]]}>
                      <VoiceNotePlayer audioUrl={msg.audio_url} isMine={isMine} colors={colors} />
                      <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted, alignSelf: 'flex-end', marginTop: 4 }]}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.messageBubble, isMine ? [styles.myBubble, { backgroundColor: bubbleBg }] : [styles.theirBubble, { backgroundColor: bubbleBg }]]}>
                      <Text style={[styles.messageText, { color: isMine ? '#fff' : colors.textPrimary }]}>{msg.content}</Text>
                      <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
          {isFriendTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.messageBubble, styles.theirBubble, { backgroundColor: colors.surfaceAlt, flexDirection: 'row', gap: 4, paddingVertical: 12 }]}>
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: 0.6 }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: 0.3 }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={[styles.inputContainer, {
          backgroundColor: colors.surface,
          borderTopColor: colors.border + '50',
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12)
        }]}>
          {isRecording ? (
            <View style={styles.recordingBar}>
              <TouchableOpacity onPress={handleCancelRecording} style={[styles.iconBtn, { backgroundColor: colors.surfaceAlt }]}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.recordingInfo}>
                <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={[styles.recordingLabel, { color: colors.textPrimary }]}>
                  Grabando... {formatDuration(recordingDuration)}
                </Text>
              </View>
              <TouchableOpacity onPress={handleStopAndSendRecording} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setPhotoSourceVisible(true)}
                disabled={previewIsSending || isSendingAudio}
              >
                {previewIsSending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <ImageIcon size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colors.textMuted}
                value={newMessage}
                onChangeText={handleTyping}
                multiline
              />

              {hasText ? (
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              ) : isSendingAudio ? (
                <View style={[styles.sendBtn, { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.surfaceAlt }]} onPress={handleStartRecording}>
                  <Mic size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </>
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

      {/* Beautiful Photo Source Modal */}
      <PhotoSourceModal
        visible={photoSourceVisible}
        onSelectCamera={handlePickFromCamera}
        onSelectGallery={handlePickFromGallery}
        onClose={() => setPhotoSourceVisible(false)}
      />

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewImage(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewImage(null)}>
          <View style={styles.previewContent}>
            <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
            )}
            {/* Only show send button for newly picked images (not received ones) */}
            {previewImage && !messages.some(m => m.image_url === previewImage) && (
              <TouchableOpacity style={[styles.previewSendBtn, { backgroundColor: colors.primary }]} onPress={handleSendPreviewImage}>
                <Send size={18} color="#fff" />
                <Text style={styles.previewSendText}>{t('common.send', 'Enviar')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerName: { fontSize: 18, fontWeight: '700' },

  messagesList: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 },

  messageWrapper: { flexDirection: 'row', width: '100%' },
  myMessageWrapper: { justifyContent: 'flex-end' },
  theirMessageWrapper: { justifyContent: 'flex-start' },

  messageBubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },

  imageWrapper: { maxWidth: '75%', borderRadius: Radius.lg, overflow: 'hidden' },
  chatImage: { width: 220, height: 180 },
  imageTime: { color: 'rgba(255,255,255,0.8)', position: 'absolute', bottom: 6, right: 8 },

  typingContainer: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8, marginBottom: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },

  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: Radius.lg, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, minHeight: 44, maxHeight: 120, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
  recordingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  recordingLabel: { fontSize: 15, fontWeight: '600' },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  previewContent: { width: '100%', alignItems: 'center', paddingHorizontal: 20, gap: 20 },
  previewClose: { position: 'absolute', top: -50, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 320, height: 380, borderRadius: 16 },
  previewSendBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  previewSendText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
