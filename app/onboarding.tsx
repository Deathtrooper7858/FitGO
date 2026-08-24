import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft, AlertCircle, ArrowRight, ShieldCheck
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Spacing } from '../constants';
import {
  useAuthStore, useSettingsStore, useNutritionStore,
  useCoachStore, useBodyStore, useRecipesStore
} from '../store';
import { useTheme } from '../hooks/useTheme';
import { calculateTDEE, calculateMacros } from '../services/foodDatabase';
import { supabase } from '../services/supabase';
import { CustomAlert, AlertType } from '../components/CustomAlert';
import {
  GoalStep, StatsStep, ActivityStep, LifestyleStep,
  DietaryRestrictionsStep, MedicalConditionsStep, MedicationsStep,
  DietTypeStep, DietStep, PersonalizationStep, TermsStep, ProjectionStep
} from '../components/onboarding';
import { STEPS, OnboardingData, FOOD_CATEGORIES } from '../components/onboarding/constants';

// ─── Main Onboarding Screen ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData]               = useState<Partial<OnboardingData>>({
    availableFoods: [],
    age: 25,
    weight: 70,
    height: 170,
    dietType: 'recommended',
    targetWeight: 65,
    velocity: 'moderate',
    weightUnit: 'kg',
    heightUnit: 'cm'
  });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const { setProfile }              = useAuthStore();
  const { setMassUnit, setLengthUnit, setPremiumColor } = useSettingsStore();

  useEffect(() => {
    setPremiumColor(null);
  }, [setPremiumColor]);

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
      onCancel: () => {
        onCancel?.();
        setAlert(prev => ({ ...prev, visible: false }));
      },
    });
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    useCoachStore.getState().resetAll();
    useBodyStore.getState().reset();
    useRecipesStore.getState().reset();
  }, []);

  const stepId = STEPS[currentStep];

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const canProceed = () => {
    if (stepId === 'goal')     return !!data.goal;
    if (stepId === 'stats') {
      const sexOk = !!data.sex && (data.sex !== 'other' || !!data.customGender);
      return sexOk && !!data.age && !!data.weight && !!data.height;
    }
    if (stepId === 'activity') return !!data.activityLevel;
    if (stepId === 'lifestyle') return !!data.lifestyle;
    if (stepId === 'dietaryRestrictions') return true; // optional step
    if (stepId === 'medicalConditions') return true;
    if (stepId === 'medications') return true;
    if (stepId === 'dietType') return !!data.dietType;
    if (stepId === 'diet') {
      const cur = data.availableFoods ?? [];
      for (const cat of FOOD_CATEGORIES) {
        const selectedInCategory = cat.items.filter(item => cur.includes(item.id));
        if (selectedInCategory.length < cat.min) return false;
      }
      return true;
    }
    if (stepId === 'personalization') return !!data.targetWeight && !!data.velocity;
    if (stepId === 'terms') return !!data.termsAccepted;
    return true;
  };

  const handleNext = () => {
    if (stepId === 'diet') {
      const cur = data.availableFoods ?? [];
      for (const cat of FOOD_CATEGORIES) {
        const selectedInCategory = cat.items.filter(item => cur.includes(item.id));
        if (selectedInCategory.length < cat.min) {
          setError(t('onboarding.validationFoodMin', {
            category: t(`onboarding.${cat.title}`),
            min: cat.min
          }));
          return;
        }
      }
    }

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

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const d = data as OnboardingData;
      const isLbs = d.weightUnit === 'lbs';
      const isFt = d.heightUnit === 'ft';
      const wKg = isLbs ? Math.round(d.weight / 2.20462) : d.weight;
      const tKg = isLbs ? Math.round(d.targetWeight / 2.20462) : d.targetWeight;
      const hCm = isFt ? Math.round(d.height * 30.48) : d.height;

      const { tdee } = calculateTDEE({
        weight: wKg, height: hCm,
        age: d.age, sex: d.sex,
        activityLevel: d.activityLevel,
        lifestyleLevel: d.lifestyle,
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

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        showAlert('error', t('common.error'), t('profile.userIdNotFound'));
        router.replace('/(auth)/welcome');
        return;
      }

      const profileData = {
        id:             authData.user.id,
        name:           authData.user.user_metadata?.full_name ?? '',
        email:          authData.user.email ?? '',
        sex:            d.sex,
        age:            d.age,
        weight:         wKg,
        height:         hCm,
        activityLevel:  d.activityLevel,
        goal:           d.goal,
        tdee,
        targetCalories,
        macros:         { protein: finalProtein, carbs: finalCarbs, fat: finalFat },
        targetWeight:   tKg,
        startingWeight: wKg,
        availableFoods: d.availableFoods,
        preferences:    [d.dietType, d.velocity],
        isPro:          false,
        role:           'user' as const,
        onboardingDone: true,
        dietaryRestrictions: d.dietaryRestrictions ?? [],
        medicalConditions: d.medicalConditions ?? [],
        medicationsSupplements: d.medicationsSupplements ?? [],
        lifestyle:      d.lifestyle,
        customGender:   d.customGender,
      };

      const { error: upsertError } = await supabase.from('users').upsert({
        id:               profileData.id,
        email:            profileData.email,
        name:             profileData.name,
        sex:              profileData.sex,
        age:              profileData.age,
        weight:           profileData.weight,
        height:           profileData.height,
        activity_level:   profileData.activityLevel,
        goal:             profileData.goal,
        target_weight:    profileData.targetWeight,
        tdee:             profileData.tdee,
        target_calories:  profileData.targetCalories,
        starting_weight:  profileData.startingWeight,
        macros:           profileData.macros,
        available_foods:  profileData.availableFoods,
        preferences:      profileData.preferences,
        is_pro:           profileData.isPro,
        onboarding_done:  profileData.onboardingDone,
        dietary_restrictions: profileData.dietaryRestrictions,
        medical_conditions: profileData.medicalConditions,
        medications_supplements: profileData.medicationsSupplements,
        lifestyle:        profileData.lifestyle,
        lifestyle_level:  profileData.lifestyle,
        updated_at:       new Date().toISOString(),
      });

      if (upsertError) throw upsertError;

      setMassUnit(isLbs ? 'lb' : 'kg');
      setLengthUnit(isFt ? 'ft' : 'cm');

      setProfile(profileData);
      router.replace('/(tabs)/tracker');
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      Alert.alert(t('common.error'), t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Only render the ACTIVE step — never instantiate all 12 at once
  const activeStepComponent = useMemo(() => {
    const props = { value: data, onChange: updateData };
    switch (stepId) {
      case 'goal':                 return <GoalStep                {...props} />;
      case 'stats':                return <StatsStep               {...props} />;
      case 'activity':             return <ActivityStep            {...props} />;
      case 'lifestyle':            return <LifestyleStep           {...props} />;
      case 'dietaryRestrictions':  return <DietaryRestrictionsStep {...props} />;
      case 'medicalConditions':    return <MedicalConditionsStep   {...props} />;
      case 'medications':          return <MedicationsStep         {...props} />;
      case 'dietType':             return <DietTypeStep            {...props} />;
      case 'diet':                 return <DietStep                {...props} />;
      case 'personalization':      return <PersonalizationStep     {...props} />;
      case 'terms':                return <TermsStep               {...props} />;
      case 'projection':           return <ProjectionStep          {...props} />;
      default:                     return null;
    }
  }, [stepId, data, updateData]);

  const getFooterSecurityText = () => {
    if (currentStep === 0) {
      return t('onboarding.securityGoal', 'Your data is secure and protected.');
    }
    if (currentStep >= 1 && currentStep <= 3) {
      return t('onboarding.securityStats', 'Your information stays private. You can update or remove your information anytime.');
    }
    if (currentStep === 4) {
      return t('onboarding.securityDiet', 'You can change this later');
    }
    return t('onboarding.securityGeneral', 'Your data is encrypted and completely private.');
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
      {error && (
        <View style={s.errorContainer}>
          <LinearGradient
            colors={[colors.error + 'EE', colors.error]}
            style={s.errorGradient}
          >
            <AlertCircle size={22} color="#FFF" />
            <Text style={s.errorText}>{error}</Text>
          </LinearGradient>
        </View>
      )}

      <View style={s.header}>
        <View style={s.headerTop}>
          {currentStep > 0 ? (
            <TouchableOpacity
              style={[s.backIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setCurrentStep((s) => s - 1)}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}

          <View style={s.progressWrap}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressSegment,
                  { backgroundColor: colors.border + '60' },
                  i <= currentStep && { backgroundColor: '#8B5CF6' }
                ]}
              />
            ))}
          </View>

          <Text style={s.stepCountText}>
            {`${currentStep + 1} of ${STEPS.length}`}
          </Text>

          <TouchableOpacity
            style={s.exitBtnSmall}
            onPress={async () => {
              useNutritionStore.getState().reset();
              useCoachStore.getState().resetAll();
              useBodyStore.getState().reset();
              useRecipesStore.getState().reset();

              await supabase.auth.signOut();
              setProfile(null);
              router.replace('/(auth)/welcome');
            }}
          >
            <Text style={[s.exitText, { color: colors.textMuted }]}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeStepComponent}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, !canProceed() && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#7C5CFC', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextGrad}>
            {saving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.nextText}>
                  {currentStep === STEPS.length - 1 ? t('onboarding.creatingPlan', 'Creating plan...') : t('common.loading', 'Loading...')}
                </Text>
              </View>
            ) : (
              <View style={s.nextContent}>
                <Text style={s.nextText}>
                  {currentStep === STEPS.length - 1 ? t('onboarding.createPlan') : t('onboarding.continue', 'Continue')}
                </Text>
                <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Security & Privacy footnote */}
        <View style={s.securityRow}>
          <ShieldCheck size={16} color="#10B981" />
          <Text style={[s.securityText, { color: colors.textSecondary }]}>
            {getFooterSecurityText()}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:                 { flex: 1 },
  header:               { paddingTop: 12, paddingHorizontal: Spacing.base, paddingBottom: 10 },
  headerTop:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backIconBtn:          {
    width: 42, height: 42,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
  },
  progressWrap:         { flex: 1, flexDirection: 'row', gap: 4 },
  progressSegment:      {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
  },
  stepCountText:        {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B5CF6',
    marginRight: 4,
  },
  scroll:               { flex: 1 },
  content:              { padding: Spacing.base, paddingTop: 16, paddingBottom: 32 },
  footer:               { paddingHorizontal: Spacing.base, paddingBottom: 24, gap: 14 },
  nextBtn:              {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14
  },
  nextBtnDisabled:      { opacity: 0.45 },
  nextGrad:             { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  nextContent:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextText:             { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
  exitBtnSmall:         { paddingVertical: 6, paddingHorizontal: 4 },
  exitText:             { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  securityRow:          {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  securityText:         {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  errorContainer:       {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  errorGradient:        {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12
  },
  errorText:            { color: '#FFF', fontSize: 14, fontWeight: '700', flex: 1 },
});
