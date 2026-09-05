import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, X, ArrowRight, Check, AlertCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { Spacing } from '../constants';
import { useAuthStore, useSettingsStore, useNutritionStore, useBodyStore, UserProfile } from '../store';
import { calculateTDEE, calculateMacros } from '../services/foodDatabase';
import { supabase } from '../services/supabase';
import { getLocalDateString } from '../utils/date';
import { CustomAlert, AlertType } from './CustomAlert';

import {
  GoalStep,
  StatsStep,
  ActivityStep,
  LifestyleStep,
  DietTypeStep,
  PersonalizationStep,
  ProjectionStep,
} from './onboarding';
import { OnboardingData } from './onboarding/constants';

export const ACTIVITY_TO_EXERCISE: Record<string, string> = {
  'sedentary':   'none',
  'light':       '1-2',
  'moderate':    '3-4',
  'active':      '5-6',
  'very_active': 'daily',
};

const WIZARD_STEPS = [
  'goal',
  'stats',
  'activity',
  'lifestyle',
  'dietType',
  'personalization',
  'projection',
] as const;

interface GoalWizardModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export function GoalWizardModal({ visible, onClose, onSave, initialData }: GoalWizardModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const massUnit = useSettingsStore(s => s.massUnit) || 'kg';
  const lengthUnit = useSettingsStore(s => s.lengthUnit) || 'cm';
  const setMassUnit = useSettingsStore(s => s.setMassUnit);
  const setLengthUnit = useSettingsStore(s => s.setLengthUnit);
  const latestMeasurement = useBodyStore(s => s.latest());

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => {
        onConfirm?.();
        setAlert(prev => ({ ...prev, visible: false }));
      },
    });
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // When opening modal, initialize data from initialData or current profile and measurement state
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setError(null);

      const isLbs = massUnit === 'lb';
      const isFt = lengthUnit === 'ft';
      const currentW = initialData?.weight ?? latestMeasurement?.weight ?? profile?.weight ?? 70;
      const targetW = initialData?.targetWeight ?? profile?.targetWeight ?? currentW;
      const currentH = initialData?.height ?? profile?.height ?? 170;

      setData({
        goal: initialData?.goal ?? profile?.goal ?? 'maintain',
        sex: initialData?.sex ?? profile?.sex ?? 'male',
        customGender: initialData?.customGender ?? profile?.customGender,
        age: initialData?.age ?? profile?.age ?? 25,
        weight: isLbs ? Math.round(currentW * 2.20462) : Math.round(currentW * 10) / 10,
        height: isFt ? parseFloat((currentH / 30.48).toFixed(1)) : Math.round(currentH),
        weightUnit: isLbs ? 'lbs' : 'kg',
        heightUnit: isFt ? 'ft' : 'cm',
        activityLevel: initialData?.activityLevel ?? profile?.activityLevel ?? 'moderate',
        lifestyle: initialData?.lifestyle ?? profile?.lifestyle ?? 'standing_sometimes',
        dietType: initialData?.dietType ?? profile?.dietType ?? (profile?.preferences?.[0] as any) ?? 'recommended',
        targetWeight: isLbs ? Math.round(targetW * 2.20462) : Math.round(targetW * 10) / 10,
        velocity: (profile?.preferences?.[1] as any) ?? 'moderate',
        dietaryRestrictions: profile?.dietaryRestrictions ?? [],
        medicalConditions: profile?.medicalConditions ?? [],
        medicationsSupplements: profile?.medicationsSupplements ?? [],
        availableFoods: profile?.availableFoods ?? [],
      });
    }
  }, [visible, initialData, profile, latestMeasurement, massUnit, lengthUnit]);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const stepId = WIZARD_STEPS[currentStep];

  const canProceed = useMemo(() => {
    if (stepId === 'goal') return !!data.goal;
    if (stepId === 'stats') {
      const sexOk = !!data.sex && (data.sex !== 'other' || !!data.customGender);
      return sexOk && !!data.age && !!data.weight && !!data.height;
    }
    if (stepId === 'activity') return !!data.activityLevel;
    if (stepId === 'lifestyle') return !!data.lifestyle;
    if (stepId === 'dietType') return !!data.dietType;
    if (stepId === 'personalization') return !!data.targetWeight && !!data.velocity;
    if (stepId === 'projection') return true;
    return true;
  }, [stepId, data]);

  const handleNext = () => {
    if (stepId === 'personalization') {
      const curWeight = data.weight ?? 0;
      const tarWeight = data.targetWeight ?? curWeight;

      if (data.goal === 'lose' && tarWeight >= curWeight) {
        setError(t('profile.loseWeightValidation', 'Target weight must be less than current weight'));
        return;
      }
      if (data.goal === 'gain' && tarWeight <= curWeight) {
        setError(t('profile.gainWeightValidation', 'Target weight must be greater than current weight'));
        return;
      }
      if (data.goal === 'maintain' && tarWeight !== curWeight) {
        updateData({ targetWeight: curWeight });
      }
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(s => s - 1);
    } else {
      onClose();
    }
  };

  const handleComplete = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const d = data as OnboardingData;
      const isLbs = d.weightUnit === 'lbs';
      const isFt = d.heightUnit === 'ft';
      const wKg = isLbs ? Math.round(d.weight / 2.20462) : (d.weight ?? profile.weight);
      const tKg = isLbs ? Math.round(d.targetWeight / 2.20462) : (d.targetWeight ?? profile.targetWeight ?? wKg);
      const hCm = isFt ? Math.round(d.height * 30.48) : (d.height ?? profile.height);

      const finalActivityLevel = d.activityLevel || profile.activityLevel || 'moderate';
      const finalLifestyle = d.lifestyle || profile.lifestyle || 'standing_sometimes';

      const { tdee } = calculateTDEE({
        weight: wKg,
        height: hCm,
        age: d.age || profile.age || 25,
        sex: d.sex || profile.sex || 'male',
        activityLevel: finalActivityLevel,
        lifestyleLevel: finalLifestyle,
      });

      let macroRatio = { protein: 0.3, carbs: 0.4, fat: 0.3 };
      if (d.dietType === 'high_protein') macroRatio = { protein: 0.4, carbs: 0.3, fat: 0.3 };
      if (d.dietType === 'low_carb')     macroRatio = { protein: 0.35, carbs: 0.15, fat: 0.5 };
      if (d.dietType === 'keto')         macroRatio = { protein: 0.25, carbs: 0.05, fat: 0.7 };
      if (d.dietType === 'low_fat')      macroRatio = { protein: 0.3, carbs: 0.55, fat: 0.15 };

      const { targetCalories } = calculateMacros(tdee, d.goal);
      const finalProtein = Math.round((targetCalories * macroRatio.protein) / 4);
      const finalCarbs = Math.round((targetCalories * macroRatio.carbs) / 4);
      const finalFat = Math.round((targetCalories * macroRatio.fat) / 9);

      const newStartingWeight = (profile.goal !== d.goal)
        ? wKg
        : (profile.startingWeight || profile.weight || wKg);

      const dbUpdates: Record<string, any> = {
        weight: wKg,
        target_weight: tKg,
        starting_weight: newStartingWeight,
        goal: d.goal,
        activity_level: finalActivityLevel,
        lifestyle: finalLifestyle,
        lifestyle_level: finalLifestyle,
        diet_type: d.dietType,
        age: d.age || profile.age,
        sex: d.sex || profile.sex,
        height: hCm,
        tdee,
        target_calories: targetCalories,
        macros: { protein: finalProtein, carbs: finalCarbs, fat: finalFat },
        preferences: [d.dietType, d.velocity || 'moderate'],
        updated_at: new Date().toISOString(),
      };

      if (d.customGender !== undefined) {
        dbUpdates.custom_gender = d.customGender;
      }

      // NOTE: Do NOT include exercise_level in users table!
      const { error: dbError } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', profile.id);

      if (dbError) throw dbError;

      // Update units
      setMassUnit(isLbs ? 'lb' : 'kg');
      setLengthUnit(isFt ? 'ft' : 'cm');

      // Record body measurement for current date
      const { addMeasurement } = useBodyStore.getState();
      await addMeasurement({
        id: `bm-${Date.now()}`,
        date: getLocalDateString(),
        weight: wKg,
      });

      // Update Auth Profile
      const updatedProfile: UserProfile = {
        ...profile,
        weight: wKg,
        targetWeight: tKg,
        startingWeight: newStartingWeight,
        goal: d.goal,
        activityLevel: finalActivityLevel,
        lifestyle: finalLifestyle,
        dietType: d.dietType,
        age: d.age || profile.age,
        sex: d.sex || profile.sex,
        height: hCm,
        tdee,
        targetCalories,
        macros: { protein: finalProtein, carbs: finalCarbs, fat: finalFat },
        preferences: [d.dietType, d.velocity || 'moderate'],
        customGender: d.customGender !== undefined ? d.customGender : profile.customGender,
      };
      setProfile(updatedProfile);

      // Update Nutrition store
      const { setNeat, setExerciseLevel } = useNutritionStore.getState();
      setNeat(finalLifestyle);
      setExerciseLevel(ACTIVITY_TO_EXERCISE[finalActivityLevel] || 'none');

      // Notify external caller if provided
      onSave?.(updatedProfile);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('success', t('common.success', 'Éxito'), t('profile.updateSuccess', 'Objetivos actualizados correctamente.'), () => {
        onClose();
      });
    } catch (err: any) {
      console.error('[GoalWizardModal] Error updating goals:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('error', t('common.error', 'Error'), t('profile.updateFailed', 'Error al actualizar tu cuenta.'));
    } finally {
      setSaving(false);
    }
  };

  const activeStepComponent = useMemo(() => {
    switch (stepId) {
      case 'goal':
        return <GoalStep value={data} onChange={updateData} />;
      case 'stats':
        return <StatsStep value={data} onChange={updateData} />;
      case 'activity':
        return <ActivityStep value={data} onChange={updateData} />;
      case 'lifestyle':
        return <LifestyleStep value={data} onChange={updateData} />;
      case 'dietType':
        return <DietTypeStep value={data} onChange={updateData} />;
      case 'personalization':
        return <PersonalizationStep value={data} onChange={updateData} />;
      case 'projection':
        return <ProjectionStep value={data} onChange={updateData} />;
      default:
        return null;
    }
  }, [stepId, data, updateData]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[wm.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          confirmText={alert.confirmText}
          onConfirm={alert.onConfirm}
        />

        {error && (
          <View style={wm.errorContainer}>
            <LinearGradient
              colors={[colors.error + 'EE', colors.error]}
              style={wm.errorGradient}
            >
              <AlertCircle size={20} color="#FFF" />
              <Text style={wm.errorText}>{error}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Header */}
        <View style={wm.header}>
          <View style={wm.headerTop}>
            <TouchableOpacity
              style={[wm.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={wm.progressWrap}>
              {WIZARD_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    wm.progressSegment,
                    { backgroundColor: colors.border + '60' },
                    i <= currentStep && { backgroundColor: '#8B5CF6' }
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[wm.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={wm.stepCounterRow}>
            <Text style={[wm.stepCountText, { color: colors.textMuted }]}>
              {`${t('common.step', 'Paso')} ${currentStep + 1} / ${WIZARD_STEPS.length}`}
            </Text>
          </View>
        </View>

        {/* Step Body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={wm.scroll}
            contentContainerStyle={wm.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeStepComponent}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[wm.footer, { borderTopColor: colors.border + '20', backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[wm.nextBtn, (!canProceed || saving) && wm.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed || saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canProceed ? ['#7C5CFC', '#4F46E5'] : [colors.border, colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={wm.nextGrad}
            >
              {saving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={wm.nextText}>{t('common.loading', 'Cargando...')}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Text style={wm.nextText}>
                    {currentStep === WIZARD_STEPS.length - 1
                      ? t('profile.updateGoals', 'Actualizar objetivos')
                      : t('common.next', 'Siguiente')}
                  </Text>
                  {currentStep === WIZARD_STEPS.length - 1 ? (
                    <Check size={20} color="#fff" />
                  ) : (
                    <ArrowRight size={20} color="#fff" />
                  )}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const wm = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? Spacing.sm : 0,
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  progressWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 5,
    alignItems: 'center',
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepCounterRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'] + 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  nextBtn: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  nextBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 999,
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
