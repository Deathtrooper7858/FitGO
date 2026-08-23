import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Vibration, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Download, Sparkles, Utensils, Dumbbell, Activity, ShoppingCart, AlertTriangle, ChevronDown, ChevronUp, X, ShieldAlert, Plus } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { useNutritionStore, selectDailyTotals } from '../../../store/nutritionStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { usePlannerStore } from '../../../store/plannerStore';

import { useWorkoutHistoryStore } from '../../../store/workoutHistoryStore';
import { generateMealPlan, generateWorkoutPlan, generateDailyMealPlan, generateDailyWorkoutPlan, generateWeeklyAnalysis, generateMealSwap, adjustWorkoutToBodyweight } from '../../../services/groq';
import { supabase } from '../../../services/supabase';
import { useTheme } from '../../../hooks/useTheme';
import { useIsPro } from '../../../hooks/useIsPro';
import { SuccessModal } from '../../../components/SuccessModal';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { getNameStyle } from '../../../utils/styles';
import { getLocalDateString } from '../../../utils/date';
import { Spacing, Radius } from '../../../constants';
import type { PlanItem, WorkoutRoutine } from '../../../store/plannerStore';
import DaySelector from '../../../components/planner/DaySelector';
import MealPlanView from '../../../components/planner/MealPlanView';
import WorkoutPlanView from '../../../components/planner/WorkoutPlanView';
import ShoppingListModal from '../../../components/planner/ShoppingListModal';
import GenerateConfirmModal from '../../../components/planner/GenerateConfirmModal';
import AILoadingOverlay from '../../../components/planner/AILoadingOverlay';
import ResetWarningModal from '../../../components/planner/ResetWarningModal';
import { generateNutritionHTML, generateWorkoutHTML } from '../../../components/planner/pdfHelpers';


const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
type PlannerMode = 'nutrition' | 'workouts';

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSunday(date: Date = new Date()) { return date.getDay() === 0; }

function msUntilSundayReset(): number {
  const now = new Date();
  const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 0, 0);
  return nextSunday.getTime() - now.getTime();
}

