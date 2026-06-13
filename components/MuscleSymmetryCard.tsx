import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import Body from 'react-native-body-highlighter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  FadeIn,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Dumbbell, Eye, RefreshCw, X, Activity, Zap } from 'lucide-react-native';
import { useWorkoutHistoryStore } from '../store/workoutHistoryStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store';
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

// ─── Muscle → slug map ──────────────────────────────────────────────────────────────────
const MUSCLE_MAP: Record<string, string> = {
  // Traps
  'traps':              'trapezius',
  'trapezius':          'trapezius',
  'levator scapulae':   'trapezius',
  // Triceps
  'triceps':            'triceps',
  // Biceps
  'biceps':             'biceps',
  'brachialis':         'biceps',
  // Chest / Pectorals
  'chest':              'chest',
  'pectorals':          'chest',
  'upper chest':        'chest',
  'serratus anterior':  'chest',
  // Back
  'lats':               'upper-back',
  'latissimus dorsi':   'upper-back',
  'upper back':         'upper-back',
  'rhomboids':          'upper-back',
  'lower back':         'lower-back',
  'back':               'upper-back',
  // Glutes
  'glutes':             'gluteal',
  // Hamstrings
  'hamstrings':         'hamstring',
  // Quads
  'quads':              'quadriceps',
  'quadriceps':         'quadriceps',
  // Shoulders
  'delts':              'deltoids',
  'deltoids':           'deltoids',
  'shoulders':          'deltoids',
  'rear deltoids':      'deltoids',
  // Core / Abs
  'abs':                'abs',
  'abdominals':         'abs',
  'lower abs':          'abs',
  'core':               'abs',
  'obliques':           'obliques',
  // Calves
  'calves':             'calves',
  'soleus':             'calves',
  // Forearms
  'forearms':           'forearm',
  'wrist flexors':      'forearm',
  'wrist extensors':    'forearm',
  // Adductors / Abductors
  'adductors':          'adductors',
  'abductors':          'adductors',
  'inner thighs':       'adductors',
  'groin':              'adductors',
  // Hip flexors → map to quadriceps (closest visible muscle)
  'hip flexors':        'quadriceps',
  // Rotator cuff → deltoids
  'rotator cuff':       'deltoids',
  // Cardiovascular / misc (no visual, skip)
};

