import React, { useMemo, useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { BarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Radius } from '../../../constants';
import { useAuthStore, useNutritionStore, selectDailyTotals, useSettingsStore, useSocialStore } from '../../../store';
import { useTheme } from '../../../hooks/useTheme';
import { getLocalDateString, addDays } from '../../../utils/date';
import { requestNotificationPermissions } from '../../../services/notifications';
import { convertEnergy } from '../../../utils/units';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { GlassCard } from '../../../components/GlassCard';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { FireStreakBadge } from '../../../components/FireStreakBadge';
import { CalorieArc } from '../../../components/tracker/CalorieArc';
import { MacroBars } from '../../../components/tracker/MacroBars';
import { MealCarousel } from '../../../components/tracker/MealCarousel';
import { WaterTracker } from '../../../components/tracker/WaterTracker';
import { StepsWidget } from '../../../components/tracker/StepsWidget';
import { ConsistencyHeatmap } from '../../../components/tracker/ConsistencyHeatmap';
import { DateNavigator } from '../../../components/tracker/DateNavigator';
import { SocialBadge } from '../../../components/tracker/SocialBadge';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type Meal = typeof MEALS[number];

const NEAT_CALORIES: Record<string, number> = { seated: 200, standing_sometimes: 439, standing_mostly: 600, moving: 850, physical_work: 1200 };
const EXERCISE_CALORIES: Record<string, number> = { none: 0, '1-2': 150, '3-4': 300, '5-6': 450, daily: 700 };
const ACTIVITY_TO_EXERCISE: Record<string, string> = { sedentary: 'none', light: '1-2', moderate: '3-4', active: '5-6', very_active: 'daily' };
const MEAL_COLORS: Record<string, string> = { breakfast: '#7C5CFC', lunch: '#3B82F6', dinner: '#10B981', snack: '#F59E0B' };

export default function TrackerScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language, energyUnit, volumeUnit } = useSettingsStore();
  const { profile } = useAuthStore();
  const { width } = useWindowDimensions();
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const fetchLogs = useNutritionStore(s => s.fetchLogs);
  const fetchHistory = useNutritionStore(s => s.fetchHistory);
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const setDate = useNutritionStore(s => s.setDate);
  const streakDays = useNutritionStore(s => s.streakDays);
  const addWater = useNutritionStore(s => s.addWater);
  const dailyWater = useNutritionStore(s => s.dailyWater);
  const dailySteps = useNutritionStore(s => s.dailySteps);
  const setSteps = useNutritionStore(s => s.setSteps);
  const addSteps = useNutritionStore(s => s.addSteps);
  const dailyNeat = useNutritionStore(s => s.dailyNeat);
  const dailyExercise = useNutritionStore(s => s.dailyExercise);
  const activityLogs = useNutritionStore(s => s.activityLogs);
  const addActivityLog = useNutritionStore(s => s.addActivityLog);
  const removeActivityLog = useNutritionStore(s => s.removeActivityLog);
  const addExtraSnack = useNutritionStore(s => s.addExtraSnack);
  const removeExtraSnack = useNutritionStore(s => s.removeExtraSnack);
  const removeLog = useNutritionStore(s => s.removeLog);
  const setLogs = useNutritionStore(s => s.setLogs);
  const setActivityLogs = useNutritionStore(s => s.setActivityLogs);
  const totalUnreadCount = useSocialStore(s => s.totalUnreadCount);
  const friends = useSocialStore(s => s.friends);

  // Derived
  const macros = { protein: profile?.macros?.protein || 150, carbs: profile?.macros?.carbs || 250, fat: profile?.macros?.fat || 65 };
  const { calories: rawCalories, protein, carbs, fat, sugar, fiber, sodium, iron, calcium, saturatedFat } = useNutritionStore(selectDailyTotals);
  const calories = Math.round(convertEnergy(rawCalories, 'kcal', energyUnit));
  const target = Math.round(convertEnergy(profile?.targetCalories || 2000, 'kcal', energyUnit));
  const energyLabel = energyUnit.toUpperCase();
  const steps = dailySteps[selectedDate] || 0;
  const rawWater = dailyWater[selectedDate] || 0;
  const currentNeat = dailyNeat[selectedDate] || profile?.lifestyle || 'standing_sometimes';
  const currentExercise = dailyExercise[selectedDate] || ACTIVITY_TO_EXERCISE[profile?.activityLevel || 'moderate'] || '3-4';
  const dayActivities = useMemo(() => activityLogs.filter(a => a.loggedAt.startsWith(selectedDate)), [activityLogs, selectedDate]);
  const baselineRaw = (NEAT_CALORIES[currentNeat] || 0) + (EXERCISE_CALORIES[currentExercise] || 0);
  const activitiesRaw = dayActivities.reduce((acc, a) => acc + a.calories, 0);
  const totalBurned = Math.round(convertEnergy(baselineRaw + activitiesRaw, 'kcal', energyUnit));
  const pendingRequestsCount = useMemo(() => !profile?.id ? 0 : friends.filter(f => f.status === 'pending' && f.user_id_2 === profile.id).length, [friends, profile?.id]);
  const socialNotificationCount = totalUnreadCount + pendingRequestsCount;

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
  const pedometerTotal = historicalSteps + liveSteps;
  const currentSteps = Math.max(steps, pedometerTotal);
  useEffect(() => { if (pedometerTotal > steps) setSteps(pedometerTotal); }, [pedometerTotal]);

  // Alert
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; confirmText?: string; cancelText?: string; onConfirm: (v?: string) => void; onCancel?: () => void; actions?: any[]; showInput?: boolean; initialInputValue?: string; keyboardType?: any }>({
    visible: false, type: 'info', title: '', message: '', onConfirm: () => {}
  });
  const showAlert = (type: AlertType, title: string, message: string, onConfirm: (v?: string) => void = () => {}, onCancel: () => void = () => {}, confirmText?: string, cancelText?: string, actions?: any[], showInput?: boolean, initialInputValue?: string, keyboardType?: any) => {
    setAlert({
      visible: true, type, title, message, showInput, initialInputValue, keyboardType,
      onConfirm: (v?: string) => { onConfirm(v); setAlert(s => ({ ...s, visible: false })); },
      onCancel: () => { onCancel(); setAlert(s => ({ ...s, visible: false })); },
      confirmText, cancelText,
      actions: actions?.map(a => ({ ...a, onPress: () => { a.onPress(); setAlert(s => ({ ...s, visible: false })); } }))
    });
  };

  // Selection state
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
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
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setIsFetching(true);
      try { await fetchLogs(profile.id, selectedDate); } catch { showAlert('error', t('common.error'), t('tracker.loadFailed') || 'Could not load data'); }
      finally { setIsFetching(false); }
    })();
  }, [profile?.id, selectedDate]);

  // Handlers
  const handleAddMeal = (meal: string) => router.push({ pathname: '/modals/scan', params: { initialMeal: meal, date: selectedDate } } as any);
  const handleAddMissingFood = (meal: string) => router.push({ pathname: '/modals/scan', params: { initialMeal: meal, date: selectedDate, initialMode: 'photo' } } as any);
  const changeDate = (dir: 1 | -1) => { setDate(addDays(selectedDate, dir)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };

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
      { label: t('tracker.sugar'), current: sugar, target: 50, color: '#8B5CF6' },
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
        return { value: Math.round(cals), color: MEAL_COLORS[meal], marginBottom: 2 };
      }).filter(s => s.value > 0);
      const d = new Date(date + 'T12:00:00');
      return { stacks: stacks.length > 0 ? stacks : [{ value: 0, color: 'transparent' }], label: d.toLocaleDateString(language, { weekday: 'narrow' }), labelTextStyle: { color: colors.textSecondary, fontSize: 10 } };
    });
  }, [todayLogs, language, colors]);

  // Swipe
  const swipeX = useSharedValue(0);
  const swipeOpacity = useSharedValue(1);
  const gesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => { swipeX.value = e.translationX * 0.18; })
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 60) {
        const dir = e.velocityX > 0 ? -1 : 1;
        swipeOpacity.value = withTiming(0.5, { duration: 80 }, () => { runOnJS(changeDate)(dir as 1 | -1); swipeOpacity.value = withSpring(1, { damping: 14, stiffness: 200 }); });
      }
      swipeX.value = withSpring(0, { damping: 18, stiffness: 250 });
    });
  const swipeAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: swipeX.value }], opacity: swipeOpacity.value }));

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={{ flex: 1 }}>
          <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} confirmText={alert.confirmText} cancelText={alert.cancelText} onConfirm={alert.onConfirm} onCancel={alert.onCancel} actions={alert.actions} showInput={alert.showInput} initialInputValue={alert.initialInputValue} keyboardType={alert.keyboardType} />

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={[s.avatarWrap, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => router.push('/(tabs)/profile' as any)} activeOpacity={0.7}>
              {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={s.avatarImage} /> : (
                <View style={[s.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.avatarText, { color: colors.primary }]}>{profile?.name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <TouchableOpacity onPress={() => router.push('/modals/calendar' as any)}><FireStreakBadge streakDays={streakDays} /></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/modals/calendar' as any)}>
                <Text style={[s.dateText, { color: colors.textPrimary }]}>🗓️ {selectedDate === getLocalDateString() ? t('tracker.today') : new Date(selectedDate + 'T12:00:00').toLocaleDateString(t('common.locale'), { month: 'short', day: 'numeric' })} ▾</Text>
              </TouchableOpacity>
            </View>
            <SocialBadge badgeCount={socialNotificationCount} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/social' as any); }} colors={colors} />
          </View>

          <Animated.View style={[{ flex: 1 }, swipeAnimStyle]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
              <GestureDetector gesture={gesture}>
                <DateNavigator selectedDate={selectedDate} onDateChange={setDate} colors={colors} t={t} language={language} />
              </GestureDetector>

              {/* Widgets Carousel */}
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={s.carousel} contentContainerStyle={s.carouselContent} onMomentumScrollEnd={(e) => setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}>
                <View style={{ width: width - 32 }}>
                  <GlassCard showStripe accentColor={colors.primary} noPadding style={{ borderRadius: 24 }}>
                    <View style={[s.card, { borderWidth: 0, paddingVertical: 24 }]}>
                      <CalorieArc consumed={calories} target={target} energyLabel={energyLabel} colors={colors} t={t} />
                      <MacroBars macros={{ protein, carbs, fat }} targets={macros} colors={colors} t={t} />
                    </View>
                  </GlassCard>
                </View>
                <View style={{ width: width - 32 }}>
                  <GlassCard noPadding>
                    <View style={[s.card, { borderWidth: 0 }]}>
                      <View style={s.cardHeader}><Text style={[s.cardTitle, { color: colors.textPrimary }]}>{t('tracker.otherNutrients')}</Text></View>
                      {[{ label: t('tracker.sugar'), val: `${Math.round(sugar)} g` }, { label: t('tracker.fiber'), val: `${Math.round(fiber)} g` }, { label: t('tracker.saturatedFat'), val: `${Math.round(saturatedFat)} g` }, { label: t('tracker.sodium'), val: `${Math.round(sodium)} mg` }, { label: t('tracker.iron'), val: `${Math.round(iron)} mg` }, { label: t('tracker.calcium', 'Calcio'), val: `${Math.round(calcium)} mg` }].map(nut => (
                        <View key={nut.label} style={[s.nutrientRow, { borderBottomColor: colors.border }]}>
                          <Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>🔹 {nut.label}</Text>
                          <Text style={{ color: colors.textMuted }}>{profile?.isPro ? nut.val : '🔒'}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </View>
                <View style={{ width: width - 32 }}>
                  <GlassCard noPadding showStripe accentColor={colors.carbs}>
                    <View style={[s.card, { borderWidth: 0, paddingBottom: 10 }]}>
                      <View style={s.cardHeader}>
                        <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{t('dashboard.weeklyAvg', 'Resumen Semanal')}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{energyLabel}</Text>
                      </View>
                      <View style={{ alignItems: 'center', marginTop: 10 }}>
                        <BarChart stackData={stackData} barWidth={22} spacing={18} roundedTop roundedBottom hideRules xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }} noOfSections={4} maxValue={Number.isFinite(target) && target > 0 ? target * 1.2 : 2400} isAnimated animationDuration={800} />
                      </View>
                      <View style={s.chartLegend}>{MEALS.map(m => (
                        <View key={m} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: MEAL_COLORS[m] }]} />
                          <Text style={[s.legendText, { color: colors.textSecondary }]}>{t(`tracker.${m}`)}</Text>
                        </View>
                      ))}</View>
                    </View>
                  </GlassCard>
                </View>
              </ScrollView>

              <View style={s.dotsRow}>{[0, 1, 2].map(i => <View key={i} style={[s.dotIndicator, { backgroundColor: carouselIndex === i ? colors.primary : colors.border }]} />)}</View>

              {isFetching && <View style={{ marginVertical: 20, alignItems: 'center' }}><ActivityIndicator color={colors.primary} size="small" /><Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>{t('common.loading')}</Text></View>}

              {!isFetching && (
                <MealCarousel
                  meals={grouped} allMeals={allMeals} selectedLogIds={selectedLogIds}
                  onToggleSelect={handleToggleSelect} onDeselectAll={() => setSelectedLogIds(new Set())} onFoodPress={handleFoodPress} onFoodLongPress={handleFoodLongPress}
                  onDeleteSelected={handleDeleteSelected} onEditSelected={handleEditSelected}
                  onAddMeal={handleAddMeal} onAddMissingFood={handleAddMissingFood}
                  onRemoveExtraSnack={removeExtraSnack} onAddExtraSnack={addExtraSnack}
                  extraSnacksCount={profile?.extraSnacks || 0}
                  colors={colors} t={t} language={language} energyUnit={energyUnit}
                />
              )}

              {/* Activity */}
              <GlassCard noPadding showStripe accentColor={colors.accent}>
                <View style={[s.card, { borderWidth: 0 }]}>
                  <View style={s.cardHeader}><Text style={[s.cardTitle, { color: colors.textPrimary }]}>{t('tracker.activity')}</Text></View>
                  <View style={s.activitySummary}><Text style={{ fontSize: 20 }}>🔥</Text><Text style={[s.activityTotal, { color: colors.textPrimary }]}>{totalBurned} {energyLabel}</Text></View>
                  <TouchableOpacity style={[s.nutrientRow, { borderBottomColor: colors.primary + '40' }]} onPress={() => router.push('/modals/select-activity-level' as any)}>
                    <View style={[s.nutrientRowLeft, { flex: 1, paddingRight: 8 }]}>
                      <Text style={{ fontSize: 24 }}>🔥</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>{t('tracker.activity')}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={2}>{t(currentExercise === 'none' ? 'onboarding.activitySedentary' : currentExercise === '1-2' ? 'onboarding.activityLight' : currentExercise === '3-4' ? 'onboarding.activityModerate' : currentExercise === '5-6' ? 'onboarding.activityActive' : 'onboarding.activityVeryActive')}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}><Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>{Math.round(convertEnergy(EXERCISE_CALORIES[currentExercise] || 0, 'kcal', energyUnit))} {energyLabel}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('dashboard.weeklyAvg')}</Text></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.nutrientRow, { borderBottomColor: colors.primary + '40' }]} onPress={() => router.push('/modals/select-neat' as any)}>
                    <View style={[s.nutrientRowLeft, { flex: 1, paddingRight: 8 }]}>
                      <Text style={{ fontSize: 24 }}>🏃</Text>
                      <View style={{ flex: 1 }}><Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>{t('tracker.lifestyle')}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={2}>{t(`neat.${currentNeat}`)}</Text></View>
                    </View>
                    <Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>{Math.round(convertEnergy(NEAT_CALORIES[currentNeat] || 0, 'kcal', energyUnit))} {energyLabel}</Text>
                  </TouchableOpacity>
                  {dayActivities.map(act => (
                    <TouchableOpacity key={act.id} style={[s.nutrientRow, { borderBottomColor: colors.primary + '40' }]} onPress={() => handleActivityPress(act)}>
                      <View style={[s.nutrientRowLeft, { flex: 1, paddingRight: 8 }]}>
                        <Text style={{ fontSize: 24 }}>{act.icon}</Text>
                        <View style={{ flex: 1 }}><Text style={[s.nutrientLabel, { color: colors.textPrimary }]} numberOfLines={2}>{act.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{act.duration} min</Text></View>
                      </View>
                      <Text style={[s.nutrientLabel, { color: colors.textPrimary }]}>{Math.round(convertEnergy(act.calories, 'kcal', energyUnit))} {energyLabel}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.surfaceAlt + '88' }]} onPress={() => router.push('/modals/add-activity' as any)}><Text style={[s.addBtnText, { color: colors.textPrimary }]}>+</Text></TouchableOpacity>
                </View>
              </GlassCard>

              {/* Radar */}
              <GlassCard noPadding showStripe accentColor={colors.primary}>
                <View style={[s.card, { borderWidth: 0, overflow: 'hidden' }]}>
                  <View style={[s.cardHeader, { marginBottom: 0 }]}>
                    <View><Text style={[s.cardTitle, { color: colors.textPrimary }]}>⬡ {t('tracker.macroBalance', 'Macro Balance')}</Text><Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{t('tracker.vsGoals', 'vs. daily goals')}</Text></View>
                    <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '40' }}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{t('tracker.today').toUpperCase()}</Text></View>
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
                  <View style={{ gap: 8 }}>{radarData.map(d => { const pctClamped = Math.min(d.pct * 100, 100); return (
                    <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', width: 56, textTransform: 'uppercase', letterSpacing: 0.3 }}>{d.label}</Text>
                      <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border + '50', overflow: 'hidden' }}><View style={[{ height: '100%', borderRadius: 3, backgroundColor: d.color, width: `${pctClamped}%` }]} /></View>
                      <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700', minWidth: 70, textAlign: 'right' }}><Text style={{ color: d.color }}>{Math.round(d.current)}</Text><Text style={{ color: colors.textMuted, fontWeight: '400' }}>/{d.target}g</Text></Text>
                    </View>
                  );})}</View>
                </View>
              </GlassCard>

              <ConsistencyHeatmap heatmapDays={heatmapDays} isPro={!!profile?.isPro} onUpgrade={() => router.push('/modals/paywall')} colors={colors} t={t} />
              <WaterTracker waterMl={rawWater} onAddWater={addWater} onCustomWaterPress={handleCustomWater} colors={colors} t={t} volumeUnit={volumeUnit} />
              <StepsWidget steps={currentSteps} onAddSteps={addSteps} colors={colors} t={t} />
            </ScrollView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: 'bold' },
  headerCenter: { flexDirection: 'row', gap: 16 },
  streakText: { fontSize: 16, fontWeight: '600' },
  dateText: { fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 16 },
  carousel: { marginHorizontal: -16, minHeight: 340 },
  carouselContent: { paddingHorizontal: 16, gap: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  dotIndicator: { width: 8, height: 8, borderRadius: 4 },
  card: { borderRadius: Radius.xl, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  nutrientLabel: { fontSize: 15 },
  nutrientRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activitySummary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 16 },
  activityTotal: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { borderRadius: Radius.full, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  addBtnText: { fontSize: 24, lineHeight: 28 },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600' },
});
