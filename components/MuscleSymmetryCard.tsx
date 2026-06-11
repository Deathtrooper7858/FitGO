import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Body from 'react-native-body-highlighter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Dumbbell, Eye, RefreshCw, X, Activity, Zap } from 'lucide-react-native';
import { useWorkoutHistoryStore } from '../store/workoutHistoryStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import exercisesData from '../excercise/exercises.json';
import { Radius } from '../constants';
import { getLocalDateString } from '../utils/date';

// ─── Muscle label map (Spanish readable names) ───────────────────────────────
const MUSCLE_LABELS: Record<string, string> = {
  trapezius:       'Trapecios',
  triceps:         'Tríceps',
  biceps:          'Bíceps',
  chest:           'Pectorales',
  'upper-back':    'Espalda Alta',
  'lower-back':    'Espalda Baja',
  gluteal:         'Glúteos',
  hamstring:       'Isquiotibiales',
  quadriceps:      'Cuádriceps',
  deltoids:        'Deltoides',
  abs:             'Abdominales',
  calves:          'Gemelos',
  forearm:         'Antebrazos',
  obliques:        'Oblicuos',
  adductors:       'Aductores',
};

// ─── Muscle → slug map ───────────────────────────────────────────────────────
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

// ─── Levels ──────────────────────────────────────────────────────────────────
const LEVELS = [
  { min: 1,  max: 2,  color: '#CD7F32', glowColor: 'rgba(205,127,50,0.4)',   gradStart: '#E8A050', gradEnd: '#A0522D', name: 'Bronce',   icon: '🥉' },
  { min: 3,  max: 5,  color: '#CBD5E1', glowColor: 'rgba(203,213,225,0.4)',  gradStart: '#E2E8F0', gradEnd: '#94A3B8', name: 'Plata',    icon: '🥈' },
  { min: 6,  max: 9,  color: '#FFD700', glowColor: 'rgba(255,215,0,0.45)',   gradStart: '#FFE55C', gradEnd: '#D97706', name: 'Oro',      icon: '🥇' },
  { min: 10, max: 99, color: '#00F0FF', glowColor: 'rgba(0,240,255,0.45)',   gradStart: '#80F8FF', gradEnd: '#8B5CF6', name: 'Diamante', icon: '💎' },
];

function getColorForCount(count: number): string {
  for (const lvl of LEVELS) {
    if (count >= lvl.min && count <= lvl.max) return lvl.color;
  }
  return '#2D3250';
}

function getLevelForCount(count: number) {
  for (const lvl of LEVELS) {
    if (count >= lvl.min && count <= lvl.max) return lvl;
  }
  return null;
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

// ─── Animated Medal Badge ────────────────────────────────────────────────────
function MedalBadge({
  level,
  isActive,
  index,
}: {
  level: typeof LEVELS[0];
  isActive: boolean;
  index: number;
}) {
  const glowOpacity = useSharedValue(0.3);
  const scale = useSharedValue(isActive ? 1 : 0.92);

  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 900 }),
          withTiming(0.3, { duration: 900 })
        ),
        -1,
        true
      );
      scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
    } else {
      glowOpacity.value = 0.3;
      scale.value = withSpring(0.92, { damping: 15, stiffness: 250 });
    }
  }, [isActive]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[medalSt.wrapper, scaleStyle]}>
      {/* Outer glow ring */}
      {isActive && (
        <Animated.View
          style={[
            medalSt.glow,
            { backgroundColor: level.glowColor },
            glowStyle,
          ]}
        />
      )}
      {/* Medal body */}
      <LinearGradient
        colors={[level.gradStart, level.gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          medalSt.badge,
          isActive && { borderWidth: 2, borderColor: level.color + 'CC' },
        ]}
      >
        <Text style={medalSt.icon}>{level.icon}</Text>
      </LinearGradient>
      {/* Label */}
      <Text
        style={[
          medalSt.label,
          { color: isActive ? level.color : '#64748B' },
          isActive && { fontWeight: '800' },
        ]}
        numberOfLines={1}
      >
        {level.name}
      </Text>
      {isActive && (
        <View style={[medalSt.activeDot, { backgroundColor: level.color }]} />
      )}
    </Animated.View>
  );
}

const medalSt = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },
  glow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: 10,
    borderRadius: 36,
    zIndex: -1,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: { fontSize: 24 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: -2,
  },
});