// ─── Levels ──────────────────────────────────────────────────────────────────────────────
const LEVELS = [
  // Mortal — Stone gray, humble beginning
  { min: 1,  max: 3,   color: '#A8A8B3', glowColor: 'rgba(168,168,179,0.35)', gradStart: '#D1D5DB', gradEnd: '#4B5563', name: 'Mortal',    icon: '\u2694\uFE0F' },
  // Guerrero — Burning copper-crimson
  { min: 4,  max: 8,   color: '#F97316', glowColor: 'rgba(249,115,22,0.5)',   gradStart: '#FDBA74', gradEnd: '#9A3412', name: 'Guerrero',  icon: '\uD83D\uDEE1\uFE0F' },
  // Espartano — Arctic steel blue
  { min: 9,  max: 16,  color: '#38BDF8', glowColor: 'rgba(56,189,248,0.5)',   gradStart: '#7DD3FC', gradEnd: '#075985', name: 'Espartano', icon: '\uD83C\uDFDB\uFE0F' },
  // Semidi\u00f3s — Solar divine gold
  { min: 17, max: 27,  color: '#EAB308', glowColor: 'rgba(234,179,8,0.6)',    gradStart: '#FEF08A', gradEnd: '#92400E', name: 'Semidi\u00f3s',  icon: '\u26A1' },
  // Ol\u00edmpico — Amethyst royalty
  { min: 28, max: 40,  color: '#A855F7', glowColor: 'rgba(168,85,247,0.6)',   gradStart: '#D8B4FE', gradEnd: '#581C87', name: 'Ol\u00edmpico',  icon: '\uD83D\uDC51' },
  // Tit\u00e1n — Cosmic aurora (cyan \u2192 violet)
  { min: 41, max: 999, color: '#06B6D4', glowColor: 'rgba(6,182,212,0.65)',   gradStart: '#67E8F9', gradEnd: '#6D28D9', name: 'Tit\u00e1n',     icon: '\uD83C\uDF0C' },
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

// ─── Unified exercise lookup ─────────────────────────────────────────────────
function findExercise(ex: any) {
  const searchName = (ex.englishName || ex.name || '').toLowerCase().trim();
  if (!searchName) return null;
  
  // 1. Exact match
  let found = (exercisesData as any[]).find(
    (e: any) => e.name.toLowerCase() === searchName
  );
  if (found) return found;
  
  // 2. DB entry contains search name (e.g. search="bench press", db="barbell bench press")
  found = (exercisesData as any[]).find(
    (e: any) => e.name.toLowerCase().includes(searchName)
  );
  if (found) return found;
  
  // 3. Search name contains DB entry (e.g. search="barbell wide bench press", db="bench press")
  // Only match if the db name is at least 5 chars to avoid false positives
  found = (exercisesData as any[]).find(
    (e: any) => e.name.length >= 5 && searchName.includes(e.name.toLowerCase())
  );
  if (found) return found;
  
  // 4. Word overlap: at least 2 significant words must match
  const searchWords = searchName.split(' ').filter((w: string) => w.length > 3);
  if (searchWords.length >= 2) {
    found = (exercisesData as any[]).find((e: any) => {
      const dbWords = e.name.toLowerCase().split(' ');
      const matches = searchWords.filter((w: string) => dbWords.includes(w));
      return matches.length >= 2;
    });
  }
  return found || null;
}

function buildMuscleCounts(workouts: any[]): Record<string, number> {
  const cutoff = getDaysAgo(30);
  const recent = workouts.filter(w => w.date >= cutoff);
  const counts: Record<string, number> = {};

  recent.forEach(workout => {
    workout.exercises.forEach((ex: any) => {
      const dbEx = findExercise(ex);
      if (dbEx?.targetMuscles) {
        dbEx.targetMuscles.forEach((m: string) => {
          const slug = MUSCLE_MAP[m.toLowerCase()] || m.toLowerCase();
          if (MUSCLE_LABELS[slug]) { // only count slugs we know how to display
            counts[slug] = (counts[slug] || 0) + 2; // primary muscles count double
          }
        });
      }
      // Also add secondary muscles at half weight
      if (dbEx?.secondaryMuscles) {
        dbEx.secondaryMuscles.forEach((m: string) => {
          const slug = MUSCLE_MAP[m.toLowerCase()] || m.toLowerCase();
          if (MUSCLE_LABELS[slug]) {
            counts[slug] = (counts[slug] || 0) + 1;
          }
        });
      }
    });
  });
  return counts;
}

function buildBodyData(muscleCounts: Record<string, number>) {
  return Object.entries(muscleCounts)
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: { fontSize: 18 },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
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
  // isMounted tracks whether the overlay should remain in the component tree.
  // We only unmount AFTER the exit animation finishes to avoid abrupt removal.
  const [isMounted, setIsMounted] = useState(false);
  const backdropOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(300);

  // Effect 1: when visible → mount the overlay immediately
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  // Effect 2: after mount, animate in; when closing, animate out then unmount
  useEffect(() => {
    if (!isMounted) return;
    if (visible) {
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 200 });
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    } else {
      // Animate out then unmount
      backdropOpacity.value = withTiming(0, { duration: 180 });
      cardTranslateY.value = withTiming(300, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
  }, [visible, isMounted]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  if (!isMounted) return null;

  const pct = level
    ? Math.min(((sessionCount - level.min) / (level.max - level.min + 1)) * 100, 100)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        {/* Backdrop */}
        <Animated.View style={[tipSt.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Card */}
        <Animated.View style={[tipSt.cardContainer, cardStyle]}>
          <View style={[tipSt.card, { backgroundColor: colors.surface, borderColor: colors.border + '80' }]}>
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
              <Pressable
                onPress={onClose}
                style={tipSt.closeBtn}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <X size={20} color={colors.textMuted} />
              </Pressable>
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
                  {sessionCount}/{level.max} sesiones para siguiente rango
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
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const tipSt = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 50,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 51,
  },
  card: {
    borderRadius: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  const allWorkouts = useWorkoutHistoryStore(state => state.workouts);
  const profile = useAuthStore(state => state.profile);
  const userId = profile?.id;
  const { premiumColor } = useSettingsStore();
  const isPro = !!profile?.isPro;
  const isValidHex = premiumColor?.startsWith('#');
  const isPremiumCustom = (isPro || profile?.role === 'owner' || profile?.role === 'super_admin' || profile?.role === 'admin') && premiumColor && isValidHex;
  
  const workouts = useMemo(() => {
    return allWorkouts.filter(w => !w.userId || w.userId === userId);
  }, [allWorkouts, userId]);

  const muscleCounts = useMemo(() => buildMuscleCounts(workouts), [workouts]);
  const bodyData = useMemo(() => buildBodyData(muscleCounts), [muscleCounts]);
  const hasHistory = bodyData.length > 0;

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
    // Allow pressing ANY muscle that is highlighted (has color), even if count calculation differs
    const isHighlighted = bodyData.some(d => d.slug === data.slug);
    if (count === 0 && !isHighlighted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTooltip({ visible: true, slug: data.slug, count: count > 0 ? count : 1 });
  }, [muscleCounts, bodyData]);

  const tooltipLevel = tooltip.count > 0 ? getLevelForCount(tooltip.count) : null;
  const tooltipMuscle = MUSCLE_LABELS[tooltip.slug] ?? tooltip.slug;

  return (
    <View style={styles.outerWrapper}>
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
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text 
              style={[styles.title, { color: colors.textPrimary }]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              Evolución Muscular
            </Text>
          </View>
        </View>
        {hasHistory && highestLevel && (
          <View style={[styles.activeLevelBadge, { borderColor: highestLevel.color + '60', backgroundColor: highestLevel.glowColor }]}>
            <Text style={[styles.activeLevelText, { color: highestLevel.color, fontSize: 18 }]}>
              {highestLevel.icon}
            </Text>
          </View>
        )}
      </View>

      {/* ── Medal Legend (premium) ── */}
      <View style={styles.medalsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.medalsRowScroll}
          overScrollMode="never"
        >
          {LEVELS.map((lvl, i) => (
            <MedalBadge
              key={lvl.name}
              level={lvl}
              isActive={highestLevel?.name === lvl.name}
              index={i}
            />
          ))}
        </ScrollView>
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
                  colors={isPremiumCustom && premiumColor ? [premiumColor, premiumColor + 'CC'] : ['#8B5CF6', '#6D28D9']}
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
              { backgroundColor: isPremiumCustom && premiumColor ? premiumColor : colors.musclePulse },
              pulseStyle,
            ]}
            pointerEvents="none"
          />
          <Body
            key={activeSide}
            data={bodyData as any}
            side={activeSide}
            scale={bodyScale}
            gender="male"
            defaultFill={colors.surfaceAlt}
            onBodyPartPress={(part: any) => {
              if (part?.slug) handleMusclePress(part);
            }}
          />
          <Text style={[styles.bodyLabel, { color: colors.textMuted }]}>
            {activeSide === 'front'
              ? t('common.front', 'Frente').toUpperCase()
              : t('common.back', 'Espalda').toUpperCase()}
          </Text>
          {bodyData.length > 0 && (
            <Text style={[styles.bodyHint, { color: colors.textMuted }]}>
              💡 Toca un músculo coloreado para ver detalles
            </Text>
          )}
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
      </View>
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
  outerWrapper: {
    position: 'relative',
    marginTop: 16,
  },
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
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

  // Medals / Ranks
  medalsContainer: {
    marginBottom: 20,
    marginHorizontal: -12, // Pull out slightly to allow full scrolling
  },
  medalsRowScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 16, // Increase spacing since it scrolls now
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
