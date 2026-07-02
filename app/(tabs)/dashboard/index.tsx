import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, RefreshControl
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import * as Haptics from 'expo-haptics';
import { Trophy, Flame, Dumbbell, Heart, Target } from 'lucide-react-native';
import { Spacing, Radius, Shadow } from '../../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useNutritionStore, selectDailyTotals } from '../../../store/nutritionStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useBodyStore } from '../../../store/bodyStore';

import { useTheme } from '../../../hooks/useTheme';
import { supabase } from '../../../services/supabase';
const MuscleSymmetryCard = React.lazy(() => import('../../../components/MuscleSymmetryCard').then(m => ({ default: m.MuscleSymmetryCard })));
import { getLocalDateString } from '../../../utils/date';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { getNameStyle } from '../../../utils/styles';
import { useAchievements, Achievement } from '../../../hooks/useAchievements';
import { GoalWizardModal } from '../../../components/GoalWizardModal';
import { PremiumGate } from '../../../components/PremiumGate';
import { useAdStore } from '../../../store/adStore';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { calculateProgressPct, handleGoalSave } from '../../../hooks/useDashboardLogic';
import { renderDashboardWidget } from '../../../components/dashboard/WidgetRenderer';

import { FitzDailyTip } from '../../../components/FitzDailyTip';