export default function PlannerScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language, premiumColor } = useSettingsStore();
  const [mode, setMode] = useState<PlannerMode>('nutrition');
  const jsDay = new Date().getDay();
  const [activeDay, setActiveDay] = useState(jsDay === 0 ? 'Sun' : DAYS[jsDay - 1]);
  const [energyMode, setEnergyMode] = useState<'low' | 'normal' | 'beast'>('normal');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAdjustingBW, setIsAdjustingBW] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exerciseMetrics, setExerciseMetrics] = useState<Record<number, { weight: string; rpe: string }>>({});
  const [isHomeWorkout, setIsHomeWorkout] = useState(false);
  const [homeEquipment, setHomeEquipment] = useState('');
  const [expandedEqCategory, setExpandedEqCategory] = useState<string | null>(null);
  const [customWeightInput, setCustomWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weightType, setWeightType] = useState<'Mancuernas' | 'Kettlebell'>('Mancuernas');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    const d = new Date().getDay();
    setActiveDay(d === 0 ? 'Sun' : DAYS[d - 1]);
  }, []));

  const { mealPlans, workoutPlans, weeklyAnalysis: analysis, weekStart, warning, setMealPlans, setWorkoutPlans, setWeeklyAnalysis: setAnalysis, clearPlans, clearMealPlans, clearWorkoutPlans } = usePlannerStore();
  const { addWorkout, hasCompletedWorkoutToday } = useWorkoutHistoryStore();
  const { profile } = useAuthStore();
  const streakDays = useNutritionStore(s => s.streakDays);
  const dailyWater = useNutritionStore(s => s.dailyWater);
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const addWater = useNutritionStore(s => s.addWater);

  const isProActually = useIsPro();
  const isValidHex = !!(premiumColor && premiumColor.startsWith('#'));
  const safePremiumColor = isValidHex ? premiumColor! : '#7C5CFC';
  const isPremiumCustom = !!(isProActually && isValidHex);

  // Rest timer tick
  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => setRestTimer(p => p! - 1), 1000);
    } else if (restTimer === 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);


  useEffect(() => {
    (async () => {
      if (!profile?.id) { setInitialLoading(false); return; }
      const currentWeekStart = getStartOfWeek(new Date());
      try {
        // Always clear if the cached plan belongs to a different user
        if (usePlannerStore.getState().userId !== profile.id) {
          clearPlans();
        }
        const { data: mData } = await supabase.from('meal_plans').select('*, meal_plan_items(*)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (mData && mData.week_start === currentWeekStart && mData.meal_plan_items?.length > 0) {
          const grouped: Record<string, PlanItem[]> = {};
          mData.meal_plan_items.forEach((item: any) => {
            if (!grouped[item.day_of_week]) grouped[item.day_of_week] = [];
            grouped[item.day_of_week].push({ meal: item.meal, name: item.name, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat });
          });
          setMealPlans(grouped, currentWeekStart, undefined, profile.id);
        } else {
          // No Supabase data for this user this week — always clear to prevent
          // showing stale/shared data (e.g. after a fresh Pro purchase)
          clearMealPlans();
        }

        const { data: wData } = await supabase.from('workout_plans').select('*, workout_plan_items(*)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (wData && wData.week_start === currentWeekStart && wData.workout_plan_items?.length > 0) {
          const grouped: Record<string, WorkoutRoutine> = {};
          wData.workout_plan_items.forEach((item: any) => { grouped[item.day_of_week] = { name: item.routine_name, exercises: item.exercises || [] }; });
          setWorkoutPlans(grouped, currentWeekStart, undefined, profile.id);
        } else {
          // No Supabase data for this user this week — always clear
          clearWorkoutPlans();
        }
      } catch (_err) { console.error('[Planner] Load error:', _err); }
      finally { setInitialLoading(false); }
    })();
  }, [profile?.id]);

  // Sunday 23:59 auto-reset

  useEffect(() => {
    const scheduleWeeklyReset = () => {
      const msToReset = msUntilSundayReset();
      if (isSunday()) {
        const msToWarning = msToReset - 3600000;
        if (msToWarning > 0) resetWarningTimerRef.current = setTimeout(() => setShowResetWarning(true), msToWarning);
        else if (msToReset > 0) setShowResetWarning(true);
      }
      resetTimerRef.current = setTimeout(() => {
        clearPlans();
        supabase.from('meal_plans').delete().eq('user_id', profile?.id ?? '').then();
        supabase.from('workout_plans').delete().eq('user_id', profile?.id ?? '').then();
        scheduleWeeklyReset();
      }, msToReset);
    };
    scheduleWeeklyReset();
    return () => { if (resetTimerRef.current) clearTimeout(resetTimerRef.current); if (resetWarningTimerRef.current) clearTimeout(resetWarningTimerRef.current); };
  }, [profile?.id]);

  // Alert helper
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; onConfirm: () => void }>({ visible: false, type: 'info', title: '', message: '', onConfirm: () => { } });
  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => setAlert({ visible: true, type, title, message, onConfirm: () => { onConfirm?.(); setAlert(p => ({ ...p, visible: false })); } });

  const getGoalTranslation = () => {
    if (!profile?.goal) return t('planner.weekPlan', 'Plan Semanal');
    if (profile.goal === 'gain') return t('onboarding.gainTitle', 'Ganar Músculo');
    if (profile.goal === 'lose') return t('onboarding.loseTitle', 'Perder Grasa');
    return t('onboarding.stayTitle', 'Mantener Peso');
  };

  const handleGeneratePress = () => { if (!profile) return; if (!isProActually) { router.push('/modals/paywall'); return; } setShowConfirmModal(true); };
  const handleGenerateDayPress = () => { if (!profile) return; if (!isProActually) { router.push('/modals/paywall'); return; } handleGenerateDay(activeDay); };

  const handleGenerateDay = async (day: string) => {
    if (!profile) return;
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());
    try {
      if (mode === 'nutrition') {
        const parsedPlan = await generateDailyMealPlan({ targetCalories: profile.targetCalories || 2000, macros: profile.macros || { protein: 150, carbs: 250, fat: 65 }, goal: profile.goal || 'maintain', availableFoods: profile.availableFoods, preferences: profile.preferences, age: profile.age, weight: profile.weight, height: profile.height, sex: profile.sex, activityLevel: profile.activityLevel, dietaryRestrictions: profile.dietaryRestrictions, medicalConditions: profile.medicalConditions, medicationsSupplements: profile.medicationsSupplements, tdee: profile.tdee }, language, day);
        const newPlans = { ...mealPlans, [day]: parsedPlan[day] || [] };
        setMealPlans(newPlans, currentWeekStart, undefined, profile.id);
        const { data: existing } = await supabase.from('meal_plans').select('id').eq('user_id', profile.id).eq('week_start', currentWeekStart).maybeSingle();
        let planId = existing?.id;
        if (!planId) { const { data: inserted } = await supabase.from('meal_plans').insert({ user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart }).select().single(); planId = inserted?.id; }
        if (planId) { await supabase.from('meal_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day); const itemsToInsert = (parsedPlan[day] || []).map((m: any) => ({ plan_id: planId, day_of_week: day, meal: m.meal, name: m.name, calories: m.calories, protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0 })); if (itemsToInsert.length > 0) await supabase.from('meal_plan_items').insert(itemsToInsert); }
      } else {
        const parsedPlan = await generateDailyWorkoutPlan({ goal: profile.goal || 'maintain', activityLevel: profile.activityLevel, age: profile.age, weight: profile.weight, height: profile.height, sex: profile.sex, medicalConditions: profile.medicalConditions, medicationsSupplements: profile.medicationsSupplements, homeWorkout: isHomeWorkout, homeEquipment }, language, day);
        const newPlans = { ...workoutPlans, [day]: parsedPlan[day] || { name: 'Descanso', exercises: [] } };
        setWorkoutPlans(newPlans, currentWeekStart, undefined, profile.id);
        const { data: existing } = await supabase.from('workout_plans').select('id').eq('user_id', profile.id).eq('week_start', currentWeekStart).maybeSingle();
        let planId = existing?.id;
        if (!planId) { const { data: inserted } = await supabase.from('workout_plans').insert({ user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart }).select().single(); planId = inserted?.id; }
        if (planId) { await supabase.from('workout_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day); await supabase.from('workout_plan_items').insert([{ plan_id: planId, day_of_week: day, routine_name: newPlans[day].name || t('planner.restDay', 'Rest Day'), exercises: newPlans[day].exercises || [] }]); }
      }
      setShowSuccess(true);
    } catch (err: any) { showAlert('error', t('common.error'), err?.message ?? t('planner.analysisFailedSub')); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (options?: { intensityMode: 'standard' | 'express' | 'heavy' | 'recovery', focusSymmetry: boolean }) => {
    if (!profile) return;
    setShowConfirmModal(false);
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());
    try {
      if (mode === 'nutrition') {
        clearMealPlans();
        const parsedPlan = await generateMealPlan({ targetCalories: profile.targetCalories || 2000, macros: profile.macros || { protein: 150, carbs: 250, fat: 65 }, goal: profile.goal || 'maintain', availableFoods: profile.availableFoods, preferences: profile.preferences, age: profile.age, weight: profile.weight, height: profile.height, sex: profile.sex, activityLevel: profile.activityLevel, dietaryRestrictions: profile.dietaryRestrictions, medicalConditions: profile.medicalConditions, medicationsSupplements: profile.medicationsSupplements, tdee: profile.tdee }, language);
        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setMealPlans(plansOnly, currentWeekStart, planWarning, profile.id);
        await supabase.from('meal_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase.from('meal_plans').insert({ user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart }).select().single();
        if (planData) { const items = DAYS.flatMap(d => ((plansOnly as Record<string, any[]>)[d] || []).map((m: any) => ({ plan_id: planData.id, day_of_week: d, meal: m.meal, name: m.name, calories: m.calories, protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0 }))); if (items.length) await supabase.from('meal_plan_items').insert(items); }
      } else {
        clearWorkoutPlans();
        let focusMuscles: string[] = [];
        if (options?.focusSymmetry) {
          const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile.id);
          const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
          const counts: Record<string, number> = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };
          workouts.filter(w => w.date >= cutoff.toISOString().split('T')[0]).forEach(w => w.exercises.forEach(ex => { const n = (ex.englishName || ex.name || '').toLowerCase(); if (n.includes('press') && !n.includes('leg') && !n.includes('shoulder')) counts.chest++; if (n.includes('row') || n.includes('pull')) counts.back++; if (n.includes('squat') || n.includes('leg')) counts.legs++; if (n.includes('shoulder') || n.includes('lateral')) counts.shoulders++; if (n.includes('curl') || n.includes('tricep') || n.includes('extension')) counts.arms++; if (n.includes('crunch') || n.includes('plank') || n.includes('abs')) counts.core++; }));
          focusMuscles = Object.entries(counts).sort((a, b) => a[1] - b[1]).slice(0, 2).map(x => x[0]);
        }
        const parsedPlan = await generateWorkoutPlan({ goal: profile.goal, activityLevel: profile.activityLevel, age: profile.age, weight: profile.weight, height: profile.height, sex: profile.sex, medicalConditions: profile.medicalConditions, medicationsSupplements: profile.medicationsSupplements, homeWorkout: isHomeWorkout, homeEquipment, intensityMode: options?.intensityMode || 'standard', focusMuscles, energyMode }, language);
        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setWorkoutPlans(plansOnly, currentWeekStart, planWarning, profile.id);
        await supabase.from('workout_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase.from('workout_plans').insert({ user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart }).select().single();
        if (planData) { await supabase.from('workout_plan_items').insert(DAYS.map(d => ({ plan_id: planData.id, day_of_week: d, routine_name: (plansOnly as Record<string, any>)[d]?.name || t('planner.restDay', 'Rest Day'), exercises: (plansOnly as Record<string, any>)[d]?.exercises || [] }))); }
      }
      setShowSuccess(true);
    } catch (err: any) { showAlert('error', t('common.error'), err?.message ?? t('planner.analysisFailedSub')); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    if (!isProActually) { router.push('/modals/paywall'); return; }
    try {
      const today = getLocalDateString();
      const ws = getStartOfWeek(new Date());
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      const html = mode === 'nutrition' ? generateNutritionHTML(mealPlans, today, ws, we, language) : generateWorkoutHTML(workoutPlans, energyMode, today, ws, we, language);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `fitgo_${mode === 'nutrition' ? 'menu' : 'rutina'}_${today}.pdf` });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) { showAlert('error', t('common.error'), 'Could not generate PDF'); }
  };

  const handleWeeklyAnalysis = async () => {
    if (!isProActually) { router.push('/modals/paywall'); return; }
    setAnalyzing(true);
    try {
      const stats = useNutritionStore.getState().todayLogs ? selectDailyTotals(useNutritionStore.getState()) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const res = await generateWeeklyAnalysis({ avgCalories: stats.calories, targetCalories: profile?.targetCalories ?? 2000, avgProtein: stats.protein, avgCarbs: stats.carbs, avgFat: stats.fat, goal: profile?.goal ?? 'maintain', daysLogged: streakDays }, language);
      setAnalysis(res);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) { showAlert('error', t('planner.analysisFailed'), t('planner.analysisFailedSub')); }
    finally { setAnalyzing(false); }
  };

  // Computed values
  const meals = React.useMemo(() => mealPlans[activeDay] ?? [], [mealPlans, activeDay]);
  const totalCal = meals.reduce((a: number, m: PlanItem) => a + m.calories, 0);
  const workout = workoutPlans[activeDay];
  const getDayDate = (dayAbbr: string) => { const idx = DAYS.indexOf(dayAbbr); const d = new Date(); const monOff = d.getDay() === 0 ? -6 : 1 - d.getDay(); const m = new Date(d); m.setDate(d.getDate() + monOff); m.setDate(m.getDate() + idx); return getLocalDateString(m); };
  const activeDayDate = getDayDate(activeDay);
  const todayDate = getLocalDateString();
  const isActiveToday = activeDayDate === todayDate;
  const isFutureDay = activeDayDate > todayDate;
  const alreadyCompleted = hasCompletedWorkoutToday(activeDayDate);
  const consumedMacros = React.useMemo(() => {
    if (!isActiveToday) return { p: 0, c: 0, f: 0 };
    return todayLogs
      .filter((l: any) => l.loggedAt.startsWith(todayDate))
      .reduce((acc: { p: number; c: number; f: number }, l: any) => ({
        p: acc.p + (l.protein || 0),
        c: acc.c + (l.carbs || 0),
        f: acc.f + (l.fat || 0)
      }), { p: 0, c: 0, f: 0 });
  }, [isActiveToday, todayLogs, todayDate]);
  const plannedMacros = React.useMemo(() => meals.reduce((acc: { p: number; c: number; f: number }, m: PlanItem) => ({
    p: acc.p + (m.protein || 0),
    c: acc.c + (m.carbs || 0),
    f: acc.f + (m.fat || 0)
  }), { p: 0, c: 0, f: 0 }), [meals]);
  const waterToday = dailyWater[todayDate] || 0;
  const hasData = mode === 'nutrition' ? Object.keys(mealPlans).length > 0 : Object.keys(workoutPlans).length > 0;

  // Workout handlers
  const handleMoveExercise = async (index: number, dir: -1 | 1) => {
    if (!workout || workout.exercises.length === 0) return;
    const newEx = [...workout.exercises];
    const t2 = index + dir; if (t2 < 0 || t2 >= newEx.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    [newEx[index], newEx[t2]] = [newEx[t2], newEx[index]];
    const updated = { ...workout, exercises: newEx };
    setWorkoutPlans({ ...workoutPlans, [activeDay]: updated }, weekStart || getStartOfWeek(new Date()), warning || undefined, profile?.id);
    if (profile?.id) supabase.from('workout_plan_items').update({ exercises: newEx }).eq('user_id', profile.id).eq('day_of_week', activeDay).then();
  };

  const handleCompleteWorkout = () => {
    if (!workout || workout.exercises.length === 0 || alreadyCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addWorkout({ date: activeDayDate, routineName: workout.name, exercises: workout.exercises.map((ex: any, i: number) => ({ name: ex.name, englishName: ex.englishName, sets: ex.sets, reps: ex.reps, weight: exerciseMetrics[i]?.weight, rpe: exerciseMetrics[i]?.rpe })) });

  };

  const getPreviousRPE = (exerciseName: string) => {
    const wkt = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile?.id);
    const sorted = [...wkt].sort((a, b) => b.completedAt - a.completedAt);
    for (const w of sorted) for (const ex of w.exercises) if ((ex.englishName || ex.name) === exerciseName && ex.rpe) return parseInt(ex.rpe);
    return null;
  };

  const handleAdjustWorkout = async (type: 'up' | 'down' | 'bodyweight') => {
    if (!workout || workout.exercises.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type !== 'bodyweight') {
      const newEx = workout.exercises.map((ex: any) => ({ ...ex, sets: type === 'up' ? ex.sets + 1 : Math.max(1, ex.sets - 1) }));
      const updated = { ...workout, exercises: newEx };
      setWorkoutPlans({ ...workoutPlans, [activeDay]: updated }, weekStart || getStartOfWeek(new Date()), warning || undefined, profile?.id);
      if (profile?.id) supabase.from('workout_plan_items').update({ exercises: newEx }).eq('user_id', profile.id).eq('day_of_week', activeDay).then();
      return;
    }
    setIsAdjustingBW(true);
    try {
      const adjusted = await adjustWorkoutToBodyweight(workout.name, workout.exercises, language);
      setWorkoutPlans({ ...workoutPlans, [activeDay]: { ...workout, exercises: adjusted.exercises, name: adjusted.name } }, weekStart || getStartOfWeek(new Date()), warning || undefined, profile?.id);
      if (profile?.id) supabase.from('workout_plan_items').update({ exercises: adjusted.exercises, routine_name: adjusted.name }).eq('user_id', profile.id).eq('day_of_week', activeDay).then();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) { showAlert('error', t('common.error'), t('planner.adjustFailed')); }
    finally { setIsAdjustingBW(false); }
  };

  const handleSwapMeal = async (day: string, index: number, current: PlanItem) => {
    const newMeal = await generateMealSwap(current.name, current.calories, current.protein || 0, current.carbs || 0, current.fat || 0, profile, language);
    if (!newMeal?.name || typeof newMeal.name !== 'string' || newMeal.name.trim() === '') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    usePlannerStore.getState().swapMeal(day, index, { meal: current.meal, name: newMeal.name.trim(), calories: newMeal.calories || current.calories, protein: newMeal.protein ?? current.protein, carbs: newMeal.carbs ?? current.carbs, fat: newMeal.fat ?? current.fat });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleConsumeMeal = (m: PlanItem) => {
    Haptics.selectionAsync();
    useNutritionStore.getState().addLog({ id: '', foodItem: { id: '', name: m.name, calories: m.calories, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0, source: 'custom', sugar: 0, fiber: 0, sodium: 0, iron: 0, calcium: 0, saturatedFat: 0, transFat: 0 }, grams: 100, meal: m.meal, loggedAt: new Date().toISOString(), calories: m.calories, protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0 });
  };

  const handleToggleEquipment = (item: string) => {
    const arr = homeEquipment.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    setHomeEquipment(arr.includes(item) ? arr.filter((i: string) => i !== item).join(', ') : [...arr, item].join(', '));
  };

  const handleAddCustomWeight = () => {
    if (!customWeightInput.trim() || isNaN(Number(customWeightInput.trim().replace(',', '.')))) return;
    handleToggleEquipment(`${weightType} de ${customWeightInput.trim()}${weightUnit}`);
    setCustomWeightInput('');
  };

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={[s.safe, { backgroundColor: 'transparent' }]}>
        <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onConfirm={alert.onConfirm} />
        <AILoadingOverlay visible={loading || analyzing || isAdjustingBW} mode={loading ? mode : analyzing ? 'analysis' : 'bodyweight'} />
        <GenerateConfirmModal visible={showConfirmModal} onConfirm={handleGenerate} onChangeFoods={() => { setShowConfirmModal(false); router.push('/modals/food-selection'); }} onCancel={() => setShowConfirmModal(false)} mode={mode} availableFoods={profile?.availableFoods} targetCalories={profile?.targetCalories} isHomeWorkout={isHomeWorkout} homeEquipment={homeEquipment} profile={profile} premiumColor={safePremiumColor} isPremiumCustom={isPremiumCustom} />
        <ResetWarningModal visible={showResetWarning} onDismiss={() => setShowResetWarning(false)} />
        <ShoppingListModal visible={showShoppingList} onClose={() => setShowShoppingList(false)} mealPlans={mealPlans} language={language} />

        {restTimer !== null && (
          <TouchableOpacity style={[s.floatingTimer, { backgroundColor: colors.surface }]} activeOpacity={0.8} onPress={() => setRestTimer(null)}>
            <Activity size={24} color={colors.primary} />
            <View style={{ minWidth: 60 }}><Text style={[s.timerTitle, { color: colors.textPrimary }]}>Descanso</Text><Text style={[s.timerValue, { color: colors.primary }]}>{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</Text></View>
            <X size={20} color={colors.textMuted} style={{ marginLeft: 10 }} />

          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.textPrimary, marginBottom: 12 }]}>{t('planner.title')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={s.headerTextWrap}>
                {profile?.name && <Text style={[s.subtitle, { color: colors.primary, fontWeight: '700', fontSize: 16, marginBottom: 2 }, getNameStyle(profile?.nameColor)]}>{t('common.greeting', 'Hola')}, {profile.name}!</Text>}
                <Text style={[s.subtitle, { color: colors.textSecondary }]}>{profile?.goal ? `${t('planner.planFor', 'Plan para:')} ${getGoalTranslation()}` : t('planner.weekPlan')}</Text>
              </View>
              <TouchableOpacity style={[s.genBtn, { shadowColor: safePremiumColor }]} activeOpacity={0.8} onPress={handleGeneratePress} disabled={loading}>
                <LinearGradient colors={mode === 'workouts' ? (energyMode === 'low' ? ['#06B6D4', '#0891B2'] : energyMode === 'beast' ? ['#EF4444', '#B91C1C'] : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)) : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)} style={s.genGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Sparkles size={16} color="#fff" /><Text style={s.genText}>{t('planner.generateWeekly', 'Generar Plan Semanal')}</Text></View>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.toggleContainer}>
            <View style={[s.tabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              {(['nutrition', 'workouts'] as PlannerMode[]).map(m => { const isA = mode === m; return (<TouchableOpacity key={m} style={[s.tab, isA && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={() => setMode(m)} activeOpacity={0.8}><View style={s.tabContent}>{m === 'nutrition' ? <Utensils size={16} color={isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} /> : <Dumbbell size={16} color={isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} />}<Text style={[s.tabText, { color: isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textSecondary }]}>{m === 'nutrition' ? t('planner.nutritionTab') : t('planner.workoutsTab')}</Text></View></TouchableOpacity>) })}
            </View>
          </View>

          <DaySelector active={activeDay} onSelect={setActiveDay} isPremiumCustom={isPremiumCustom} premiumColor={safePremiumColor} />

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity style={[s.genBtn, { width: '100%', marginBottom: 12, shadowColor: safePremiumColor }]} activeOpacity={0.8} onPress={handleGenerateDayPress} disabled={loading}>
              <LinearGradient colors={mode === 'workouts' ? (energyMode === 'low' ? ['#06B6D4', '#0891B2'] : energyMode === 'beast' ? ['#EF4444', '#B91C1C'] : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)) : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)} style={[s.genGrad, { justifyContent: 'center', paddingVertical: 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Sparkles size={16} color="#fff" /><Text style={s.genText}>{t('planner.generateShort')} {t(`planner.${activeDay.toLowerCase()}`)}</Text></View>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {mode === 'workouts' && (
            <View style={{ paddingHorizontal: 16, marginBottom: 20, marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>{t('planner.howFeelToday', 'How do you feel today?')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ key: 'low', lbl: t('planner.energyLow', 'Exhausted'), emoji: '🔋', color: '#06B6D4' }, { key: 'normal', lbl: t('planner.energyNormal', 'Normal'), emoji: '⚡', color: colors.primary }, { key: 'beast', lbl: t('planner.energyBeast', 'Beast'), emoji: '🦍', color: '#EF4444' }].map(e => {
                  const isE = energyMode === e.key;
                  return (<TouchableOpacity key={e.key} activeOpacity={0.8} onPress={() => { setEnergyMode(e.key as any); Haptics.impactAsync(e.key === 'low' ? Haptics.ImpactFeedbackStyle.Soft : e.key === 'beast' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium); }} style={{ flex: 1, paddingVertical: 10, backgroundColor: isE ? e.color + '20' : colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: isE ? e.color : colors.border, alignItems: 'center' }}><Text style={{ fontSize: 20 }}>{e.emoji}</Text><Text style={{ fontSize: 12, fontWeight: '800', color: isE ? e.color : colors.textMuted, marginTop: 4 }}>{e.lbl}</Text></TouchableOpacity>)
                })}
              </View>
            </View>
          )}

          {mode === 'workouts' && (
            <View style={{ marginBottom: Spacing.lg }}>
              <View style={[s.homeWorkoutWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginBottom: isHomeWorkout ? 12 : 0 }]}>
                <View style={{ flex: 1 }}><Text style={[s.homeWorkoutTitle, { color: colors.textPrimary }]}>{t('planner.homeWorkoutTitle', 'Entrenamiento en Casa')}</Text><Text style={[s.homeWorkoutSub, { color: colors.textSecondary }]}>{t('planner.homeWorkoutSub', 'Solo calistenia y peso corporal')}</Text></View>
                <Switch value={isHomeWorkout} onValueChange={setIsHomeWorkout} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
              </View>
              {isHomeWorkout && (
                <View style={[s.equipmentWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.equipmentTitle, { color: colors.textPrimary }]}>{t('planner.equipmentTitle', 'Implementos Adicionales')}</Text>
                  <Text style={[s.equipmentSub, { color: colors.textSecondary }]}>{t('planner.equipmentSub', '¿Qué equipo tienes disponible?')}</Text>
                  <View style={{ marginTop: 12 }}>
                    {[{ id: 'basics', title: t('planner.eqCatBasics', 'Básicos de Calistenia'), items: [t('planner.eqPullupBar', 'Barra de dominadas'), t('planner.eqParallelBars', 'Barras paralelas'), t('planner.eqGymnasticRings', 'Anillas de gimnasia'), t('planner.eqWeightedVest', 'Chaleco lastrado')] }, { id: 'bands', title: t('planner.eqCatBands', 'Bandas y Resistencia'), items: [t('planner.eqTubularBands', 'Bandas elásticas tubulares'), t('planner.eqLoopBands', 'Bandas de resistencia (loops)'), t('planner.eqTRX', 'TRX / Suspensión')] }, { id: 'accessories', title: t('planner.eqCatAccessories', 'Accesorios Adicionales'), items: [t('planner.eqMat', 'Tapete / Mat'), t('planner.eqAbWheel', 'Rueda abdominal'), t('planner.eqJumpRope', 'Cuerda para saltar'), t('planner.eqAdjustableBench', 'Banco ajustable')] }, { id: 'weights', title: t('planner.eqCatWeights', 'Pesas y Mancuernas'), items: [] }].map(cat => {
                      const isExp = expandedEqCategory === cat.id;
                      return (<View key={cat.id} style={{ marginBottom: 8, backgroundColor: colors.background, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }} onPress={() => setExpandedEqCategory(isExp ? null : cat.id)} activeOpacity={0.7}><Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{cat.title}</Text>{isExp ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}</TouchableOpacity>
                        {isExp && <View style={{ padding: 12, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.border + '50', marginTop: 4 }}>
                          {cat.id === 'weights' && <View><View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            {(['Mancuernas', 'Kettlebell'] as const).map(wt => { const isWT = weightType === wt; return (<TouchableOpacity key={wt} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: isWT ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: isWT ? colors.primary : colors.border }} onPress={() => setWeightType(wt)}><Text style={{ color: isWT ? colors.primary : colors.textMuted, fontWeight: '600', fontSize: 13 }}>{wt === 'Mancuernas' ? t('planner.eqDumbbells', 'Mancuernas') : t('planner.eqKettlebell', 'Kettlebell')}</Text></TouchableOpacity>) })}
                          </View><View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                              <TextInput style={{ flex: 1, backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }} placeholder={t('planner.weightPlaceholder', 'Ej: 5')} placeholderTextColor={colors.textMuted} keyboardType="numeric" value={customWeightInput} onChangeText={setCustomWeightInput} />
                              {['kg', 'lbs'].map(u => { const isU = weightUnit === u; return (<TouchableOpacity key={u} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: isU ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: isU ? colors.primary : colors.border, justifyContent: 'center' }} onPress={() => setWeightUnit(u as any)}><Text style={{ color: isU ? colors.primary : colors.textMuted, fontWeight: '600' }}>{u}</Text></TouchableOpacity>) })}
                              <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center' }} onPress={handleAddCustomWeight}><Plus size={16} color="#fff" /></TouchableOpacity>
                            </View></View>}
                          <View style={s.equipmentChips}>{(cat.id === 'weights' ? homeEquipment.split(',').map(s => s.trim()).filter(s => s.includes('Mancuerna') || s.includes('Kettlebell') || s.includes('Pesa')) : cat.items).map((item: string) => { const arr = homeEquipment.split(',').map(s => s.trim()); const isSel = arr.includes(item); if (cat.id === 'weights' && !isSel) return null; return (<TouchableOpacity key={item} style={[s.equipmentChip, isSel ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={() => handleToggleEquipment(item)}><Text style={[s.equipmentChipText, { color: isSel ? '#fff' : colors.textPrimary }]}>{item}</Text>{cat.id === 'weights' && <X size={12} color="#fff" style={{ marginLeft: 4 }} />}</TouchableOpacity>) })}</View>
                        </View>}
                      </View>)
                    })}
                  </View>
                  <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 4 }]}>
                    <TextInput style={[s.equipmentInput, { color: colors.textPrimary }]} placeholder={t('planner.equipmentPlaceholder', 'Opcional: Detalles adicionales...')} placeholderTextColor={colors.textMuted} value={homeEquipment} onChangeText={setHomeEquipment} multiline />
                  </View>
                </View>
              )}
            </View>
          )}

          {hasData && (
            <View style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.md }}>
              <TouchableOpacity style={[s.aiDisclaimerBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginHorizontal: 0, marginBottom: 0 }]} onPress={() => setShowWarnings(!showWarnings)} activeOpacity={0.8}>
                <View style={[s.aiDisclaimerRow, { alignItems: 'center' }]}><AlertTriangle size={18} color={warning ? colors.error : colors.warning} /><Text style={[s.aiDisclaimerTitle, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}>{t('planner.warningsTitle', 'Advertencias y Precauciones')}</Text>{showWarnings ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}</View>
              </TouchableOpacity>
              {showWarnings && <View style={{ marginTop: 8, gap: 8 }}>
                <View style={[s.aiDisclaimerBanner, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '33', marginHorizontal: 0, marginBottom: 0 }]}><View style={s.aiDisclaimerRow}><View style={[s.aiDisclaimerIcon, { backgroundColor: colors.primary + '20' }]}><ShieldAlert size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[s.aiDisclaimerTitle, { color: colors.primary }]}>{t('planner.aiDisclaimerTitle', 'Plan generado por IA')}</Text><Text style={[s.aiDisclaimerText, { color: colors.textSecondary }]}>{t('planner.aiDisclaimerText', 'Este plan es orientativo y no reemplaza el asesoramiento de un dietista o médico profesional.')}</Text></View></View></View>
                <View style={[s.aiDisclaimerBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '40', marginHorizontal: 0, marginBottom: 0 }]}><View style={s.aiDisclaimerRow}><AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} /><View style={{ flex: 1 }}><Text style={[s.aiDisclaimerTitle, { color: colors.warning }]}>{t('planner.workoutWarningTitle', 'Advertencia de Entrenamiento')}</Text><Text style={[s.aiDisclaimerText, { color: colors.textSecondary }]}>{t('planner.workoutWarningText', 'Realiza los ejercicios bajo tu propia responsabilidad.')}</Text></View></View></View>
                <View style={[s.warningBox, { backgroundColor: colors.error + '10', borderColor: colors.error + '30', marginHorizontal: 0, marginBottom: 0 }]}><View style={s.warningHeader}><Text style={{ fontSize: 18 }}>⚠️</Text><Text style={[s.warningTitle, { color: colors.error }]}>{t('common.warning', 'Advertencia')}</Text></View><Text style={[s.warningText, { color: colors.textPrimary }]}>{warning || t('planner.defaultAIWarning', 'Advertencia: soy una inteligencia artificial y no un profesional certificado...')}</Text></View>
              </View>}
            </View>
          )}

          {mode === 'nutrition' ? (
            <MealPlanView meals={meals} activeDay={activeDay} loading={loading} isProActually={isProActually} isPremiumCustom={isPremiumCustom} safePremiumColor={safePremiumColor} isActiveToday={isActiveToday} consumedMacros={consumedMacros} plannedMacros={plannedMacros} waterToday={waterToday} totalCal={totalCal} targetCalories={profile?.targetCalories ?? 2000} analysis={analysis} analyzing={analyzing} onWeeklyAnalysis={handleWeeklyAnalysis} onAddWater={() => { addWater(250); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} onSwapMeal={handleSwapMeal} onConsumeMeal={handleConsumeMeal} />
          ) : (
            <WorkoutPlanView workout={workout} activeDay={activeDay} isFutureDay={isFutureDay} isAdjustingBW={isAdjustingBW} alreadyCompleted={alreadyCompleted} exerciseMetrics={exerciseMetrics} onMoveExercise={handleMoveExercise} onCompleteWorkout={handleCompleteWorkout} onAdjustWorkout={handleAdjustWorkout} onUpdateMetric={(i, f, v) => setExerciseMetrics(p => ({ ...p, [i]: { ...p[i], [f]: v } }))} onStartRest={(s) => setRestTimer(s)} getPreviousRPE={getPreviousRPE} />
          )}

          {hasData && (
            <TouchableOpacity style={[s.fullDisclaimerBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={() => setShowDisclaimer(!showDisclaimer)} activeOpacity={0.8}>
              <View style={[s.fullDisclaimerHeader, !showDisclaimer && { marginBottom: 0 }]}><AlertTriangle size={15} color={colors.textMuted} /><Text style={[s.fullDisclaimerTitle, { color: colors.textMuted, flex: 1, marginLeft: 4 }]}>{t('planner.fullDisclaimerTitle', 'Descargo de responsabilidad')}</Text>{showDisclaimer ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}</View>
              {showDisclaimer && <Text style={[s.fullDisclaimerText, { color: colors.textMuted }]}>{t('planner.fullDisclaimerText', 'El plan generado por FitGO es producido por inteligencia artificial...')}</Text>}
            </TouchableOpacity>
          )}

          {hasData && (
            <View style={{ gap: 12, marginHorizontal: Spacing.base, marginTop: 12 }}>
              {mode === 'nutrition' && <TouchableOpacity style={[s.exportBtn, { marginHorizontal: 0, marginTop: 0 }]} onPress={() => setShowShoppingList(true)} activeOpacity={0.8}><LinearGradient colors={['#F59E0B', '#D97706']} style={s.exportGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}><ShoppingCart size={20} color="#fff" /><Text style={s.exportText}>{t('planner.shoppingListTitle', 'Lista de Compras')} 🛒</Text></LinearGradient></TouchableOpacity>}
              <TouchableOpacity style={[s.exportBtn, { marginHorizontal: 0, marginTop: 0 }]} onPress={handleExportPDF} activeOpacity={0.8}><LinearGradient colors={['#10B981', '#059669']} style={s.exportGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}><Download size={20} color="#fff" /><Text style={s.exportText}>{mode === 'nutrition' ? t('planner.exportMenu', 'Menu PDF') : 'Export PDF'}</Text></LinearGradient></TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {initialLoading && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('common.loading')}</Text></View>}
        <SuccessModal visible={showSuccess} title={t('common.success')} message={t('planner.planReady')} onClose={() => setShowSuccess(false)} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2, fontWeight: '500' },
  genBtn: { borderRadius: Radius.full, overflow: 'hidden', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  genGrad: { paddingHorizontal: 18, paddingVertical: 12 },
  genText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  toggleContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  tabs: { flexDirection: 'row', borderRadius: Radius.xl, padding: 4, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabText: { fontSize: 14, fontWeight: '700' },
  homeWorkoutWrap: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, marginHorizontal: Spacing.base, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  homeWorkoutTitle: { fontSize: 16, fontWeight: '800' },
  homeWorkoutSub: { fontSize: 13, marginTop: 4, opacity: 0.8 },
  equipmentWrap: { marginHorizontal: Spacing.base, padding: Spacing.lg, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  equipmentTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  equipmentSub: { fontSize: 13, marginBottom: 16, opacity: 0.8 },
  equipmentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  equipmentChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  equipmentChipText: { fontSize: 13, fontWeight: '700' },
  inputWrap: { borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  equipmentInput: { fontSize: 15, minHeight: 44, textAlignVertical: 'top' },
  aiDisclaimerBanner: { borderRadius: 18, borderWidth: 1, padding: 14 },
  aiDisclaimerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiDisclaimerIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  aiDisclaimerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  aiDisclaimerText: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  warningBox: { padding: 20, borderRadius: 24, borderWidth: 1, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  warningTitle: { fontSize: 17, fontWeight: '900' },
  warningText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  fullDisclaimerBox: { marginHorizontal: Spacing.base, marginTop: 20, marginBottom: 8, borderRadius: 18, borderWidth: 1, padding: 16 },
  fullDisclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fullDisclaimerTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  fullDisclaimerText: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  exportBtn: { marginHorizontal: Spacing.base, marginTop: 20, borderRadius: Radius.full, overflow: 'hidden', elevation: 6, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  exportGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  exportText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  floatingTimer: { position: 'absolute', bottom: 90, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(124,92,252,0.4)', shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 100 },
  timerTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', opacity: 0.7 },
  timerValue: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
