import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Flame,
  Zap,
  BarChart2,
  Calendar,
  Activity,
} from 'lucide-react-native';

import { Spacing, Radius, Shadow } from '../../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useNutritionStore, selectDailyTotals } from '../../../store/nutritionStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useBodyStore } from '../../../store/bodyStore';
import { useTheme } from '../../../hooks/useTheme';
import { supabase } from '../../../services/supabase';
import { getLocalDateString } from '../../../utils/date';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { getNameStyle, getSafeColor, isValidPremiumColor } from '../../../utils/styles';
import { useAchievements, Achievement } from '../../../hooks/useAchievements';
import { GoalWizardModal } from '../../../components/GoalWizardModal';
import { PremiumGate } from '../../../components/PremiumGate';
import { useAdStore } from '../../../store/adStore';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { calculateProgressPct } from '../../../hooks/useDashboardLogic';
import { renderDashboardWidget } from '../../../components/dashboard/WidgetRenderer';
import { useIsPro } from '../../../hooks/useIsPro';
import { FitzDailyTip } from '../../../components/FitzDailyTip';
import MuscleSymmetryCard from '../../../components/MuscleSymmetryCard';
import { GoalProgressHero } from '../../../components/dashboard/GoalProgressHero';
import { WeeklyConsistencyCard } from '../../../components/dashboard/WeeklyConsistencyCard';

const RING_SIZE = 175;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Calorie / Nutritional Score Ring ──────────────────────────────────────────
interface ScoreRingProps {
  consumed: number;
  target: number;
  burnedCals?: number;
  dateLabel: string;
  customColor?: string | null;
}

const ScoreRing = React.memo(function ScoreRing({
  consumed,
  target,
  burnedCals = 0,
  dateLabel,
  customColor,
}: ScoreRingProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const safeConsumed = Number(consumed) || 0;
  const safeTarget = Math.max(Number(target) || 2000, 1);
  const pct = Math.min(Math.max(safeConsumed / safeTarget, 0), 1);
  const strokeDashoffset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
  const remaining = Math.max(safeTarget - safeConsumed, 0);

  const isOver = consumed > target;
  const isWarning = consumed >= target * 0.9 && consumed <= target;

  const ringColorA = isOver ? colors.error : (isWarning ? '#FFB800' : (customColor || '#8B5CF6'));
  const ringColorB = isOver ? '#FF5252' : (isWarning ? '#F59E0B' : (customColor || '#06B6D4'));

  return (
    <View style={ring.container}>
      {/* Date Capsule */}
      <View style={[ring.datePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
        <Calendar size={12} color={colors.primary} />
        <Text style={[ring.topLabel, { color: colors.primary }]}>{dateLabel}</Text>
      </View>

      <View style={{ height: 8 }} />

      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ringColorA} />
            <Stop offset="1" stopColor={ringColorB} />
          </SvgLinearGradient>
        </Defs>

        {/* Ghost Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={colors.border + '44'}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />

        {/* Outer Glow */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={isOver ? colors.error + '25' : (isWarning ? '#FFB80025' : (customColor ? customColor + '25' : '#8B5CF625'))}
          strokeWidth={STROKE_WIDTH + 6}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          originX={RING_SIZE / 2}
          originY={RING_SIZE / 2}
        />

        {/* Progress Ring */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="url(#scoreGrad)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          originX={RING_SIZE / 2}
          originY={RING_SIZE / 2}
        />
      </Svg>

      {/* Centered Numbers */}
      <View style={ring.textWrap}>
        <Text style={[ring.consumed, { color: colors.textPrimary }]}>{safeConsumed}</Text>
        <Text style={[ring.targetMeta, { color: colors.textMuted }]}>
          / {safeTarget} kcal
        </Text>
        <View style={[ring.statusPill, {
          backgroundColor: isOver ? colors.error + '20' : (isWarning ? '#FFB80020' : (customColor ? customColor + '18' : colors.primary + '18')),
          borderColor: isOver ? colors.error + '44' : (isWarning ? '#FFB80044' : (customColor ? customColor + '35' : colors.primary + '35'))
        }]}>
          <Text style={[ring.statusText, { color: isOver ? colors.error : (isWarning ? '#F59E0B' : (customColor || colors.primary)) }]}>
            {isOver
              ? `+${Math.round(consumed - target)} ${t('dashboard.overGoal', 'sobre meta')}`
              : remaining > 0
                ? `${Math.round(remaining)} ${t('dashboard.remaining', 'restantes')}`
                : t('dashboard.medium', 'En meta')}
          </Text>
        </View>
      </View>

      {/* Burned vs Consumed Sub-row */}
      {burnedCals > 0 && (
        <View style={[ring.burnedRow, { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '33' }]}>
          <Activity size={13} color="#F59E0B" />
          <Text style={[ring.burnedText, { color: colors.textSecondary }]}>
            {t('dashboard.burnedToday', 'Quemadas en actividad')}: <Text style={{ fontWeight: '800', color: '#F59E0B' }}>{burnedCals} kcal</Text>
          </Text>
        </View>
      )}
    </View>
  );
});

const ring = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
    top: RING_SIZE / 2 - 34,
  },
  consumed: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  targetMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
    opacity: 0.8,
  },
  statusPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  burnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  burnedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ─── Achievement Preview Pill ──────────────────────────────────────────────────
const AchievementPreview = React.memo(function AchievementPreview({
  achievements,
  onPress,
}: {
  achievements: Achievement[];
  onPress: () => void;
}) {
  const colors = useTheme();
  const { t } = useTranslation();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <TouchableOpacity
      style={ap.container}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.75}
    >
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ap.trophyCircle}
      >
        <Trophy size={16} color="#FFF" />
      </LinearGradient>
      <View style={ap.textWrap}>
        <Text style={[ap.label, { color: colors.textSecondary }]}>
          {t('dashboard.achievements', 'Logros')}
        </Text>
        <Text style={[ap.value, { color: colors.textPrimary }]}>
          {unlockedCount} / {achievements.length}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const ap = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  trophyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 13,
    fontWeight: '900',
  },
});

