import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Dumbbell,
  Activity,
  Flame,
  ChevronUp,
  X,
  Search,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { translateExerciseDetails } from '../../services/groq';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants';
import { useIsPro } from '../../hooks/useIsPro';
import { useAdStore } from '../../store/adStore';
import { AdTimerOverlay } from '../../components/AdTimerOverlay';
import exercisesData from '../../excercise/exercises.json';
const instructionsEs: Record<string, string[]> = require('../../excercise/instructions_es.json');

// In-memory cache for ultra-fast instant lookups across exercise selections
const INSTRUCTION_MEMORY_CACHE: Record<string, { name: string; instructions: string[] }> = {};

const Body = React.lazy(() =>
  import('react-native-body-highlighter').then(m => ({ default: m.default }))
);

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    Haptics.impactAsync(style);
  } catch {
    // ignore on platforms without haptics
  }
};

const capitalize = (str: string) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// Muscle group names mapping
const MUSCLE_NAMES: Record<string, { es: string; en: string }> = {
  chest: { es: 'Pecho', en: 'Chest' },
  back: { es: 'Espalda', en: 'Back' },
  legs: { es: 'Piernas', en: 'Legs' },
  shoulders: { es: 'Hombros', en: 'Shoulders' },
  arms: { es: 'Brazos', en: 'Arms' },
  core: { es: 'Core / Abdomen', en: 'Core / Abs' },
  stretching: { es: 'Estiramientos', en: 'Stretching' },
  yoga: { es: 'Yoga', en: 'Yoga' },
};

// Equipment translations
const EQUIPMENT_NAMES: Record<string, { es: string; en: string }> = {
  barbell: { es: 'Barra', en: 'Barbell' },
  dumbbell: { es: 'Mancuerna', en: 'Dumbbell' },
  'body weight': { es: 'Peso Corporal', en: 'Bodyweight' },
  bodyweight: { es: 'Peso Corporal', en: 'Bodyweight' },
  cable: { es: 'Polea / Cable', en: 'Cable' },
  machine: { es: 'Máquina', en: 'Machine' },
  band: { es: 'Banda Elástica', en: 'Band' },
  kettlebell: { es: 'Pesa Rusa', en: 'Kettlebell' },
  other: { es: 'General', en: 'General' },
  leverage: { es: 'Máquina de Palanca', en: 'Leverage' },
  rope: { es: 'Cuerda', en: 'Rope' },
  roller: { es: 'Rodillo', en: 'Roller' },
  wheel: { es: 'Rueda Abdominal', en: 'Ab Wheel' },
};

const GROUP_CONFIG = [
  { id: 'chest', nameKey: 'chest', color: '#FF4D6D', glowColor: 'rgba(255, 77, 109, 0.25)', Icon: Activity },
  { id: 'back', nameKey: 'back', color: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.25)', Icon: Dumbbell },
  { id: 'legs', nameKey: 'legs', color: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.25)', Icon: Flame },
  { id: 'shoulders', nameKey: 'shoulders', color: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.25)', Icon: Activity },
  { id: 'arms', nameKey: 'arms', color: '#10B981', glowColor: 'rgba(16, 185, 129, 0.25)', Icon: Dumbbell },
  { id: 'core', nameKey: 'core', color: '#06B6D4', glowColor: 'rgba(6, 182, 212, 0.25)', Icon: Flame },
  { id: 'stretching', nameKey: 'stretching', color: '#EC4899', glowColor: 'rgba(236, 72, 153, 0.25)', Icon: Activity },
  { id: 'yoga', nameKey: 'yoga', color: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.25)', Icon: Flame },
];

const BASE_SLUG_MAP: Record<string, string> = {
  chest: 'chest',
  'upper-back': 'back',
  'lower-back': 'back',
  trapezius: 'back',
  quadriceps: 'legs',
  hamstring: 'legs',
  gluteal: 'legs',
  calves: 'legs',
  deltoids: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearm: 'arms',
  abs: 'core',
  obliques: 'core',
};

