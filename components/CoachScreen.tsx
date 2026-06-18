import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync, launchCameraAsync, launchImageLibraryAsync } from 'expo-image-picker';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import {
  Sparkles, Send, Camera, Mic, Clock,
  MessageSquarePlus, Apple, Salad, Flame,
  BarChart2, Edit2, Heart, Compass, Zap, Activity, Dumbbell
} from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useKeyboardNavBar } from '../hooks/useKeyboardNavBar';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useAICredits } from '../hooks/useAICredits';
import { useAuthStore, useCoachStore, CoachMessage, useSettingsStore, usePurchaseStore, usePlannerStore, useWorkoutHistoryStore } from '../store';
import { sendCoachMessage, buildCoachSystemPrompt, transcribeAudio } from '../services/groq';
import { supabase } from '../services/supabase';
import { Spacing, Radius } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { COACH_CONFIG, CoachType } from '../constants/coachConfig';
import CoachHistoryModal from './CoachHistoryModal';
import { AICreditsBar } from './AICreditsBar';
import { ImageViewerModal } from './ImageViewerModal';
import { ImagePickerModal } from './ImagePickerModal';

const darkenHex = (hex: string, amount = 0.22): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const renderFormattedContent = (content: string, isUser: boolean, colors: any) => {
  const textColor = isUser ? '#FFFFFF' : colors.textPrimary;
  const boldColor = isUser ? '#FFFFFF' : colors.primary;
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    if (line.trim() === '') {
      return <View key={lineIdx} style={{ height: 8 }} />;
    }
    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    const isNumberList = /^\d+\.\s/.test(line.trim());
    const isDisclaimer = !isUser && (
      line.toLowerCase().includes('recuerda que') ||
      line.toLowerCase().includes('profesional certificado') ||
      line.toLowerCase().includes('disclaimer') ||
      line.toLowerCase().includes('not a certified professional') ||
      line.toLowerCase().includes('consult a real professional')
    );
    let cleanLine = line;
    let prefix = '';
    if (isBullet) {
      cleanLine = line.trim().substring(2);
      prefix = '• ';
    } else if (isNumberList) {
      const match = line.trim().match(/^(\d+\.\s)(.*)/);
      cleanLine = match ? match[2] : line;
      prefix = line.trim().match(/^(\d+\.)/)?.[0] + ' ' || '';
    }
    const isOnlyEmoji = cleanLine.trim().length <= 4 && /\p{Emoji}/u.test(cleanLine);
    const parts = cleanLine.split(/\*\*/g);
    const inlineContent = parts.map((part, partIdx) => {
      const isBold = partIdx % 2 === 1;
      return (
        <Text key={partIdx} style={{
          fontWeight: isBold ? '800' : (isDisclaimer ? '400' : '500'),
          color: isBold ? boldColor : (isDisclaimer ? colors.textMuted : textColor),
          fontStyle: isDisclaimer && !isBold ? 'italic' : 'normal',
        }}>
          {part}
        </Text>
      );
    });
    return (
      <View key={lineIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
        {prefix ? (
          <Text style={{
            color: isUser ? '#FFF' : colors.primary,
            fontWeight: '900',
            fontSize: isDisclaimer ? 13 : 15,
            lineHeight: isDisclaimer ? 20 : 24,
            marginRight: 6
          }}>
            {prefix}
          </Text>
        ) : null}
        <Text style={{
          fontSize: isOnlyEmoji ? 26 : (isDisclaimer ? 13 : 15),
          lineHeight: isOnlyEmoji ? 32 : (isDisclaimer ? 20 : 24),
          color: isDisclaimer ? colors.textMuted : textColor,
          flexShrink: 1,
          letterSpacing: 0.15
        }}>
          {inlineContent}
        </Text>
      </View>
    );
  });
};

