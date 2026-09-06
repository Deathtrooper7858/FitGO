import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { 
  Scale, 
  Percent, 
  Ruler, 
  X, 
  History, 
  TrendingDown, 
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Dumbbell,
  Activity,
  Sparkles,
  CircleDot,
  Footprints,
  Target,
  Flame,
  Trash2,
  Plus,
  Minus
} from 'lucide-react-native';
import { Spacing, Radius } from '../../constants';
import { useBodyStore, useAuthStore, BodyMeasurement, useNutritionStore, useSettingsStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { convertMass, convertLength } from '../../utils/units';
import { getLocalDateString, addDays } from '../../utils/date';
import { CustomAlert, AlertType } from '../../components/CustomAlert';

interface FieldConfig {
  key: keyof BodyMeasurement;
  label: string;
  defaultLabel: string;
  color: string;
  icon: any;
}

const TORSO_FIELDS: FieldConfig[] = [
  { key: 'chest', label: 'profile.chest', defaultLabel: 'Pecho',   color: '#3B82F6', icon: Activity },
  { key: 'waist', label: 'profile.waist', defaultLabel: 'Cintura', color: '#8B5CF6', icon: CircleDot },
  { key: 'hips',  label: 'profile.hips',  defaultLabel: 'Cadera',  color: '#EC4899', icon: Sparkles },
  { key: 'neck',  label: 'profile.neck',  defaultLabel: 'Cuello',  color: '#06B6D4', icon: Ruler },
];

const LIMB_FIELDS: FieldConfig[] = [
  { key: 'arms', label: 'profile.arms', defaultLabel: 'Brazos',  color: '#F59E0B', icon: Dumbbell },
  { key: 'legs', label: 'profile.legs', defaultLabel: 'Piernas', color: '#10B981', icon: Footprints },
];

const ALL_OTHER_FIELDS = [...TORSO_FIELDS, ...LIMB_FIELDS];

export default function BodyMeasurementsModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile } = useAuthStore();
  const { measurements, addMeasurement, deleteMeasurement } = useBodyStore();
  const { massUnit, lengthUnit } = useSettingsStore();

  const initialDate = useNutritionStore.getState().selectedDate || getLocalDateString();
  const [activeDate, setActiveDate] = useState<string>(initialDate);
  const [values, setValues] = useState<Partial<Record<keyof BodyMeasurement, string>>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Find measurement for currently active date
  const measurementForDate = useMemo(() => {
    return measurements.find(m => m.date === activeDate) || null;
  }, [measurements, activeDate]);

  // Find the most recent measurement strictly before the active date to show change deltas
  const previousMeasurement = useMemo(() => {
    return measurements.find(m => m.date < activeDate) || null;
  }, [measurements, activeDate]);

  // Latest measurement overall (reference for fallback)
  const latestOverall = useMemo(() => {
    return measurements[0] || null;
  }, [measurements]);

  // Initialize or re-populate values when activeDate changes or measurements update
  useEffect(() => {
    if (measurementForDate) {
      const initial: Partial<Record<keyof BodyMeasurement, string>> = {};
      if (measurementForDate.weight != null) {
        initial.weight = convertMass(measurementForDate.weight, 'kg', massUnit).toFixed(1);
      }
      if (measurementForDate.bodyFat != null) {
        initial.bodyFat = measurementForDate.bodyFat.toString();
      }
      ALL_OTHER_FIELDS.forEach(f => {
        const val = measurementForDate[f.key];
        if (val != null && typeof val === 'number') {
          initial[f.key] = convertLength(val, 'cm', lengthUnit).toFixed(1);
        }
      });
      setValues(initial);
    } else {
      // No measurement yet for this date: pre-populate weight from latest or profile goals so it's not empty!
      const fallbackWeight = latestOverall?.weight ?? profile?.weight;
      const initial: Partial<Record<keyof BodyMeasurement, string>> = {};
      if (fallbackWeight != null) {
        initial.weight = convertMass(fallbackWeight, 'kg', massUnit).toFixed(1);
      }
      if (latestOverall?.bodyFat != null) {
        initial.bodyFat = latestOverall.bodyFat.toString();
      }
      setValues(initial);
    }
  }, [activeDate, measurementForDate, latestOverall, profile?.weight, massUnit, lengthUnit]);

  // Step adjust helper for weight, bodyFat, or other measurements
  const handleStepAdjust = useCallback((key: keyof BodyMeasurement, step: number, min: number = 0, max: number = 300) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValues(prev => {
      const currentVal = parseFloat(prev[key] || '0') || 0;
      const nextVal = Math.max(min, Math.min(max, currentVal + step));
      return {
        ...prev,
        [key]: nextVal.toFixed(1),
      };
    });
  }, []);

  // Goal & Progress computations
  const currentWeightNum = parseFloat(values.weight || '0') || (profile?.weight ? convertMass(profile.weight, 'kg', massUnit) : 0);
  const targetWeightKg = profile?.targetWeight;
  const targetWeightInUnit = targetWeightKg ? convertMass(targetWeightKg, 'kg', massUnit) : null;
  const isLoss = profile?.goal === 'lose';
  const isGain = profile?.goal === 'gain';

  const weightDeltaToGoal = useMemo(() => {
    if (!targetWeightInUnit || !currentWeightNum) return null;
    return currentWeightNum - targetWeightInUnit;
  }, [currentWeightNum, targetWeightInUnit]);

  // BMI (IMC) calculation
  const bmiInfo = useMemo(() => {
    if (!profile?.height || !currentWeightNum) return null;
    const heightM = profile.height / 100;
    const weightKg = convertMass(currentWeightNum, massUnit, 'kg');
    const bmi = weightKg / (heightM * heightM);
    if (!Number.isFinite(bmi) || bmi <= 0) return null;

    let category = t('profile.bmiNormal', 'Saludable');
    let color = colors.success;

    if (bmi < 18.5) {
      category = t('profile.bmiUnder', 'Bajo peso');
      color = '#38BDF8';
    } else if (bmi >= 25 && bmi < 30) {
      category = t('profile.bmiOver', 'Sobrepeso');
      color = '#F59E0B';
    } else if (bmi >= 30) {
      category = t('profile.bmiObese', 'Obesidad');
      color = colors.error;
    }

    return { value: bmi.toFixed(1), category, color };
  }, [profile?.height, currentWeightNum, massUnit, colors, t]);

  // Body Fat Category
  const bodyFatCategory = useMemo(() => {
    const bf = parseFloat(values.bodyFat || '0');
    if (!bf || isNaN(bf) || bf < 3 || bf > 65) return null;
    const isMale = (profile?.sex || 'male') === 'male';

    if (isMale) {
      if (bf < 10) return { label: 'Atleta', color: '#10B981' };
      if (bf < 15) return { label: 'En forma', color: colors.primary };
      if (bf < 21) return { label: 'Promedio', color: '#38BDF8' };
      if (bf < 26) return { label: 'Aceptable', color: '#F59E0B' };
      return { label: 'Elevado', color: colors.error };
    } else {
      if (bf < 14) return { label: 'Atleta', color: '#10B981' };
      if (bf < 21) return { label: 'En forma', color: colors.primary };
      if (bf < 25) return { label: 'Promedio', color: '#38BDF8' };
      if (bf < 32) return { label: 'Aceptable', color: '#F59E0B' };
      return { label: 'Elevado', color: colors.error };
    }
  }, [values.bodyFat, profile?.sex, colors]);

  // Delta calculation relative to previous measurement
  const getChangeFromPrevious = (key: keyof BodyMeasurement) => {
    const prevVal = previousMeasurement?.[key] as number | undefined;
    const currStr = values[key];
    if (prevVal == null || !currStr) return null;
    const currVal = parseFloat(currStr);
    if (isNaN(currVal)) return null;

    // Convert previous to current unit
    let convertedPrev = prevVal;
    if (key === 'weight') {
      convertedPrev = convertMass(prevVal, 'kg', massUnit);
    } else if (key !== 'bodyFat') {
      convertedPrev = convertLength(prevVal, 'cm', lengthUnit);
    }

    const diff = currVal - convertedPrev;
    if (isNaN(diff) || Math.abs(diff) < 0.05) return null;
    return diff;
  };

  // Save handler
  const handleSave = async () => {
    const hasAtLeastOne = [...ALL_OTHER_FIELDS.map(f => f.key), 'weight', 'bodyFat'].some(k => {
      const v = values[k as keyof BodyMeasurement];
      return v && v.trim().length > 0 && !isNaN(parseFloat(v));
    });

    if (!hasAtLeastOne) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('error', t('common.error', 'Error'), t('foodDetail.invalidAmount', 'Ingresa al menos una medida válida.'));
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const measurement: BodyMeasurement = {
        id: measurementForDate?.id || `bm-${Date.now()}`,
        date: activeDate,
        weight: values.weight && !isNaN(parseFloat(values.weight))
          ? Math.round(convertMass(parseFloat(values.weight), massUnit, 'kg') * 10) / 10
          : undefined,
        bodyFat: values.bodyFat && !isNaN(parseFloat(values.bodyFat))
          ? Math.round(parseFloat(values.bodyFat) * 10) / 10
          : undefined,
        waist: values.waist && !isNaN(parseFloat(values.waist))
          ? Math.round(convertLength(parseFloat(values.waist), lengthUnit, 'cm') * 10) / 10
          : undefined,
        hips: values.hips && !isNaN(parseFloat(values.hips))
          ? Math.round(convertLength(parseFloat(values.hips), lengthUnit, 'cm') * 10) / 10
          : undefined,
        chest: values.chest && !isNaN(parseFloat(values.chest))
          ? Math.round(convertLength(parseFloat(values.chest), lengthUnit, 'cm') * 10) / 10
          : undefined,
        arms: values.arms && !isNaN(parseFloat(values.arms))
          ? Math.round(convertLength(parseFloat(values.arms), lengthUnit, 'cm') * 10) / 10
          : undefined,
        legs: values.legs && !isNaN(parseFloat(values.legs))
          ? Math.round(convertLength(parseFloat(values.legs), lengthUnit, 'cm') * 10) / 10
          : undefined,
        neck: values.neck && !isNaN(parseFloat(values.neck))
          ? Math.round(convertLength(parseFloat(values.neck), lengthUnit, 'cm') * 10) / 10
          : undefined,
      };

      await addMeasurement(measurement);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(
        'success', 
        t('common.success', 'Éxito'), 
        t('profile.updateSuccess', 'Medidas corporales y peso actualizados con éxito.'), 
        () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.dismissAll();
          }
        }
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', t('common.error', 'Error'), t('profile.saveMeasurementsFailed', 'No se pudieron guardar las medidas.'));
    } finally {
      setSaving(false);
    }
  };

  // Delete measurement from history
  const handleDeleteMeasurement = (id: string, date: string) => {
    showAlert(
      'confirm',
      t('common.delete', 'Eliminar'),
      t('profile.deleteMeasurementConfirm', `¿Deseas eliminar el registro del ${date}?`),
      async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await deleteMeasurement(id);
      },
      undefined,
      t('common.delete', 'Eliminar'),
      t('common.cancel', 'Cancelar')
    );
  };

  // Date navigation helpers
  const handlePrevDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDate(getLocalDateString());
  };

  const isToday = activeDate === getLocalDateString();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient
        colors={[`${colors.primary}25`, `${colors.surface}10`, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Header Bar */}
        <View style={s.header}>
          <TouchableOpacity 
            onPress={() => { 
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) router.back(); else router.dismissAll(); 
            }} 
            style={[s.closeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={s.titleWrap}>
            <Text style={[s.title, { color: colors.textPrimary }]}>{t('profile.bodyMeasurements', 'Medidas Corporales')}</Text>
            <Text style={[s.subtitle, { color: colors.textMuted }]}>
              {isToday ? t('tracker.today', 'Hoy') : activeDate}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={handleSave} 
            disabled={saving} 
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={[colors.primary, '#6D28D9']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveGrad}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveText}>{t('common.save', 'Guardar')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Date Selector Bar */}
        <View style={[s.dateBar, { backgroundColor: colors.surface, borderColor: `${colors.border}60` }]}>
          <TouchableOpacity 
            style={s.dateNavBtn} 
            onPress={handlePrevDay}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={s.datePill}>
            <Calendar size={15} color={colors.primary} />
            <Text style={[s.datePillText, { color: colors.textPrimary }]}>
              {activeDate}
            </Text>
            {isToday && (
              <View style={[s.todayBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[s.todayBadgeText, { color: colors.primary }]}>{t('tracker.today', 'Hoy')}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {!isToday && (
              <TouchableOpacity 
                onPress={handleToday}
                style={[s.resetTodayBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
              >
                <Text style={[s.resetTodayText, { color: colors.primary }]}>{t('tracker.today', 'Hoy')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={s.dateNavBtn} 
              onPress={handleNextDay}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={s.content} 
          keyboardShouldPersistTaps="handled" 
          keyboardDismissMode="on-drag" 
          showsVerticalScrollIndicator={false}
        >
          {/* Goal & Weight Target Card */}
          {targetWeightInUnit != null && (
            <View style={[s.goalCard, { backgroundColor: colors.surface, borderColor: `${colors.primary}30` }]}>
              <View style={s.goalHeader}>
                <View style={s.goalTypeBadge}>
                  {isLoss ? (
                    <Flame size={14} color="#EF4444" />
                  ) : isGain ? (
                    <TrendingUp size={14} color="#10B981" />
                  ) : (
                    <Target size={14} color={colors.primary} />
                  )}
                  <Text style={[s.goalTypeText, { color: colors.textPrimary }]}>
                    {isLoss ? t('profile.loseWeight', 'Perder Peso') : isGain ? t('profile.gainMuscle', 'Ganar Músculo') : t('profile.maintain', 'Mantener')}
                  </Text>
                </View>

                <View style={s.goalTargetBadge}>
                  <Text style={[s.goalTargetLabel, { color: colors.textMuted }]}>{t('profile.targetWeight', 'Meta')}:</Text>
                  <Text style={[s.goalTargetVal, { color: colors.primary }]}>
                    {targetWeightInUnit.toFixed(1)} {massUnit}
                  </Text>
                </View>
              </View>

              {weightDeltaToGoal != null && (
                <View style={s.goalDeltaRow}>
                  <Text style={[s.goalDeltaText, { color: colors.textSecondary }]}>
                    {isLoss ? (
                      weightDeltaToGoal <= 0 ? (
                        <Text style={{ color: colors.success, fontWeight: '800' }}>🎉 ¡Meta de peso alcanzada!</Text>
                      ) : (
                        `Faltan ${weightDeltaToGoal.toFixed(1)} ${massUnit} para alcanzar tu objetivo`
                      )
                    ) : isGain ? (
                      weightDeltaToGoal >= 0 ? (
                        <Text style={{ color: colors.success, fontWeight: '800' }}>🎉 ¡Meta de peso alcanzada!</Text>
                      ) : (
                        `Faltan ${Math.abs(weightDeltaToGoal).toFixed(1)} ${massUnit} para alcanzar tu objetivo`
                      )
                    ) : (
                      `Diferencia con tu peso meta: ${Math.abs(weightDeltaToGoal).toFixed(1)} ${massUnit}`
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── HERO CARDS: PESO & GRASA CORPORAL ── */}
          <View style={s.heroSection}>
            {/* Weight Hero Card */}
            <View style={[
              s.heroCard, 
              { 
                backgroundColor: colors.surface, 
                borderColor: focusedField === 'weight' ? colors.primary : `${colors.primary}30` 
              }
            ]}>
              <View style={s.heroHeader}>
                <View style={[s.heroIconCircle, { backgroundColor: `${colors.primary}20` }]}>
                  <Scale size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[s.heroTitle, { color: colors.textPrimary }]}>{t('profile.weight', 'Peso')}</Text>
                    {bmiInfo && (
                      <View style={[s.miniPill, { backgroundColor: `${bmiInfo.color}20`, borderColor: `${bmiInfo.color}40` }]}>
                        <Text style={[s.miniPillText, { color: bmiInfo.color }]}>IMC {bmiInfo.value} • {bmiInfo.category}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.heroSub, { color: colors.textMuted }]}>
                    {previousMeasurement?.weight != null
                      ? `${t('profile.lastMeasurement', 'Anterior')}: ${convertMass(previousMeasurement.weight, 'kg', massUnit).toFixed(1)} ${massUnit}`
                      : t('dashboard.tapToUpdate', 'Toca para editar')}
                  </Text>
                </View>

                {/* Change delta badge */}
                {(() => {
                  const change = getChangeFromPrevious('weight');
                  if (change == null) return null;
                  const isGood = isLoss ? change < 0 : isGain ? change > 0 : Math.abs(change) <= 0.2;
                  const badgeColor = isGood ? colors.success : colors.error;
                  return (
                    <View style={[s.deltaBadge, { backgroundColor: `${badgeColor}15` }]}>
                      {change < 0 ? <TrendingDown size={13} color={badgeColor} /> : <TrendingUp size={13} color={badgeColor} />}
                      <Text style={[s.deltaText, { color: badgeColor }]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)} {massUnit}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Main Input Row with Quick Steppers */}
              <View style={s.heroInputRow}>
                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('weight', -0.5, 20, 300)}
                >
                  <Text style={[s.stepperLabel, { color: colors.textSecondary }]}>-0.5</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('weight', -0.1, 20, 300)}
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={[s.valueBox, { backgroundColor: colors.surfaceAlt, borderColor: focusedField === 'weight' ? colors.primary : colors.border }]}>
                  <TextInput
                    style={[s.heroValueInput, { color: colors.textPrimary }]}
                    value={values.weight ?? ''}
                    onFocus={() => setFocusedField('weight')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (values.weight && !isNaN(parseFloat(values.weight))) {
                        setValues(p => ({ ...p, weight: parseFloat(p.weight!).toFixed(1) }));
                      }
                    }}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^0-9.]/g, '');
                      setValues(p => ({ ...p, weight: clean }));
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="--"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    underlineColorAndroid="transparent"
                  />
                  <Text style={[s.heroUnitText, { color: colors.textSecondary }]}>{massUnit}</Text>
                </View>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('weight', 0.1, 20, 300)}
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('weight', 0.5, 20, 300)}
                >
                  <Text style={[s.stepperLabel, { color: colors.textSecondary }]}>+0.5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Body Fat Hero Card */}
            <View style={[
              s.heroCard, 
              { 
                backgroundColor: colors.surface, 
                borderColor: focusedField === 'bodyFat' ? '#10B981' : `${colors.border}80` 
              }
            ]}>
              <View style={s.heroHeader}>
                <View style={[s.heroIconCircle, { backgroundColor: '#10B98120' }]}>
                  <Percent size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[s.heroTitle, { color: colors.textPrimary }]}>{t('profile.bodyFat', 'Grasa Corporal')}</Text>
                    {bodyFatCategory && (
                      <View style={[s.miniPill, { backgroundColor: `${bodyFatCategory.color}20`, borderColor: `${bodyFatCategory.color}40` }]}>
                        <Text style={[s.miniPillText, { color: bodyFatCategory.color }]}>{bodyFatCategory.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.heroSub, { color: colors.textMuted }]}>
                    {previousMeasurement?.bodyFat != null
                      ? `${t('profile.lastMeasurement', 'Anterior')}: ${previousMeasurement.bodyFat}%`
                      : t('dashboard.tapToUpdate', 'Opcional')}
                  </Text>
                </View>

                {/* Change delta */}
                {(() => {
                  const change = getChangeFromPrevious('bodyFat');
                  if (change == null) return null;
                  const isGood = change < 0;
                  const badgeColor = isGood ? colors.success : colors.error;
                  return (
                    <View style={[s.deltaBadge, { backgroundColor: `${badgeColor}15` }]}>
                      {change < 0 ? <TrendingDown size={13} color={badgeColor} /> : <TrendingUp size={13} color={badgeColor} />}
                      <Text style={[s.deltaText, { color: badgeColor }]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Stepper + Input */}
              <View style={s.heroInputRow}>
                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('bodyFat', -0.5, 3, 60)}
                >
                  <Text style={[s.stepperLabel, { color: colors.textSecondary }]}>-0.5</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('bodyFat', -0.1, 3, 60)}
                >
                  <Minus size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={[s.valueBox, { backgroundColor: colors.surfaceAlt, borderColor: focusedField === 'bodyFat' ? '#10B981' : colors.border }]}>
                  <TextInput
                    style={[s.heroValueInput, { color: colors.textPrimary }]}
                    value={values.bodyFat ?? ''}
                    onFocus={() => setFocusedField('bodyFat')}
                    onBlur={() => {
                      setFocusedField(null);
                      if (values.bodyFat && !isNaN(parseFloat(values.bodyFat))) {
                        setValues(p => ({ ...p, bodyFat: parseFloat(p.bodyFat!).toFixed(1) }));
                      }
                    }}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^0-9.]/g, '');
                      setValues(p => ({ ...p, bodyFat: clean }));
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="--"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    underlineColorAndroid="transparent"
                  />
                  <Text style={[s.heroUnitText, { color: colors.textSecondary }]}>%</Text>
                </View>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('bodyFat', 0.1, 3, 60)}
                >
                  <Plus size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.stepperBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => handleStepAdjust('bodyFat', 0.5, 3, 60)}
                >
                  <Text style={[s.stepperLabel, { color: colors.textSecondary }]}>+0.5</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── MEDIDAS POR ZONA: TORSO Y TRONCO ── */}
          <View style={s.categorySection}>
            <View style={s.sectionHeaderRow}>
              <Activity size={18} color={colors.primary} />
              <Text style={[s.sectionHeading, { color: colors.textPrimary }]}>
                {t('profile.torsoMeasurements', 'Torso y Tronco')}
              </Text>
              <Text style={[s.sectionUnitPill, { color: colors.textMuted }]}>{lengthUnit}</Text>
            </View>

            {TORSO_FIELDS.map((field) => {
              const change = getChangeFromPrevious(field.key);
              const prevVal = previousMeasurement?.[field.key] as number | undefined;
              const isFocused = focusedField === field.key;
              const IconComp = field.icon;

              return (
                <View 
                  key={field.key} 
                  style={[
                    s.partCard, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: isFocused ? field.color : `${colors.border}70` 
                    }
                  ]}
                >
                  <View style={s.partLeft}>
                    <View style={[s.partIconWrap, { backgroundColor: `${field.color}15` }]}>
                      <IconComp size={18} color={field.color} />
                    </View>
                    <View>
                      <Text style={[s.partTitle, { color: colors.textPrimary }]}>
                        {t(field.label, field.defaultLabel)}
                      </Text>
                      {prevVal != null ? (
                        <Text style={[s.partPrev, { color: colors.textMuted }]}>
                          {t('profile.lastMeasurement', 'Anterior')}: {convertLength(prevVal, 'cm', lengthUnit).toFixed(1)} {lengthUnit}
                        </Text>
                      ) : (
                        <Text style={[s.partPrev, { color: colors.textMuted }]}>Sin registro previo</Text>
                      )}
                    </View>
                  </View>

                  <View style={s.partRight}>
                    {change !== null && (
                      <Text style={[s.partDelta, { color: change < 0 ? colors.success : colors.error }]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </Text>
                    )}

                    <TouchableOpacity 
                      style={[s.partStepBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                      onPress={() => handleStepAdjust(field.key, -0.5, 5, 250)}
                    >
                      <Minus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        s.partInput, 
                        { 
                          backgroundColor: colors.surfaceAlt, 
                          color: colors.textPrimary, 
                          borderColor: isFocused ? field.color : colors.border 
                        }
                      ]}
                      value={values[field.key] ?? ''}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => {
                        setFocusedField(null);
                        const cur = values[field.key];
                        if (cur && !isNaN(parseFloat(cur))) {
                          setValues(p => ({ ...p, [field.key]: parseFloat(cur).toFixed(1) }));
                        }
                      }}
                      onChangeText={(v) => {
                        const clean = v.replace(/[^0-9.]/g, '');
                        setValues(p => ({ ...p, [field.key]: clean }));
                      }}
                      placeholder="--"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={5}
                      selectTextOnFocus
                      underlineColorAndroid="transparent"
                    />

                    <TouchableOpacity 
                      style={[s.partStepBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                      onPress={() => handleStepAdjust(field.key, 0.5, 5, 250)}
                    >
                      <Plus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── MEDIDAS POR ZONA: EXTREMIDADES ── */}
          <View style={s.categorySection}>
            <View style={s.sectionHeaderRow}>
              <Dumbbell size={18} color="#F59E0B" />
              <Text style={[s.sectionHeading, { color: colors.textPrimary }]}>
                {t('profile.limbsMeasurements', 'Extremidades')}
              </Text>
              <Text style={[s.sectionUnitPill, { color: colors.textMuted }]}>{lengthUnit}</Text>
            </View>

            {LIMB_FIELDS.map((field) => {
              const change = getChangeFromPrevious(field.key);
              const prevVal = previousMeasurement?.[field.key] as number | undefined;
              const isFocused = focusedField === field.key;
              const IconComp = field.icon;

              return (
                <View 
                  key={field.key} 
                  style={[
                    s.partCard, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: isFocused ? field.color : `${colors.border}70` 
                    }
                  ]}
                >
                  <View style={s.partLeft}>
                    <View style={[s.partIconWrap, { backgroundColor: `${field.color}15` }]}>
                      <IconComp size={18} color={field.color} />
                    </View>
                    <View>
                      <Text style={[s.partTitle, { color: colors.textPrimary }]}>
                        {t(field.label, field.defaultLabel)}
                      </Text>
                      {prevVal != null ? (
                        <Text style={[s.partPrev, { color: colors.textMuted }]}>
                          {t('profile.lastMeasurement', 'Anterior')}: {convertLength(prevVal, 'cm', lengthUnit).toFixed(1)} {lengthUnit}
                        </Text>
                      ) : (
                        <Text style={[s.partPrev, { color: colors.textMuted }]}>Sin registro previo</Text>
                      )}
                    </View>
                  </View>

                  <View style={s.partRight}>
                    {change !== null && (
                      <Text style={[s.partDelta, { color: change < 0 ? colors.success : colors.error }]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </Text>
                    )}

                    <TouchableOpacity 
                      style={[s.partStepBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                      onPress={() => handleStepAdjust(field.key, -0.5, 5, 200)}
                    >
                      <Minus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        s.partInput, 
                        { 
                          backgroundColor: colors.surfaceAlt, 
                          color: colors.textPrimary, 
                          borderColor: isFocused ? field.color : colors.border 
                        }
                      ]}
                      value={values[field.key] ?? ''}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => {
                        setFocusedField(null);
                        const cur = values[field.key];
                        if (cur && !isNaN(parseFloat(cur))) {
                          setValues(p => ({ ...p, [field.key]: parseFloat(cur).toFixed(1) }));
                        }
                      }}
                      onChangeText={(v) => {
                        const clean = v.replace(/[^0-9.]/g, '');
                        setValues(p => ({ ...p, [field.key]: clean }));
                      }}
                      placeholder="--"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={5}
                      selectTextOnFocus
                      underlineColorAndroid="transparent"
                    />

                    <TouchableOpacity 
                      style={[s.partStepBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                      onPress={() => handleStepAdjust(field.key, 0.5, 5, 200)}
                    >
                      <Plus size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── HISTORIAL DE MEDICIONES RECIENTES ── */}
          {measurements.length > 0 && (
            <View style={s.historySection}>
              <View style={s.sectionHeaderRow}>
                <History size={18} color={colors.textPrimary} />
                <Text style={[s.sectionHeading, { color: colors.textPrimary }]}>
                  {t('profile.recentHistory', 'Historial Reciente')}
                </Text>
                <Text style={[s.sectionUnitPill, { color: colors.textMuted }]}>
                  {measurements.length} {measurements.length === 1 ? 'registro' : 'registros'}
                </Text>
              </View>

              <View style={[s.historyCard, { backgroundColor: colors.surface, borderColor: `${colors.border}80` }]}>
                {measurements.slice(0, 7).map((m, idx) => {
                  const isSelectedDate = m.date === activeDate;
                  const partsCount = ALL_OTHER_FIELDS.filter(f => m[f.key] != null).length;

                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveDate(m.date);
                      }}
                      style={[
                        s.historyRow,
                        idx !== 0 && { borderTopColor: `${colors.border}50`, borderTopWidth: 1 },
                        isSelectedDate && { backgroundColor: `${colors.primary}12` }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[s.historyDate, { color: isSelectedDate ? colors.primary : colors.textPrimary }]}>
                            {m.date === getLocalDateString() ? `${t('tracker.today', 'Hoy')} (${m.date})` : m.date}
                          </Text>
                          {isSelectedDate && (
                            <View style={[s.activePill, { backgroundColor: colors.primary }]}>
                              <Text style={s.activePillText}>Activo</Text>
                            </View>
                          )}
                        </View>
                        {partsCount > 0 && (
                          <Text style={[s.historySub, { color: colors.textMuted }]}>
                            {partsCount} {partsCount === 1 ? 'medida corporal' : 'medidas corporales'}
                          </Text>
                        )}
                      </View>

                      <View style={s.historyStats}>
                        {m.weight != null && (
                          <View style={[s.historyStatBadge, { backgroundColor: `${colors.primary}15` }]}>
                            <Scale size={12} color={colors.primary} />
                            <Text style={[s.historyStatText, { color: colors.primary }]}>
                              {convertMass(m.weight, 'kg', massUnit).toFixed(1)} {massUnit}
                            </Text>
                          </View>
                        )}

                        {m.bodyFat != null && (
                          <View style={[s.historyStatBadge, { backgroundColor: '#10B98115' }]}>
                            <Percent size={12} color="#10B981" />
                            <Text style={[s.historyStatText, { color: '#10B981' }]}>
                              {m.bodyFat}%
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={s.trashBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => handleDeleteMeasurement(m.id, m.date)}
                        >
                          <Trash2 size={15} color={colors.error} opacity={0.8} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.base, 
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm 
  },
  closeBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  saveBtn: { 
    borderRadius: Radius.lg, 
    overflow: 'hidden', 
    elevation: 3, 
    shadowColor: '#8B5CF6', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 5 
  },
  saveGrad: { paddingHorizontal: 20, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Date Bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    marginTop: 4,
    marginBottom: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePillText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  resetTodayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetTodayText: {
    fontSize: 11,
    fontWeight: '800',
  },

  content: { padding: Spacing.base, paddingTop: 4 },

  // Goal Card
  goalCard: {
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTypeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  goalTargetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  goalTargetLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalTargetVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  goalDeltaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  goalDeltaText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Hero Cards
  heroSection: {
    gap: 12,
    marginBottom: Spacing.xl,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  valueBox: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  heroValueInput: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    padding: 0,
    minWidth: 70,
  },
  heroUnitText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Category Sections
  categorySection: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    flex: 1,
  },
  sectionUnitPill: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Body Part Card
  partCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  partLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  partIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  partPrev: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  partRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partDelta: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  partStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  partInput: {
    width: 58,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
  },

  // History Section
  historySection: {
    marginTop: Spacing.sm,
  },
  historyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '800',
  },
  historySub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  activePillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trashBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
