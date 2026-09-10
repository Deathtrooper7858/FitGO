import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, CheckCircle, Dumbbell, Moon, Zap, ArrowDown, ArrowUp, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  isFutureDay?: boolean;
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

function WorkoutPlanView({
  workout,
  activeDay,
  isFutureDay,
  isAdjustingBW,
  alreadyCompleted,
  exerciseMetrics,
  onMoveExercise,
  onCompleteWorkout,
  onAdjustWorkout,
  onUpdateMetric,
  onStartRest,
  getPreviousRPE,
}: WorkoutPlanViewProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  if (!workout) {
    return (
      <View style={[wv.contentList, { paddingHorizontal: Spacing.base }]}>
        <View style={[wv.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[wv.emptyIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Dumbbell size={36} color={colors.primary} />
          </View>
          <Text style={[wv.emptyTitle, { color: colors.textPrimary }]}>
            {t('planner.noWorkouts', 'Sin rutina programada')}
          </Text>
          <Text style={[wv.emptySub, { color: colors.textSecondary }]}>
            {t('planner.emptyWorkoutSub', 'Toca Generar para que la IA diseñe tu rutina de hoy')}
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
          <LinearGradient
            colors={[colors.primary + '18', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[wv.restIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <Moon size={36} color={colors.primary} />
          </View>
          <Text style={[wv.restDayTitle, { color: colors.textPrimary }]}>
            {t('planner.restDay', 'Día de Descanso')}
          </Text>
          <Text style={[wv.restDayText, { color: colors.textSecondary }]}>
            {t('planner.restDayHint', '¡Hoy toca descansar! El músculo crece y se repara mientras reposas.')}
          </Text>
        </View>
      </View>
    );
  }

  const estimatedMinutes = Math.max((workout.exercises?.length || 0) * 8, 20);

  const handleAdjustPress = (type: 'up' | 'down' | 'bodyweight') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdjustWorkout(type);
  };

  return (
    <View style={wv.contentList}>
      {/* Routine Hero Header */}
      <View style={[wv.routineHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[wv.routineOverline, { color: colors.textMuted }]}>
            {t('planner.routineForToday', 'RUTINA DE HOY')}
          </Text>
          <Text style={[wv.routineName, { color: colors.textPrimary }]}>{workout.name}</Text>
        </View>

        <View style={wv.badgesRow}>
          <View style={[wv.pillBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Text style={[wv.pillBadgeText, { color: colors.primary }]}>
              {workout.exercises.length} {t('planner.exercises', 'Ejercicios')}
            </Text>
          </View>
          <View style={[wv.pillBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[wv.pillBadgeText, { color: colors.textSecondary }]}>~{estimatedMinutes} min</Text>
          </View>
        </View>
      </View>

      {/* Quick Difficulty Adjustment Bar */}
      {!alreadyCompleted && (
        <View style={wv.difficultyWrap}>
          <View style={wv.difficultyHeader}>
            <Zap size={14} color={colors.textSecondary} />
            <Text style={[wv.difficultyTitle, { color: colors.textSecondary }]}>
              {t('planner.quickDifficultyAdjust', 'Ajuste Rápido de Dificultad')}
            </Text>
          </View>
          <View style={wv.difficultyButtonsRow}>
            <TouchableOpacity
              style={[wv.diffBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleAdjustPress('down')}
              activeOpacity={0.75}
            >
              <ArrowDown size={14} color="#06B6D4" />
              <Text style={[wv.diffBtnText, { color: colors.textPrimary }]}>-20% Vol.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[wv.diffBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleAdjustPress('up')}
              activeOpacity={0.75}
            >
              <ArrowUp size={14} color="#EF4444" />
              <Text style={[wv.diffBtnText, { color: colors.textPrimary }]}>+20% Int.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[wv.diffBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleAdjustPress('bodyweight')}
              disabled={isAdjustingBW}
              activeOpacity={0.75}
            >
              {isAdjustingBW ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Home size={14} color="#10B981" />
                  <Text style={[wv.diffBtnText, { color: colors.textPrimary }]}>
                    {t('planner.noEquipmentShort', 'Calistenia')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Exercises List */}
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
            onAskCoach={() =>
              router.push({
                pathname: '/(tabs)/coach',
                params: {
                  initialTab: 'trainer',
                  prompt: `¿Cómo se hace el ejercicio: ${ex.name}? ¿Qué técnica recomiendas para ${ex.sets} series de ${ex.reps}?`,
                },
              })
            }
            weight={exerciseMetrics[i]?.weight || ''}
            rpe={exerciseMetrics[i]?.rpe || ''}
            onWeightChange={(text) => onUpdateMetric(i, 'weight', text)}
            onRpeChange={(text) => onUpdateMetric(i, 'rpe', text)}
            previousRPE={getPreviousRPE(ex.englishName || ex.name)}
          />
        </AnimatedCard>
      ))}

      {/* Action Buttons */}
      <View style={wv.actionButtonsContainer}>
        {/* Primary CTA: Focus Mode */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({ pathname: '/modals/focus-mode', params: { day: activeDay } });
          }}
          style={wv.primaryFocusBtn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradientPrimary || ['#7C5CFC', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={wv.primaryFocusGrad}
          >
            <Play size={18} color="#fff" fill="#fff" />
            <Text style={wv.primaryFocusText}>
              {t('planner.startWorkout', 'Entrenar (Modo Enfoque)')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary: Mark as Complete */}
        <TouchableOpacity
          onPress={onCompleteWorkout}
          disabled={alreadyCompleted || isFutureDay}
          style={[
            wv.secondaryBtn,
            alreadyCompleted
              ? { backgroundColor: '#10B98120', borderColor: '#10B98150' }
              : isFutureDay
              ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.5 }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          activeOpacity={0.8}
        >
          <CheckCircle
            size={18}
            color={alreadyCompleted ? '#10B981' : isFutureDay ? colors.textMuted : colors.primary}
          />
          <Text
            style={[
              wv.secondaryBtnText,
              {
                color: alreadyCompleted ? '#10B981' : isFutureDay ? colors.textMuted : colors.textPrimary,
              },
            ]}
          >
            {alreadyCompleted
              ? t('planner.workoutDone', '¡Entrenamiento Completado! ✅')
              : isFutureDay
              ? t('planner.futureWorkout', 'No puedes completar días futuros')
              : t('planner.markComplete', 'Marcar como Completado')}
          </Text>
        </TouchableOpacity>

        {/* Tertiary: Muscle Directory */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/modals/muscle-directory');
          }}
          style={[wv.tertiaryBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Dumbbell size={16} color={colors.textSecondary} />
          <Text style={[wv.tertiaryBtnText, { color: colors.textSecondary }]}>
            {t('planner.viewMuscleDirectory', 'Directorio de Ejercicios y GIFs')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(WorkoutPlanView);

const wv = StyleSheet.create({
  contentList: {
    paddingHorizontal: Spacing.base,
  },
  routineHero: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  routineOverline: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routineName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  difficultyWrap: {
    marginBottom: 16,
    gap: 8,
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  difficultyTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  difficultyButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  diffBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  primaryFocusBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryFocusGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryFocusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tertiaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tertiaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  restDayCard: {
    padding: 36,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  restIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  restDayTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  restDayText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