const DEFAULT_WIDGETS = ['weight', 'bodyFat', 'muscle_directory', 'recipe_search', 'photos', 'measurements', 'sleep', 'calories'];

// ─── Dashboard (Progreso) Screen ────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language, premiumColor, massUnit = 'kg' } = useSettingsStore();
  const { profile, setProfile } = useAuthStore();
  const dailySleep = useNutritionStore(s => s.dailySleep);
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const setDate = useNutritionStore(s => s.setDate);
  const fetchLogs = useNutritionStore(s => s.fetchLogs);
  const activityCals = useNutritionStore(s => s.activityCals);
  const measurements = useBodyStore(s => s.measurements);
  const fetchMeasurements = useBodyStore(s => s.fetchMeasurements);
  const getForDate = useBodyStore(s => s.getForDate);
  const latest = useBodyStore(s => s.latest);
  const { achievements } = useAchievements();

  const totalsData = useNutritionStore(selectDailyTotals);
  const { calories } = totalsData;
  const target = profile?.targetCalories ?? 2000;
  const name = profile?.name?.split(' ')[0] ?? t('dashboard.fallbackName', 'Atleta');
  const streakDays = useNutritionStore(state => state.streakDays);

  const navigation = useNavigation();

  useEffect(() => {
    const profileId = profile?.id;
    if (!profileId) return;
    useNutritionStore.getState().fetchLogs(profileId, selectedDate);
    useBodyStore.getState().fetchMeasurements(profileId);

    const unsubscribe = navigation.addListener('focus', () => {
      useNutritionStore.getState().fetchLogs(profileId, selectedDate);
      useBodyStore.getState().fetchMeasurements(profileId);
    });
    return unsubscribe;
  }, [profile?.id, selectedDate, navigation]);

  const dateMeasurement = getForDate(selectedDate);
  const latestMeasurement = latest();
  const oldestWeight = (measurements.length > 0 ? measurements[measurements.length - 1].weight : null)
    || profile?.startingWeight
    || profile?.weight
    || 70;

  const initialWeight = Number(profile?.startingWeight || oldestWeight) || 70;
  const currentWeightKg = Number(dateMeasurement?.weight || latestMeasurement?.weight || profile?.weight) || 70;
  const targetWeightKg = Number(profile?.targetWeight || currentWeightKg) || 70;
  const sleepHours = Number(dailySleep[selectedDate]) || 0;
  const bodyFat = dateMeasurement?.bodyFat || latestMeasurement?.bodyFat;

  const progressPct = calculateProgressPct(profile?.goal, initialWeight, currentWeightKg, targetWeightKg);

  const todayStr = getLocalDateString();
  const dateLabel = useMemo(() => {
    if (selectedDate === todayStr) {
      return t('tracker.today', 'Hoy');
    }
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    if (selectedDate === getLocalDateString(yest)) {
      return t('tracker.yesterday', 'Ayer');
    }
    return new Date(selectedDate + 'T12:00:00').toLocaleDateString(language, { month: 'short', day: 'numeric' });
  }, [selectedDate, todayStr, language, t]);

  const isPro = useIsPro();
  const { safePremiumColor, isPremiumCustom } = useMemo(() => {
    const hasValidColor = isValidPremiumColor(premiumColor);
    const isAdmin = profile?.role === 'owner' || profile?.role === 'super_admin' || profile?.role === 'admin';
    const safe = getSafeColor(premiumColor, colors.primary);
    return {
      safePremiumColor: safe,
      isPremiumCustom: (isPro || isAdmin) && hasValidColor,
    };
  }, [isPro, premiumColor, profile?.role, colors.primary]);

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
      try {
        const { error } = await supabase.from('users').update({ widgets_order: widgetsOrder }).eq('id', profile.id);
        if (error) throw error;
      } catch {
        showAlert('error', t('common.error', 'Error'), t('profile.updateFailed', 'Error al guardar el orden de widgets.'));
      }
    }
  };

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
    try {
      await Promise.all([
        fetchLogs(profile?.id || '', selectedDate),
        fetchMeasurements(profile?.id || '')
      ]);
    } catch {
      showAlert('error', t('common.error', 'Error'), t('dashboard.refreshError', 'No se pudieron actualizar los datos.'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickLogWeight = useCallback(() => {
    router.push('/modals/body-measurements' as any);
  }, []);

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {/* Header: Personalized Greeting + Badges */}
            <View style={s.header}>
              <View style={{ gap: 4 }}>
                <Text style={[s.greeting, { color: colors.textPrimary }]}>
                  {t('dashboard.hello', '¡Hola')}{' '}
                  <Text style={[{ color: colors.primary }, getNameStyle(profile?.nameColor)]}>
                    {name}!
                  </Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.datePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                    <Calendar size={12} color={colors.primary} />
                    <Text style={[s.dateText, { color: colors.primary }]}>
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                  </View>

                  {streakDays > 0 && (
                    <View style={[s.streakPill, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B35' }]}>
                      <Flame size={12} color="#F59E0B" />
                      <Text style={[s.streakText, { color: '#F59E0B' }]}>
                        {streakDays} {streakDays === 1 ? 'día' : 'días'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <AchievementPreview
                achievements={achievements}
                onPress={() => router.push('/modals/achievements' as any)}
              />
            </View>

            {/* Fitz Daily Coach Tip */}
            <FitzDailyTip streakDays={streakDays} />

            {/* 1. HERO: Transformation & Active Goal Journey */}
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.sectionIconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={{ fontSize: 14 }}>🎯</Text>
                </View>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                  {t('dashboard.transformationPath', 'Ruta de Transformación')}
                </Text>
              </View>
            </View>

            <GoalProgressHero
              goal={profile?.goal}
              initialWeightKg={initialWeight}
              currentWeightKg={currentWeightKg}
              targetWeightKg={targetWeightKg}
              progressPct={progressPct}
              massUnit={massUnit}
              isCustomTheme={isPremiumCustom}
              themeAccentColor={safePremiumColor}
              onOpenGoalWizard={() => setGoalModalVisible(true)}
              onQuickLogWeight={handleQuickLogWeight}
              t={t as any}
            />

            {/* 2. Weekly Consistency & Habit Tracker */}
            <WeeklyConsistencyCard
              selectedDate={selectedDate}
              onSelectDate={setDate}
              streakDays={streakDays}
              language={language}
              t={t as any}
            />

            {/* 3. Nutritional Score & Energy Balance */}
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.sectionIconWrap, { backgroundColor: (isPremiumCustom ? safePremiumColor : colors.primary) + '20' }]}>
                  <Zap size={15} color={isPremiumCustom ? safePremiumColor : colors.primary} />
                </View>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                  {t('dashboard.scoreTitle', 'Score Nutricional')}
                </Text>
              </View>
            </View>

            <View style={[s.cardFull, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border + '45' }]}>
              <LinearGradient
                colors={[(isPremiumCustom ? safePremiumColor : colors.primary) + '12', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
              />
              <ScoreRing
                consumed={calories}
                target={target}
                burnedCals={activityCals}
                dateLabel={dateLabel}
                customColor={isPremiumCustom ? safePremiumColor : null}
              />
            </View>

            {/* 4. Muscle Symmetry Section */}
            <View style={{ marginVertical: Spacing.sm }}>
              <MuscleSymmetryCard />
            </View>

            {/* 5. Statistics & Tool Grid */}
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.sectionIconWrap, { backgroundColor: colors.carbs + '20' }]}>
                  <BarChart2 size={16} color={colors.carbs} />
                </View>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                  {t('dashboard.statsTitle', 'Estadísticas y Herramientas')}
                </Text>
              </View>
              {isEditing ? (
                <TouchableOpacity onPress={saveWidgetsOrder} style={s.doneBtn}>
                  <Text style={s.doneText}>{t('common.done', 'Listo')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setIsEditing(true);
                  }}
                  style={[s.editOrderBtn, { borderColor: colors.border + '50' }]}
                >
                  <Text style={[s.editOrderText, { color: colors.textSecondary }]}>
                    {t('dashboard.reorder', 'Reordenar')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={s.widgetGrid}>
              {widgetsOrder.map((id, index) => renderDashboardWidget({
                id,
                index,
                isEditing,
                canMoveLeft: index > 0,
                canMoveRight: index < widgetsOrder.length - 1,
                onMoveLeft: () => moveWidget(index, -1),
                onMoveRight: () => moveWidget(index, 1),
                onLongPress: () => {
                  setIsEditing(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                },
                currentWeight: currentWeightKg,
                sleepHours,
                calories,
                bodyFat,
                totalsData,
                isPro,
                colors,
                massUnit,
                t: t as any,
                router,
                hasPremiumAdAccess,
                handlePremiumFeaturePress
              }))}
            </View>

            <View style={{ height: 48 }} />
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

        {/* Goal Wizard Modal */}
        <GoalWizardModal
          visible={goalModalVisible}
          onClose={() => setGoalModalVisible(false)}
          initialData={{
            weight: latestMeasurement?.weight || profile?.weight || 70,
            targetWeight: profile?.targetWeight || latestMeasurement?.weight || profile?.weight || 70,
            height: profile?.height || 170,
            age: profile?.age || 25,
            sex: profile?.sex || 'male',
            goal: profile?.goal || 'maintain',
            lifestyle: profile?.lifestyle || 'standing_sometimes',
            activityLevel: profile?.activityLevel || 'moderate',
            dietType: profile?.dietType || 'recommended',
          }}
          onSave={() => setGoalModalVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md + 4,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOrderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  editOrderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#7C5CFC',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  doneText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Cards
  cardFull: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
});
