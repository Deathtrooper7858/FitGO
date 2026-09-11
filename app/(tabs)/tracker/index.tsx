import React, { useMemo, useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-gifted-charts';
import { Calendar, Flame, ChevronRight, Plus, Lock, BookOpen, Sparkles, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Radius } from '../../../constants';
import { useAuthStore, useNutritionStore, selectDailyTotals, useSettingsStore, useSocialStore } from '../../../store';
import { useTheme } from '../../../hooks/useTheme';
import { getLocalDateString } from '../../../utils/date';
import { requestNotificationPermissions } from '../../../services/notifications';
import { convertEnergy } from '../../../utils/units';
import { PaywallManager } from '../../../utils/paywallManager';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { GlassCard } from '../../../components/GlassCard';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { FireStreakBadge } from '../../../components/FireStreakBadge';
import { CalorieArc } from '../../../components/tracker/CalorieArc';
import { MacroBars } from '../../../components/tracker/MacroBars';
import { MealCarousel } from '../../../components/tracker/MealCarousel';
import { WaterTracker } from '../../../components/tracker/WaterTracker';
import { FastingWidget } from '../../../components/tracker/FastingWidget';
import { StepsWidget } from '../../../components/tracker/StepsWidget';
import { ConsistencyHeatmap } from '../../../components/tracker/ConsistencyHeatmap';
import { DateNavigator } from '../../../components/tracker/DateNavigator';
import { SocialBadge } from '../../../components/tracker/SocialBadge';
import { AppGuideBanner } from '../../../components/tracker/AppGuideBanner';
import { AppModeModal } from '../../../components/profile/AppModeModal';
import { useIsPro } from '../../../hooks/useIsPro';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const NEAT_CALORIES: Record<string, number> = { seated: 200, standing_sometimes: 439, standing_mostly: 600, moving: 850, physical_work: 1200 };
const EXERCISE_CALORIES: Record<string, number> = { none: 0, '1-2': 150, '3-4': 300, '5-6': 450, daily: 700 };
const ACTIVITY_TO_EXERCISE: Record<string, string> = { sedentary: 'none', light: '1-2', moderate: '3-4', active: '5-6', very_active: 'daily' };

let hasCheckedPaywallSession = false;

export default function TrackerScreen() {
  const { t } = useTranslation();
  const colors = useTheme();

  const mealColors: Record<string, string> = useMemo(() => ({
    breakfast: colors.primary,
    lunch: '#3B82F6',
    dinner: '#10B981',
    snack: '#F59E0B',
  }), [colors.primary]);

  const { language, energyUnit, volumeUnit, appMode, setAppMode } = useSettingsStore();
  const isSimple = appMode === 'simple';
  const [appModeModalVisible, setAppModeModalVisible] = useState(false);
  const [showAdvancedWidgets, setShowAdvancedWidgets] = useState(false);
  const { profile } = useAuthStore();
  const { width } = useWindowDimensions();
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const fetchLogs = useNutritionStore(s => s.fetchLogs);
  const fetchHistory = useNutritionStore(s => s.fetchHistory);
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const setDate = useNutritionStore(s => s.setDate);
  const streakDays = useNutritionStore(s => s.streakDays);
  const addWater = useNutritionStore(s => s.addWater);
  const steps = useNutritionStore(s => s.dailySteps[s.selectedDate] || 0);
  const rawWater = useNutritionStore(s => s.dailyWater[s.selectedDate] || 0);
  const currentNeat = useNutritionStore(s => s.dailyNeat[s.selectedDate] || profile?.lifestyle || 'standing_sometimes');
  const currentExercise = useNutritionStore(s => s.dailyExercise[s.selectedDate] || ACTIVITY_TO_EXERCISE[profile?.activityLevel || 'moderate'] || '3-4');
  const setSteps = useNutritionStore(s => s.setSteps);
  const addSteps = useNutritionStore(s => s.addSteps);
  const activityLogs = useNutritionStore(s => s.activityLogs);
  const removeActivityLog = useNutritionStore(s => s.removeActivityLog);
  const addExtraSnack = useNutritionStore(s => s.addExtraSnack);
  const removeExtraSnack = useNutritionStore(s => s.removeExtraSnack);
  const removeLog = useNutritionStore(s => s.removeLog);
  const totalUnreadCount = useSocialStore(s => s.totalUnreadCount);
  const friends = useSocialStore(s => s.friends);

  // Derived
  const macros = useMemo(() => ({
    protein: profile?.macros?.protein || 150,
    carbs: profile?.macros?.carbs || 250,
    fat: profile?.macros?.fat || 65,
  }), [profile?.macros?.protein, profile?.macros?.carbs, profile?.macros?.fat]);

  const { calories: rawCalories, protein, carbs, fat, sugar, fiber, sodium, iron, calcium, saturatedFat } = useNutritionStore(selectDailyTotals);
  const calories = Math.round(convertEnergy(rawCalories, 'kcal', energyUnit));
  const target = Math.round(convertEnergy(profile?.targetCalories || 2000, 'kcal', energyUnit));
  const energyLabel = energyUnit.toUpperCase();
  const isPro = useIsPro();

  const dayActivities = useMemo(() => activityLogs.filter(a => a.loggedAt.startsWith(selectedDate)), [activityLogs, selectedDate]);
  const baselineRaw = (NEAT_CALORIES[currentNeat] || 0) + (EXERCISE_CALORIES[currentExercise] || 0);
  const activitiesRaw = dayActivities.reduce((acc, a) => acc + a.calories, 0);
  const totalBurned = Math.round(convertEnergy(baselineRaw + activitiesRaw, 'kcal', energyUnit));

  const pendingRequestsCount = useMemo(() => (!profile?.id ? 0 : friends.filter(f => f.status === 'pending' && f.user_id_2 === profile.id).length), [friends, profile?.id]);
  const socialNotificationCount = totalUnreadCount + pendingRequestsCount;

  // Dynamic Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return String(t('tracker.greetingMorning', '¡Buenos días'));
    if (hour >= 12 && hour < 19) return String(t('tracker.greetingAfternoon', '¡Buenas tardes'));
    return String(t('tracker.greetingEvening', '¡Buenas noches'));
  }, [t]);

  const firstName = profile?.name?.split(' ')[0] || String(t('common.athlete', 'Atleta'));

  useEffect(() => {
    if (isPro || hasCheckedPaywallSession) return;
    hasCheckedPaywallSession = true;

    let isMounted = true;
    (async () => {
      try {
        const shouldShow = await PaywallManager.shouldShowPaywall(isPro);
        if (shouldShow && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              router.push({ pathname: '/modals/paywall', params: { source: 'app_open' } });
            }
          }, 800);
        }
      } catch (err) {
        console.warn('[Tracker] Error checking paywall display:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isPro]);

  const allMeals = useMemo(() => {
    const meals = [...MEALS] as string[];
    for (let i = 1; i <= (profile?.extraSnacks || 0); i++) meals.push(`snack${i + 1}`);
    return meals;
  }, [profile?.extraSnacks]);

  const grouped = useMemo(() => allMeals.reduce((acc, m) => {
    acc[m] = todayLogs.filter(l => l.meal === m && l.loggedAt.startsWith(selectedDate));
    return acc;
  }, {} as Record<string, typeof todayLogs>), [allMeals, todayLogs, selectedDate]);

  // Pedometer
  const [liveSteps, setLiveSteps] = useState(0);
  const [historicalSteps, setHistoricalSteps] = useState(0);

  useEffect(() => {
    let sub: any = null, mounted = true;
    (async () => {
      try {
        if (!(await Pedometer.isAvailableAsync())) return;
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted) return;
        const end = new Date(), start = new Date(); start.setHours(0, 0, 0, 0);
        try { const r = await Pedometer.getStepCountAsync(start, end); if (r && mounted) setHistoricalSteps(r.steps); } catch {}
        sub = Pedometer.watchStepCount(r => { if (mounted) setLiveSteps(r.steps); });
      } catch {}
    })();
    return () => { mounted = false; if (sub?.remove) sub.remove(); };
  }, []);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const pedometerTotal = historicalSteps + liveSteps;
  const currentSteps = selectedDate === todayStr ? Math.max(steps, pedometerTotal) : steps;

  useEffect(() => {
    if (selectedDate === todayStr && pedometerTotal > steps) {
      setSteps(pedometerTotal);
    }
  }, [pedometerTotal, selectedDate, todayStr, steps, setSteps]);

  // Alert
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (v?: string) => void;
    onCancel?: () => void;
    actions?: any[];
    showInput?: boolean;
    initialInputValue?: string;
    keyboardType?: any;
  }>({
    visible: false, type: 'info', title: '', message: '', onConfirm: () => {}
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    onConfirm: (v?: string) => void = () => {},
    onCancel: () => void = () => {},
    confirmText?: string,
    cancelText?: string,
    actions?: any[],
    showInput?: boolean,
    initialInputValue?: string,
    keyboardType?: any
  ) => {
    setAlert({
      visible: true, type, title, message, showInput, initialInputValue, keyboardType,
      onConfirm: (v?: string) => { onConfirm(v); setAlert(s => ({ ...s, visible: false })); },
      onCancel: () => { onCancel(); setAlert(s => ({ ...s, visible: false })); },
      confirmText, cancelText,
      actions: actions?.map(a => ({ ...a, onPress: () => { a.onPress(); setAlert(s => ({ ...s, visible: false })); } }))
    });
  };

  // ─── 2-Month Interactive Guide Banner Logic ──────────────────────────────
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const [guideDayNumber, setGuideDayNumber] = useState(1);
  const [isWithinTwoMonths, setIsWithinTwoMonths] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedDismissed = await AsyncStorage.getItem('fitgo_guide_banner_dismissed_date');
        const today = getLocalDateString(new Date());
        if (storedDismissed === today && mounted) {
          setShowGuideBanner(false);
        }

        let firstLaunch = await AsyncStorage.getItem('fitgo_first_launch_timestamp');
        if (!firstLaunch) {
          firstLaunch = new Date().toISOString();
          await AsyncStorage.setItem('fitgo_first_launch_timestamp', firstLaunch);
        }

        const diffTime = Date.now() - new Date(firstLaunch).getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

        if (mounted) {
          setGuideDayNumber(diffDays);
          setIsWithinTwoMonths(diffDays <= 60);
        }
      } catch (err) {
        console.warn('[Tracker] Error loading guide launch date:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleDismissGuideBanner = React.useCallback(async () => {
    try {
      setShowGuideBanner(false);
      const today = getLocalDateString(new Date());
      await AsyncStorage.setItem('fitgo_guide_banner_dismissed_date', today);
    } catch {}
  }, []);

  // Selection state
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = React.useRef<ScrollView>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Effects
  useEffect(() => {
    requestNotificationPermissions();
    if (!profile?.id) return;
    fetchHistory(profile.id);
    const social = useSocialStore.getState();
    social.fetchUnreadCounts(profile.id);
    social.fetchFriends(profile.id);
    const um = social.subscribeToUnreadMessages(profile.id);
    const us = social.subscribeToSocialEvents(profile.id);
    return () => { um(); us(); };
  }, [profile?.id, fetchHistory]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setIsFetching(true);
      try { await fetchLogs(profile.id, selectedDate); } catch { showAlert('error', t('common.error'), t('tracker.loadFailed') || 'Could not load data'); }
      finally { setIsFetching(false); }
    })();
  }, [profile?.id, selectedDate, fetchLogs, t]);

  // Handlers
  const handleAddMeal = (meal: string) => router.push({ pathname: '/modals/scan', params: { initialMeal: meal, date: selectedDate } } as any);
  const handleAddMissingFood = (meal: string) => router.push({ pathname: '/modals/scan', params: { initialMeal: meal, date: selectedDate, initialMode: 'photo' } } as any);

  const handleFoodPress = (log: any) => router.push({ pathname: '/modals/food-detail', params: { foodJson: JSON.stringify(log.foodItem), logId: log.id, initialGrams: String(log.grams), meal: log.meal, date: selectedDate } } as any);
  const handleFoodLongPress = (log: any) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedLogIds(prev => { const n = new Set(prev); n.add(log.id); return n; }); };
  const handleToggleSelect = (id: string) => setSelectedLogIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const handleDeleteSelected = (ids: string[]) => {
    showAlert('confirm', t('tracker.removeEntry', 'Eliminar'), ids.length === 1 ? t('tracker.removeConfirm') || '' : `¿Eliminar ${ids.length} alimentos?`,
      async () => { await Promise.all(ids.map(id => removeLog(id))); setSelectedLogIds(new Set()); }, () => {},
      t('common.remove', 'Eliminar'), t('common.cancel', 'Cancelar'));
  };
  const handleEditSelected = () => {
    const firstId = [...selectedLogIds][0];
    const allLogs = Object.values(grouped).flat();
    const log = allLogs.find(l => l.id === firstId);
    if (!log) return;
    setSelectedLogIds(new Set());
    router.push({ pathname: '/modals/food-detail', params: { foodJson: JSON.stringify(log.foodItem), logId: log.id, initialGrams: String(log.grams), meal: log.meal, date: selectedDate } } as any);
  };
  const handleActivityPress = (act: any) => showAlert('info', act.name, `${act.calories} kcal - ${act.duration} min`, () => {}, () => {}, undefined, undefined, [
    { text: t('common.edit', 'Editar'), onPress: () => router.push(`/modals/add-activity?id=${act.id}` as any) },
    { text: t('common.delete', 'Eliminar'), onPress: () => removeActivityLog(act.id), type: 'destructive' as const },
    { text: t('common.cancel', 'Cancelar'), onPress: () => {}, type: 'secondary' as const }
  ]);
  const handleCustomWater = () => showAlert('info', t('tracker.water'), t('tracker.enterWater', 'Ingresa la cantidad de agua en ml:'), (val) => { if (val && !isNaN(Number(val))) addWater(Number(val) - rawWater); }, () => {}, t('common.save', 'Guardar'), t('common.cancel', 'Cancelar'), undefined, true, rawWater.toString(), 'numeric');

  // Memoized data
  const heatmapDays = useMemo(() => {
    const result = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayLogs = todayLogs.filter(l => l.loggedAt.startsWith(dateStr));
      result.push({ dateStr, hasLogs: dayLogs.length > 0, dayLabel: d.getDay(), dayNum: d.getDate(), intensity: dayLogs.length });
    }
    return result;
  }, [todayLogs]);

  const radarData = useMemo(() => {
    const axes = [
      { label: t('profile.protein'), current: protein, target: macros.protein, color: colors.protein },
      { label: t('profile.carbs'), current: carbs, target: macros.carbs, color: colors.carbs },
      { label: t('profile.fat'), current: fat, target: macros.fat, color: colors.fat },
      { label: t('tracker.fiber'), current: fiber, target: 30, color: '#06B6D4' },
      { label: t('tracker.sugar'), current: sugar, target: 50, color: colors.accent || '#F43F5E' },
    ];
    return axes.map(a => ({ ...a, pct: Math.min(a.current / Math.max(a.target, 1), 1) }));
  }, [protein, carbs, fat, fiber, sugar, macros, colors, t]);

  const stackData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(getLocalDateString(d)); }
    return days.map(date => {
      const dayLogs = todayLogs.filter(l => l.loggedAt.startsWith(date));
      const stacks = MEALS.map(meal => {
        const cals = dayLogs.filter(l => l.meal === meal || (meal === 'snack' && l.meal.startsWith('snack'))).reduce((s, l) => s + (l.calories || 0), 0);
        return { value: Math.round(cals), color: mealColors[meal], marginBottom: 2 };
      }).filter(s => s.value > 0);
      const d = new Date(date + 'T12:00:00');
      return { stacks: stacks.length > 0 ? stacks : [{ value: 0, color: 'transparent' }], label: d.toLocaleDateString(language, { weekday: 'narrow' }), labelTextStyle: { color: colors.textSecondary, fontSize: 10 } };
    });
  }, [todayLogs, language, colors, mealColors]);

  const macroRadarCard = useMemo(() => (
    <GlassCard noPadding showStripe accentColor={colors.primary}>
      <View style={[s.card, { borderWidth: 0, overflow: 'hidden' }]}>
        <View style={[s.cardHeader, { marginBottom: 0 }]}>
          <View>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
              ⬡ {t('tracker.macroBalance', 'Macro Balance')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
              {t('tracker.vsGoals', 'vs. daily goals')}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '40' }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
              {t('tracker.today').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Svg width={260} height={240}>
            {[0.25, 0.5, 0.75].map((scale, gi) => {
              const cx = 130, cy = 120, r = 95 * scale;
              const pts = radarData.map((_, i) => { const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ');
              return <Polygon key={gi} points={pts} fill="none" stroke={colors.border} strokeWidth={gi === 2 ? 1.5 : 1} strokeOpacity={gi === 2 ? 0.6 : 0.35} strokeDasharray={gi === 0 ? '3,4' : gi === 1 ? '4,4' : '5,4'} />;
            })}
            {(() => { const cx = 130, cy = 120, r = 95; const pts = radarData.map((_, i) => { const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' '); return <Polygon points={pts} fill={colors.border + '0A'} stroke={colors.border + 'CC'} strokeWidth={1.5} />; })()}
            {radarData.map((d, i) => { const cx = 130, cy = 120, r = 95; const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; return <Line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={colors.border} strokeWidth={1} strokeOpacity={0.5} />; })}
            <Polygon points={radarData.map((d, i) => { const cx = 130, cy = 120, r = 95 * Math.max(d.pct, 0.03); const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ')} fill={colors.primary + '18'} stroke="none" />
            <Polygon points={radarData.map((d, i) => { const cx = 130, cy = 120, r = 95 * Math.max(d.pct, 0.03); const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ')} fill="none" stroke={colors.primary + 'CC'} strokeWidth={2} strokeLinejoin="round" />
            {radarData.map((d, i) => { const cx = 130, cy = 120; const r = 95 * Math.max(d.pct, 0.03); const rOuter = 95; const a = (Math.PI * 2 * i) / radarData.length - Math.PI / 2; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); const lx = cx + (rOuter + 18) * Math.cos(a), ly = cy + (rOuter + 18) * Math.sin(a); return (
              <G key={i}>
                <Circle cx={x} cy={y} r={9} fill={d.color} fillOpacity={0.2} />
                <Circle cx={x} cy={y} r={5} fill={d.color} />
                <Circle cx={x} cy={y} r={2} fill="#FFFFFF" fillOpacity={0.9} />
                <SvgText x={lx} y={ly - 5} fill={colors.textSecondary} fontSize={8.5} fontWeight="700" textAnchor="middle" alignmentBaseline="middle">{d.label.toUpperCase()}</SvgText>
                <SvgText x={lx} y={ly + 6} fill={d.color} fontSize={9} fontWeight="800" textAnchor="middle" alignmentBaseline="middle">{Math.round(d.pct * 100)}%</SvgText>
              </G>
            ); })}
          </Svg>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border + '40', marginHorizontal: -20, marginBottom: 14 }} />
        <View style={{ gap: 8 }}>
          {radarData.map(d => {
            const pctClamped = Math.min(d.pct * 100, 100);
            return (
              <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', width: 56, textTransform: 'uppercase', letterSpacing: 0.3 }}>{d.label}</Text>
                <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border + '50', overflow: 'hidden' }}>
                  <View style={[{ height: '100%', borderRadius: 3, backgroundColor: d.color, width: `${pctClamped}%` }]} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700', minWidth: 70, textAlign: 'right' }}>
                  <Text style={{ color: d.color }}>{Math.round(d.current)}</Text>
                  <Text style={{ color: colors.textMuted, fontWeight: '400' }}>/{d.target}g</Text>
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  ), [colors, radarData, t]);

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={{ flex: 1 }}>
          <CustomAlert
            visible={alert.visible}
            type={alert.type}
            title={alert.title}
            message={alert.message}
            confirmText={alert.confirmText}
            cancelText={alert.cancelText}
            onConfirm={alert.onConfirm}
            onCancel={alert.onCancel}
            actions={alert.actions}
            showInput={alert.showInput}
            initialInputValue={alert.initialInputValue}
            keyboardType={alert.keyboardType}
          />

          {/* Header con Saludo Personalizado y Acciones Rápidas */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.headerUser}
              onPress={() => router.push('/(tabs)/profile' as any)}
              activeOpacity={0.7}
            >
              <View style={[s.avatarWrap, { borderColor: colors.primary + '50', backgroundColor: colors.surface }]}>
                {profile?.avatarUrl ? (
                  <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={s.avatarImage} />
                ) : (
                  <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary + '25' }]}>
                    <Text style={[s.avatarText, { color: colors.primary }]}>{profile?.name?.[0]?.toUpperCase() || 'A'}</Text>
                  </View>
                )}
              </View>
              <View style={s.greetingCol}>
                <Text style={[s.greetingText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {greeting},
                </Text>
                <Text style={[s.nameText, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {firstName} 👋
                </Text>
              </View>
            </TouchableOpacity>

            {/* Acciones Rápidas Unificadas */}
            <View style={s.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/modals/calendar' as any);
                }}
                style={[
                  s.streakPill,
                  {
                    backgroundColor: colors.surfaceAlt + '60',
                    borderColor: streakDays >= 3 ? '#FF6B00' + '60' : colors.border + '35',
                  },
                ]}
                activeOpacity={0.75}
                accessibilityLabel={t('tracker.streak', 'Racha')}
              >
                <FireStreakBadge streakDays={streakDays} size="small" style={{ paddingHorizontal: 3, paddingVertical: 0 }} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/modals/calendar' as any);
                }}
                style={[
                  s.headerIconBtn,
                  {
                    backgroundColor: colors.surfaceAlt + '60',
                    borderColor: colors.border + '35',
                  },
                ]}
                activeOpacity={0.75}
                accessibilityLabel={t('tracker.calendar', 'Calendario')}
              >
                <Calendar size={16} color={selectedDate === getLocalDateString() ? colors.textPrimary : colors.primary} />
                {selectedDate !== getLocalDateString() && (
                  <View style={[s.activeDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/modals/app-guide' as any);
                }}
                style={[
                  s.headerIconBtn,
                  {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary + '45',
                  },
                ]}
                activeOpacity={0.75}
                accessibilityLabel={t('guide.openGuide', 'Guía de inicio')}
              >
                <BookOpen size={16} color={colors.primary} />
              </TouchableOpacity>

              <SocialBadge
                size={34}
                badgeCount={socialNotificationCount}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/social' as any);
                }}
                colors={colors}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
              {/* Navegador de Días Modernizado */}
              <DateNavigator
                selectedDate={selectedDate}
                onDateChange={setDate}
                colors={colors}
                t={t}
                language={language}
              />

              {/* Banner Interactivo de 2 Meses (60 días) */}
              {isWithinTwoMonths && showGuideBanner && (
                <AppGuideBanner
                  dayNumber={guideDayNumber}
                  totalDays={60}
                  onOpenGuide={() => router.push('/modals/app-guide' as any)}
                  onDismiss={handleDismissGuideBanner}
                  colors={colors}
                  t={t}
                />
              )}

              {/* Píldora de Modo Simplificado */}
              {isSimple && (
                <TouchableOpacity
                  style={[s.simpleModeBanner, { backgroundColor: '#10B98115', borderColor: '#10B98140' }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAppModeModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={s.simpleModeBannerLeft}>
                    <View style={[s.simpleModeIconWrap, { backgroundColor: '#10B98125' }]}>
                      <Sparkles size={14} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.simpleModeBannerTitle, { color: colors.textPrimary }]}>
                        {t('tracker.simpleModeBadge', 'Versión Simplificada')}
                      </Text>
                      <Text style={[s.simpleModeBannerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t('tracker.simpleModeSub', 'Interfaz intuitiva • Toca para cambiar a Avanzada')}
                      </Text>
                    </View>
                  </View>
                  <View style={[s.simpleModeBadgeTag, { backgroundColor: '#10B98122' }]}>
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>
                      {t('common.change', 'Cambiar')} ›
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Widgets Carousel (Hero Anillo + Macros, Micronutrientes, Resumen) */}
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={s.carousel}
                contentContainerStyle={s.carouselContent}
                onMomentumScrollEnd={(e) => setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
              >
                    {/* Slide 1: Anillo de Calorías y Barras de Macros */}
                    <View style={{ width: width - 32 }}>
                      <GlassCard showStripe accentColor={colors.primary} noPadding style={{ borderRadius: 24 }}>
                        <View style={[s.card, { borderWidth: 0, paddingVertical: 20 }]}>
                          <CalorieArc
                            consumed={calories}
                            target={target}
                            burned={totalBurned}
                            energyLabel={energyLabel}
                            colors={colors}
                            t={t}
                          />
                          <MacroBars
                            macros={{ protein, carbs, fat }}
                            targets={macros}
                            colors={colors}
                            t={t}
                          />
                        </View>
                      </GlassCard>
                    </View>

                    {/* Slide 2: Micronutrientes en Rejilla Visual */}
                    <View style={{ width: width - 32 }}>
                      <GlassCard noPadding showStripe accentColor="#06B6D4">
                        <View style={[s.card, { borderWidth: 0, paddingVertical: 18 }]}>
                          <View style={s.cardHeader}>
                            <View>
                              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                                {t('tracker.otherNutrients', 'Micronutrientes')}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                                {t('tracker.dailySummary', 'Valores de ingesta diaria')}
                              </Text>
                            </View>
                            {!isPro && (
                              <TouchableOpacity
                                style={[s.proBadgePill, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary + '45' }]}
                                onPress={() => router.push('/modals/paywall')}
                              >
                                <Lock size={11} color={colors.secondary} />
                                <Text style={[s.proBadgeText, { color: colors.secondary }]}>PRO</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          <View style={s.nutrientsGrid}>
                            {[
                              { emoji: '🌾', label: t('tracker.fiber', 'Fibra'), val: `${Math.round(fiber)} g`, ref: '30 g' },
                              { emoji: '🍭', label: t('tracker.sugar', 'Azúcar'), val: `${Math.round(sugar)} g`, ref: '< 50 g' },
                              { emoji: '🥑', label: t('tracker.saturatedFat', 'Grasas Sat.'), val: `${Math.round(saturatedFat)} g`, ref: '< 20 g' },
                              { emoji: '🧂', label: t('tracker.sodium', 'Sodio'), val: `${Math.round(sodium)} mg`, ref: '< 2300 mg' },
                              { emoji: '🥩', label: t('tracker.iron', 'Hierro'), val: `${Math.round(iron)} mg`, ref: '18 mg' },
                              { emoji: '🥛', label: t('tracker.calcium', 'Calcio'), val: `${Math.round(calcium)} mg`, ref: '1000 mg' },
                            ].map((nut) => (
                              <View
                                key={nut.label}
                                style={[
                                  s.nutrientGridCard,
                                  { backgroundColor: colors.surfaceAlt + '45', borderColor: colors.border + '30' }
                                ]}
                              >
                                <View style={s.nutrientCardHeader}>
                                  <Text style={{ fontSize: 14 }}>{nut.emoji}</Text>
                                  <Text style={[s.nutrientCardLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {nut.label}
                                  </Text>
                                </View>
                                <Text style={[s.nutrientCardVal, { color: colors.textPrimary }]}>
                                  {isPro ? nut.val : '🔒 Pro'}
                                </Text>
                                <Text style={[s.nutrientCardRef, { color: colors.textMuted }]}>
                                  meta: {nut.ref}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </GlassCard>
                    </View>

                    {/* Slide 3: Resumen Semanal */}
                    <View style={{ width: width - 32 }}>
                      <GlassCard noPadding showStripe accentColor={colors.carbs}>
                        <View style={[s.card, { borderWidth: 0, paddingBottom: 14 }]}>
                          <View style={s.cardHeader}>
                            <View>
                              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                                {t('dashboard.weeklyAvg', 'Resumen Semanal')}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                                {t('tracker.dailySummary', 'Comidas de los últimos 7 días')}
                              </Text>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{energyLabel}</Text>
                          </View>
                          <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <BarChart
                              stackData={stackData}
                              barWidth={22}
                              spacing={18}
                              roundedTop
                              roundedBottom
                              hideRules
                              xAxisThickness={0}
                              yAxisThickness={0}
                              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                              noOfSections={4}
                              maxValue={Number.isFinite(target) && target > 0 ? target * 1.2 : 2400}
                              isAnimated
                              animationDuration={800}
                            />
                          </View>
                          <View style={s.chartLegend}>
                            {MEALS.map(m => (
                              <View key={m} style={s.legendItem}>
                                <View style={[s.legendDot, { backgroundColor: mealColors[m] }]} />
                                <Text style={[s.legendText, { color: colors.textSecondary }]}>{t(`tracker.${m}`)}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </GlassCard>
                    </View>
              </ScrollView>

              <View style={s.dotsRow}>
                {[0, 1, 2].map(i => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      Haptics.selectionAsync();
                      carouselRef.current?.scrollTo({ x: i * (width - 32), animated: true });
                      setCarouselIndex(i);
                    }}
                    style={[
                      s.dotIndicator,
                      {
                        backgroundColor: carouselIndex === i ? colors.primary : colors.border + '50',
                        width: carouselIndex === i ? 22 : 7,
                      },
                    ]}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              {/* Banner Promocional Pro */}
              {!isPro && (
                <TouchableOpacity
                  onPress={() => router.push('/modals/paywall')}
                  activeOpacity={0.85}
                  style={{ marginTop: 4 }}
                >
                  <LinearGradient
                    colors={[colors.primary + '18', (colors.secondary || '#06B6D4') + '18']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.proBanner, { borderColor: colors.primary + '35' }]}
                  >
                    <View style={[s.proBannerIconWrap, { backgroundColor: colors.primary + '25' }]}>
                      <Text style={{ fontSize: 20 }}>🎁</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14 }}>
                        {t('tracker.trialBannerTitle', 'Prueba 3 Días de Pro Gratis')}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        {t('tracker.trialBannerDesc', 'Prueba el planificador, Coach de Voz y más. Toca para activar.')}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {isFetching && (
                <View style={{ marginVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>{t('common.loading')}</Text>
                </View>
              )}

              {/* Carrusel de Comidas con Desglose de Macros */}
              {!isFetching && (
                <MealCarousel
                  meals={grouped}
                  allMeals={allMeals}
                  selectedLogIds={selectedLogIds}
                  onToggleSelect={handleToggleSelect}
                  onDeselectAll={() => setSelectedLogIds(new Set())}
                  onFoodPress={handleFoodPress}
                  onFoodLongPress={handleFoodLongPress}
                  onDeleteSelected={handleDeleteSelected}
                  onEditSelected={handleEditSelected}
                  onAddMeal={handleAddMeal}
                  onAddMissingFood={handleAddMissingFood}
                  onRemoveExtraSnack={removeExtraSnack}
                  onAddExtraSnack={addExtraSnack}
                  extraSnacksCount={profile?.extraSnacks || 0}
                  colors={colors}
                  t={t}
                  language={language}
                  energyUnit={energyUnit}
                />
              )}

              {/* Sección de Actividad y Gasto Calórico */}
              <GlassCard noPadding showStripe accentColor={colors.accent || '#F43F5E'}>
                <View style={[s.card, { borderWidth: 0 }]}>
                  <View style={s.cardHeader}>
                    <View style={s.activityTitleWrap}>
                      <View style={[s.activityIconWrap, { backgroundColor: (colors.accent || '#F43F5E') + '18' }]}>
                        <Flame size={18} color={colors.accent || '#F43F5E'} />
                      </View>
                      <View>
                        <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                          {t('tracker.activity', 'Gasto y Actividad')}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                          Total quemado hoy
                        </Text>
                      </View>
                    </View>
                    <View style={[s.burnedPill, { backgroundColor: (colors.accent || '#F43F5E') + '18', borderColor: (colors.accent || '#F43F5E') + '40' }]}>
                      <Text style={[s.burnedPillText, { color: colors.accent || '#F43F5E' }]}>
                        🔥 {totalBurned} {energyLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Fila NEAT (Estilo de vida) */}
                  <TouchableOpacity
                    style={[s.activityRow, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '25' }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push('/modals/select-neat' as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={s.activityRowLeft}>
                      <View style={[s.activityRowIcon, { backgroundColor: '#06B6D418' }]}>
                        <Text style={{ fontSize: 16 }}>🏃</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.activityRowTitle, { color: colors.textPrimary }]}>
                          {t('tracker.lifestyle', 'Estilo de vida (NEAT)')}
                        </Text>
                        <Text style={[s.activityRowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {t(`neat.${currentNeat}`)}
                        </Text>
                      </View>
                    </View>
                    <View style={s.activityRowRight}>
                      <Text style={[s.activityRowCal, { color: colors.textPrimary }]}>
                        {Math.round(convertEnergy(NEAT_CALORIES[currentNeat] || 0, 'kcal', energyUnit))} {energyLabel}
                      </Text>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Fila Ejercicio base */}
                  <TouchableOpacity
                    style={[s.activityRow, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '25' }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push('/modals/select-activity-level' as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={s.activityRowLeft}>
                      <View style={[s.activityRowIcon, { backgroundColor: '#8B5CF618' }]}>
                        <Text style={{ fontSize: 16 }}>🏋️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.activityRowTitle, { color: colors.textPrimary }]}>
                          {t('tracker.activity', 'Nivel de Entrenamiento')}
                        </Text>
                        <Text style={[s.activityRowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {t(currentExercise === 'none' ? 'onboarding.activitySedentary' : currentExercise === '1-2' ? 'onboarding.activityLight' : currentExercise === '3-4' ? 'onboarding.activityModerate' : currentExercise === '5-6' ? 'onboarding.activityActive' : 'onboarding.activityVeryActive')}
                        </Text>
                      </View>
                    </View>
                    <View style={s.activityRowRight}>
                      <Text style={[s.activityRowCal, { color: colors.textPrimary }]}>
                        {Math.round(convertEnergy(EXERCISE_CALORIES[currentExercise] || 0, 'kcal', energyUnit))} {energyLabel}
                      </Text>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Actividades Registradas */}
                  {dayActivities.map((act) => (
                    <TouchableOpacity
                      key={act.id}
                      style={[s.activityRow, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '25' }]}
                      onPress={() => handleActivityPress(act)}
                      activeOpacity={0.7}
                    >
                      <View style={s.activityRowLeft}>
                        <View style={[s.activityRowIcon, { backgroundColor: '#F59E0B18' }]}>
                          <Text style={{ fontSize: 16 }}>{act.icon || '⚡'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.activityRowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {act.name}
                          </Text>
                          <Text style={[s.activityRowSubtitle, { color: colors.textSecondary }]}>
                            {act.duration} min
                          </Text>
                        </View>
                      </View>
                      <View style={s.activityRowRight}>
                        <Text style={[s.activityRowCal, { color: '#F59E0B' }]}>
                          +{Math.round(convertEnergy(act.calories, 'kcal', energyUnit))} {energyLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Botón Añadir Actividad */}
                  <TouchableOpacity
                    style={[s.addActivityBtn, { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '35' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/modals/add-activity' as any);
                    }}
                    activeOpacity={0.75}
                  >
                    <Plus size={15} color={colors.textPrimary} strokeWidth={2.5} />
                    <Text style={[s.addActivityBtnText, { color: colors.textPrimary }]}>
                      {t('tracker.logWorkoutSession', 'Registrar sesión de ejercicio')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Widgets de Consistencia, Hidratación, Ayuno y Pasos */}
              {isSimple ? (
                <>
                  <WaterTracker
                    waterMl={rawWater}
                    onAddWater={addWater}
                    onCustomWaterPress={handleCustomWater}
                    colors={colors}
                    t={t}
                    volumeUnit={volumeUnit}
                  />
                  <StepsWidget
                    steps={currentSteps}
                    onAddSteps={addSteps}
                    colors={colors}
                    t={t}
                  />

                  {/* Herramientas Adicionales Colapsables (Sin perder ninguna función) */}
                  <View style={s.toolsAccordionCard}>
                    <TouchableOpacity
                      style={[
                        s.toolsAccordionHeader,
                        {
                          backgroundColor: colors.surfaceAlt + '65',
                          borderColor: colors.border + '40',
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAdvancedWidgets(!showAdvancedWidgets);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={[s.toolsIconBadge, { backgroundColor: '#8B5CF622' }]}>
                          <SlidersHorizontal size={16} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.toolsAccordionTitle, { color: colors.textPrimary }]}>
                            {t('tracker.moreTools', 'Más herramientas')}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                            {showAdvancedWidgets
                              ? t('common.tapToHide', 'Toca para contraer')
                              : t('tracker.moreToolsDesc', 'Ayuno, Radar de Macros y Consistencia')}
                          </Text>
                        </View>
                      </View>
                      <View style={[s.toolsChevronWrap, { backgroundColor: colors.surface }]}>
                        {showAdvancedWidgets ? (
                          <ChevronUp size={16} color={colors.textSecondary} />
                        ) : (
                          <ChevronDown size={16} color={colors.textSecondary} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {showAdvancedWidgets && (
                      <View style={{ gap: 14, marginTop: 12 }}>
                        {macroRadarCard}
                        <FastingWidget colors={colors} t={t} />
                        <ConsistencyHeatmap
                          heatmapDays={heatmapDays}
                          isPro={isPro}
                          onUpgrade={() => router.push('/modals/paywall')}
                          colors={colors}
                          t={t}
                        />
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  {macroRadarCard}
                  <ConsistencyHeatmap
                    heatmapDays={heatmapDays}
                    isPro={isPro}
                    onUpgrade={() => router.push('/modals/paywall')}
                    colors={colors}
                    t={t}
                  />
                  <WaterTracker
                    waterMl={rawWater}
                    onAddWater={addWater}
                    onCustomWaterPress={handleCustomWater}
                    colors={colors}
                    t={t}
                    volumeUnit={volumeUnit}
                  />
                  <FastingWidget colors={colors} t={t} />
                  <StepsWidget
                    steps={currentSteps}
                    onAddSteps={addSteps}
                    colors={colors}
                    t={t}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>

        <AppModeModal
          visible={appModeModalVisible}
          currentMode={appMode}
          onSelect={(mode) => {
            setAppMode(mode);
            if (profile) useAuthStore.getState().setProfile({ ...profile, appMode: mode });
          }}
          onClose={() => setAppModeModalVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 16,
  },
  greetingCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakPill: {
    height: 34,
    paddingHorizontal: 7,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  carousel: {
    marginHorizontal: -16,
    minHeight: 330,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dotIndicator: {
    height: 6,
    borderRadius: 3,
  },
  card: {
    borderRadius: Radius.xl,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  proBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  nutrientGridCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  nutrientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nutrientCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  nutrientCardVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  nutrientCardRef: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  proBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burnedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  burnedPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  activityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activityRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityRowSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  activityRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityRowCal: {
    fontSize: 12,
    fontWeight: '800',
  },
  addActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 11,
    borderWidth: 1,
    marginTop: 4,
  },
  addActivityBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  simpleModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  simpleModeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  simpleModeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleModeBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  simpleModeBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  simpleModeBadgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toolsAccordionCard: {
    marginTop: 6,
    gap: 10,
  },
  toolsAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  toolsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsAccordionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  toolsChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