const MessageBubble = React.memo(function MessageBubble({ msg, isLastUser, onEdit, onImagePress, badgeImage }: { msg: CoachMessage; isLastUser?: boolean; onEdit?: (m: CoachMessage) => void; onImagePress?: (url: string) => void; badgeImage: any }) {
  const colors = useTheme();
  const isUser = msg.role === 'user';
  const renderBubbleBody = () => {
    if (isUser) {
      return (
        <LinearGradient
          colors={[colors.primary, darkenHex(colors.primary)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[bubble.box, {
            borderBottomRightRadius: 4,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 4
          }]}
        >
          {msg.imageUrl && (
            <TouchableOpacity onPress={() => onImagePress?.(msg.imageUrl!)} activeOpacity={0.8}>
              <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 8 }} contentFit="cover" />
            </TouchableOpacity>
          )}
          {renderFormattedContent(msg.content, true, colors)}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            {isLastUser && onEdit && (
              <TouchableOpacity onPress={() => onEdit(msg)} hitSlop={8} style={{ marginRight: 4 }}>
                <Edit2 size={12} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
            <Text style={[bubble.time, { color: 'rgba(255,255,255,0.6)' }]}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </LinearGradient>
      );
    }
    return (
      <View style={[bubble.box, {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2
      }]}>
        {msg.imageUrl && (
          <TouchableOpacity onPress={() => onImagePress?.(msg.imageUrl!)} activeOpacity={0.8}>
            <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 8 }} contentFit="cover" />
          </TouchableOpacity>
        )}
        {renderFormattedContent(msg.content, false, colors)}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <Text style={[bubble.time, { color: colors.textMuted }]}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };
  return (
    <View style={[bubble.row, isUser && bubble.rowUser]}>
      {!isUser && (
        <View style={[bubble.avatarContainer, { borderColor: colors.primary + '30' }]}>
          <Image source={badgeImage} style={bubble.avatar} contentFit="cover" />
        </View>
      )}
      {renderBubbleBody()}
    </View>
  );
});

const bubble = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 6, paddingHorizontal: Spacing.base },
  rowUser:    { flexDirection: 'row-reverse' },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, padding: 1, justifyContent: 'center', alignItems: 'center', flexShrink: 0, backgroundColor: '#fff' },
  avatar:     { width: '100%', height: '100%', borderRadius: 17 },
  box:        { maxWidth: '78%', borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12 },
  time:       { fontSize: 10, marginTop: 2, textAlign: 'right' },
});