// ─── Muscle Tooltip Card ──────────────────────────────────────────────────────
function MuscleTooltip({
  visible,
  muscleName,
  sessionCount,
  level,
  onClose,
}: {
  visible: boolean;
  muscleName: string;
  sessionCount: number;
  level: typeof LEVELS[0] | null;
  onClose: () => void;
}) {
  const colors = useTheme();
  if (!visible) return null;

  const pct = level
    ? Math.min(((sessionCount - level.min) / (level.max - level.min + 1)) * 100, 100)
    : 0;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={tipSt.backdrop} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(220)}
          exiting={SlideOutDown.springify().damping(18).stiffness(220)}
          style={[tipSt.card, { backgroundColor: colors.surface, borderColor: colors.border + '80' }]}
        >
          {/* Handle bar */}
          <View style={[tipSt.handle, { backgroundColor: colors.border }]} />

          {/* Muscle name + close */}
          <View style={tipSt.row}>
            <View style={[tipSt.iconCircle, { backgroundColor: level?.glowColor ?? colors.primary + '20' }]}>
              <Activity size={18} color={level?.color ?? colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tipSt.muscleName, { color: colors.textPrimary }]}>
                {muscleName}
              </Text>
              <Text style={[tipSt.sessionLabel, { color: colors.textSecondary }]}>
                {sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'} este mes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={tipSt.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Level badge */}
          {level && (
            <View style={tipSt.levelRow}>
              <LinearGradient
                colors={[level.gradStart, level.gradEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tipSt.levelBadge}
              >
                <Text style={tipSt.levelBadgeText}>{level.icon} {level.name}</Text>
              </LinearGradient>

              {/* Progress bar */}
              <View style={[tipSt.progressTrack, { backgroundColor: colors.border + '55' }]}>
                <LinearGradient
                  colors={[level.gradStart, level.gradEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[tipSt.progressFill, { width: `${pct}%` }]}
                />
              </View>
              <Text style={[tipSt.progressLabel, { color: colors.textMuted }]}>
                {sessionCount}/{level.max} sesiones para subir de nivel
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={[tipSt.divider, { backgroundColor: colors.border + '40' }]} />

          {/* Hint */}
          <View style={tipSt.hintRow}>
            <Zap size={13} color={colors.primary} />
            <Text style={[tipSt.hint, { color: colors.textMuted }]}>
              Sigue entrenando para subir de nivel
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const tipSt = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    borderRadius: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    borderWidth: 1,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRow: { gap: 10 },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: { height: 1, marginVertical: 4 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hint: { fontSize: 12, fontWeight: '500' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export function MuscleSymmetryCard() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    slug: string;
    count: number;
  }>({ visible: false, slug: '', count: 0 });

  // Reactive subscription
  const workouts = useWorkoutHistoryStore(state => state.workouts);
  const bodyData = useMemo(() => buildBodyData(workouts), [workouts]);

  const hasHistory = workouts.length > 0;

  // Build slug→count map for tooltip
  const muscleCounts = useMemo(() => {
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
    return counts;
  }, [workouts]);

  // Determine highest active medal level
  const highestLevel = useMemo(() => {
    const maxCount = Object.values(muscleCounts).reduce((a, b) => Math.max(a, b), 0);
    let highest = null;
    for (const lvl of LEVELS) {
      if (maxCount >= lvl.min) highest = lvl;
    }
    return highest;
  }, [muscleCounts]);

  // Body scale
  const cardInner = width - 64;
  const bodyScale = Math.min(cardInner / 190, 1.6);

  // Toggle animation
  const toggleAnim = useSharedValue(activeSide === 'front' ? 0 : 1);
  const handleToggle = useCallback((side: 'front' | 'back') => {
    Haptics.selectionAsync();
    setActiveSide(side);
    toggleAnim.value = withSpring(side === 'front' ? 0 : 1, {
      damping: 20,
      stiffness: 280,
    });
  }, []);

  // Pulse overlay
  const pulseOpacity = useSharedValue(0);
  useEffect(() => {
    if (hasHistory) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        true
      );
    }
  }, [hasHistory]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseOpacity.value, [0, 1], [0, 0.35], Extrapolation.CLAMP),
  }));

  const handleMusclePress = useCallback((data: any) => {
    if (!data?.slug) return;
    const count = muscleCounts[data.slug] || 0;
    if (count === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTooltip({ visible: true, slug: data.slug, count });
  }, [muscleCounts]);

  const tooltipLevel = tooltip.count > 0 ? getLevelForCount(tooltip.count) : null;
  const tooltipMuscle = MUSCLE_LABELS[tooltip.slug] ?? tooltip.slug;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border + '40' }]}>
      {/* Aurora background gradient */}
      <LinearGradient
        colors={['rgba(139,92,246,0.12)', 'rgba(6,182,212,0.06)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#8B5CF6', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Dumbbell size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Muscle Map
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('dashboard.musclemapSub', 'Últimos 30 días de entrenamiento')}
            </Text>
          </View>
        </View>
        {hasHistory && highestLevel && (
          <View style={[styles.activeLevelBadge, { borderColor: highestLevel.color + '60', backgroundColor: highestLevel.glowColor }]}>
            <Text style={[styles.activeLevelText, { color: highestLevel.color }]}>
              {highestLevel.icon} {highestLevel.name}
            </Text>
          </View>
        )}
      </View>

      {/* ── Medal Legend (premium) ── */}
      <View style={styles.medalsRow}>
        {LEVELS.map((lvl, i) => (
          <MedalBadge
            key={lvl.name}
            level={lvl}
            isActive={highestLevel?.name === lvl.name}
            index={i}
          />
        ))}
      </View>

      {/* ── Toggle Frente / Atrás ── */}
      <View style={[styles.toggleContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['rgba(139,92,246,0.08)', 'rgba(6,182,212,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {(['front', 'back'] as const).map(side => {
          const isActive = activeSide === side;
          return (
            <TouchableOpacity
              key={side}
              style={styles.toggleTabOuter}
              onPress={() => handleToggle(side)}
              activeOpacity={0.85}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toggleTabActive}
                >
                  {side === 'front'
                    ? <Eye size={15} color="#fff" />
                    : <RefreshCw size={15} color="#fff" />
                  }
                  <Text style={styles.toggleTabActiveText}>
                    {side === 'front'
                      ? t('common.front', 'Frente')
                      : t('common.back', 'Atrás')}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleTabInactive}>
                  {side === 'front'
                    ? <Eye size={15} color={colors.textMuted} />
                    : <RefreshCw size={15} color={colors.textMuted} />
                  }
                  <Text style={[styles.toggleTabInactiveText, { color: colors.textMuted }]}>
                    {side === 'front'
                      ? t('common.front', 'Frente')
                      : t('common.back', 'Atrás')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Body Figure ── */}
      {hasHistory ? (
        <Animated.View
          key={activeSide}
          entering={FadeIn.duration(250)}
          style={styles.bodyWrapper}
        >
          {/* Subtle pulse overlay for active muscles */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.pulseOverlay,
              { backgroundColor: colors.musclePulse },
              pulseStyle,
            ]}
            pointerEvents="none"
          />
          <Body
            key={activeSide}
            data={bodyData}
            side={activeSide}
            scale={bodyScale}
            gender="male"
            defaultFill={colors.surfaceAlt}
            onBodyPartPress={(part) => {
              if (part?.slug) handleMusclePress(part);
            }}
          />
          <Text style={[styles.bodyLabel, { color: colors.textMuted }]}>
            {activeSide === 'front'
              ? t('common.front', 'Frente').toUpperCase()
              : t('common.back', 'Espalda').toUpperCase()}
          </Text>
          <Text style={[styles.bodyHint, { color: colors.textMuted }]}>
            Toca un músculo para ver detalles
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(139,92,246,0.15)', 'rgba(6,182,212,0.08)']}
            style={styles.emptyIcon}
          >
            <Dumbbell size={36} color="#8B5CF6" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('dashboard.symmetryEmpty', 'Sin entrenamientos aún')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('dashboard.symmetryEmptyHint', 'Completa rutinas en el Planner para ver tus músculos trabajados aquí.')}
          </Text>
        </View>
      )}

      {/* ── Muscle Tooltip ── */}
      <MuscleTooltip
        visible={tooltip.visible}
        muscleName={tooltipMuscle}
        sessionCount={tooltip.count}
        level={tooltipLevel}
        onClose={() => setTooltip(t => ({ ...t, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  activeLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeLevelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Medals
  medalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 40,
    padding: 4,
    marginBottom: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toggleTabOuter: {
    borderRadius: 36,
    overflow: 'hidden',
  },
  toggleTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 36,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  toggleTabActiveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  toggleTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 36,
  },
  toggleTabInactiveText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Body
  bodyWrapper: {
    alignItems: 'center',
    paddingBottom: 8,
    position: 'relative',
  },
  pulseOverlay: {
    borderRadius: 20,
    zIndex: 0,
  },
  bodyLabel: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  bodyHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
