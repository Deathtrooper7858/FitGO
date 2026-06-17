import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Modal, Animated, Platform, TextInput, Vibration, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius } from '../../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useNutritionStore, selectDailyTotals } from '../../../store/nutritionStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { usePurchaseStore } from '../../../store/purchaseStore';
import { usePlannerStore } from '../../../store/plannerStore';
import type { PlanItem, WorkoutRoutine } from '../../../store/plannerStore';
import { useWorkoutHistoryStore } from '../../../store/workoutHistoryStore';
import { generateMealPlan, generateWorkoutPlan, generateDailyMealPlan, generateDailyWorkoutPlan, generateWeeklyAnalysis, generateShoppingList, generateShoppingListJSON, generateMealSwap } from '../../../services/groq';
import { supabase } from '../../../services/supabase';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { SuccessModal } from '../../../components/SuccessModal';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { GlobalBackground } from '../../../components/GlobalBackground';
import * as Haptics from 'expo-haptics';
import { Download, Sparkles, Utensils, Dumbbell, Coffee, Apple, Pizza, CalendarDays, ChevronRight, ChevronDown, ChevronUp, Activity, Moon, ShoppingCart, AlertTriangle, Info, RefreshCw, ShieldAlert, CheckCircle, Droplets, Plus, Play, X } from 'lucide-react-native';
import { AnimatedCard } from '../../../components/AnimatedCard';
import { getNameStyle } from '../../../utils/styles';
import { GlassCard } from '../../../components/GlassCard';
import { getLocalDateString } from '../../../utils/date';
import { Confetti } from '../../../components/Confetti';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type PlannerMode = 'nutrition' | 'workouts';

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns true if today is Sunday */
function isSunday(date: Date = new Date()) {
  return date.getDay() === 0;
}

/** Returns ms until next Sunday at 23:59:00 */
function msUntilSundayReset(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon,...6=Sat
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 0, 0);
  return nextSunday.getTime() - now.getTime();
}

// ─── Pre-Generation Confirmation Modal ────────────────────────────────────────
interface GenerateConfirmModalProps {
  visible: boolean;
  onConfirm: (options?: { intensityMode: 'standard' | 'express' | 'heavy' | 'recovery', focusSymmetry: boolean }) => void;
  onChangeFoods: () => void;
  onCancel: () => void;
  mode: PlannerMode;
  availableFoods?: string[];
  targetCalories?: number;
  isHomeWorkout?: boolean;
  homeEquipment?: string;
  profile?: any;
  premiumColor?: string;
  isPremiumCustom?: boolean;
}

