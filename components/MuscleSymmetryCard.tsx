import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import Body from 'react-native-body-highlighter';
import { useWorkoutHistoryStore } from '../store/workoutHistoryStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import exercisesData from '../excercise/exercises.json';
import { Radius } from '../constants';
import { getLocalDateString } from '../utils/date';

// Map "targetMuscles" from exercises.json → slugs for react-native-body-highlighter
const MUSCLE_MAP: Record<string, string> = {
  'traps':       'trapezius',
  'trapezius':   'trapezius',
  'triceps':     'triceps',
  'biceps':      'biceps',
  'chest':       'chest',
  'pectorals':   'chest',
  'lats':        'upper-back',
  'glutes':      'gluteal',
  'hamstrings':  'hamstring',
  'quads':       'quadriceps',
  'delts':       'deltoids',
  'shoulders':   'deltoids',
  'abs':         'abs',
  'calves':      'calves',
  'forearms':    'forearm',
  'obliques':    'obliques',
  'adductors':   'adductors',
  'lower back':  'lower-back',
};

const LEVELS = [
  { min: 1,  max: 2,  color: '#CD7F32', name: 'Bronce'   },
  { min: 3,  max: 5,  color: '#94A3B8', name: 'Plata'    },
  { min: 6,  max: 9,  color: '#FFD700', name: 'Oro'      },
  { min: 10, max: 99, color: '#00F0FF', name: 'Diamante'  },
];

function getColorForCount(count: number): string {
  for (const lvl of LEVELS) {
    if (count >= lvl.min && count <= lvl.max) return lvl.color;
  }
  return '#2D3250';
}

function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return getLocalDateString(d);
}

function buildBodyData(workouts: any[]) {
  const cutoff = getDaysAgo(30);
  const recent = workouts.filter(w => w.date >= cutoff);
  const counts: Record<string, number> = {};

  recent.forEach(workout => {
    workout.exercises.forEach((ex: any) => {
      const dbEx = exercisesData.find(
        e => e.name.toLowerCase() === ex.name.toLowerCase()
      );
      if (dbEx?.targetMuscles) {
        dbEx.targetMuscles.forEach(m => {
          const slug = MUSCLE_MAP[m.toLowerCase()] || m.toLowerCase();
          counts[slug] = (counts[slug] || 0) + 1;
        });
      }
    });
  });

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([slug, count]) => ({
      slug,
      color: getColorForCount(count),
      intensity: 1,
    }));
}

export function MuscleSymmetryCard() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Reactive subscription — re-renders automatically when addWorkout() is called
  const workouts = useWorkoutHistoryStore(state => state.workouts);

  const bodyData = useMemo(() => buildBodyData(workouts), [workouts]);

  const hasHistory = workouts.length > 0;

  // Body scale: fill ~85% of the card width for single-body view
  const cardInner = width - 64;   // screen - outer padding - card padding
  const bodyScale = Math.min(cardInner / 190, 1.6);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            🗺️ {t('dashboard.musclemap', 'Muscle Map')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('dashboard.musclemapSub', 'Últimos 30 días de entrenamiento')}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {LEVELS.map(l => (
          <View key={l.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {l.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Side toggle — now actually controls which body renders */}
      <View style={[styles.sideToggle, { backgroundColor: colors.background }]}>
        {(['front', 'back'] as const).map(side => (
          <TouchableOpacity
            key={side}
            style={[
              styles.sideTab,
              activeSide === side && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveSide(side)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.sideTabText,
              { color: activeSide === side ? '#fff' : colors.textSecondary }
            ]}>
              {side === 'front'
                ? `💪 ${t('common.front', 'Frente')}`
                : `🔙 ${t('common.back', 'Atrás')}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasHistory ? (
        <View style={styles.bodyWrapper}>
          <Body
            key={activeSide}
            data={bodyData}
            side={activeSide}
            scale={bodyScale}
            gender="male"
            color={colors.surfaceAlt}
          />
          <Text style={[styles.bodyLabel, { color: colors.textMuted }]}>
            {activeSide === 'front'
              ? t('common.front', 'Frente')
              : t('common.back', 'Espalda')}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💪</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('dashboard.symmetryEmpty', 'Sin entrenamientos aún')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('dashboard.symmetryEmptyHint', 'Completa rutinas en el Planner para ver tus músculos trabajados aquí.')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sideToggle: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: 20,
    alignSelf: 'center',
  },
  sideTab: {
    paddingHorizontal: 32,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  sideTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bodyWrapper: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  bodyLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
