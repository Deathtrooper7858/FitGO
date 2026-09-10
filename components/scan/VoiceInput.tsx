import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Mic, Square } from 'lucide-react-native';
import { transcribeAudio } from '../../services/groq';

interface VoiceInputProps {
  onTextResult: (text: string) => void;
  language: string;
  colors: any;
  t: any;
}

export default function VoiceInput({ onTextResult, language, colors, t }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingStatus = useRef<'idle' | 'starting' | 'recording' | 'stopping'>('idle');
  const [loading, setLoading] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      animation?.stop();
    };
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    if (recordingStatus.current !== 'idle') return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      recordingStatus.current = 'starting';
      setIsRecording(true);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStatus.current = 'recording';
    } catch (err) {
      recordingStatus.current = 'idle';
      setIsRecording(false);
      console.warn('Start error:', err);
    }
  };

  const stopRecording = async () => {
    if (recordingStatus.current === 'starting') {
      let waitCount = 0;
      while (recordingStatus.current === 'starting' && waitCount < 10) {
        await new Promise(r => setTimeout(r, 100));
        waitCount++;
      }
    }
    if (recordingStatus.current !== 'recording') {
      recordingStatus.current = 'idle';
      setIsRecording(false);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordingStatus.current = 'stopping';
    setIsRecording(false);
    try {
      setLoading(true);
      await recorder.stop();
      let audioUri = recorder.uri;
      let attempts = 0;
      while (!audioUri && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        audioUri = recorder.uri;
        attempts++;
      }
      if (audioUri) {
        const text = await transcribeAudio(audioUri);
        if (text?.trim()) {
          onTextResult(text);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err: any) {
      console.warn('Voice error:', err);
    } finally {
      recordingStatus.current = 'idle';
      setLoading(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false }).catch(() => {});
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={s.container}>
      {isRecording && (
        <Animated.View
          style={[
            s.pulseRing,
            {
              backgroundColor: colors.error || '#EF4444',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <TouchableOpacity
        style={[
          s.voiceBtn,
          {
            backgroundColor: isRecording
              ? (colors.error || '#EF4444')
              : 'rgba(255,255,255,0.08)',
            borderColor: isRecording
              ? 'rgba(239, 68, 68, 0.6)'
              : 'rgba(255,255,255,0.15)',
          },
        ]}
        onPress={toggleRecording}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : isRecording ? (
          <Square size={18} color="#fff" fill="#fff" />
        ) : (
          <Mic size={20} color={colors.primaryLight || '#C4B5FD'} />
        )}
      </TouchableOpacity>
      {isRecording && (
        <View style={s.recordingIndicator}>
          <View style={[s.recordingDot, { backgroundColor: colors.error || '#EF4444' }]} />
          <Text style={s.recordingText}>
            {t('scan.recording') || 'Grabando...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.35,
  },
  voiceBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recordingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
