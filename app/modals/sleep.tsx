import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  X,
  Moon,
  Sun,
  Clock,
  Sparkles,
  Check,
  Brain,
  Dumbbell,
  BatteryCharging,
  RotateCcw,
} from 'lucide-react-native';

import { useTheme } from '../../hooks/useTheme';
import { useNutritionStore } from '../../store';
import { hexToRgba } from '../../utils/styles';
import { Spacing, Radius } from '../../constants';

// Circular Gauge Constants
const RING_SIZE = 190;
const STROKE_WIDTH = 13;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PRESET_HOURS = [6, 7, 7.5, 8, 8.5, 9];

type WakeMood = 'energized' | 'rested' | 'sleepy' | 'exhausted';

export default function SleepModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const setSleep = useNutritionStore(s => s.setSleep);
  const dailySleep = useNutritionStore(s => s.dailySleep);
  const selectedDate = useNutritionStore(s => s.selectedDate);

  // Pre-fill wake time based on existing saved sleep hours
  const initialWaketime = useMemo(() => {
    const saved = dailySleep[selectedDate];
    if (saved && saved > 0) {
      const totalMins = 23 * 60 + Math.round(saved * 60);
      const wakeH = Math.floor(totalMins / 60) % 24;
      const wakeM = totalMins % 60;
      return `${String(wakeH).padStart(2, '0')}:${String(wakeM).padStart(2, '0')}`;
    }
    return '07:00';
  }, [dailySleep, selectedDate]);

  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState(initialWaketime);
  const [wakeMood, setWakeMood] = useState<WakeMood>('rested');
  const [pickerTarget, setPickerTarget] = useState<'bed' | 'wake' | null>(null);
  const [iosTempDate, setIosTempDate] = useState<Date>(new Date());

  // Parse "HH:MM"
  const parseTimeString = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      return { h: isNaN(h) ? 0 : h % 24, m: isNaN(m) ? 0 : m % 60 };
    } catch {
      return { h: 0, m: 0 };
    }
  };

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Sleep metrics calculation
  const metrics = useMemo(() => {
    const { h: bH, m: bM } = parseTimeString(bedtime);
    const { h: wH, m: wM } = parseTimeString(waketime);
    let totalMins = (wH * 60 + wM) - (bH * 60 + bM);
    if (totalMins <= 0) totalMins += 24 * 60; // Overnight wrap

    const totalHours = +(totalMins / 60).toFixed(1);
    const hours = Math.floor(totalMins / 60);
    const minutes = totalMins % 60;
    const cycles = +(totalMins / 90).toFixed(1);
    const completeCycles = Math.floor(totalMins / 90);
    const progressPct = Math.min(Math.round((totalMins / 480) * 100), 100);

    return { totalHours, hours, minutes, totalMins, cycles, completeCycles, progressPct };
  }, [bedtime, waketime]);

  // Adjust time by delta minutes (+/- 15m)
  const handleAdjustMinutes = useCallback((target: 'bed' | 'wake', deltaMins: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const currentTime = target === 'bed' ? bedtime : waketime;
    const { h, m } = parseTimeString(currentTime);
    let total = h * 60 + m + deltaMins;
    while (total < 0) total += 24 * 60;
    total = total % (24 * 60);
    const newTime = formatTime(Math.floor(total / 60), total % 60);

    if (target === 'bed') {
      setBedtime(newTime);
    } else {
      setWaketime(newTime);
    }
  }, [bedtime, waketime]);

  // Apply quick duration preset
  const handleApplyPreset = useCallback((targetHours: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const { h: bH, m: bM } = parseTimeString(bedtime);
    const addMins = Math.round(targetHours * 60);
    const wakeTotal = (bH * 60 + bM + addMins) % (24 * 60);
    setWaketime(formatTime(Math.floor(wakeTotal / 60), wakeTotal % 60));
  }, [bedtime]);

  // Open native picker
  const openTimePicker = useCallback((target: 'bed' | 'wake') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const timeStr = target === 'bed' ? bedtime : waketime;
    const { h, m } = parseTimeString(timeStr);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    setIosTempDate(d);
    setPickerTarget(target);
  }, [bedtime, waketime]);

  // Handle DateTimePicker change
  const handlePickerChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      const current = pickerTarget;
      setPickerTarget(null);
      if (event.type === 'set' && selectedDate && current) {
        const hh = selectedDate.getHours().toString().padStart(2, '0');
        const mm = selectedDate.getMinutes().toString().padStart(2, '0');
        const formatted = `${hh}:${mm}`;
        try {
          Haptics.selectionAsync();
        } catch {}
        if (current === 'bed') {
          setBedtime(formatted);
        } else {
          setWaketime(formatted);
        }
      }
    } else {
      if (selectedDate) {
        setIosTempDate(selectedDate);
      }
    }
  }, [pickerTarget]);

  // Save iOS picker change
  const handleConfirmIosPicker = useCallback(() => {
    if (!pickerTarget) return;
    const hh = iosTempDate.getHours().toString().padStart(2, '0');
    const mm = iosTempDate.getMinutes().toString().padStart(2, '0');
    const formatted = `${hh}:${mm}`;
    try {
      Haptics.selectionAsync();
    } catch {}
    if (pickerTarget === 'bed') {
      setBedtime(formatted);
    } else {
      setWaketime(formatted);
    }
    setPickerTarget(null);
  }, [pickerTarget, iosTempDate]);

  // Sleep Quality Config
  const qualityConfig = useMemo(() => {
    const h = metrics.totalHours;
    if (h >= 7 && h <= 9) {
      return {
        label: t('sleep.qualityOptimal', 'Sueño Óptimo'),
        emoji: '😴',
        color: '#10B981',
        gradient: ['#10B981', '#059669'] as const,
        glow: 'rgba(16, 185, 129, 0.35)',
        tip: t('sleep.tipOptimal', '¡Recuperación muscular y mental óptima! El descanso profundo favorece la síntesis de proteína y segregación de GH.'),
        scores: { mental: 98, muscle: 100, energy: 95 },
      };
    }
    if (h >= 6 && h < 7) {
      return {
        label: t('sleep.qualityModerate', 'Descanso Moderado'),
        emoji: '⚡',
        color: '#F59E0B',
        gradient: ['#FBBF24', '#D97706'] as const,
        glow: 'rgba(245, 158, 11, 0.35)',
        tip: t('sleep.tipModerate', 'Descanso moderado. Cumples el umbral básico, pero 30-45 minutos más optimizarían tu resistencia física.'),
        scores: { mental: 80, muscle: 82, energy: 76 },
      };
    }
    if (h < 6) {
      return {
        label: t('sleep.qualityDeficit', 'Déficit de Sueño'),
        emoji: '🥱',
        color: '#EF4444',
        gradient: ['#F87171', '#DC2626'] as const,
        glow: 'rgba(239, 68, 68, 0.35)',
        tip: t('sleep.tipDeficit', 'Déficit de sueño. Tu cuerpo no completó la reparación celular. Prioriza hidratación y descanso temprano.'),
        scores: { mental: 55, muscle: 60, energy: 48 },
      };
    }
    return {
      label: t('sleep.qualityExcess', 'Descanso Extenso'),
      emoji: '🌙',
      color: '#8B5CF6',
      gradient: ['#A78BFA', '#7C3AED'] as const,
      glow: 'rgba(139, 92, 246, 0.35)',
      tip: t('sleep.tipExcess', 'Descanso prolongado. Excelente para recargar energía tras jornadas de alta exigencia muscular.'),
      scores: { mental: 92, muscle: 98, energy: 88 },
    };
  }, [metrics.totalHours, t]);

  const strokeDashoffset = CIRCUMFERENCE - Math.min(metrics.totalHours / 8, 1.25) * (CIRCUMFERENCE / 1.25);

  const handleSave = async () => {
    const hours = metrics.totalHours;
    if (hours > 0 && hours <= 24) {
      try {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        await setSleep(hours);
      } catch (err) {
        console.error('Error saving sleep:', err);
      } finally {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const p = colors.primary;

  return (
    <View style={s.container}>
      {/* Background Gradient Atmosphere */}
      <LinearGradient
        colors={[
          hexToRgba(p, 0.16),
          hexToRgba('#0F172A', 0.95),
          colors.background,
        ]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.headerBtn, { backgroundColor: hexToRgba(colors.textPrimary, 0.08), borderColor: hexToRgba(colors.textPrimary, 0.12) }]}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={s.headerTitles}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
              {t('sleep.title', 'Registro de Sueño')}
            </Text>
            <Text style={[s.headerSubtitle, { color: colors.textSecondary }]}>
              {t('sleep.subtitle', 'Descanso y recuperación')}
            </Text>
          </View>

          <View style={[s.headerBadge, { backgroundColor: hexToRgba(p, 0.14), borderColor: hexToRgba(p, 0.28) }]}>
            <Moon size={18} color={p} strokeWidth={2.2} />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Sleep Ring Card ── */}
          <Animated.View
            entering={FadeInUp.delay(80).duration(450)}
            style={[
              s.heroCard,
              {
                backgroundColor: hexToRgba(colors.surface, 0.85),
                borderColor: hexToRgba(qualityConfig.color, 0.25),
                shadowColor: qualityConfig.color,
              },
            ]}
          >
            {/* Ambient subtle glow blob */}
            <View
              style={[
                s.ambientOrb,
                { backgroundColor: qualityConfig.glow },
              ]}
            />

            {/* Circular Gauge */}
            <View style={s.ringWrapper}>
              <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <Defs>
                  <SvgLinearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={qualityConfig.gradient[0]} />
                    <Stop offset="100%" stopColor={qualityConfig.gradient[1]} />
                  </SvgLinearGradient>
                </Defs>

                {/* Background Ring Track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={hexToRgba(qualityConfig.color, 0.12)}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />

                {/* Progress Active Ring */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke="url(#sleepGrad)"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>

              {/* Inside Ring Content */}
              <View style={s.ringInnerContent}>
                <Text style={s.ringEmoji}>{qualityConfig.emoji}</Text>
                <View style={s.durationRow}>
                  <Text style={[s.durationHours, { color: colors.textPrimary }]}>
                    {metrics.hours}
                    <Text style={[s.durationUnit, { color: qualityConfig.color }]}>h </Text>
                    {metrics.minutes > 0 ? (
                      <>
                        {metrics.minutes}
                        <Text style={[s.durationUnit, { color: qualityConfig.color }]}>m</Text>
                      </>
                    ) : null}
                  </Text>
                </View>
                <Text style={[s.ringLabel, { color: colors.textSecondary }]}>
                  {t('sleep.totalRegistered', 'Total registrado')}
                </Text>
              </View>
            </View>

            {/* Quality Status Pill */}
            <View style={[s.statusPill, { backgroundColor: hexToRgba(qualityConfig.color, 0.12), borderColor: hexToRgba(qualityConfig.color, 0.3) }]}>
              <Sparkles size={14} color={qualityConfig.color} strokeWidth={2.5} />
              <Text style={[s.statusPillText, { color: qualityConfig.color }]}>
                {qualityConfig.label} • {metrics.progressPct}% {t('dashboard.target', 'de meta')}
              </Text>
            </View>

            {/* Sleep Cycles Visual Bar */}
            <View style={[s.cyclesBarCard, { backgroundColor: hexToRgba(colors.textPrimary, 0.03), borderColor: hexToRgba(colors.textPrimary, 0.07) }]}>
              <View style={s.cyclesHeaderRow}>
                <View style={s.cyclesTitleRow}>
                  <RotateCcw size={13} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[s.cyclesTitle, { color: colors.textSecondary }]}>
                    {t('sleep.sleepCycles', 'Ciclos de sueño')}
                  </Text>
                </View>
                <Text style={[s.cyclesValue, { color: qualityConfig.color }]}>
                  {t('sleep.cyclesCount', { count: metrics.cycles, defaultValue: `~${metrics.cycles} ciclos (90m c/u)` })}
                </Text>
              </View>

              {/* Segments representation */}
              <View style={s.segmentsRow}>
                {[1, 2, 3, 4, 5, 6].map((seg) => {
                  const isFilled = metrics.totalHours >= seg * 1.5;
                  const isPartial = !isFilled && metrics.totalHours > (seg - 1) * 1.5;
                  return (
                    <View
                      key={seg}
                      style={[
                        s.segmentItem,
                        {
                          backgroundColor: isFilled
                            ? qualityConfig.color
                            : isPartial
                            ? hexToRgba(qualityConfig.color, 0.4)
                            : hexToRgba(colors.textPrimary, 0.08),
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ── Quick Duration Presets ── */}
          <Animated.View entering={FadeInUp.delay(120).duration(450)} style={s.sectionWrap}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
              {t('sleep.quickPresets', 'Atajos de duración')}
            </Text>
            <View style={s.presetsRow}>
              {PRESET_HOURS.map((preset) => {
                const isActive = Math.abs(metrics.totalHours - preset) < 0.15;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => handleApplyPreset(preset)}
                    activeOpacity={0.75}
                    style={[
                      s.presetChip,
                      {
                        backgroundColor: isActive
                          ? qualityConfig.color
                          : hexToRgba(colors.surface, 0.8),
                        borderColor: isActive
                          ? qualityConfig.color
                          : hexToRgba(colors.border, 0.4),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.presetText,
                        {
                          color: isActive ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {preset}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Bedtime & Waketime Dual Interactive Cards ── */}
          <Animated.View entering={FadeInUp.delay(160).duration(450)} style={s.cardsRow}>
            {/* Bedtime Card */}
            <View
              style={[
                s.timeCard,
                {
                  backgroundColor: hexToRgba(colors.surface, 0.85),
                  borderColor: hexToRgba('#6366F1', 0.25),
                },
              ]}
            >
              <View style={s.timeCardHeader}>
                <View style={[s.timeIconWrap, { backgroundColor: hexToRgba('#6366F1', 0.15), borderColor: hexToRgba('#6366F1', 0.3) }]}>
                  <Moon size={18} color="#818CF8" strokeWidth={2.2} />
                </View>
                <Text style={[s.timeCardLabel, { color: colors.textSecondary }]}>
                  {t('sleep.bedtime', 'Hora de dormir')}
                </Text>
              </View>

              {/* Big Interactive Time Display */}
              <TouchableOpacity
                onPress={() => openTimePicker('bed')}
                activeOpacity={0.8}
                style={s.timeButton}
              >
                <Text style={[s.timeDisplay, { color: colors.textPrimary }]}>{bedtime}</Text>
                <View style={s.timeEditBadge}>
                  <Clock size={12} color="#818CF8" strokeWidth={2} />
                  <Text style={[s.timeEditBadgeText, { color: '#818CF8' }]}>
                    {t('sleep.tapToChange', 'Cambiar')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Stepper Buttons (-15m / +15m) */}
              <View style={s.stepperRow}>
                <TouchableOpacity
                  onPress={() => handleAdjustMinutes('bed', -15)}
                  activeOpacity={0.7}
                  style={[s.stepBtn, { backgroundColor: hexToRgba(colors.textPrimary, 0.05), borderColor: hexToRgba(colors.textPrimary, 0.1) }]}
                >
                  <Text style={[s.stepBtnText, { color: colors.textSecondary }]}>-15m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjustMinutes('bed', 15)}
                  activeOpacity={0.7}
                  style={[s.stepBtn, { backgroundColor: hexToRgba(colors.textPrimary, 0.05), borderColor: hexToRgba(colors.textPrimary, 0.1) }]}
                >
                  <Text style={[s.stepBtnText, { color: colors.textSecondary }]}>+15m</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Waketime Card */}
            <View
              style={[
                s.timeCard,
                {
                  backgroundColor: hexToRgba(colors.surface, 0.85),
                  borderColor: hexToRgba('#F59E0B', 0.25),
                },
              ]}
            >
              <View style={s.timeCardHeader}>
                <View style={[s.timeIconWrap, { backgroundColor: hexToRgba('#F59E0B', 0.15), borderColor: hexToRgba('#F59E0B', 0.3) }]}>
                  <Sun size={18} color="#FBBF24" strokeWidth={2.2} />
                </View>
                <Text style={[s.timeCardLabel, { color: colors.textSecondary }]}>
                  {t('sleep.waketime', 'Hora de despertar')}
                </Text>
              </View>

              {/* Big Interactive Time Display */}
              <TouchableOpacity
                onPress={() => openTimePicker('wake')}
                activeOpacity={0.8}
                style={s.timeButton}
              >
                <Text style={[s.timeDisplay, { color: colors.textPrimary }]}>{waketime}</Text>
                <View style={s.timeEditBadge}>
                  <Clock size={12} color="#FBBF24" strokeWidth={2} />
                  <Text style={[s.timeEditBadgeText, { color: '#FBBF24' }]}>
                    {t('sleep.tapToChange', 'Cambiar')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Stepper Buttons (-15m / +15m) */}
              <View style={s.stepperRow}>
                <TouchableOpacity
                  onPress={() => handleAdjustMinutes('wake', -15)}
                  activeOpacity={0.7}
                  style={[s.stepBtn, { backgroundColor: hexToRgba(colors.textPrimary, 0.05), borderColor: hexToRgba(colors.textPrimary, 0.1) }]}
                >
                  <Text style={[s.stepBtnText, { color: colors.textSecondary }]}>-15m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAdjustMinutes('wake', 15)}
                  activeOpacity={0.7}
                  style={[s.stepBtn, { backgroundColor: hexToRgba(colors.textPrimary, 0.05), borderColor: hexToRgba(colors.textPrimary, 0.1) }]}
                >
                  <Text style={[s.stepBtnText, { color: colors.textSecondary }]}>+15m</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ── Wake Feeling Selector ── */}
          <Animated.View entering={FadeInUp.delay(200).duration(450)} style={s.sectionWrap}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
              {t('sleep.wakeMood', '¿Cómo despertaste hoy?')}
            </Text>
            <View style={s.moodsRow}>
              {[
                { key: 'energized' as const, emoji: '⚡', label: t('sleep.moodEnergized', 'Energizado') },
                { key: 'rested' as const, emoji: '😊', label: t('sleep.moodRested', 'Descansado') },
                { key: 'sleepy' as const, emoji: '🥱', label: t('sleep.moodSleepy', 'Con sueño') },
                { key: 'exhausted' as const, emoji: '😫', label: t('sleep.moodExhausted', 'Agotado') },
              ].map(item => {
                const isSelected = wakeMood === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setWakeMood(item.key);
                    }}
                    activeOpacity={0.75}
                    style={[
                      s.moodChip,
                      {
                        backgroundColor: isSelected
                          ? hexToRgba(p, 0.18)
                          : hexToRgba(colors.surface, 0.8),
                        borderColor: isSelected
                          ? p
                          : hexToRgba(colors.border, 0.35),
                      },
                    ]}
                  >
                    <Text style={s.moodEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        s.moodText,
                        {
                          color: isSelected ? colors.textPrimary : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Scientific Recovery Impact & Tip Card ── */}
          <Animated.View
            entering={FadeInUp.delay(240).duration(450)}
            style={[
              s.recoveryCard,
              {
                backgroundColor: hexToRgba(colors.surface, 0.85),
                borderColor: hexToRgba(p, 0.2),
              },
            ]}
          >
            <View style={s.recoveryHeader}>
              <View style={[s.recoveryIconWrap, { backgroundColor: hexToRgba(p, 0.14) }]}>
                <Brain size={17} color={p} strokeWidth={2.2} />
              </View>
              <Text style={[s.recoveryCardTitle, { color: colors.textPrimary }]}>
                {t('sleep.recoveryImpact', 'Impacto de Recuperación')}
              </Text>
            </View>

            {/* Recovery Progress Mini-Pills */}
            <View style={s.recoveryMetricsRow}>
              <View style={[s.metricBox, { backgroundColor: hexToRgba(colors.textPrimary, 0.04) }]}>
                <View style={s.metricHeader}>
                  <Brain size={13} color="#818CF8" strokeWidth={2} />
                  <Text style={[s.metricName, { color: colors.textSecondary }]}>
                    {t('sleep.mentalRecovery', 'Cognitiva')}
                  </Text>
                </View>
                <Text style={[s.metricValue, { color: '#818CF8' }]}>
                  {qualityConfig.scores.mental}%
                </Text>
              </View>

              <View style={[s.metricBox, { backgroundColor: hexToRgba(colors.textPrimary, 0.04) }]}>
                <View style={s.metricHeader}>
                  <Dumbbell size={13} color="#10B981" strokeWidth={2} />
                  <Text style={[s.metricName, { color: colors.textSecondary }]}>
                    {t('sleep.muscleRecovery', 'Muscular')}
                  </Text>
                </View>
                <Text style={[s.metricValue, { color: '#10B981' }]}>
                  {qualityConfig.scores.muscle}%
                </Text>
              </View>

              <View style={[s.metricBox, { backgroundColor: hexToRgba(colors.textPrimary, 0.04) }]}>
                <View style={s.metricHeader}>
                  <BatteryCharging size={13} color="#F59E0B" strokeWidth={2} />
                  <Text style={[s.metricName, { color: colors.textSecondary }]}>
                    {t('sleep.energyLevel', 'Energía')}
                  </Text>
                </View>
                <Text style={[s.metricValue, { color: '#F59E0B' }]}>
                  {qualityConfig.scores.energy}%
                </Text>
              </View>
            </View>

            {/* Dynamic Advice */}
            <View style={[s.tipBox, { backgroundColor: hexToRgba(p, 0.07), borderColor: hexToRgba(p, 0.15) }]}>
              <Text style={[s.tipText, { color: colors.textSecondary }]}>
                💡 {qualityConfig.tip}
              </Text>
            </View>
          </Animated.View>

          {/* ── Save CTA Button ── */}
          <Animated.View entering={FadeInUp.delay(280).duration(450)} style={s.ctaContainer}>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[p, hexToRgba(p, 0.82)]}
                style={s.saveGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={s.saveText}>
                  {t('sleep.saveRecord', 'Guardar Registro')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ── Native DateTimePicker for Android ── */}
      {Platform.OS === 'android' && pickerTarget !== null && (
        <DateTimePicker
          value={iosTempDate}
          mode="time"
          is24Hour
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* ── Native DateTimePicker Modal for iOS ── */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={pickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerTarget(null)}
        >
          <View style={s.iosModalOverlay}>
            <View style={[s.iosModalCard, { backgroundColor: colors.surface }]}>
              <View style={s.iosModalHeader}>
                <Text style={[s.iosModalTitle, { color: colors.textPrimary }]}>
                  {pickerTarget === 'bed'
                    ? t('sleep.bedtime', 'Hora de dormir')
                    : t('sleep.waketime', 'Hora de despertar')}
                </Text>
                <TouchableOpacity onPress={handleConfirmIosPicker} style={s.iosModalDoneBtn}>
                  <Text style={[s.iosModalDoneText, { color: p }]}>{t('common.done', 'Listo')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosTempDate}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handlePickerChange}
                textColor={colors.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 18,
  },

  /* Hero Card */
  heroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  ambientOrb: {
    position: 'absolute',
    top: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.25,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEmoji: {
    fontSize: 34,
    marginBottom: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  durationHours: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  durationUnit: {
    fontSize: 22,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 14,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cyclesBarCard: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  cyclesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cyclesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cyclesTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  cyclesValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 8,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 4,
  },

  /* Presets Section */
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 13,
  },

  /* Time Cards Row */
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  timeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  timeDisplay: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  timeEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeEditBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Moods Row */
  moodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 11,
  },

  /* Recovery Impact Card */
  recoveryCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recoveryMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: Radius.md,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricName: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  tipBox: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* CTA */
  ctaContainer: {
    marginTop: 4,
  },
  saveBtn: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  saveGrad: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* iOS Picker Modal */
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  iosModalCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iosModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  iosModalDoneBtn: {
    padding: 6,
  },
  iosModalDoneText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
