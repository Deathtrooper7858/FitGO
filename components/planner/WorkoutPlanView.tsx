import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, CheckCircle, Dumbbell, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import type { WorkoutRoutine } from '../../store/plannerStore';
import { AnimatedCard } from '../AnimatedCard';
import ExerciseCard from './ExerciseCard';

interface WorkoutPlanViewProps {
  workout: WorkoutRoutine | undefined;
  activeDay: string;
  isAdjustingBW: boolean;
  alreadyCompleted: boolean;
  exerciseMetrics: Record<number, { weight: string; rpe: string }>;
  onMoveExercise: (index: number, direction: -1 | 1) => void;
  onCompleteWorkout: () => void;
  onAdjustWorkout: (type: 'up' | 'down' | 'bodyweight') => void;
  onUpdateMetric: (index: number, field: 'weight' | 'rpe', value: string) => void;
  onStartRest: (seconds: number) => void;
  getPreviousRPE: (exerciseName: string) => number | null;
}

export default function WorkoutPlanView({
  workout, activeDay, isAdjustingBW, alreadyCompleted, exerciseMetrics,
  onMoveExercise, onCompleteWorkout, onAdjustWorkout, onUpdateMetric, onStartRest,
  getPreviousRPE
}: WorkoutPlanViewProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  if (!workout) {
    return (
      <View style={[wv.contentList, { paddingHorizontal: Spacing.base }]}>
        <View style={wv.emptyDay}>
          <View style={[wv.emptyIconWrap, {backgroundColor: colors.surfaceAlt}]}>
            <Text style={{ fontSize: 42, color: colors.textMuted }}>🏋️</Text>
          </View>
          <Text style={[wv.emptyTitle, { color: colors.textPrimary }]}>{t('planner.noWorkouts')}</Text>
          <Text style={[wv.emptySub, { color: colors.textSecondary }]}>
            {t('planner.emptyWorkoutSub', "Toca 'Generar' para crear un plan de entrenamiento con IA")}
          </Text>
        </View>
      </View>
    );
  }

  const hasExercises = (workout.exercises?.length ?? 0) > 0;

  if (!hasExercises) {
    return (
      <View style={[wv.contentList, { paddingHorizontal: Spacing.base }]}>
        <View style={[wv.restDayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient colors={[colors.primary + '11', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <View style={[wv.restIconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Moon size={36} color={colors.primary} />
          </View>
          <Text style={[wv.restDayTitle, { color: colors.textPrimary }]}>{t('planner.restDay', 'Día de Descanso')}</Text>
          <Text style={[wv.restDayText, { color: colors.textSecondary }]}>{t('planner.restDayHint', '¡Hoy toca descansar! Recupera energías para tu próxima sesión.')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={wv.contentList}>
      <View style={wv.routineHeaderCompact}>
        <Text style={[wv.routineName, { color: colors.textPrimary }]}>{workout.name}</Text>
        <View style={[wv.workoutBadge, {backgroundColor: colors.primary + '15'}]}>
           <Text style={[wv.workoutBadgeText, {color: colors.primary}]}>{workout.exercises?.length || 0} Exercises</Text>
        </View>
      </View>

      {(workout.exercises || []).map((ex, i) => (
        <AnimatedCard key={i} index={i} direction="up">
          <ExerciseCard
            name={ex.name}
            englishName={ex.englishName}
            sets={ex.sets}
            reps={ex.reps}
            rest={ex.rest}
            index={i}
            totalExercises={workout.exercises.length}
            onMoveUp={() => onMoveExercise(i, -1)}
            onMoveDown={() => onMoveExercise(i, 1)}
            onStartRest={() => onStartRest(parseInt(ex.rest) || 90)}
            onAskCoach={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'trainer', prompt: `¿Cómo se hace el ejercicio: ${ex.name}? ¿Qué significa ${ex.sets} sets de ${ex.reps}?` } })}
            weight={exerciseMetrics[i]?.weight || ''}
            rpe={exerciseMetrics[i]?.rpe || ''}
            onWeightChange={(text) => onUpdateMetric(i, 'weight', text)}
            onRpeChange={(text) => onUpdateMetric(i, 'rpe', text)}
            previousRPE={getPreviousRPE(ex.englishName || ex.name)}
          />
        </AnimatedCard>
      ))}

      {!alreadyCompleted && (
        <View style={{ gap: 8, marginTop: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginLeft: 4 }}>{t('planner.quickDifficultyAdjust', 'Quick Difficulty Adjustment')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              onPress={() => onAdjustWorkout('down')}
            >
              <Text style={{ fontSize: 18 }}>🔽</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>-20% Inten.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              onPress={() => onAdjustWorkout('up')}
            >
              <Text style={{ fontSize: 18 }}>🔼</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>+20% Inten.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              onPress={() => onAdjustWorkout('bodyweight')}
              disabled={isAdjustingBW}
            >
              {isAdjustingBW ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontSize: 18 }}>🏠</Text>}
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>{t('planner.noEquipment', 'No Equipment')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/modals/focus-mode', params: { day: activeDay } })}
        style={[wv.completeBtn, { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: 20 }]}
        activeOpacity={0.8}
      >
        <Play size={20} color="#fff" style={{ marginLeft: 4 }} />
        <Text style={[wv.completeBtnText, { color: '#fff' }]}>
          {t('planner.startWorkout', 'Entrenar (Focus Mode)')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCompleteWorkout}
        disabled={alreadyCompleted}
        style={[
          wv.completeBtn,
          alreadyCompleted
            ? { backgroundColor: '#10B98122', borderColor: '#10B98166' }
            : { backgroundColor: colors.primary + '18', borderColor: colors.primary + '66' }
        ]}
        activeOpacity={0.75}
      >
        <CheckCircle size={20} color={alreadyCompleted ? '#10B981' : colors.primary} />
        <Text style={[wv.completeBtnText, { color: alreadyCompleted ? '#10B981' : colors.primary }]}>
          {alreadyCompleted
            ? t('planner.workoutDone', '¡Entrenamiento Completado! ✅')
            : t('planner.markComplete', 'Marcar como Completado')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/modals/muscle-directory')}
        style={[wv.completeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 12 }]}
        activeOpacity={0.75}
      >
        <Dumbbell size={20} color={colors.primary} />
        <Text style={[wv.completeBtnText, { color: colors.primary }]}>
          {t('planner.viewMuscleDirectory', 'Directorio de Ejercicios y GIFs')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const wv = StyleSheet.create({
  contentList: {},
  routineHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routineName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  workoutBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  workoutBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  restDayCard: { padding: 36, alignItems: 'center', borderRadius: 28, borderWidth: 1, overflow: 'hidden', marginTop: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  restIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  restDayTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  restDayText: { textAlign: 'center', fontSize: 16, lineHeight: 26 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, marginBottom: 20, paddingVertical: 16, borderRadius: Radius.full, borderWidth: 1.5 },
  completeBtnText: { fontSize: 16, fontWeight: '800' },
  emptyDay:    { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5 },
  emptyTitle:  { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  emptySub:    { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
});