const TypingIndicator = React.memo(function TypingIndicator({ badgeImage }: { badgeImage: any }) {
  const colors = useTheme();
  return (
    <View style={[bubble.row, { paddingHorizontal: Spacing.base, marginTop: 6 }]}>
      <View style={[bubble.avatarContainer, { borderColor: colors.primary + '30' }]}>
        <Image source={badgeImage} style={bubble.avatar} contentFit="cover" />
      </View>
      <View style={[bubble.box, {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14
      }]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    </View>
  );
});

interface CoachScreenProps {
  coachType: CoachType;
}

export default function CoachScreen({ coachType }: CoachScreenProps) {
  useKeyboardNavBar();
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const config = COACH_CONFIG[coachType];

  const [input, setInput] = useState(config.useParamPrompt ? (params.prompt as string) || '' : '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 500);
  const isRecording = recorderState.isRecording;
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatRef = useRef<any>(null);

  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const store = useCoachStore();
  const messages = store[config.messagesKey];
  const sessions = store[config.sessionsKey];
  const sessionId = store[config.sessionIdKey];
  const { isTyping, msgCount, addMessage, setMessages, setTyping, incrementCount, checkAndResetDaily, setCurrentSessionId, setSessions, removeLastPair } = store;
  const { profile } = useAuthStore();
  const { isPro } = usePurchaseStore();
  const isProActually = !!isPro || !!profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
  const { tryUseAI } = useAICredits();

  useEffect(() => {
    setTyping(false);
    setIsSending(false);
    checkAndResetDaily();
    if (config.useParamPrompt && params.prompt) {
      setInput(params.prompt as string);
    }
  }, config.useParamPrompt ? [params.prompt] : []);

  const loadSessions = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('coach_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('coach_type', coachType)
      .order('created_at', { ascending: false });
    if (data) setSessions(data, coachType);
  };

  useEffect(() => { loadSessions(); }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    async function loadHistory() {
      if (isSending) return;
      if (!sessionId) {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: t(`coach.${coachType}.welcome`),
          timestamp: new Date().toISOString(),
        }], coachType);
        return;
      }
      if (messages.length > 1) return;
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('id, role, content, image_url, created_at')
        .eq('user_id', profile!.id)
        .eq('coach_type', coachType)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data && !error && data.length > 0) {
        const formatted: CoachMessage[] = data.map((m: any) => ({
          id: String(m.id),
          role: m.role as 'user' | 'model',
          content: m.content ?? '',
          imageUrl: m.image_url,
          timestamp: m.created_at,
        }));
        setMessages(formatted, coachType);
      } else if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: t(`coach.${coachType}.welcome`),
          timestamp: new Date().toISOString(),
        }], coachType);
      }
    }
    loadHistory();
  }, [profile?.id, language, sessionId]);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null, coachType);
    setMessages([{
      id: 'welcome',
      role: 'model',
      content: t(`coach.${coachType}.welcome`),
      timestamp: new Date().toISOString(),
    }], coachType);
  }, [coachType, t]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isTyping]);

  const handlePickImage = useCallback(() => {
    setImagePickerVisible(true);
  }, []);

  const onLaunchCamera = async () => {
    try {
      const { granted } = await requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(t('common.warning', 'Advertencia'), t('profile.cameraPermission', 'Se necesitan permisos de cámara para tomar fotos.'));
        return;
      }
      const result = await launchCameraAsync({ base64: true, quality: 0.2 });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setSelectedImage(result.assets[0].base64!);
      }
    } catch {
      Alert.alert(t('common.error', 'Error'), t('profile.cameraFailed', 'Error al abrir la cámara'));
    }
  };

  const onLaunchGallery = async () => {
    try {
      const { granted } = await requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(t('common.warning', 'Advertencia'), t('profile.galleryPermission', 'Se necesitan permisos de galería para seleccionar fotos.'));
        return;
      }
      const result = await launchImageLibraryAsync({ base64: true, quality: 0.2, mediaTypes: ['images'] });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setSelectedImage(result.assets[0].base64!);
      }
    } catch {
      Alert.alert(t('common.error', 'Error'), t('profile.galleryFailed', 'Error al abrir la galería'));
    }
  };

  const startRecording = async () => {
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t('common.warning', 'Advertencia'), t('tracker.micPermissionSub', 'Por favor permite acceso al micrófono para usar el registro por voz.'));
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err: any) {
      console.error(`${config.tag} Failed to start recording:`, err);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(uri);
          if (text.trim()) setInput(text);
        } catch (err) {
          Alert.alert(t('common.error', 'Error'), t('tracker.voiceFailedSub', 'No pudimos procesar tu voz. Inténtalo de nuevo.'));
        } finally {
          setIsTranscribing(false);
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`${config.tag} Failed to stop recording:`, err);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !selectedImage) return;
    if (isTyping || isSending) return;
    if (!tryUseAI()) return;
    if (!profile) {
      addMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'Profile not loaded yet. Please wait a moment and try again.',
        timestamp: new Date().toISOString(),
      }, coachType);
      return;
    }

    const currentImg = selectedImage;
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const { data: newSession } = await supabase
        .from('coach_sessions')
        .insert({ user_id: profile.id, title: text.slice(0, 30) || 'New Chat', coach_type: coachType })
        .select()
        .single();
      if (newSession) {
        activeSessionId = newSession.id;
        loadSessions();
      }
    }

    const userMsg: CoachMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text || '📷 [Image]',
      imageUrl: currentImg ? `data:image/jpeg;base64,${currentImg}` : undefined,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg, coachType);
    incrementCount();
    setInput('');
    setSelectedImage(null);
    setIsSending(true);
    setTyping(true);

    await supabase.from('coach_conversations').insert({
      user_id: profile.id,
      role: 'user',
      content: text || '[Image]',
      image_url: currentImg ? `data:image/jpeg;base64,${currentImg}` : undefined,
      coach_type: coachType,
      session_id: activeSessionId,
    });

    if (!sessionId && activeSessionId) {
      setCurrentSessionId(activeSessionId, coachType);
    }

    try {
      let raw = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-20)
        .map((m) => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content || ' ' }] }));
      while (raw.length > 0 && raw[0].role !== 'user') raw = raw.slice(1);
      const history: typeof raw = [];
      for (const msg of raw) {
        if (history.length > 0 && history[history.length - 1].role === msg.role) {
          history[history.length - 1] = msg;
        } else {
          history.push(msg);
        }
      }

      const { mealPlans, workoutPlans } = usePlannerStore.getState();
      const sleepLogs = undefined;
      const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile.id);

      const systemPrompt = buildCoachSystemPrompt({
        name: profile.name ?? 'User',
        goal: profile.goal ?? 'maintain',
        tdee: profile.tdee ?? 2000,
        targetCalories: profile.targetCalories ?? 2000,
        macros: profile.macros ?? { protein: 150, carbs: 200, fat: 67 },
        availableFoods: profile.availableFoods,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        sex: profile.sex,
        activityLevel: profile.activityLevel,
        dietaryRestrictions: profile.dietaryRestrictions,
        medicalConditions: profile.medicalConditions,
        medicationsSupplements: profile.medicationsSupplements,
        preferences: profile.preferences,
        mealPlans: isProActually ? mealPlans : undefined,
        workoutPlans: isProActually ? workoutPlans : undefined,
        sleepLogs,
        workoutHistory: workouts,
        isPremium: isProActually,
      }, language, coachType);

      const reply = await sendCoachMessage(history, text, systemPrompt, currentImg ?? undefined);

      const botMsg: CoachMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      addMessage(botMsg, coachType);

      await supabase.from('coach_conversations').insert({
        user_id: profile.id,
        role: 'model',
        content: reply,
        coach_type: coachType,
        session_id: activeSessionId,
      });
    } catch (err: any) {
      console.error('[Coach] Error:', err?.message ?? err);
      addMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Sorry, I couldn't connect right now. ${err?.message ?? 'Please try again.'}`,
        timestamp: new Date().toISOString(),
      }, coachType);
    } finally {
      setTyping(false);
      setIsSending(false);
    }
  }, [input, selectedImage, isTyping, isSending, profile, messages, language, tryUseAI, coachType]);

  const handleEditMessage = useCallback((m: CoachMessage) => {
    setInput(m.content);
    removeLastPair(coachType);
    if (sessionId) {
      supabase.from('coach_conversations').delete().eq('session_id', sessionId).gte('created_at', m.timestamp).then();
    }
  }, [coachType, sessionId]);

  const renderMessage = useCallback(({ item, index }: { item: CoachMessage; index: number }) => {
    const isLastUser = item.role === 'user' && (index === messages.length - 1 || (index === messages.length - 2 && messages[index + 1]?.role === 'model'));
    return (
      <MessageBubble
        msg={item}
        isLastUser={isLastUser}
        onImagePress={setViewingImage}
        badgeImage={config.badgeImage}
        onEdit={handleEditMessage}
      />
    );
  }, [messages.length, config.badgeImage, setViewingImage, handleEditMessage]);

  const canSend = (input.trim().length > 0 || !!selectedImage) && !isTyping && !isSending;
  const showSuggestions = messages.length <= 1 && !isTyping;

  return (
    <LinearGradient colors={[colors.primary + '18', colors.background, colors.background] as const} locations={[0, 0.28, 1]} style={s.safe}>
      <View style={[s.headerContainer, { borderBottomColor: colors.border }]}>
        <LinearGradient colors={[colors.background, colors.surface]} style={s.header}>
          <View style={{ position: 'relative' }}>
            {config.hasAnimatedPulse && isTyping && (
              <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, borderRadius: 24, transform: [{ scale: 1.2 }], opacity: 0.4 }]} />
            )}
            <View style={[s.headerAvatarContainer, { borderColor: config.hasAnimatedPulse && isTyping ? colors.primary : colors.primary + '40' }]}>
              <Image source={config.badgeImage} style={s.headerAvatar} contentFit="cover" />
              <View style={[s.headerOnlineDot, { backgroundColor: config.hasAnimatedPulse && isTyping ? colors.primary : colors.success }]} />
            </View>
          </View>
          <View style={{ flex: 1, paddingRight: 4, marginLeft: 12 }}>
            <Text style={[s.headerName, { color: colors.textPrimary }]} numberOfLines={2}>
              {t(config.headerLabel, config.headerLabelDefault)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity onPress={handleNewChat} style={[s.headerIconBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25' }]} activeOpacity={0.7}>
              <MessageSquarePlus size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHistoryVisible(true)} style={[s.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
              <Clock size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {!isProActually && <AICreditsBar compact />}
          </View>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlashList<CoachMessage>
          ref={flatRef}
          data={messages}
          {...{ estimatedItemSize: 100 } as any}
          style={{ flex: 1 }}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={s.messages}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <>
              {isTyping && <TypingIndicator badgeImage={config.badgeImage} />}
              {showSuggestions && !isTyping && (
                <View style={[s.suggestionsGrid, coachType === 'nutritionist' ? { padding: Spacing.base, paddingVertical: 16 } : { padding: Spacing.base }]}>
                  <View style={{ width: '100%', marginBottom: 12, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {t('coach.suggestionsTitle', 'Sugerencias para empezar')}
                      </Text>
                    </View>
                  </View>
                  {[1, 2, 3, 4].map((i) => {
                    const details = config.defaultSuggestions[i - 1];
                    const IconComponent = details.icon;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[s.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: config.suggestionCardPadding, minHeight: config.suggestionCardMinHeight }]}
                        onPress={() => handleSend(t(`coach.${coachType}.suggest${i}`))}
                        activeOpacity={0.75}
                      >
                        <View style={[s.suggestionIconContainer, { backgroundColor: details.color + '15', width: config.suggestionIconSize, height: config.suggestionIconSize }]}>
                          <IconComponent size={18} color={details.color} />
                        </View>
                        <Text style={[s.suggestionCardText, { color: colors.textPrimary, fontSize: config.suggestionCardFontSize, lineHeight: config.suggestionCardLineHeight }]} numberOfLines={3}>
                          {t(`coach.${coachType}.suggest${i}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          }
        />

        <View style={[s.inputAreaContainer, { borderTopColor: colors.border, backgroundColor: colors.background }, coachType === 'nutritionist' ? { paddingTop: 8 } : null]}>
          {selectedImage && (
            <View style={s.imagePreviewContainer}>
              <View style={[s.imagePreviewWrapper, { borderColor: colors.border }]}>
                <Image source={{ uri: `data:image/jpeg;base64,${selectedImage}` }} style={s.imagePreview} contentFit="cover" />
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={s.removeImageBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[s.inputArea, { paddingBottom: Math.max(insets.bottom, Spacing.base) }, coachType === 'nutritionist' ? { paddingTop: 4 } : null]}>
            <TouchableOpacity onPress={handlePickImage} style={[s.inputIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <Camera size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleRecording}
              style={[s.inputIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isRecording && { backgroundColor: '#EF444415', borderColor: '#EF444450' }]}
              activeOpacity={0.7}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Mic size={20} color={isRecording ? '#EF4444' : colors.textSecondary} />
              )}
              {!isProActually && (
                <View style={s.lockBadge}><Text style={{ fontSize: 7 }}>🔒</Text></View>
              )}
            </TouchableOpacity>

            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={input}
              onChangeText={setInput}
              placeholder={t('coach.inputPlaceholder', 'Escribe tu mensaje aquí...')}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => handleSend()}
            />

            <TouchableOpacity style={[s.sendBtn, !canSend && s.sendBtnDisabled]} onPress={() => handleSend()} disabled={!canSend} activeOpacity={0.8}>
              <LinearGradient colors={[colors.primary, colors.primary + 'E6']} style={[s.sendGrad, canSend && { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }]}>
                <Send size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CoachHistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} coachType={coachType} />
      <ImagePickerModal visible={imagePickerVisible} onClose={() => setImagePickerVisible(false)} onCamera={onLaunchCamera} onGallery={onLaunchGallery} />
      <ImageViewerModal visible={!!viewingImage} imageUri={viewingImage} onClose={() => setViewingImage(null)} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  headerContainer: { borderBottomWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 14 },
  headerAvatarContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, padding: 1, backgroundColor: '#fff', position: 'relative' },
  headerAvatar: { width: '100%', height: '100%', borderRadius: 21 },
  headerOnlineDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', bottom: -1, right: -1, borderWidth: 2, borderColor: '#fff' },
  headerName: { fontSize: 16, fontWeight: '800' },
  messages: { paddingVertical: Spacing.base, paddingBottom: 16 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  suggestionCard: { width: '48%', borderRadius: Radius.lg, borderWidth: 1.5, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  suggestionIconContainer: { borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  suggestionCardText: { fontWeight: '600' },
  inputAreaContainer: { borderTopWidth: 1.5 },
  imagePreviewContainer: { padding: Spacing.base, paddingBottom: 0, flexDirection: 'row' },
  imagePreviewWrapper: { borderWidth: 1.5, borderRadius: Radius.md, padding: 2, position: 'relative' },
  imagePreview: { width: 60, height: 60, borderRadius: Radius.sm },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  removeImageText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  inputArea: { flexDirection: 'row', gap: 8, padding: Spacing.base, alignItems: 'flex-end' },
  inputIconBtn: { width: 42, height: 42, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  lockBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: 1 },
  input: { flex: 1, borderRadius: Radius.lg, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, lineHeight: 22, borderWidth: 1.5, maxHeight: 200, minHeight: 44 },
  sendBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGrad: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerIconBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
});