const RING_SIZE     = 180;
const STROKE_WIDTH  = 15;
const RADIUS        = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Calorie/Score Ring (Premium) ────────────────────────────────────────────
const ScoreRing = React.memo(function ScoreRing({ consumed, target, dateLabel, customColor }: { consumed: number; target: number; dateLabel: string; customColor?: string | null }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const safeConsumed = Number(consumed) || 0;
  const safeTarget = Number(target) || 2000;
  const pct = Number.isFinite(safeConsumed / Math.max(safeTarget, 1))
    ? Math.min(Math.max(safeConsumed / Math.max(safeTarget, 1), 0), 1)
    : 0;
  const strokeDashoffset = useMemo(() => CIRCUMFERENCE - pct * CIRCUMFERENCE, [pct]);
  const remaining = Math.max(safeTarget - safeConsumed, 0);

  const isOver = consumed > target;
  const isWarning = consumed >= target * 0.9 && consumed <= target;
  
  const ringColorA = isOver ? colors.error : (isWarning ? '#FFB800' : (customColor || '#00F0FF'));
  const ringColorB = isOver ? '#FF4B4B' : (isWarning ? '#F59E0B' : (customColor || '#7C5CFC'));

  return (
    <View style={ring.container}>
      {/* Date pill above */}
      <View style={[ring.datePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
        <Text style={[ring.topLabel, { color: colors.primary }]}>{dateLabel}</Text>
      </View>
      <View style={{ height: 12 }} />

      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ringColorA} />
            <Stop offset="1" stopColor={ringColorB} />
          </SvgLinearGradient>
        </Defs>

        {/* Ghost track ring */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={colors.border + '55'}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />

        {/* Inner glow ring (blurred softness) */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={isOver ? colors.error + '30' : (isWarning ? '#FFB80030' : (customColor ? customColor + '30' : '#7C5CFC30'))}
          strokeWidth={STROKE_WIDTH + 8}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" fill="transparent"
          rotation="-90" originX={RING_SIZE / 2} originY={RING_SIZE / 2}
        />

        {/* Main progress ring */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke="url(#scoreGrad)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" fill="transparent"
          rotation="-90" originX={RING_SIZE / 2} originY={RING_SIZE / 2}
        />
      </Svg>

      <View style={ring.textWrap}>
        <Text style={[ring.consumed, { color: colors.textPrimary }]}>{consumed}</Text>
        <Text style={[ring.unitLabel, { color: colors.textMuted }]}>{t('dashboard.kcalConsumed', 'kcal consumed')}</Text>
        <View style={[ring.statusPill, { 
          backgroundColor: isOver ? colors.error + '20' : (isWarning ? '#FFB80020' : (customColor ? customColor + '15' : colors.primary + '15')), 
          borderColor: isOver ? colors.error + '40' : (isWarning ? '#FFB80040' : (customColor ? customColor + '30' : colors.primary + '30')) 
        }]}>
          <Text style={[ring.label, { color: isOver ? colors.error : (isWarning ? '#F59E0B' : (customColor || colors.primary)) }]}>
            {isOver
              ? `+${Math.round(consumed - target)} ${t('dashboard.overGoal', 'over goal')}`
              : remaining > 0
                ? `${Math.round(remaining)} ${t('dashboard.remaining', 'remaining')}`
                : t('dashboard.medium', 'En meta')}
          </Text>
        </View>
      </View>
    </View>
  );
});
const ring = StyleSheet.create({
  container:  { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 12 },
  datePill:   { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 4 },
  topLabel:   { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  textWrap:   { position: 'absolute', alignItems: 'center', zIndex: 2, top: RING_SIZE / 2 - 26 },
  consumed:   { fontSize: 42, fontWeight: '900', letterSpacing: -2 },
  unitLabel:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, opacity: 0.7 },
  statusPill: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  label:      { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});

// ─── Achievement Preview ───────────────────────────────────────────────────────
const AchievementPreview = React.memo(function AchievementPreview({ achievements, onPress }: { achievements: Achievement[]; onPress: () => void }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  return (
    <TouchableOpacity style={ap.container} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ap.trophyCircle}
      >
        <Trophy size={18} color="#FFF" />
      </LinearGradient>
      <View style={ap.textWrap}>
        <Text style={[ap.label, { color: colors.textSecondary }]}>{t('dashboard.achievements', 'Logros')}</Text>
        <Text style={[ap.value, { color: colors.textPrimary }]}>{unlockedCount} / {achievements.length}</Text>
      </View>
    </TouchableOpacity>
  );
});
const ap = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  trophyCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textWrap: { justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, fontWeight: '800' },
});



const DEFAULT_WIDGETS = ['weight', 'bodyFat', 'muscle_directory', 'recipe_search', 'photos', 'measurements', 'sleep', 'calories'];

// ─── Dashboard (Progreso) Screen ────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language, premiumColor } = useSettingsStore();
  const { profile, setProfile } = useAuthStore();
  const dailySleep = useNutritionStore(s => s.dailySleep);
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const fetchLogs = useNutritionStore(s => s.fetchLogs);
  const { fetchMeasurements, getForDate, measurements } = useBodyStore();
  const { achievements } = useAchievements();
  
  const totalsData = useNutritionStore(selectDailyTotals);
  const { calories } = totalsData;
  const target = profile?.targetCalories ?? 2000;
  const name = profile?.name?.split(' ')[0] ?? t('dashboard.fallbackName');
  const streakDays = useNutritionStore(state => state.streakDays);

  const navigation = useNavigation();

  useEffect(() => {
    async function loadSelectedData() {
      if (!profile?.id) return;
      await Promise.all([
        fetchLogs(profile.id, selectedDate),
        fetchMeasurements(profile.id)
      ]);
    }
    loadSelectedData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadSelectedData();
    });
    return unsubscribe;
  }, [profile?.id, selectedDate, navigation, fetchLogs, fetchMeasurements]);

  const dateMeasurement = getForDate(selectedDate);
  const oldestWeight = (measurements.length > 0 ? measurements[measurements.length - 1].weight : null)
    || profile?.weight
    || 70;
    
  const initialWeight = Number(profile?.startingWeight || oldestWeight) || 70;
  const currentWeight = Number(dateMeasurement?.weight || profile?.weight) || 70;
  const targetWeight  = Number(profile?.targetWeight || currentWeight) || 70;
  const sleepHours = Number(dailySleep[selectedDate]) || 0;
  const bodyFat = dateMeasurement?.bodyFat;

  const progressPct = calculateProgressPct(profile?.goal, initialWeight, currentWeight, targetWeight);
  const safeProgressPct = progressPct;

  const todayStr = getLocalDateString();
  let dateLabel = t('tracker.today', 'Hoy');
  if (selectedDate === todayStr) {
    dateLabel = t('tracker.today', 'Hoy');
  } else {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    if (selectedDate === getLocalDateString(yest)) {
      dateLabel = t('tracker.yesterday', 'Ayer');
    } else {
      dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString(language, { month: 'short', day: 'numeric' });
    }
  }

  const isPro = !!profile?.isPro;
  const isValidHex = !!(premiumColor && premiumColor.startsWith('#'));
  const safePremiumColor = isValidHex ? premiumColor! : '#7C5CFC';
  const isPremiumCustom = (isPro || profile?.role === 'owner' || profile?.role === 'super_admin' || profile?.role === 'admin') && isValidHex;
  const { hasPremiumAdAccess } = useAdStore();
  const [premiumGate, setPremiumGate] = useState<{
    visible: boolean;
    featureId: string;
    featureName: string;
    featureIcon: string;
    route: string;
  }>({ visible: false, featureId: '', featureName: '', featureIcon: '', route: '' });

  const openPremiumGate = (featureId: string, featureName: string, featureIcon: string, route: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setPremiumGate({ visible: true, featureId, featureName, featureIcon, route });
  };

  const handlePremiumFeaturePress = (featureId: string, featureName: string, featureIcon: string, route: string) => {
    if (isPro || hasPremiumAdAccess(featureId)) {
      router.push(route as any);
    } else {
      openPremiumGate(featureId, featureName, featureIcon, route);
    }
  };
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (
    type: AlertType, 
    title: string, 
    message: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm?.();
        setAlert(prev => ({ ...prev, visible: false }));
      },
      onCancel: onCancel ? () => {
        onCancel();
        setAlert(prev => ({ ...prev, visible: false }));
      } : undefined,
    });
  };



  const [widgetsOrder, setWidgetsOrder] = useState(() => {
    if (profile?.widgetsOrder) {
      const saved = profile.widgetsOrder.filter((w: string) => w !== 'macros');
      const missing = DEFAULT_WIDGETS.filter(w => !saved.includes(w));
      return [...saved, ...missing];
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    if (profile?.widgetsOrder) {
      const saved = profile.widgetsOrder.filter((w: string) => w !== 'macros');
      const missing = DEFAULT_WIDGETS.filter(w => !saved.includes(w));
      setWidgetsOrder([...saved, ...missing]);
    }
  }, [profile?.widgetsOrder]);

  const saveWidgetsOrder = async () => {
    setIsEditing(false);
    if (profile?.id) {
      setProfile({ ...profile, widgetsOrder });
      await supabase.from('users').update({ widgets_order: widgetsOrder }).eq('id', profile.id);
    }
  };

  const goalInfo = useMemo(() => {
    switch (profile?.goal) {
      case 'lose': return { label: t('profile.loseWeight', 'Pérdida de Peso'), icon: <Flame size={28} color="#FF4D4D" />, accent: '#FF4D4D' };
      case 'gain': return { label: t('profile.gainMuscle', 'Ganancia Muscular'), icon: <Dumbbell size={28} color="#4D94FF" />, accent: '#4D94FF' };
      default: return { label: t('profile.maintain', 'Mantenimiento'), icon: <Heart size={28} color="#4DFF88" />, accent: '#4DFF88' };
    }
  }, [profile?.goal, t]);

  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const moveWidget = (index: number, direction: 1 | -1) => {
    if (index + direction < 0 || index + direction >= widgetsOrder.length) return;
    const newOrder = [...widgetsOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + direction];
    newOrder[index + direction] = temp;
    setWidgetsOrder(newOrder);
    Haptics.selectionAsync();
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLogs(profile?.id || '', selectedDate),
      fetchMeasurements(profile?.id || '')
    ]);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={[s.safe, { backgroundColor: 'transparent' }]}>
      <CustomAlert 
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
      <View style={{ flex: 1 }}>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ gap: 4 }}>
            <Text style={[s.greeting, { color: colors.textPrimary }]}>
              {t('dashboard.hello', '¡Hola')}{' '}
              <Text style={[{ color: colors.primary }, getNameStyle(profile?.nameColor)]}>{name}!</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[s.datePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                <Text style={[s.dateText, { color: colors.primary }]}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          </View>
          <AchievementPreview achievements={achievements} onPress={() => router.push('/modals/achievements' as any)} />
        </View>

        {/* Fitz Daily Tip Widget */}
        <FitzDailyTip streakDays={streakDays} />

        {/* Nutritional Score Card */}
        <View style={s.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.sectionIconWrap, { backgroundColor: (isPremiumCustom ? safePremiumColor : colors.primary) + '20' }]}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
            </View>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.scoreTitle', 'Score Nutricional')}</Text>
          </View>
        </View>
        <View style={[s.cardFull, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border + '50' }]}>
          <LinearGradient
            colors={['rgba(139,92,246,0.06)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          />
          <ScoreRing consumed={calories} target={target} dateLabel={dateLabel} customColor={isPremiumCustom ? safePremiumColor : null} />
        </View>


        {/* Phase Card */}
        <View style={s.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Text style={{ fontSize: 14 }}>🎯</Text>
            </View>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.phaseTitle', 'Fase')}</Text>
          </View>
          <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={[s.editBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{t('common.edit', 'Editar')}</Text>
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={[colors.surface, colors.surfaceAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cardFull}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <View style={[s.goalIconCircle, { backgroundColor: goalInfo.accent + '20', shadowColor: goalInfo.accent }]}>
              {goalInfo.icon}
            </View>
            <View>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 2 }}>{t('profile.activeGoal', 'Objetivo Activo')}</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{goalInfo.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>{t('profile.currentWeight')}</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>{currentWeight} <Text style={{ fontSize: 16, opacity: 0.5 }}>kg</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4, textAlign: 'right' }}>{t('profile.targetWeight')}</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: goalInfo.accent }}>{targetWeight} <Text style={{ fontSize: 16, opacity: 0.5 }}>kg</Text></Text>
            </View>
          </View>

          <View style={[s.progressBar, { backgroundColor: colors.border, height: 10 }]}>
            <LinearGradient
              colors={[goalInfo.accent, '#7C5CFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.progressFill, { width: `${safeProgressPct}%` }]}
            />
          </View>
          
          <View style={{ height: 24 }} />
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              onPress={() => setGoalModalVisible(true)}
            >
              <LinearGradient
                colors={isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : ['#7C5CFC', '#6344E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.updateBtnSmall}
              >
                <Target size={18} color="#FFF" />
                <Text style={[s.updateBtnTextSmall, { color: '#FFF' }]}>{t('profile.updateGoals', 'Actualizar Objetivos')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Muscle Symmetry Section */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <React.Suspense fallback={<View style={{ height: 350, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.primary} size="large" /></View>}>
            <MuscleSymmetryCard />
          </React.Suspense>
        </View>

        {/* Statistics Grid */}
        <View style={s.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.carbs + '20' }]}>
              <Text style={{ fontSize: 14 }}>📊</Text>
            </View>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.statsTitle', 'Estadísticas')}</Text>
          </View>
          {isEditing && (
            <TouchableOpacity onPress={saveWidgetsOrder} style={s.doneBtn}>
              <Text style={s.doneText}>{t('common.done', 'Listo')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.widgetGrid}>
          {widgetsOrder.map((id, index) => renderDashboardWidget({
            id, index, isEditing,
            canMoveLeft: index > 0,
            canMoveRight: index < widgetsOrder.length - 1,
            onMoveLeft: () => moveWidget(index, -1),
            onMoveRight: () => moveWidget(index, 1),
            onLongPress: () => { setIsEditing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
            currentWeight, sleepHours, calories, bodyFat, totalsData,
            isPro: !!profile?.isPro, colors, t: t as any, router,
            hasPremiumAdAccess, handlePremiumFeaturePress
          }))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </View>

      {/* Premium Gate Modal */}
      <PremiumGate
        visible={premiumGate.visible}
        featureId={premiumGate.featureId}
        featureName={premiumGate.featureName}
        featureIcon={premiumGate.featureIcon}
        onClose={() => setPremiumGate(prev => ({ ...prev, visible: false }))}
        onAdAccessGranted={() => {
          router.push(premiumGate.route as any);
        }}
      />

      <GoalWizardModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        initialData={{
          weight: profile?.weight || 70,
          targetWeight: profile?.targetWeight || profile?.weight || 70,
          goal: profile?.goal || 'maintain',
          lifestyle: profile?.lifestyle || 'seated',
          exerciseLevel: profile?.activityLevel || 'none'
        }}
        onSave={(newData) => handleGoalSave(newData, profile, setProfile, setGoalModalVisible, showAlert as any, t as any)}
      />
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg },
  greeting: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  // date pill
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatarGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  // Cards
  cardFull: { borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.md, overflow: 'hidden' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  updateBtn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  updateBtnText: { fontSize: 16, fontWeight: '700' },
  widgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  doneBtn: { backgroundColor: '#7C5CFC', paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full },
  doneText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  goalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: Platform.OS === 'ios' ? 4 : 0
  },
  updateBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  updateBtnTextSmall: {
    fontSize: 14,
    fontWeight: '800',
  },
});
