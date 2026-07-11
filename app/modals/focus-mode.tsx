import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X, Play, Pause, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePlannerStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants';

const { width } = Dimensions.get('window');

export default function FocusModeModal() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { workoutPlans } = usePlannerStore();
  const colors = useTheme();
  
  const workout = day ? workoutPlans[day] : null;
  const exercises = workout?.exercises || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerActive && restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev! - 1);
      }, 1000);
    } else if (timerActive && restTimer === 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimerActive(false);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer, timerActive]);

  if (!workout || exercises.length === 0) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.center}>
          <Text style={{ color: colors.textPrimary, fontSize: 18 }}>No hay rutina seleccionada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentIndex];
  const isLast = currentIndex === exercises.length - 1;

  const handleNext = () => {
    if (isLast) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => prev + 1);
    setRestTimer(null);
    setTimerActive(false);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => prev - 1);
    setRestTimer(null);
    setTimerActive(false);
  };

  const toggleTimer = () => {
    if (restTimer === null) {
      setRestTimer(parseInt(currentExercise.rest) || 90);
      setTimerActive(true);
    } else {
      setTimerActive(!timerActive);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <X size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textSecondary }]}>{workout.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.progressWrap}>
        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { backgroundColor: colors.primary, width: `${((currentIndex + 1) / exercises.length) * 100}%` }]} />
        </View>
        <Text style={[s.progressText, { color: colors.textMuted }]}>{currentIndex + 1} de {exercises.length}</Text>
      </View>

      <View style={s.main}>
        <Text style={[s.exerciseName, { color: colors.textPrimary }]}>{currentExercise.name}</Text>
        
        <View style={s.metaRow}>
          <View style={[s.metaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.metaLabel, { color: colors.textMuted }]}>SETS</Text>
            <Text style={[s.metaVal, { color: colors.textPrimary }]}>{currentExercise.sets}</Text>
          </View>
          <View style={[s.metaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.metaLabel, { color: colors.textMuted }]}>REPS</Text>
            <Text style={[s.metaVal, { color: colors.textPrimary }]}>{currentExercise.reps}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[s.timerCircle, { borderColor: restTimer !== null && timerActive ? colors.primary : colors.border, backgroundColor: colors.surface }]}
          onPress={toggleTimer}
          activeOpacity={0.8}
        >
          {restTimer !== null ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.timerText, { color: colors.primary }]}>
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={[s.timerSub, { color: colors.textSecondary }]}>{timerActive ? 'Pausar' : 'Reanudar'}</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Play size={40} color={colors.primary} style={{ marginLeft: 6, marginBottom: 8 }} />
              <Text style={[s.timerText, { color: colors.textPrimary }]}>{currentExercise.rest}</Text>
              <Text style={[s.timerSub, { color: colors.textMuted }]}>Iniciar Descanso</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.navBtn, { backgroundColor: colors.surfaceAlt, opacity: currentIndex === 0 ? 0.5 : 1 }]} 
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={32} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.actionBtn, { backgroundColor: colors.primary }]} 
          onPress={isLast ? () => router.back() : handleNext}
        >
          {isLast ? (
            <>
              <CheckCircle size={24} color="#fff" />
              <Text style={s.actionText}>Finalizar</Text>
            </>
          ) : (
            <>
              <Text style={s.actionText}>Siguiente</Text>
              <ChevronRight size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  progressWrap: { paddingHorizontal: 30, marginBottom: 30 },
  progressBar: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { textAlign: 'center', marginTop: 10, fontSize: 13, fontWeight: '700' },
  main: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  exerciseName: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 40, lineHeight: 40 },
  metaRow: { flexDirection: 'row', gap: 20, marginBottom: 50 },
  metaBox: { width: 100, height: 100, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  metaLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  metaVal: { fontSize: 28, fontWeight: '900' },
  timerCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 4, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  timerText: { fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerSub: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 40, gap: 20 },
  navBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flex: 1, height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
