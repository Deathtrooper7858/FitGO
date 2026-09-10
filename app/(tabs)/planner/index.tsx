import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Vibration, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import {
  Download,
  Sparkles,
  Utensils,
  Dumbbell,
  Activity,
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ShieldAlert,
  Plus,
  RotateCcw,
  CheckCircle,
  Home,
} from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { useNutritionStore, selectDailyTotals } from '../../../store/nutritionStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { usePlannerStore } from '../../../store/plannerStore';
import { useWorkoutHistoryStore } from '../../../store/workoutHistoryStore';
import {
  generateMealPlan,
  generateWorkoutPlan,
  generateDailyMealPlan,
  generateDailyWorkoutPlan,
  generateWeeklyAnalysis,
  generateMealSwap,
  adjustWorkoutToBodyweight,
} from '../../../services/groq';
import { supabase } from '../../../services/supabase';
import { useTheme } from '../../../hooks/useTheme';
import { useIsPro } from '../../../hooks/useIsPro';
import { SuccessModal } from '../../../components/SuccessModal';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { getNameStyle, getSafeColor, isValidPremiumColor } from '../../../utils/styles';
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
import i18n from '../../../i18n';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
type PlannerMode = 'nutrition' | 'workouts';

/** Strips raw API/AI jargon and returns a friendly user-facing error string. */
function sanitizeAIError(msg: string, fallback: string): string {
  if (!msg) return fallback;
  const cleaned = msg.replace(/^AI Service Error:\s*/i, '').trim();
  if (/failed to validate json|failed_generation|json_validate_failed/i.test(cleaned))
    return i18n.t('planner.aiPlanError', { defaultValue: 'No se pudo generar el plan en este momento. Por favor, intenta de nuevo.' });
  if (/rate limit|tokens per day|too many requests|all apis are rate limited/i.test(cleaned))
    return i18n.t('planner.aiBusy', { defaultValue: 'El servicio de IA está ocupado. Intenta de nuevo en unos minutos.' });
  if (/timed out/i.test(cleaned))
    return i18n.t('planner.aiTimeout', { defaultValue: 'La solicitud tardó demasiado. Comprueba tu conexión e intenta de nuevo.' });
  if (/network|no internet/i.test(cleaned))
    return i18n.t('groq.noInternet', { defaultValue: 'No se detectó conexión a internet. Revisa tu red.' });
  return cleaned || fallback;
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSunday(date: Date = new Date()) {
  return date.getDay() === 0;
}

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

  useFocusEffect(
    useCallback(() => {
      const d = new Date().getDay();
      setActiveDay(d === 0 ? 'Sun' : DAYS[d - 1]);
    }, [])
  );

  const {
    mealPlans,
    workoutPlans,
    weeklyAnalysis: analysis,
    weekStart,
    warning,
    setMealPlans,
    setWorkoutPlans,
    setWeeklyAnalysis: setAnalysis,
    clearPlans,
    clearMealPlans,
    clearWorkoutPlans,
  } = usePlannerStore();
  const { addWorkout, hasCompletedWorkoutToday } = useWorkoutHistoryStore();
  const { profile } = useAuthStore();
  const streakDays = useNutritionStore(s => s.streakDays);
  const dailyWater = useNutritionStore(s => s.dailyWater);
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const addWater = useNutritionStore(s => s.addWater);

  const isProActually = useIsPro();
  const safePremiumColor = getSafeColor(premiumColor, colors.primary);
  const isPremiumCustom = !!(isProActually && isValidPremiumColor(premiumColor));

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
      if (!profile?.id) {
        setInitialLoading(false);
        return;
      }
      const currentWeekStart = getStartOfWeek(new Date());
      try {
        if (usePlannerStore.getState().userId !== profile.id) {
          clearPlans();
        }
        const { data: mData } = await supabase
          .from('meal_plans')
          .select('*, meal_plan_items(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mData && mData.week_start === currentWeekStart && mData.meal_plan_items?.length > 0) {
          const grouped: Record<string, PlanItem[]> = {};
          mData.meal_plan_items.forEach((item: any) => {
            if (!grouped[item.day_of_week]) grouped[item.day_of_week] = [];
            grouped[item.day_of_week].push({
              meal: item.meal,
              name: item.name,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            });
          });
          setMealPlans(grouped, currentWeekStart, undefined, profile.id);
        } else {
          clearMealPlans();
        }

        const { data: wData } = await supabase
          .from('workout_plans')
          .select('*, workout_plan_items(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (wData && wData.week_start === currentWeekStart && wData.workout_plan_items?.length > 0) {
          const grouped: Record<string, WorkoutRoutine> = {};
          wData.workout_plan_items.forEach((item: any) => {
            grouped[item.day_of_week] = { name: item.routine_name, exercises: item.exercises || [] };
          });
          setWorkoutPlans(grouped, currentWeekStart, undefined, profile.id);
        } else {
          clearWorkoutPlans();
        }
      } catch (_err) {
        console.error('[Planner] Load error:', _err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [profile?.id, clearPlans, clearMealPlans, setMealPlans, clearWorkoutPlans, setWorkoutPlans]);

  // Sunday reset timer
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
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (resetWarningTimerRef.current) clearTimeout(resetWarningTimerRef.current);
    };
  }, [profile?.id, clearPlans]);

  // Alert helper
  const [alert, setAlert] = useState<{ visible: boolean; type: AlertType; title: string; message: string; onConfirm: () => void }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) =>
    setAlert({
      visible: true,
      type,
      title,
      message,
      onConfirm: () => {
        onConfirm?.();
        setAlert(p => ({ ...p, visible: false }));
      },
    });

  const getGoalTranslation = () => {
    if (!profile?.goal) return t('planner.weekPlan', 'Plan Semanal');
    if (profile.goal === 'gain') return t('onboarding.gainTitle', 'Ganar Músculo');
    if (profile.goal === 'lose') return t('onboarding.loseTitle', 'Perder Grasa');
    return t('onboarding.stayTitle', 'Mantener Peso');
  };

  const handleGeneratePress = () => {
    if (!profile) return;
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleGenerateDayPress = () => {
    if (!profile) return;
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    handleGenerateDay(activeDay);
  };

  const handleGenerateDay = async (day: string) => {
    if (!profile) return;
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());
    try {
      if (mode === 'nutrition') {
        const parsedPlan = await generateDailyMealPlan(
          {
            targetCalories: profile.targetCalories || 2000,
            macros: profile.macros || { protein: 150, carbs: 250, fat: 65 },
            goal: profile.goal || 'maintain',
            availableFoods: profile.availableFoods,
            preferences: profile.preferences,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dietaryRestrictions: profile.dietaryRestrictions,
            medicalConditions: profile.medicalConditions,
            medicationsSupplements: profile.medicationsSupplements,
            tdee: profile.tdee,
          },
          language,
          day
        );
        const newPlans = { ...mealPlans, [day]: parsedPlan[day] || [] };
        setMealPlans(newPlans, currentWeekStart, undefined, profile.id);
        const { data: existing } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('user_id', profile.id)
          .eq('week_start', currentWeekStart)
          .maybeSingle();
        let planId = existing?.id;
        if (!planId) {
          const { data: inserted } = await supabase
            .from('meal_plans')
            .insert({ user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart })
            .select()
            .single();
          planId = inserted?.id;
        }
        if (planId) {
          await supabase.from('meal_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day);
          const itemsToInsert = (parsedPlan[day] || []).map((m: any) => ({
            plan_id: planId,
            day_of_week: day,
            meal: m.meal,
            name: m.name,
            calories: m.calories,
            protein: m.protein ?? 0,
            carbs: m.carbs ?? 0,
            fat: m.fat ?? 0,
          }));
          if (itemsToInsert.length > 0) await supabase.from('meal_plan_items').insert(itemsToInsert);
        }
      } else {
        const parsedPlan = await generateDailyWorkoutPlan(
          {
            goal: profile.goal || 'maintain',
            activityLevel: profile.activityLevel,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            sex: profile.sex,
            medicalConditions: profile.medicalConditions,
            medicationsSupplements: profile.medicationsSupplements,
            homeWorkout: isHomeWorkout,
            homeEquipment,
          },
          language,
          day
        );
        const newPlans = { ...workoutPlans, [day]: parsedPlan[day] || { name: 'Descanso', exercises: [] } };
        setWorkoutPlans(newPlans, currentWeekStart, undefined, profile.id);
        const { data: existing } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', profile.id)
          .eq('week_start', currentWeekStart)
          .maybeSingle();
        let planId = existing?.id;
        if (!planId) {
          const { data: inserted } = await supabase
            .from('workout_plans')
            .insert({ user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart })
            .select()
            .single();
          planId = inserted?.id;
        }
        if (planId) {
          await supabase.from('workout_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day);
          await supabase.from('workout_plan_items').insert([
            {
              plan_id: planId,
              day_of_week: day,
              routine_name: newPlans[day].name || t('planner.restDay', 'Rest Day'),
              exercises: newPlans[day].exercises || [],
            },
          ]);
        }
      }
      setShowSuccess(true);
    } catch (err: any) {
      showAlert('error', t('common.error'), sanitizeAIError(err?.message ?? '', t('planner.planGenerationFailed', 'No se pudo generar el plan en este momento.')));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (options?: { intensityMode: 'standard' | 'express' | 'heavy' | 'recovery'; focusSymmetry: boolean }) => {
    if (!profile) return;
    setShowConfirmModal(false);
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());
    try {
      if (mode === 'nutrition') {
        clearMealPlans();
        const parsedPlan = await generateMealPlan(
          {
            targetCalories: profile.targetCalories || 2000,
            macros: profile.macros || { protein: 150, carbs: 250, fat: 65 },
            goal: profile.goal || 'maintain',
            availableFoods: profile.availableFoods,
            preferences: profile.preferences,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dietaryRestrictions: profile.dietaryRestrictions,
            medicalConditions: profile.medicalConditions,
            medicationsSupplements: profile.medicationsSupplements,
            tdee: profile.tdee,
          },
          language
        );
        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setMealPlans(plansOnly, currentWeekStart, planWarning, profile.id);
        await supabase.from('meal_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase
          .from('meal_plans')
          .insert({ user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart })
          .select()
          .single();
        if (planData) {
          const items = DAYS.flatMap(d =>
            ((plansOnly as Record<string, any[]>)[d] || []).map((m: any) => ({
              plan_id: planData.id,
              day_of_week: d,
              meal: m.meal,
              name: m.name,
              calories: m.calories,
              protein: m.protein ?? 0,
              carbs: m.carbs ?? 0,
              fat: m.fat ?? 0,
            }))
          );
          if (items.length) await supabase.from('meal_plan_items').insert(items);
        }
      } else {
        clearWorkoutPlans();
        let focusMuscles: string[] = [];
        if (options?.focusSymmetry) {
          const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile.id);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          const counts: Record<string, number> = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };
          workouts
            .filter(w => w.date >= cutoff.toISOString().split('T')[0])
            .forEach(w =>
              w.exercises.forEach(ex => {
                const n = (ex.englishName || ex.name || '').toLowerCase();
                if (n.includes('press') && !n.includes('leg') && !n.includes('shoulder')) counts.chest++;
                if (n.includes('row') || n.includes('pull')) counts.back++;
                if (n.includes('squat') || n.includes('leg')) counts.legs++;
                if (n.includes('shoulder') || n.includes('lateral')) counts.shoulders++;
                if (n.includes('curl') || n.includes('tricep') || n.includes('extension')) counts.arms++;
                if (n.includes('crunch') || n.includes('plank') || n.includes('abs')) counts.core++;
              })
            );
          focusMuscles = Object.entries(counts)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 2)
            .map(x => x[0]);
        }
        const parsedPlan = await generateWorkoutPlan(
          {
            goal: profile.goal,
            activityLevel: profile.activityLevel,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            sex: profile.sex,
            medicalConditions: profile.medicalConditions,
            medicationsSupplements: profile.medicationsSupplements,
            homeWorkout: isHomeWorkout,
            homeEquipment,
            intensityMode: options?.intensityMode || 'standard',
            focusMuscles,
            energyMode,
          },
          language
        );
        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setWorkoutPlans(plansOnly, currentWeekStart, planWarning, profile.id);
        await supabase.from('workout_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase
          .from('workout_plans')
          .insert({ user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart })
          .select()
          .single();
        if (planData) {
          await supabase.from('workout_plan_items').insert(
            DAYS.map(d => ({
              plan_id: planData.id,
              day_of_week: d,
              routine_name: (plansOnly as Record<string, any>)[d]?.name || t('planner.restDay', 'Rest Day'),
              exercises: (plansOnly as Record<string, any>)[d]?.exercises || [],
            }))
          );
        }
      }
      setShowSuccess(true);
    } catch (err: any) {
      showAlert('error', t('common.error'), sanitizeAIError(err?.message ?? '', t('planner.planGenerationFailed', 'No se pudo generar el plan en este momento.')));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    try {
      const today = getLocalDateString();
      const ws = getStartOfWeek(new Date());
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const html =
        mode === 'nutrition'
          ? generateNutritionHTML(mealPlans, today, ws, we, language)
          : generateWorkoutHTML(workoutPlans, energyMode, today, ws, we, language);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `fitgo_${mode === 'nutrition' ? 'menu' : 'rutina'}_${today}.pdf`,
      });
    } catch {
      showAlert('error', t('common.error'), 'Could not generate PDF');
    }
  };

  const handleWeeklyAnalysis = async () => {
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    setAnalyzing(true);
    try {
      const stats = useNutritionStore.getState().todayLogs
        ? selectDailyTotals(useNutritionStore.getState())
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const res = await generateWeeklyAnalysis(
        {
          avgCalories: stats.calories,
          targetCalories: profile?.targetCalories ?? 2000,
          avgProtein: stats.protein,
          avgCarbs: stats.carbs,
          avgFat: stats.fat,
          goal: profile?.goal ?? 'maintain',
          daysLogged: streakDays,
        },
        language
      );
      setAnalysis(res);
    } catch {
      showAlert('error', t('planner.analysisFailed', 'Falló el análisis'), t('planner.analysisFailedSub', 'Intenta de nuevo en unos momentos'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Computed values
  const meals = useMemo(() => mealPlans[activeDay] ?? [], [mealPlans, activeDay]);
  const totalCal = meals.reduce((a: number, m: PlanItem) => a + m.calories, 0);
  const workout = workoutPlans[activeDay];

  const getDayDate = (dayAbbr: string) => {
    const idx = DAYS.indexOf(dayAbbr);
    const d = new Date();
    const monOff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    const m = new Date(d);
    m.setDate(d.getDate() + monOff);
    m.setDate(m.getDate() + idx);
    return getLocalDateString(m);
  };

  const activeDayDate = getDayDate(activeDay);
  const todayDate = getLocalDateString();
  const isActiveToday = activeDayDate === todayDate;
  const isFutureDay = activeDayDate > todayDate;
  const alreadyCompleted = hasCompletedWorkoutToday(activeDayDate);

  const consumedMacros = useMemo(() => {
    if (!isActiveToday) return { p: 0, c: 0, f: 0 };
    return todayLogs
      .filter((l: any) => l.loggedAt.startsWith(todayDate))
      .reduce(
        (acc: { p: number; c: number; f: number }, l: any) => ({
          p: acc.p + (l.protein || 0),
          c: acc.c + (l.carbs || 0),
          f: acc.f + (l.fat || 0),
        }),
        { p: 0, c: 0, f: 0 }
      );
  }, [isActiveToday, todayLogs, todayDate]);

  const plannedMacros = useMemo(
    () =>
      meals.reduce(
        (acc: { p: number; c: number; f: number }, m: PlanItem) => ({
          p: acc.p + (m.protein || 0),
          c: acc.c + (m.carbs || 0),
          f: acc.f + (m.fat || 0),
        }),
        { p: 0, c: 0, f: 0 }
      ),
    [meals]
  );

  const waterToday = dailyWater[todayDate] || 0;
  const hasData = mode === 'nutrition' ? Object.keys(mealPlans).length > 0 : Object.keys(workoutPlans).length > 0;

  // Plan maps for day selector
  const hasPlanMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    DAYS.forEach(d => {
      if (mode === 'nutrition') {
        map[d] = !!(mealPlans[d] && mealPlans[d].length > 0);
      } else {
        map[d] = !!(workoutPlans[d] && workoutPlans[d].exercises && workoutPlans[d].exercises.length > 0);
      }
    });
    return map;
  }, [mode, mealPlans, workoutPlans]);

  const isCompletedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (mode === 'workouts') {
      DAYS.forEach(d => {
        const dateStr = getDayDate(d);
        map[d] = hasCompletedWorkoutToday(dateStr);
      });
    }
    return map;
  }, [mode, hasCompletedWorkoutToday]);

  const hasCurrentDayPlan =
    mode === 'nutrition'
      ? meals.length > 0
      : !!(workout && workout.exercises && workout.exercises.length > 0);

  // Workout handlers
  const handleMoveExercise = async (index: number, dir: -1 | 1) => {
    if (!workout || workout.exercises.length === 0) return;
    const newEx = [...workout.exercises];
    const t2 = index + dir;
    if (t2 < 0 || t2 >= newEx.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    [newEx[index], newEx[t2]] = [newEx[t2], newEx[index]];
    const updated = { ...workout, exercises: newEx };
    setWorkoutPlans({ ...workoutPlans, [activeDay]: updated }, weekStart || getStartOfWeek(new Date()), warning || undefined, profile?.id);
    if (profile?.id) {
      supabase.from('workout_plan_items').update({ exercises: newEx }).eq('user_id', profile.id).eq('day_of_week', activeDay).then();
    }
  };

  const handleCompleteWorkout = () => {
    if (!workout || workout.exercises.length === 0 || alreadyCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addWorkout({
      date: activeDayDate,
      routineName: workout.name,
      exercises: workout.exercises.map((ex: any, i: number) => ({
        name: ex.name,
        englishName: ex.englishName,
        sets: ex.sets,
        reps: ex.reps,
        weight: exerciseMetrics[i]?.weight,
        rpe: exerciseMetrics[i]?.rpe,
      })),
    });
  };

  const getPreviousRPE = (exerciseName: string) => {
    const wkt = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile?.id);
    const sorted = [...wkt].sort((a, b) => b.completedAt - a.completedAt);
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if ((ex.englishName || ex.name) === exerciseName && ex.rpe) return parseInt(ex.rpe);
      }
    }
    return null;
  };

  const handleAdjustWorkout = async (type: 'up' | 'down' | 'bodyweight') => {
    if (!workout || workout.exercises.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type !== 'bodyweight') {
      const newEx = workout.exercises.map((ex: any) => ({
        ...ex,
        sets: type === 'up' ? ex.sets + 1 : Math.max(1, ex.sets - 1),
      }));
      const updated = { ...workout, exercises: newEx };
      setWorkoutPlans({ ...workoutPlans, [activeDay]: updated }, weekStart || getStartOfWeek(new Date()), warning || undefined, profile?.id);
      if (profile?.id) {
        supabase.from('workout_plan_items').update({ exercises: newEx }).eq('user_id', profile.id).eq('day_of_week', activeDay).then();
      }
      return;
    }
    setIsAdjustingBW(true);
    try {
      const adjusted = await adjustWorkoutToBodyweight(workout.name, workout.exercises, language);
      setWorkoutPlans(
        { ...workoutPlans, [activeDay]: { ...workout, exercises: adjusted.exercises, name: adjusted.name } },
        weekStart || getStartOfWeek(new Date()),
        warning || undefined,
        profile?.id
      );
      if (profile?.id) {
        supabase
          .from('workout_plan_items')
          .update({ exercises: adjusted.exercises, routine_name: adjusted.name })
          .eq('user_id', profile.id)
          .eq('day_of_week', activeDay)
          .then();
      }
    } catch {
      showAlert('error', t('common.error'), t('planner.adjustFailed', 'No se pudo ajustar'));
    } finally {
      setIsAdjustingBW(false);
    }
  };

  const handleSwapMeal = async (day: string, index: number, current: PlanItem) => {
    const newMeal = await generateMealSwap(current.name, current.calories, current.protein || 0, current.carbs || 0, current.fat || 0, profile, language);
    if (!newMeal?.name || typeof newMeal.name !== 'string' || newMeal.name.trim() === '') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    usePlannerStore.getState().swapMeal(day, index, {
      meal: current.meal,
      name: newMeal.name.trim(),
      calories: newMeal.calories || current.calories,
      protein: newMeal.protein ?? current.protein,
      carbs: newMeal.carbs ?? current.carbs,
      fat: newMeal.fat ?? current.fat,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleConsumeMeal = (m: PlanItem) => {
    Haptics.selectionAsync();
    useNutritionStore.getState().addLog({
      id: '',
      foodItem: {
        id: '',
        name: m.name,
        calories: m.calories,
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fat: m.fat || 0,
        source: 'custom',
        sugar: 0,
        fiber: 0,
        sodium: 0,
        iron: 0,
        calcium: 0,
        saturatedFat: 0,
        transFat: 0,
      },
      grams: 100,
      meal: m.meal,
      loggedAt: new Date().toISOString(),
      calories: m.calories,
      protein: m.protein || 0,
      carbs: m.carbs || 0,
      fat: m.fat || 0,
    });
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

  const energyOptions = [
    {
      key: 'low',
      lbl: t('planner.energyLow', 'Agotado'),
      sub: t('planner.energyLowSub', 'Suave / Movilidad'),
      emoji: '🔋',
      color: '#06B6D4',
    },
    {
      key: 'normal',
      lbl: t('planner.energyNormal', 'Normal'),
      sub: t('planner.energyNormalSub', 'Balance perfecto'),
      emoji: '⚡',
      color: isPremiumCustom ? safePremiumColor : colors.primary,
    },
    {
      key: 'beast',
      lbl: t('planner.energyBeast', 'Bestia'),
      sub: t('planner.energyBeastSub', 'Máxima fuerza'),
      emoji: '🦍',
      color: '#EF4444',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={[s.safe, { backgroundColor: 'transparent' }]}>
        <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onConfirm={alert.onConfirm} />
        <AILoadingOverlay visible={loading || analyzing || isAdjustingBW} mode={loading ? mode : analyzing ? 'analysis' : 'bodyweight'} />
        <GenerateConfirmModal
          visible={showConfirmModal}
          onConfirm={handleGenerate}
          onChangeFoods={() => {
            setShowConfirmModal(false);
            router.push('/modals/food-selection');
          }}
          onCancel={() => setShowConfirmModal(false)}
          mode={mode}
          availableFoods={profile?.availableFoods}
          targetCalories={profile?.targetCalories}
          isHomeWorkout={isHomeWorkout}
          homeEquipment={homeEquipment}
          profile={profile}
          premiumColor={safePremiumColor}
          isPremiumCustom={isPremiumCustom}
        />
        <ResetWarningModal visible={showResetWarning} onDismiss={() => setShowResetWarning(false)} />
        <ShoppingListModal visible={showShoppingList} onClose={() => setShowShoppingList(false)} mealPlans={mealPlans} language={language} />

        {/* Floating Rest Timer */}
        {restTimer !== null && (
          <TouchableOpacity
            style={[s.floatingTimer, { backgroundColor: colors.surface, borderColor: safePremiumColor + '60' }]}
            activeOpacity={0.8}
            onPress={() => setRestTimer(null)}
          >
            <Activity size={22} color={safePremiumColor} />
            <View style={{ minWidth: 64 }}>
              <Text style={[s.timerTitle, { color: colors.textPrimary }]}>Descanso</Text>
              <Text style={[s.timerValue, { color: safePremiumColor }]}>
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            <X size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerTopRow}>
              <View style={s.headerTextWrap}>
                <Text style={[s.title, { color: colors.textPrimary }]}>{t('planner.title')}</Text>
                {profile?.name && (
                  <Text style={[s.greetingText, { color: colors.primary }, getNameStyle(profile?.nameColor)]}>
                    {t('common.greeting', 'Hola')}, {profile.name}!
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[s.genWeeklyBtn, { shadowColor: safePremiumColor }]}
                activeOpacity={0.85}
                onPress={handleGeneratePress}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    mode === 'workouts'
                      ? energyMode === 'low'
                        ? ['#06B6D4', '#0891B2']
                        : energyMode === 'beast'
                        ? ['#EF4444', '#B91C1C']
                        : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
                      : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
                  }
                  style={s.genWeeklyGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={15} color="#fff" />
                      <Text style={s.genWeeklyText}>{t('planner.generateWeekly', 'Generar Semana')}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Goal Pill */}
            <View style={[s.goalPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[s.goalPillLabel, { color: colors.textMuted }]}>{t('planner.planFor', 'Plan:')}</Text>
              <Text style={[s.goalPillValue, { color: colors.primary }]}>{getGoalTranslation()}</Text>
            </View>
          </View>

          {/* Mode Switcher: Nutrición vs Rutinas */}
          <View style={s.toggleContainer}>
            <View style={[s.tabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              {(['nutrition', 'workouts'] as PlannerMode[]).map(m => {
                const isA = mode === m;
                const count = m === 'nutrition' ? (mealPlans[activeDay]?.length || 0) : (workoutPlans[activeDay]?.exercises?.length || 0);

                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      s.tab,
                      isA && {
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(m);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={s.tabContent}>
                      {m === 'nutrition' ? (
                        <Utensils size={16} color={isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} />
                      ) : (
                        <Dumbbell size={16} color={isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} />
                      )}
                      <Text
                        style={[
                          s.tabText,
                          {
                            color: isA ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textSecondary,
                          },
                        ]}
                      >
                        {m === 'nutrition' ? t('planner.nutritionTab', 'Nutrición') : t('planner.workoutsTab', 'Rutinas')}
                      </Text>
                      {count > 0 && (
                        <View
                          style={[
                            s.tabBadge,
                            {
                              backgroundColor: isA
                                ? (isPremiumCustom ? safePremiumColor + '20' : colors.primary + '20')
                                : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.tabBadgeText,
                              {
                                color: isA
                                  ? (isPremiumCustom ? safePremiumColor : colors.primary)
                                  : colors.textMuted,
                              },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Day Selector */}
          <DaySelector
            active={activeDay}
            onSelect={setActiveDay}
            isPremiumCustom={isPremiumCustom}
            premiumColor={safePremiumColor}
            hasPlanMap={hasPlanMap}
            isCompletedMap={isCompletedMap}
          />

          {/* Contextual Day Action Status Banner */}
          <View style={s.dayBannerContainer}>
            {hasCurrentDayPlan ? (
              <View style={[s.dayStatusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={s.dayStatusLeft}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={[s.dayStatusText, { color: colors.textPrimary }]}>
                    {mode === 'nutrition'
                      ? `${meals.length} ${t('planner.mealsCount', 'comidas')} (${totalCal} kcal)`
                      : workout?.exercises?.length
                      ? `${workout.exercises.length} ${t('planner.exercisesPlanned', 'ejercicios planificados')}`
                      : t('planner.restDay', 'Día de descanso')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[s.regenerateDayBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={handleGenerateDayPress}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={13} color={colors.primary} />
                  <Text style={[s.regenerateDayText, { color: colors.primary }]}>
                    {t('planner.regenerateDay', 'Regenerar día')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.genDayPrimaryBtn, { shadowColor: safePremiumColor }]}
                activeOpacity={0.85}
                onPress={handleGenerateDayPress}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    mode === 'workouts'
                      ? energyMode === 'low'
                        ? ['#06B6D4', '#0891B2']
                        : energyMode === 'beast'
                        ? ['#EF4444', '#B91C1C']
                        : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
                      : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
                  }
                  style={s.genDayPrimaryGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} color="#fff" />
                      <Text style={s.genDayPrimaryText}>
                        {t('planner.generateForDay', 'Generar plan para')} {t(`planner.${activeDay.toLowerCase()}`)}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Workouts Energy Level Selector */}
          {mode === 'workouts' && (
            <View style={s.energyContainer}>
              <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
                {t('planner.howFeelToday', '¿Cómo te sientes hoy?')}
              </Text>
              <View style={s.energyCardsRow}>
                {energyOptions.map(e => {
                  const isE = energyMode === e.key;
                  return (
                    <TouchableOpacity
                      key={e.key}
                      activeOpacity={0.8}
                      onPress={() => {
                        setEnergyMode(e.key as any);
                        Haptics.impactAsync(
                          e.key === 'low'
                            ? Haptics.ImpactFeedbackStyle.Light
                            : e.key === 'beast'
                            ? Haptics.ImpactFeedbackStyle.Heavy
                            : Haptics.ImpactFeedbackStyle.Medium
                        );
                      }}
                      style={[
                        s.energyCard,
                        {
                          backgroundColor: isE ? e.color + '18' : colors.surfaceAlt,
                          borderColor: isE ? e.color : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{e.emoji}</Text>
                      <Text style={[s.energyCardTitle, { color: isE ? e.color : colors.textPrimary }]}>{e.lbl}</Text>
                      <Text style={[s.energyCardSub, { color: isE ? e.color : colors.textMuted }]}>{e.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Workouts Home / Equipment Config */}
          {mode === 'workouts' && (
            <View style={{ marginBottom: 14 }}>
              <View style={[s.homeWorkoutWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginBottom: isHomeWorkout ? 12 : 0 }]}>
                <View style={s.homeWorkoutIconWrap}>
                  <Home size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.homeWorkoutTitle, { color: colors.textPrimary }]}>
                    {t('planner.homeWorkoutTitle', 'Entrenamiento en Casa')}
                  </Text>
                  <Text style={[s.homeWorkoutSub, { color: colors.textSecondary }]}>
                    {t('planner.homeWorkoutSub', 'Adaptar ejercicios a calistenia y peso corporal')}
                  </Text>
                </View>
                <Switch
                  value={isHomeWorkout}
                  onValueChange={setIsHomeWorkout}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {isHomeWorkout && (
                <View style={[s.equipmentWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.equipmentTitle, { color: colors.textPrimary }]}>
                    {t('planner.equipmentTitle', 'Implementos Disponibles')}
                  </Text>
                  <Text style={[s.equipmentSub, { color: colors.textSecondary }]}>
                    {t('planner.equipmentSub', 'Selecciona el equipo que tienes en casa')}
                  </Text>

                  <View style={{ marginTop: 8 }}>
                    {[
                      {
                        id: 'basics',
                        title: t('planner.eqCatBasics', 'Básicos de Calistenia'),
                        items: [
                          t('planner.eqPullupBar', 'Barra de dominadas'),
                          t('planner.eqParallelBars', 'Barras paralelas'),
                          t('planner.eqGymnasticRings', 'Anillas de gimnasia'),
                          t('planner.eqWeightedVest', 'Chaleco lastrado'),
                        ],
                      },
                      {
                        id: 'bands',
                        title: t('planner.eqCatBands', 'Bandas y Resistencia'),
                        items: [
                          t('planner.eqTubularBands', 'Bandas elásticas tubulares'),
                          t('planner.eqLoopBands', 'Bandas de resistencia (loops)'),
                          t('planner.eqTRX', 'TRX / Suspensión'),
                        ],
                      },
                      {
                        id: 'accessories',
                        title: t('planner.eqCatAccessories', 'Accesorios Adicionales'),
                        items: [
                          t('planner.eqMat', 'Tapete / Mat'),
                          t('planner.eqAbWheel', 'Rueda abdominal'),
                          t('planner.eqJumpRope', 'Cuerda para saltar'),
                          t('planner.eqAdjustableBench', 'Banco ajustable'),
                        ],
                      },
                      {
                        id: 'weights',
                        title: t('planner.eqCatWeights', 'Pesas y Mancuernas'),
                        items: [],
                      },
                    ].map(cat => {
                      const isExp = expandedEqCategory === cat.id;
                      return (
                        <View
                          key={cat.id}
                          style={{
                            marginBottom: 8,
                            backgroundColor: colors.background,
                            borderRadius: 14,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}
                            onPress={() => setExpandedEqCategory(isExp ? null : cat.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{cat.title}</Text>
                            {isExp ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
                          </TouchableOpacity>

                          {isExp && (
                            <View style={{ padding: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border + '50' }}>
                              {cat.id === 'weights' && (
                                <View>
                                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                                    {(['Mancuernas', 'Kettlebell'] as const).map(wt => {
                                      const isWT = weightType === wt;
                                      return (
                                        <TouchableOpacity
                                          key={wt}
                                          style={{
                                            flex: 1,
                                            paddingVertical: 8,
                                            alignItems: 'center',
                                            borderRadius: 8,
                                            backgroundColor: isWT ? colors.primary + '20' : colors.surfaceAlt,
                                            borderWidth: 1,
                                            borderColor: isWT ? colors.primary : colors.border,
                                          }}
                                          onPress={() => setWeightType(wt)}
                                        >
                                          <Text style={{ color: isWT ? colors.primary : colors.textMuted, fontWeight: '700', fontSize: 12 }}>
                                            {wt === 'Mancuernas' ? t('planner.eqDumbbells', 'Mancuernas') : t('planner.eqKettlebell', 'Kettlebell')}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                                    <TextInput
                                      style={{
                                        flex: 1,
                                        backgroundColor: colors.surfaceAlt,
                                        color: colors.textPrimary,
                                        borderRadius: 8,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        fontSize: 13,
                                      }}
                                      placeholder={t('planner.weightPlaceholder', 'Ej: 10')}
                                      placeholderTextColor={colors.textMuted}
                                      keyboardType="numeric"
                                      value={customWeightInput}
                                      onChangeText={setCustomWeightInput}
                                    />
                                    {['kg', 'lbs'].map(u => {
                                      const isU = weightUnit === u;
                                      return (
                                        <TouchableOpacity
                                          key={u}
                                          style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            backgroundColor: isU ? colors.primary + '20' : colors.surfaceAlt,
                                            borderWidth: 1,
                                            borderColor: isU ? colors.primary : colors.border,
                                            justifyContent: 'center',
                                          }}
                                          onPress={() => setWeightUnit(u as any)}
                                        >
                                          <Text style={{ color: isU ? colors.primary : colors.textMuted, fontWeight: '700', fontSize: 12 }}>{u}</Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                    <TouchableOpacity
                                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center' }}
                                      onPress={handleAddCustomWeight}
                                    >
                                      <Plus size={16} color="#fff" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}

                              <View style={s.equipmentChips}>
                                {(cat.id === 'weights'
                                  ? homeEquipment.split(',').map(s => s.trim()).filter(s => s.includes('Mancuerna') || s.includes('Kettlebell') || s.includes('Pesa'))
                                  : cat.items
                                ).map((item: string) => {
                                  const arr = homeEquipment.split(',').map(s => s.trim());
                                  const isSel = arr.includes(item);
                                  if (cat.id === 'weights' && !isSel) return null;
                                  return (
                                    <TouchableOpacity
                                      key={item}
                                      style={[
                                        s.equipmentChip,
                                        isSel
                                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                          : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                                      ]}
                                      onPress={() => handleToggleEquipment(item)}
                                    >
                                      <Text style={[s.equipmentChipText, { color: isSel ? '#fff' : colors.textPrimary }]}>{item}</Text>
                                      {cat.id === 'weights' && <X size={12} color="#fff" style={{ marginLeft: 4 }} />}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 4 }]}>
                    <TextInput
                      style={[s.equipmentInput, { color: colors.textPrimary }]}
                      placeholder={t('planner.equipmentPlaceholder', 'Opcional: Detalles adicionales...')}
                      placeholderTextColor={colors.textMuted}
                      value={homeEquipment}
                      onChangeText={setHomeEquipment}
                      multiline
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Subview Component: Nutrition or Workout */}
          {mode === 'nutrition' ? (
            <MealPlanView
              meals={meals}
              activeDay={activeDay}
              loading={loading}
              isProActually={isProActually}
              isPremiumCustom={isPremiumCustom}
              safePremiumColor={safePremiumColor}
              isActiveToday={isActiveToday}
              consumedMacros={consumedMacros}
              plannedMacros={plannedMacros}
              waterToday={waterToday}
              totalCal={totalCal}
              targetCalories={profile?.targetCalories ?? 2000}
              analysis={analysis}
              analyzing={analyzing}
              onWeeklyAnalysis={handleWeeklyAnalysis}
              onAddWater={() => {
                addWater(250);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onSwapMeal={handleSwapMeal}
              onConsumeMeal={handleConsumeMeal}
            />
          ) : (
            <WorkoutPlanView
              workout={workout}
              activeDay={activeDay}
              isFutureDay={isFutureDay}
              isAdjustingBW={isAdjustingBW}
              alreadyCompleted={alreadyCompleted}
              exerciseMetrics={exerciseMetrics}
              onMoveExercise={handleMoveExercise}
              onCompleteWorkout={handleCompleteWorkout}
              onAdjustWorkout={handleAdjustWorkout}
              onUpdateMetric={(i, f, v) => setExerciseMetrics(p => ({ ...p, [i]: { ...p[i], [f]: v } }))}
              onStartRest={s => setRestTimer(s)}
              getPreviousRPE={getPreviousRPE}
            />
          )}

          {/* Unified AI & Safety Disclaimer Box */}
          {hasData && (
            <View style={{ marginHorizontal: Spacing.base, marginTop: 10, marginBottom: 12 }}>
              <TouchableOpacity
                style={[s.safetyBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={() => setShowDisclaimer(!showDisclaimer)}
                activeOpacity={0.8}
              >
                <ShieldAlert size={16} color={colors.warning} />
                <Text style={[s.safetyBannerTitle, { color: colors.textPrimary }]}>
                  {t('planner.safetyNoticeTitle', 'Avisos de Salud y Orientación IA')}
                </Text>
                {showDisclaimer ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
              </TouchableOpacity>

              {showDisclaimer && (
                <View style={[s.safetyContentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={s.safetyRow}>
                    <AlertTriangle size={14} color={colors.warning} style={{ marginTop: 2 }} />
                    <Text style={[s.safetyText, { color: colors.textSecondary }]}>
                      {t('planner.aiDisclaimerText', 'Este plan es generado por inteligencia artificial con fines orientativos y no sustituye el criterio médico ni de un nutricionista o entrenador certificado.')}
                    </Text>
                  </View>
                  {warning && (
                    <View style={[s.customWarningRow, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
                      <Text style={[s.customWarningText, { color: colors.error }]}>{warning}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Bottom Export Bar */}
          {hasData && (
            <View style={s.bottomActionBar}>
              {mode === 'nutrition' && (
                <TouchableOpacity
                  style={[s.bottomBtn, { flex: 1 }]}
                  onPress={() => setShowShoppingList(true)}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#F59E0B', '#D97706']} style={s.bottomBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <ShoppingCart size={16} color="#fff" />
                    <Text style={s.bottomBtnText}>{t('planner.shoppingListShort', 'Compras')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.bottomBtn, { flex: 1 }]}
                onPress={handleExportPDF}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#10B981', '#059669']} style={s.bottomBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Download size={16} color="#fff" />
                  <Text style={s.bottomBtnText}>{mode === 'nutrition' ? t('planner.pdfMenu', 'PDF Menú') : t('planner.pdfRoutine', 'PDF Rutina')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {initialLoading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('common.loading')}</Text>
          </View>
        )}
        <SuccessModal visible={showSuccess} title={t('common.success')} message={t('planner.planReady')} onClose={() => setShowSuccess(false)} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  genWeeklyBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  genWeeklyGrad: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  genWeeklyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  goalPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalPillValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  toggleContainer: {
    paddingHorizontal: Spacing.base,
    marginVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dayBannerContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: 14,
  },
  dayStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  dayStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  regenerateDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  regenerateDayText: {
    fontSize: 11,
    fontWeight: '800',
  },
  genDayPrimaryBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  genDayPrimaryGrad: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.full,
  },
  genDayPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  energyContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  energyCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  energyCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  energyCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  energyCardSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  homeWorkoutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: Spacing.base,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  homeWorkoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124,92,252,0.15)',
  },
  homeWorkoutTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  homeWorkoutSub: {
    fontSize: 11,
    marginTop: 2,
  },
  equipmentWrap: {
    marginHorizontal: Spacing.base,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  equipmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  equipmentSub: {
    fontSize: 11,
    marginBottom: 12,
  },
  equipmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  equipmentChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  equipmentInput: {
    fontSize: 13,
    minHeight: 36,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  safetyBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  safetyContentBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  customWarningRow: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  customWarningText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  bottomActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: Spacing.base,
    marginTop: 10,
  },
  bottomBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    elevation: 3,
  },
  bottomBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  bottomBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingTimer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  timerTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