const getGroupIdBySlug = (slug: string) => {
  const s = slug.toLowerCase();
  if (['chest'].includes(s)) return 'chest';
  if (['upper-back', 'lower-back', 'trapezius', 'lats'].includes(s)) return 'back';
  if (['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors', 'abductors', 'hamstrings', 'glutes'].includes(s)) return 'legs';
  if (['deltoids', 'shoulders', 'front-deltoids', 'back-deltoids'].includes(s)) return 'shoulders';
  if (['biceps', 'triceps', 'forearm', 'forearms'].includes(s)) return 'arms';
  if (['abs', 'obliques'].includes(s)) return 'core';
  return null;
};

const getExerciseGroup = (exercise: any) => {
  const name = exercise.name.toLowerCase();
  if (name.includes('yoga')) return 'yoga';
  if (name.includes('stretch')) return 'stretching';

  const bp = exercise.bodyParts?.[0] || '';
  if (bp === 'chest') return 'chest';
  if (bp === 'back') return 'back';
  if (bp === 'upper legs' || bp === 'lower legs') return 'legs';
  if (bp === 'shoulders') return 'shoulders';
  if (bp === 'upper arms' || bp === 'lower arms') return 'arms';
  if (bp === 'waist') return 'core';

  return null;
};

// Process exercises by group and equipment
const processedGroups = GROUP_CONFIG.map(config => {
  const groupExercises = exercisesData.filter(ex => getExerciseGroup(ex) === config.id);

  const equipmentGroups: Record<string, typeof exercisesData> = {};
  groupExercises.forEach(ex => {
    const eq = ex.equipments?.[0] || 'other';
    if (!equipmentGroups[eq]) equipmentGroups[eq] = [];
    equipmentGroups[eq].push(ex);
  });

  const sortedEquipments = Object.keys(equipmentGroups).sort();
  const sortedGroupedExercises = sortedEquipments.map(eq => {
    return {
      equipment: eq,
      exercises: equipmentGroups[eq].sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  return {
    ...config,
    equipmentGroups: sortedGroupedExercises,
    allExercises: groupExercises,
    totalCount: groupExercises.length,
  };
}).filter(g => g.totalCount > 0);

const TOTAL_EXERCISES = processedGroups.reduce((acc, g) => acc + g.totalCount, 0);

interface ExercisePillProps {
  exercise: typeof exercisesData[0];
  groupColor: string;
  colors: any;
  onPress: (ex: typeof exercisesData[0]) => void;
  translatedName: string;
}

const ExercisePillItem = React.memo(function ExercisePillItem({
  exercise,
  groupColor,
  colors,
  onPress,
  translatedName,
}: ExercisePillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.exercisePill,
        {
          backgroundColor: colors.surfaceAlt + '95',
          borderColor: `${groupColor}35`,
        },
      ]}
      onPress={() => onPress(exercise)}
      activeOpacity={0.7}
    >
      <View style={[styles.exerciseDotCircle, { backgroundColor: `${groupColor}25` }]}>
        <View style={[styles.exerciseDotInner, { backgroundColor: groupColor }]} />
      </View>
      <Text style={[styles.exerciseText, { color: colors.textPrimary }]} numberOfLines={1}>
        {translatedName}
      </Text>
      <ChevronRight size={13} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

export default function MuscleDirectoryModal() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string | null>(null);
  const [bodySideView, setBodySideView] = useState<'both' | 'front' | 'back'>('both');
  const [selectedExercise, setSelectedExercise] = useState<typeof exercisesData[0] | null>(null);
  const [translatedData, setTranslatedData] = useState<{ name: string; instructions: string[] } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<Record<string, string>>({});

  const scrollRef = useRef<ScrollView>(null);
  const { hasPremiumAdAccess } = useAdStore();
  const isProActually = useIsPro();
  const hasAccess = isProActually || hasPremiumAdAccess('directory');

  // Compute dynamic Body Highlight data based on active selection
  const dynamicBodyData = useMemo(() => {
    const slugs = [
      { slug: 'chest', defaultColor: '#FF4D6D' },
      { slug: 'upper-back', defaultColor: '#3B82F6' },
      { slug: 'lower-back', defaultColor: '#3B82F6' },
      { slug: 'trapezius', defaultColor: '#3B82F6' },
      { slug: 'quadriceps', defaultColor: '#F59E0B' },
      { slug: 'hamstring', defaultColor: '#F59E0B' },
      { slug: 'gluteal', defaultColor: '#F59E0B' },
      { slug: 'calves', defaultColor: '#F59E0B' },
      { slug: 'deltoids', defaultColor: '#8B5CF6' },
      { slug: 'biceps', defaultColor: '#10B981' },
      { slug: 'triceps', defaultColor: '#10B981' },
      { slug: 'forearm', defaultColor: '#10B981' },
      { slug: 'abs', defaultColor: '#06B6D4' },
      { slug: 'obliques', defaultColor: '#06B6D4' },
    ];

    const activeGroup = selectedMuscleFilter || expandedId;

    return slugs.map(item => {
      const itemGroupId = BASE_SLUG_MAP[item.slug];
      if (!activeGroup) {
        return { slug: item.slug, color: item.defaultColor, intensity: 1 };
      }
      if (itemGroupId === activeGroup) {
        return { slug: item.slug, color: item.defaultColor, intensity: 2 };
      }
      return { slug: item.slug, color: colors.textMuted || '#64748B', intensity: 0.25 };
    });
  }, [selectedMuscleFilter, expandedId, colors.textMuted]);

  // Global search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return exercisesData
      .filter(ex => {
        const name = (ex.name || '').toLowerCase();
        const translatedName = (t(`exerciseNames.${ex.name}`, '') || '').toLowerCase();
        const bp = (ex.bodyParts?.[0] || '').toLowerCase();
        const eq = (ex.equipments?.[0] || '').toLowerCase();
        const tm = (ex.targetMuscles || []).join(' ').toLowerCase();
        return (
          name.includes(q) ||
          translatedName.includes(q) ||
          bp.includes(q) ||
          eq.includes(q) ||
          tm.includes(q)
        );
      })
      .slice(0, 50); // limit to 50 for smooth render
  }, [searchQuery, t]);

  // Muscle group translation helper - supports all 7 languages
  const getGroupName = (id: string) => {
    const key = id === 'back' ? 'backGroup' : id;
    const val = t(`muscleDirectory.${key}`);
    if (val && val !== `muscleDirectory.${key}`) return val;
    const valFallback = t(`muscleDirectory.${id}`);
    if (valFallback && valFallback !== `muscleDirectory.${id}`) return valFallback;
    if (MUSCLE_NAMES[id]) {
      return MUSCLE_NAMES[id][lang] || MUSCLE_NAMES[id].en || id;
    }
    return capitalize(id);
  };

  // Equipment translation helper - supports all 7 languages
  const getEquipmentName = (eq: string) => {
    const clean = eq.toLowerCase().trim();
    const val = t(`equipment.${clean}`);
    if (val && val !== `equipment.${clean}`) {
      return capitalize(val);
    }
    if (EQUIPMENT_NAMES[clean]) {
      return EQUIPMENT_NAMES[clean][lang] || capitalize(clean);
    }
    return capitalize(clean);
  };

  const toggleAccordion = useCallback((id: string) => {
    triggerHaptic();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
    setSelectedMuscleFilter(prev => (prev === id ? null : id));
  }, []);

  const handleBodyPartPress = useCallback((bodyPart: any) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const targetGroupId = getGroupIdBySlug(bodyPart.slug);
    if (targetGroupId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedMuscleFilter(targetGroupId);
      setExpandedId(targetGroupId);

      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 380, animated: true });
      }, 250);
    }
  }, []);

  const handleChipSelect = useCallback((groupId: string | null) => {
    triggerHaptic();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMuscleFilter(groupId);
    setExpandedId(groupId);
    if (groupId) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 380, animated: true });
      }, 250);
    }
  }, []);

  const handleSelectExercise = useCallback(
    async (exercise: any) => {
      triggerHaptic();
      setSelectedExercise(exercise);

      const currentLang = i18n.language || 'en';
      const localizedName = capitalize(String(t(`exerciseNames.${exercise.name}`, exercise.name)));

      // 1. English: display original instructions immediately (0ms)
      if (currentLang.startsWith('en')) {
        setTranslatedData({ name: exercise.name, instructions: exercise.instructions || [] });
        setIsTranslating(false);
        return;
      }

      // 2. Spanish: instant lookup from pre-translated offline dictionary (0ms)
      if (currentLang.startsWith('es')) {
        const pretranslated = (instructionsEs as Record<string, string[]>)[exercise.exerciseId];
        if (pretranslated && pretranslated.length > 0) {
          setTranslatedData({ name: localizedName, instructions: pretranslated });
          setIsTranslating(false);
          return;
        }
      }

      // 3. Fast In-Memory Cache check (0ms)
      const cacheKey = `ex_trans_${exercise.exerciseId || exercise.name}_${currentLang}`;
      if (INSTRUCTION_MEMORY_CACHE[cacheKey]) {
        setTranslatedData(INSTRUCTION_MEMORY_CACHE[cacheKey]);
        setIsTranslating(false);
        return;
      }

      // 4. AsyncStorage Cache check
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          INSTRUCTION_MEMORY_CACHE[cacheKey] = parsed;
          setTranslatedData(parsed);
          setIsTranslating(false);
          return;
        }
      } catch {
        // ignore cache read error
      }

      // 5. Fallback for other languages: show current instructions immediately without blocking the UI
      setTranslatedData({ name: localizedName, instructions: exercise.instructions || [] });
      setIsTranslating(true);

      try {
        const res = await translateExerciseDetails(exercise.name, exercise.instructions || [], currentLang);
        setTranslatedData(res);
        INSTRUCTION_MEMORY_CACHE[cacheKey] = res;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(res));
      } catch (err) {
        console.warn('Translation error, falling back to original:', err);
      } finally {
        setIsTranslating(false);
      }
    },
    [i18n.language, t]
  );

  // Paywall guard
  if (!hasAccess) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.paywallContainer}>
          <View style={styles.paywallBadge}>
            <Sparkles size={36} color="#8B5CF6" />
          </View>
          <Text style={[styles.paywallTitle, { color: colors.textPrimary }]}>
            {t('muscleDirectory.proTitle', 'Directorio Muscular PRO')}
          </Text>
          <Text style={[styles.paywallSub, { color: colors.textSecondary }]}>
            {t(
              'muscleDirectory.proSub',
              'Desbloquea el mapa muscular interactivo con cientos de ejercicios animados clasificados por técnica y equipamiento.'
            )}
          </Text>
          <TouchableOpacity
            style={styles.proBtn}
            onPress={() => router.push('/modals/paywall')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proGrad}
            >
              <Text style={styles.proText}>{t('recipes.unlockNow', 'Desbloquear Ahora')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active muscle group object if selected
  const currentActiveGroup = processedGroups.find(
    g => g.id === (selectedMuscleFilter || expandedId)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Background gradient ambiance */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(6, 182, 212, 0.05)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        pointerEvents="none"
      />

      {/* ── Top App Bar ── */}
      <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('dashboard.muscleDirectory', 'Directorio Muscular')}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: `${colors.primary}18` }]}>
            <Sparkles size={11} color={colors.primary} />
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>
              {TOTAL_EXERCISES} {t('muscleDirectory.exercisesCount', 'ejercicios')}
            </Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Search Bar ── */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt + '90', borderColor: colors.border + '40' }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('muscleDirectory.searchPlaceholder', 'Buscar ejercicio, músculo o equipo...')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearSearchBtn}
            >
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* If Search is Active: Show Search Results List */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchHeaderRow}>
              <Text style={[styles.searchSectionTitle, { color: colors.textSecondary }]}>
                {searchResults.length} {t('common.results', 'resultados')}
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearText, { color: colors.primary }]}>
                  {t('common.clear', 'Limpiar')}
                </Text>
              </TouchableOpacity>
            </View>

            {searchResults.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: colors.surfaceAlt + '60' }]}>
                <Dumbbell size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {t('common.noResults', 'No se encontraron ejercicios')}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Intenta buscar con otra palabra clave como &apos;press&apos;, &apos;squat&apos;, &apos;barra&apos; o &apos;curl&apos;.
                </Text>
              </View>
            ) : (
              <View style={styles.searchResultsList}>
                {searchResults.map(ex => {
                  const group = getExerciseGroup(ex);
                  const config = GROUP_CONFIG.find(g => g.id === group);
                  const pillColor = config ? config.color : colors.primary;

                  return (
                    <TouchableOpacity
                      key={ex.exerciseId}
                      style={[
                        styles.searchItemCard,
                        { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '30' },
                      ]}
                      onPress={() => handleSelectExercise(ex)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.searchItemIcon, { backgroundColor: `${pillColor}15` }]}>
                        <Dumbbell size={18} color={pillColor} />
                      </View>
                      <View style={styles.searchItemInfo}>
                        <Text style={[styles.searchItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {capitalize(t(`exerciseNames.${ex.name}`, ex.name))}
                        </Text>
                        <View style={styles.searchItemBadges}>
                          {group && (
                            <View style={[styles.miniBadge, { backgroundColor: `${pillColor}20` }]}>
                              <Text style={[styles.miniBadgeText, { color: pillColor }]}>
                                {getGroupName(group)}
                              </Text>
                            </View>
                          )}
                          {ex.equipments?.[0] && (
                            <View style={[styles.miniBadge, { backgroundColor: colors.border + '30' }]}>
                              <Text style={[styles.miniBadgeText, { color: colors.textSecondary }]}>
                                {getEquipmentName(ex.equipments[0])}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* Normal Explorer View */
          <>
            {/* ── Interactive 3D Body Deck ── */}
            <View
              style={[
                styles.bodyDeckCard,
                { backgroundColor: colors.surfaceAlt + '50', borderColor: colors.border + '40' },
                currentActiveGroup && {
                  borderColor: currentActiveGroup.color + '50',
                  shadowColor: currentActiveGroup.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 14,
                  elevation: 4,
                },
              ]}
            >
              {/* Top Deck Controls: View Selector & Title */}
              <View style={styles.deckHeader}>
                <View style={styles.deckTitleWrap}>
                  <View
                    style={[
                      styles.deckStatusDot,
                      { backgroundColor: currentActiveGroup ? currentActiveGroup.color : colors.primary },
                    ]}
                  />
                  <Text style={[styles.deckTitle, { color: colors.textPrimary }]}>
                    {currentActiveGroup
                      ? `${getGroupName(currentActiveGroup.id)}`
                      : t('dashboard.bodyScanner', 'Explorador Anatómico')}
                  </Text>
                </View>

                {/* Side Toggle Tabs */}
                <View style={[styles.viewTabsContainer, { backgroundColor: colors.background + '80' }]}>
                  {(['both', 'front', 'back'] as const).map(mode => {
                    const isActive = bodySideView === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.viewTabBtn,
                          isActive && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setBodySideView(mode);
                        }}
                      >
                        <Text
                          style={[
                            styles.viewTabText,
                            { color: isActive ? '#FFF' : colors.textSecondary },
                          ]}
                        >
                          {mode === 'both'
                            ? t('common.both', 'Ambos')
                            : mode === 'front'
                            ? t('common.front', 'Frente')
                            : t('common.back', 'Espalda')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Body Figures Canvas */}
              <View style={styles.bodyCanvasWrap}>
                <React.Suspense
                  fallback={
                    <View style={styles.bodyLoading}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  }
                >
                  {bodySideView === 'both' ? (
                    <View style={styles.bodySideBySide}>
                      <View style={styles.figureCol}>
                        <Body
                          data={dynamicBodyData as any}
                          side="front"
                          scale={0.82}
                          onBodyPartPress={handleBodyPartPress}
                        />
                        <Text style={[styles.figureLabel, { color: colors.textMuted }]}>
                          {t('common.front', 'Frente')}
                        </Text>
                      </View>
                      <View style={styles.figureDivider} />
                      <View style={styles.figureCol}>
                        <Body
                          data={dynamicBodyData as any}
                          side="back"
                          scale={0.82}
                          onBodyPartPress={handleBodyPartPress}
                        />
                        <Text style={[styles.figureLabel, { color: colors.textMuted }]}>
                          {t('common.back', 'Espalda')}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.bodySingleWrapper}>
                      <Body
                        data={dynamicBodyData as any}
                        side={bodySideView}
                        scale={1.1}
                        onBodyPartPress={handleBodyPartPress}
                      />
                      <Text style={[styles.figureLabel, { color: colors.textMuted }]}>
                        {bodySideView === 'front' ? t('common.front', 'Frente') : t('common.back', 'Espalda')}
                      </Text>
                    </View>
                  )}
                </React.Suspense>
              </View>

              {/* Bottom Interactive Deck Bar */}
              <View style={[styles.deckFooter, { borderTopColor: colors.border + '25' }]}>
                {currentActiveGroup ? (
                  <View style={styles.activeSelectionRow}>
                    <View style={styles.activeSelectionInfo}>
                      <Text style={[styles.activeSelectionTitle, { color: currentActiveGroup.color }]}>
                        {getGroupName(currentActiveGroup.id)}
                      </Text>
                      <Text style={[styles.activeSelectionCount, { color: colors.textSecondary }]}>
                        {currentActiveGroup.totalCount} {t('muscleDirectory.exercisesCount', 'ejercicios')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.resetFilterBtn, { backgroundColor: colors.surfaceAlt }]}
                      onPress={() => handleChipSelect(null)}
                    >
                      <RotateCcw size={14} color={colors.textSecondary} />
                      <Text style={[styles.resetFilterText, { color: colors.textSecondary }]}>
                        {t('muscleDirectory.clearFilter', 'Ver todos')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.hintRow}>
                    <Info size={14} color={colors.primary} />
                    <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                      {t('dashboard.muscleDirectorySub', 'Toca un grupo muscular para ver sus ejercicios.')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Quick Muscle Category Filter Chips ── */}
            <View style={styles.chipsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '40' },
                    selectedMuscleFilter === null && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleChipSelect(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedMuscleFilter === null ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    🔥 {t('muscleDirectory.filterAll', 'Todos')} ({TOTAL_EXERCISES})
                  </Text>
                </TouchableOpacity>

                {processedGroups.map(group => {
                  const isSelected = (selectedMuscleFilter || expandedId) === group.id;
                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.filterChip,
                        { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '40' },
                        isSelected && {
                          backgroundColor: `${group.color}25`,
                          borderColor: group.color,
                        },
                      ]}
                      onPress={() => handleChipSelect(isSelected ? null : group.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chipDot, { backgroundColor: group.color }]} />
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isSelected ? group.color : colors.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {getGroupName(group.id)} ({group.totalCount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Muscle Accordion Groups ── */}
            <View style={styles.list}>
              {processedGroups.map(group => {
                const isExpanded = expandedId === group.id;
                const IconComponent = group.Icon;
                const activeEquipment = selectedEquipments[group.id] || 'all';

                // Exercises filtered by equipment if selected
                const filteredExercises =
                  activeEquipment === 'all'
                    ? group.allExercises
                    : group.allExercises.filter(
                        ex => (ex.equipments?.[0] || 'other') === activeEquipment
                      );

                return (
                  <View
                    key={group.id}
                    style={[
                      styles.accordionItem,
                      { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '35' },
                      isExpanded && {
                        borderColor: group.color,
                        backgroundColor: colors.surfaceAlt + '90',
                        shadowColor: group.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 10,
                        elevation: 4,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => toggleAccordion(group.id)}
                      activeOpacity={0.75}
                    >
                      <LinearGradient
                        colors={
                          isExpanded
                            ? [colors.surfaceAlt, `${group.color}18`]
                            : [colors.surfaceAlt + '40', 'transparent']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.accordionHeader}
                      >
                        <View style={styles.groupInfo}>
                          <View
                            style={[
                              styles.iconWrap,
                              { backgroundColor: `${group.color}20`, borderColor: `${group.color}35` },
                            ]}
                          >
                            <IconComponent size={20} color={group.color} />
                          </View>
                          <View>
                            <Text style={[styles.groupName, { color: colors.textPrimary }]}>
                              {getGroupName(group.id)}
                            </Text>
                            <View style={styles.groupCountRow}>
                              <Text style={[styles.groupCount, { color: colors.textSecondary }]}>
                                {group.totalCount} {t('muscleDirectory.exercisesCount', 'ejercicios')}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                              <Text style={[styles.groupEquipmentCount, { color: colors.textMuted }]}>
                                {group.equipmentGroups.length} {t('muscleDirectory.equipments', 'equipos')}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.chevronWrap,
                            {
                              backgroundColor: isExpanded ? group.color : colors.surfaceAlt,
                              borderColor: isExpanded ? group.color : colors.border + '40',
                            },
                          ]}
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} color="#FFF" />
                          ) : (
                            <ChevronDown size={16} color={colors.textSecondary} />
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Expanded Content with Equipment Tabs & Exercises */}
                    {isExpanded && (
                      <View style={[styles.expandedContent, { borderTopColor: colors.border + '30' }]}>
                        {/* Equipment horizontal filter pills within group */}
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.equipmentsScroll}
                        >
                          <TouchableOpacity
                            style={[
                              styles.equipFilterPill,
                              { backgroundColor: colors.background + '80', borderColor: colors.border + '40' },
                              activeEquipment === 'all' && {
                                backgroundColor: group.color,
                                borderColor: group.color,
                              },
                            ]}
                            onPress={() => {
                              triggerHaptic();
                              setSelectedEquipments(prev => ({ ...prev, [group.id]: 'all' }));
                            }}
                          >
                            <Text
                              style={[
                                styles.equipFilterText,
                                { color: activeEquipment === 'all' ? '#FFF' : colors.textSecondary },
                                activeEquipment === 'all' && { fontWeight: '700' },
                              ]}
                            >
                              {t('common.all', 'Todos')} ({group.allExercises.length})
                            </Text>
                          </TouchableOpacity>

                          {group.equipmentGroups.map(eq => {
                            const isEqActive = activeEquipment === eq.equipment;
                            return (
                              <TouchableOpacity
                                key={eq.equipment}
                                style={[
                                  styles.equipFilterPill,
                                  { backgroundColor: colors.background + '80', borderColor: colors.border + '40' },
                                  isEqActive && {
                                    backgroundColor: `${group.color}25`,
                                    borderColor: group.color,
                                  },
                                ]}
                                onPress={() => {
                                  triggerHaptic();
                                  setSelectedEquipments(prev => ({
                                    ...prev,
                                    [group.id]: isEqActive ? 'all' : eq.equipment,
                                  }));
                                }}
                              >
                                <Text
                                  style={[
                                    styles.equipFilterText,
                                    { color: isEqActive ? group.color : colors.textSecondary },
                                    isEqActive && { fontWeight: '700' },
                                  ]}
                                >
                                  {getEquipmentName(eq.equipment)} ({eq.exercises.length})
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>

                        {/* Exercise Pills / Cards Grid */}
                        <View style={styles.exercisesGrid}>
                          {filteredExercises.map(exercise => (
                            <ExercisePillItem
                              key={exercise.exerciseId}
                              exercise={exercise}
                              groupColor={group.color}
                              colors={colors}
                              onPress={handleSelectExercise}
                              translatedName={capitalize(t(`exerciseNames.${exercise.name}`, exercise.name))}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Exercise Detail Modal (Sheet/Dialog) ── */}
      <Modal
        visible={!!selectedExercise}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setSelectedExercise(null)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border + '60' }]}>
            {/* Top Modal Drag Bar */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border + '80' }]} />

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setSelectedExercise(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            {selectedExercise && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
                {/* Badges Row */}
                <View style={styles.modalBadgesRow}>
                  {selectedExercise.bodyParts?.[0] && (
                    <View style={[styles.modalPillBadge, { backgroundColor: `${colors.primary}20` }]}>
                      <Activity size={12} color={colors.primary} />
                      <Text style={[styles.modalPillText, { color: colors.primary }]}>
                        {capitalize(selectedExercise.bodyParts[0])}
                      </Text>
                    </View>
                  )}
                  {selectedExercise.equipments?.[0] && (
                    <View style={[styles.modalPillBadge, { backgroundColor: colors.surfaceAlt }]}>
                      <Dumbbell size={12} color={colors.textSecondary} />
                      <Text style={[styles.modalPillText, { color: colors.textSecondary }]}>
                        {getEquipmentName(selectedExercise.equipments[0])}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Exercise Title */}
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {capitalize(
                    translatedData?.name ||
                    t(`exerciseNames.${selectedExercise.name}`, selectedExercise.name)
                  )}
                </Text>

                {/* GIF Animation Frame */}
                <View
                  style={[
                    styles.gifContainer,
                    { backgroundColor: colors.background, borderColor: colors.border + '40' },
                  ]}
                >
                  <Image
                    cachePolicy="memory-disk"
                    source={{
                      uri: supabase.storage
                        .from('excercises')
                        .getPublicUrl(selectedExercise.gifUrl.split('/').pop() || '').data.publicUrl,
                    }}
                    style={styles.gifImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>

                {/* Secondary Muscles Tag */}
                {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                  <View style={styles.secondaryMusclesWrap}>
                    <Text style={[styles.secondaryMusclesLabel, { color: colors.textSecondary }]}>
                      {t('muscleDirectory.secondaryMuscles', 'Músculos secundarios')}:
                    </Text>
                    <View style={styles.secondaryMusclesPills}>
                      {selectedExercise.secondaryMuscles.map((sm: string, idx: number) => (
                        <View key={idx} style={[styles.smBadge, { backgroundColor: colors.surfaceAlt + '80' }]}>
                          <Text style={[styles.smText, { color: colors.textSecondary }]}>
                            {capitalize(sm)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Step-by-step Instructions */}
                <View style={styles.instructionsContainer}>
                  <View style={styles.instructionsHeaderRow}>
                    <View style={styles.instructionsTitleRow}>
                      <CheckCircle2 size={16} color={colors.primary} />
                      <Text style={[styles.instructionsTitle, { color: colors.textPrimary }]}>
                        {t('muscleDirectory.instructions', 'Instrucciones')}
                      </Text>
                    </View>
                    {isTranslating && (
                      <View style={[styles.translatingBadge, { backgroundColor: `${colors.primary}15` }]}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.translatingBadgeText, { color: colors.primary }]}>
                          {t('muscleDirectory.translatingInstructions', 'Traduciendo...')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.instructionStepsList}>
                    {(translatedData?.instructions || selectedExercise.instructions || []).map(
                      (rawStep: string, idx: number) => {
                        // Clean "Step:1 " prefix if present
                        const cleanStep = rawStep.replace(/^Step:\s*\d+\s*/i, '');
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.instructionStepCard,
                              { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' },
                            ]}
                          >
                            <View style={[styles.stepNumberBadge, { backgroundColor: `${colors.primary}20` }]}>
                              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                                {idx + 1}
                              </Text>
                            </View>
                            <Text style={[styles.instructionStepText, { color: colors.textSecondary }]}>
                              {cleanStep}
                            </Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>

                {/* Bottom Close Button */}
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => setSelectedExercise(null)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#6D28D9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalActionGrad}
                  >
                    <Text style={styles.modalActionText}>{t('common.close', 'Cerrar')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <AdTimerOverlay featureId="directory" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    gap: 16,
  },

  // Search Input
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Search Results
  searchResultsContainer: {
    gap: 12,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  searchSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchResultsList: {
    gap: 8,
  },
  searchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
  },
  searchItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchItemInfo: {
    flex: 1,
    gap: 4,
  },
  searchItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchItemBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty State
  emptyStateCard: {
    padding: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // 3D Deck Card
  bodyDeckCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  deckTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deckStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deckTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  viewTabsContainer: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
    gap: 2,
  },
  viewTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  viewTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bodyCanvasWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bodyLoading: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodySideBySide: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  figureCol: {
    alignItems: 'center',
  },
  figureDivider: {
    width: 1,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  figureLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  bodySingleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  activeSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeSelectionInfo: {
    gap: 2,
  },
  activeSelectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  activeSelectionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Category Filter Chips
  chipsContainer: {
    marginVertical: 2,
  },
  chipsScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Accordion Items
  list: {
    gap: 12,
  },
  accordionItem: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  groupCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupEquipmentCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  equipmentsScroll: {
    gap: 6,
    paddingBottom: 4,
  },
  equipFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  equipFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exercisesGrid: {
    gap: 8,
  },
  exercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  exerciseDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  exerciseText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingTop: 12,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalScrollBody: {
    paddingBottom: 24,
    gap: 14,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modalPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  modalPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    paddingRight: 32,
  },
  gifContainer: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  secondaryMusclesWrap: {
    gap: 6,
  },
  secondaryMusclesLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryMusclesPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  smText: {
    fontSize: 11,
    fontWeight: '600',
  },
  instructionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  translatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  translatingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  instructionStepsList: {
    gap: 8,
  },
  instructionStepCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  instructionStepText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },
  modalActionBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalActionGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Paywall
  paywallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 16,
  },
  paywallBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  paywallSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  proBtn: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  proGrad: {
    padding: 16,
    alignItems: 'center',
  },
  proText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
