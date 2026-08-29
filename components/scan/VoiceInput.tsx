import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
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

  const startRecording = async () => {
    if (recordingStatus.current !== 'idle') return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') return;
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
    <TouchableOpacity
      style={[s.voiceBtn, isRecording && { backgroundColor: colors.error }]}
      onPress={toggleRecording}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={{ fontSize: 24 }}>{isRecording ? '🛑' : '🎤'}</Text>
      )}
      {isRecording && (
        <View style={s.recordingIndicator}>
          <View style={s.recordingDot} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
            {t('scan.recording') || 'Recording...'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  voiceBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  recordingIndicator: {
    position: 'absolute', bottom: -20,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  recordingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
});
