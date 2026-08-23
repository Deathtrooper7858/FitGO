import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { useWorkoutHistoryStore } from '../store/workoutHistoryStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { generateDailyTip } from '../services/groq';

const STORAGE_KEY = 'ff-daily-tip';

export function FitzDailyTip({ streakDays }: { streakDays: number }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const workouts = useWorkoutHistoryStore(state => state.workouts);
  const profile = useAuthStore(state => state.profile);
  const language = useSettingsStore(state => state.language);
  
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return; // Wait until we have the actual user

    const fetchTip = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Include userId in key so different accounts never share the same cached tip
        const storageKey = `${STORAGE_KEY}-${profile.id}`;
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date === today && parsed.tip) {
            setTip(parsed.tip);
            setLoading(false);
            return;
          }
        }
        
        // Generate new tip via Groq
        const newTip = await generateDailyTip(profile || {}, workouts, streakDays, language);
        setTip(newTip);
        
        // Cache it per user
        await AsyncStorage.setItem(storageKey, JSON.stringify({ date: today, tip: newTip }));
      } catch (err) {
        console.warn('Error fetching Fitz daily tip:', err);
        setTip(t('dashboard.defaultTip', '¡A darle con todo hoy! 🔥'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTip();
  }, [profile?.id, streakDays, language]);

  return (
    <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.container}>
      <LinearGradient 
        colors={[colors.primary + '20', colors.surfaceAlt]} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}} 
        style={[styles.glassCard, { borderColor: colors.primary + '40' }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '30' }]}>
          <Bot size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          {loading ? (
            <Animated.Text entering={FadeIn} style={[styles.text, { color: colors.textMuted, fontStyle: 'italic' }]}>
              Fitz está analizando tu día...
            </Animated.Text>
          ) : (
            <Animated.Text entering={FadeIn.duration(400)} style={[styles.text, { color: colors.textSecondary }]} numberOfLines={2}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Fitz: </Text>
              {tip}
            </Animated.Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  }
});
