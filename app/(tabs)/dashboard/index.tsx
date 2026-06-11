import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Alert, Image, Platform
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Spacing, Radius, Shadow } from '../../../constants';
import { useAuthStore, useNutritionStore, selectDailyTotals, useSettingsStore, useBodyStore, UserProfile } from '../../../store';
import { useTheme } from '../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../services/supabase';
import { calculateTDEE, calculateMacros } from '../../../services/foodDatabase';
import { getLocalDateString } from '../../../utils/date';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedCard } from '../../../components/AnimatedCard';
import { MuscleSymmetryCard } from '../../../components/MuscleSymmetryCard';
import { Trophy, Flame, Dumbbell, Heart, ChevronRight, Scale, Target } from 'lucide-react-native';
import { useAchievements, Achievement } from '../../../hooks/useAchievements';
import { GoalWizardModal, ACTIVITY_TO_EXERCISE } from '../../../components/GoalWizardModal';
import { useInterstitial } from '../../../hooks/useInterstitial';
import { PremiumGate } from '../../../components/PremiumGate';
import { useAdStore } from '../../../store/adStore';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';

const { width } = Dimensions.get('window');

const WIDGET_WIDTH = (width - Spacing.base * 2 - Spacing.md) / 2;

const RING_SIZE     = 180;
const STROKE_WIDTH  = 15;
const RADIUS        = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Calorie/Score Ring (Premium) ────────────────────────────────────────────
function ScoreRing({ consumed, target, dateLabel }: { consumed: number; target: number; dateLabel: string }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const safeConsumed = Number(consumed) || 0;
  const safeTarget = Number(target) || 2000;
  const pct = Number.isFinite(safeConsumed / Math.max(safeTarget, 1))
    ? Math.min(Math.max(safeConsumed / Math.max(safeTarget, 1), 0), 1)
    : 0;
  const strokeDashoffset = useMemo(() => CIRCUMFERENCE - pct * CIRCUMFERENCE, [pct]);
  const remaining = Math.max(safeTarget - safeConsumed, 0);

  const isOver = consumed > target * 0.9;
  const ringColorA = isOver ? colors.error : '#00F0FF';
  const ringColorB = isOver ? '#FF4B4B' : '#7C5CFC';

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
          stroke={isOver ? colors.error + '30' : '#7C5CFC30'}
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
        <Text style={[ring.unitLabel, { color: colors.textMuted }]}>kcal consumidas</Text>
        <View style={[ring.statusPill, { backgroundColor: isOver ? colors.error + '20' : colors.primary + '15', borderColor: isOver ? colors.error + '40' : colors.primary + '30' }]}>
          <Text style={[ring.label, { color: isOver ? colors.error : colors.primary }]}>
            {isOver
              ? `+${consumed - target} sobre meta`
              : remaining > 0
                ? `${remaining} restantes`
                : t('dashboard.medium', 'En meta')}
          </Text>
        </View>
      </View>
    </View>
  );
}


// ─── Widget Ad Timer Overlay ───────────────────────────────────────────────────
function WidgetAdTimer({ featureId }: { featureId: string }) {
  const { profile } = useAuthStore();
  const { premiumAdRemainingSeconds, hasPremiumAdAccess } = useAdStore();
  const [timeLeft, setTimeLeft] = useState(premiumAdRemainingSeconds(featureId));

  const isPro = !!profile?.isPro;

  useEffect(() => {
    if (isPro) return;
    const timer = setInterval(() => {
      setTimeLeft(premiumAdRemainingSeconds(featureId));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPro, featureId]);

  if (isPro || !hasPremiumAdAccess(featureId) || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: 'rgba(124, 92, 252, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
      padding: 12,
      borderRadius: Radius.xl,
    }]}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 28, fontVariant: ['tabular-nums'] }}>{timeStr}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, textAlign: 'center' }}>ACCESO PREMIUM</Text>
    </View>
  );
}


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


// ─── Widget Card ────────────────────────────────────────────────────────────────
interface WidgetProps {
  id?: string;
  title: string;
  icon: any;
  value?: string;
  subValue?: string;
  onPress?: () => void;
  index: number;
  customContent?: React.ReactNode;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  isEditing?: boolean;
  adTimerFeatureId?: string;
}

