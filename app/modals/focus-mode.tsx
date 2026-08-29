import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  CheckCircle,
  Plus,
  Minus,
  Trophy,
  Flame,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { usePlannerStore } from '../../store/plannerStore';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../hooks/useTheme';
import { getLocalDateString } from '../../utils/date';

export default function FocusModeModal() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { workoutPlans } = usePlannerStore();
  const addWorkout = useWorkoutHistoryStore((s) => s.addWorkout);
  const showToast = useToastStore((s) => s.showToast);
  const { t } = useTranslation();
  const colors = useTheme();

  const workout = day ? workoutPlans[day] : null;
  const exercises = useMemo(() => workout?.exercises || [], [workout]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [workoutFinished, setWorkoutFinished] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerActive && restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
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
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.center}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
            {t('planner.noWorkoutForFocus', 'No hay rutina seleccionada para este día.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentIndex];
  const totalSets = parseInt(String(currentExercise.sets)) || 3;
  const currentDoneSets = completedSets[currentIndex] || 0;
  const isLast = currentIndex === exercises.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinishWorkout();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => prev + 1);
    setRestTimer(null);
    setTimerActive(false);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => prev - 1);
    setRestTimer(null);
    setTimerActive(false);
  };

  const toggleTimer = () => {
    if (restTimer === null) {
      const defaultSecs = parseInt(String(currentExercise.rest)) || 90;
      setRestTimer(defaultSecs);
      setTimerActive(true);
    } else {
      setTimerActive(!timerActive);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const adjustTimer = (deltaSeconds: number) => {
    Haptics.selectionAsync();
    setRestTimer((prev) => {
      const current = prev ?? parseInt(String(currentExercise.rest)) ?? 90;
      return Math.max(5, current + deltaSeconds);
    });
  };

  const toggleSetDone = (setIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedSets((prev) => {
      const cur = prev[currentIndex] || 0;
      const next = setIndex + 1 === cur ? setIndex : setIndex + 1;
      return { ...prev, [currentIndex]: next };
    });
  };

  const handleFinishWorkout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const todayStr = getLocalDateString(new Date());

    addWorkout({
      date: todayStr,
      routineName: workout.name || t('planner.customWorkout', 'Entrenamiento del día'),
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: parseInt(String(e.sets)) || 3,
        reps: String(e.reps || '10-12'),
      })),
    });

    setWorkoutFinished(true);
    showToast({ text: t('planner.workoutCompletedSuccess', '¡Entrenamiento completado! 🎉'), type: 'success' });
  };

  if (workoutFinished) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={s.finishedWrap}>
          <View style={[s.trophyWrap, { backgroundColor: colors.primary + '20' }]}>
            <Trophy size={64} color={colors.primary} />
          </View>

          <Text style={[s.finishedTitle, { color: colors.textPrimary }]}>
            {t('planner.workoutDoneTitle', '¡Excelente Trabajo!')} 🔥
          </Text>
          <Text style={[s.finishedSub, { color: colors.textSecondary }]}>
            {t('planner.workoutDoneSubtitle', 'Has completado tu rutina de')} {workout.name}.
          </Text>

          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.summaryItem}>
              <Flame size={20} color="#F59E0B" />
              <Text style={[s.summaryItemVal, { color: colors.textPrimary }]}>{exercises.length}</Text>
              <Text style={[s.summaryItemLbl, { color: colors.textMuted }]}>{t('planner.exercises', 'Ejercicios')}</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.summaryItem}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={[s.summaryItemVal, { color: colors.textPrimary }]}>100%</Text>
              <Text style={[s.summaryItemLbl, { color: colors.textMuted }]}>{t('planner.completed', 'Completado')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.primary, width: '100%', marginTop: 32 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={s.actionText}>{t('common.done', 'Listo')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <X size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {workout.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={s.progressWrap}>
        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              s.progressFill,
              { backgroundColor: colors.primary, width: `${((currentIndex + 1) / exercises.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={[s.progressText, { color: colors.textMuted }]}>
          {currentIndex + 1} / {exercises.length}{(currentExercise as any).muscle ? ` • ${(currentExercise as any).muscle}` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Title */}
        <Text style={[s.exerciseName, { color: colors.textPrimary }]}>{currentExercise.name}</Text>

        {/* Sets / Reps Meta */}
        <View style={s.metaRow}>
          <View style={[s.metaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.metaLabel, { color: colors.textMuted }]}>{t('planner.sets', 'SETS')}</Text>
            <Text style={[s.metaVal, { color: colors.textPrimary }]}>{currentExercise.sets}</Text>
          </View>
          <View style={[s.metaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.metaLabel, { color: colors.textMuted }]}>{t('planner.reps', 'REPS')}</Text>
            <Text style={[s.metaVal, { color: colors.textPrimary }]}>{currentExercise.reps}</Text>
          </View>
        </View>

        {/* Set tracker interactive badges */}
        <View style={s.setsTrackerRow}>
          {Array.from({ length: totalSets }).map((_, sIdx) => {
            const isDone = sIdx < currentDoneSets;
            return (
              <TouchableOpacity
                key={sIdx}
                style={[
                  s.setChip,
                  {
                    backgroundColor: isDone ? '#10B98120' : colors.surface,
                    borderColor: isDone ? '#10B981' : colors.border,
                  },
                ]}
                onPress={() => toggleSetDone(sIdx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    s.setChipText,
                    { color: isDone ? '#10B981' : colors.textMuted, fontWeight: isDone ? '800' : '600' },
                  ]}
                >
                  {isDone ? `✓ Set ${sIdx + 1}` : `Set ${sIdx + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rest Timer */}
        <View style={s.timerWrapper}>
          <TouchableOpacity
            style={[
              s.timerCircle,
              {
                borderColor: restTimer !== null && timerActive ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            {restTimer !== null ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={[s.timerText, { color: colors.primary }]}>
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={[s.timerSub, { color: colors.textSecondary }]}>
                  {timerActive ? t('common.pause', 'Pausar') : t('common.resume', 'Reanudar')}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Play size={36} color={colors.primary} style={{ marginLeft: 4, marginBottom: 6 }} />
                <Text style={[s.timerText, { color: colors.textPrimary, fontSize: 32 }]}>
                  {currentExercise.rest || '90s'}
                </Text>
                <Text style={[s.timerSub, { color: colors.textMuted }]}>
                  {t('planner.startRest', 'Iniciar Descanso')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick +/- 15s adjuster */}
          <View style={s.adjustRow}>
            <TouchableOpacity
              style={[s.adjustBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => adjustTimer(-15)}
            >
              <Minus size={16} color={colors.textSecondary} />
              <Text style={[s.adjustText, { color: colors.textSecondary }]}>15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.adjustBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => adjustTimer(15)}
            >
              <Plus size={16} color={colors.textSecondary} />
              <Text style={[s.adjustText, { color: colors.textSecondary }]}>15s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.navBtn, { backgroundColor: colors.surfaceAlt, opacity: currentIndex === 0 ? 0.4 : 1 }]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: isLast ? '#10B981' : colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {isLast ? (
            <>
              <CheckCircle size={22} color="#fff" />
              <Text style={s.actionText}>{t('planner.finishWorkout', 'Finalizar Rutina')}</Text>
            </>
          ) : (
            <>
              <Text style={s.actionText}>{t('common.next', 'Siguiente')}</Text>
              <ChevronRight size={22} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, maxWidth: 220 },
  progressWrap: { paddingHorizontal: 24, marginBottom: 16 },
  progressBar: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: '700' },
  scrollContent: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  exerciseName: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 32 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaBox: { width: 90, height: 76, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.8 },
  metaVal: { fontSize: 22, fontWeight: '900' },
  setsTrackerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24 },
  setChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  setChipText: { fontSize: 12 },
  timerWrapper: { alignItems: 'center', marginTop: 4 },
  timerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  timerText: { fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerSub: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  adjustRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  adjustBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  adjustText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  navBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flex: 1, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  finishedWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  trophyWrap: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  finishedTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  finishedSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  summaryCard: { flexDirection: 'row', borderRadius: 24, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 28, width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryItemVal: { fontSize: 20, fontWeight: '900' },
  summaryItemLbl: { fontSize: 11, fontWeight: '700' },
  divider: { width: 1, height: 40 },
});