function GenerateConfirmModal({ visible, onConfirm, onChangeFoods, onCancel, mode, availableFoods, targetCalories, isHomeWorkout, homeEquipment, profile, premiumColor, isPremiumCustom }: GenerateConfirmModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  
  const [intensityMode, setIntensityMode] = useState<'standard' | 'express' | 'heavy' | 'recovery'>('standard');
  const [focusSymmetry, setFocusSymmetry] = useState(false);

  const goalText = profile?.goal === 'gain' ? t('onboarding.gainTitle', 'Ganar Músculo') 
                 : profile?.goal === 'lose' ? t('onboarding.loseTitle', 'Perder Grasa') 
                 : t('onboarding.stayTitle', 'Mantener Peso');
                 
  const hasMedical = profile?.medicalConditions && profile.medicalConditions.length > 0 && !profile.medicalConditions.includes('none');
  const medicalText = hasMedical ? profile.medicalConditions.join(', ') : '';
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIntensityMode('standard');
      setFocusSymmetry(false);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const hasFoods = (availableFoods?.length ?? 0) > 0;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[gcm.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[gcm.card, { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] }]}>
          {/* Icon header */}
          {/* Icon header */}
          <LinearGradient
            colors={isPremiumCustom && premiumColor ? [premiumColor + '33', premiumColor + '11'] : ['#7C5CFC22', '#4338CA11']}
            style={gcm.iconHeader}
          >
            <View style={[gcm.iconCircle, { backgroundColor: isPremiumCustom && premiumColor ? premiumColor + '33' : colors.primary + '22' }]}>
              <Sparkles size={32} color={isPremiumCustom && premiumColor ? premiumColor : colors.primary} />
            </View>
          </LinearGradient>

          <Text style={[gcm.title, { color: colors.textPrimary }]}>
            {mode === 'nutrition'
              ? t('planner.confirmGenNutritionTitle', '¿Generar Plan Nutricional?')
              : t('planner.confirmGenWorkoutTitle', '¿Generar Plan de Entrenamiento?')}
          </Text>

          {mode === 'nutrition' && (
            <>
              {/* Calorie info */}
              {targetCalories && (
                <View style={[gcm.infoRow, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '33' }]}>
                  <Info size={16} color={colors.primary} />
                  <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                    {t('planner.confirmCalorieInfo', 'El plan será calculado para')}{' '}
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>{targetCalories} kcal/día</Text>
                    {' '}{t('planner.confirmCalorieInfo2', 'según tu perfil y objetivos.')}
                  </Text>
                </View>
              )}

              {/* Foods available */}
              <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={gcm.foodsHeader}>
                  <Utensils size={15} color={hasFoods ? colors.primary : colors.textMuted} />
                  <Text style={[gcm.foodsTitle, { color: colors.textPrimary }]}>
                    {t('planner.confirmFoodsLabel', 'Alimentos disponibles')}
                  </Text>
                </View>
                {hasFoods ? (
                  <Text style={[gcm.foodsList, { color: colors.textSecondary }]} numberOfLines={3}>
                    {availableFoods!.slice(0, 8).join(', ')}{availableFoods!.length > 8 ? ` +${availableFoods!.length - 8} más` : ''}
                  </Text>
                ) : (
                  <Text style={[gcm.foodsEmpty, { color: colors.textMuted }]}>
                    {t('planner.confirmNoFoods', 'No has especificado alimentos. La IA elegirá opciones saludables y variadas.')}
                  </Text>
                )}
              </View>
            </>
          )}

          {mode === 'workouts' && (
            <>
              <View style={[gcm.infoRow, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '33' }]}>
                <Activity size={16} color={colors.primary} />
                <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                  {t('planner.confirmContextTitle', 'Plan optimizado para')}: 
                  <Text style={{ color: colors.primary, fontWeight: '800' }}> {goalText}</Text>
                  {profile?.activityLevel && <Text> ({profile.activityLevel})</Text>}
                </Text>
              </View>

              {hasMedical && (
                <View style={[gcm.infoRow, { backgroundColor: colors.error + '11', borderColor: colors.error + '33' }]}>
                  <AlertTriangle size={16} color={colors.error} />
                  <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                    {t('planner.confirmMedicalLabel', 'Condiciones a considerar')}: 
                    <Text style={{ color: colors.error, fontWeight: '700' }}> {medicalText}</Text>
                  </Text>
                </View>
              )}

              {isHomeWorkout && (
                <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <View style={gcm.foodsHeader}>
                    <Dumbbell size={15} color={colors.primary} />
                    <Text style={[gcm.foodsTitle, { color: colors.textPrimary }]}>
                      {t('planner.confirmEquipmentLabel', 'Implementos disponibles (Casa)')}
                    </Text>
                  </View>
                  {homeEquipment ? (
                    <Text style={[gcm.foodsList, { color: colors.textSecondary }]} numberOfLines={3}>
                      {homeEquipment}
                    </Text>
                  ) : (
                    <Text style={[gcm.foodsEmpty, { color: colors.warning }]}>
                      {t('planner.confirmNoEquipment', 'Verifica que tienes los implementos necesarios. Si no indicas ninguno, el plan será solo con peso corporal.')}
                    </Text>
                  )}
                </View>
              )}

              {/* Modos de Intensidad */}
              <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 12 }]}>
                <Text style={[gcm.foodsTitle, { color: colors.textPrimary, marginBottom: 8 }]}>Modo de Entrenamiento</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['standard', 'express', 'heavy', 'recovery'] as const).map(m => (
                    <TouchableOpacity 
                      key={m} 
                      style={[gcm.modeBtn, intensityMode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setIntensityMode(m)}
                    >
                      <Text style={[gcm.modeBtnText, intensityMode === m ? { color: '#fff' } : { color: colors.textSecondary }]}>
                        {m === 'standard' ? '🏋️ Normal' : m === 'express' ? '⚡ Rápido (25m)' : m === 'heavy' ? '🚀 Fuerza/Pesado' : '🧘 Recuperación'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Modo Simetría */}
              <TouchableOpacity 
                style={[gcm.infoRow, { backgroundColor: focusSymmetry ? colors.primary + '22' : colors.surfaceAlt, borderColor: focusSymmetry ? colors.primary : colors.border, marginTop: 8, marginBottom: 16 }]}
                onPress={() => setFocusSymmetry(!focusSymmetry)}
                activeOpacity={0.7}
              >
                <Activity size={16} color={focusSymmetry ? colors.primary : colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[gcm.infoText, { color: focusSymmetry ? colors.primary : colors.textPrimary, fontWeight: '700' }]}>
                    Enfoque de Simetría
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    La IA priorizará tus músculos más débiles
                  </Text>
                </View>
                <Switch value={focusSymmetry} onValueChange={setFocusSymmetry} />
              </TouchableOpacity>
            </>
          )}

          {/* Action buttons */}
          <TouchableOpacity style={[gcm.btnPrimary]} activeOpacity={0.85} onPress={() => onConfirm({ intensityMode, focusSymmetry })}>
            <LinearGradient
              colors={isPremiumCustom && premiumColor ? [premiumColor, premiumColor + 'CC'] : ['#7C5CFC', '#4338CA']}
              style={gcm.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={gcm.btnPrimaryText}>{t('planner.confirmGenerate', 'Generar Plan Ahora')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {mode === 'nutrition' && (
            <TouchableOpacity
              style={[gcm.btnSecondary, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={onChangeFoods}
            >
              <Utensils size={15} color={colors.primary} />
              <Text style={[gcm.btnSecondaryText, { color: colors.primary }]}>
                {t('planner.confirmChangeFoods', 'Cambiar Alimentos Disponibles')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={gcm.btnCancel} activeOpacity={0.7} onPress={onCancel}>
            <Text style={[gcm.btnCancelText, { color: colors.textMuted }]}>{t('common.cancel', 'Cancelar')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Weekly Reset Warning Modal ────────────────────────────────────────────────
interface ResetWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

function ResetWarningModal({ visible, onDismiss }: ResetWarningModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={gcm.overlay}>
        <View style={[gcm.card, { backgroundColor: colors.surface }]}>
          <View style={[gcm.iconCircle, { backgroundColor: colors.warning + '22', alignSelf: 'center', marginBottom: 16 }]}>
            <RefreshCw size={28} color={colors.warning} />
          </View>
          <Text style={[gcm.title, { color: colors.textPrimary }]}>
            {t('planner.resetWarningTitle', '¡Plan semanal por expirar!')}
          </Text>
          <Text style={[gcm.resetDesc, { color: colors.textSecondary }]}>
            {t('planner.resetWarningDesc', 'Esta noche a las 23:59 (domingo) tu plan semanal se reiniciará automáticamente. La próxima semana deberás generar un nuevo plan personalizado.')}
          </Text>
          <TouchableOpacity
            style={[gcm.btnPrimary]}
            activeOpacity={0.85}
            onPress={onDismiss}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={gcm.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={gcm.btnPrimaryText}>{t('common.understood', 'Entendido')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── AILoadingOverlay ────────────────────────────────────────────────────────
const AI_MESSAGES = {
  workouts: [
    "Analizando tu historial muscular...",
    "Calculando simetría y fatiga...",
    "Ajustando volumen e intensidad...",
    "Buscando ejercicios de reemplazo...",
    "Optimizando para sobrecarga progresiva...",
    "Finalizando tu plan perfecto..."
  ],
  nutrition: [
    "Analizando tus requerimientos calóricos...",
    "Equilibrando macros y micronutrientes...",
    "Seleccionando alimentos de tu preferencia...",
    "Evitando alergias y restricciones...",
    "Generando recetas fáciles y rápidas...",
    "Finalizando tu menú semanal..."
  ],
  analysis: [
    "Nutricionista leyendo tus macros...",
    "Revisando tus metas de calorías...",
    "Redactando consejos personalizados...",
    "Generando plan de acción..."
  ],
  bodyweight: [
    "Traduciendo a peso corporal...",
    "Buscando alternativas de calistenia...",
    "Ajustando la dificultad sin pesas...",
    "Casi listo..."
  ]
};

function AILoadingOverlay({ visible, mode }: { visible: boolean; mode: 'workouts' | 'nutrition' | 'analysis' | 'bodyweight' }) {
  const colors = useTheme();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }
    const msgs = AI_MESSAGES[mode];
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % msgs.length);
    }, 2000); // changes every 2 seconds
    return () => clearInterval(interval);
  }, [visible, mode]);

  if (!visible) return null;

  const msgs = AI_MESSAGES[mode];

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ backgroundColor: colors.surface, padding: 30, borderRadius: 28, alignItems: 'center', width: '85%', maxWidth: 340, shadowColor: colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: colors.primary + '55' }}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20, transform: [{ scale: 1.5 }] }} />
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center' }}>
          La IA está trabajando...
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', minHeight: 40, fontWeight: '500' }}>
          {msgs[msgIndex]}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Planner Screen ───────────────────────────────────────────────────────
export default function PlannerScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language, premiumColor } = useSettingsStore();
  const [mode, setMode]           = useState<PlannerMode>('nutrition');
  
  const jsDay = new Date().getDay();
  const todayAbbr = jsDay === 0 ? 'Sun' : DAYS[jsDay - 1];
  const [activeDay, setActiveDay] = useState(todayAbbr);
  const [energyMode, setEnergyMode] = useState<'low' | 'normal' | 'beast'>('normal');
  
  useFocusEffect(
    useCallback(() => {
      const currentJsDay = new Date().getDay();
      const currentAbbr = currentJsDay === 0 ? 'Sun' : DAYS[currentJsDay - 1];
      setActiveDay(currentAbbr);
    }, [])
  );

  const [loading, setLoading]     = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAdjustingBW, setIsAdjustingBW] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev! - 1);
      }, 1000);
    } else if (restTimer === 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const {
    mealPlans, workoutPlans, weeklyAnalysis: analysis, weekStart, warning,
    setMealPlans, setWorkoutPlans, setWeeklyAnalysis: setAnalysis, clearPlans,
    clearMealPlans, clearWorkoutPlans,
  } = usePlannerStore();

  const { addWorkout, hasCompletedWorkoutToday, clearHistory } = useWorkoutHistoryStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [generatingShoppingList, setGeneratingShoppingList] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { profile }               = useAuthStore();
  const [isHomeWorkout, setIsHomeWorkout] = useState(false);
  const [homeEquipment, setHomeEquipment] = useState('');
  const [expandedEqCategory, setExpandedEqCategory] = useState<string | null>(null);
  const [customWeightInput, setCustomWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg'|'lbs'>('kg');
  const [weightType, setWeightType] = useState<'Mancuernas'|'Kettlebell'>('Mancuernas');

  const handleToggleEquipment = (item: string) => {
    const arr = homeEquipment.split(',').map(s => s.trim()).filter(s => s);
    if (arr.includes(item)) {
      setHomeEquipment(arr.filter(i => i !== item).join(', '));
    } else {
      setHomeEquipment([...arr, item].join(', '));
    }
  };

  const handleAddCustomWeight = () => {
    if (!customWeightInput.trim() || isNaN(Number(customWeightInput.trim().replace(',', '.')))) return;
    const newItem = `${weightType} de ${customWeightInput.trim()}${weightUnit}`;
    handleToggleEquipment(newItem);
    setCustomWeightInput('');
  };

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [exerciseMetrics, setExerciseMetrics] = useState<Record<number, { weight: string, rpe: string }>>({});
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getGoalTranslation = () => {
    if (!profile?.goal) return t('planner.weekPlan', 'Plan Semanal');
    if (profile.goal === 'gain') return t('onboarding.gainTitle', 'Ganar Músculo');
    if (profile.goal === 'lose') return t('onboarding.loseTitle', 'Perder Grasa');
    return t('onboarding.stayTitle', 'Mantener Peso');
  };

  const [alert, setAlert] = useState<{
    visible: boolean; type: AlertType; title: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel?: () => void;
  }>({
    visible: false, type: 'info', title: '', message: '', onConfirm: () => {},
  });

  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
    setAlert({
      visible: true, type, title, message, onConfirm: () => { onConfirm?.(); setAlert(prev => ({ ...prev, visible: false })); },
    });
  };

  const { streakDays, dailyWater, todayLogs, addWater } = useNutritionStore();
  const { isPro }                 = usePurchaseStore();
  const isProActually = isPro || profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
  const isValidHex = !!(premiumColor && premiumColor.startsWith('#'));
  const safePremiumColor = isValidHex ? premiumColor! : '#7C5CFC';
  const isPremiumCustom = !!(isProActually && isValidHex);

  // ─── Load stored plans ─────────────────────────────────────────────────────
  useEffect(() => {
    async function loadStoredPlans() {
      if (!profile?.id) return;
      setInitialLoading(true);
      const currentWeekStart = getStartOfWeek(new Date());

      try {
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
              meal: item.meal, name: item.name, calories: item.calories,
              protein: item.protein, carbs: item.carbs, fat: item.fat,
            });
          });
          setMealPlans(grouped, currentWeekStart);
        } else if (Object.keys(mealPlans).length > 0 && weekStart === currentWeekStart) {
          // Already have cached plans for THIS week — skip DB overwrite
        } else {
          clearPlans();
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
            grouped[item.day_of_week] = {
              name: item.routine_name,
              exercises: item.exercises || []
            };
          });
          setWorkoutPlans(grouped, currentWeekStart);
        } else if (Object.keys(workoutPlans).length > 0 && weekStart === currentWeekStart) {
          // Already have cached plans for this week — skip overwrite
        } else {
          if (weekStart !== currentWeekStart) clearPlans();
        }
      } catch (err) {
        console.error('[Planner] Load error:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadStoredPlans();
  }, [profile?.id]);

  // ─── Sunday 23:59 Auto-Reset Logic ────────────────────────────────────────
  useEffect(() => {
    // Schedule the weekly reset at Sunday 23:59
    const scheduleWeeklyReset = () => {
      const msToReset = msUntilSundayReset();

      // Show warning 1 hour before reset if it's already Sunday
      if (isSunday()) {
        const msToWarning = msToReset - 60 * 60 * 1000; // 1 hour before
        if (msToWarning > 0) {
          resetWarningTimerRef.current = setTimeout(() => {
            setShowResetWarning(true);
          }, msToWarning);
        } else if (msToReset > 0) {
          // Less than 1 hour to reset — show warning immediately
          setShowResetWarning(true);
        }
      }

      // Schedule the actual reset
      resetTimerRef.current = setTimeout(() => {
        // Perform the reset
        clearPlans();
        supabase.from('meal_plans').delete().eq('user_id', profile?.id ?? '').then(() => {});
        supabase.from('workout_plans').delete().eq('user_id', profile?.id ?? '').then(() => {});
        // Schedule next week's reset
        scheduleWeeklyReset();
      }, msToReset);
    };

    scheduleWeeklyReset();

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (resetWarningTimerRef.current) clearTimeout(resetWarningTimerRef.current);
    };
  }, [profile?.id]);

  const handleGeneratePress = () => {
    if (!profile) return;
    if (!isProActually) { router.push('/modals/paywall'); return; }
    setShowConfirmModal(true);
  };

  const handleGenerateDayPress = () => {
    if (!profile) return;
    if (!isProActually) { router.push('/modals/paywall'); return; }
    handleGenerateDay(activeDay);
  };

  const handleGenerateDay = async (day: string) => {
    if (!profile) return;
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());

    try {
      if (mode === 'nutrition') {
        const parsedPlan = await generateDailyMealPlan({
          targetCalories: profile.targetCalories || 2000, macros: profile.macros || { protein: 150, carbs: 250, fat: 65 }, goal: profile.goal || 'maintain',
          availableFoods: profile.availableFoods, preferences: profile.preferences, age: profile.age,
          weight: profile.weight, height: profile.height, sex: profile.sex, activityLevel: profile.activityLevel,
          dietaryRestrictions: profile.dietaryRestrictions, medicalConditions: profile.medicalConditions,
          medicationsSupplements: profile.medicationsSupplements, tdee: profile.tdee,
        }, language, day);

        const newPlans = { ...mealPlans, [day]: parsedPlan[day] || [] };
        setMealPlans(newPlans, currentWeekStart);
        
        const { data: existing } = await supabase.from('meal_plans').select('id').eq('user_id', profile.id).eq('week_start', currentWeekStart).maybeSingle();
        let planId = existing?.id;
        if (!planId) {
          const { data: inserted } = await supabase.from('meal_plans').insert({
            user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart,
          }).select().single();
          planId = inserted?.id;
        }
        
        if (planId) {
          await supabase.from('meal_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day);
          const itemsToInsert = (parsedPlan[day] || []).map((m: any) => ({
            plan_id: planId, day_of_week: day, meal: m.meal, name: m.name, calories: m.calories,
            protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0,
          }));
          if (itemsToInsert.length > 0) await supabase.from('meal_plan_items').insert(itemsToInsert);
        }
      } else {
        const parsedPlan = await generateDailyWorkoutPlan({
          goal: profile.goal || 'maintain', activityLevel: profile.activityLevel, age: profile.age,
          weight: profile.weight, height: profile.height, sex: profile.sex, medicalConditions: profile.medicalConditions,
          medicationsSupplements: profile.medicationsSupplements, homeWorkout: isHomeWorkout, homeEquipment,
        }, language, day);

        const newPlans = { ...workoutPlans, [day]: parsedPlan[day] || { name: 'Descanso', exercises: [] } };
        setWorkoutPlans(newPlans, currentWeekStart);

        const { data: existing } = await supabase.from('workout_plans').select('id').eq('user_id', profile.id).eq('week_start', currentWeekStart).maybeSingle();
        let planId = existing?.id;
        if (!planId) {
          const { data: inserted } = await supabase.from('workout_plans').insert({
            user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart,
          }).select().single();
          planId = inserted?.id;
        }

        if (planId) {
          await supabase.from('workout_plan_items').delete().eq('plan_id', planId).eq('day_of_week', day);
          await supabase.from('workout_plan_items').insert([{
            plan_id: planId, day_of_week: day, routine_name: newPlans[day].name || t('planner.restDay', 'Rest Day'),
            exercises: newPlans[day].exercises || []
          }]);
        }
      }
      setShowSuccess(true);
    } catch (err: any) {
      showAlert('error', t('common.error'), err?.message ?? t('planner.analysisFailedSub'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Actual Generation ─────────────────────────────────────────────────────
  const handleGenerate = async (options?: { intensityMode: 'standard' | 'express' | 'heavy' | 'recovery', focusSymmetry: boolean }) => {
    if (!profile) return;
    setShowConfirmModal(false);
    setLoading(true);
    const currentWeekStart = getStartOfWeek(new Date());

    try {
      if (mode === 'nutrition') {
        clearMealPlans();
        const parsedPlan = await generateMealPlan({
          targetCalories: profile.targetCalories || 2000, macros: profile.macros || { protein: 150, carbs: 250, fat: 65 }, goal: profile.goal || 'maintain',
          availableFoods: profile.availableFoods, preferences: profile.preferences, age: profile.age,
          weight: profile.weight, height: profile.height, sex: profile.sex, activityLevel: profile.activityLevel,
          dietaryRestrictions: profile.dietaryRestrictions, medicalConditions: profile.medicalConditions,
          medicationsSupplements: profile.medicationsSupplements, tdee: profile.tdee,
        }, language);

        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setMealPlans(plansOnly, currentWeekStart, planWarning);
        await supabase.from('meal_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase.from('meal_plans').insert({
          user_id: profile.id, title: t('planner.weekPlan', 'Weekly AI Plan'), week_start: currentWeekStart,
        }).select().single();

        if (planData) {
          const itemsToInsert = DAYS.flatMap(day => ((plansOnly as Record<string, any[]>)[day] || []).map((m: any) => ({
            plan_id: planData.id, day_of_week: day, meal: m.meal, name: m.name, calories: m.calories,
            protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0,
          })));
          if (itemsToInsert.length > 0) await supabase.from('meal_plan_items').insert(itemsToInsert);
        }
      } else {
        clearWorkoutPlans();
        
        let focusMuscles: string[] = [];
        if (options?.focusSymmetry) {
          const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile.id);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          const cutoffStr = cutoff.toISOString().split('T')[0];
          
          const counts: Record<string, number> = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };
          workouts.filter(w => w.date >= cutoffStr).forEach(w => {
            w.exercises.forEach(ex => {
              const name = (ex.englishName || ex.name || '').toLowerCase();
              if (name.includes('press') && !name.includes('leg') && !name.includes('shoulder')) counts.chest++;
              if (name.includes('row') || name.includes('pull')) counts.back++;
              if (name.includes('squat') || name.includes('leg')) counts.legs++;
              if (name.includes('shoulder') || name.includes('lateral')) counts.shoulders++;
              if (name.includes('curl') || name.includes('tricep') || name.includes('extension')) counts.arms++;
              if (name.includes('crunch') || name.includes('plank') || name.includes('abs')) counts.core++;
            });
          });
          const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
          focusMuscles = sorted.slice(0, 2).map(x => x[0]);
        }

        const parsedPlan = await generateWorkoutPlan({
          goal: profile.goal, activityLevel: profile.activityLevel, age: profile.age,
          weight: profile.weight, height: profile.height, sex: profile.sex, medicalConditions: profile.medicalConditions,
          medicationsSupplements: profile.medicationsSupplements, homeWorkout: isHomeWorkout, homeEquipment,
          intensityMode: options?.intensityMode || 'standard',
          focusMuscles,
          energyMode,
        }, language);

        const { warning: planWarning, ...plansOnly } = parsedPlan as any;
        setWorkoutPlans(plansOnly, currentWeekStart, planWarning);
        await supabase.from('workout_plans').delete().eq('user_id', profile.id);
        const { data: planData } = await supabase.from('workout_plans').insert({
          user_id: profile.id, title: t('planner.workoutsTab', 'Weekly AI Workout'), week_start: currentWeekStart,
        }).select().single();

        if (planData) {
          const itemsToInsert = DAYS.map(day => ({
            plan_id: planData.id, day_of_week: day, routine_name: (plansOnly as Record<string, any>)[day]?.name || t('planner.restDay', 'Rest Day'),
            exercises: (plansOnly as Record<string, any>)[day]?.exercises || []
          }));
          await supabase.from('workout_plan_items').insert(itemsToInsert);
        }
      }
      setShowSuccess(true);
    } catch (err: any) {
      showAlert('error', t('common.error'), err?.message ?? t('planner.analysisFailedSub'));
    } finally {
      setLoading(false);
    }
  };

  const generateNutritionHTML = () => {
    const today = getLocalDateString();
    const exportWeekStart = getStartOfWeek(new Date());
    const weekEndDate = new Date(exportWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = getLocalDateString(weekEndDate);

    const MEAL_COLORS: Record<string, string> = {
      breakfast: '#F59E0B', lunch: '#10B981', dinner: '#7C5CFC', snack: '#3B82F6',
    };
    const MEAL_EMOJI: Record<string, string> = {
      breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
    };
    const DAY_LABELS: Record<string, string> = {
      Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles', Thu: 'Jueves',
      Fri: 'Viernes', Sat: 'Sábado', Sun: 'Domingo',
    };

    const totalCal = DAYS.reduce((acc, d) => acc + (mealPlans[d] || []).reduce((s: number, m: PlanItem) => s + (m.calories || 0), 0), 0);
    const totalProt = DAYS.reduce((acc, d) => acc + (mealPlans[d] || []).reduce((s: number, m: PlanItem) => s + (m.protein || 0), 0), 0);
    const activeDays = DAYS.filter(d => (mealPlans[d] || []).length > 0).length;

    let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Plan Nutricional</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #F0F4FF; color: #1E1B4B; -webkit-print-color-adjust: exact; }
      .page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
      .header { background: linear-gradient(135deg, #7C5CFC 0%, #4F46E5 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; color: white; display: flex; align-items: center; justify-content: space-between; }
      .header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
      .header-sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }
      .logo-badge { background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
      .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
      .summary-card { background: white; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .summary-card .val { font-size: 22px; font-weight: 800; color: #7C5CFC; }
      .summary-card .lbl { font-size: 11px; color: #6B7280; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .disclaimer { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #92400E; display: flex; gap: 8px; align-items: flex-start; }
      .day-card { background: white; border-radius: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); page-break-inside: avoid; }
      .day-header { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; background: #F9F7FF; border-bottom: 1px solid #EDE9FE; }
      .day-name { font-size: 18px; font-weight: 700; color: #4F46E5; }
      .day-totals { font-size: 12px; color: #6B7280; font-weight: 600; background: #EDE9FE; padding: 4px 10px; border-radius: 20px; }
      .meal-row { display: grid; grid-template-columns: 100px 1fr auto; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #F3F4F6; }
      .meal-row:last-child { border-bottom: none; }
      .meal-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: white; }
      .meal-name { font-size: 14px; font-weight: 500; color: #374151; line-height: 1.4; }
      .meal-macros { text-align: right; }
      .meal-kcal { font-size: 16px; font-weight: 800; color: #7C5CFC; }
      .meal-macro-row { font-size: 10px; color: #9CA3AF; margin-top: 2px; }
      .rest-day { text-align: center; padding: 24px; color: #9CA3AF; font-size: 15px; }
      .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9CA3AF; }
    </style></head><body><div class="page">`;

    html += `<div class="header"><div><div class="header-title">🥗 Plan Nutricional Semanal</div><div class="header-sub">FitGO &nbsp;·&nbsp; ${exportWeekStart} al ${weekEnd}</div></div><div class="logo-badge">💪</div></div>`;
    html += `<div class="summary-row"><div class="summary-card"><div class="val">${activeDays}</div><div class="lbl">Días planificados</div></div><div class="summary-card"><div class="val">${Math.round(activeDays > 0 ? totalCal / activeDays : 0)}</div><div class="lbl">kcal / día</div></div><div class="summary-card"><div class="val">${Math.round(activeDays > 0 ? totalProt / activeDays : 0)}g</div><div class="lbl">Proteína / día</div></div></div>`;
    html += `<div class="disclaimer"><span>⚠️</span><span>Este plan es generado por inteligencia artificial y NO reemplaza el consejo de un dietista o médico. Consulte a un profesional de la salud antes de seguir este plan.</span></div>`;

    DAYS.forEach(day => {
      const meals = mealPlans[day] || [];
      const dayLabel = DAY_LABELS[day] || day;
      const dayCalories = meals.reduce((s: number, m: PlanItem) => s + (m.calories || 0), 0);
      const dayProtein = meals.reduce((s: number, m: PlanItem) => s + (m.protein || 0), 0);
      const dayCarbs = meals.reduce((s: number, m: PlanItem) => s + (m.carbs || 0), 0);
      const dayFat = meals.reduce((s: number, m: PlanItem) => s + (m.fat || 0), 0);

      html += `<div class="day-card"><div class="day-header"><span class="day-name">${dayLabel}</span>`;
      if (meals.length > 0) {
        html += `<span class="day-totals">${dayCalories} kcal &nbsp;·&nbsp; P:${dayProtein}g C:${dayCarbs}g F:${dayFat}g</span>`;
      }
      html += `</div>`;

      if (meals.length === 0) {
        html += `<div class="rest-day">Sin comidas planificadas para este día</div>`;
      } else {
        meals.forEach((m: PlanItem) => {
          const color = MEAL_COLORS[m.meal] || '#7C5CFC';
          const emoji = MEAL_EMOJI[m.meal] || '🍽️';
          html += `<div class="meal-row"><div><div class="meal-badge" style="background:${color}">${emoji} ${m.meal}</div></div><div class="meal-name">${m.name}</div><div class="meal-macros"><div class="meal-kcal">${m.calories}</div><div class="meal-macro-row">P ${m.protein}g · C ${m.carbs}g · F ${m.fat}g</div></div></div>`;
        });
      }
      html += `</div>`;
    });

    html += `<div class="footer">Generado por FitGO · ${today} · Solo para referencia personal</div></div></body></html>`;
    return html;
  };

  const _UNUSED_generateNutritionHTML_old = () => {
    return '';
  };

  const generateWorkoutHTML = () => {
    const today = getLocalDateString();
    const exportWeekStart = getStartOfWeek(new Date());
    const weekEndDate = new Date(exportWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = getLocalDateString(weekEndDate);

    const DAY_LABELS: Record<string, string> = {
      Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles', Thu: 'Jueves',
      Fri: 'Viernes', Sat: 'Sábado', Sun: 'Domingo',
    };
    const ENERGY_LABELS: Record<string, string> = {
      low: '🔋 Agotado', normal: '⚡ Normal', beast: '🦍 Bestia',
    };

    const totalWorkoutDays = DAYS.filter(d => (workoutPlans[d]?.exercises?.length ?? 0) > 0).length;
    const totalExercises = DAYS.reduce((acc, d) => acc + (workoutPlans[d]?.exercises?.length ?? 0), 0);

    let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Rutina Semanal</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #F0F4FF; color: #1E1B4B; -webkit-print-color-adjust: exact; }
      .page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
      .header { background: linear-gradient(135deg, #7C5CFC 0%, #06B6D4 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; color: white; display: flex; align-items: center; justify-content: space-between; }
      .header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
      .header-sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }
      .logo-badge { background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
      .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      .summary-card { background: white; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .summary-card .val { font-size: 22px; font-weight: 800; color: #7C5CFC; }
      .summary-card .lbl { font-size: 11px; color: #6B7280; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .context-card { background: white; border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .context-pill { background: #EDE9FE; color: #6D28D9; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
      .disclaimer { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #92400E; display: flex; gap: 8px; align-items: flex-start; }
      .day-card { background: white; border-radius: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); page-break-inside: avoid; }
      .day-header { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; background: #F9F7FF; border-bottom: 1px solid #EDE9FE; }
      .day-name { font-size: 18px; font-weight: 700; color: #4F46E5; }
      .routine-name { font-size: 12px; color: #6D28D9; font-weight: 600; background: #EDE9FE; padding: 4px 10px; border-radius: 20px; }
      .rest-badge { font-size: 12px; color: #6B7280; background: #F3F4F6; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
      .ex-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #F3F4F6; }
      .ex-row:last-child { border-bottom: none; }
      .ex-num { font-size: 11px; font-weight: 800; color: #9CA3AF; margin-bottom: 3px; }
      .ex-name { font-size: 15px; font-weight: 600; color: #1E1B4B; }
      .ex-badges { display: flex; gap: 6px; flex-wrap: wrap; }
      .badge { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
      .badge-sets { background: #EDE9FE; color: #6D28D9; }
      .badge-reps { background: #DCFCE7; color: #166534; }
      .badge-rest { background: #FEF3C7; color: #92400E; }
      .rest-day { text-align: center; padding: 28px; color: #9CA3AF; font-size: 15px; }
      .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9CA3AF; }
    </style></head><body><div class="page">`;

    html += `<div class="header"><div><div class="header-title">🏋️ Rutina Semanal de Entrenamiento</div><div class="header-sub">FitGO &nbsp;·&nbsp; ${exportWeekStart} al ${weekEnd}</div></div><div class="logo-badge">🔥</div></div>`;
    html += `<div class="summary-row"><div class="summary-card"><div class="val">${totalWorkoutDays}</div><div class="lbl">Días de entreno</div></div><div class="summary-card"><div class="val">${totalExercises}</div><div class="lbl">Ejercicios totales</div></div><div class="summary-card"><div class="val">${ENERGY_LABELS[energyMode] || '⚡ Normal'}</div><div class="lbl">Energía</div></div></div>`;

    if (isHomeWorkout && homeEquipment) {
      const equipmentList = homeEquipment.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      if (equipmentList.length > 0) {
        html += `<div class="context-card"><span style="font-size:12px;font-weight:700;color:#6B7280;margin-right:4px;">🏠 Equipos:</span>`;
        equipmentList.forEach((eq: string) => { html += `<span class="context-pill">${eq}</span>`; });
        html += `</div>`;
      }
    }

    html += `<div class="disclaimer"><span>⚠️</span><span>Este plan es generado por inteligencia artificial y NO reemplaza el consejo de un entrenador certificado o médico. Consulte a un profesional antes de seguir este plan.</span></div>`;

    DAYS.forEach(day => {
      const workout = workoutPlans[day];
      const dayLabel = DAY_LABELS[day] || day;
      const isRest = !workout || (workout.exercises?.length ?? 0) === 0;

      html += `<div class="day-card"><div class="day-header"><span class="day-name">${dayLabel}</span>`;
      if (isRest) {
        html += `<span class="rest-badge">😴 Descanso</span>`;
      } else {
        html += `<span class="routine-name">${workout!.name}</span>`;
      }
      html += `</div>`;

      if (isRest) {
        html += `<div class="rest-day">Día de descanso — recupera energías 💤</div>`;
      } else {
        workout!.exercises.forEach((ex: any, i: number) => {
          html += `<div class="ex-row"><div><div class="ex-num">#${i + 1}</div><div class="ex-name">${ex.name}</div></div><div class="ex-badges"><span class="badge badge-sets">${ex.sets} series</span><span class="badge badge-reps">${ex.reps} reps</span><span class="badge badge-rest">⏱ ${ex.rest}</span></div></div>`;
        });
      }
      html += `</div>`;
    });

    html += `<div class="footer">Generado por FitGO · ${today} · Solo para referencia personal</div></div></body></html>`;
    return html;
  };

  const handleExportPDF = async () => {
    if (!isProActually) { router.push('/modals/paywall'); return; }
    try {
      const today = getLocalDateString();
      const exportWeekStart = getStartOfWeek(new Date());
      const weekEndDate = new Date(exportWeekStart);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const weekEnd = getLocalDateString(weekEndDate);
      const filename = `fitgo_${mode === 'nutrition' ? 'menu' : 'rutina'}_${today}.pdf`;
      const htmlContent = mode === 'nutrition' ? generateNutritionHTML() : generateWorkoutHTML();
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: filename });
    } catch (err) {
      console.error(err);
      showAlert('error', t('common.error'), 'Could not generate PDF');
    }
  };

  const handleExportShoppingList = async () => {
    if (!isProActually) { router.push('/modals/paywall'); return; }
    setGeneratingShoppingList(true);
    try {
      const today = getLocalDateString();
      const weekStart = getStartOfWeek(new Date());
      const categories = await generateShoppingListJSON(mealPlans, language);
      const totalItems = categories.reduce((acc: number, c: any) => acc + (c.items?.length ?? 0), 0);

      const CAT_COLORS: Record<string, string> = {
        default: '#7C5CFC',
        frutas: '#F59E0B', verduras: '#10B981', carnes: '#EF4444', lácteos: '#3B82F6',
        proteínas: '#F59E0B', granos: '#8B5CF6', cereales: '#8B5CF6',
        produce: '#10B981', meat: '#EF4444', dairy: '#3B82F6', pantry: '#8B5CF6',
        snacks: '#F97316', bebidas: '#06B6D4',
      };
      const CAT_EMOJI: Record<string, string> = {
        frutas: '🍎', verduras: '🥦', carnes: '#🥩', lácteos: '🥛',
        proteínas: '🥚', granos: '🌾', cereales: '🌾', snacks: '🍿',
        produce: '🥦', meat: '🥩', dairy: '🥛', pantry: '🥫', bebidas: '🥤',
      };

      let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Lista de Compras</title><style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #F0F4FF; color: #1E1B4B; -webkit-print-color-adjust: exact; }
        .page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; color: white; display: flex; align-items: center; justify-content: space-between; }
        .header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header-sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }
        .logo-badge { background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .summary-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card { background: white; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .summary-card .val { font-size: 22px; font-weight: 800; color: #F59E0B; }
        .summary-card .lbl { font-size: 11px; color: #6B7280; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .cat-card { background: white; border-radius: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); page-break-inside: avoid; }
        .cat-header { padding: 14px 20px; display: flex; align-items: center; gap: 10px; }
        .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .cat-name { font-size: 17px; font-weight: 700; color: #1E1B4B; }
        .cat-count { margin-left: auto; font-size: 12px; color: #9CA3AF; font-weight: 600; background: #F3F4F6; padding: 3px 10px; border-radius: 20px; }
        .item-row { display: flex; align-items: center; gap: 14px; padding: 12px 20px; border-top: 1px solid #F3F4F6; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #D1D5DB; border-radius: 4px; flex-shrink: 0; }
        .item-name { font-size: 14px; color: #374151; font-weight: 500; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9CA3AF; }
      </style></head><body><div class="page">`;

      html += `<div class="header"><div><div class="header-title">🛒 Lista de Compras</div><div class="header-sub">FitGO &nbsp;·&nbsp; Semana del ${weekStart}</div></div><div class="logo-badge">🥗</div></div>`;
      html += `<div class="summary-row"><div class="summary-card"><div class="val">${categories.length}</div><div class="lbl">Categorías</div></div><div class="summary-card"><div class="val">${totalItems}</div><div class="lbl">Productos totales</div></div></div>`;

      categories.forEach((cat: any) => {
        const key = (cat.category || '').toLowerCase();
        const color = CAT_COLORS[key] || CAT_COLORS['default'];
        const emoji = CAT_EMOJI[key] || '🛍️';
        html += `<div class="cat-card"><div class="cat-header"><div class="cat-dot" style="background:${color}"></div><span class="cat-name">${emoji} ${cat.category}</span><span class="cat-count">${cat.items?.length ?? 0} productos</span></div>`;
        (cat.items || []).forEach((item: string) => {
          html += `<div class="item-row"><div class="checkbox"></div><span class="item-name">${item}</span></div>`;
        });
        html += `</div>`;
      });

      html += `<div class="footer">Generado por FitGO · ${today} · Marca los productos conforme los compras ✅</div></div></body></html>`;

      const filename = `fitgo_lista_compras_${weekStart}.pdf`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: filename });
    } catch (err) {
      console.error(err);
      showAlert('error', t('common.error'), 'No se pudo generar la lista de compras');
    } finally {
      setGeneratingShoppingList(false);
    }
  };

  const handleWeeklyAnalysis = async () => {
    if (!isProActually) { router.push('/modals/paywall'); return; }
    setAnalyzing(true);
    try {
      const stats = useNutritionStore.getState().todayLogs ? selectDailyTotals(useNutritionStore.getState()) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const res = await generateWeeklyAnalysis({
        avgCalories: stats.calories, targetCalories: profile?.targetCalories ?? 2000,
        avgProtein: stats.protein, avgCarbs: stats.carbs, avgFat: stats.fat,
        goal: profile?.goal ?? 'maintain', daysLogged: streakDays,
      }, language);
      setAnalysis(res);
    } catch (err) {
      showAlert('error', t('planner.analysisFailed'), t('planner.analysisFailedSub'));
    } finally {
      setAnalyzing(false);
    }
  };

  const meals    = mealPlans[activeDay] ?? [];
  const totalCal = meals.reduce((a, m) => a + m.calories, 0);
  const workout  = workoutPlans[activeDay];

  const hasData = mode === 'nutrition' ? Object.keys(mealPlans).length > 0 : Object.keys(workoutPlans).length > 0;

  // ─── Workout completion logic ───────────────────────────────────────────────
  // Map planner day abbreviation (Mon, Tue...) to an ISO date for this week
  const getDayDate = (dayAbbr: string) => {
    const dayIndex = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(dayAbbr);
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const target = new Date(monday);
    target.setDate(monday.getDate() + dayIndex);
    return getLocalDateString(target);
  };

  const activeDayDate = getDayDate(activeDay);
  const todayDate = getLocalDateString();
  const isActiveToday = activeDayDate === todayDate;
  const alreadyCompleted = hasCompletedWorkoutToday(activeDayDate);

  const consumedMacros = React.useMemo(() => {
    if (!isActiveToday) return { p: 0, c: 0, f: 0 };
    return todayLogs.filter(l => l.loggedAt.startsWith(todayDate)).reduce((acc, l) => {
      acc.p += l.protein || 0;
      acc.c += l.carbs || 0;
      acc.f += l.fat || 0;
      return acc;
    }, { p: 0, c: 0, f: 0 });
  }, [isActiveToday, todayLogs, todayDate]);
  
  const plannedMacros = React.useMemo(() => {
    return meals.reduce((acc, m) => {
      acc.p += m.protein || 0;
      acc.c += m.carbs || 0;
      acc.f += m.fat || 0;
      return acc;
    }, { p: 0, c: 0, f: 0 });
  }, [meals]);

  const waterToday = dailyWater[todayDate] || 0;

  const handleMoveExercise = async (index: number, direction: -1 | 1) => {
    if (!workout || workout.exercises.length === 0) return;
    const newExercises = [...workout.exercises];
    if (index + direction < 0 || index + direction >= newExercises.length) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const temp = newExercises[index];
    newExercises[index] = newExercises[index + direction];
    newExercises[index + direction] = temp;
    
    const updatedWorkout = { ...workout, exercises: newExercises };
    const updatedPlans = { ...workoutPlans, [activeDay]: updatedWorkout };
    setWorkoutPlans(updatedPlans, weekStart || getStartOfWeek(new Date()), warning || undefined);
    
    if (profile?.id) {
      await supabase.from('workout_plan_items')
        .update({ exercises: newExercises })
        .eq('user_id', profile.id)
        .eq('day_of_week', activeDay);
    }
  };

  const handleCompleteWorkout = () => {
    if (!workout || workout.exercises.length === 0 || alreadyCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfettiTrigger(prev => prev + 1);
    addWorkout({
      date: activeDayDate,
      routineName: workout.name,
      exercises: workout.exercises.map((ex: any, i: number) => ({ 
        name: ex.name, 
        englishName: ex.englishName, 
        sets: ex.sets, 
        reps: ex.reps,
        weight: exerciseMetrics[i]?.weight,
        rpe: exerciseMetrics[i]?.rpe
      })),
    });
  };

  const getPreviousRPE = (exerciseName: string) => {
    const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile?.id);
    const sorted = [...workouts].sort((a, b) => b.completedAt - a.completedAt);
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if ((ex.englishName || ex.name) === exerciseName && ex.rpe) {
          return parseInt(ex.rpe);
        }
      }
    }
    return null;
  };

  const handleAdjustWorkout = async (type: 'up' | 'down' | 'bodyweight') => {
    if (!workout || workout.exercises.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === 'up' || type === 'down') {
      const newExercises = workout.exercises.map((ex: any) => {
        let sets = ex.sets;
        if (type === 'up') sets += 1;
        if (type === 'down' && sets > 1) sets -= 1;
        return { ...ex, sets };
      });
      const updatedWorkout = { ...workout, exercises: newExercises };
      const updatedPlans = { ...workoutPlans, [activeDay]: updatedWorkout };
      setWorkoutPlans(updatedPlans, weekStart || getStartOfWeek(new Date()), warning || undefined);
      if (profile?.id) {
        supabase.from('workout_plan_items')
          .update({ exercises: newExercises })
          .eq('user_id', profile.id)
          .eq('day_of_week', activeDay).then();
      }
      return;
    }

    if (type === 'bodyweight') {
      setIsAdjustingBW(true);
      try {
        const { adjustWorkoutToBodyweight } = require('../../../services/groq');
        const adjusted = await adjustWorkoutToBodyweight(workout.name, workout.exercises, language);
        
        const updatedWorkout = { ...workout, exercises: adjusted.exercises, name: adjusted.name };
        const updatedPlans = { ...workoutPlans, [activeDay]: updatedWorkout };
        setWorkoutPlans(updatedPlans, weekStart || getStartOfWeek(new Date()), warning || undefined);
        if (profile?.id) {
          supabase.from('workout_plan_items')
            .update({ exercises: adjusted.exercises, routine_name: adjusted.name })
            .eq('user_id', profile.id)
            .eq('day_of_week', activeDay).then();
        }
      } catch (err) {
        showAlert('error', t('common.error'), 'No se pudo ajustar el entrenamiento.');
      } finally {
        setIsAdjustingBW(false);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <Confetti trigger={confettiTrigger} />
      <SafeAreaView style={[s.safe, { backgroundColor: 'transparent' }]}>
      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onConfirm={alert.onConfirm} />

      {/* Pre-generation confirmation modal */}
      <AILoadingOverlay 
        visible={loading || analyzing || isAdjustingBW} 
        mode={loading ? mode : analyzing ? 'analysis' : 'bodyweight'} 
      />

      <GenerateConfirmModal
        visible={showConfirmModal}
        onConfirm={handleGenerate}
        onChangeFoods={() => {
          setShowConfirmModal(false);
          router.push('/modals/health-profile');
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

      {/* Sunday reset warning */}
      <ResetWarningModal
        visible={showResetWarning}
        onDismiss={() => setShowResetWarning(false)}
      />

      {/* Floating Rest Timer */}
      {restTimer !== null && (
        <TouchableOpacity 
          style={[s.floatingTimer, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
          onPress={() => setRestTimer(null)}
        >
          <Activity size={24} color={colors.primary} />
          <View style={{ minWidth: 60 }}>
            <Text style={[s.timerTitle, { color: colors.textPrimary }]}>Descanso</Text>
            <Text style={[s.timerValue, { color: colors.primary }]}>
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <X size={20} color={colors.textMuted} style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Header Area */}
        <View style={s.header}>
          <View style={s.headerTextWrap}>
            <Text style={[s.title, { color: colors.textPrimary }]}>{t('planner.title')}</Text>
            {profile?.name && (
              <Text style={[s.subtitle, { color: colors.primary, fontWeight: '700', fontSize: 16, marginBottom: 2 }, getNameStyle(profile?.nameColor)]}>
                {t('common.greeting', 'Hola')}, {profile.name}!
              </Text>
            )}
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              {profile?.goal ? `${t('planner.planFor', 'Plan para:')} ${getGoalTranslation()}` : t('planner.weekPlan')}
            </Text>
          </View>

          <TouchableOpacity style={[s.genBtn, { shadowColor: safePremiumColor }]} activeOpacity={0.8} onPress={() => handleGeneratePress()} disabled={loading}>
            <LinearGradient 
              colors={
                mode === 'workouts' 
                  ? (energyMode === 'low' ? ['#06B6D4', '#0891B2'] : energyMode === 'beast' ? ['#EF4444', '#B91C1C'] : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary))
                  : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
              } 
              style={s.genGrad} start={{x:0,y:0}} end={{x:1,y:1}}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> :
               <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                 <Sparkles size={16} color="#fff" />
                 <Text style={s.genText}>{t('planner.generate')}</Text>
               </View>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View style={s.toggleContainer}>
          <View style={[s.tabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            {(['nutrition', 'workouts'] as PlannerMode[]).map((m) => {
              const isActive = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[s.tab, isActive && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.8}
                >
                  <View style={s.tabContent}>
                    {m === 'nutrition' ? <Utensils size={16} color={isActive ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} /> : <Dumbbell size={16} color={isActive ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textMuted} />}
                    <Text style={[s.tabText, { color: isActive ? (isPremiumCustom ? safePremiumColor : colors.primary) : colors.textSecondary }]}>
                      {m === 'nutrition' ? t('planner.nutritionTab') : t('planner.workoutsTab')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <DayPicker active={activeDay} onSelect={setActiveDay} isPremiumCustom={isPremiumCustom} premiumColor={safePremiumColor} />

        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity 
            style={[s.genBtn, { width: '100%', marginBottom: 12, shadowColor: safePremiumColor }]} 
            activeOpacity={0.8} 
            onPress={handleGenerateDayPress} 
            disabled={loading}
          >
            <LinearGradient 
              colors={
                mode === 'workouts' 
                  ? (energyMode === 'low' ? ['#06B6D4', '#0891B2'] : energyMode === 'beast' ? ['#EF4444', '#B91C1C'] : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary))
                  : (isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : colors.gradientPrimary)
              } 
              style={[s.genGrad, { justifyContent: 'center', paddingVertical: 12 }]} start={{x:0,y:0}} end={{x:1,y:1}}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> :
               <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                 <Sparkles size={16} color="#fff" />
                 <Text style={s.genText}>Generar Únicamente {t(`planner.${activeDay.toLowerCase()}`)}</Text>
               </View>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Energy Meter UI (Moved inside ScrollView) */}
        {mode === 'workouts' && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20, marginTop: 12 }}>
             <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>¿Cómo te sientes hoy?</Text>
             <View style={{ flexDirection: 'row', gap: 8 }}>
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={() => {
                   setEnergyMode('low');
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                 }}
                 style={{ flex: 1, paddingVertical: 10, backgroundColor: energyMode === 'low' ? '#06B6D420' : colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: energyMode === 'low' ? '#06B6D4' : colors.border, alignItems: 'center' }}>
                 <Text style={{ fontSize: 20 }}>🔋</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: energyMode === 'low' ? '#06B6D4' : colors.textMuted, marginTop: 4 }}>Agotado</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={() => {
                   setEnergyMode('normal');
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                 }}
                 style={{ flex: 1, paddingVertical: 10, backgroundColor: energyMode === 'normal' ? colors.primary + '20' : colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: energyMode === 'normal' ? colors.primary : colors.border, alignItems: 'center' }}>
                 <Text style={{ fontSize: 20 }}>⚡</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: energyMode === 'normal' ? colors.primary : colors.textMuted, marginTop: 4 }}>Normal</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={() => {
                   setEnergyMode('beast');
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                   setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
                 }}
                 style={{ flex: 1, paddingVertical: 10, backgroundColor: energyMode === 'beast' ? '#EF444420' : colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: energyMode === 'beast' ? '#EF4444' : colors.border, alignItems: 'center' }}>
                 <Text style={{ fontSize: 20 }}>🦍</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: energyMode === 'beast' ? '#EF4444' : colors.textMuted, marginTop: 4 }}>Bestia</Text>
               </TouchableOpacity>
             </View>
          </View>
        )}

        {mode === 'workouts' && (
          <View style={{ marginBottom: Spacing.lg }}>
            <View style={[s.homeWorkoutWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginBottom: isHomeWorkout ? 12 : 0 }]}>
              <View style={{flex: 1}}>
                <Text style={[s.homeWorkoutTitle, { color: colors.textPrimary }]}>{t('planner.homeWorkoutTitle', 'Entrenamiento en Casa')}</Text>
                <Text style={[s.homeWorkoutSub, { color: colors.textSecondary }]}>{t('planner.homeWorkoutSub', 'Solo calistenia y peso corporal')}</Text>
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
                <Text style={[s.equipmentTitle, { color: colors.textPrimary }]}>{t('planner.equipmentTitle', 'Implementos Adicionales')}</Text>
                <Text style={[s.equipmentSub, { color: colors.textSecondary }]}>{t('planner.equipmentSub', '¿Qué equipo tienes disponible?')}</Text>
                
                <View style={{ marginTop: 12 }}>
                  {[
                    { id: 'basics', title: 'Básicos de Calistenia', items: ['Barra de dominadas', 'Barras paralelas', 'Anillas de gimnasia', 'Chaleco lastrado'] },
                    { id: 'bands', title: 'Bandas y Resistencia', items: ['Bandas elásticas tubulares', 'Bandas de resistencia (loops)', 'TRX / Suspensión'] },
                    { id: 'accessories', title: 'Accesorios Adicionales', items: ['Tapete / Mat', 'Rueda abdominal', 'Cuerda para saltar', 'Banco ajustable'] },
                    { id: 'weights', title: 'Pesas y Mancuernas', items: [] },
                  ].map((cat) => {
                    const isExpanded = expandedEqCategory === cat.id;
                    return (
                      <View key={cat.id} style={{ marginBottom: 8, backgroundColor: colors.background, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}
                          onPress={() => setExpandedEqCategory(isExpanded ? null : cat.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{cat.title}</Text>
                          {isExpanded ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
                        </TouchableOpacity>
                        
                        {isExpanded && (
                          <View style={{ padding: 12, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.border + '50', marginTop: 4 }}>
                            {cat.id === 'weights' ? (
                              <View>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                  <TouchableOpacity 
                                    style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: weightType === 'Mancuernas' ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: weightType === 'Mancuernas' ? colors.primary : colors.border }}
                                    onPress={() => setWeightType('Mancuernas')}
                                  ><Text style={{ color: weightType === 'Mancuernas' ? colors.primary : colors.textMuted, fontWeight: '600', fontSize: 13 }}>Mancuernas</Text></TouchableOpacity>
                                  <TouchableOpacity 
                                    style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: weightType === 'Kettlebell' ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: weightType === 'Kettlebell' ? colors.primary : colors.border }}
                                    onPress={() => setWeightType('Kettlebell')}
                                  ><Text style={{ color: weightType === 'Kettlebell' ? colors.primary : colors.textMuted, fontWeight: '600', fontSize: 13 }}>Kettlebells</Text></TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                  <TextInput
                                    style={{ flex: 1, backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}
                                    placeholder="Ej: 5"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={customWeightInput}
                                    onChangeText={setCustomWeightInput}
                                  />
                                  <TouchableOpacity 
                                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: weightUnit === 'kg' ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: weightUnit === 'kg' ? colors.primary : colors.border, justifyContent: 'center' }}
                                    onPress={() => setWeightUnit('kg')}
                                  ><Text style={{ color: weightUnit === 'kg' ? colors.primary : colors.textMuted, fontWeight: '600' }}>kg</Text></TouchableOpacity>
                                  <TouchableOpacity 
                                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: weightUnit === 'lbs' ? colors.primary + '20' : colors.surfaceAlt, borderWidth: 1, borderColor: weightUnit === 'lbs' ? colors.primary : colors.border, justifyContent: 'center' }}
                                    onPress={() => setWeightUnit('lbs')}
                                  ><Text style={{ color: weightUnit === 'lbs' ? colors.primary : colors.textMuted, fontWeight: '600' }}>lb</Text></TouchableOpacity>
                                  <TouchableOpacity 
                                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center' }}
                                    onPress={handleAddCustomWeight}
                                  ><Plus size={16} color="#fff" /></TouchableOpacity>
                                </View>
                              </View>
                            ) : null}

                            <View style={s.equipmentChips}>
                              {(cat.id === 'weights' 
                                ? homeEquipment.split(',').map(s => s.trim()).filter(s => s.includes('Mancuerna') || s.includes('Kettlebell') || s.includes('Pesa')) 
                                : cat.items
                              ).map((item) => {
                                const arr = homeEquipment.split(',').map(s => s.trim());
                                const isSelected = arr.includes(item);
                                if (cat.id === 'weights' && !isSelected) return null;
                                return (
                                  <TouchableOpacity
                                    key={item}
                                    style={[s.equipmentChip, isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                                    onPress={() => handleToggleEquipment(item)}
                                  >
                                    <Text style={[s.equipmentChipText, { color: isSelected ? '#fff' : colors.textPrimary }]}>{item}</Text>
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
                    placeholder={t('planner.equipmentPlaceholder', 'Opcional: Detalles adicionales (ej: banda verde fuerte)...')}
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

        {/* ── Collapsible Warnings Section ── */}
        {hasData && (
          <View style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.md }}>
            <TouchableOpacity 
              style={[s.aiDisclaimerBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginHorizontal: 0, marginBottom: 0 }]}
              onPress={() => setShowWarnings(!showWarnings)}
              activeOpacity={0.8}
            >
              <View style={[s.aiDisclaimerRow, { alignItems: 'center' }]}>
                <AlertTriangle size={18} color={warning ? colors.error : colors.warning} />
                <Text style={[s.aiDisclaimerTitle, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}>
                  {t('planner.warningsTitle', 'Advertencias y Precauciones')}
                </Text>
                {showWarnings ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
              </View>
            </TouchableOpacity>

            {showWarnings && (
              <View style={{ marginTop: 8, gap: 8 }}>
                {/* Prominent AI Disclaimer Banner */}
                <View style={[s.aiDisclaimerBanner, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '33', marginHorizontal: 0, marginBottom: 0 }]}>
                  <View style={s.aiDisclaimerRow}>
                    <View style={[s.aiDisclaimerIcon, { backgroundColor: colors.primary + '20' }]}>
                      <ShieldAlert size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.aiDisclaimerTitle, { color: colors.primary }]}>
                        {t('planner.aiDisclaimerTitle', 'Plan generado por IA')}
                      </Text>
                      <Text style={[s.aiDisclaimerText, { color: colors.textSecondary }]}>
                        {t('planner.aiDisclaimerText', 'Este plan es orientativo y no reemplaza el asesoramiento de un dietista o médico profesional. Consulta a un especialista antes de realizar cambios significativos en tu alimentación o entrenamiento.')}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Additional disclaimer in Routines section always visible per user request */}
                <View style={[s.aiDisclaimerBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '40', marginHorizontal: 0, marginBottom: 0 }]}>
                  <View style={s.aiDisclaimerRow}>
                    <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.aiDisclaimerTitle, { color: colors.warning }]}>
                        {t('planner.workoutWarningTitle', 'Advertencia de Entrenamiento')}
                      </Text>
                      <Text style={[s.aiDisclaimerText, { color: colors.textSecondary }]}>
                        {t('planner.workoutWarningText', 'Realiza los ejercicios bajo tu propia responsabilidad. Si sientes dolor, detente inmediatamente. Asegúrate de calentar antes de iniciar y verificar la técnica.')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* AI Safety Warning from plan - always visible inside accordion per user request */}
                <View style={[s.warningBox, { backgroundColor: colors.error + '10', borderColor: colors.error + '30', marginHorizontal: 0, marginBottom: 0 }]}>
                  <View style={s.warningHeader}>
                    <Text style={{ fontSize: 18 }}>⚠️</Text>
                    <Text style={[s.warningTitle, { color: colors.error }]}>{t('common.warning', 'Advertencia')}</Text>
                  </View>
                  <Text style={[s.warningText, { color: colors.textPrimary }]}>
                    {warning || t('planner.defaultAIWarning', 'Advertencia: soy una inteligencia artificial y no un profesional certificado en entrenamiento físico. Antes de seguir este plan de entrenamiento, es importante que consultes a un profesional de la salud o un entrenador personal para asegurarte de que es adecuado para tus necesidades y condiciones individuales.')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Weekly Analysis Section */}
        {mode === 'nutrition' && (
          <View style={[s.analysisWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.analysisHeader}>
              <View style={s.analysisTitleRow}>
                <Activity size={18} color={colors.primary} />
                <Text style={[s.analysisTitle, { color: colors.textPrimary }]}>{t('planner.aiReview')}</Text>
              </View>
              <TouchableOpacity onPress={handleWeeklyAnalysis} disabled={analyzing} style={[s.analysisBtn, {backgroundColor: colors.primary + '15'}]}>
                <Text style={[s.analysisBtnText, { color: colors.primary }]}>{analysis ? t('planner.regenerate') : t('planner.analyze')}</Text>
              </TouchableOpacity>
            </View>
            {analyzing ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
            ) : analysis ? (
              <View style={[s.analysisContent, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[s.analysisText, { color: colors.textSecondary }]}>{analysis}</Text>
              </View>
            ) : (
              <Text style={[s.analysisPlaceholder, { color: colors.textMuted }]}>{t('planner.reviewPlaceholder')}</Text>
            )}
          </View>
        )}

        {/* Calorie summary */}
        {mode === 'nutrition' && meals.length > 0 && (
          <View style={s.summaryContainer}>
            <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.summaryLeft}>
                <Text style={[s.summaryVal, { color: colors.textPrimary }]}>{totalCal}</Text>
                <Text style={[s.summaryLbl, { color: colors.textMuted }]}>{t('planner.planned')} (kcal)</Text>
              </View>
              <View style={[s.summaryDivider, { backgroundColor: colors.border + '50' }]} />
              <View style={s.summaryRight}>
                <Text style={[s.summaryVal, { color: colors.primary }]}>{Math.max((profile?.targetCalories ?? 2000) - totalCal, 0)}</Text>
                <Text style={[s.summaryLbl, { color: colors.textMuted }]}>{t('tracker.remaining')}</Text>
              </View>
            </View>

            {/* Macro Progress Bars */}
            {isActiveToday && plannedMacros.p > 0 && (
              <View style={[s.macroBarsWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <Text style={[s.macroTitle, { color: colors.textPrimary }]}>Progreso de Macros (Hoy)</Text>
                 <View style={s.macroBarRow}>
                   <Text style={[s.macroLabel, { color: colors.protein }]}>P</Text>
                   <View style={[s.macroTrack, { backgroundColor: colors.protein + '20' }]}>
                     <View style={[s.macroFill, { backgroundColor: colors.protein, width: `${Math.min((consumedMacros.p / plannedMacros.p) * 100, 100)}%` }]} />
                   </View>
                   <Text style={[s.macroVal, { color: colors.textSecondary }]}>{consumedMacros.p}/{plannedMacros.p}g</Text>
                 </View>
                 <View style={s.macroBarRow}>
                   <Text style={[s.macroLabel, { color: colors.carbs }]}>C</Text>
                   <View style={[s.macroTrack, { backgroundColor: colors.carbs + '20' }]}>
                     <View style={[s.macroFill, { backgroundColor: colors.carbs, width: `${Math.min((consumedMacros.c / plannedMacros.c) * 100, 100)}%` }]} />
                   </View>
                   <Text style={[s.macroVal, { color: colors.textSecondary }]}>{consumedMacros.c}/{plannedMacros.c}g</Text>
                 </View>
                 <View style={s.macroBarRow}>
                   <Text style={[s.macroLabel, { color: colors.fat }]}>F</Text>
                   <View style={[s.macroTrack, { backgroundColor: colors.fat + '20' }]}>
                     <View style={[s.macroFill, { backgroundColor: colors.fat, width: `${Math.min((consumedMacros.f / plannedMacros.f) * 100, 100)}%` }]} />
                   </View>
                   <Text style={[s.macroVal, { color: colors.textSecondary }]}>{consumedMacros.f}/{plannedMacros.f}g</Text>
                 </View>
              </View>
            )}

            {/* Hydration Tracker */}
            {isActiveToday && (
              <View style={[s.hydrationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <View style={s.hydroLeft}>
                    <View style={[s.hydroIcon, { backgroundColor: '#3b82f622' }]}>
                      <Droplets size={24} color="#3b82f6" />
                    </View>
                    <View>
                      <Text style={[s.hydroTitle, { color: colors.textPrimary }]}>Agua (Hoy)</Text>
                      <Text style={[s.hydroVal, { color: '#3b82f6' }]}>{waterToday} ml</Text>
                    </View>
                 </View>
                 <TouchableOpacity 
                   style={[s.hydroBtn, { backgroundColor: '#3b82f6' }]} 
                   onPress={() => {
                     addWater(250);
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   }}
                 >
                    <Plus size={16} color="#fff" />
                    <Text style={s.hydroBtnText}>Vaso (250ml)</Text>
                 </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={s.contentList}>
          {mode === 'nutrition' ? (
            <>
              {meals.length > 0 ? (
                meals.map((m: PlanItem, i: number) => (
                  <AnimatedCard key={`${i}-${m.name}`} index={i} direction="up">
                    <MemoizedMealCard day={activeDay} index={i} name={m.name} meal={m.meal} cal={m.calories} protein={m.protein} carbs={m.carbs} fat={m.fat} />
                  </AnimatedCard>
                ))
              ) : (
                <EmptyState title={t('planner.noMeals')} loading={loading} isPro={isProActually} onUnlock={() => router.push('/modals/paywall')} />
              )}

              {meals.length > 0 && (
                <TouchableOpacity
                  style={[s.addMealBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'nutritionist', prompt: t('planner.askCustomMeal', 'Suggest another healthy meal for today that fits my remaining macros.') } })}
                >
                  <Text style={[s.addMealIcon, { color: colors.primary }]}>+</Text>
                  <Text style={[s.addMealText, { color: colors.textSecondary }]}>{t('planner.addAnotherMeal', 'Añadir otra comida')}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            workout ? (
              <View style={s.workoutRoutine}>
                {(workout.exercises?.length || 0) > 0 ? (
                  <>
                    <View style={s.routineHeaderCompact}>
                      <Text style={[s.routineName, { color: colors.textPrimary }]}>{workout.name}</Text>
                      <View style={[s.workoutBadge, {backgroundColor: colors.primary + '15'}]}>
                         <Text style={[s.workoutBadgeText, {color: colors.primary}]}>{workout.exercises?.length || 0} Exercises</Text>
                      </View>
                    </View>
                    {(workout.exercises || []).map((ex: any, i: number) => (
                      <AnimatedCard key={i} index={i} direction="up">
                        <View style={[s.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <View style={s.exerciseHeader}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={[s.exerciseName, { color: colors.textPrimary }]} numberOfLines={2}>{ex.name}</Text>
                              {(() => {
                                const prevRPE = getPreviousRPE(ex.englishName || ex.name);
                                if (prevRPE !== null && prevRPE < 7) {
                                  return (
                                    <View style={{ backgroundColor: '#F59E0B22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }}>
                                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>🚀 ¡Subiste de nivel! +5% peso o +2 reps</Text>
                                    </View>
                                  );
                                }
                                return null;
                              })()}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {i > 0 && (
                                <TouchableOpacity onPress={() => handleMoveExercise(i, -1)} style={{ padding: 4 }}>
                                  <ChevronUp size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                              )}
                              {i < workout.exercises.length - 1 && (
                                <TouchableOpacity onPress={() => handleMoveExercise(i, 1)} style={{ padding: 4 }}>
                                  <ChevronDown size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                              )}
                              <View style={[s.exerciseBadge, { backgroundColor: colors.primary + '15', marginLeft: 4 }]}>
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{ex.sets} SETS</Text>
                              </View>
                            </View>
                          </View>
                          <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', paddingTop: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 14 }}>
                              <View style={[s.metaItem, { backgroundColor: colors.background }]}>
                                <Text style={[s.metaLabel, { color: colors.textMuted }]}>{t('planner.reps', 'Reps')}</Text>
                                <Text style={[s.metaValue, { color: colors.textPrimary }]}>{ex.reps}</Text>
                              </View>
                              <TouchableOpacity 
                                style={[s.metaItem, { backgroundColor: colors.background }]}
                                activeOpacity={0.7}
                                onPress={() => setRestTimer(parseInt(ex.rest) || 90)}
                              >
                                <Text style={[s.metaLabel, { color: colors.textMuted }]}>{t('planner.rest', 'Rest')} (Tap)</Text>
                                <Text style={[s.metaValue, { color: colors.primary }]}>{ex.rest} ⏱️</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 14 }}>
                              <View style={[s.metaItem, { backgroundColor: colors.background }]}>
                                <Text style={[s.metaLabel, { color: colors.textMuted }]}>Carga (Kg)</Text>
                                <TextInput
                                  style={[s.metaInput, { color: colors.textPrimary }]}
                                  placeholder="--"
                                  placeholderTextColor={colors.textMuted}
                                  keyboardType="numeric"
                                  value={exerciseMetrics[i]?.weight || ''}
                                  onChangeText={(text) => setExerciseMetrics(prev => ({ ...prev, [i]: { ...prev[i], weight: text } }))}
                                  returnKeyType="done"
                                />
                              </View>
                              <View style={[s.metaItem, { backgroundColor: colors.background }]}>
                                <Text style={[s.metaLabel, { color: colors.textMuted }]}>RPE (1-10)</Text>
                                <TextInput
                                  style={[s.metaInput, { color: colors.textPrimary }]}
                                  placeholder="--"
                                  placeholderTextColor={colors.textMuted}
                                  keyboardType="numeric"
                                  value={exerciseMetrics[i]?.rpe || ''}
                                  onChangeText={(text) => setExerciseMetrics(prev => ({ ...prev, [i]: { ...prev[i], rpe: text } }))}
                                  returnKeyType="done"
                                />
                              </View>
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>
                              * Estos valores se guardarán en tu progreso al completar el entrenamiento.
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{ marginTop: 12, alignSelf: 'flex-start' }}
                            onPress={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'trainer', prompt: `¿Cómo se hace el ejercicio: ${ex.name}? ¿Qué significa ${ex.sets} sets de ${ex.reps}?` } })}
                          >
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>{t('planner.askExercise', '¿Cómo hacerlo?')} ›</Text>
                          </TouchableOpacity>
                        </View>
                      </AnimatedCard>
                    ))}

                    {/* Botones de Ajuste Diario */}
                    {!alreadyCompleted && (
                      <View style={{ gap: 8, marginTop: 12, marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginLeft: 4 }}>Ajuste Rápido de Dificultad</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                            onPress={() => handleAdjustWorkout('down')}
                          >
                            <Text style={{ fontSize: 18 }}>🔽</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>-20% Inten.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                            onPress={() => handleAdjustWorkout('up')}
                          >
                            <Text style={{ fontSize: 18 }}>🔼</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>+20% Inten.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                            onPress={() => handleAdjustWorkout('bodyweight')}
                            disabled={isAdjustingBW}
                          >
                            {isAdjustingBW ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontSize: 18 }}>🏠</Text>}
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textAlign: 'center' }}>Sin Equipo</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Focus Mode Button */}
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/modals/focus-mode', params: { day: activeDay } })}
                      style={[
                        s.completeBtn,
                        { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: 20 }
                      ]}
                      activeOpacity={0.8}
                    >
                      <Play size={20} color="#fff" style={{ marginLeft: 4 }} />
                      <Text style={[s.completeBtnText, { color: '#fff' }]}>
                        {t('planner.startWorkout', 'Entrenar (Focus Mode)')}
                      </Text>
                    </TouchableOpacity>

                    {/* Complete Workout Button */}
                    <TouchableOpacity
                      onPress={handleCompleteWorkout}
                      disabled={alreadyCompleted}
                      style={[
                        s.completeBtn,
                        alreadyCompleted
                          ? { backgroundColor: '#10B98122', borderColor: '#10B98166' }
                          : { backgroundColor: colors.primary + '18', borderColor: colors.primary + '66' }
                      ]}
                      activeOpacity={0.75}
                    >
                      <CheckCircle size={20} color={alreadyCompleted ? '#10B981' : colors.primary} />
                      <Text style={[s.completeBtnText, { color: alreadyCompleted ? '#10B981' : colors.primary }]}>
                        {alreadyCompleted
                          ? t('planner.workoutDone', '¡Entrenamiento Completado! ✅')
                          : t('planner.markComplete', 'Marcar como Completado')}
                      </Text>
                    </TouchableOpacity>

                    {/* Muscle Directory Button */}
                    <TouchableOpacity
                      onPress={() => router.push('/modals/muscle-directory')}
                      style={[
                        s.completeBtn,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 12 }
                      ]}
                      activeOpacity={0.75}
                    >
                      <Dumbbell size={20} color={colors.primary} />
                      <Text style={[s.completeBtnText, { color: colors.primary }]}>
                        {t('planner.viewMuscleDirectory', 'Directorio de Ejercicios y GIFs')}
                      </Text>
                    </TouchableOpacity>

                    {/* TEST BUTTON TO CLEAR HISTORY */}
                    <TouchableOpacity
                      onPress={() => {
                        clearHistory();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                      style={[
                        s.completeBtn,
                        { backgroundColor: '#EF444422', borderColor: '#EF444466', marginTop: 12 }
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.completeBtnText, { color: '#EF4444' }]}>
                        [TEST] Borrar Historial de Entrenamientos
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={[s.restDayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <LinearGradient colors={[colors.primary + '11', 'transparent']} style={StyleSheet.absoluteFillObject} />
                    <View style={[s.restIconWrap, { backgroundColor: colors.primary + '22' }]}>
                      <Moon size={36} color={colors.primary} />
                    </View>
                    <Text style={[s.restDayTitle, { color: colors.textPrimary }]}>{t('planner.restDay', 'Día de Descanso')}</Text>
                    <Text style={[s.restDayText, { color: colors.textSecondary }]}>{t('planner.restDayHint', '¡Hoy toca descansar! Recupera energías para tu próxima sesión.')}</Text>
                  </View>
                )}
              </View>
            ) : (
              <EmptyState 
                title={t('planner.noWorkouts')} 
                subtitle="Toca 'Generar' para crear un plan de entrenamiento con IA"
                loading={loading} 
                isPro={isProActually} 
                onUnlock={() => router.push('/modals/paywall')} 
              />
            )
          )}
        </View>

        {/* ── Full Disclaimer Footer (always visible when plan exists) ── */}
        {hasData && (
          <TouchableOpacity 
            style={[s.fullDisclaimerBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => setShowDisclaimer(!showDisclaimer)}
            activeOpacity={0.8}
          >
            <View style={[s.fullDisclaimerHeader, !showDisclaimer && { marginBottom: 0 }]}>
              <AlertTriangle size={15} color={colors.textMuted} />
              <Text style={[s.fullDisclaimerTitle, { color: colors.textMuted, flex: 1, marginLeft: 4 }]}>
                {t('planner.fullDisclaimerTitle', 'Descargo de responsabilidad')}
              </Text>
              {showDisclaimer ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
            </View>
            {showDisclaimer && (
              <Text style={[s.fullDisclaimerText, { color: colors.textMuted }]}>
                {t('planner.fullDisclaimerText',
                  'El plan generado por FitGO es producido por inteligencia artificial con fines informativos y de orientación general. No constituye consejo médico, nutricional o de salud profesional. Los resultados individuales pueden variar. Siempre consulte a un dietista registrado, nutricionista certificado o médico antes de realizar cambios significativos en su dieta o rutina de ejercicio. FitGO no se responsabiliza de ningún daño o consecuencia derivada del uso de estos planes. Este plan se renueva automáticamente cada domingo a las 23:59.'
                )}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {hasData && (
          <View style={{ gap: 12, marginHorizontal: Spacing.base, marginTop: 12 }}>
            {mode === 'nutrition' && (
              <TouchableOpacity style={[s.exportBtn, { marginHorizontal: 0, marginTop: 0 }]} onPress={() => router.push('/modals/shopping-list')} activeOpacity={0.8}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={s.exportGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <ShoppingCart size={20} color="#fff" />
                  <Text style={s.exportText}>Lista de Compras 🛒</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.exportBtn, { marginHorizontal: 0, marginTop: 0 }]} onPress={handleExportPDF} activeOpacity={0.8}>
              <LinearGradient colors={['#10B981', '#059669']} style={s.exportGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Download size={20} color="#fff" />
                <Text style={s.exportText}>{mode === 'nutrition' ? t('planner.exportMenu', 'Menu PDF') : 'Export PDF'}</Text>
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

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ title, subtitle, loading, isPro, onUnlock }: { title: string; subtitle?: string; loading: boolean; isPro: boolean; onUnlock: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View style={s.emptyDay}>
      <View style={[s.emptyIconWrap, {backgroundColor: colors.surfaceAlt}]}>
        <CalendarDays size={42} color={colors.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[s.emptySub, { color: colors.textSecondary }]}>
        {loading ? t('common.loading') : (subtitle ? subtitle : (isPro ? t('planner.emptySubPro') : t('planner.emptySubFree')))}
      </Text>
      {!isPro && !loading && (
        <TouchableOpacity style={s.proBtn} activeOpacity={0.8} onPress={onUnlock}>
          <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={s.proGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Sparkles size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={s.proText}>{t('planner.unlockPro')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Day Picker ────────────────────────────────────────────────────────────────
const DAY_WIDTH = 64;
const DAY_GAP = 12;
const DAY_PADDING_H = 16; 

function DayPicker({ active, onSelect, isPremiumCustom, premiumColor }: { active: string; onSelect: (d: string) => void; isPremiumCustom?: boolean | null; premiumColor?: string | null }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const dayIndex = DAYS.indexOf(active);
    if (dayIndex === -1 || !scrollRef.current) return;
    const { width: screenWidth } = Dimensions.get('window');
    const offset = DAY_PADDING_H + dayIndex * (DAY_WIDTH + DAY_GAP) - screenWidth / 2 + DAY_WIDTH / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 100);
  }, [active]);

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={dp.scroll} contentContainerStyle={dp.row}>
      {DAYS.map((d) => {
        const isActive = active === d;
        return (
          <TouchableOpacity
            key={d}
            style={[dp.day, { backgroundColor: isActive ? 'transparent' : colors.surfaceAlt, borderColor: isActive ? colors.primary : colors.border }]}
            onPress={() => onSelect(d)}
            activeOpacity={0.8}
          >
            {isActive && (
              <LinearGradient
                colors={isPremiumCustom && premiumColor ? [premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor, (premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor) + 'CC'] : (colors.gradientPrimary || ['#7C5CFC', '#4338CA'])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
              />
            )}
            <Text style={[dp.dayLabel, { color: isActive ? '#fff' : colors.textSecondary, zIndex: 1 }]}>
              {t(`planner.${d.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  );
}

// ─── Meal Card ─────────────────────────────────────────────────────────────────
const MemoizedMealCard = React.memo(MealCard);
function MealCard({ day, index, name, meal, cal, protein, carbs, fat }: { day: string; index: number; name: string; meal: string; cal: number; protein?: number; carbs?: number; fat?: number; }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const [isSwapping, setIsSwapping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSwap = async () => {
    try {
      setIsSwapping(true);
      const profile = useAuthStore.getState().profile;
      console.log(`[Swap] Requesting swap for meal: "${name}", cal: ${cal}`);
      const newMeal = await generateMealSwap(name, cal, protein || 0, carbs || 0, fat || 0, profile, language);
      console.log(`[Swap] API Response:`, JSON.stringify(newMeal));
      
      // Guard: only update if the API returned a valid non-empty name
      if (!newMeal?.name || typeof newMeal.name !== 'string' || newMeal.name.trim() === '') {
        console.warn('[Swap] API returned empty name, keeping original meal.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      usePlannerStore.getState().swapMeal(day, index, {
        meal,
        name: newMeal.name.trim(),
        calories: newMeal.calories || cal,
        protein: newMeal.protein ?? protein,
        carbs: newMeal.carbs ?? carbs,
        fat: newMeal.fat ?? fat
      });
      console.log(`[Swap] Successfully swapped to: "${newMeal.name}"`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('[Swap] Error:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleConsume = () => {
    Haptics.selectionAsync();
    useNutritionStore.getState().addLog({
      id: '',
      foodItem: { id: '', name, calories: cal, protein: protein || 0, carbs: carbs || 0, fat: fat || 0, source: 'custom', sugar: 0, fiber: 0, sodium: 0, iron: 0, calcium: 0, saturatedFat: 0, transFat: 0 },
      grams: 100,
      meal,
      loggedAt: new Date().toISOString(),
      calories: cal,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0
    });
  };

  const getMealIcon = () => {
    switch(meal) {
      case 'breakfast': return <Coffee size={18} color={colors.primary} />;
      case 'lunch': return <Utensils size={18} color={colors.primary} />;
      case 'dinner': return <Pizza size={18} color={colors.primary} />;
      default: return <Apple size={18} color={colors.primary} />;
    }
  };

  return (
    <View style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[mc.iconWrap, {backgroundColor: colors.primary + '15'}]}>
        {getMealIcon()}
      </View>
      <View style={mc.info}>
        {(() => {
          const normalizedMeal = meal.toLowerCase();
          let key = 'snack';
          if (normalizedMeal.includes('desayuno') || normalizedMeal.includes('breakfast')) key = 'breakfast';
          else if (normalizedMeal.includes('almuerzo') || normalizedMeal.includes('lunch')) key = 'lunch';
          else if (normalizedMeal.includes('cena') || normalizedMeal.includes('dinner')) key = 'dinner';
          else if (normalizedMeal.includes('merienda') || normalizedMeal.includes('snack')) key = 'snack';
          return <Text style={[mc.mealLabel, { color: colors.textMuted }]}>{t(`tracker.${key}`)}</Text>;
        })()}
        <TouchableOpacity activeOpacity={0.8} onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={[mc.name, { color: colors.textPrimary }]} numberOfLines={isExpanded ? undefined : 2}>{name}</Text>
        </TouchableOpacity>
        {(protein !== undefined) && (
          <View style={mc.macroRow}>
            <View style={[mc.macroPill, {backgroundColor: colors.protein + '15'}]}><Text style={[mc.macro, { color: colors.protein }]}>P {protein}g</Text></View>
            <View style={[mc.macroPill, {backgroundColor: colors.carbs + '15'}]}><Text style={[mc.macro, { color: colors.carbs }]}>C {carbs}g</Text></View>
            <View style={[mc.macroPill, {backgroundColor: colors.fat + '15'}]}><Text style={[mc.macro, { color: colors.fat }]}>F {fat}g</Text></View>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap', marginLeft: -4 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4 }}
            onPress={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'nutritionist', prompt: `¿Me puedes dar la receta o decirme cómo preparar: ${name}?` } })}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Receta ›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSwap} style={{ padding: 6, opacity: isSwapping ? 0.5 : 1 }} disabled={isSwapping}>
            {isSwapping ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={14} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConsume} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full }}>
            <CheckCircle size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Consumir</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[mc.calWrap, {backgroundColor: colors.primary + '08'}]}>
        <Text style={[mc.cal, { color: colors.primary }]}>{cal}</Text>
        <Text style={[mc.calUnit, { color: colors.primary, opacity: 0.7 }]}>kcal</Text>
      </View>
    </View>
  );
}

// ─── StyleSheets ───────────────────────────────────────────────────────────────
const gcm = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:           { width: '100%', maxWidth: 420, borderRadius: 28, overflow: 'hidden', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  iconHeader:     { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  iconCircle:     { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  title:          { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.3 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoText:       { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  foodsBox:       { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  foodsHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  foodsTitle:     { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  foodsList:      { fontSize: 13, lineHeight: 19 },
  foodsEmpty:     { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  disclaimerBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  btnPrimary:     { borderRadius: Radius.full, overflow: 'hidden', marginBottom: 10, elevation: 4, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnSecondary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: Radius.full, borderWidth: 1, marginBottom: 10 },
  btnSecondaryText:{ fontSize: 14, fontWeight: '700' },
  btnCancel:      { alignItems: 'center', paddingVertical: 10 },
  btnCancelText:  { fontSize: 14, fontWeight: '600' },
  resetDesc:      { fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 20, fontWeight: '500' },
  modeBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  modeBtnText:    { fontSize: 13, fontWeight: '800' },
});

const dp = StyleSheet.create({
  scroll:   { marginBottom: 24 },
  row:      { gap: 12, paddingHorizontal: Spacing.base, paddingBottom: 10, paddingTop: 4 },
  day:      { width: 64, height: 74, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  dayLabel: { fontSize: 15, fontWeight: '800' },
});

const mc = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 28, padding: 18, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  iconWrap:  { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  info:      { flex: 1 },
  mealLabel: { fontSize: 12, fontWeight: '900', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  name:      { fontSize: 16, fontWeight: '700', marginBottom: 8, lineHeight: 22 },
  macroRow:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  macroPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  macro:     { fontSize: 11, fontWeight: '900' },
  calWrap:   { alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 },
  cal:       { fontSize: 18, fontWeight: '900' },
  calUnit:   { fontSize: 11, fontWeight: '800', marginTop: -2, textTransform: 'uppercase' },
});

const s = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTextWrap: { flex: 1 },
  title:       { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:    { fontSize: 14, marginTop: 2, fontWeight: '500' },
  genBtn:      { borderRadius: Radius.full, overflow: 'hidden', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  genGrad:     { paddingHorizontal: 18, paddingVertical: 12 },
  genText:     { color: '#fff', fontWeight: '800', fontSize: 14 },

  toggleContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  tabs:        { flexDirection: 'row', borderRadius: Radius.xl, padding: 4, borderWidth: 1 },
  tab:         { flex: 1, paddingVertical: 10, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  tabContent:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabText:     { fontSize: 14, fontWeight: '700' },

  homeWorkoutWrap: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, marginHorizontal: Spacing.base, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  homeWorkoutTitle: { fontSize: 16, fontWeight: '800' },
  homeWorkoutSub: { fontSize: 13, marginTop: 4, opacity: 0.8 },
  
  equipmentWrap: { marginHorizontal: Spacing.base, padding: Spacing.lg, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  equipmentTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  equipmentSub: { fontSize: 13, marginBottom: 16, opacity: 0.8 },
  equipmentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  equipmentChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  equipmentChipText: { fontSize: 13, fontWeight: '700' },
  inputWrap: { borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  equipmentInput: { fontSize: 15, minHeight: 44, textAlignVertical: 'top' },

  // AI Disclaimer Banner
  aiDisclaimerBanner: { marginHorizontal: Spacing.base, marginBottom: Spacing.md, borderRadius: 18, borderWidth: 1, padding: 14 },
  aiDisclaimerRow:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiDisclaimerIcon:   { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  aiDisclaimerTitle:  { fontSize: 13, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  aiDisclaimerText:   { fontSize: 12, lineHeight: 18, fontWeight: '500' },

  summaryContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 28, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  summaryLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryDivider: { width: 1, height: 50 },
  summaryVal:  { fontSize: 28, fontWeight: '900' },
  summaryLbl:  { fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },

  macroBarsWrap: { marginTop: 14, borderRadius: 24, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  macroTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  macroLabel: { width: 14, fontSize: 13, fontWeight: '900' },
  macroTrack: { flex: 1, height: 10, borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 5 },
  macroVal: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700' },

  hydrationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, borderRadius: 24, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  hydroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hydroIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  hydroTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  hydroVal: { fontSize: 18, fontWeight: '900' },
  hydroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  hydroBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  contentList: { paddingHorizontal: Spacing.base },

  emptyDay:    { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5 },
  emptyTitle:  { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  emptySub:    { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  proBtn:      { borderRadius: Radius.full, overflow: 'hidden', elevation: 6, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  proGrad:     { paddingHorizontal: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  proText:     { color: '#fff', fontWeight: '800', fontSize: 16 },

  analysisWrap: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg, borderRadius: 28, padding: Spacing.base, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  analysisTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analysisTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  analysisBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  analysisBtnText: { fontSize: 13, fontWeight: '800' },
  analysisContent: { borderRadius: 20, padding: 16 },
  analysisText: { fontSize: 15, lineHeight: 24 },
  analysisPlaceholder: { fontSize: 15, fontStyle: 'italic', paddingVertical: 10 },

  workoutRoutine: { gap: 12 },
  routineHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routineName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  workoutBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  workoutBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  exerciseCard: { padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseName: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8, lineHeight: 24 },
  exerciseBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  exerciseMeta: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', paddingTop: 16 },
  metaItem: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 4 },
  metaLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 16, fontWeight: '900' },
  metaInput: { fontSize: 16, fontWeight: '900', padding: 0, minHeight: 24, minWidth: 60, width: '100%' },

  restDayCard: { padding: 36, alignItems: 'center', borderRadius: 28, borderWidth: 1, overflow: 'hidden', marginTop: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  restIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  restDayTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  restDayText: { textAlign: 'center', fontSize: 16, lineHeight: 26 },

  exportBtn: { marginHorizontal: Spacing.base, marginTop: 20, borderRadius: Radius.full, overflow: 'hidden', elevation: 6, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  exportGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  exportText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  warningBox: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg, padding: 20, borderRadius: 24, borderWidth: 1, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.08, shadowRadius: 12 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  warningTitle: { fontSize: 17, fontWeight: '900' },
  warningText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },

  addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 28, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 10, marginBottom: 24, gap: 12 },
  addMealIcon: { fontSize: 26, fontWeight: '400', marginTop: -3 },
  addMealText: { fontSize: 15, fontWeight: '700' },

  // Full disclaimer footer
  fullDisclaimerBox:    { marginHorizontal: Spacing.base, marginTop: 20, marginBottom: 8, borderRadius: 18, borderWidth: 1, padding: 16 },
  fullDisclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fullDisclaimerTitle:  { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  fullDisclaimerText:   { fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // Complete workout button
  completeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, marginBottom: 20, paddingVertical: 16, borderRadius: Radius.full, borderWidth: 1.5 },
  completeBtnText: { fontSize: 16, fontWeight: '800' },
  floatingTimer: { position: 'absolute', bottom: 90, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(124, 92, 252, 0.4)', shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 100 },
  timerTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', opacity: 0.7 },
  timerValue: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
});

