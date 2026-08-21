import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft, AlertCircle
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
import { STEPS, Step, OnboardingData, FOOD_CATEGORIES } from '../components/onboarding/constants';

// ─── Main Onboarding Screen ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { theme } = useSettingsStore();
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
  const { setProfile, profile }       = useAuthStore();
  const { setMassUnit, setLengthUnit, setPremiumColor } = useSettingsStore();

  useEffect(() => {
    setPremiumColor(null);
  }, []);

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

  const updateData = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const canProceed = () => {
    if (stepId === 'goal')     return !!data.goal;
    if (stepId === 'stats') {
      const sexOk = !!data.sex && (data.sex !== 'other' || !!data.customGender);
      return sexOk && !!data.age && !!data.weight && !!data.height;
    }
    if (stepId === 'activity') return !!data.activityLevel;
    if (stepId === 'lifestyle') return !!data.lifestyle;
    if (stepId === 'dietaryRestrictions') return !!data.dietaryRestrictions;
    if (stepId === 'medicalConditions') return !!data.medicalConditions;
    if (stepId === 'medications') return !!data.medicationsSupplements;
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

      const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, d.goal);
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
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      Alert.alert(t('common.error'), t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const stepComponents: Record<Step, React.ReactNode> = {
    goal:     <GoalStep     value={data} onChange={updateData} />,
    stats:    <StatsStep    value={data} onChange={updateData} />,
    activity: <ActivityStep value={data} onChange={updateData} />,
    lifestyle: <LifestyleStep value={data} onChange={updateData} />,
    dietaryRestrictions: <DietaryRestrictionsStep value={data} onChange={updateData} />,
    medicalConditions:   <MedicalConditionsStep value={data} onChange={updateData} />,
    medications:         <MedicationsStep value={data} onChange={updateData} />,
    dietType: <DietTypeStep value={data} onChange={updateData} />,
    diet:     <DietStep     value={data} onChange={updateData} />,
    personalization: <PersonalizationStep value={data} onChange={updateData} />,
    terms: <TermsStep value={data} onChange={updateData} />,
    projection: <ProjectionStep value={data} onChange={updateData} />,
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
            <TouchableOpacity style={s.backIconBtn} onPress={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}

          <View style={s.progressWrap}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[s.progressSegment, { backgroundColor: colors.border }, i <= currentStep && { backgroundColor: colors.primary }]}
              />
            ))}
          </View>

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {stepComponents[stepId]}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, !canProceed() && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.primary, '#4338CA']} style={s.nextGrad}>
            {saving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.nextText}>{currentStep === STEPS.length - 1 ? t('onboarding.creatingPlan', 'Creating plan...') : t('common.loading', 'Loading...')}</Text>
              </View>
            ) : (
              <View style={s.nextContent}>
                <Text style={s.nextText}>
                {currentStep === STEPS.length - 1 ? t('onboarding.createPlan') : t('onboarding.continue')}
              </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:                 { flex: 1 },
  header:               { paddingTop: 14, paddingHorizontal: Spacing.base, paddingBottom: 10 },
  headerTop:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backIconBtn:          {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  progressWrap:         { flex: 1, flexDirection: 'row', gap: 5 },
  progressSegment:      {
    flex: 1,
    height: 5,
    borderRadius: 4,
  },
  scroll:               { flex: 1 },
  content:              { padding: Spacing.base, paddingTop: 32, paddingBottom: 40 },
  footer:               { padding: Spacing.base, paddingBottom: 32 },
  nextBtn:              {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14
  },
  nextBtnDisabled:      { opacity: 0.45 },
  nextGrad:             { padding: 19, alignItems: 'center' },
  nextContent:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextText:             { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.4 },
  exitBtnSmall:         { padding: 4 },
  exitText:             { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
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