function WidgetCard({ title, icon, value, subValue, onPress, customContent, onLongPress, isEditing, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight, index, adTimerFeatureId }: any) {
  const colors = useTheme();
  
  return (
    <AnimatedCard index={index} direction="up" style={{ width: WIDGET_WIDTH }}>
      <TouchableOpacity 
        style={[
          w.card, 
          { backgroundColor: colors.surface, borderColor: isEditing ? '#7C5CFC' : 'transparent' },
          isEditing && { borderWidth: 2 }
        ]} 
        onPress={isEditing ? undefined : onPress} 
        activeOpacity={0.8} 
        delayLongPress={500} 
        onLongPress={onLongPress}
      >
        <LinearGradient
          colors={['rgba(124, 92, 252, 0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
        />
        <View style={w.header}>
          <View style={[w.iconWrap, { backgroundColor: 'rgba(124, 92, 252, 0.15)' }]}>
            <Text style={w.icon}>{icon}</Text>
          </View>
          <Text style={[w.title, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        </View>
        {customContent ? customContent : (
          <View style={w.content}>
            <Text style={[w.value, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            {subValue && <Text style={[w.subValue, { color: colors.textSecondary }]} numberOfLines={1}>{subValue}</Text>}
          </View>
        )}
        
        {isEditing && (
          <View style={[StyleSheet.absoluteFill, w.editOverlay]}>
            <TouchableOpacity 
              style={[w.moveBtn, !canMoveLeft && { opacity: 0.3 }]} 
              onPress={onMoveLeft} 
              disabled={!canMoveLeft}
            >
              <Text style={w.moveIcon}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[w.moveBtn, !canMoveRight && { opacity: 0.3 }]} 
              onPress={onMoveRight} 
              disabled={!canMoveRight}
            >
              <Text style={w.moveIcon}>→</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {adTimerFeatureId && <WidgetAdTimer featureId={adTimerFeatureId} />}

      </TouchableOpacity>
    </AnimatedCard>
  );
}

// ─── Achievement Preview ───────────────────────────────────────────────────────
function AchievementPreview({ achievements, onPress }: { achievements: Achievement[]; onPress: () => void }) {
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
}

const ap = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  trophyCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textWrap: { justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, fontWeight: '800' },
});

const w = StyleSheet.create({
  card: { width: WIDGET_WIDTH, height: 160, borderRadius: Radius.xl, padding: Spacing.lg, justifyContent: 'space-between', borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: -0.3 },
  content: { flex: 1, justifyContent: 'flex-end', paddingBottom: 4 },
  value: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subValue: { fontSize: 13, marginTop: 4, fontWeight: '500', opacity: 0.8 },
  editOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  moveBtn: { backgroundColor: '#7C5CFC', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  moveIcon: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  // Premium lock styles
  lockOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -10,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7C5CFC',
  },
  lockIcon: { fontSize: 11 },
  premiumTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 92, 252, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.4)',
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
});

// ─── Dashboard (Progreso) Screen ────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const { profile, setProfile } = useAuthStore();
  const { todayLogs, dailySleep, selectedDate, fetchLogs, setDate } = useNutritionStore();
  const { latest, fetchMeasurements, getForDate, measurements } = useBodyStore();
  const { achievements } = useAchievements();
  
  const totalsData = useNutritionStore(selectDailyTotals);
  const { calories } = totalsData;
  const target = profile?.targetCalories ?? 2000;
  const name = profile?.name?.split(' ')[0] ?? t('dashboard.fallbackName');

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
  }, [profile?.id, selectedDate, navigation]);

  const dateMeasurement = getForDate(selectedDate);
  const oldestWeight = (measurements.length > 0 ? measurements[measurements.length - 1].weight : null)
    || profile?.weight
    || 70;
    
  const initialWeight = Number(profile?.startingWeight || oldestWeight) || 70;
  const currentWeight = Number(dateMeasurement?.weight || profile?.weight) || 70;
  const targetWeight  = Number(profile?.targetWeight || currentWeight) || 70;
  const sleepHours = Number(dailySleep[selectedDate]) || 0;
  const bodyFat = dateMeasurement?.bodyFat;

  let progressPct = 0;
  if (profile?.goal === 'lose') {
    const totalToLose = initialWeight - targetWeight;
    const lostSoFar = initialWeight - currentWeight;
    if (totalToLose > 0) {
      progressPct = Math.max(0, Math.min(100, (lostSoFar / totalToLose) * 100));
    } else {
      // Target is >= Initial: already "lost" if current is <= target, but contradictory
      progressPct = currentWeight <= targetWeight ? 100 : 0;
    }
  } else if (profile?.goal === 'gain') {
    const totalToGain = targetWeight - initialWeight;
    const gainedSoFar = currentWeight - initialWeight;
    if (totalToGain > 0) {
      progressPct = Math.max(0, Math.min(100, (gainedSoFar / totalToGain) * 100));
    } else {
      // Target is <= Initial: contradictory for GAIN goal
      progressPct = currentWeight >= targetWeight && initialWeight > targetWeight ? 0 : (currentWeight >= targetWeight ? 100 : 0);
    }
  } else {
    // Maintain: 100% as long as they are within 1.5kg of target
    const diff = Math.abs(currentWeight - targetWeight);
    progressPct = diff <= 1.5 ? 100 : Math.max(0, 100 - (diff * 10));
  }

  const safeProgressPct = Number.isFinite(progressPct) ? progressPct : 0;

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
  const handleEditMode = () => {
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
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
    return ['weight', 'bodyFat', 'muscle_directory', 'recipe_search', 'photos', 'measurements', 'sleep', 'calories'];
  });

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

  const renderWidget = (id: string, index: number) => {
    const commonProps = {
      index,
      isEditing,
      onLongPress: handleEditMode,
      onMoveLeft: () => moveWidget(index, -1),
      onMoveRight: () => moveWidget(index, 1),
      canMoveLeft: index > 0,
      canMoveRight: index < widgetsOrder.length - 1,
    };

    switch (id) {
      case 'weight':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.weightWidget')} icon="⚖️"
            value={`${currentWeight}`} subValue="kg"
            onPress={() => router.push('/modals/body-measurements')}
          />
        );
      case 'sleep':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.sleepWidget')} icon="🌙"
            customContent={
              <View style={w.content}>
                 <Text style={[w.value, { color: colors.textPrimary }]}>{sleepHours > 0 ? `${sleepHours}h` : '--'}</Text>
                 <Text style={[w.subValue, { color: colors.textSecondary }]}>{sleepHours > 0 ? t('dashboard.loggedToday') : t('dashboard.tapToAdd')}</Text>
              </View>
            }
            onPress={() => router.push('/modals/sleep' as any)}
          />
        );
      case 'calories':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.caloriesWidget')} icon="⚡"
            customContent={
              <View style={w.content}>
                <Text style={{fontSize: 24, fontWeight: '800', color: colors.textPrimary}}>{calories}</Text>
                <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.logFood')}</Text>
              </View>
            }
            onPress={() => router.push('/(tabs)/tracker')}
          />
        );
      case 'bodyFat':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.bodyFatWidget')} icon="🔥"
            value={bodyFat ? `${bodyFat}%` : '--'} subValue={t('dashboard.tapToUpdate')}
            onPress={() => router.push('/modals/body-measurements')}
          />
        );
      case 'macros':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.macrosWidget')} icon="🥗"
            customContent={
              <View style={[w.content, { gap: 4 }]}>
                <Text style={{ fontSize: 13, color: colors.protein }}>P: {totalsData.protein}g</Text>
                <Text style={{ fontSize: 13, color: colors.carbs }}>C: {totalsData.carbs}g</Text>
                <Text style={{ fontSize: 13, color: colors.fat }}>G: {totalsData.fat}g</Text>
              </View>
            }
            onPress={() => router.push('/(tabs)/tracker')}
          />
        );
      case 'measurements':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.measurementsWidget')} icon="📏"
            value={t('dashboard.seeHistory', 'Ver historial')} subValue={t('dashboard.measurementsSub', 'Cintura, pecho, etc.')}
            onPress={() => router.push('/modals/body-measurements')}
          />
        );
      case 'photos':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.evaluationWidget', 'Evaluación IA')} icon="🤖"
            adTimerFeatureId="evaluation"
            customContent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 32, color: colors.textSecondary }}>📷</Text>
                  {!isPro && !hasPremiumAdAccess('evaluation') && (
                    <View style={w.lockOverlay}>
                      <Text style={w.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.evaluatePhysique', 'Evaluar Físico')}</Text>
                <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.getAIFeedback', 'Recibe feedback IA')}</Text>
                {!isPro && !hasPremiumAdAccess('evaluation') && (
                  <View style={w.premiumTag}>
                    <Text style={w.premiumTagText}>👑 Premium</Text>
                  </View>
                )}
              </View>
            }
            onPress={() => handlePremiumFeaturePress(
              'evaluation',
              t('dashboard.evaluationWidget', 'Evaluación IA'),
              '📷',
              '/modals/progress-evaluation'
            )}
          />
        );
      case 'achievements':
        return null; // Removed from grid as requested
      case 'recipe_search':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.recipeSearchWidget', 'Buscar Recetas')} icon="🍳"
            adTimerFeatureId="recipes"
            customContent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 32, color: colors.textSecondary }}>🥗</Text>
                  {!isPro && !hasPremiumAdAccess('recipes') && (
                    <View style={w.lockOverlay}>
                      <Text style={w.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.recipeSearchWidget', 'Buscar Recetas')}</Text>
                <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.withAI', 'Con IA')}</Text>
                {!isPro && !hasPremiumAdAccess('recipes') && (
                  <View style={w.premiumTag}>
                    <Text style={w.premiumTagText}>👑 Premium</Text>
                  </View>
                )}
              </View>
            }
            onPress={() => handlePremiumFeaturePress(
              'recipes',
              t('dashboard.recipeSearchWidget', 'Buscar Recetas con IA'),
              '🥗',
              '/modals/recipes'
            )}
          />
        );
      case 'muscle_directory':
        return (
          <WidgetCard key={id} {...commonProps} title={t('dashboard.muscleDirWidget', 'Ejercicios')} icon="💪"
            adTimerFeatureId="directory"
            customContent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 32, color: colors.textSecondary }}>📖</Text>
                  {!isPro && !hasPremiumAdAccess('directory') && (
                    <View style={w.lockOverlay}>
                      <Text style={w.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.muscleDirTitle', 'Directorio')}</Text>
                <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.muscleDirSub', 'Por músculos')}</Text>
              </View>
            }
            onPress={() => handlePremiumFeaturePress(
              'directory',
              t('dashboard.muscleDirWidget', 'Directorio de Ejercicios'),
              '📖',
              '/modals/muscle-directory'
            )}
          />
        );
      default: return null;
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Full-Screen Competitive Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#4C1D95', '#BE123C', '#0F172A']} // Deep purple -> Crimson red -> Dark Slate
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        {/* Subtle dark overlay to ensure text readability */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]} />
      </View>
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

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ gap: 4 }}>
            <Text style={[s.greeting, { color: colors.textPrimary }]}>
              {t('dashboard.hello', '¡Hola')}{' '}
              <Text style={{ color: colors.primary }}>{name}!</Text>
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

        {/* Nutritional Score Card */}
        <View style={s.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.primary + '20' }]}>
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
          <ScoreRing consumed={calories} target={target} dateLabel={dateLabel} />
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
                colors={['#7C5CFC', '#6344E0']}
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
          <MuscleSymmetryCard />
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
          {widgetsOrder.map((id, index) => renderWidget(id, index))}
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
        onSave={async (newData) => {
          if (!profile) return;
          try {
            // Combine Lifestyle and Exercise to get final activityLevel for TDEE
            const LIFESTYLE_MAP: Record<string, number> = { seated: 0, standing_sometimes: 1, standing_mostly: 2, moving: 3, physical_work: 4 };
            const EXERCISE_MAP: Record<string, number> = { none: 0, '1-2': 1, '3-4': 2, '5-6': 3, daily: 4 };
            const REVERSE_MAP: Record<number, UserProfile['activityLevel']> = { 0: 'sedentary', 1: 'light', 2: 'moderate', 3: 'active', 4: 'very_active' };

            const lifeScore = LIFESTYLE_MAP[newData.lifestyle] || 0;
            const exeScore  = EXERCISE_MAP[newData.exerciseLevel] || 0;
            const finalActivityLevel = REVERSE_MAP[Math.max(lifeScore, exeScore)];

            // Recalculate and update store
            const { tdee } = calculateTDEE({
              weight: newData.weight,
              height: profile.height,
              age: profile.age,
              sex: profile.sex,
              activityLevel: finalActivityLevel,
              lifestyleLevel: newData.lifestyle
            });
            
            const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, newData.goal);

            // Reset starting weight if they change their main goal (e.g., lose to gain)
            const newStartingWeight = profile.goal !== newData.goal ? newData.weight : (profile.startingWeight || newData.weight);

            // Update Supabase
            const { error: upsertError } = await supabase
              .from('users')
              .update({
                weight: newData.weight,
                target_weight: newData.targetWeight,
                starting_weight: newStartingWeight,
                goal: newData.goal,
                lifestyle: newData.lifestyle,
                activity_level: finalActivityLevel,
                tdee,
                target_calories: targetCalories,
                macros: { protein, carbs, fat },
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (upsertError) throw upsertError;

            // Also update bodyStore measurement if weight changed
            const { addMeasurement } = useBodyStore.getState();
            await addMeasurement({
              id: `bm-${Date.now()}`,
              date: getLocalDateString(),
              weight: newData.weight,
            });

            setProfile({
              ...profile,
              weight: newData.weight,
              startingWeight: newStartingWeight,
              targetWeight: newData.targetWeight,
              goal: newData.goal,
              lifestyle: newData.lifestyle,
              activityLevel: finalActivityLevel,
              tdee,
              targetCalories,
              macros: { protein, carbs, fat }
            });

            // Sync today's activity in tracker
            const { setNeat, setExerciseLevel } = useNutritionStore.getState();
            setNeat(newData.lifestyle);
            setExerciseLevel(newData.exerciseLevel);

            setGoalModalVisible(false);
            showAlert('success', t('common.success'), t('profile.updateSuccess'));
          } catch (err) {
            console.error('Error updating goals:', err);
            showAlert('error', t('common.error'), t('profile.updateFailed'));
          }

        }}
      />
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: Spacing.base },
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
